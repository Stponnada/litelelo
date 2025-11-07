// src/pages/PostPage.tsx

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { usePosts } from '../hooks/usePosts';
import PostComponent from '../components/Post';
import { Post as PostType, Comment as CommentType, Profile } from '../types';
import Spinner from '../components/Spinner';
import { formatTimestamp, formatExactTimestamp } from '../utils/timeUtils';
import { renderContentWithEmbeds } from '../utils/renderEmbeds';

const getAvatarUrl = (profile: Profile | null) => {
  if (!profile) return '';
  return profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.full_name || profile.username}&background=E53E3E&color=fff`;
};

const Flair: React.FC<{ flair: { id: string; name: string; avatar_url: string | null } }> = ({ flair }) => (
    <Link
      to={`/communities/${flair.id}`}
      onClick={(e) => e.stopPropagation()}
      className="group ml-2"
      title={flair.name}
    >
        <img 
            src={flair.avatar_url || `https://ui-avatars.com/api/?name=${flair.name}`} 
            alt={flair.name} 
            className="w-5 h-5 rounded-full object-cover transition-transform group-hover:scale-110" 
        />
    </Link>
);

const Comment: React.FC<{ comment: CommentType }> = ({ comment }) => {
  const author = comment.profiles;
  return (
    <div className="flex items-start space-x-3 p-4 border-b border-tertiary-light dark:border-tertiary">
      <Link to={`/profile/${author?.username}`} className="flex-shrink-0">
        <img src={getAvatarUrl(author)} alt={author?.username || 'avatar'} className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 object-cover" />
      </Link>
      <div className="flex-1 min-w-0">
        <div>
            <div className="flex items-baseline md:space-x-2 flex-wrap md:flex-nowrap">
                <Link to={`/profile/${author?.username}`} className="font-semibold text-text-main-light dark:text-text-main hover:underline leading-tight truncate">{author?.full_name || author?.username}</Link>
                {author?.flair_details && <Flair flair={author.flair_details} />}
                <span className="text-sm text-text-tertiary-light dark:text-text-tertiary truncate hidden md:inline">@{author?.username}</span>
                <span className="text-sm text-text-tertiary-light dark:text-text-tertiary hidden md:inline">&middot;</span>
                <span className="text-sm text-text-tertiary-light dark:text-text-tertiary hover:underline flex-shrink-0 hidden md:inline" title={new Date(comment.created_at).toLocaleString()}>
                    {formatTimestamp(comment.created_at)}
                </span>
            </div>
            <p className="md:hidden text-sm text-text-tertiary-light dark:text-text-tertiary -mt-1 truncate" title={new Date(comment.created_at).toLocaleString()}>
                @{author?.username} &middot; {formatTimestamp(comment.created_at)}
            </p>
        </div>
        <div className="mt-1 text-text-secondary-light dark:text-text-secondary">
          {renderContentWithEmbeds(comment.content)}
        </div>
      </div>
    </div>
  );
};

const PostPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const { user } = useAuth();
  const { posts, loading: postsLoading, updatePostInContext } = usePosts();
  const [comments, setComments] = useState<CommentType[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);

  const post = posts.find(p => p.id === postId);

  useEffect(() => {
    const fetchPageSpecificData = async () => {
        if (!postId) return;
        setCommentsLoading(true);
        const { data: commentsData, error } = await supabase.rpc('get_comments_for_post', { p_post_id: postId });
        if (error) {
          console.error("Error fetching comments with flair:", error);
        } else {
          setComments((commentsData as any) || []);
        }

        if (user) {
          const { data: profileData } = await supabase.from('profiles').select('*, flair_details:displayed_community_flair(id, name, avatar_url)').eq('user_id', user.id).single();
          setCurrentUserProfile(profileData as Profile);
        }
        setCommentsLoading(false);
    }
    fetchPageSpecificData();
  }, [postId, user]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !post || !newComment.trim() || !currentUserProfile) return;
    
    // --- OPTIMISTIC UPDATE ---
    const tempCommentId = Date.now();
    const optimisticComment: CommentType = {
      id: tempCommentId,
      content: newComment.trim(),
      user_id: user.id,
      post_id: post.id,
      created_at: new Date().toISOString(),
      profiles: currentUserProfile,
    };
    
    // 1. Immediately update the UI
    setComments(prev => [...prev, optimisticComment]);
    const originalCommentCount = post.comment_count || 0;
    updatePostInContext({ id: post.id, comment_count: originalCommentCount + 1 });
    const submittedCommentText = newComment;
    setNewComment('');
    setIsSubmitting(true);
    
    try {
      // 2. Send the actual request to the server
      const { data: commentData, error } = await supabase
        .from('comments')
        .insert({ post_id: post.id, user_id: user.id, content: optimisticComment.content })
        .select()
        .single();
        
      if (error) throw error;
      
      // 3. Replace the temporary comment with the real one from the DB
      setComments(prev => prev.map(c => c.id === tempCommentId ? { ...c, ...commentData } : c));

    } catch (error) {
      console.error("Error submitting comment:", error);
      // 4. On failure, revert the UI changes
      alert('Failed to post comment. Please try again.');
      setComments(prev => prev.filter(c => c.id !== tempCommentId));
      updatePostInContext({ id: post.id, comment_count: originalCommentCount });
      setNewComment(submittedCommentText); // Restore user's text
    } finally {
      setIsSubmitting(false);
    }
  };

  if (postsLoading) {
    return <div className="text-center py-10"><Spinner /></div>;
  }

  if (!post) {
    return <div className="text-center py-10 text-red-400">Post not found.</div>;
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <PostComponent post={post} />

      <div className="px-4 py-3 text-sm text-text-tertiary-light dark:text-text-tertiary border-y border-tertiary-light dark:border-tertiary bg-secondary-light dark:bg-secondary">
        <span>{formatExactTimestamp(post.created_at)}</span>
      </div>

      {currentUserProfile && (
        <div className="p-4 border-b border-tertiary-light dark:border-tertiary bg-secondary-light dark:bg-secondary">
          <form onSubmit={handleCommentSubmit} className="flex items-start space-x-3">
            <img src={getAvatarUrl(currentUserProfile)} alt="Your avatar" className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 object-cover" />
            <div className="flex-1">
              <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Post your reply" className="w-full bg-tertiary-light dark:bg-tertiary rounded-lg p-2 text-text-main-light dark:text-text-main placeholder-text-tertiary-light dark:placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-green" rows={2} />
              <div className="flex justify-end mt-2">
                <button type="submit" disabled={isSubmitting || !newComment.trim()} className="bg-brand-green text-black font-bold py-2 px-4 rounded-full disabled:opacity-50 hover:bg-brand-green-darker">
                  {isSubmitting ? <Spinner /> : 'Reply'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
      
      <div className='bg-secondary-light dark:bg-secondary rounded-b-lg'>
        {commentsLoading ? <div className="text-center py-8"><Spinner/></div> :
         comments.length > 0 ? (
          comments.map(comment => <Comment key={comment.id} comment={comment} />)
        ) : (
          <div className="text-center text-text-tertiary-light dark:text-text-tertiary py-8">
            <p>No Comments Yet.</p>
            <p>Be the first one to comment!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostPage;