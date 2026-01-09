# Chat File Upload Enhancement

## Overview
Enhanced the chat functionality to support uploading various file types beyond just images and GIFs, including videos, audio files, documents (PDFs, Word, Excel, PowerPoint), and other file types.

## Changes Made

### 1. Type Definitions (`src/types.ts`)
- Extended `message_type` to include: `'video'`, `'audio'`, `'document'`, and `'file'`
- Added optional fields to `Message` interface:
  - `file_name?: string | null` - Original filename
  - `file_size?: number | null` - File size in bytes

### 2. Conversation Component (`src/components/Conversation.tsx`)
#### New Features:
- **Multiple File Type Support**: Users can now upload:
  - Images (existing)
  - GIFs (existing)
  - Videos (MP4, WebM, etc.)
  - Audio files (MP3, WAV, etc.)
  - Documents (PDF, Word, Excel, PowerPoint)
  - Other files (any file type)

- **File Size Validation**: 50MB maximum file size limit
- **File Type Detection**: Automatic detection based on MIME type
- **Enhanced UI**:
  - Separate upload buttons for images and files
  - File preview with filename and size display
  - Download functionality for documents and files

#### New Functions:
- `getFileType(file: File)`: Detects and categorizes file type
- `formatFileSize(bytes: number)`: Formats file size for display
- `handleFileChange(e, fileType)`: Enhanced to handle both images and files

#### Message Rendering:
- **Videos**: Embedded video player with controls
- **Audio**: Embedded audio player with controls
- **Documents/Files**: Download card with file icon, name, size, and download button

### 3. Database Migration (`supabase_migration_add_file_types.sql`)
Required database changes:
- Add `file_name` column (TEXT)
- Add `file_size` column (BIGINT)
- Update `message_type` constraint to include new types
- Add index on `message_type` for performance

## Installation & Setup

### Step 1: Run Database Migration
1. Open your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase_migration_add_file_types.sql`
4. Execute the migration

### Step 2: Verify Storage Bucket
Ensure the `chat-attachments` storage bucket exists and has proper permissions:
- Public read access
- Authenticated users can upload
- File size limit set appropriately (recommend 50MB)

### Step 3: Deploy Code Changes
The TypeScript and React changes are already in place. Simply deploy your updated code.

## Usage

### For Users:
1. Click the **+** button in the chat input area
2. Choose from:
   - **Image**: Upload photos (JPG, PNG, GIF, etc.)
   - **GIF**: Search and select animated GIFs
   - **File**: Upload any file type (videos, audio, documents, etc.)
3. Selected files show a preview with filename and size
4. Click send to share the file in chat

### Supported File Types:
- **Images**: All image formats (JPEG, PNG, GIF, WebP, etc.)
- **Videos**: MP4, WebM, MOV, AVI, etc.
- **Audio**: MP3, WAV, OGG, M4A, etc.
- **Documents**: 
  - PDF
  - Microsoft Word (.doc, .docx)
  - Microsoft Excel (.xls, .xlsx)
  - Microsoft PowerPoint (.ppt, .pptx)
- **Other**: Any other file type (displayed as downloadable file)

### File Size Limit:
- Maximum: 50MB per file
- Users receive an alert if they try to upload larger files

## Message Display

### Images & GIFs:
- Displayed inline with preview
- Click to open in lightbox (images only)
- Maximum width: 320px

### Videos:
- Embedded HTML5 video player
- Native browser controls (play, pause, volume, fullscreen)
- Maximum width: 448px (md breakpoint)
- Maximum height: 320px

### Audio:
- Embedded HTML5 audio player
- Native browser controls
- Maximum width: 384px (sm breakpoint)

### Documents & Files:
- Download card with:
  - File icon
  - Filename (truncated if too long)
  - File size in human-readable format
  - Download icon
- Click anywhere on the card to download
- Opens in new tab with download prompt

## Technical Details

### File Type Detection:
```typescript
const getFileType = (file: File): 'image' | 'video' | 'audio' | 'document' | 'file' => {
  const type = file.type;
  if (type.startsWith('image/')) return 'image';
  if (type.startsWith('video/')) return 'video';
  if (type.startsWith('audio/')) return 'audio';
  if (/* document MIME types */) return 'document';
  return 'file';
};
```

### File Size Formatting:
```typescript
const formatFileSize = (bytes: number): string => {
  // Returns: "1.5 MB", "256 KB", etc.
};
```

### Upload Flow:
1. User selects file
2. File size validation (< 50MB)
3. File type detection
4. Preview display
5. Upload to Supabase Storage (`chat-attachments` bucket)
6. Message inserted with file metadata
7. Real-time update to all participants

## Security Considerations

1. **File Size Limit**: Prevents abuse and excessive storage usage
2. **Storage Bucket Permissions**: Only authenticated users can upload
3. **File Type Detection**: Based on MIME type, not just extension
4. **Download Attributes**: Uses `download` attribute to prevent XSS
5. **External Links**: Uses `rel="noopener noreferrer"` for security

## Future Enhancements

Potential improvements:
- [ ] File preview for documents (PDF viewer)
- [ ] Image compression before upload
- [ ] Video thumbnail generation
- [ ] Multiple file upload at once
- [ ] Drag-and-drop file upload
- [ ] File type restrictions per conversation
- [ ] Virus scanning integration
- [ ] Progress indicator for large uploads

## Troubleshooting

### Files not uploading:
- Check Supabase storage bucket exists and is accessible
- Verify user is authenticated
- Check file size is under 50MB
- Verify storage bucket permissions

### Files not displaying:
- Check database migration was run successfully
- Verify `message_type` includes new types
- Check browser console for errors

### Download not working:
- Verify storage bucket has public read access
- Check file URL is valid
- Ensure browser allows downloads

## Support

For issues or questions, please check:
1. Browser console for errors
2. Supabase logs for storage/database errors
3. Network tab for failed requests
