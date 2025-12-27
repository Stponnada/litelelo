// src/services/encryption.ts
// End-to-End Encryption service using PIN-based key derivation

import { argon2id } from 'hash-wasm';
import { supabase } from './supabase';

// Constants
const ENCRYPTION_KEY_STORAGE_KEY = 'litelelo_chat_encryption_key';
const DEVICE_UNLOCKED_KEY = 'litelelo_e2ee_unlocked';

// Encryption key state (in-memory, cleared on page refresh)
let encryptionKey: CryptoKey | null = null;

// Types
export interface EncryptionStatus {
    hasSetupPin: boolean;
    isUnlocked: boolean;
    failedAttempts: number;
    lockedUntil: Date | null;
    hint: string | null;
}

export interface EncryptionKeyRecord {
    user_id: string;
    encrypted_key_blob: string;
    salt: string;
    key_version: number;
    hint: string | null;
    failed_attempts: number;
    locked_until: string | null;
}

// Helper: Convert ArrayBuffer or Uint8Array to Base64
function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

// Helper: Convert Base64 to Uint8Array
function base64ToUint8Array(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

// Helper: Concatenate Uint8Arrays
function concatUint8Arrays(...arrays: Uint8Array[]): Uint8Array {
    const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const arr of arrays) {
        result.set(arr, offset);
        offset += arr.length;
    }
    return result;
}

// Derive a wrapping key from PIN using Argon2id
async function deriveKeyFromPin(pin: string, salt: Uint8Array): Promise<Uint8Array> {
    const hash = await argon2id({
        password: pin,
        salt: salt,
        parallelism: 1,
        iterations: 3,
        memorySize: 65536, // 64 MB - makes brute force expensive
        hashLength: 32,
        outputType: 'binary',
    });
    return new Uint8Array(hash);
}

// Import a raw key as a CryptoKey for AES-GCM
async function importAesKey(rawKey: Uint8Array): Promise<CryptoKey> {
    // Copy to a fresh ArrayBuffer to ensure compatibility
    const keyBuffer = new ArrayBuffer(rawKey.length);
    new Uint8Array(keyBuffer).set(rawKey);
    return crypto.subtle.importKey(
        'raw',
        keyBuffer,
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
    );
}

// Encrypt data using AES-GCM
async function encryptAesGcm(data: Uint8Array, key: CryptoKey): Promise<Uint8Array> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    // Copy data to a fresh ArrayBuffer for compatibility
    const dataBuffer = new ArrayBuffer(data.length);
    new Uint8Array(dataBuffer).set(data);
    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        dataBuffer
    );
    // Prepend IV to ciphertext
    return concatUint8Arrays(iv, new Uint8Array(ciphertext));
}

// Decrypt data using AES-GCM (IV is prepended)
async function decryptAesGcm(encryptedData: Uint8Array, key: CryptoKey): Promise<Uint8Array> {
    const iv = encryptedData.slice(0, 12);
    const ciphertext = encryptedData.slice(12);
    // Copy to fresh ArrayBuffers for compatibility
    const ivBuffer = new ArrayBuffer(iv.length);
    new Uint8Array(ivBuffer).set(iv);
    const ciphertextBuffer = new ArrayBuffer(ciphertext.length);
    new Uint8Array(ciphertextBuffer).set(ciphertext);
    const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: new Uint8Array(ivBuffer) },
        key,
        ciphertextBuffer
    );
    return new Uint8Array(decrypted);
}

/**
 * Check if the current user has set up E2EE and if the device is unlocked
 */
export async function getEncryptionStatus(userId: string): Promise<EncryptionStatus> {
    const { data, error } = await supabase
        .from('user_encryption_keys')
        .select('hint, failed_attempts, locked_until')
        .eq('user_id', userId)
        .single();

    if (error || !data) {
        // No encryption key exists - user hasn't set up PIN yet
        return {
            hasSetupPin: false,
            isUnlocked: false,
            failedAttempts: 0,
            lockedUntil: null,
            hint: null,
        };
    }

    // Check if device is unlocked (key is in memory or session storage marker)
    const isUnlocked = encryptionKey !== null || sessionStorage.getItem(DEVICE_UNLOCKED_KEY) === 'true';

    return {
        hasSetupPin: true,
        isUnlocked,
        failedAttempts: data.failed_attempts,
        lockedUntil: data.locked_until ? new Date(data.locked_until) : null,
        hint: data.hint,
    };
}

/**
 * Set up E2EE with a new 6-digit PIN
 */
export async function setupEncryption(userId: string, pin: string, hint?: string): Promise<{ success: boolean; error?: string }> {
    try {
        // Validate PIN
        if (!/^\d{6}$/.test(pin)) {
            return { success: false, error: 'PIN must be exactly 6 digits' };
        }

        // Generate random 256-bit encryption key
        const rawEncryptionKey = crypto.getRandomValues(new Uint8Array(32));

        // Generate random salt for Argon2
        const salt = crypto.getRandomValues(new Uint8Array(16));

        // Derive wrapping key from PIN
        const wrappingKeyRaw = await deriveKeyFromPin(pin, salt);
        const wrappingKey = await importAesKey(wrappingKeyRaw);

        // Encrypt the encryption key with the wrapping key
        const encryptedBlob = await encryptAesGcm(rawEncryptionKey, wrappingKey);

        // Store in database
        const { error } = await supabase
            .from('user_encryption_keys')
            .upsert({
                user_id: userId,
                encrypted_key_blob: arrayBufferToBase64(encryptedBlob),
                salt: arrayBufferToBase64(salt),
                key_version: 1,
                hint: hint || null,
                failed_attempts: 0,
                locked_until: null,
            });

        if (error) {
            console.error('Error storing encryption key:', error);
            return { success: false, error: 'Failed to save encryption key' };
        }

        // Import as CryptoKey and store in memory
        encryptionKey = await importAesKey(rawEncryptionKey);

        // Mark device as unlocked in session storage
        sessionStorage.setItem(DEVICE_UNLOCKED_KEY, 'true');

        // Also store encrypted key in localStorage for persistence within browser
        localStorage.setItem(ENCRYPTION_KEY_STORAGE_KEY, arrayBufferToBase64(rawEncryptionKey));

        return { success: true };
    } catch (err) {
        console.error('Error setting up encryption:', err);
        return { success: false, error: 'Failed to set up encryption' };
    }
}

/**
 * Unlock E2EE with PIN on a new device/session
 */
export async function unlockEncryption(userId: string, pin: string): Promise<{ success: boolean; error?: string; remainingAttempts?: number }> {
    try {
        // Fetch encryption key record
        const { data, error: fetchError } = await supabase
            .from('user_encryption_keys')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (fetchError || !data) {
            return { success: false, error: 'Encryption not set up' };
        }

        const record = data as EncryptionKeyRecord;

        // Check lockout
        if (record.locked_until) {
            const lockedUntil = new Date(record.locked_until);
            if (lockedUntil > new Date()) {
                const remainingMinutes = Math.ceil((lockedUntil.getTime() - Date.now()) / 60000);
                return { success: false, error: `Account locked. Try again in ${remainingMinutes} minutes.` };
            }
        }

        // Derive wrapping key from PIN
        const salt = base64ToUint8Array(record.salt);
        const wrappingKeyRaw = await deriveKeyFromPin(pin, salt);
        const wrappingKey = await importAesKey(wrappingKeyRaw);

        // Try to decrypt the encryption key
        try {
            const encryptedBlob = base64ToUint8Array(record.encrypted_key_blob);
            const decryptedKey = await decryptAesGcm(encryptedBlob, wrappingKey);

            // Success! Reset failed attempts
            await supabase
                .from('user_encryption_keys')
                .update({ failed_attempts: 0, locked_until: null })
                .eq('user_id', userId);

            // Store key in memory
            encryptionKey = await importAesKey(decryptedKey);

            // Mark device as unlocked
            sessionStorage.setItem(DEVICE_UNLOCKED_KEY, 'true');

            // Store in localStorage for persistence
            localStorage.setItem(ENCRYPTION_KEY_STORAGE_KEY, arrayBufferToBase64(decryptedKey));

            return { success: true };
        } catch {
            // Wrong PIN - increment failed attempts
            const newAttempts = record.failed_attempts + 1;
            const updates: { failed_attempts: number; locked_until?: string } = { failed_attempts: newAttempts };

            // Lock after 5 failed attempts for 15 minutes
            if (newAttempts >= 5) {
                const lockUntil = new Date(Date.now() + 15 * 60 * 1000);
                updates.locked_until = lockUntil.toISOString();
            }

            await supabase
                .from('user_encryption_keys')
                .update(updates)
                .eq('user_id', userId);

            const remainingAttempts = Math.max(0, 5 - newAttempts);
            return {
                success: false,
                error: remainingAttempts > 0
                    ? `Wrong PIN. ${remainingAttempts} attempts remaining.`
                    : 'Too many failed attempts. Account locked for 15 minutes.',
                remainingAttempts
            };
        }
    } catch (err) {
        console.error('Error unlocking encryption:', err);
        return { success: false, error: 'Failed to unlock encryption' };
    }
}

/**
 * Try to restore encryption key from localStorage (for page refreshes)
 */
export async function tryRestoreEncryptionKey(): Promise<boolean> {
    try {
        const storedKey = localStorage.getItem(ENCRYPTION_KEY_STORAGE_KEY);
        if (!storedKey) return false;

        const keyData = base64ToUint8Array(storedKey);
        encryptionKey = await importAesKey(keyData);
        sessionStorage.setItem(DEVICE_UNLOCKED_KEY, 'true');
        return true;
    } catch {
        // Clear invalid data
        localStorage.removeItem(ENCRYPTION_KEY_STORAGE_KEY);
        sessionStorage.removeItem(DEVICE_UNLOCKED_KEY);
        return false;
    }
}

/**
 * Reset encryption (forgot PIN) - WARNING: This clears all encrypted messages
 */
export async function resetEncryption(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
        // Delete the encryption key record
        const { error } = await supabase
            .from('user_encryption_keys')
            .delete()
            .eq('user_id', userId);

        if (error) {
            return { success: false, error: 'Failed to reset encryption' };
        }

        // Clear local state
        encryptionKey = null;
        localStorage.removeItem(ENCRYPTION_KEY_STORAGE_KEY);
        sessionStorage.removeItem(DEVICE_UNLOCKED_KEY);

        return { success: true };
    } catch (err) {
        console.error('Error resetting encryption:', err);
        return { success: false, error: 'Failed to reset encryption' };
    }
}

/**
 * Change PIN
 */
export async function changePin(userId: string, oldPin: string, newPin: string, newHint?: string): Promise<{ success: boolean; error?: string }> {
    // First, unlock with old PIN
    const unlockResult = await unlockEncryption(userId, oldPin);
    if (!unlockResult.success) {
        return { success: false, error: unlockResult.error };
    }

    // Now reset and setup with new PIN
    await resetEncryption(userId);
    return await setupEncryption(userId, newPin, newHint);
}

/**
 * Encrypt a message for sending
 */
export async function encryptMessage(content: string): Promise<string | null> {
    if (!encryptionKey) {
        console.warn('Encryption key not available');
        return null;
    }

    try {
        const encoder = new TextEncoder();
        const data = encoder.encode(content);
        const encrypted = await encryptAesGcm(data, encryptionKey);
        return arrayBufferToBase64(encrypted);
    } catch (err) {
        console.error('Error encrypting message:', err);
        return null;
    }
}

/**
 * Decrypt a message
 */
export async function decryptMessage(encryptedContent: string): Promise<string | null> {
    if (!encryptionKey) {
        console.warn('Encryption key not available');
        return null;
    }

    try {
        const encryptedData = base64ToUint8Array(encryptedContent);
        const decrypted = await decryptAesGcm(encryptedData, encryptionKey);
        const decoder = new TextDecoder();
        return decoder.decode(decrypted);
    } catch (err) {
        console.error('Error decrypting message:', err);
        return null;
    }
}

/**
 * Check if encryption is currently available (key loaded)
 */
export function isEncryptionAvailable(): boolean {
    return encryptionKey !== null;
}

/**
 * Lock encryption (clear keys from memory)
 */
export function lockEncryption(): void {
    encryptionKey = null;
    sessionStorage.removeItem(DEVICE_UNLOCKED_KEY);
    localStorage.removeItem(ENCRYPTION_KEY_STORAGE_KEY);
}
