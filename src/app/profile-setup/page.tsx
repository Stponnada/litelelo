'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/hooks/useAuth';
import Spinner from '@/components/Spinner';
import ImageCropper from '@/components/ImageCropper';
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
const INTRO_MAX = 80;

const ProfileSetup: React.FC = () => {
    const { user, isLoading, profile, updateProfileContext } = useAuth();
    const router = useRouter();

    const [formData, setFormData] = useState({
        full_name: '',
        username: '',
        campus: '',
        branch: '',
        admission_year: '',
        hometown: '',
        intro: '',
    });
    const [isIncoming, setIsIncoming] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
    const [isCheckingUsername, setIsCheckingUsername] = useState(false);
    const initialized = useRef(false);

    // Photo (avatar) state
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [imageToCrop, setImageToCrop] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
            // Case-insensitive match, excluding the user's own row so they can keep
            // their current name. Escape LIKE wildcards since usernames may contain "_".
            // limit(1) (not maybeSingle) avoids errors if any legacy case-variant duplicates exist.
            const pattern = formData.username.replace(/[\\%_]/g, m => `\\${m}`);
            const { data } = await supabase
                .from('profiles')
                .select('user_id')
                .ilike('username', pattern)
                .neq('user_id', user?.id ?? '')
                .limit(1);
            setIsUsernameAvailable(!data || data.length === 0);
            setIsCheckingUsername(false);
        }, 500);
        return () => clearTimeout(timer);
    }, [formData.username, user?.id]);

    // Clean up the object URL behind the avatar preview
    useEffect(() => {
        return () => { if (avatarPreview) URL.revokeObjectURL(avatarPreview); };
    }, [avatarPreview]);

    const handleToggleIncoming = (next: boolean) => {
        setIsIncoming(next);
        setError(null);
        // Incoming students are, by definition, the joining batch.
        setFormData(prev => ({ ...prev, admission_year: next ? String(CURRENT_YEAR) : '' }));
    };

    const handlePickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setImageToCrop(URL.createObjectURL(file));
        e.target.value = ''; // allow re-selecting the same file
    };

    const handleCropSave = (croppedFile: File) => {
        if (avatarPreview) URL.revokeObjectURL(avatarPreview);
        setAvatarFile(croppedFile);
        setAvatarPreview(URL.createObjectURL(croppedFile));
        if (imageToCrop) URL.revokeObjectURL(imageToCrop);
        setImageToCrop(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        if (!formData.full_name.trim()) { setError('Please enter your name.'); return; }
        if (!formData.username.trim()) { setError('Please choose a username.'); return; }
        if (isCheckingUsername || isUsernameAvailable !== true) { setError('Please wait for the username check to complete.'); return; }
        if (!formData.campus) { setError('Please select your campus.'); return; }
        if (!formData.branch) { setError('Please select your branch.'); return; }
        if (isIncoming) {
            if (!formData.hometown.trim()) { setError('Please add your hometown — it helps batchmates from your city find you.'); return; }
        } else if (!formData.admission_year) {
            setError('Please select your batch year.');
            return;
        }

        setIsSaving(true);
        setError(null);
        try {
            let avatar_url = profile?.avatar_url ?? null;
            if (avatarFile) {
                const path = `${user.id}/avatar_${Date.now()}`;
                const { error: uploadError } = await supabase.storage.from('avatars').upload(path, avatarFile, { upsert: true });
                if (uploadError) throw uploadError;
                avatar_url = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
            }

            const updatePayload: Record<string, unknown> = {
                full_name: formData.full_name.trim(),
                username: formData.username.trim(),
                campus: formData.campus,
                branch: formData.branch,
                admission_year: parseInt(isIncoming ? String(CURRENT_YEAR) : formData.admission_year),
                is_incoming: isIncoming,
                avatar_url,
                profile_complete: true,
                updated_at: new Date().toISOString(),
            };
            // Only collect the extra discovery fields from incoming students for now.
            if (isIncoming) {
                updatePayload.hometown = formData.hometown.trim();
                if (formData.intro.trim()) updatePayload.bio = formData.intro.trim();
            }

            const { data: updatedProfile, error: updateError } = await supabase
                .from('profiles')
                .update(updatePayload)
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

    if (isLoading || !user) {
        return (
            <div className="flex items-center justify-center h-screen bg-primary">
                <Spinner />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-primary flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <span className="font-raleway font-black tracking-tighter text-brand-green text-5xl">litelelo.</span>
                    <p className="text-gray-400 mt-3">Just a few things to get you set up.</p>
                </div>

                <form onSubmit={handleSubmit} className="bg-gray-800/50 backdrop-blur rounded-2xl p-6 space-y-4 border border-gray-700/50">

                    {/* Incoming-student toggle */}
                    <button
                        type="button"
                        onClick={() => handleToggleIncoming(!isIncoming)}
                        className={`w-full flex items-center justify-between gap-3 p-3 rounded-lg border text-left transition-colors ${
                            isIncoming ? 'bg-brand-green/10 border-brand-green' : 'bg-gray-700/60 border-gray-600 hover:border-gray-500'
                        }`}
                    >
                        <span>
                            <span className="block text-sm font-semibold text-white">{`I'm an incoming student (joining ${CURRENT_YEAR})`}</span>
                            <span className="block text-xs text-gray-400 mt-0.5">Just got your branch allotment? Meet your batch before you arrive.</span>
                        </span>
                        <span className={`shrink-0 w-11 h-6 rounded-full p-0.5 transition-colors ${isIncoming ? 'bg-brand-green' : 'bg-gray-600'}`}>
                            <span className={`block w-5 h-5 rounded-full bg-white transition-transform ${isIncoming ? 'translate-x-5' : ''}`} />
                        </span>
                    </button>

                    {/* Photo — shown to incoming students (where a face matters most for connecting) */}
                    {isIncoming && (
                        <div className="flex items-center gap-4 pt-1">
                            <div className="w-16 h-16 rounded-full bg-gray-700 border border-gray-600 overflow-hidden flex items-center justify-center shrink-0">
                                {avatarPreview
                                    ? <img src={avatarPreview} alt="Your photo" className="w-full h-full object-cover" />
                                    : <span className="text-gray-500 text-xs">No photo</span>}
                            </div>
                            <div>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="text-sm font-medium text-brand-green hover:text-brand-green-darker"
                                >
                                    {avatarPreview ? 'Change photo' : 'Add a photo'}
                                </button>
                                <p className="text-xs text-gray-500 mt-0.5">Optional, but it helps people recognise you.</p>
                            </div>
                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePickFile} className="hidden" />
                        </div>
                    )}

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

                    {/* Batch Year — incoming students are auto-set to the joining batch */}
                    {isIncoming ? (
                        <p className="text-sm text-gray-400">Batch of <span className="text-brand-green font-semibold">{CURRENT_YEAR}</span></p>
                    ) : (
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
                    )}

                    {/* Incoming-only discovery fields */}
                    {isIncoming && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">Hometown / City</label>
                                <input
                                    type="text"
                                    value={formData.hometown}
                                    onChange={e => setFormData(p => ({ ...p, hometown: e.target.value }))}
                                    placeholder="e.g. Bangalore, Mumbai, Delhi"
                                    className="w-full p-3 bg-gray-700/80 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-green"
                                />
                                <p className="text-xs text-gray-500 mt-1">Find batchmates from your city and meet up before campus.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">One-line intro <span className="text-gray-500 font-normal">(optional)</span></label>
                                <input
                                    type="text"
                                    value={formData.intro}
                                    maxLength={INTRO_MAX}
                                    onChange={e => setFormData(p => ({ ...p, intro: e.target.value }))}
                                    placeholder="Something about you — what you're into"
                                    className="w-full p-3 bg-gray-700/80 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-green"
                                />
                                <p className="text-xs text-gray-500 mt-1 text-right">{formData.intro.length}/{INTRO_MAX}</p>
                            </div>

                            <p className="text-xs text-gray-500 leading-relaxed">
                                Only what you see here is shared with other students. litelelo is independent and student-built — nothing is sent to the college.
                            </p>
                        </>
                    )}

                    {error && <p className="text-red-400 text-sm pt-1">{error}</p>}

                    <button
                        type="submit"
                        disabled={isSaving || isCheckingUsername || isUsernameAvailable !== true}
                        className="w-full py-3 bg-brand-green text-black font-semibold rounded-lg hover:bg-brand-green-darker transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    >
                        {isSaving ? <Spinner /> : 'Get started →'}
                    </button>
                </form>
            </div>

            {imageToCrop && (
                <ImageCropper
                    imageSrc={imageToCrop}
                    aspect={1}
                    cropShape="round"
                    isSaving={false}
                    onSave={handleCropSave}
                    onClose={() => { if (imageToCrop) URL.revokeObjectURL(imageToCrop); setImageToCrop(null); }}
                />
            )}
        </div>
    );
};

export default ProfileSetup;
