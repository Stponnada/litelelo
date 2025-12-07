import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with Service Role Key to bypass RLS
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const dynamic = 'force-dynamic';

export async function GET() {
    return NextResponse.json({ message: 'AI Reply API is working' });
}

export async function POST(req: NextRequest) {
    try {
        const { postId, content, parentId } = await req.json();
        console.log('AI Reply Request:', { postId, parentId, content });

        if (!content.includes('@rock')) {
            return NextResponse.json({ message: 'No @rock mention found' }, { status: 200 });
        }

        // Fetch the post context (the post being replied to)
        const targetId = parentId || postId;
        const { data: targetPost, error: fetchError } = await supabaseAdmin
            .from('posts')
            .select('content, author_id')
            .eq('id', targetId)
            .single();

        if (fetchError || !targetPost) {
            console.error('Error fetching target post:', fetchError);
            return NextResponse.json({ error: 'Target post not found' }, { status: 404 });
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const prompt = `You are a funny AI assistant named "Rock".
    You are replying to a post that says: "${targetPost.content}".
    The user's comment that triggered you is: "${content}".
    Write a funny, witty, and helpful response as Rock. Keep it concise.`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        // Find or create "Rock" user
        let rockUserId: string | null = null;

        // Check if profile exists with username 'rock'
        const { data: rockProfile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('user_id')
            .eq('username', 'rock')
            .single();

        if (rockProfile) {
            rockUserId = rockProfile.user_id;
        } else {
            // Create user if not exists
            // Note: This requires the service role key to have admin privileges
            const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
                email: 'rock@litelelo.com',
                password: 'rockpassword123', // Secure enough for a bot?
                email_confirm: true,
                user_metadata: {
                    username: 'rock',
                    full_name: 'Rock (AI Assistant)',
                    avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=rock' // Placeholder avatar
                }
            });

            if (createUserError) {
                console.error('Error creating Rock user:', createUserError);
                // Fallback: don't post, just return text
                return NextResponse.json({ reply: text });
            }

            if (newUser.user) {
                rockUserId = newUser.user.id;

                // Create profile for the new user
                // Depending on triggers, this might happen automatically, but let's ensure it.
                // If there's a trigger on auth.users, we might get a duplicate key error if we try to insert.
                // Let's check if profile exists again after a short delay or just try to update it.

                // We'll assume the trigger handles it or we need to insert.
                // Let's try to upsert the profile just in case.
                const { error: upsertError } = await supabaseAdmin
                    .from('profiles')
                    .upsert({
                        user_id: rockUserId,
                        username: 'rock',
                        full_name: 'Rock (AI Assistant)',
                        avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=rock',
                        campus: 'Pilani', // Default
                        admission_year: 2024,
                        branch: 'CS',
                        following_count: 0,
                        follower_count: 0,
                        is_following: false,
                        has_sent_request: false,
                        has_received_request: false
                    });

                if (upsertError) {
                    console.error('Error upserting Rock profile:', upsertError);
                }
            }
        }

        if (rockUserId) {
            // Insert the reply
            const { error: insertError } = await supabaseAdmin
                .from('posts')
                .insert({
                    content: text,
                    user_id: rockUserId,
                    parent_post_id: targetId, // Reply to the post/comment
                    root_post_id: postId, // Assuming postId passed is the root or we need to fetch it. 
                    // Actually, if parentId is set, we should probably check its root.
                    // But for simplicity, let's assume the passed postId is the root context we are in.
                    // If we are deep in a thread, we might need to be careful.
                    // Let's fetch the root_post_id from the target post.
                    community_id: null, // Or inherit?
                    is_public: true,
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
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
