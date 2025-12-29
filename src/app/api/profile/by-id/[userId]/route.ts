import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { redis } from '@/services/redis';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
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

    const cacheKey = `profile:id:${userId}`;

    try {
        // 1. Try Redis
        if (redis) {
            try {
                const cached = await redis.get(cacheKey);
                if (cached) return NextResponse.json({ ...cached, fromCache: true });
            } catch (e) {
                console.error('[Redis] Error:', e);
            }
        }

        // 2. Fetch from Supabase
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error || !data) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        // 3. Save to Redis
        if (redis) {
            try {
                await redis.set(cacheKey, data, { ex: 600 });
            } catch (e) {
                console.error('[Redis] Error:', e);
            }
        }

        return NextResponse.json({ ...data, fromCache: false });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

// Invalidate on POST
export async function POST(
    req: NextRequest,
    { params }: { params: any }
) {
    const resolvedParams = await params;
    const userId = resolvedParams.userId;
    if (!userId) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    if (redis) {
        await redis.del(`profile:id:${userId}`);
    }
    return NextResponse.json({ message: 'Invalidated' });
}
