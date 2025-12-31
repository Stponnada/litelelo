'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Spinner from '@/components/Spinner';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import {
    TrendingUp, TrendingDown, DollarSign, Briefcase, Receipt,
    Search, ArrowUpRight, ArrowDownRight, Wallet, PieChart,
    ChevronRight, Sparkles, ShieldCheck, Activity, Star
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Link from 'next/link';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Types
interface StockQuote {
    symbol: string;
    name: string;
    sector: string;
    currentPrice: number;
    change: number;
    percentChange: number;
}

interface Holding {
    symbol: string;
    name: string;
    quantity: number;
    average_buy_price: number;
    current_price: number;
    current_value: number;
    unrealized_gain_loss: number;
    unrealized_gain_loss_percent: number;
}

interface Transaction {
    id: string;
    type: 'buy' | 'sell';
    symbol: string;
    name: string;
    quantity: number;
    price_per_share: number;
    total_amount: number;
    tax_amount?: number;
    net_profit?: number;
    created_at: string;
}

interface Portfolio {
    cash_balance: number;
    total_invested: number;
    total_taxes_paid: number;
    total_gain_loss: number;
}

// Animated Counter Component
const AnimatedCounter = ({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) => {
    const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
    const displayValue = useTransform(spring, (current) => `${prefix}${current.toFixed(2)}${suffix}`);

    useEffect(() => {
        spring.set(value);
    }, [value, spring]);

    return <motion.span>{displayValue}</motion.span>;
};

// Decrypted Text Effect
const DecryptedText = ({ text }: { text: string }) => {
    const [displayText, setDisplayText] = useState(text);
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890$";

    useEffect(() => {
        let iteration = 0;
        const interval = setInterval(() => {
            setDisplayText(text.split("").map((letter, index) => {
                if (index < iteration) return text[index];
                return chars[Math.floor(Math.random() * chars.length)];
            }).join(""));
            if (iteration >= text.length) clearInterval(interval);
            iteration += 1 / 3;
        }, 30);
        return () => clearInterval(interval);
    }, [text]);

    return <span>{displayText}</span>;
};

// Spotlight Card Component
const SpotlightCard = ({ children, className = "", onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
        const { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }

    const gradientStyle = useTransform(
        [mouseX, mouseY],
        ([x, y]) => `radial-gradient(600px circle at ${x}px ${y}px, rgba(16, 185, 129, 0.1), transparent 60%)`
    );

    return (
        <motion.div
            className={cn("group relative border border-neutral-800 bg-neutral-900/50 overflow-hidden rounded-2xl backdrop-blur-xl", className)}
            onMouseMove={handleMouseMove}
            onClick={onClick}
            whileHover={{ scale: 1.01 }}
            whileTap={onClick ? { scale: 0.99 } : undefined}
        >
            <motion.div
                className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition duration-300 group-hover:opacity-100"
                style={{ background: gradientStyle }}
            />
            <div className="relative h-full">{children}</div>
        </motion.div>
    );
};

// Stock Row Component
const StockRow = ({ stock, onSelect }: { stock: StockQuote; onSelect: (symbol: string) => void }) => {
    const isPositive = stock.change >= 0;

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center justify-between p-4 hover:bg-white/5 rounded-xl cursor-pointer transition-colors group"
            onClick={() => onSelect(stock.symbol)}
        >
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-700 flex items-center justify-center font-bold text-xs text-white">
                    {stock.symbol.slice(0, 2)}
                </div>
                <div>
                    <p className="font-bold text-white group-hover:text-brand-green transition-colors">{stock.symbol}</p>
                    <p className="text-xs text-neutral-500 truncate max-w-[150px]">{stock.name}</p>
                </div>
            </div>
            <div className="text-right">
                <p className="font-mono font-bold text-white">${stock.currentPrice.toFixed(2)}</p>
                <p className={cn("text-xs font-medium flex items-center gap-1 justify-end", isPositive ? "text-green-500" : "text-red-500")}>
                    {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {isPositive ? '+' : ''}{stock.percentChange.toFixed(2)}%
                </p>
            </div>
        </motion.div>
    );
};

// Trade Modal Component
const TradeModal = ({
    stock,
    holding,
    cashBalance,
    onClose,
    onTrade
}: {
    stock: StockQuote;
    holding?: Holding;
    cashBalance: number;
    onClose: () => void;
    onTrade: (symbol: string, quantity: number, type: 'buy' | 'sell') => Promise<void>;
}) => {
    const [quantity, setQuantity] = useState(1);
    const [type, setType] = useState<'buy' | 'sell'>('buy');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const totalCost = stock.currentPrice * quantity;
    const maxBuyQuantity = Math.floor(cashBalance / stock.currentPrice);
    const maxSellQuantity = holding?.quantity || 0;
    const isPositive = stock.change >= 0;
    const estimatedTax = type === 'sell' && holding ?
        Math.max(0, (stock.currentPrice - holding.average_buy_price) * quantity * 0.22) : 0;

    const handleSubmit = async () => {
        setError('');
        setIsSubmitting(true);
        try {
            await onTrade(stock.symbol, quantity, type);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Trade failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-neutral-800 bg-gradient-to-r from-brand-green/10 to-blue-500/10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-white">{stock.symbol}</h2>
                            <p className="text-sm text-neutral-400">{stock.name}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-mono font-bold text-white">${stock.currentPrice.toFixed(2)}</p>
                            <p className={cn("text-sm font-medium flex items-center gap-1 justify-end", isPositive ? "text-green-500" : "text-red-500")}>
                                {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                                {isPositive ? '+' : ''}{stock.percentChange.toFixed(2)}%
                            </p>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Buy/Sell Toggle */}
                    <div className="flex gap-2 p-1 bg-neutral-800 rounded-xl">
                        <button
                            onClick={() => setType('buy')}
                            className={cn(
                                "flex-1 py-3 rounded-lg font-bold transition-all",
                                type === 'buy' ? "bg-green-500 text-white" : "text-neutral-400 hover:text-white"
                            )}
                        >
                            Buy
                        </button>
                        <button
                            onClick={() => setType('sell')}
                            disabled={maxSellQuantity === 0}
                            className={cn(
                                "flex-1 py-3 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed",
                                type === 'sell' ? "bg-red-500 text-white" : "text-neutral-400 hover:text-white"
                            )}
                        >
                            Sell {maxSellQuantity > 0 && `(${maxSellQuantity} owned)`}
                        </button>
                    </div>

                    {/* Quantity Input */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Quantity</label>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="w-12 h-12 rounded-xl bg-neutral-800 text-white font-bold hover:bg-neutral-700 transition-colors"
                            >
                                -
                            </button>
                            <input
                                type="number"
                                min="1"
                                max={type === 'buy' ? maxBuyQuantity : maxSellQuantity}
                                value={quantity}
                                onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                className="flex-1 bg-neutral-800 border-none rounded-xl p-4 text-center text-2xl font-mono font-bold text-white focus:ring-2 focus:ring-brand-green outline-none"
                            />
                            <button
                                onClick={() => setQuantity(quantity + 1)}
                                className="w-12 h-12 rounded-xl bg-neutral-800 text-white font-bold hover:bg-neutral-700 transition-colors"
                            >
                                +
                            </button>
                        </div>
                        <div className="flex justify-between text-xs text-neutral-500">
                            <span>Max: {type === 'buy' ? maxBuyQuantity : maxSellQuantity}</span>
                            <button
                                onClick={() => setQuantity(type === 'buy' ? maxBuyQuantity : maxSellQuantity)}
                                className="text-brand-green hover:underline"
                            >
                                Use Max
                            </button>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="bg-neutral-800/50 rounded-xl p-4 space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-neutral-400">Subtotal</span>
                            <span className="font-mono text-white">${totalCost.toFixed(2)}</span>
                        </div>
                        {type === 'sell' && estimatedTax > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-neutral-400">Est. Tax (22%)</span>
                                <span className="font-mono text-red-400">-${estimatedTax.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="border-t border-neutral-700 pt-3 flex justify-between">
                            <span className="text-neutral-400 font-bold">Total</span>
                            <span className="font-mono text-xl font-bold text-white">
                                ${type === 'sell' ? (totalCost - estimatedTax).toFixed(2) : totalCost.toFixed(2)}
                            </span>
                        </div>
                    </div>

                    {/* Your Balance */}
                    <div className="flex items-center justify-between text-sm p-3 bg-brand-green/10 rounded-xl border border-brand-green/20">
                        <span className="text-brand-green flex items-center gap-2">
                            <Wallet className="w-4 h-4" /> Available Balance
                        </span>
                        <span className="font-mono font-bold text-brand-green">${cashBalance.toFixed(2)}</span>
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm bg-red-500/10 p-3 rounded-lg">{error}</div>
                    )}

                    {/* Submit Button */}
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || quantity === 0 || (type === 'buy' && totalCost > cashBalance) || (type === 'sell' && quantity > maxSellQuantity)}
                        className={cn(
                            "w-full py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed",
                            type === 'buy'
                                ? "bg-green-500 hover:bg-green-600 text-white"
                                : "bg-red-500 hover:bg-red-600 text-white"
                        )}
                    >
                        {isSubmitting ? <Spinner className="w-6 h-6 mx-auto" /> : (
                            type === 'buy' ? `Buy ${quantity} Share${quantity > 1 ? 's' : ''}` : `Sell ${quantity} Share${quantity > 1 ? 's' : ''}`
                        )}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

// Main Page Component
const PaperTradingPage: React.FC = () => {
    const { profile, user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stocks, setStocks] = useState<StockQuote[]>([]);
    const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
    const [holdings, setHoldings] = useState<Holding[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStock, setSelectedStock] = useState<StockQuote | null>(null);
    const [activeTab, setActiveTab] = useState<'market' | 'portfolio' | 'history'>('market');
    const [sectorFilter, setSectorFilter] = useState('All');

    // Fetch data
    const fetchData = useCallback(async () => {
        if (!user) return;

        try {
            // Fetch stocks
            const stocksRes = await fetch('/api/trading/stocks?all=true');
            const stocksData = await stocksRes.json();
            if (stocksData.stocks) setStocks(stocksData.stocks);

            // Fetch portfolio
            const portfolioRes = await fetch('/api/trading/portfolio', {
                headers: { 'x-user-id': user.id }
            });
            const portfolioData = await portfolioRes.json();
            if (portfolioData.portfolio) setPortfolio(portfolioData.portfolio);
            if (portfolioData.holdings) setHoldings(portfolioData.holdings);
            if (portfolioData.transactions) setTransactions(portfolioData.transactions);

        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
        // Refresh every 60 seconds
        const interval = setInterval(fetchData, 60000);
        return () => clearInterval(interval);
    }, [fetchData]);

    // Handle trade
    const handleTrade = async (symbol: string, quantity: number, type: 'buy' | 'sell') => {
        if (!user) throw new Error('Not authenticated');

        const res = await fetch('/api/trading/trade', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': user.id
            },
            body: JSON.stringify({ symbol, quantity, type })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        // Refresh data
        await fetchData();
    };

    // Filter stocks
    const filteredStocks = stocks.filter(s => {
        const matchesSearch = s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSector = sectorFilter === 'All' || s.sector === sectorFilter;
        return matchesSearch && matchesSector;
    });

    const sectors = ['All', ...Array.from(new Set(stocks.map(s => s.sector)))];

    // Calculate portfolio value
    const totalPortfolioValue = (portfolio?.cash_balance || 0) +
        holdings.reduce((sum, h) => sum + h.current_value, 0);
    const totalUnrealizedGain = holdings.reduce((sum, h) => sum + h.unrealized_gain_loss, 0);

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
                <Spinner />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-brand-green/30 pb-20">
            {/* Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#151515_1px,transparent_1px),linear-gradient(to_bottom,#151515_1px,transparent_1px)] bg-[size:32px_32px] opacity-30" />
                <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-brand-green/5 via-blue-500/5 to-transparent blur-3xl" />
            </div>

            {/* Trade Modal */}
            <AnimatePresence>
                {selectedStock && portfolio && (
                    <TradeModal
                        stock={selectedStock}
                        holding={holdings.find(h => h.symbol === selectedStock.symbol)}
                        cashBalance={portfolio.cash_balance}
                        onClose={() => setSelectedStock(null)}
                        onTrade={handleTrade}
                    />
                )}
            </AnimatePresence>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
                {/* Header */}
                <header className="mb-12">
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-brand-green text-xs font-mono tracking-widest uppercase">
                                <Sparkles className="w-3 h-3" />
                                PAPER TRADING • EASTER EGG FEATURE
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-200 to-neutral-500">
                                <DecryptedText text="BITS TRADE" />
                            </h1>
                            <p className="text-neutral-400 max-w-lg">
                                Invest your <span className="text-brand-green font-bold">Bits-Coin</span> in real S&P 500 stocks.
                                Paper trade with real-time prices. <span className="text-yellow-400">22% tax</span> on gains.
                            </p>
                        </div>

                        {/* Quick Stats */}
                        <div className="flex gap-4">
                            <div className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-800 rounded-2xl p-4 min-w-[140px]">
                                <p className="text-xs text-neutral-500 uppercase font-bold mb-1">Cash Balance</p>
                                <p className="text-2xl font-bold text-brand-green font-mono">
                                    ${portfolio?.cash_balance.toFixed(2) || '0.00'}
                                </p>
                            </div>
                            <div className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-800 rounded-2xl p-4 min-w-[140px]">
                                <p className="text-xs text-neutral-500 uppercase font-bold mb-1">Portfolio Value</p>
                                <p className="text-2xl font-bold text-white font-mono">
                                    ${totalPortfolioValue.toFixed(2)}
                                </p>
                            </div>
                            <div className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-800 rounded-2xl p-4 min-w-[140px] hidden md:block">
                                <p className="text-xs text-neutral-500 uppercase font-bold mb-1">Total Gain/Loss</p>
                                <p className={cn(
                                    "text-2xl font-bold font-mono",
                                    totalUnrealizedGain >= 0 ? "text-green-500" : "text-red-500"
                                )}>
                                    {totalUnrealizedGain >= 0 ? '+' : ''}${totalUnrealizedGain.toFixed(2)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="mt-8 flex gap-2 p-1 bg-neutral-900/50 backdrop-blur-xl border border-neutral-800 rounded-2xl w-fit">
                        {[
                            { id: 'market', label: 'Market', icon: Activity },
                            { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
                            { id: 'history', label: 'History', icon: Receipt }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as 'market' | 'portfolio' | 'history')}
                                className={cn(
                                    "flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all",
                                    activeTab === tab.id
                                        ? "bg-brand-green text-white"
                                        : "text-neutral-400 hover:text-white"
                                )}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </header>

                {/* Content */}
                <AnimatePresence mode="wait">
                    {activeTab === 'market' && (
                        <motion.div
                            key="market"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-6"
                        >
                            {/* Search & Filter */}
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                                    <input
                                        type="text"
                                        placeholder="Search stocks..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl py-4 pl-12 pr-4 text-white placeholder-neutral-500 focus:ring-2 focus:ring-brand-green outline-none backdrop-blur-xl"
                                    />
                                </div>
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {sectors.slice(0, 6).map(sector => (
                                        <button
                                            key={sector}
                                            onClick={() => setSectorFilter(sector)}
                                            className={cn(
                                                "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all",
                                                sectorFilter === sector
                                                    ? "bg-brand-green text-white"
                                                    : "bg-neutral-800 text-neutral-400 hover:text-white"
                                            )}
                                        >
                                            {sector}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Stock Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredStocks.map((stock, i) => (
                                    <SpotlightCard
                                        key={stock.symbol}
                                        onClick={() => setSelectedStock(stock)}
                                        className="cursor-pointer"
                                    >
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.03 }}
                                            className="p-5"
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neutral-700 to-neutral-800 flex items-center justify-center font-bold text-sm text-white">
                                                        {stock.symbol.slice(0, 2)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-white text-lg">{stock.symbol}</p>
                                                        <p className="text-xs text-neutral-500 truncate max-w-[120px]">{stock.name}</p>
                                                    </div>
                                                </div>
                                                <span className="text-xs px-2 py-1 bg-neutral-800 rounded-lg text-neutral-400">
                                                    {stock.sector.split(' ')[0]}
                                                </span>
                                            </div>
                                            <div className="flex items-end justify-between">
                                                <div>
                                                    <p className="text-3xl font-mono font-bold text-white">
                                                        ${stock.currentPrice.toFixed(2)}
                                                    </p>
                                                </div>
                                                <div className={cn(
                                                    "flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold text-sm",
                                                    stock.change >= 0
                                                        ? "bg-green-500/10 text-green-500"
                                                        : "bg-red-500/10 text-red-500"
                                                )}>
                                                    {stock.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                                    {stock.percentChange >= 0 ? '+' : ''}{stock.percentChange.toFixed(2)}%
                                                </div>
                                            </div>
                                        </motion.div>
                                    </SpotlightCard>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'portfolio' && (
                        <motion.div
                            key="portfolio"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-6"
                        >
                            {holdings.length === 0 ? (
                                <SpotlightCard className="py-16">
                                    <div className="flex flex-col items-center justify-center text-center">
                                        <div className="w-20 h-20 rounded-full bg-neutral-800 flex items-center justify-center mb-6">
                                            <PieChart className="w-10 h-10 text-neutral-600" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-white mb-2">No Holdings Yet</h3>
                                        <p className="text-neutral-400 max-w-md mb-6">
                                            Start building your portfolio by buying stocks from the market.
                                        </p>
                                        <button
                                            onClick={() => setActiveTab('market')}
                                            className="px-6 py-3 bg-brand-green text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors"
                                        >
                                            Browse Stocks
                                        </button>
                                    </div>
                                </SpotlightCard>
                            ) : (
                                <div className="space-y-4">
                                    {holdings.map((holding, i) => {
                                        const stock = stocks.find(s => s.symbol === holding.symbol);
                                        return (
                                            <SpotlightCard
                                                key={holding.symbol}
                                                onClick={() => stock && setSelectedStock(stock)}
                                                className="cursor-pointer"
                                            >
                                                <motion.div
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.05 }}
                                                    className="p-6 flex items-center justify-between"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-green/20 to-blue-500/20 flex items-center justify-center font-bold text-lg text-white border border-neutral-700">
                                                            {holding.symbol.slice(0, 2)}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-white text-lg">{holding.symbol}</p>
                                                            <p className="text-sm text-neutral-400">{holding.quantity} shares @ ${holding.average_buy_price.toFixed(2)}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-2xl font-mono font-bold text-white">${holding.current_value.toFixed(2)}</p>
                                                        <p className={cn(
                                                            "text-sm font-bold flex items-center gap-1 justify-end",
                                                            holding.unrealized_gain_loss >= 0 ? "text-green-500" : "text-red-500"
                                                        )}>
                                                            {holding.unrealized_gain_loss >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                                                            {holding.unrealized_gain_loss >= 0 ? '+' : ''}${holding.unrealized_gain_loss.toFixed(2)} ({holding.unrealized_gain_loss_percent.toFixed(2)}%)
                                                        </p>
                                                    </div>
                                                </motion.div>
                                            </SpotlightCard>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Portfolio Summary */}
                            {holdings.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                                    <SpotlightCard className="p-6">
                                        <p className="text-xs text-neutral-500 uppercase font-bold mb-2">Total Invested</p>
                                        <p className="text-3xl font-mono font-bold text-white">
                                            ${holdings.reduce((s, h) => s + h.average_buy_price * h.quantity, 0).toFixed(2)}
                                        </p>
                                    </SpotlightCard>
                                    <SpotlightCard className="p-6">
                                        <p className="text-xs text-neutral-500 uppercase font-bold mb-2">Unrealized P/L</p>
                                        <p className={cn(
                                            "text-3xl font-mono font-bold",
                                            totalUnrealizedGain >= 0 ? "text-green-500" : "text-red-500"
                                        )}>
                                            {totalUnrealizedGain >= 0 ? '+' : ''}${totalUnrealizedGain.toFixed(2)}
                                        </p>
                                    </SpotlightCard>
                                    <SpotlightCard className="p-6">
                                        <p className="text-xs text-neutral-500 uppercase font-bold mb-2">Taxes Paid</p>
                                        <p className="text-3xl font-mono font-bold text-yellow-400">
                                            ${portfolio?.total_taxes_paid.toFixed(2) || '0.00'}
                                        </p>
                                    </SpotlightCard>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'history' && (
                        <motion.div
                            key="history"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            {transactions.length === 0 ? (
                                <SpotlightCard className="py-16">
                                    <div className="flex flex-col items-center justify-center text-center">
                                        <div className="w-20 h-20 rounded-full bg-neutral-800 flex items-center justify-center mb-6">
                                            <Receipt className="w-10 h-10 text-neutral-600" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-white mb-2">No Transactions Yet</h3>
                                        <p className="text-neutral-400">Your trade history will appear here.</p>
                                    </div>
                                </SpotlightCard>
                            ) : (
                                <div className="space-y-3">
                                    {transactions.map((tx, i) => (
                                        <motion.div
                                            key={tx.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.03 }}
                                            className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-5 flex items-center justify-between backdrop-blur-xl"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "w-12 h-12 rounded-xl flex items-center justify-center",
                                                    tx.type === 'buy' ? "bg-green-500/10" : "bg-red-500/10"
                                                )}>
                                                    {tx.type === 'buy' ?
                                                        <ArrowDownRight className="w-6 h-6 text-green-500" /> :
                                                        <ArrowUpRight className="w-6 h-6 text-red-500" />
                                                    }
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white">
                                                        {tx.type === 'buy' ? 'Bought' : 'Sold'} {tx.quantity} {tx.symbol}
                                                    </p>
                                                    <p className="text-sm text-neutral-500">
                                                        @ ${tx.price_per_share.toFixed(2)} • {new Date(tx.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={cn(
                                                    "font-mono font-bold text-lg",
                                                    tx.type === 'buy' ? "text-red-400" : "text-green-400"
                                                )}>
                                                    {tx.type === 'buy' ? '-' : '+'}${tx.total_amount.toFixed(2)}
                                                </p>
                                                {tx.tax_amount && tx.tax_amount > 0 && (
                                                    <p className="text-xs text-yellow-400">
                                                        Tax: ${tx.tax_amount.toFixed(2)}
                                                    </p>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Footer Info */}
                <div className="mt-12 p-6 bg-neutral-900/30 border border-neutral-800 rounded-2xl backdrop-blur-xl">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3 text-sm text-neutral-400">
                            <ShieldCheck className="w-5 h-5 text-brand-green" />
                            <span>Paper trading - no real money involved. Tax rate: 22% on realized gains.</span>
                        </div>
                        <Link
                            href="/easter-egg/blockchain"
                            className="flex items-center gap-2 text-brand-green hover:underline text-sm font-bold"
                        >
                            <Wallet className="w-4 h-4" /> View Bits-Coin Wallet
                            <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaperTradingPage;
