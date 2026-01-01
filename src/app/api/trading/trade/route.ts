// src/app/api/trading/trade/route.ts
// API route for executing buy/sell trades

import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb, COLLECTIONS } from '@/services/mongodb';
import { createClient } from '@supabase/supabase-js';
import { getStockQuote, calculateNetProceeds, TAX_RATE, SP500_STOCKS } from '@/services/stockApi';
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
    try {
        const userId = request.headers.get('x-user-id');
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { symbol, quantity: quantityRaw, type } = body;

        // Validate input
        const quantity = parseInt(quantityRaw);
        if (!symbol || isNaN(quantity) || !type || quantity <= 0) {
            return NextResponse.json({ error: 'Invalid trade parameters' }, { status: 400 });
        }

        if (!['buy', 'sell'].includes(type)) {
            return NextResponse.json({ error: 'Invalid trade type' }, { status: 400 });
        }

        const db = await getMongoDb();
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Get current Supabase balance (Source of Truth for Cash)
        let currentRefBalance = 1000;
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('bits_coin_balance')
            .eq('user_id', userId)
            .single();

        if (profileError) {
            console.error(`Trade API: Failed to fetch profile for ${userId} from Supabase:`, profileError);
            return NextResponse.json({ error: 'Could not fetch user balance from Supabase' }, { status: 500 });
        }

        if (profile) {
            currentRefBalance = profile.bits_coin_balance ?? 1000;
        }

        // Get current stock price
        const quote = await getStockQuote(symbol);
        if (!quote || quote.currentPrice <= 0) {
            return NextResponse.json({ error: 'Could not fetch current stock price' }, { status: 400 });
        }

        const currentPrice = Number(quote.currentPrice);
        const stockInfo = SP500_STOCKS.find(s => s.symbol === symbol);
        const stockName = stockInfo?.name || symbol;

        // Get or Sync user's portfolio in MongoDB
        let portfolio = await db.collection(COLLECTIONS.PORTFOLIOS).findOne({ user_id: userId });

        if (!portfolio) {
            // Initialize portfolio
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
            const result = await db.collection(COLLECTIONS.PORTFOLIOS).insertOne(newPortfolio);
            portfolio = { ...newPortfolio, _id: result.insertedId };
        } else {
            // Sync cash balance with Supabase if it differs (important for consistency)
            const mongoCash = typeof portfolio.cash_balance === 'number' ? portfolio.cash_balance : parseFloat(portfolio.cash_balance || '0');
            if (Math.abs(mongoCash - currentRefBalance) > 0.01) {
                console.log(`Trade API: Syncing Mongo cash balance from ${mongoCash} to ${currentRefBalance}`);
                await db.collection(COLLECTIONS.PORTFOLIOS).updateOne(
                    { user_id: userId },
                    { $set: { cash_balance: currentRefBalance, updated_at: new Date() } }
                );
                portfolio.cash_balance = currentRefBalance;
            }
        }

        if (type === 'buy') {
            const totalCost = currentPrice * quantity;

            // Check if user has enough cash
            if (portfolio.cash_balance < totalCost) {
                return NextResponse.json({
                    error: `Insufficient funds. You need $${totalCost.toFixed(2)} but only have $${portfolio.cash_balance.toFixed(2)}`
                }, { status: 400 });
            }

            // Update or create holding
            const existingHolding = await db.collection(COLLECTIONS.HOLDINGS).findOne({
                user_id: userId,
                symbol
            });

            if (existingHolding) {
                // Calculate new average price
                const existingQuantity = Number(existingHolding.quantity);
                const existingAvgPrice = Number(existingHolding.average_buy_price);
                const totalShares = existingQuantity + quantity;
                const newAvgPrice = (
                    (existingAvgPrice * existingQuantity) +
                    (currentPrice * quantity)
                ) / totalShares;

                await db.collection(COLLECTIONS.HOLDINGS).updateOne(
                    { user_id: userId, symbol },
                    {
                        $set: {
                            quantity: totalShares,
                            average_buy_price: newAvgPrice,
                            current_price: currentPrice,
                            total_invested: newAvgPrice * totalShares,
                            current_value: currentPrice * totalShares,
                            unrealized_gain_loss: (currentPrice - newAvgPrice) * totalShares,
                            unrealized_gain_loss_percent: ((currentPrice - newAvgPrice) / newAvgPrice) * 100,
                            updated_at: new Date(),
                        }
                    }
                );
            } else {
                // Create new holding
                await db.collection(COLLECTIONS.HOLDINGS).insertOne({
                    id: uuidv4(),
                    user_id: userId,
                    symbol,
                    name: stockName,
                    quantity,
                    average_buy_price: currentPrice,
                    current_price: currentPrice,
                    total_invested: currentPrice * quantity,
                    current_value: currentPrice * quantity,
                    unrealized_gain_loss: 0,
                    unrealized_gain_loss_percent: 0,
                    created_at: new Date(),
                    updated_at: new Date(),
                });
            }

            // Deduct from cash balance in MongoDB
            const newCashBalance = Number(portfolio.cash_balance) - totalCost;

            await db.collection(COLLECTIONS.PORTFOLIOS).updateOne(
                { user_id: userId },
                {
                    $set: {
                        cash_balance: newCashBalance,
                        updated_at: new Date()
                    },
                    $inc: {
                        total_invested: totalCost,
                    }
                }
            );

            // Deduct from Supabase bits_coin_balance
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ bits_coin_balance: newCashBalance })
                .eq('user_id', userId);

            if (updateError) {
                console.error('Trade API: Failed to update Supabase balance:', updateError);
                // We don't roll back the trade here to avoid complex state management, 
                // but logging it is critical. The next sync will fix it.
            }

            // Record transaction
            const transaction = {
                id: uuidv4(),
                user_id: userId,
                type: 'buy',
                symbol,
                name: stockName,
                quantity,
                price_per_share: currentPrice,
                total_amount: totalCost,
                created_at: new Date(),
            };
            await db.collection(COLLECTIONS.TRANSACTIONS).insertOne(transaction);

            return NextResponse.json({
                success: true,
                message: `Bought ${quantity} shares of ${symbol} at $${currentPrice.toFixed(2)}`,
                transaction,
                new_balance: newCashBalance,
            });

        } else if (type === 'sell') {
            // Check if user has enough shares
            const holding = await db.collection(COLLECTIONS.HOLDINGS).findOne({
                user_id: userId,
                symbol
            });

            if (!holding || Number(holding.quantity) < quantity) {
                return NextResponse.json({
                    error: `Insufficient shares. You have ${holding?.quantity || 0} shares of ${symbol}`
                }, { status: 400 });
            }

            const holdingQuantity = Number(holding.quantity);
            const holdingAvgPrice = Number(holding.average_buy_price);

            // Calculate profit and tax
            const { grossProfit, taxAmount, netProfit } = calculateNetProceeds(
                currentPrice,
                holdingAvgPrice,
                quantity
            );

            const totalProceeds = (currentPrice * quantity) - taxAmount;
            const remainingQuantity = holdingQuantity - quantity;

            if (remainingQuantity === 0) {
                // Delete holding
                await db.collection(COLLECTIONS.HOLDINGS).deleteOne({
                    user_id: userId,
                    symbol
                });
            } else {
                // Update holding
                await db.collection(COLLECTIONS.HOLDINGS).updateOne(
                    { user_id: userId, symbol },
                    {
                        $set: {
                            quantity: remainingQuantity,
                            current_price: currentPrice,
                            current_value: currentPrice * remainingQuantity,
                            unrealized_gain_loss: (currentPrice - holdingAvgPrice) * remainingQuantity,
                            unrealized_gain_loss_percent: ((currentPrice - holdingAvgPrice) / holdingAvgPrice) * 100,
                            updated_at: new Date(),
                        }
                    }
                );
            }

            // Add to cash balance (after tax)
            const newCashBalance = Number(portfolio.cash_balance) + totalProceeds;

            await db.collection(COLLECTIONS.PORTFOLIOS).updateOne(
                { user_id: userId },
                {
                    $set: {
                        cash_balance: newCashBalance,
                        updated_at: new Date()
                    },
                    $inc: {
                        total_taxes_paid: taxAmount,
                        total_gain_loss: netProfit,
                    }
                }
            );

            // Update Supabase bits_coin_balance
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ bits_coin_balance: newCashBalance })
                .eq('user_id', userId);

            if (updateError) {
                console.error('Trade API: Failed to update Supabase balance:', updateError);
            }

            // Record transaction
            const transaction = {
                id: uuidv4(),
                user_id: userId,
                type: 'sell',
                symbol,
                name: stockName,
                quantity,
                price_per_share: currentPrice,
                total_amount: currentPrice * quantity,
                gross_profit: grossProfit,
                tax_amount: taxAmount,
                tax_rate: TAX_RATE,
                net_profit: netProfit,
                created_at: new Date(),
            };
            await db.collection(COLLECTIONS.TRANSACTIONS).insertOne(transaction);

            return NextResponse.json({
                success: true,
                message: `Sold ${quantity} shares of ${symbol} at $${currentPrice.toFixed(2)}. Profit: $${grossProfit.toFixed(2)}, Tax: $${taxAmount.toFixed(2)} (${(TAX_RATE * 100)}%)`,
                transaction,
                new_balance: newCashBalance,
                gross_profit: grossProfit,
                tax_amount: taxAmount,
                net_profit: netProfit,
            });
        }

        return NextResponse.json({ error: 'Invalid trade type' }, { status: 400 });

    } catch (error: any) {
        console.error('Trade execution error:', error);
        return NextResponse.json({
            error: 'Failed to execute trade',
            details: error.message
        }, { status: 500 });
    }
}
