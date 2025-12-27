import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with Service Role Key to bypass RLS
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Function to get a random API key from a comma-separated list
const getRotatedApiKey = () => {
    const keys = (process.env.GEMINI_API_KEY || '').split(',').map(k => k.trim()).filter(Boolean);
    if (keys.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * keys.length);
    return keys[randomIndex];
};

export const dynamic = 'force-dynamic';

export async function GET() {
    return NextResponse.json({ message: 'AI Reply API is working' });
}

export async function POST(req: NextRequest) {
    try {
        const { postId, content, parentId } = await req.json();
        const apiKey = getRotatedApiKey();

        if (!apiKey) {
            console.error('No GEMINI_API_KEY found in environment variables');
            return NextResponse.json({ error: 'API key configuration missing' }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        console.log('AI Reply Request (Rotated Key):', { postId, parentId });

        if (!content?.toLowerCase().includes('@rock')) {
            return NextResponse.json({ message: 'No @rock mention found' }, { status: 200 });
        }

        // 1. Identify the root of the thread to get full context
        // parentId is the post that mentioned @rock
        const mentionPostId = parentId || postId;
        console.log('Fetching mention post context for ID:', mentionPostId);

        // Fetch the mention post first to get its thread context
        let { data: mentionPost, error: mentionFetchError } = await supabaseAdmin
            .from('posts')
            .select('id, content, user_id, parent_post_id, root_post_id, community_id, is_public')
            .eq('id', mentionPostId)
            .single();

        // Small retry logic if post isn't found (handles rare indexing lag)
        if (!mentionPost) {
            console.log('Mention post not found immediately, retrying in 500ms...');
            await new Promise(resolve => setTimeout(resolve, 500));
            const retryResult = await supabaseAdmin
                .from('posts')
                .select('id, content, user_id, parent_post_id, root_post_id, community_id, is_public')
                .eq('id', mentionPostId)
                .single();
            mentionPost = retryResult.data;
            mentionFetchError = retryResult.error;
        }

        if (mentionFetchError || !mentionPost) {
            console.error('Error fetching mention post after retry:', mentionFetchError || 'No post found');
            return NextResponse.json({ error: 'Target post not found' }, { status: 404 });
        }

        const rootId = mentionPost.root_post_id || mentionPost.id;

        // 2. Fetch the whole thread for context
        // We'll fetch posts in chronological order
        const { data: threadPosts, error: threadError } = await supabaseAdmin
            .from('posts')
            .select('id, content, user_id, parent_post_id, created_at, profiles(username, full_name)')
            .or(`id.eq.${rootId},root_post_id.eq.${rootId}`)
            .order('created_at', { ascending: true });

        if (threadError) {
            console.error('Error fetching thread context:', threadError);
            // Non-blocking, we'll continue with just the current post context
        }

        // Format thread for Gemini
        let threadContext = '';
        if (threadPosts && threadPosts.length > 0) {
            threadContext = threadPosts.map(p => {
                const username = (p.profiles as any)?.username || 'unknown';
                return `${username}: ${p.content}`;
            }).join('\n');
        } else {
            // Fallback to just the current post if thread fetch failed or is empty
            const { data: authorProfile } = await supabaseAdmin
                .from('profiles')
                .select('username')
                .eq('user_id', mentionPost.user_id)
                .single();
            threadContext = `${authorProfile?.username || 'user'}: ${mentionPost.content}`;
        }

        // 3. Generate response with full context
        let text = '';
        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
            const prompt = `You are a funny, witty AI assistant named "Rock" on a social platform called Litelelo.
            
            CONVERSATION CONTEXT:
            ${threadContext}
            
            YOUR TASK:
            You are replying to the last message in the thread above. 
            The user mentioned you (@rock) in that message.
            Write a funny, witty, and helpful response as Rock. 
            Keep it concise, conversational, and stay in character. 
            Do not use placeholders like "[original poster]". 
            Address users by their @usernames if you mention them.
            Make sure your reply feels like a natural part of the conversation history provided above.`;

            const result = await model.generateContent(prompt);
            text = result.response.text();
        } catch (geminiError) {
            console.error('Gemini 2.5-flash-lite failed, trying gemini-1.5-flash:', geminiError);
            try {
                const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
                const prompt = `You are a funny AI assistant named "Rock".
                Conversation:
                ${threadContext}
                
                Write a witty reply to the last message.`;
                const result = await model.generateContent(prompt);
                text = result.response.text();
            } catch (fallbackError) {
                console.error('Gemini 1.5-flash fallback failed too:', fallbackError);
                throw fallbackError;
            }
        }

        if (!text) {
            throw new Error('Failed to generate content from Gemini');
        }

        // 4. Identify or create Rock user
        let rockUserId: string | null = null;
        const { data: rockProfile } = await supabaseAdmin
            .from('profiles')
            .select('user_id')
            .eq('username', 'rock')
            .single();

        if (rockProfile) {
            rockUserId = rockProfile.user_id;
        } else {
            // Create user logic (same as before)
            const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
                email: 'rock@litelelo.com',
                password: 'rockpassword123' + Math.random().toString(36).slice(-8),
                email_confirm: true,
                user_metadata: {
                    username: 'rock',
                    full_name: 'Rock (AI Assistant)',
                    avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=rock'
                }
            });

            if (!createUserError && newUser.user) {
                rockUserId = newUser.user.id;
                await supabaseAdmin.from('profiles').upsert({
                    user_id: rockUserId,
                    username: 'rock',
                    full_name: 'Rock (AI Assistant)',
                    avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=rock',
                    campus: 'Pilani',
                    admission_year: 2024,
                    branch: 'CS'
                });
            }
        }

        if (rockUserId) {
            // Insert the reply
            const { error: insertError } = await supabaseAdmin
                .from('posts')
                .insert({
                    content: text.trim(),
                    user_id: rockUserId,
                    parent_post_id: mentionPost.id, // Direct reply to the mention
                    root_post_id: mentionPost.root_post_id || mentionPost.id,
                    community_id: mentionPost.community_id,
                    is_public: mentionPost.is_public,
                    post_type: 'text'
                });

            if (insertError) {
                console.error('Error posting reply:', insertError);
                return NextResponse.json({ error: 'Failed to post reply' }, { status: 500 });
            }
        }

        return NextResponse.json({ reply: text });

    } catch (error) {
        console.error('Error in AI reply:', error);
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
