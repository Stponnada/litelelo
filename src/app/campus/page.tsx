'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/services/supabase';
import { CampusTool } from '@/types';
import Spinner from '@/components/Spinner';
import {
    ArrowRightIcon, EyeSlashIcon, ArchiveBoxIcon,
    CubeIcon, ShoppingBagIcon, MapPinIcon, CampusPlacesIcon
} from '@/components/icons';
import { SectionHeader } from '@/components/campus/ExploreCards';

// --- Utility Components ---

const GrainTexture = () => (
    <div className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05] mix-blend-multiply dark:mix-blend-overlay z-0"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")` }}
    />
);

// --- Tool Preview Card ---
const ToolPreviewCard: React.FC<{
    href: string;
    icon: React.ReactNode;
    title: string;
    description: string;
    accentClass: string;
    isExternal?: boolean;
}> = ({ href, icon, title, description, accentClass, isExternal }) => {
    const Component = isExternal ? 'a' : Link;
    const extraProps = isExternal ? { target: "_blank", rel: "noopener noreferrer" } as any : {};

    return (
        <Component
            href={href}
            {...extraProps}
            className={`group flex items-center gap-4 p-5 rounded-2xl border ${accentClass} hover:shadow-md hover:-translate-y-0.5 transition-all duration-300`}
        >
            <div className="flex-shrink-0 p-3 rounded-xl bg-white dark:bg-zinc-800 shadow-sm">{icon}</div>
            <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm text-zinc-800 dark:text-zinc-100">{title}</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">{description}</p>
            </div>
            <ArrowRightIcon className="w-4 h-4 text-zinc-400 opacity-0 group-hover:opacity-100 transition-all" />
        </Component>
    );
};

// --- Quick Utility Link ---
const QuickUtilityLink: React.FC<{
    href: string;
    icon: React.ReactNode;
    title: string;
    description: string;
    accentClass: string;
}> = ({ href, icon, title, description, accentClass }) => (
    <Link
        href={href}
        className={`group flex items-center gap-4 p-5 rounded-2xl border ${accentClass} hover:shadow-md hover:-translate-y-0.5 transition-all duration-300`}
    >
        <div className="flex-shrink-0">{icon}</div>
        <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm text-zinc-800 dark:text-zinc-100">{title}</h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
        </div>
        <ArrowRightIcon className="w-4 h-4 text-zinc-400 opacity-0 group-hover:opacity-100 transition-all" />
    </Link>
);

// --- Main Page ---

const CampusPage: React.FC = () => {
    const [campusTools, setCampusTools] = useState<CampusTool[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTools = async () => {
            setLoading(true);
            try {
                const { data } = await supabase.from('campus_tools').select('*').order('order_index').limit(6);
                if (data) setCampusTools(data as CampusTool[]);
            } catch (err: unknown) {
                console.error('Error fetching campus tools:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchTools();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Spinner />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-zinc-100 relative selection:bg-brand-green selection:text-white font-sans font-light overflow-x-hidden">
            <GrainTexture />

            {/* Ambient Glows */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-brand-green/10 dark:bg-brand-green/20 blur-[120px] rounded-full opacity-60 dark:opacity-20 pointer-events-none" />
            <div className="fixed bottom-0 right-0 w-[800px] h-[600px] bg-violet-400/10 dark:bg-violet-600/10 blur-[120px] rounded-full opacity-40 dark:opacity-20 pointer-events-none" />

            <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-10 py-8 md:py-12">

                {/* Header */}
                <header className="mb-8 md:mb-12">
                    <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-500">
                        Campus
                    </h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">Tools, utilities & everything around campus.</p>
                </header>

                {/* Built @ BITS */}
                <section className="mb-14">
                    <SectionHeader
                        icon={<CubeIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
                        title="Built @ BITS"
                        subtitle="Built by the community"
                        href="/campus/tools"
                        accentColor="bg-blue-500/10"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {campusTools.map(tool => (
                            <ToolPreviewCard
                                key={tool.id}
                                href={tool.url}
                                icon={<span className={`text-xl font-bold ${tool.icon_color || ''}`}>{tool.icon_text}</span>}
                                title={tool.name}
                                description={tool.description}
                                accentClass={`${tool.border_color || 'border-zinc-100'} ${tool.bg_color || 'bg-zinc-50'}`}
                                isExternal={tool.is_external}
                            />
                        ))}
                    </div>
                </section>

                {/* Quick Links */}
                <section className="mb-8">
                    <h2 className="text-lg font-bold text-zinc-800 dark:text-white mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-green"></span>
                        Quick Links
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <QuickUtilityLink
                            href="/campus/lost-and-found"
                            icon={<ArchiveBoxIcon className="w-6 h-6 text-rose-500" />}
                            title="Lost & Found"
                            description="Report or find lost items"
                            accentClass="border-rose-100 dark:border-rose-900/30 bg-rose-50/30 dark:bg-rose-900/5"
                        />
                        <QuickUtilityLink
                            href="/campus/confessions"
                            icon={<EyeSlashIcon className="w-6 h-6 text-purple-500" />}
                            title="Secret Stories"
                            description="Anonymous confessions feed"
                            accentClass="border-purple-100 dark:border-purple-900/30 bg-purple-50/30 dark:bg-purple-900/5"
                        />
                        <QuickUtilityLink
                            href="/campus/marketplace"
                            icon={<ShoppingBagIcon className="w-6 h-6 text-emerald-500" />}
                            title="Marketplace"
                            description="Buy & sell with other students"
                            accentClass="border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/30 dark:bg-emerald-900/5"
                        />
                        <QuickUtilityLink
                            href="/campus/rideshare"
                            icon={<MapPinIcon className="w-6 h-6 text-blue-500" />}
                            title="Rideshare"
                            description="Find travel partners for cabs"
                            accentClass="border-blue-100 dark:border-blue-900/30 bg-blue-50/30 dark:bg-blue-900/5"
                        />
                        <QuickUtilityLink
                            href="/campus/reviews"
                            icon={<CampusPlacesIcon className="w-6 h-6 text-sky-500" />}
                            title="Campus Directory"
                            description="Places, contact info & reviews"
                            accentClass="border-sky-100 dark:border-sky-900/30 bg-sky-50/30 dark:bg-sky-900/5"
                        />
                    </div>
                </section>

            </div>
        </div>
    );
};

export default CampusPage;
