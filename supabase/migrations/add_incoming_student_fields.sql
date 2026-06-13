-- Incoming-student onboarding fields
-- Supports the pre-arrival experience: incoming freshers can be discovered by
-- batchmates, and hometown enables city-based meetups before reaching campus.

ALTER TABLE "public"."profiles"
  ADD COLUMN IF NOT EXISTS "hometown" "text",
  ADD COLUMN IF NOT EXISTS "is_incoming" boolean NOT NULL DEFAULT false;

-- Discovery queries filter heavily on these (e.g. "incoming students from my city").
CREATE INDEX IF NOT EXISTS "profiles_is_incoming_idx" ON "public"."profiles" ("is_incoming");
CREATE INDEX IF NOT EXISTS "profiles_hometown_idx" ON "public"."profiles" ("hometown");
