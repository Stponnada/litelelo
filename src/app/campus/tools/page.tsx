'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/services/supabase';
import { CampusTool } from '@/types';
import Spinner from '@/components/Spinner';
import { ArrowLeftIcon, ArrowTopRightOnSquareIcon, CubeIcon } from '@/components/icons';

export default function CampusToolsPage() {
    const [tools, setTools] = useState<CampusTool[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTools = async () => {
            try {
                const { data, error } = await supabase
                    .from('campus_tools')
                    .select('*')
                    .order('order_index', { ascending: true });

                if (error) throw error;
                setTools(data || []);
            } catch (err) {
                console.error('Error fetching tools:', err);
                // Fallback to empty or handled error state
            } finally {
                setLoading(false);
            }
        };

        fetchTools();
    }, []);

    return (
        <div className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-zinc-100 font-sans font-light">
            {/* Ambient Background */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-brand-green/10 dark:bg-brand-green/20 blur-[120px] rounded-full opacity-60 dark:opacity-20 pointer-events-none" />

            <div className="relative max-w-6xl mx-auto px-6 py-12">
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
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight uppercase italic underline decoration-brand-green/30">Built @ BITS</h1>
                    </div>
                    <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-4xl">
                        Find the top websites and other software built by fellow Bits Students to Superpower your online college life.
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Spinner />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {tools.map((tool) => (
                            <a
                                key={tool.id}
                                href={tool.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative flex flex-col overflow-hidden rounded-[2.5rem] bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:-translate-y-2 transition-all duration-500"
                            >
                                {/* Preview Image Container */}
                                <div className="relative aspect-video overflow-hidden">
                                    {tool.image_url ? (
                                        <Image
                                            src={tool.image_url}
                                            alt={tool.name}
                                            fill
                                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                                            unoptimized
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-zinc-700" />
                                    )}

                                    {/* Icon Overlay */}
                                    <div className="absolute top-4 left-4">
                                        <div className={`w-12 h-12 rounded-2xl backdrop-blur-xl ${tool.bg_color || 'bg-white/10'} border ${tool.border_color || 'border-white/20'} flex items-center justify-center text-xl font-black ${tool.icon_color || 'text-white'} shadow-xl`}>
                                            {tool.icon_text}
                                        </div>
                                    </div>

                                    {/* Type Badge */}
                                    <div className="absolute top-4 right-4">
                                        <span className="px-3 py-1 bg-black/40 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-widest text-white border border-white/10">
                                            {tool.is_external ? 'External' : 'Internal'}
                                        </span>
                                    </div>

                                    {/* Gradient Shadow */}
                                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                </div>

                                {/* Content Details */}
                                <div className="p-8 flex flex-col flex-1">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-2xl font-bold group-hover:text-brand-green transition-colors leading-tight">
                                            {tool.name}
                                        </h3>
                                        <ArrowTopRightOnSquareIcon className="w-5 h-5 text-zinc-400 group-hover:text-brand-green group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                                    </div>

                                    <p className="text-zinc-500 dark:text-zinc-400 mb-8 line-clamp-3 leading-relaxed">
                                        {tool.description}
                                    </p>

                                    <div className="mt-auto space-y-4">
                                        <div className="h-px bg-zinc-200 dark:bg-white/5" />
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1">
                                                    Author
                                                </span>
                                                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-300">
                                                    {tool.creator || 'BITS Community'}
                                                </span>
                                            </div>
                                            <div className="w-10 h-10 rounded-full bg-brand-green/10 flex items-center justify-center group-hover:bg-brand-green group-hover:text-black transition-colors duration-500">
                                                <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                )}

                {/* Footer Section */}
                <div className="mt-32 border-t border-zinc-200 dark:border-white/5 pt-12 text-center">
                    <div className="max-w-xl mx-auto">
                        <h4 className="text-2xl font-bold mb-4">Built something cool?</h4>
                        <Link href="/contact" className="inline-flex items-center gap-2 px-8 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold hover:bg-brand-green dark:hover:bg-brand-green hover:text-black dark:hover:text-black transition-all">
                            Submit your Tool
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

