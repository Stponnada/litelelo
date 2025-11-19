// src/pages/LandingPage.tsx

import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    UserGroupIcon,
    ChatIcon,
    BuildingLibraryIcon,
    ShoppingBagIcon,
    ShieldCheckIcon,
    GlobeIcon,
    ArrowPathRoundedSquareIcon, // Using as a generic forward arrow
} from '../components/icons';

// --- Animations & Styles ---
// Ensure your tailwind.config.js has the 'brand-green' and dark mode colors set up as per your project.

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string; delay: number }> = ({ icon, title, description, delay }) => {
    return (
        <div
            className="group relative p-1 rounded-2xl bg-gradient-to-br from-white/5 to-white/0 hover:from-brand-green/20 hover:to-brand-green/5 transition-all duration-500 hover:-translate-y-2 opacity-0 animate-slideUp forwards"
            style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
        >
            <div className="absolute inset-0 bg-brand-green/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
            <div className="relative h-full bg-secondary-light/80 dark:bg-[#0B101B]/90 backdrop-blur-xl border border-tertiary-light/50 dark:border-white/5 p-6 rounded-xl flex flex-col items-start gap-4">
                <div className="p-3 rounded-xl bg-brand-green/10 text-brand-green group-hover:scale-110 transition-transform duration-300">
                    {icon}
                </div>
                <div>
                    <h3 className="text-xl font-bold text-text-main-light dark:text-text-main mb-2 font-raleway">{title}</h3>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary leading-relaxed">
                        {description}
                    </p>
                </div>
            </div>
        </div>
    );
};

const LandingPage: React.FC = () => {
    const heroRef = useRef<HTMLDivElement>(null);
    const [isFlipped, setIsFlipped] = useState(false);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!heroRef.current) return;
            const { clientX, clientY } = e;
            const { innerWidth, innerHeight } = window;
            const x = (clientX / innerWidth - 0.5) * 20; // -10 to 10
            const y = (clientY / innerHeight - 0.5) * 20; // -10 to 10

            heroRef.current.style.transform = `perspective(1000px) rotateY(${x}deg) rotateX(${-y}deg)`;
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div className="min-h-screen bg-[#030712] text-white overflow-x-hidden font-sans selection:bg-brand-green/30 selection:text-brand-green">

            {/* --- BACKGROUND EFFECTS --- */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-brand-green/5 rounded-full blur-[120px] animate-pulse-subtle" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-blue-500/5 rounded-full blur-[120px] animate-pulse-subtle" style={{ animationDelay: '2s' }} />
                <div className="absolute inset-0 bg-[url('/patterns/tech-circuit.svg')] opacity-[0.03]" />
            </div>

            {/* --- NAVBAR --- */}
            <nav className="relative z-50 px-6 py-6 flex justify-between items-center max-w-7xl mx-auto">
                <div className="text-3xl font-raleway font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-brand-green to-emerald-400 cursor-default select-none">
                    litelelo.
                </div>
                <div className="flex items-center gap-4">
                    <Link to="/login" className="hidden sm:block text-sm font-semibold text-gray-400 hover:text-white transition-colors">
                        Login
                    </Link>
                    <Link
                        to="/login"
                        className="px-6 py-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-brand-green hover:text-black hover:border-brand-green transition-all duration-300 font-bold text-sm backdrop-blur-md shadow-[0_0_15px_rgba(60,251,162,0.1)] hover:shadow-[0_0_25px_rgba(60,251,162,0.4)]"
                    >
                        Get Started
                    </Link>
                </div>
            </nav>

            {/* --- HERO SECTION --- */}
            <section className="relative z-10 pt-20 pb-32 px-6 flex flex-col items-center text-center">
                <div
                    ref={heroRef}
                    className="relative max-w-4xl mx-auto transition-transform duration-100 ease-out"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-green/10 border border-brand-green/20 text-brand-green text-xs font-bold mb-8 animate-fadeIn">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-green"></span>
                        </span>
                        Exclusive to BITS campuses
                    </div>

                    <h1 className="text-5xl sm:text-7xl md:text-8xl font-black font-raleway tracking-tight mb-6 leading-[0.9]">
                        <span className="block text-white drop-shadow-2xl">Connect.</span>
                        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-brand-green via-emerald-400 to-teal-500 animate-gradient-x">
                            Trade. Vibe.
                        </span>
                    </h1>

                    <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                        The ultimate social network for BITSians.
                        From finding friends to selling textbooks,
                        <span className="text-white font-bold"> litelelo.</span> handles it all.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            to="/login"
                            className="group relative px-8 py-4 bg-brand-green text-black font-bold rounded-xl overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(60,251,162,0.3)]"
                        >
                            <div className="absolute inset-0 bg-white/40 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                            <span className="relative flex items-center gap-2">
                                Join the Network
                                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                            </span>
                        </Link>
                        <a
                            href="#features"
                            className="px-8 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition-all"
                        >
                            Learn More
                        </a>
                    </div>
                </div>
            </section>

            {/* --- FEATURES GRID --- */}
            <section id="features" className="relative z-10 py-20 px-6 max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold font-raleway mb-4">Everything you need,<br />in one place.</h2>
                    <p className="text-gray-400 max-w-xl mx-auto">Stop juggling WhatsApp groups and email threads.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <FeatureCard
                        delay={0}
                        icon={<UserGroupIcon className="w-8 h-8" />}
                        title="Communities"
                        description="Create and Join groups for your batch, clubs, or interests. Create your own space with custom flairs and private feeds."
                    />
                    <FeatureCard
                        delay={100}
                        icon={<ShoppingBagIcon className="w-8 h-8" />}
                        title="Marketplace"
                        description="Buy and sell campus essentials safely. Textbooks, cycles, electronics – listing takes seconds."
                    />
                    <FeatureCard
                        delay={200}
                        icon={<BuildingLibraryIcon className="w-8 h-8" />}
                        title="Campus Life"
                        description="Find vacant classrooms, check notices, help find lost items, and discover the best hangout spots with peer reviews."
                    />
                    <FeatureCard
                        delay={300}
                        icon={<GlobeIcon className="w-8 h-8" />}
                        title="Directory"
                        description="Find new friends on campus. Filter people by batch, branch, dorm, or relationship status."
                    />
                    <FeatureCard
                        delay={500}
                        icon={<ChatIcon className="w-8 h-8" />}
                        title="Real-time Chat"
                        description="Direct messages and group chats with typing indicators, read receipts, and file sharing."
                    />
                    <FeatureCard
                        delay={400}
                        icon={<ShieldCheckIcon className="w-8 h-8" />}
                        title="Verified & Safe"
                        description="Only valid BITS Pilani emails can sign up. A trusted environment for genuine connections."
                    />

                </div>
            </section>

            {/* --- BITS COIN SECTION --- */}
            <section className="relative z-10 py-24 px-6 overflow-hidden">
                <div className="absolute inset-0 bg-brand-green/5 -skew-y-3 transform origin-top-left scale-110" />

                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12 relative">
                    <div className="flex-1 space-y-8">
                        <h2 className="text-4xl md:text-6xl font-black font-raleway leading-tight">
                            Discover what's happening at your <span className="text-brand-green">Bits</span><br />
                            Campus.
                        </h2>
                        <p className="text-gray-300 text-lg leading-relaxed">
                            Make new friends, meet seniors, and never miss a campus event again.
                            <br />
                            Trade essentials with ease, carpool safely, and recover lost items in no time.
                            <br />
                            Create your own profile page and showcase who you are.
                        </p>
                    </div>

                    {/* Visual Representation of a Block/Coin */}
                    <div className="flex-1 flex justify-center relative perspective-1000">
                        <div className="absolute inset-0 bg-brand-green/20 blur-[80px] rounded-full animate-pulse" />
                        <div
                            onClick={() => setIsFlipped(!isFlipped)}
                            className={`relative w-64 h-64 md:w-80 md:h-80 transition-all duration-700 preserve-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : 'hover:rotate-2'}`}
                        >
                            {/* Front of Card */}
                            <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-gray-800 to-black rounded-3xl border border-white/10 shadow-2xl flex items-center justify-center">
                                <div className="text-center">
                                    <div className="font-raleway text-brand-green text-4xl">litelelo</div>
                                    <div className="font-poppins text-gray-500 text-l mt-2">The Art of Taking Things Easy</div>
                                </div>
                            </div>

                            {/* Back of Card */}
                            <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-brand-green/20 to-black rounded-3xl border border-brand-green/30 shadow-2xl flex items-center justify-center">
                                <div className="text-center p-6">
                                    <div className="font-raleway text-white text-3xl font-bold">Life is Unfair</div>
                                    <div className="font-poppins text-brand-green text-sm mt-2">But we make it easier.</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- FOOTER --- */}
            <footer className="relative z-10 py-12 px-6 border-t border-white/5 bg-black/40 backdrop-blur-lg">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <span className="text-2xl font-raleway font-black text-white tracking-tight">litelelo.</span>
                        <p className="text-gray-500 text-sm mt-1">© {new Date().getFullYear()} Litelelo.in All rights reserved.</p>
                    </div>

                    <div className="flex gap-6 text-sm text-gray-400">
                        <Link to="/terms" className="hover:text-brand-green transition-colors">Terms</Link>
                        <Link to="/privacy" className="hover:text-brand-green transition-colors">Privacy</Link>
                        <Link to="/help" className="hover:text-brand-green transition-colors">Help</Link>
                    </div>
                </div>
            </footer>

            {/* --- CSS FOR ANIMATIONS (Injecting here for simplicity, ideally in index.css) --- */}
            <style>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes gradient-x {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }
                .animate-slideUp {
                    animation: slideUp 0.8s ease-out forwards;
                }
                .animate-pulse-subtle {
                    animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                .perspective-1000 {
                    perspective: 1000px;
                }
                .preserve-3d {
                    transform-style: preserve-3d;
                }
                .backface-hidden {
                    backface-visibility: hidden;
                }
                .rotate-y-180 {
                    transform: rotateY(180deg);
                }
            `}</style>
        </div>
    );
};

export default LandingPage;