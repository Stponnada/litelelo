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
        const { symbol, quantity, type } = body;

        // Validate input
        if (!symbol || !quantity || !type || quantity <= 0) {
            return NextResponse.json({ error: 'Invalid trade parameters' }, { status: 400 });
        }

        if (!['buy', 'sell'].includes(type)) {
            return NextResponse.json({ error: 'Invalid trade type' }, { status: 400 });
        }

        const db = await getMongoDb();
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Get current stock price
        const quote = await getStockQuote(symbol);
        if (!quote || quote.currentPrice <= 0) {
            return NextResponse.json({ error: 'Could not fetch current stock price' }, { status: 400 });
        }

        const currentPrice = quote.currentPrice;
        const stockInfo = SP500_STOCKS.find(s => s.symbol === symbol);
        const stockName = stockInfo?.name || symbol;

        // Get user's portfolio
        let portfolio = await db.collection(COLLECTIONS.PORTFOLIOS).findOne({ user_id: userId });

        if (!portfolio) {
            // Initialize portfolio
            const { data: profile } = await supabase
                .from('profiles')
                .select('bits_coin_balance')
                .eq('user_id', userId)
                .single();

            const newPortfolio = {
                user_id: userId,
                cash_balance: profile?.bits_coin_balance || 200,
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
                const totalShares = existingHolding.quantity + quantity;
                const newAvgPrice = (
                    (existingHolding.average_buy_price * existingHolding.quantity) +
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

            // Deduct from cash balance
            await db.collection(COLLECTIONS.PORTFOLIOS).updateOne(
                { user_id: userId },
                {
                    $inc: {
                        cash_balance: -totalCost,
                        total_invested: totalCost,
                    },
                    $set: { updated_at: new Date() }
                }
            );

            // Deduct from Supabase bits_coin_balance
            await supabase
                .from('profiles')
                .update({ bits_coin_balance: portfolio.cash_balance - totalCost })
                .eq('user_id', userId);

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
                new_balance: portfolio.cash_balance - totalCost,
            });

        } else if (type === 'sell') {
            // Check if user has enough shares
            const holding = await db.collection(COLLECTIONS.HOLDINGS).findOne({
                user_id: userId,
                symbol
            });

            if (!holding || holding.quantity < quantity) {
                return NextResponse.json({
                    error: `Insufficient shares. You have ${holding?.quantity || 0} shares of ${symbol}`
                }, { status: 400 });
            }

            // Calculate profit and tax
            const { grossProfit, taxAmount, netProfit } = calculateNetProceeds(
                currentPrice,
                holding.average_buy_price,
                quantity
            );

            const totalProceeds = (currentPrice * quantity) - taxAmount;
            const remainingQuantity = holding.quantity - quantity;

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
                            unrealized_gain_loss: (currentPrice - holding.average_buy_price) * remainingQuantity,
                            unrealized_gain_loss_percent: ((currentPrice - holding.average_buy_price) / holding.average_buy_price) * 100,
                            updated_at: new Date(),
                        }
                    }
                );
            }

            // Add to cash balance (after tax)
            const newCashBalance = portfolio.cash_balance + totalProceeds;

            await db.collection(COLLECTIONS.PORTFOLIOS).updateOne(
                { user_id: userId },
                {
                    $inc: {
                        cash_balance: totalProceeds,
                        total_taxes_paid: taxAmount,
                        total_gain_loss: netProfit,
                    },
                    $set: { updated_at: new Date() }
                }
            );

            // Update Supabase bits_coin_balance
            await supabase
                .from('profiles')
                .update({ bits_coin_balance: newCashBalance })
                .eq('user_id', userId);

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

    } catch (error) {
        console.error('Trade execution error:', error);
        return NextResponse.json({ error: 'Failed to execute trade' }, { status: 500 });
    }
}
