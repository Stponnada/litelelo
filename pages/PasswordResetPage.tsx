// src/pages/PasswordResetPage.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import Spinner from '../components/Spinner';

const PasswordResetPage: React.FC = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [canReset, setCanReset] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                setCanReset(true);
            }
        });
        
        // Also check immediately on mount
        supabase.auth.getSession().then(({ data: { session } }) => {
            // This is a bit of a trick: when you come from a reset link,
            // Supabase creates a temporary session. If that session exists, allow reset.
            if (session) {
                 setCanReset(true);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (password.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const { error: updateError } = await supabase.auth.updateUser({ password });
            if (updateError) throw updateError;
            setSuccess("Your password has been updated successfully!");
            setTimeout(() => {
                supabase.auth.signOut(); // Sign out of the temporary session
                navigate('/login');
            }, 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!canReset) {
         return (
            <div className="min-h-screen bg-primary-light dark:bg-primary flex flex-col items-center justify-center p-4">
                <div className="max-w-md text-center">
                    <h1 className="text-2xl font-bold text-red-500 mb-4">Invalid or Expired Link</h1>
                    <p className="text-text-secondary-light dark:text-text-secondary mb-6">This password reset link is not valid. Please request a new one.</p>
                    <Link to="/login" className="px-6 py-2 bg-brand-green text-black font-bold rounded-lg hover:bg-brand-green-darker transition-colors">
                        Back to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-primary-light dark:bg-primary flex flex-col items-center justify-center p-4">
            <h1 className="text-5xl font-raleway font-black text-brand-green mb-8">litelelo.</h1>
            <div className="w-full max-w-md bg-secondary-light dark:bg-secondary p-8 rounded-lg shadow-lg">
                {!success ? (
                    <form onSubmit={handlePasswordReset}>
                        <h2 className="text-2xl font-bold text-text-main-light dark:text-text-main mb-6">Set a New Password</h2>
                        <div className="space-y-4">
                            <input
                                type="password"
                                placeholder="New Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full p-3 bg-tertiary-light dark:bg-tertiary border border-tertiary-light dark:border-gray-700 rounded-md text-sm text-text-main-light dark:text-text-main focus:outline-none focus:ring-2 focus:ring-brand-green"
                            />
                            <input
                                type="password"
                                placeholder="Confirm New Password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="w-full p-3 bg-tertiary-light dark:bg-tertiary border border-tertiary-light dark:border-gray-700 rounded-md text-sm text-text-main-light dark:text-text-main focus:outline-none focus:ring-2 focus:ring-brand-green"
                            />
                        </div>
                        {error && <p className="mt-4 text-red-400 text-center text-sm">{error}</p>}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-6 bg-brand-green text-black font-semibold rounded-md py-3 transition duration-300 ease-in-out hover:bg-brand-green-darker disabled:opacity-50"
                        >
                            {loading ? <Spinner /> : 'Update Password'}
                        </button>
                    </form>
                ) : (
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-brand-green mb-4">Success!</h2>
                        <p className="text-text-main-light dark:text-text-main">{success}</p>
                        <p className="text-sm text-text-secondary-light dark:text-text-secondary mt-2">Redirecting you to the login page...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PasswordResetPage;