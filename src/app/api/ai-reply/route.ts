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

        // Fetch the post context along with the author's username
        const targetId = parentId || postId;
        const { data: targetPost, error: fetchError } = await supabaseAdmin
            .from('posts')
            .select('content, user_id, community_id, is_public, profiles(username)')
            .eq('id', targetId)
            .single();

        if (fetchError || !targetPost) {
            console.error('Error fetching target post:', fetchError);
            return NextResponse.json({ error: 'Target post not found' }, { status: 404 });
        }

        const authorUsername = (targetPost.profiles as any)?.username || 'user';

        // Use gemini-2.5-flash-lite
        let text = '';
        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
            const prompt = `You are a funny, witty AI assistant named "Rock" on a social platform called Litelelo.
            You are replying to @${authorUsername} whose post says: "${targetPost.content}".
            The comment that triggered you is from the same user or someone else: "${content}".
            Write a funny, witty, and helpful response as Rock. 
            Mention @${authorUsername} in your reply if it feels natural.
            Keep it concise, conversational, and stay in character. 
            Do not use placeholders like "[original poster]". Always use actual usernames or names.`;

            const result = await model.generateContent(prompt);
            text = result.response.text();
        } catch (geminiError) {
            console.error('Gemini 2.5-flash-lite failed, trying gemini-1.5-flash:', geminiError);
            try {
                const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
                const prompt = `You are a funny AI assistant named "Rock". Replying to: "${targetPost.content}". User said: "${content}". Write a witty reply.`;
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

        // Find or create "Rock" user
        let rockUserId: string | null = null;

        // Check if profile exists with username 'rock'
        const { data: rockProfile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('user_id, avatar_url')
            .eq('username', 'rock')
            .single();

        if (rockProfile) {
            rockUserId = rockProfile.user_id;
        } else {
            console.log('Rock user not found, creating...');
            // Create user if not exists
            const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
                email: 'rock@litelelo.com',
                password: 'rockpassword123' + Math.random().toString(36).slice(-8), // More random
                email_confirm: true,
                user_metadata: {
                    username: 'rock',
                    full_name: 'Rock (AI Assistant)',
                    avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=rock'
                }
            });

            if (createUserError) {
                console.error('Error creating Rock user:', createUserError);
                return NextResponse.json({ reply: text, warning: 'Could not create Rock user' });
            }

            if (newUser.user) {
                rockUserId = newUser.user.id;
                // Update profile with correct details if it wasn't created by trigger
                await supabaseAdmin
                    .from('profiles')
                    .upsert({
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
                    parent_post_id: targetId,
                    root_post_id: postId,
                    community_id: targetPost.community_id, // Inherit community
                    is_public: targetPost.is_public, // Inherit visibility
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
        return NextResponse.json({ error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}
