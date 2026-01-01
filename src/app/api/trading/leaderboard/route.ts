// src/app/api/trading/leaderboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb, COLLECTIONS } from '@/services/mongodb';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 1. Fetch all user profiles from Supabase
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('user_id, username, full_name, avatar_url, bits_coin_balance')
            .order('bits_coin_balance', { ascending: false });

        if (profilesError) {
            console.error('Leaderboard API: Failed to fetch profiles:', profilesError);
            return NextResponse.json({ error: 'Failed to fetch user profiles' }, { status: 500 });
        }

        // 2. Try to fetch holdings from MongoDB for stock value calculation
        let allHoldings: any[] = [];
        let mongodbAvailable = false;
        try {
            const db = await getMongoDb();
            if (db) {
                allHoldings = await db.collection(COLLECTIONS.HOLDINGS).find({}).toArray();
                mongodbAvailable = true;
            }
        } catch (mongoError) {
            console.warn('Leaderboard API: MongoDB unavailable, falling back to cash only:', mongoError);
        }

        // 3. Aggregate net worth
        const leaderboard = profiles.map(profile => {
            const userHoldings = allHoldings.filter(h => h.user_id === profile.user_id);
            const stockValue = userHoldings.reduce((sum, h) => sum + (Number(h.current_value) || 0), 0);

            // Use the balance from Supabase profile as the source of truth for cash
            const cashBalance = profile.bits_coin_balance || 0;
            const totalNetWorth = cashBalance + stockValue;

            return {
                user_id: profile.user_id,
                username: profile.username,
                full_name: profile.full_name,
                avatar_url: profile.avatar_url,
                cash_balance: cashBalance,
                stock_value: stockValue,
                total_net_worth: totalNetWorth,
            };
        });

        // 4. Sort by total net worth descending
        leaderboard.sort((a, b) => b.total_net_worth - a.total_net_worth);

        return NextResponse.json({
            leaderboard: leaderboard.slice(0, 50), // Return top 50
            mongodb_status: mongodbAvailable ? 'connected' : 'unavailable'
        });

    } catch (error: any) {
        console.error('Leaderboard API CRITICAL error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
