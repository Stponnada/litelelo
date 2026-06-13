-- Language is the on-campus discovery axis (broader than city): students who
-- speak the same language find each other once hometown stops mattering.

ALTER TABLE "public"."profiles" ADD COLUMN IF NOT EXISTS "language" "text";
CREATE INDEX IF NOT EXISTS "profiles_language_idx" ON "public"."profiles" ("language");
