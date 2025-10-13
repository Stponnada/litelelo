// src/components/CreatePost.tsx

import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Post as PostType, Profile } from '../types';
import Spinner from './Spinner';
import { ImageIcon, XCircleIcon } from './icons';

interface CreatePostProps {
  onPostCreated: (post: PostType) => void;
  profile: Profile;
  communityId?: string;
  isPublicPost?: boolean;
  placeholderText?: string;
}

const CreatePost: React.FC<CreatePostProps> = ({ onPostCreated, profile, communityId, isPublicPost = false, placeholderText }) => {
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !imageFile) {
      setError('Post cannot be empty.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      let imageUrl: string | null = null;
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${profile.user_id}/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('post-images').upload(filePath, imageFile);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('post-images').getPublicUrl(filePath);
        imageUrl = publicUrl;
      }

      // --- THIS IS THE FIX ---
      // Call the new RPC function that handles post and mention creation together
      const { data, error: rpcError } = await supabase
        .rpc('create_post_with_mentions', {
          p_content: content.trim(),
          p_image_url: imageUrl,
          p_community_id: communityId || null,
          p_is_public: communityId ? isPublicPost : false,
        })
        .single();
      
      if (rpcError) throw rpcError;

      // The RPC returns a partial post object, we pass it to the handler
      onPostCreated(data as any);
      // --- END OF FIX ---

      setContent('');
      handleRemoveImage();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-secondary-light dark:bg-secondary rounded-xl shadow-lg border border-tertiary-light dark:border-tertiary p-4">
      <form onSubmit={handleSubmit}>
        <div className="flex items-start space-x-4">
          <img src={profile.avatar_url || ''} alt="Your avatar" className="w-12 h-12 rounded-full object-cover" />
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={placeholderText || "What's happening?"}
              className="w-full bg-transparent text-lg text-text-main-light dark:text-text-main placeholder-text-tertiary-light dark:placeholder-text-tertiary resize-none focus:outline-none overflow-hidden"
              rows={1}
            />
            
            {imagePreview && (
              <div className="mt-3 relative">
                <img src={imagePreview} alt="Preview" className="rounded-lg max-h-80 w-auto" />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/75"
                >
                  <XCircleIcon className="w-6 h-6" />
                </button>
              </div>
            )}
          </div>
        </div>

        {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}
        
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-tertiary-light dark:border-tertiary">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="text-brand-green hover:text-brand-green-darker p-2 rounded-full hover:bg-brand-green/10"
              title="Add image"
            >
              <ImageIcon className="w-6 h-6" />
            </button>
            <input type="file" ref={imageInputRef} onChange={handleFileChange} accept="image/*" hidden />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-brand-green text-black font-bold py-2 px-6 rounded-full hover:bg-brand-green-darker transition-colors disabled:opacity-50 flex items-center"
          >
            {isSubmitting && <Spinner />}
            Post
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePost;