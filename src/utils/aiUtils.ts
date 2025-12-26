import { Post as PostType } from '../types';

/**
 * Checks if a post contains a mention for @rock and triggers the AI reply API.
 */
export const checkForAiMention = async (post: PostType) => {
    if (!post.content?.toLowerCase().includes('@rock')) {
        return;
    }

    try {
        console.log('Triggering AI reply for post:', post.id);
        const response = await fetch('/api/ai-reply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                postId: post.root_post_id || post.id,
                content: post.content,
                parentId: post.id // AI replies to the post that mentioned it
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('AI reply API failed:', errorText);
        } else {
            console.log('AI reply triggered successfully');
        }
    } catch (err) {
        console.error('Error triggering AI reply:', err);
    }
};
