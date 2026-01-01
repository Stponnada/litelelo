// src/services/mongodb.ts
import { MongoClient, Db } from 'mongodb';

// MongoDB connection string - you'll need to add MONGODB_URI to your .env.local
const MONGODB_URI = process.env.NEXT_PUBLIC_MONGODB_URI || '';
const DB_NAME = 'litelelo_trading';

// Use a global variable to persist the connection across hot reloads in development
// and across serverless function invocations in production.
let cachedClient: MongoClient | null = (global as any).mongoClient || null;
let cachedDb: Db | null = (global as any).mongoDb || null;

export async function connectToMongoDB(): Promise<Db> {
    if (cachedDb) return cachedDb;

    if (!MONGODB_URI) {
        throw new Error('MongoDB URI not configured. Please add NEXT_PUBLIC_MONGODB_URI to your .env.local');
    }

    try {
        console.log('Portfolio API: Attempting to connect to MongoDB...');

        if (!cachedClient) {
            cachedClient = new MongoClient(MONGODB_URI, {
                connectTimeoutMS: 15000, // Increased to 15s
                serverSelectionTimeoutMS: 15000,
                socketTimeoutMS: 15000,
            });
            (global as any).mongoClient = cachedClient;
        }

        await cachedClient.connect();
        cachedDb = cachedClient.db(DB_NAME);
        (global as any).mongoDb = cachedDb;

        console.log('Portfolio API: Connected to MongoDB successfully');
        return cachedDb;
    } catch (error) {
        console.error('Portfolio API: MongoDB connection error:', error);
        // Don't reset everything immediately, but allow one retry
        cachedClient = null;
        cachedDb = null;
        (global as any).mongoClient = null;
        (global as any).mongoDb = null;
        throw error;
    }
}

export async function getMongoDb(): Promise<Db> {
    return connectToMongoDB();
}

// Collection names
export const COLLECTIONS = {
    PORTFOLIOS: 'portfolios',
    HOLDINGS: 'holdings',
    TRANSACTIONS: 'transactions',
    STOCK_CACHE: 'stock_cache',
    WATCHLIST: 'watchlist'
} as const;
