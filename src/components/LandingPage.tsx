'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';

const LandingPage: React.FC = () => {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!heroRef.current) return;
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      const x = (clientX / innerWidth - 0.5) * 20;
      const y = (clientY / innerHeight - 0.5) * 20;
      heroRef.current.style.transform = `perspective(1000px) rotateY(${x}deg) rotateX(${-y}deg)`;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-[#030712] text-white overflow-x-hidden font-sans selection:bg-brand-green/30 selection:text-brand-green flex flex-col">

      {/* --- BACKGROUND EFFECTS --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-brand-green/5 rounded-full blur-[120px] animate-pulse-subtle" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-blue-500/5 rounded-full blur-[120px] animate-pulse-subtle" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-[url('/patterns/tech-circuit.svg')] opacity-[0.03]" />
      </div>

      {/* --- NAVBAR --- */}
      <nav className="relative z-50 px-6 py-6 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="text-3xl font-raleway font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-brand-green to-emerald-400 cursor-default select-none">
          litelelo.
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="hidden sm:block text-sm font-semibold text-gray-400 hover:text-white transition-colors">
            Login
          </Link>
          <Link
            href="/login"
            className="px-6 py-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-brand-green hover:text-black hover:border-brand-green transition-all duration-300 font-bold text-sm backdrop-blur-md shadow-[0_0_15px_rgba(60,251,162,0.1)] hover:shadow-[0_0_25px_rgba(60,251,162,0.4)]"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
        <div ref={heroRef} className="relative max-w-4xl mx-auto transition-transform duration-100 ease-out">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-green/10 border border-brand-green/20 text-brand-green text-xs font-bold mb-8 animate-fadeIn">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-green"></span>
            </span>
            Exclusive to BITS campuses
          </div>

          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black font-raleway tracking-tight mb-6 leading-[0.9]">
            <span className="block text-white drop-shadow-2xl">All of BITS. <br /> One social network.</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-brand-green via-emerald-400 to-teal-500 animate-gradient-x">
              litelelo.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-4 leading-relaxed">
            Find your batch, meet seniors from your city, and keep up with everything happening on campus — all in one place.
          </p>

          <p className="text-sm text-gray-500 max-w-xl mx-auto mb-10">
            Independent and student-built. Not affiliated with the administration — your data never goes to the college.
          </p>

          <div className="flex justify-center">
            <Link
              href="/login"
              className="group relative px-8 py-4 bg-brand-green text-black font-bold rounded-xl overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(60,251,162,0.3)]"
            >
              <div className="absolute inset-0 bg-white/40 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <span className="relative flex items-center gap-2">
                Join the Network
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="relative z-10 py-10 px-6 border-t border-white/5 bg-black/40 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <span className="text-2xl font-raleway font-black text-white tracking-tight">litelelo.</span>
            <p className="text-gray-500 text-sm mt-1">© {new Date().getFullYear()} Litelelo.in All rights reserved.</p>
          </div>
          <div className="flex gap-6 text-sm text-gray-400">
            <Link href="/terms" className="hover:text-brand-green transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-brand-green transition-colors">Privacy</Link>
            <Link href="/help" className="hover:text-brand-green transition-colors">Help</Link>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-pulse-subtle {
          animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
