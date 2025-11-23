// src/components/QuotePostModal.tsx

import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { Post as PostType } from '../types';
import Spinner from './Spinner';
import QuotePostDisplay from './QuotePostDisplay';
import { XCircleIcon } from './icons';

interface QuotePostModalProps {
  postToQuote: PostType;
  onClose: () => void;
  onPostCreated: (newPost: PostType) => void;
}

const QuotePostModal: React.FC<QuotePostModalProps> = ({ postToQuote, onClose, onPostCreated }) => {
  const { profile } = useAuth();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Your quote must include a comment.');
      return;
    }
    setIsSubmitting(true);
    setError('');

    try {
      // --- THIS IS THE FIX: Added .single() to the end of the RPC call ---
      const { data, error: rpcError } = await supabase.rpc('create_quote_post', {
        p_content: content.trim(),
        p_quoted_post_id: postToQuote.id,
      }).single();

      if (rpcError) throw rpcError;
      
      onPostCreated(data as PostType);
      onClose();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!profile) return null;

  return (
    <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-20 md:items-center md:pt-4"
        onClick={onClose}
    >
        <div 
            className="w-full max-w-2xl bg-secondary-light dark:bg-secondary rounded-xl shadow-lg relative"
            onClick={(e) => e.stopPropagation()}
        >
            <button onClick={onClose} className="absolute top-3 right-3 text-text-tertiary-light dark:text-text-tertiary">
                <XCircleIcon className="w-7 h-7"/>
            </button>

            <form onSubmit={handleSubmit} className="p-4">
                <div className="flex items-start space-x-4">
                    <img src={profile.avatar_url || ''} alt="Your avatar" className="w-12 h-12 rounded-full object-cover" />
                    <div className="flex-1">
                        <textarea
                            ref={textareaRef}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Add a comment..."
                            className="w-full bg-transparent text-lg text-text-main-light dark:text-text-main placeholder-text-tertiary-light dark:placeholder-text-tertiary resize-none focus:outline-none overflow-hidden"
                            rows={2}
                            autoFocus
                        />
                        
                        <QuotePostDisplay post={postToQuote as any} />
                    </div>
                </div>

                {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}
                
                <div className="flex justify-end items-center mt-4 pt-4 border-t border-tertiary-light dark:border-tertiary">
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
    </div>
  );
};

export default QuotePostModal;