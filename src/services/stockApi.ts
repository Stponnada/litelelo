// src/services/stockApi.ts
// Stock market API service using Finnhub for real-time S&P 500 data

const FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY || '';
const BASE_URL = 'https://finnhub.io/api/v1';

// Popular S&P 500 stocks with their info
export const SP500_STOCKS = [
    { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
    { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer Discretionary' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'Technology' },
    { symbol: 'META', name: 'Meta Platforms Inc.', sector: 'Technology' },
    { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Consumer Discretionary' },
    { symbol: 'BRK.B', name: 'Berkshire Hathaway', sector: 'Financials' },
    { symbol: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Financials' },
    { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare' },
    { symbol: 'V', name: 'Visa Inc.', sector: 'Financials' },
    { symbol: 'PG', name: 'Procter & Gamble', sector: 'Consumer Staples' },
    { symbol: 'MA', name: 'Mastercard Inc.', sector: 'Financials' },
    { symbol: 'HD', name: 'Home Depot Inc.', sector: 'Consumer Discretionary' },
    { symbol: 'UNH', name: 'UnitedHealth Group', sector: 'Healthcare' },
    { symbol: 'DIS', name: 'Walt Disney Co.', sector: 'Communication Services' },
    { symbol: 'NFLX', name: 'Netflix Inc.', sector: 'Communication Services' },
    { symbol: 'CRM', name: 'Salesforce Inc.', sector: 'Technology' },
    { symbol: 'AMD', name: 'Advanced Micro Devices', sector: 'Technology' },
    { symbol: 'INTC', name: 'Intel Corporation', sector: 'Technology' },
    { symbol: 'BA', name: 'Boeing Co.', sector: 'Industrials' },
    { symbol: 'KO', name: 'Coca-Cola Co.', sector: 'Consumer Staples' },
    { symbol: 'PEP', name: 'PepsiCo Inc.', sector: 'Consumer Staples' },
    { symbol: 'COST', name: 'Costco Wholesale', sector: 'Consumer Staples' },
    { symbol: 'WMT', name: 'Walmart Inc.', sector: 'Consumer Staples' },
];

export interface StockQuote {
    symbol: string;
    name: string;
    sector: string;
    currentPrice: number;
    change: number;
    percentChange: number;
    highPrice: number;
    lowPrice: number;
    openPrice: number;
    previousClose: number;
    timestamp: number;
}

export interface CompanyProfile {
    symbol: string;
    name: string;
    logo: string;
    marketCap: number;
    industry: string;
    weburl: string;
}

// Helper for retry logic
async function fetchWithRetry(url: string, retries = 3, backoff = 300): Promise<Response> {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url);
            // 429 is Rate Limit Exceeded - definitely retry
            if (response.status === 429) {
                const retryAfter = response.headers.get('Retry-After');
                const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : backoff * Math.pow(2, i);
                console.warn(`Rate limited. Retrying after ${waitTime}ms...`);
                await new Promise(r => setTimeout(r, waitTime));
                continue;
            }
            if (response.ok) return response;
            // retry on 5xx errors
            if (response.status >= 500) {
                await new Promise(r => setTimeout(r, backoff * Math.pow(2, i)));
                continue;
            }
            // For other errors (4xx), return immediately as they are likely permanent
            return response;
        } catch (err) {
            // Network errors - retry
            if (i === retries - 1) throw err;
            await new Promise(r => setTimeout(r, backoff * Math.pow(2, i)));
        }
    }
    throw new Error(`Failed after ${retries} retries`);
}

// Fetch real-time quote for a stock
export async function getStockQuote(symbol: string): Promise<StockQuote | null> {
    try {
        const url = `${BASE_URL}/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
        const response = await fetchWithRetry(url);
        if (!response.ok) throw new Error(`API responded with ${response.status}`);

        const data = await response.json();

        // Finnhub sometimes returns all 0s for invalid calls or missing data
        if (data.c === 0 && data.h === 0 && data.l === 0) {
            console.warn(`Received empty data for ${symbol}, retrying once...`);
            // Circuit breaker: Wait 2s and try one last time with simple fetch
            await new Promise(r => setTimeout(r, 2000));
            const retryRes = await fetch(`${BASE_URL}/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`);
            if (retryRes.ok) {
                const retryData = await retryRes.json();
                if (retryData.c !== 0) return formatQuote(retryData, symbol);
            }
            throw new Error('Received persistent empty data from provider');
        }

        return formatQuote(data, symbol);
    } catch (error) {
        console.error(`Failed to fetch quote for ${symbol}:`, error);
        return null;
    }
}

function formatQuote(data: any, symbol: string): StockQuote {
    const stockInfo = SP500_STOCKS.find(s => s.symbol === symbol);
    return {
        symbol,
        name: stockInfo?.name || symbol,
        sector: stockInfo?.sector || 'Unknown',
        currentPrice: data.c,
        change: data.d,
        percentChange: data.dp,
        highPrice: data.h,
        lowPrice: data.l,
        openPrice: data.o,
        previousClose: data.pc,
        timestamp: data.t * 1000,
    };
}

// Fetch quotes for multiple stocks (batched to respect rate limits)
export async function getMultipleQuotes(symbols: string[]): Promise<Map<string, StockQuote>> {
    const quotes = new Map<string, StockQuote>();

    // Batch requests with delay to respect rate limits (60 calls/min)
    for (let i = 0; i < symbols.length; i++) {
        const quote = await getStockQuote(symbols[i]);
        if (quote) {
            quotes.set(symbols[i], quote);
        }
        // Add small delay between requests
        if (i < symbols.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    return quotes;
}

// Get company profile/logo
export async function getCompanyProfile(symbol: string): Promise<CompanyProfile | null> {
    try {
        const response = await fetch(`${BASE_URL}/stock/profile2?symbol=${symbol}&token=${FINNHUB_API_KEY}`);
        if (!response.ok) throw new Error('Failed to fetch profile');

        const data = await response.json();

        return {
            symbol: data.ticker,
            name: data.name,
            logo: data.logo,
            marketCap: data.marketCapitalization,
            industry: data.finnhubIndustry,
            weburl: data.weburl,
        };
    } catch (error) {
        console.error(`Failed to fetch profile for ${symbol}:`, error);
        return null;
    }
}

// Search for stocks
export async function searchStocks(query: string): Promise<Array<{ symbol: string; description: string }>> {
    try {
        const response = await fetch(`${BASE_URL}/search?q=${query}&token=${FINNHUB_API_KEY}`);
        if (!response.ok) throw new Error('Failed to search');

        const data = await response.json();
        return data.result?.slice(0, 10) || [];
    } catch (error) {
        console.error('Stock search failed:', error);
        return [];
    }
}

// Tax calculation constants
export const TAX_RATE = 0.22; // 22% - middle bracket for short-term capital gains

export function calculateTax(gainAmount: number): number {
    if (gainAmount <= 0) return 0;
    return gainAmount * TAX_RATE;
}

// Calculate net proceeds after tax
export function calculateNetProceeds(sellPrice: number, buyPrice: number, quantity: number): {
    grossProfit: number;
    taxAmount: number;
    netProfit: number;
} {
    const grossProfit = (sellPrice - buyPrice) * quantity;
    const taxAmount = grossProfit > 0 ? calculateTax(grossProfit) : 0;
    const netProfit = grossProfit - taxAmount;

    return { grossProfit, taxAmount, netProfit };
}
