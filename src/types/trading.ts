// src/types/trading.ts
// Types for the paper trading feature

export interface Portfolio {
    user_id: string;
    cash_balance: number; // Available Bits-Coin for trading
    total_invested: number;
    total_current_value: number;
    total_gain_loss: number;
    total_gain_loss_percent: number;
    created_at: Date;
    updated_at: Date;
}

export interface StockHolding {
    id: string;
    user_id: string;
    symbol: string;
    name: string;
    quantity: number;
    average_buy_price: number;
    current_price: number;
    total_invested: number;
    current_value: number;
    unrealized_gain_loss: number;
    unrealized_gain_loss_percent: number;
    created_at: Date;
    updated_at: Date;
}

export interface Transaction {
    id: string;
    user_id: string;
    type: 'buy' | 'sell';
    symbol: string;
    name: string;
    quantity: number;
    price_per_share: number;
    total_amount: number;
    // For sell transactions
    gross_profit?: number;
    tax_amount?: number;
    net_profit?: number;
    created_at: Date;
}

export interface WatchlistItem {
    user_id: string;
    symbol: string;
    name: string;
    added_at: Date;
}

export interface StockCacheEntry {
    symbol: string;
    data: {
        currentPrice: number;
        change: number;
        percentChange: number;
        highPrice: number;
        lowPrice: number;
    };
    cached_at: Date;
    expires_at: Date;
}

export interface TradeRequest {
    symbol: string;
    quantity: number;
    type: 'buy' | 'sell';
}

export interface TradeResult {
    success: boolean;
    message: string;
    transaction?: Transaction;
    new_balance?: number;
    error?: string;
}

export interface PortfolioSummary {
    portfolio: Portfolio;
    holdings: StockHolding[];
    recent_transactions: Transaction[];
    performance: {
        today_change: number;
        today_change_percent: number;
        all_time_gain_loss: number;
        all_time_gain_loss_percent: number;
        total_taxes_paid: number;
    };
}
