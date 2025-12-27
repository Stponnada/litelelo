-- =====================================================
-- E2EE (End-to-End Encryption) Database Migration
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Create user_encryption_keys table for storing PIN-encrypted keys
CREATE TABLE IF NOT EXISTS "public"."user_encryption_keys" (
    "user_id" uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    "encrypted_key_blob" text NOT NULL,         -- Base64-encoded encrypted key
    "salt" text NOT NULL,                        -- Argon2 salt (Base64)
    "key_version" integer DEFAULT 1 NOT NULL,   -- For future PIN changes
    "hint" text,                                 -- Optional hint for forgotten PIN
    "failed_attempts" integer DEFAULT 0 NOT NULL, -- Rate limiting
    "locked_until" timestamptz,                  -- Account lockout timestamp
    "created_at" timestamptz DEFAULT now() NOT NULL,
    "updated_at" timestamptz DEFAULT now() NOT NULL
);

-- Add comments
COMMENT ON TABLE "public"."user_encryption_keys" IS 'Stores PIN-encrypted encryption keys for E2EE chat';
COMMENT ON COLUMN "public"."user_encryption_keys"."encrypted_key_blob" IS 'Base64-encoded encryption key, encrypted with PIN-derived key';
COMMENT ON COLUMN "public"."user_encryption_keys"."salt" IS 'Argon2id salt used for PIN key derivation (Base64)';
COMMENT ON COLUMN "public"."user_encryption_keys"."hint" IS 'Optional user-provided hint for forgotten PIN';
COMMENT ON COLUMN "public"."user_encryption_keys"."failed_attempts" IS 'Number of failed PIN attempts for rate limiting';
COMMENT ON COLUMN "public"."user_encryption_keys"."locked_until" IS 'Account locked until this timestamp after too many failed attempts';

-- 2. Enable Row Level Security
ALTER TABLE "public"."user_encryption_keys" ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies
-- Users can only access their own encryption keys
CREATE POLICY "Users can view their own encryption keys"
ON "public"."user_encryption_keys"
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own encryption keys"
ON "public"."user_encryption_keys"
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own encryption keys"
ON "public"."user_encryption_keys"
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own encryption keys"
ON "public"."user_encryption_keys"
FOR DELETE
USING (auth.uid() = user_id);

-- 4. Grant permissions
GRANT ALL ON TABLE "public"."user_encryption_keys" TO "anon";
GRANT ALL ON TABLE "public"."user_encryption_keys" TO "authenticated";
GRANT ALL ON TABLE "public"."user_encryption_keys" TO "service_role";

-- 5. Add encrypted_content column to messages table for E2EE messages
-- (Old messages without this column are considered plaintext/grandfathered)
ALTER TABLE "public"."messages" 
ADD COLUMN IF NOT EXISTS "encrypted_content" text,
ADD COLUMN IF NOT EXISTS "encryption_version" integer;

-- Add comments for new columns
COMMENT ON COLUMN "public"."messages"."encrypted_content" IS 'Base64-encoded encrypted message content (E2EE)';
COMMENT ON COLUMN "public"."messages"."encryption_version" IS 'Encryption algorithm version for future compatibility';

-- 6. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_encryption_keys_user_id ON "public"."user_encryption_keys"(user_id);

-- 7. Create updated_at trigger for user_encryption_keys
CREATE OR REPLACE FUNCTION update_user_encryption_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_user_encryption_keys_updated_at ON "public"."user_encryption_keys";
CREATE TRIGGER set_user_encryption_keys_updated_at
    BEFORE UPDATE ON "public"."user_encryption_keys"
    FOR EACH ROW
    EXECUTE FUNCTION update_user_encryption_keys_updated_at();

-- =====================================================
-- VERIFICATION QUERIES (run these to verify setup)
-- =====================================================

-- Check that table was created:
-- SELECT * FROM information_schema.tables WHERE table_name = 'user_encryption_keys';

-- Check columns in messages table:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'messages' AND column_name IN ('encrypted_content', 'encryption_version');

-- Check RLS policies:
-- SELECT * FROM pg_policies WHERE tablename = 'user_encryption_keys';
