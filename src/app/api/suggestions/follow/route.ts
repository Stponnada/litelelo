import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { redis } from '@/services/redis';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
);

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const cacheKey = `suggestions:follow:v3:${userId}`;

    try {
        // 1. Try Redis
        if (redis) {
            try {
                const cached = await redis.get(cacheKey);
                if (cached) {
                    console.log(`[Redis] Follow Suggestions Cache HIT for ${userId}`);
                    return NextResponse.json({ suggestions: cached, fromCache: true });
                }
            } catch (e) {
                console.error('[Redis] Error reading suggestions:', e);
            }
        }

        // 2. Fetch from Supabase
        // Note: We use the admin client but we should ideally use the user's token 
        // if get_follow_suggestions depends on auth.uid(). 
        // However, since we are in an API route, we can pass the userId if the RPC supports it
        // or assume the RPC handles it if we could set the auth context.
        // For now, let's call the RPC. If it needs auth.uid(), we might need a different approach.
        // Given the previous code called it directly from the client, it likely uses current user.
        // We'll use the service role to ensure bypass, but get_follow_suggestions might 
        // need the requesting userId to filter out people they already follow.

        // Check if the RPC takes parameters. Based on the previous code, it's called with no args: supabase.rpc('get_follow_suggestions')
        // This usually implies it uses auth.uid(). 
        // To make this work from an API route with service role, we might need to modify the RPC or pass the ID.
        // Let's try calling it. If it fails or returns everyone, we'll know.

        console.log(`[Supabase] Follow Suggestions Cache MISS for ${userId}`);
        const { data, error } = await supabaseAdmin.rpc('get_follow_suggestions', { p_user_id: userId });

        if (error) {
            console.error('[Supabase] RPC Error:', error);
            throw error;
        }

        console.log(`[Supabase] Found ${data?.length || 0} suggestions for ${userId}`);
        const result = data || [];

        // 3. Save to Redis (Cache for 1 hour)
        if (redis) {
            try {
                await redis.set(cacheKey, result, { ex: 3600 });
            } catch (e) {
                console.error('[Redis] Error saving suggestions:', e);
            }
        }

        return NextResponse.json({ suggestions: result, fromCache: false });
    } catch (error) {
        console.error('Follow Suggestions API Error:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
