-- =====================================================
-- E2EE (End-to-End Encryption) Database Migration v2
-- ASYMMETRIC ENCRYPTION with RSA key pairs
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Drop old table if exists and create new one with proper columns
DROP TABLE IF EXISTS "public"."user_encryption_keys";

CREATE TABLE "public"."user_encryption_keys" (
    "user_id" uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    "encrypted_private_key" text NOT NULL,    -- RSA private key, encrypted with PIN
    "public_key" text NOT NULL,               -- RSA public key (unencrypted, shareable)
    "salt" text NOT NULL,                     -- Argon2 salt for PIN derivation
    "key_version" integer DEFAULT 1 NOT NULL,
    "hint" text,                              -- Optional PIN hint
    "failed_attempts" integer DEFAULT 0 NOT NULL,
    "locked_until" timestamptz,
    "created_at" timestamptz DEFAULT now() NOT NULL,
    "updated_at" timestamptz DEFAULT now() NOT NULL
);

-- Add comments
COMMENT ON TABLE "public"."user_encryption_keys" IS 'Stores RSA key pairs for E2EE chat - public key readable, private key encrypted with PIN';
COMMENT ON COLUMN "public"."user_encryption_keys"."public_key" IS 'Base64-encoded RSA public key (SPKI format) - used by others to encrypt messages to this user';
COMMENT ON COLUMN "public"."user_encryption_keys"."encrypted_private_key" IS 'Base64-encoded RSA private key (PKCS8), encrypted with PIN-derived AES key';

-- 2. Enable Row Level Security
ALTER TABLE "public"."user_encryption_keys" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own encryption keys" ON "public"."user_encryption_keys";
DROP POLICY IF EXISTS "Users can insert their own encryption keys" ON "public"."user_encryption_keys";
DROP POLICY IF EXISTS "Users can update their own encryption keys" ON "public"."user_encryption_keys";
DROP POLICY IF EXISTS "Users can delete their own encryption keys" ON "public"."user_encryption_keys";
DROP POLICY IF EXISTS "Anyone can read public keys" ON "public"."user_encryption_keys";

-- 3. Create RLS policies
-- Users can fully manage their own keys
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

-- IMPORTANT: Anyone can read public keys (needed for encryption)
CREATE POLICY "Anyone can read public keys"
ON "public"."user_encryption_keys"
FOR SELECT
USING (true);

-- 4. Grant permissions
GRANT ALL ON TABLE "public"."user_encryption_keys" TO "anon";
GRANT ALL ON TABLE "public"."user_encryption_keys" TO "authenticated";
GRANT ALL ON TABLE "public"."user_encryption_keys" TO "service_role";

-- 5. Update messages table for asymmetric encryption
-- Drop old columns if they exist with wrong types
ALTER TABLE "public"."messages" 
DROP COLUMN IF EXISTS "encrypted_content",
DROP COLUMN IF EXISTS "encryption_version",
DROP COLUMN IF EXISTS "encrypted_key_sender",
DROP COLUMN IF EXISTS "encrypted_key_recipient";

-- Add new columns
ALTER TABLE "public"."messages" 
ADD COLUMN "encrypted_content" text,
ADD COLUMN "encrypted_key_sender" text,
ADD COLUMN "encrypted_key_recipient" text,
ADD COLUMN "encryption_version" integer;

-- Add comments
COMMENT ON COLUMN "public"."messages"."encrypted_content" IS 'Base64-encoded AES-GCM encrypted message content';
COMMENT ON COLUMN "public"."messages"."encrypted_key_sender" IS 'AES key encrypted with sender public key (so sender can read)';
COMMENT ON COLUMN "public"."messages"."encrypted_key_recipient" IS 'AES key encrypted with recipient public key';
COMMENT ON COLUMN "public"."messages"."encryption_version" IS 'Encryption algorithm version for future compatibility';

-- 6. Create index for faster key lookups
CREATE INDEX IF NOT EXISTS idx_user_encryption_keys_user_id ON "public"."user_encryption_keys"(user_id);

-- 7. Create updated_at trigger
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
-- VERIFICATION QUERIES
-- =====================================================

-- Check table structure:
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'user_encryption_keys' ORDER BY ordinal_position;

-- Check messages columns:
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'messages' AND column_name LIKE 'encrypted%' ORDER BY ordinal_position;

-- Check RLS policies:
-- SELECT * FROM pg_policies WHERE tablename = 'user_encryption_keys';
