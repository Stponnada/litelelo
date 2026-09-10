import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { redis } from '@/services/redis';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
);

export async function GET(
    req: NextRequest,
    { params }: { params: any }
) {
    const resolvedParams = await params;
    const userId = resolvedParams.userId;

    if (!userId) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const cacheKey = `user:communities:${userId}`;

    try {
        if (redis) {
            try {
                const cached = await redis.get(cacheKey);
                if (cached) return NextResponse.json(cached);
            } catch (e) {
                console.error('[Redis] Error:', e);
            }
        }

        const { data, error } = await supabaseAdmin
            .rpc('get_communities_for_user', { p_user_id: userId })
            .limit(5);

        if (error) throw error;

        if (redis) {
            try {
                await redis.set(cacheKey, data || [], { ex: 3600 }); // Cache for 1 hour
            } catch (e) {
                console.error('[Redis] Error:', e);
            }
        }

        return NextResponse.json(data || []);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
