import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '../services/supabase';
import { Post as PostType, Profile, Poll, QuotedPost } from '../types';
import Spinner from './Spinner';
import {
  ImageIcon,
  XCircleIcon,
  UserIcon
} from './icons';
import VisibilityDropdown from './VisibilityDropdown';
import UserSelectorModal from './UserSelectorModal';

// --- Icons ---
// Included inline in case they are missing from your icons file
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

interface CreatePostRpcResult {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  like_count: number;
  dislike_count: number;
  comment_count: number;
  repost_count: number;
  user_vote: 'like' | 'dislike' | null;
  is_bookmarked: boolean;
  user_has_reposted: boolean;
  community_id: string | null;
  is_public: boolean;
  visibility: 'public' | 'friends' | 'specific';
  allowed_viewers: string[];
  post_type: 'text' | 'image' | 'poll' | 'blog';
  is_edited: boolean;
  is_deleted: boolean;
  user_id: string;
  author_id: string;
  author_type: 'user' | 'community';
  author_name: string | null;
  author_username: string | null;
  author_avatar_url: string | null;
  author_flair_details: {
    id: string;
    name: string;
    avatar_url: string | null;
  } | null;
  original_poster_username: string | null;
  poll: Poll | null;
  quoted_post: QuotedPost | null;
  reposted_by: {
    user_id: string;
    username: string;
    full_name: string | null;
  } | null;
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

  // Visibility State
  const [visibility, setVisibility] = useState<'public' | 'friends' | 'specific'>('public');
  const [allowedViewers, setAllowedViewers] = useState<string[]>([]);
  const [showUserSelector, setShowUserSelector] = useState(false);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  const processFile = (file: File) => {
    setImageFile(file);
    setIsCreatingPoll(false);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          processFile(file);
          break;
        }
      }
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

    // Check for duplicate options
    if (isCreatingPoll) {
      const uniqueOptions = new Set(validPollOptions.map(o => o.toLowerCase()));
      if (uniqueOptions.size !== validPollOptions.length) {
        setError('Poll options must be unique.');
        return;
      }
    }

    if (visibility === 'specific' && allowedViewers.length === 0) {
      setError('Please select at least one friend to share with.');
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
          p_is_public: communityId ? isPublicPost : (visibility === 'public'),
          p_poll_options: isCreatingPoll ? validPollOptions : [],
          p_allow_multiple_answers: allowMultipleAnswers,
          p_visibility: visibility,
          p_allowed_viewers: allowedViewers
        })
        .single();

      if (rpcError) throw rpcError;

      // The RPC returns a post, possibly with flat author details.
      // We need to transform it into the PostType structure for onPostCreated.
      const rpcResult = data as CreatePostRpcResult;

      const newPost: PostType = {
        ...rpcResult,
        id: rpcResult.id || '', // Ensure ID is present
        content: rpcResult.content || '', // Ensure content is present
        created_at: rpcResult.created_at || new Date().toISOString(), // Ensure created_at is present
        like_count: rpcResult.like_count || 0,
        dislike_count: rpcResult.dislike_count || 0,
        comment_count: rpcResult.comment_count || 0,
        repost_count: rpcResult.repost_count || 0,
        user_vote: rpcResult.user_vote || null,
        is_bookmarked: rpcResult.is_bookmarked || false,
        user_has_reposted: rpcResult.user_has_reposted || false,
        community_id: rpcResult.community_id || null,
        is_public: rpcResult.is_public || false,
        visibility: rpcResult.visibility || 'public',
        allowed_viewers: rpcResult.allowed_viewers || [],
        post_type: rpcResult.post_type || 'text',
        // Author details from profile or rpcResult if available
        author: {
          author_id: rpcResult.author_id || profile.user_id,
          author_type: rpcResult.author_type || 'user',
          author_name: rpcResult.author_name || profile.full_name,
          author_username: rpcResult.author_username || profile.username,
          author_avatar_url: rpcResult.author_avatar_url || profile.avatar_url,
          author_flair_details: rpcResult.author_flair_details || profile.flair_details || null,
        },
        original_poster_username: rpcResult.original_poster_username || null,
        poll: rpcResult.poll || null,
        is_edited: rpcResult.is_edited || false,
        is_deleted: rpcResult.is_deleted || false,
        user_id: rpcResult.user_id || profile.user_id,
        quoted_post: rpcResult.quoted_post || null,
        reposted_by: rpcResult.reposted_by || null,
        parent_post_id: null,
        root_post_id: null,
        // Any other properties that are part of PostType but not in CreatePostRpcResult will be undefined,
        // which might be fine if they are optional or handled elsewhere.
      };
      onPostCreated(newPost);

      setContent('');
      handleRemoveImage();
      resetPoll();
      setVisibility('public');
      setAllowedViewers([]);

    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        console.error('Unknown poll creation error:', err);
        // Try to safe stringify in case of circular refs, though unlikely for Supabase error
        try {
          setError(`Unknown error: ${JSON.stringify(err)}`);
        } catch (e) {
          setError('An unknown error occurred (and failed to stringify).');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <div className="bg-white dark:bg-secondary rounded-2xl shadow-xl border border-gray-100 dark:border-tertiary transition-all duration-300">
      <div className="p-5">
        <form onSubmit={handleSubmit}>
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-full overflow-hidden ring-2 ring-white dark:ring-tertiary shadow-sm bg-tertiary-light dark:bg-tertiary flex items-center justify-center">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt="Avatar"
                  width={44}
                  height={44}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              ) : (
                <UserIcon className="w-6 h-6 text-text-tertiary-light dark:text-text-tertiary" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              {/* Input Area */}
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onPaste={handlePaste}
                  placeholder={placeholderText || "What's on your mind?"}
                  className="w-full bg-transparent text-xl text-text-main-light dark:text-text-main placeholder-text-tertiary-light/70 dark:placeholder-text-tertiary/70 resize-none focus:outline-none min-h-[3rem] py-2"
                  rows={1}
                />
              </div>

              {/* Image Preview */}
              {imagePreview && (
                <div className="mt-4 relative group inline-block">
                  <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-tertiary shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-h-80 w-auto object-contain bg-black/5 dark:bg-black/20"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white rounded-full p-1.5 transition-all transform scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100 shadow-lg"
                  >
                    <XCircleIcon className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* Poll Creator */}
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isCreatingPoll ? 'max-h-[500px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 border border-gray-100 dark:border-white/10">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200 dark:border-white/10">
                    <div className="flex items-center gap-2 text-brand-green">
                      <PollIcon className="w-5 h-5" />
                      <h3 className="text-sm font-bold">Create a Poll</h3>
                    </div>
                    <button
                      type="button"
                      onClick={resetPoll}
                      className="text-xs font-medium text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 px-2 py-1 rounded transition-colors"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="space-y-3">
                    {pollOptions.map((option, index) => (
                      <div key={index} className="flex items-center gap-3 group">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-brand-green/30 flex items-center justify-center">
                          <span className="text-xs font-bold text-brand-green">{index + 1}</span>
                        </div>
                        <input
                          type="text"
                          placeholder={`Option ${index + 1}`}
                          value={option}
                          onChange={(e) => handlePollOptionChange(index, e.target.value)}
                          className="flex-1 bg-white dark:bg-black/20 rounded-lg px-3 py-2 text-sm border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-green/50 focus:border-brand-green transition-all"
                          maxLength={100}
                        />
                        {pollOptions.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removePollOption(index)}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <XCircleIcon className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    {pollOptions.length < 5 ? (
                      <button
                        type="button"
                        onClick={addPollOption}
                        className="text-xs font-bold text-brand-green hover:text-brand-green-darker flex items-center gap-1 px-2 py-1 rounded hover:bg-brand-green/10 transition-colors"
                      >
                        <span>+ Add Option</span>
                      </button>
                    ) : <span />}

                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={allowMultipleAnswers}
                        onChange={(e) => setAllowMultipleAnswers(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-brand-green focus:ring-brand-green"
                      />
                      <span className="text-xs font-medium text-text-secondary-light dark:text-text-secondary group-hover:text-text-main-light dark:group-hover:text-text-main transition-colors">
                        Multiple answers
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg text-center">
              <p className="text-red-600 dark:text-red-400 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Footer Toolbar */}
          <div className="flex justify-between items-end mt-6 pt-4 border-t border-gray-100 dark:border-white/5">
            <div className="flex items-center gap-2">
              {/* Media Actions */}
              <div className="flex items-center -space-x-1 bg-gray-50 dark:bg-white/5 rounded-full p-1 pr-3 border border-gray-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => { imageInputRef.current?.click(); resetPoll(); }}
                  className={`p-2 rounded-full transition-all duration-200 ${imageFile ? 'text-brand-green bg-brand-green/10' : 'text-text-tertiary-light dark:text-text-tertiary hover:text-brand-green hover:bg-gray-100 dark:hover:bg-white/10'}`}
                  title="Add Photo"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => { setIsCreatingPoll(true); handleRemoveImage(); }}
                  className={`p-2 rounded-full transition-all duration-200 ${isCreatingPoll ? 'text-brand-green bg-brand-green/10' : 'text-text-tertiary-light dark:text-text-tertiary hover:text-brand-green hover:bg-gray-100 dark:hover:bg-white/10'}`}
                  title="Create Poll"
                >
                  <PollIcon className="w-5 h-5" />
                </button>
                <input type="file" ref={imageInputRef} onChange={handleFileChange} accept="image/*" hidden />
              </div>

              {/* Visibility Selector */}
              {!communityId && (
                <div className="flex items-center gap-2">
                  <VisibilityDropdown
                    currentVisibility={visibility}
                    onSelect={(val) => {
                      setVisibility(val);
                      if (val === 'specific') setShowUserSelector(true);
                    }}
                    allowedViewersCount={allowedViewers.length}
                  />

                  {visibility === 'specific' && (
                    <button
                      type="button"
                      onClick={() => setShowUserSelector(true)}
                      className="text-xs font-medium text-brand-green hover:underline"
                    >
                      Edit
                    </button>
                  )}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || (!content.trim() && !imageFile && !isCreatingPoll)}
              className="bg-gradient-to-r from-brand-green to-brand-green/80 text-white text-sm font-bold py-2 px-6 rounded-full shadow-md shadow-brand-green/20 hover:shadow-lg hover:shadow-brand-green/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:scale-100 flex items-center gap-2"
            >
              {isSubmitting && <Spinner className="w-4 h-4 text-white" />}
              {isSubmitting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>

        {showUserSelector && (
          <UserSelectorModal
            onClose={() => setShowUserSelector(false)}
            onConfirm={(ids) => {
              setAllowedViewers(ids);
            }}
            initialSelectedIds={allowedViewers}
            title="Share with specific friends"
          />
        )}
      </div>
    </div>
  );
};

export default CreatePost;