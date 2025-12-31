// src/app/api/trading/portfolio/route.ts
// API route for managing user portfolios

import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb, COLLECTIONS } from '@/services/mongodb';
import { createClient } from '@supabase/supabase-js';
import { Document, WithId } from 'mongodb';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET - Fetch user's portfolio
export async function GET(request: NextRequest) {
    try {
        const userId = request.headers.get('x-user-id');
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const db = await getMongoDb();

        // Get or create portfolio
        let portfolioData: WithId<Document> | null = await db.collection(COLLECTIONS.PORTFOLIOS).findOne({ user_id: userId });

        if (!portfolioData) {
            // Create initial portfolio - sync with Supabase bits_coin_balance
            const supabase = createClient(supabaseUrl, supabaseServiceKey);
            const { data: profile } = await supabase
                .from('profiles')
                .select('bits_coin_balance')
                .eq('user_id', userId)
                .single();

            const initialBalance = profile?.bits_coin_balance || 1000;

            const newPortfolio = {
                user_id: userId,
                cash_balance: initialBalance,
                total_invested: 0,
                total_current_value: 0,
                total_gain_loss: 0,
                total_gain_loss_percent: 0,
                total_taxes_paid: 0,
                created_at: new Date(),
                updated_at: new Date(),
            };

            const result = await db.collection(COLLECTIONS.PORTFOLIOS).insertOne(newPortfolio);
            portfolioData = { ...newPortfolio, _id: result.insertedId };
        }

        // Get holdings
        const holdings = await db.collection(COLLECTIONS.HOLDINGS)
            .find({ user_id: userId })
            .toArray();

        // Get recent transactions
        const transactions = await db.collection(COLLECTIONS.TRANSACTIONS)
            .find({ user_id: userId })
            .sort({ created_at: -1 })
            .limit(20)
            .toArray();

        return NextResponse.json({
            portfolio: portfolioData,
            holdings,
            transactions,
        });

    } catch (error) {
        console.error('Portfolio fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch portfolio' }, { status: 500 });
    }
}

// POST - Initialize/sync portfolio
export async function POST(request: NextRequest) {
    try {
        const userId = request.headers.get('x-user-id');
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const db = await getMongoDb();
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Get current Supabase balance
        const { data: profile } = await supabase
            .from('profiles')
            .select('bits_coin_balance')
            .eq('user_id', userId)
            .single();

        const currentBalance = profile?.bits_coin_balance || 1000;

        // Check if portfolio exists
        const existingPortfolio = await db.collection(COLLECTIONS.PORTFOLIOS).findOne({ user_id: userId });

        if (existingPortfolio) {
            // Update cash balance to match Supabase
            await db.collection(COLLECTIONS.PORTFOLIOS).updateOne(
                { user_id: userId },
                {
                    $set: {
                        cash_balance: currentBalance,
                        updated_at: new Date()
                    }
                }
            );
        } else {
            // Create new portfolio
            await db.collection(COLLECTIONS.PORTFOLIOS).insertOne({
                user_id: userId,
                cash_balance: currentBalance,
                total_invested: 0,
                total_current_value: 0,
                total_gain_loss: 0,
                total_gain_loss_percent: 0,
                total_taxes_paid: 0,
                created_at: new Date(),
                updated_at: new Date(),
            });
        }

        return NextResponse.json({ success: true, balance: currentBalance });

    } catch (error) {
        console.error('Portfolio sync error:', error);
        return NextResponse.json({ error: 'Failed to sync portfolio' }, { status: 500 });
    }
}
