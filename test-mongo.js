const { MongoClient } = require('mongodb');

const MONGODB_URI = "***REMOVED***";
const DB_NAME = 'litelelo_trading';

async function test() {
    console.log('Testing MongoDB connection...');
    const client = new MongoClient(MONGODB_URI);
    try {
        await client.connect();
        console.log('Connected successfully to MongoDB');
        const db = client.db(DB_NAME);
        const collections = await db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));
    } catch (err) {
        console.error('Connection error:', err);
    } finally {
        await client.close();
    }
}

test();
