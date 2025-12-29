import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { redis } from '@/services/redis';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const POSTS_PER_PAGE = 10;

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '0');

    // Key based on page number
    const cacheKey = `feed:public:page:${page}`;

    try {
        // 1. Try Redis
        if (redis) {
            try {
                const cached = await redis.get(cacheKey);
                if (cached) {
                    console.log(`[Redis] Feed Cache HIT for page ${page}`);
                    return NextResponse.json({ posts: cached, fromCache: true });
                }
            } catch (e) {
                console.error('[Redis] Error:', e);
            }
        }

        // 2. Fetch from Supabase
        console.log(`[Supabase] Feed Cache MISS for page ${page}`);
        const start = page * POSTS_PER_PAGE;
        const end = start + POSTS_PER_PAGE - 1;

        const { data, error } = await supabaseAdmin
            .rpc('get_public_feed_posts')
            .range(start, end);

        if (error) throw error;

        // 3. Save to Redis (Cache for 60 seconds)
        if (redis) {
            try {
                await redis.set(cacheKey, data || [], { ex: 60 });
            } catch (e) {
                console.error('[Redis] Error:', e);
            }
        }

        return NextResponse.json({ posts: data || [], fromCache: false });
    } catch (error) {
        console.error('Feed API Error:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
