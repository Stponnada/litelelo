// src/services/mongodb.ts
import { MongoClient, Db } from 'mongodb';

// MongoDB connection string - you'll need to add MONGODB_URI to your .env.local
const MONGODB_URI = process.env.NEXT_PUBLIC_MONGODB_URI || '';
const DB_NAME = 'litelelo_trading';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectToMongoDB(): Promise<Db> {
    if (db) return db;

    if (!MONGODB_URI) {
        throw new Error('MongoDB URI not configured. Please add NEXT_PUBLIC_MONGODB_URI to your .env.local');
    }

    try {
        console.log('Portfolio API: Attempting to connect to MongoDB...');
        client = new MongoClient(MONGODB_URI, {
            connectTimeoutMS: 5000,
            serverSelectionTimeoutMS: 5000,
        });
        await client.connect();
        db = client.db(DB_NAME);
        console.log('Portfolio API: Connected to MongoDB successfully');
        return db;
    } catch (error) {
        console.error('Portfolio API: MongoDB connection error:', error);
        throw error;
    }
}

export async function getMongoDb(): Promise<Db> {
    if (!db) {
        return connectToMongoDB();
    }
    return db;
}

// Collection names
export const COLLECTIONS = {
    PORTFOLIOS: 'portfolios',
    HOLDINGS: 'holdings',
    TRANSACTIONS: 'transactions',
    STOCK_CACHE: 'stock_cache',
    WATCHLIST: 'watchlist'
} as const;
