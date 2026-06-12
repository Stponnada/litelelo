'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/hooks/useAuth';
import Spinner from '@/components/Spinner';
import { BITS_BRANCHES } from '@/data/bitsBranches';

const BITS_CAMPUS_MAP: Record<string, string> = {
    hyderabad: 'Hyderabad',
    goa: 'Goa',
    pilani: 'Pilani',
    dubai: 'Dubai',
};

const CAMPUSES = ['Hyderabad', 'Goa', 'Pilani', 'Dubai'];
const CURRENT_YEAR = new Date().getFullYear();
const BATCH_YEARS = Array.from({ length: CURRENT_YEAR - 2017 }, (_, i) => String(2018 + i));

const ProfileSetup: React.FC = () => {
    const { user, isLoading, isProfileLoading, profile, updateProfileContext } = useAuth();
    const router = useRouter();

    const [formData, setFormData] = useState({
        full_name: '',
        username: '',
        campus: '',
        branch: '',
        admission_year: '',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
    const [isCheckingUsername, setIsCheckingUsername] = useState(false);
    const initialized = useRef(false);

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace('/login');
        }
    }, [isLoading, user, router]);

    // Pre-populate once from email and existing profile data
    useEffect(() => {
        if (!user?.email || initialized.current) return;
        initialized.current = true;

        const emailDomain = user.email.split('@')[1] || '';
        const subdomain = emailDomain.split('.')[0];
        const detectedCampus = BITS_CAMPUS_MAP[subdomain] || '';
        const yearMatch = user.email.match(/20\d{2}/);
        const detectedYear = yearMatch ? yearMatch[0] : '';

        setFormData(prev => ({
            ...prev,
            username: profile?.username || user.email!.split('@')[0],
            full_name: profile?.full_name || '',
            campus: detectedCampus || prev.campus,
            admission_year: detectedYear || prev.admission_year,
        }));
    }, [user, profile]);

    // Username availability check
    useEffect(() => {
        if (!formData.username || formData.username.length < 3) {
            setIsUsernameAvailable(null);
            return;
        }
        if (!/^[a-zA-Z0-9_.]+$/.test(formData.username)) {
            setIsUsernameAvailable(false);
            return;
        }
        const timer = setTimeout(async () => {
            setIsCheckingUsername(true);
            const { data } = await supabase
                .from('profiles')
                .select('user_id')
                .eq('username', formData.username)
                .maybeSingle();
            setIsUsernameAvailable(!data || data.user_id === user?.id);
            setIsCheckingUsername(false);
        }, 500);
        return () => clearTimeout(timer);
    }, [formData.username, user?.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        if (!formData.full_name.trim()) { setError('Please enter your name.'); return; }
        if (!formData.username.trim()) { setError('Please choose a username.'); return; }
        if (isUsernameAvailable === false) { setError('That username is already taken.'); return; }
        if (!formData.campus) { setError('Please select your campus.'); return; }
        if (!formData.branch) { setError('Please select your branch.'); return; }
        if (!formData.admission_year) { setError('Please select your batch year.'); return; }

        setIsSaving(true);
        setError(null);
        try {
            const { data: updatedProfile, error: updateError } = await supabase
                .from('profiles')
                .update({
                    full_name: formData.full_name.trim(),
                    username: formData.username.trim(),
                    campus: formData.campus,
                    branch: formData.branch,
                    admission_year: parseInt(formData.admission_year),
                    profile_complete: true,
                    updated_at: new Date().toISOString(),
                })
                .eq('user_id', user.id)
                .select()
                .single();

            if (updateError) {
                if (updateError.code === '23505') {
                    setError('That username is already taken.');
                } else {
                    throw updateError;
                }
                return;
            }

            // Bust stale Redis cache so the next fetchProfile sees profile_complete=true
            fetch(`/api/profile/by-id/${user.id}`, { method: 'POST' }).catch(() => {});

            updateProfileContext(updatedProfile);
            router.push('/');
        } catch (err: any) {
            setError(err.message || 'Something went wrong.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading || isProfileLoading || !user) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900">
                <Spinner />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">Welcome to litelelo.</h1>
                    <p className="text-gray-400">Just a few things to get you set up.</p>
                </div>

                <form onSubmit={handleSubmit} className="bg-gray-800/50 backdrop-blur rounded-2xl p-6 space-y-4 border border-gray-700/50">

                    {/* Full Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Full Name</label>
                        <input
                            type="text"
                            value={formData.full_name}
                            onChange={e => setFormData(p => ({ ...p, full_name: e.target.value }))}
                            placeholder="Your full name"
                            className="w-full p-3 bg-gray-700/80 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-green"
                        />
                    </div>

                    {/* Username */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Username</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={formData.username}
                                onChange={e => setFormData(p => ({ ...p, username: e.target.value.replace(/^@+/, '').toLowerCase() }))}
                                placeholder="choose_a_username"
                                className="w-full p-3 bg-gray-700/80 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-green pr-24"
                            />
                            <span className="absolute right-3 top-3.5 text-xs">
                                {isCheckingUsername && <span className="text-gray-400">checking…</span>}
                                {!isCheckingUsername && isUsernameAvailable === true && <span className="text-brand-green">available ✓</span>}
                                {!isCheckingUsername && isUsernameAvailable === false && <span className="text-red-400">taken ✗</span>}
                            </span>
                        </div>
                    </div>

                    {/* Campus */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Campus</label>
                        <select
                            value={formData.campus}
                            onChange={e => setFormData(p => ({ ...p, campus: e.target.value, branch: '' }))}
                            className="w-full p-3 bg-gray-700/80 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-green"
                        >
                            <option value="">Select your campus</option>
                            {CAMPUSES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    {/* Branch */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Branch</label>
                        <select
                            value={formData.branch}
                            onChange={e => setFormData(p => ({ ...p, branch: e.target.value }))}
                            disabled={!formData.campus}
                            className="w-full p-3 bg-gray-700/80 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-green disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <option value="">{formData.campus ? 'Select your branch' : 'Select campus first'}</option>
                            {Object.entries(BITS_BRANCHES[formData.campus] || {}).map(([degree, branchList]) =>
                                (branchList as string[]).map(b => (
                                    <option key={b} value={b}>{b} ({degree})</option>
                                ))
                            )}
                        </select>
                    </div>

                    {/* Batch Year */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Batch Year</label>
                        <select
                            value={formData.admission_year}
                            onChange={e => setFormData(p => ({ ...p, admission_year: e.target.value }))}
                            className="w-full p-3 bg-gray-700/80 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-green"
                        >
                            <option value="">When did you join BITS?</option>
                            {BATCH_YEARS.slice().reverse().map(y => (
                                <option key={y} value={y}>Class of {y}</option>
                            ))}
                        </select>
                    </div>

                    {error && <p className="text-red-400 text-sm pt-1">{error}</p>}

                    <button
                        type="submit"
                        disabled={isSaving || isUsernameAvailable === false}
                        className="w-full py-3 bg-brand-green text-black font-semibold rounded-lg hover:bg-brand-green-darker transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    >
                        {isSaving ? <Spinner /> : 'Get started →'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ProfileSetup;
