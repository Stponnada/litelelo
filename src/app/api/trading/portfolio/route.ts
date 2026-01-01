// src/app/api/trading/portfolio/route.ts
// API route for managing user portfolios

import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb, COLLECTIONS } from '@/services/mongodb';
import { createClient } from '@supabase/supabase-js';
import { Document, WithId } from 'mongodb';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const dynamic = 'force-dynamic';

// GET - Fetch user's portfolio
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const queryUserId = searchParams.get('userId');
        const authUserId = request.headers.get('x-user-id');

        const userId = queryUserId || authUserId;
        const isPublicView = !!queryUserId && queryUserId !== authUserId;

        if (!userId) {
            console.error('Portfolio API: [ERROR] No User ID provided in headers or query');
            return NextResponse.json({ error: 'Unauthorized. No User ID provided.' }, { status: 401 });
        }

        console.log(`Portfolio API: Fetching for ${userId} (Public: ${isPublicView})`);

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Get current Supabase balance (Source of Truth for Cash)
        let currentRefBalance = 1000;
        try {
            const { data: profile } = await supabase
                .from('profiles')
                .select('bits_coin_balance')
                .eq('user_id', userId)
                .single();

            if (profile) {
                currentRefBalance = profile.bits_coin_balance ?? 1000;
            }
        } catch (sbError) {
            console.error('Portfolio API: Supabase Profile Fetch Error:', sbError);
        }

        // Connect to MongoDB
        let db;
        try {
            db = await getMongoDb();
        } catch (dbError: any) {
            console.error('Portfolio API: [CRITICAL] MongoDB connection failed:', dbError.message);
            return NextResponse.json({
                error: 'Database unavailable',
                details: dbError.message,
                is_fallback: true,
                cash_balance: currentRefBalance
            }, { status: 503 });
        }

        // Get or create portfolio
        let portfolioData: any = await db.collection(COLLECTIONS.PORTFOLIOS).findOne({ user_id: userId });

        if (!portfolioData) {
            console.log('Portfolio API: Creating new portfolio');
            // Create initial portfolio - sync with Supabase bits_coin_balance
            const newPortfolio = {
                user_id: userId,
                cash_balance: currentRefBalance,
                total_invested: 0,
                total_current_value: 0,
                total_gain_loss: 0,
                total_gain_loss_percent: 0,
                total_taxes_paid: 0,
                created_at: new Date(),
                updated_at: new Date(),
            };

            // Only create if it's not a public view (don't create portfolios for others by just viewing)
            if (!isPublicView) {
                const result = await db.collection(COLLECTIONS.PORTFOLIOS).insertOne(newPortfolio);
                portfolioData = { ...newPortfolio, _id: result.insertedId };
            } else {
                portfolioData = newPortfolio;
            }
        } else if (!isPublicView) {
            console.log('Portfolio API: Syncing existing portfolio');
            // Sync cash balance if it differs from Supabase (allowing for small float differences)
            // Ensure we handle the case where cash_balance might be undefined or string
            const currentPortfolioCash = typeof portfolioData.cash_balance === 'number' ? portfolioData.cash_balance : parseFloat(portfolioData.cash_balance || '0');

            if (Math.abs(currentPortfolioCash - currentRefBalance) > 0.01) {
                console.log(`Portfolio API: Updating balance from ${currentPortfolioCash} to ${currentRefBalance}`);
                await db.collection(COLLECTIONS.PORTFOLIOS).updateOne(
                    { user_id: userId },
                    {
                        $set: {
                            cash_balance: currentRefBalance,
                            updated_at: new Date()
                        }
                    }
                );
                // Update local object to return correct data immediately
                portfolioData.cash_balance = currentRefBalance;
            }
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

    } catch (error: any) {
        console.error('Portfolio fetch CRITICAL error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
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
