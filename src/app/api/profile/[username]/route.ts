import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { redis } from '@/services/redis';

// Use the secret key to bypass RLS and get full profile data
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
);

export async function GET(
    req: NextRequest,
    { params }: { params: any } // Using any for compatibility across Next.js versions
) {
    // Handle both Promise and direct params (compatibility for Next.js 14/15)
    const resolvedParams = await params;
    const username = resolvedParams.username;

    if (!username) {
        return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const cacheKey = `profile:${username.toLowerCase()}`;

    try {
        // 1. Try to get from Redis
        if (redis) {
            try {
                const cachedProfile = await redis.get(cacheKey);
                if (cachedProfile) {
                    console.log(`[Redis] Cache HIT for @${username}`);
                    return NextResponse.json({ ...cachedProfile, fromCache: true });
                }
            } catch (redisError) {
                console.error('[Redis] Error reading cache:', redisError);
            }
        }

        // 2. Fetch from Supabase if not in cache
        console.log(`[Supabase] Cache MISS. Fetching profile for @${username}`);
        const { data, error } = await supabaseAdmin
            .rpc('get_profile_details', {
                profile_username: username,
            })
            .single();

        if (error || !data) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        // 3. Save to Redis (Cache for 10 minutes)
        if (redis) {
            try {
                await redis.set(cacheKey, data, { ex: 600 });
                console.log(`[Redis] Cached profile for @${username}`);
            } catch (redisError) {
                console.error('[Redis] Error writing to cache:', redisError);
            }
        }

        return NextResponse.json({ ...data, fromCache: false });
    } catch (error) {
        console.error('Profile API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// Optional: POST to invalidate cache
export async function POST(
    req: NextRequest,
    { params }: { params: any }
) {
    const resolvedParams = await params;
    const username = resolvedParams.username;

    if (!username) return NextResponse.json({ error: 'Username required' }, { status: 400 });

    const cacheKey = `profile:${username.toLowerCase()}`;

    if (redis) {
        await redis.del(cacheKey);
        console.log(`[Redis] Cache invalidated for @${username}`);
    }

    return NextResponse.json({ message: 'Cache invalidated' });
}
