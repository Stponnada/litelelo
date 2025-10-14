// src/components/CreatePost.tsx

import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Post as PostType, Profile } from '../types';
import Spinner from './Spinner';
import { ImageIcon, XCircleIcon } from './icons';

const PollIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
);

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

  const [isCreatingPoll, setIsCreatingPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [allowMultipleAnswers, setAllowMultipleAnswers] = useState(false);

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
      setIsCreatingPoll(false);
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
    if (imageInputRef.current) imageInputRef.current.value = '';
  };
  
  const resetPoll = () => {
    setIsCreatingPoll(false);
    setPollOptions(['', '']);
    setAllowMultipleAnswers(false);
  };

  const handlePollOptionChange = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const addPollOption = () => {
    if (pollOptions.length < 5) {
        setPollOptions([...pollOptions, '']);
    }
  };

  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
        setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !imageFile && !isCreatingPoll) {
      setError('Post cannot be empty.');
      return;
    }
    const validPollOptions = pollOptions.map(o => o.trim()).filter(Boolean);
    if (isCreatingPoll && validPollOptions.length < 2) {
        setError('A poll must have at least two options.');
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
        imageUrl = supabase.storage.from('post-images').getPublicUrl(filePath).data.publicUrl;
      }
      
      const { data, error: rpcError } = await supabase
        .rpc('create_post_with_poll', {
          p_content: content.trim(),
          p_image_url: imageUrl,
          p_community_id: communityId || null,
          p_is_public: communityId ? isPublicPost : false,
          p_poll_options: isCreatingPoll ? validPollOptions : [],
          p_allow_multiple_answers: allowMultipleAnswers,
        })
        .single();
      
      if (rpcError) throw rpcError;
      
      onPostCreated(data as any);

      setContent('');
      handleRemoveImage();
      resetPoll();

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

            {isCreatingPoll && (
                <div className="mt-4 space-y-3 border-t border-tertiary-light dark:border-tertiary pt-4">
                    {pollOptions.map((option, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <input
                                type="text"
                                placeholder={`Option ${index + 1}`}
                                value={option}
                                onChange={(e) => handlePollOptionChange(index, e.target.value)}
                                className="w-full bg-tertiary-light dark:bg-tertiary rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                            />
                            {pollOptions.length > 2 && (
                                <button type="button" onClick={() => removePollOption(index)} className="p-1 text-red-400 hover:bg-red-500/10 rounded-full">
                                    <XCircleIcon className="w-5 h-5"/>
                                </button>
                            )}
                        </div>
                    ))}
                    {pollOptions.length < 5 && (
                        <button type="button" onClick={addPollOption} className="text-sm font-semibold text-brand-green hover:underline">
                            + Add Option
                        </button>
                    )}
                    <div className="flex items-center justify-between mt-2">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                                type="checkbox"
                                checked={allowMultipleAnswers}
                                onChange={(e) => setAllowMultipleAnswers(e.target.checked)}
                                className="rounded text-brand-green focus:ring-brand-green"
                            />
                            Allow multiple answers
                        </label>
                        <button type="button" onClick={resetPoll} className="text-sm text-red-400 hover:underline">Remove Poll</button>
                    </div>
                </div>
            )}
          </div>
        </div>

        {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}
        
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-tertiary-light dark:border-tertiary">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => { imageInputRef.current?.click(); resetPoll(); }}
              className="text-brand-green hover:text-brand-green-darker p-2 rounded-full hover:bg-brand-green/10"
              title="Add image"
            >
              <ImageIcon className="w-6 h-6" />
            </button>
            <input type="file" ref={imageInputRef} onChange={handleFileChange} accept="image/*" hidden />
            <button
                type="button"
                onClick={() => { setIsCreatingPoll(true); handleRemoveImage(); }}
                className="text-brand-green hover:text-brand-green-darker p-2 rounded-full hover:bg-brand-green/10"
                title="Add poll"
            >
                <PollIcon className="w-6 h-6"/>
            </button>
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