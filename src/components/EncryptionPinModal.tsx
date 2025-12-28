// src/components/EncryptionPinModal.tsx
// Modal for setting up or unlocking E2EE with a 6-digit PIN

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import {
    getEncryptionStatus,
    setupEncryption,
    unlockEncryption,
    resetEncryption,
    EncryptionStatus,
} from '@/services/encryption';
import Spinner from './Spinner';
import { LockClosedIcon, ShieldCheckIcon, ExclamationTriangleIcon } from './icons';

interface EncryptionPinModalProps {
    onComplete: () => void;
    onSkip?: () => void;
}

type ModalView = 'setup' | 'unlock' | 'forgot' | 'confirm_reset' | 'loading';

const PinInput: React.FC<{
    value: string;
    onChange: (value: string) => void;
    error?: boolean;
    disabled?: boolean;
}> = ({ value, onChange, error, disabled }) => {
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const handleChange = (index: number, digit: string) => {
        if (!/^\d*$/.test(digit)) return;

        const newValue = value.split('');
        newValue[index] = digit.slice(-1);
        const newPin = newValue.join('').padEnd(6, '').slice(0, 6);
        onChange(newPin.replace(/\s/g, ''));

        // Move to next input
        if (digit && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !value[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        onChange(pasted);
        const lastIndex = Math.min(pasted.length, 5);
        inputRefs.current[lastIndex]?.focus();
    };

    return (
        <div className="flex justify-center gap-2 sm:gap-3">
            {[0, 1, 2, 3, 4, 5].map((index) => (
                <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={value[index] || ''}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    disabled={disabled}
                    className={`
            w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold
            rounded-xl border-2 transition-all duration-200
            bg-white dark:bg-secondary
            ${error
                            ? 'border-red-500 text-red-500 animate-shake'
                            : value[index]
                                ? 'border-brand-green text-brand-green'
                                : 'border-gray-200 dark:border-gray-700 text-text-main-light dark:text-text-main'
                        }
            focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/30
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
                />
            ))}
        </div>
    );
};

const EncryptionPinModal: React.FC<EncryptionPinModalProps> = ({ onComplete, onSkip }) => {
    const { user } = useAuth();
    const [view, setView] = useState<ModalView>('loading');
    const [status, setStatus] = useState<EncryptionStatus | null>(null);
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [hint, setHint] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showLockWarning, setShowLockWarning] = useState(false);

    const loadStatus = useCallback(async () => {
        if (!user) return;
        const encStatus = await getEncryptionStatus(user.id);
        setStatus(encStatus);

        if (encStatus.isUnlocked) {
            onComplete();
        } else if (encStatus.hasSetupPin) {
            setView('unlock');
        } else {
            setView('setup');
        }
    }, [user, onComplete]);

    useEffect(() => {
        loadStatus();
    }, [loadStatus]);

    const handleSetupSubmit = async () => {
        if (pin.length !== 6) {
            setError('Please enter a 6-digit PIN');
            return;
        }
        if (pin !== confirmPin) {
            setError('PINs do not match');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        const result = await setupEncryption(user!.id, pin, hint || undefined);

        if (result.success) {
            onComplete();
        } else {
            setError(result.error || 'Failed to set up encryption');
        }

        setIsSubmitting(false);
    };

    const handleUnlockSubmit = async () => {
        if (pin.length !== 6) {
            setError('Please enter your 6-digit PIN');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        const result = await unlockEncryption(user!.id, pin);

        if (result.success) {
            // Migration (if any) happened silently in the background
            onComplete();
        } else {
            setError(result.error || 'Wrong PIN');
            setPin('');

            if (result.remainingAttempts !== undefined && result.remainingAttempts <= 2) {
                setShowLockWarning(true);
            }

            // Reload status to get updated attempt count
            await loadStatus();
        }

        setIsSubmitting(false);
    };

    const handleResetConfirm = async () => {
        setIsSubmitting(true);
        const result = await resetEncryption(user!.id);

        if (result.success) {
            setPin('');
            setConfirmPin('');
            setHint('');
            setError(null);
            setView('setup');
        } else {
            setError(result.error || 'Failed to reset');
        }

        setIsSubmitting(false);
    };

    const renderContent = () => {
        switch (view) {
            case 'loading':
                return (
                    <div className="flex flex-col items-center justify-center py-12">
                        <Spinner />
                        <p className="mt-4 text-text-secondary-light dark:text-text-secondary">
                            Loading encryption status...
                        </p>
                    </div>
                );

            case 'setup':
                return (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[11px] font-black uppercase tracking-[0.1em] text-text-tertiary-light dark:text-text-tertiary mb-3 text-center">
                                    Create Security PIN
                                </label>
                                <PinInput
                                    value={pin}
                                    onChange={setPin}
                                    error={!!error && pin.length === 6}
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-black uppercase tracking-[0.1em] text-text-tertiary-light dark:text-text-tertiary mb-3 text-center">
                                    Confirm Security PIN
                                </label>
                                <PinInput
                                    value={confirmPin}
                                    onChange={setConfirmPin}
                                    error={!!error && confirmPin.length === 6}
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-black uppercase tracking-[0.1em] text-text-tertiary-light dark:text-text-tertiary mb-2">
                                Recovery Hint (Optional)
                            </label>
                            <input
                                type="text"
                                value={hint}
                                onChange={(e) => setHint(e.target.value)}
                                placeholder="e.g., Same as my phone lock"
                                maxLength={100}
                                disabled={isSubmitting}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 focus:border-brand-green outline-none transition-all text-text-main-light dark:text-text-main placeholder-gray-400"
                            />
                            <p className="text-xs text-text-tertiary-light dark:text-text-tertiary mt-1">
                                This hint will be shown if you forget your PIN
                            </p>
                        </div>

                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
                                >
                                    <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleSetupSubmit}
                                disabled={pin.length !== 6 || confirmPin.length !== 6 || isSubmitting}
                                className="w-full py-3.5 rounded-xl bg-brand-green text-black font-bold shadow-lg shadow-brand-green/20 hover:shadow-brand-green/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Spinner />
                                        <span>Setting up...</span>
                                    </>
                                ) : (
                                    <>
                                        <LockClosedIcon className="w-5 h-5" />
                                        <span>Enable Encryption</span>
                                    </>
                                )}
                            </button>

                            {onSkip && (
                                <button
                                    onClick={onSkip}
                                    disabled={isSubmitting}
                                    className="w-full py-3 rounded-xl text-text-secondary-light dark:text-text-secondary hover:bg-gray-100 dark:hover:bg-white/5 transition-all font-medium"
                                >
                                    Skip for now
                                </button>
                            )}
                        </div>

                        <p className="text-xs text-center text-text-tertiary-light dark:text-text-tertiary">
                            ⚠️ If you forget your PIN, encrypted messages cannot be recovered.
                        </p>
                    </motion.div>
                );

            case 'unlock':
                return (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <div className="space-y-6">
                            <div className="text-center md:hidden">
                                <ShieldCheckIcon className="w-12 h-12 text-brand-green mx-auto mb-2" />
                                <h2 className="text-2xl font-black text-text-main-light dark:text-text-main">Unlock Access</h2>
                            </div>

                            <div className="space-y-4">
                                <label className="block text-[11px] font-black uppercase tracking-[0.1em] text-text-tertiary-light dark:text-text-tertiary mb-3 text-center">
                                    Enter 6-digit PIN
                                </label>
                                <PinInput
                                    value={pin}
                                    onChange={setPin}
                                    error={!!error}
                                    disabled={isSubmitting || Boolean(status?.lockedUntil && status.lockedUntil > new Date())}
                                />
                            </div>

                            {status?.hint && (
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                                    <p className="text-sm text-blue-700 dark:text-blue-300">
                                        <span className="font-semibold">Hint:</span> {status.hint}
                                    </p>
                                </div>
                            )}
                        </div>

                        {status?.lockedUntil && status.lockedUntil > new Date() && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-center"
                            >
                                <ExclamationTriangleIcon className="w-8 h-8 text-red-500 mx-auto mb-2" />
                                <p className="text-red-600 dark:text-red-400 font-semibold">
                                    Too many failed attempts
                                </p>
                                <p className="text-sm text-red-500 dark:text-red-400">
                                    Try again in {Math.ceil((status.lockedUntil.getTime() - Date.now()) / 60000)} minutes
                                </p>
                            </motion.div>
                        )}

                        <AnimatePresence>
                            {error && !(status?.lockedUntil && status.lockedUntil > new Date()) && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
                                >
                                    <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {showLockWarning && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl"
                            >
                                <p className="text-sm text-yellow-700 dark:text-yellow-400 text-center">
                                    ⚠️ You&apos;re running low on attempts. Your account will be locked after 5 failed tries.
                                </p>
                            </motion.div>
                        )}

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleUnlockSubmit}
                                disabled={pin.length !== 6 || isSubmitting || (status?.lockedUntil != null && status.lockedUntil > new Date())}
                                className="w-full py-3.5 rounded-xl bg-brand-green text-black font-bold shadow-lg shadow-brand-green/20 hover:shadow-brand-green/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Spinner />
                                        <span>Unlocking...</span>
                                    </>
                                ) : (
                                    'Unlock'
                                )}
                            </button>

                            <button
                                onClick={() => setView('forgot')}
                                disabled={isSubmitting}
                                className="w-full py-3 rounded-xl text-text-secondary-light dark:text-text-secondary hover:bg-gray-100 dark:hover:bg-white/5 transition-all font-medium"
                            >
                                Forgot PIN?
                            </button>
                        </div>
                    </motion.div>
                );

            case 'forgot':
                return (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
                                <ExclamationTriangleIcon className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-text-main-light dark:text-text-main">
                                Forgot Your PIN?
                            </h2>
                            <p className="text-sm text-text-secondary-light dark:text-text-secondary mt-2 max-w-sm mx-auto">
                                Your encryption PIN cannot be recovered. If you reset it, all previously encrypted messages will become unreadable.
                            </p>
                        </div>

                        {status?.hint && (
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                                <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">
                                    Your hint was:
                                </p>
                                <p className="text-blue-600 dark:text-blue-400">&quot;{status.hint}&quot;</p>
                            </div>
                        )}

                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-xl">
                            <p className="text-sm text-red-700 dark:text-red-400">
                                <strong>Warning:</strong> Resetting your PIN will:
                            </p>
                            <ul className="text-sm text-red-600 dark:text-red-400 mt-2 space-y-1 list-disc list-inside">
                                <li>Delete your encryption key</li>
                                <li>Make all encrypted messages unreadable</li>
                                <li>Require you to set up a new PIN</li>
                            </ul>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => setView('unlock')}
                                className="w-full py-3.5 rounded-xl bg-brand-green text-black font-bold shadow-lg shadow-brand-green/20 hover:shadow-brand-green/40 transition-all"
                            >
                                Try Again
                            </button>

                            <button
                                onClick={() => setView('confirm_reset')}
                                className="w-full py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-all"
                            >
                                Reset Encryption
                            </button>
                        </div>
                    </motion.div>
                );

            case 'confirm_reset':
                return (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                                <ExclamationTriangleIcon className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">
                                Are You Sure?
                            </h2>
                            <p className="text-sm text-text-secondary-light dark:text-text-secondary mt-2">
                                This action cannot be undone. All encrypted messages will be lost.
                            </p>
                        </div>

                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
                                >
                                    <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => setView('forgot')}
                                disabled={isSubmitting}
                                className="w-full py-3.5 rounded-xl bg-gray-200 dark:bg-gray-700 text-text-main-light dark:text-text-main font-bold transition-all hover:bg-gray-300 dark:hover:bg-gray-600"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleResetConfirm}
                                disabled={isSubmitting}
                                className="w-full py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-all flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Spinner />
                                        <span>Resetting...</span>
                                    </>
                                ) : (
                                    'Yes, Reset Everything'
                                )}
                            </button>
                        </div>
                    </motion.div>
                );

            default:
                return null;
        }
    };

    if (!user) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-secondary rounded-[32px] shadow-2xl w-full max-w-4xl overflow-hidden border border-gray-100 dark:border-white/5 flex flex-col md:flex-row min-h-[500px]"
            >
                {/* Visual/Trust Side */}
                <div className="w-full md:w-5/12 bg-gradient-to-br from-brand-green/20 via-blue-500/5 to-secondary dark:from-brand-green/10 dark:via-secondary dark:to-secondary p-8 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-gray-100 dark:border-white/5">
                    {view === 'setup' ? (
                        <div className="space-y-6">
                            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-brand-green via-green-500 to-emerald-600 flex items-center justify-center shadow-2xl relative">
                                <ShieldCheckIcon className="w-10 h-10 text-black" />
                                <motion.div
                                    animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                    className="absolute inset-0 bg-brand-green rounded-3xl blur-2xl -z-10"
                                />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black text-text-main-light dark:text-text-main tracking-tight font-poppins leading-tight">
                                    End-to-end encryption is here.
                                </h2>
                                <p className="text-[15px] text-text-secondary-light dark:text-text-secondary mt-4 leading-relaxed">
                                    Your messages are private. <br /> <span className="text-brand-green font-bold">Truly private.</span>
                                </p>
                            </div>

                            <div className="space-y-3 text-left bg-white/50 dark:bg-black/20 p-5 rounded-2xl backdrop-blur-sm border border-white/20 dark:border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 rounded-lg bg-brand-green/20 text-brand-green">
                                        <ShieldCheckIcon className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs font-bold text-text-secondary-light dark:text-text-secondary uppercase tracking-tight">RSA-4096 Security</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 rounded-lg bg-brand-green/20 text-brand-green">
                                        <LockClosedIcon className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs font-bold text-text-secondary-light dark:text-text-secondary uppercase tracking-tight">Zero-Knowledge</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-brand-green to-emerald-600 flex items-center justify-center shadow-2xl relative">
                                <LockClosedIcon className="w-10 h-10 text-black" />
                                <motion.div
                                    animate={{ opacity: [0.2, 0.4, 0.2] }}
                                    transition={{ duration: 4, repeat: Infinity }}
                                    className="absolute inset-0 bg-brand-green rounded-3xl blur-2xl -z-10"
                                />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black font-poppins text-text-main-light dark:text-text-main tracking-tight leading-tight">
                                    Unlock Access
                                </h2>
                                <p className="text-[15px] text-text-secondary-light dark:text-text-secondary mt-3">
                                    Securely access your <br /> private conversations.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Interaction Side */}
                <div className="flex-1 p-8 md:p-12 flex flex-col justify-center bg-white dark:bg-secondary">
                    {renderContent()}
                </div>
            </motion.div>
        </div>
    );
};

export default EncryptionPinModal;
