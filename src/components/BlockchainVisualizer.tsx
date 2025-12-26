'use client';

import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { motion, useScroll, useTransform, useSpring, useMotionValue, useMotionTemplate } from 'framer-motion';
import { Box, Hash, Link as LinkIcon, Clock, Cpu, ArrowRight, User } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getResizedAvatarUrl } from '../utils/imageUtils';

// --- UTILS ---
function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const truncateHash = (hash: string, start = 6, end = 6) => {
    if (!hash) return '';
    return `${hash.substring(0, start)}...${hash.substring(hash.length - end)}`;
};

// --- TYPES (Matching your existing structure) ---
// Mocking TransactionProps for TS safety if not provided
interface TransactionProps { tx: any }

interface Block {
    index: number;
    timestamp: string;
    hash: string;
    previous_hash: string;
    nonce: number;
    transactions: TransactionProps['tx'][];
    miner?: {
        username: string;
        avatar_url?: string;
    };
    id: string;
}

// --- ANIMATED COMPONENTS ---

/**
 * Animated Data Cable
 * Connects two blocks with a pulsing SVG line simulating data transfer
 */
const DataCable = () => {
    return (
        <div className="relative w-16 h-24 flex items-center justify-center -mx-2 z-0">
            <svg width="100%" height="20" className="overflow-visible">
                {/* Base Cable */}
                <line
                    x1="0" y1="10" x2="100%" y2="10"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-neutral-200 dark:text-neutral-800"
                />

                {/* Glowing Core */}
                <motion.line
                    x1="0" y1="10" x2="100%" y2="10"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-brand-green opacity-50"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                />

                {/* Data Packet Particle */}
                <motion.circle
                    r="3"
                    fill="currentColor"
                    className="text-brand-green filter drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                >
                    <animate
                        attributeName="cx"
                        from="0"
                        to="100%"
                        dur="1.5s"
                        repeatCount="indefinite"
                        calcMode="linear"
                    />
                    <animate
                        attributeName="cy"
                        values="10"
                        dur="1.5s"
                        repeatCount="indefinite"
                    />
                </motion.circle>
            </svg>
        </div>
    );
};

/**
 * Hash Display
 * Scrambles text on hover (Cyberpunk effect)
 */
const ScrambleHash = ({ label, hash }: { label: string, hash: string }) => {
    const [display, setDisplay] = useState(truncateHash(hash));
    const chars = "ABCDEF0123456789";

    const handleHover = () => {
        let iterations = 0;
        const interval = setInterval(() => {
            setDisplay(truncateHash(hash)
                .split("")
                .map((char, index) => {
                    if (index < 3 || index > 10) return char; // Keep start/end stable
                    if (index < iterations) return truncateHash(hash)[index];
                    return chars[Math.floor(Math.random() * chars.length)];
                })
                .join("")
            );
            if (iterations >= 15) clearInterval(interval);
            iterations += 1;
        }, 50);
    };

    return (
        <div
            className="group/hash flex flex-col gap-1 p-2 rounded-lg bg-neutral-50 dark:bg-black/40 border border-neutral-100 dark:border-white/5 hover:border-brand-green/30 transition-colors cursor-crosshair"
            onMouseEnter={handleHover}
            onMouseLeave={() => setDisplay(truncateHash(hash))}
        >
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1">
                {label}
            </span>
            <code className="text-xs font-mono text-neutral-600 dark:text-neutral-300 group-hover/hash:text-brand-green transition-colors break-all">
                {display}
            </code>
        </div>
    );
};

/**
 * The Holographic Block Card
 */
const HoloBlock = ({ block, isGenesis }: { block: Block, isGenesis: boolean }) => {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
        const { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.8, x: -50 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            whileHover={{ y: -10, scale: 1.02, zIndex: 10 }}
            transition={{ type: "spring", bounce: 0.4 }}
            className="relative flex-shrink-0 group perspective-1000"
            onMouseMove={handleMouseMove}
        >
            {/* The Glass Card */}
            <div className={cn(
                "w-80 relative overflow-hidden rounded-2xl border backdrop-blur-xl transition-all duration-300",
                isGenesis
                    ? "bg-brand-green/5 border-brand-green/30 shadow-[0_0_30px_-5px_rgba(16,185,129,0.15)]"
                    : "bg-white/80 dark:bg-neutral-900/60 border-neutral-200 dark:border-white/10 shadow-xl"
            )}>

                {/* Spotlight Effect */}
                <motion.div
                    className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100 z-10"
                    style={{
                        background: useMotionTemplate`
                            radial-gradient(
                                600px circle at ${mouseX}px ${mouseY}px,
                                rgba(16, 185, 129, 0.10),
                                transparent 80%
                            )
                        `,
                    }}
                />

                {/* Header */}
                <div className={cn(
                    "relative px-5 py-4 border-b flex justify-between items-center z-20",
                    isGenesis ? "border-brand-green/20 bg-brand-green/10" : "border-neutral-100 dark:border-white/5 bg-neutral-50/50 dark:bg-white/5"
                )}>
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "p-2 rounded-lg",
                            isGenesis ? "bg-brand-green text-white shadow-lg shadow-brand-green/40" : "bg-neutral-200 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
                        )}>
                            <Box className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="block text-[10px] uppercase font-bold tracking-widest opacity-60">Block Height</span>
                            <span className="text-lg font-black font-mono">#{block.index.toString().padStart(4, '0')}</span>
                        </div>
                    </div>
                    {isGenesis && (
                        <span className="px-2 py-1 rounded-full bg-brand-green/20 text-brand-green text-[10px] font-bold uppercase tracking-wider border border-brand-green/20 animate-pulse">
                            Genesis
                        </span>
                    )}
                </div>

                {/* Body Content */}
                <div className="p-5 space-y-4 relative z-20">

                    {/* Hashes */}
                    <div className="space-y-2">
                        <ScrambleHash label="Previous Hash" hash={block.previous_hash} />
                        <ScrambleHash label="Current Hash" hash={block.hash} />
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 rounded-lg bg-neutral-100 dark:bg-white/5 flex flex-col items-center justify-center text-center">
                            <span className="text-[10px] text-neutral-500 uppercase font-bold">Nonce</span>
                            <span className="font-mono text-sm font-bold text-brand-green">{block.nonce}</span>
                        </div>
                        <div className="p-2 rounded-lg bg-neutral-100 dark:bg-white/5 flex flex-col items-center justify-center text-center">
                            <span className="text-[10px] text-neutral-500 uppercase font-bold">Tx Count</span>
                            <span className="font-mono text-sm font-bold text-blue-500">{block.transactions.length}</span>
                        </div>
                    </div>

                    {/* Footer Info */}
                    <div className="pt-4 mt-2 border-t border-neutral-100 dark:border-white/5 flex justify-between items-end">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                                <Clock className="w-3 h-3" />
                                <span>{format(new Date(block.timestamp), 'HH:mm:ss')}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                                <span className="w-3 h-3 flex items-center justify-center font-bold bg-neutral-200 dark:bg-neutral-800 rounded-full text-[8px]">D</span>
                                <span>{format(new Date(block.timestamp), 'MMM dd')}</span>
                            </div>
                        </div>

                        {/* Miner Info */}
                        <div className="text-right">
                            {block.miner ? (
                                <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 pl-3 pr-1 py-1 rounded-full border border-neutral-200 dark:border-neutral-700">
                                    <span className="text-xs font-bold truncate max-w-[80px]">@{block.miner.username}</span>
                                    <div className="relative w-6 h-6">
                                        <Image
                                            src={getResizedAvatarUrl(block.miner.avatar_url, 48, 48, block.miner.username)}
                                            alt={block.miner.username}
                                            width={24} height={24}
                                            className="rounded-full object-cover"
                                            unoptimized
                                        />
                                        <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 border border-white dark:border-black rounded-full"></div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1 text-xs font-bold text-neutral-400">
                                    <Cpu className="w-4 h-4" />
                                    System
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Reflection Gradient (Bottom) */}
            <div className="absolute -bottom-4 left-4 right-4 h-4 bg-gradient-to-t from-transparent to-brand-green/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        </motion.div>
    );
};

// --- MAIN VISUALIZER COMPONENT ---

const BlockchainVisualizer: React.FC<{ blocks: Block[] }> = ({ blocks }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const { scrollXProgress } = useScroll({ container: scrollRef });
    const scaleX = useSpring(scrollXProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

    if (blocks.length === 0) return null;

    return (
        <div className="w-full mb-12 relative group/container">
            {/* Header Area */}
            <div className="flex items-end justify-between mb-6 px-4">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neutral-900 to-neutral-500 dark:from-white dark:to-neutral-500 flex items-center gap-2">
                        <LinkIcon className="w-6 h-6 text-brand-green" />
                        Ledger Explorer
                    </h2>
                    <p className="text-sm text-neutral-500 font-medium">Immutable Record • Real-time Visualization</p>
                </div>

                {/* Scroll Indicator */}
                <div className="hidden md:flex items-center gap-2 text-xs font-bold text-neutral-400 bg-neutral-100 dark:bg-neutral-900 px-3 py-1 rounded-full border border-neutral-200 dark:border-neutral-800">
                    <ArrowRight className="w-3 h-3 animate-pulse text-brand-green" />
                    <span>SCROLL TO VIEW CHAIN</span>
                </div>
            </div>

            {/* Viewport Container */}
            <div className="relative rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-black/40 overflow-hidden shadow-2xl">

                {/* Cyberpunk Grid Background */}
                <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                </div>

                {/* Side Fade Gradients */}
                <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white dark:from-neutral-950 to-transparent z-20 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white dark:from-neutral-950 to-transparent z-20 pointer-events-none" />

                {/* Progress Bar (Top) */}
                <motion.div
                    className="absolute top-0 left-0 right-0 h-1 bg-brand-green origin-left z-30 shadow-[0_0_10px_#10b981]"
                    style={{ scaleX }}
                />

                {/* The Scrolling Chain */}
                <div
                    ref={scrollRef}
                    className="overflow-x-auto overflow-y-visible custom-scrollbar relative z-10 py-12 px-8"
                >
                    <div className="flex items-center min-w-max">
                        {blocks.map((block, index) => (
                            <React.Fragment key={block.id}>
                                {index > 0 && <DataCable />}
                                <HoloBlock block={block} isGenesis={index === 0} />
                            </React.Fragment>
                        ))}

                        {/* "Mining" Placeholder at the end */}
                        <div className="ml-4 flex flex-col items-center justify-center opacity-30 px-8">
                            <div className="w-12 h-12 border-2 border-dashed border-neutral-400 rounded-full animate-spin duration-[3000ms]" />
                            <span className="mt-2 text-xs font-bold tracking-widest uppercase">Mining Next Block</span>
                        </div>
                    </div>
                </div>

                {/* Footer Metadata */}
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-4 text-[10px] font-mono text-neutral-400 z-20">
                    <span>NETWORK: CAMPUS_MAINNET</span>
                    <span>TOTAL BLOCKS: {blocks.length}</span>
                </div>
            </div>
        </div>
    );
};

export default BlockchainVisualizer;