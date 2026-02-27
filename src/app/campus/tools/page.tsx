'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, ArrowTopRightOnSquareIcon, CubeIcon } from '@/components/icons';

interface Tool {
    name: string;
    description: string;
    url: string;
    icon: string;
    color: string;
    bg: string;
    border: string;
    creator: string;
    isInternal?: boolean;
}

const tools: Tool[] = [
    {
        name: "QuietSpace",
        description: "Find available classrooms and library spots in real-time. Avoid the rush and find your perfect study zone.",
        url: "https://quietspace-mu.vercel.app/",
        icon: "Q",
        color: "text-blue-500",
        bg: "bg-blue-500/10",
        border: "border-blue-500/20",
        creator: "Shriniketh Deevanapalli"
    },
    {
        name: "H4U (Handouts For You)",
        description: "A centralized platform for course handouts, lecture notes, and study materials, making academic resources easily accessible to all students.",
        url: "https://h4u.app/",
        icon: "H",
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
        creator: "H4U Team"
    },
    {
        name: "Campus 101",
        description: "The ultimate BITS directory. Contacts, locations, and essential campus info at your fingertips.",
        url: "https://campus101-sable.vercel.app/",
        icon: "C",
        color: "text-blue-900",
        bg: "bg-blue-900/10",
        border: "border-blue-900/20",
        creator: "Shriniketh Deevanapalli and Kushagra Singh"
    },
    {
        name: "Logged In.",
        description: "A Chrome Web-Extension that logs you in to BITS Wifi Automatically every time",
        url: "https://campus101-sable.vercel.app/",
        icon: "L",
        color: "text-blue-300",
        bg: "bg-blue-300/10",
        border: "border-blue-300/20",
        creator: "Saathvik Manikandan"
    }
];

export default function CampusToolsPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-zinc-100 font-raleway">
            {/* Ambient Background */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-brand-green/10 dark:bg-brand-green/20 blur-[120px] rounded-full opacity-60 dark:opacity-20 pointer-events-none" />

            <div className="relative max-w-5xl mx-auto px-6 py-12">
                {/* Back Button */}
                <Link
                    href="/campus"
                    className="inline-flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-brand-green transition-colors mb-8"
                >
                    <ArrowLeftIcon className="w-4 h-4" />
                    Back to Explore
                </Link>

                {/* Header */}
                <div className="mb-16">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-brand-green/10 rounded-2xl">
                            <CubeIcon className="w-8 h-8 text-brand-green" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight">Student Tools</h1>
                    </div>
                    <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-4xl">
                        Find the top websites and other software built by fellow Bits Students to Superpower your online college life.
                    </p>
                </div>

                {/* Tools Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {tools.map((tool) => (
                        <div
                            key={tool.name}
                            className={`group relative p-8 rounded-3xl border ${tool.border} bg-white dark:bg-zinc-900/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500`}
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className={`w-14 h-14 rounded-2xl ${tool.bg} flex items-center justify-center text-2xl font-black ${tool.color}`}>
                                    {tool.icon}
                                </div>
                                {tool.isInternal ? (
                                    <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                                        Internal
                                    </span>
                                ) : (
                                    <span className="px-3 py-1 bg-brand-green/10 rounded-full text-[10px] font-bold uppercase tracking-wider text-brand-green">
                                        External
                                    </span>
                                )}
                            </div>

                            <h3 className="text-2xl font-bold mb-3 group-hover:text-brand-green transition-colors">
                                {tool.name}
                            </h3>
                            <p className="text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed">
                                {tool.description}
                            </p>

                            <div className="flex items-center justify-between">
                                <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                                    CREATED BY {tool.creator}
                                </div>
                                {tool.isInternal ? (
                                    <Link href={tool.url} className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl hover:bg-brand-green hover:text-black transition-all">
                                        Open Tool
                                    </Link>
                                ) : (
                                    <a
                                        href={tool.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl hover:bg-brand-green hover:text-black transition-all flex items-center gap-2"
                                    >
                                        Visit Website
                                        <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer Quote */}
                <div className="mt-24 text-center">
                    <div className="inline-block p-1 px-4 bg-brand-green/5 rounded-full border border-brand-green/10 mb-4">
                        <span className="text-xs font-bold text-brand-green tracking-widest uppercase">Open Source Campus</span>
                    </div>
                    <p className="text-sm text-zinc-400 italic">
                        Built a tool for campus? <Link href="/contact" className="text-brand-green underline decoration-brand-green/30">Get it listed here.</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
