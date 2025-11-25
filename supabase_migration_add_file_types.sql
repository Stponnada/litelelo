-- Migration to add support for additional file types in chat messages
-- Run this in your Supabase SQL editor

-- 1. Add new columns to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS file_name TEXT,
ADD COLUMN IF NOT EXISTS file_size BIGINT;

-- 2. Update the message_type check constraint to include new types
-- First, drop the existing constraint if it exists
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_message_type_check;

-- Then add the new constraint with all supported types
ALTER TABLE messages 
ADD CONSTRAINT messages_message_type_check 
CHECK (message_type IN ('text', 'image', 'gif', 'video', 'audio', 'document', 'file'));

-- 3. Create an index on message_type for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_message_type ON messages(message_type);

-- 4. Add a comment to document the schema change
COMMENT ON COLUMN messages.file_name IS 'Original filename for uploaded files';
COMMENT ON COLUMN messages.file_size IS 'File size in bytes';
COMMENT ON COLUMN messages.message_type IS 'Type of message: text, image, gif, video, audio, document, or file';
