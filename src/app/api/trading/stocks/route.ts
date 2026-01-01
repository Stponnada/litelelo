// src/app/api/trading/stocks/route.ts
// API route for fetching stock quotes and market data

import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb, COLLECTIONS } from '@/services/mongodb';
import { getStockQuote, SP500_STOCKS, StockQuote } from '@/services/stockApi';

const CACHE_DURATION_MS = 60 * 1000; // 1 minute cache

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const symbol = searchParams.get('symbol');
        const all = searchParams.get('all');

        let db = null;
        try {
            db = await getMongoDb();
        } catch (mongoErr) {
            console.error('Stock API: MongoDB connection failed, falling back to direct API fetch:', mongoErr);
        }

        if (symbol) {
            // Fetch single stock quote
            if (db) {
                const cached = await db.collection(COLLECTIONS.STOCK_CACHE).findOne({
                    symbol,
                    expires_at: { $gt: new Date() }
                });

                if (cached) {
                    return NextResponse.json(cached.data);
                }
            }

            const quote = await getStockQuote(symbol);
            if (!quote) {
                console.error(`Stock API: Failed to fetch quote for ${symbol} - check API key and Finnhub status`);
                return NextResponse.json({ error: 'Stock not found or provider error' }, { status: 404 });
            }

            // Cache the result if DB is available
            if (db) {
                try {
                    await db.collection(COLLECTIONS.STOCK_CACHE).updateOne(
                        { symbol },
                        {
                            $set: {
                                symbol,
                                data: quote,
                                cached_at: new Date(),
                                expires_at: new Date(Date.now() + CACHE_DURATION_MS),
                            }
                        },
                        { upsert: true }
                    );
                } catch (cacheErr) {
                    console.warn('Stock API: Failed to update cache:', cacheErr);
                }
            }

            return NextResponse.json(quote);

        } else if (all === 'true') {
            // Fetch all S&P 500 stocks
            const quotes: StockQuote[] = [];
            const now = new Date();

            for (const stock of SP500_STOCKS) {
                // Check cache first
                let cached = null;
                if (db) {
                    cached = await db.collection(COLLECTIONS.STOCK_CACHE).findOne({
                        symbol: stock.symbol,
                        expires_at: { $gt: now }
                    });
                }

                if (cached) {
                    quotes.push(cached.data);
                    continue;
                }

                // Fetch fresh data
                const quote = await getStockQuote(stock.symbol);
                if (quote) {
                    quotes.push(quote);

                    // Cache it if DB is available
                    if (db) {
                        try {
                            await db.collection(COLLECTIONS.STOCK_CACHE).updateOne(
                                { symbol: stock.symbol },
                                {
                                    $set: {
                                        symbol: stock.symbol,
                                        data: quote,
                                        cached_at: now,
                                        expires_at: new Date(now.getTime() + CACHE_DURATION_MS),
                                    }
                                },
                                { upsert: true }
                            );
                        } catch (cacheErr) {
                            console.warn(`Stock API: Failed to update cache for ${stock.symbol}:`, cacheErr);
                        }
                    }
                }

                // Small delay to respect rate limits
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            return NextResponse.json({ stocks: quotes });

        } else {
            // Return list of available stocks
            return NextResponse.json({ stocks: SP500_STOCKS });
        }

    } catch (error) {
        console.error('Stock API error:', error);
        return NextResponse.json({ error: 'Failed to fetch stock data' }, { status: 500 });
    }
}
