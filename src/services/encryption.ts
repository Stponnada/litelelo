// src/services/encryption.ts
// End-to-End Encryption service with Legacy Argon2 support and Silent Migration to PBKDF2

import { argon2id } from 'hash-wasm'; // Keep Argon2 for legacy unlocking
import { supabase } from './supabase';

const PRIVATE_KEY_STORAGE_KEY = 'litelelo_chat_private_key';
const DEVICE_UNLOCKED_KEY = 'litelelo_e2ee_unlocked';

let privateKey: CryptoKey | null = null;
let publicKey: CryptoKey | null = null;

// Types
export interface EncryptionStatus {
    hasSetupPin: boolean;
    isUnlocked: boolean;
    failedAttempts: number;
    lockedUntil: Date | null;
    hint: string | null;
    requiresMigration?: boolean;
}

export interface EncryptionKeyRecord {
    user_id: string;
    encrypted_private_key: string;
    public_key: string;
    salt: string;
    key_version: number;
    hint: string | null;
    failed_attempts: number;
    locked_until: string | null;
}

export interface EncryptedMessage {
    encrypted_content: string;
    encrypted_key_sender: string;
    encrypted_key_recipient: string;
}

// ============ HELPER FUNCTIONS ============

function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

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

// ============ KEY DERIVATION ============

/**
 * Version 1: Argon2id (Legacy - Website only)
 */
async function deriveKeyFromPinV1(pin: string, salt: Uint8Array): Promise<Uint8Array> {
    const hash = await argon2id({
        password: pin,
        salt: salt,
        parallelism: 1,
        iterations: 3,
        memorySize: 65536,
        hashLength: 32,
        outputType: 'binary',
    });
    return new Uint8Array(hash);
}

/**
 * Version 2: PBKDF2 (Native - App & Website)
 */
async function deriveKeyFromPinV2(pin: string, salt: Uint8Array): Promise<Uint8Array> {
    const encoder = new TextEncoder();
    const passwordKey = await crypto.subtle.importKey(
        'raw',
        encoder.encode(pin).buffer as ArrayBuffer,
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
    );

    const derivedBits = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: salt as any,
            iterations: 100000,
            hash: 'SHA-256'
        },
        passwordKey,
        256
    );

    return new Uint8Array(derivedBits);
}

async function importAesKey(rawKey: Uint8Array): Promise<CryptoKey> {
    return crypto.subtle.importKey(
        'raw',
        rawKey.buffer as ArrayBuffer,
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
    );
}

// ============ AES/RSA CRYPTO ============

async function encryptAesGcm(data: Uint8Array, key: CryptoKey): Promise<Uint8Array> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data.buffer as ArrayBuffer);
    return concatUint8Arrays(iv, new Uint8Array(ciphertext));
}

async function decryptAesGcm(encryptedData: Uint8Array, key: CryptoKey): Promise<Uint8Array> {
    const iv = encryptedData.slice(0, 12);
    const ciphertext = encryptedData.slice(12);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext.buffer as ArrayBuffer);
    return new Uint8Array(decrypted);
}

async function rsaDecrypt(encryptedData: Uint8Array, privateKey: CryptoKey): Promise<Uint8Array> {
    const decrypted = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, privateKey, encryptedData.buffer as ArrayBuffer);
    return new Uint8Array(decrypted);
}

async function rsaEncrypt(data: Uint8Array, publicKey: CryptoKey): Promise<Uint8Array> {
    const encrypted = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, data.buffer as ArrayBuffer);
    return new Uint8Array(encrypted);
}

async function importPrivateKey(base64Key: string): Promise<CryptoKey> {
    const keyData = base64ToUint8Array(base64Key);
    return crypto.subtle.importKey('pkcs8', keyData.buffer as ArrayBuffer, { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['decrypt']);
}

async function importPublicKey(base64Key: string): Promise<CryptoKey> {
    const keyData = base64ToUint8Array(base64Key);
    return crypto.subtle.importKey('spki', keyData.buffer as ArrayBuffer, { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['encrypt']);
}

// ============ PUBLIC API ============

/**
 * Check if the current user has set up E2EE
 */
export async function getEncryptionStatus(userId: string): Promise<EncryptionStatus> {
    const { data, error } = await supabase
        .from('user_encryption_keys')
        .select('hint, failed_attempts, locked_until, key_version')
        .eq('user_id', userId)
        .single();

    if (error || !data) {
        return {
            hasSetupPin: false,
            isUnlocked: false,
            failedAttempts: 0,
            lockedUntil: null,
            hint: null,
        };
    }

    const requiresMigration = data.key_version === 1;
    // If migration is required, we MUST force a PIN entry to perform the migration,
    // so we treat the device as "locked" for the UI.
    const isUnlocked = !requiresMigration && (privateKey !== null || sessionStorage.getItem(DEVICE_UNLOCKED_KEY) === 'true');

    return {
        hasSetupPin: true,
        isUnlocked,
        failedAttempts: data.failed_attempts,
        lockedUntil: data.locked_until ? new Date(data.locked_until) : null,
        hint: data.hint,
        requiresMigration,
    };
}

/**
 * Set up E2EE with a new 6-digit PIN (Always uses V2)
 */
export async function setupEncryption(userId: string, pin: string, hint?: string): Promise<{ success: boolean; error?: string }> {
    try {
        if (!/^\d{6}$/.test(pin)) {
            return { success: false, error: 'PIN must be exactly 6 digits' };
        }

        const keyPair = await (crypto.subtle.generateKey({
            name: 'RSA-OAEP',
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: 'SHA-256',
        }, true, ['encrypt', 'decrypt']) as Promise<CryptoKeyPair>);

        const publicKeyBase64 = arrayBufferToBase64(await crypto.subtle.exportKey('spki', keyPair.publicKey));
        const privateKeyBase64 = arrayBufferToBase64(await crypto.subtle.exportKey('pkcs8', keyPair.privateKey));

        const salt = crypto.getRandomValues(new Uint8Array(16));
        const wrappingKeyRaw = await deriveKeyFromPinV2(pin, salt);
        const wrappingKey = await importAesKey(wrappingKeyRaw);
        const encryptedPrivateKey = await encryptAesGcm(base64ToUint8Array(privateKeyBase64), wrappingKey);

        const { error } = await supabase.from('user_encryption_keys').upsert({
            user_id: userId,
            encrypted_private_key: arrayBufferToBase64(encryptedPrivateKey),
            public_key: publicKeyBase64,
            salt: arrayBufferToBase64(salt),
            key_version: 2, // New setups are always V2
            hint: hint || null,
            failed_attempts: 0,
            locked_until: null,
        });

        if (error) throw error;
        privateKey = keyPair.privateKey;
        publicKey = keyPair.publicKey;
        sessionStorage.setItem(DEVICE_UNLOCKED_KEY, 'true');
        localStorage.setItem(PRIVATE_KEY_STORAGE_KEY, privateKeyBase64);
        return { success: true };
    } catch (err) {
        console.error('Error setting up encryption:', err);
        return { success: false, error: 'Setup failed' };
    }
}

/**
 * Unlock E2EE with PIN and Auto-Migrate to Version 2 if needed
 */
export async function unlockEncryption(userId: string, pin: string): Promise<{ success: boolean; error?: string; remainingAttempts?: number }> {
    try {
        const { data: record, error: fetchError } = await supabase
            .from('user_encryption_keys')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (fetchError || !record) return { success: false, error: 'Encryption not set up' };

        // Check lockout
        if (record.locked_until) {
            const lockedUntil = new Date(record.locked_until);
            if (lockedUntil > new Date()) {
                const remainingMinutes = Math.ceil((lockedUntil.getTime() - Date.now()) / 60000);
                return { success: false, error: `Account locked. Try again in ${remainingMinutes} minutes.` };
            }
        }

        const salt = base64ToUint8Array(record.salt);
        let privateKeyBase64: string | null = null;
        let migrationRequired = false;

        try {
            if (record.key_version === 1) {
                // Try Legacy Argon2
                const wrappingKeyRaw = await deriveKeyFromPinV1(pin, salt);
                const wrappingKey = await importAesKey(wrappingKeyRaw);
                const decryptedBytes = await decryptAesGcm(base64ToUint8Array(record.encrypted_private_key), wrappingKey);
                privateKeyBase64 = arrayBufferToBase64(decryptedBytes);
                migrationRequired = true; // Success! Now upgrade them.
            } else {
                // Use PBKDF2
                const wrappingKeyRaw = await deriveKeyFromPinV2(pin, salt);
                const wrappingKey = await importAesKey(wrappingKeyRaw);
                const decryptedBytes = await decryptAesGcm(base64ToUint8Array(record.encrypted_private_key), wrappingKey);
                privateKeyBase64 = arrayBufferToBase64(decryptedBytes);
            }

            // Import keys
            privateKey = await importPrivateKey(privateKeyBase64);
            publicKey = await importPublicKey(record.public_key);

            // SILENT MIGRATION: If we used Argon2, update to PBKDF2 now
            if (migrationRequired && privateKeyBase64) {
                console.log('Migrating encryption to Version 2 (App Compatible)...');
                const newWrappingKeyRaw = await deriveKeyFromPinV2(pin, salt);
                const newWrappingKey = await importAesKey(newWrappingKeyRaw);
                const encryptedPrivateKey = await encryptAesGcm(base64ToUint8Array(privateKeyBase64), newWrappingKey);

                await supabase
                    .from('user_encryption_keys')
                    .update({
                        encrypted_private_key: arrayBufferToBase64(encryptedPrivateKey),
                        key_version: 2,
                        failed_attempts: 0,
                        locked_until: null
                    })
                    .eq('user_id', userId);
            } else {
                // Regular reset of failed attempts
                await supabase.from('user_encryption_keys').update({ failed_attempts: 0, locked_until: null }).eq('user_id', userId);
            }

            sessionStorage.setItem(DEVICE_UNLOCKED_KEY, 'true');
            localStorage.setItem(PRIVATE_KEY_STORAGE_KEY, privateKeyBase64);
            return { success: true };

        } catch (err) {
            // Wrong PIN
            const newAttempts = record.failed_attempts + 1;
            const updates: { failed_attempts: number; locked_until?: string } = { failed_attempts: newAttempts };

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
        return { success: false, error: 'Unlock failed' };
    }
}

/**
 * Reset encryption (forgot PIN)
 */
export async function resetEncryption(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('user_encryption_keys')
            .delete()
            .eq('user_id', userId);

        if (error) {
            return { success: false, error: 'Failed to reset encryption' };
        }

        privateKey = null;
        publicKey = null;
        localStorage.removeItem(PRIVATE_KEY_STORAGE_KEY);
        sessionStorage.removeItem(DEVICE_UNLOCKED_KEY);

        return { success: true };
    } catch (err) {
        console.error('Error resetting encryption:', err);
        return { success: false, error: 'Failed to reset encryption' };
    }
}

/**
 * Decrypt a message (tries both sender and recipient keys)
 */
export async function decryptMessage(encryptedContent: string, encKeySender: string | null, encKeyRecipient: string | null): Promise<string | null> {
    if (!privateKey) return null;
    try {
        let aesKeyRaw: Uint8Array | null = null;
        if (encKeyRecipient) {
            try {
                aesKeyRaw = await rsaDecrypt(base64ToUint8Array(encKeyRecipient), privateKey);
            } catch (err) {
                // Not recipient
            }
        }
        if (!aesKeyRaw && encKeySender) {
            try {
                aesKeyRaw = await rsaDecrypt(base64ToUint8Array(encKeySender), privateKey);
            } catch (err) {
                // Not sender
            }
        }
        if (!aesKeyRaw) return null;
        const decryptedBytes = await decryptAesGcm(base64ToUint8Array(encryptedContent), await importAesKey(aesKeyRaw));
        return new TextDecoder().decode(decryptedBytes);
    } catch (err) {
        console.error('Error decrypting message:', err);
        return null;
    }
}

/**
 * Encrypt a message for a recipient
 */
export async function encryptMessageForRecipient(content: string, recipientId: string): Promise<EncryptedMessage | null> {
    if (!privateKey || !publicKey) return null;
    try {
        const recipientPublicKey = await getUserPublicKey(recipientId);
        if (!recipientPublicKey) return null;
        const aesKeyRaw = crypto.getRandomValues(new Uint8Array(32));
        const encryptedContent = await encryptAesGcm(new TextEncoder().encode(content), await importAesKey(aesKeyRaw));
        const encKeySender = await rsaEncrypt(aesKeyRaw, publicKey);
        const encKeyRecipient = await rsaEncrypt(aesKeyRaw, recipientPublicKey);
        return {
            encrypted_content: arrayBufferToBase64(encryptedContent),
            encrypted_key_sender: arrayBufferToBase64(encKeySender),
            encrypted_key_recipient: arrayBufferToBase64(encKeyRecipient),
        };
    } catch (err) {
        console.error('Error encrypting message:', err);
        return null;
    }
}

/**
 * Get a user's public key from the database
 */
export async function getUserPublicKey(userId: string): Promise<CryptoKey | null> {
    try {
        const { data } = await supabase.from('user_encryption_keys').select('public_key').eq('user_id', userId).single();
        if (!data) return null;
        return await importPublicKey(data.public_key);
    } catch (err) {
        return null;
    }
}

/**
 * Check if a recipient has setup encryption
 */
export async function recipientHasEncryption(userId: string): Promise<boolean> {
    return !!(await getUserPublicKey(userId));
}

/**
 * Check if encryption is available
 */
export function isEncryptionAvailable(): boolean { return !!privateKey; }

/**
 * Lock encryption
 */
export function lockEncryption() {
    privateKey = null;
    publicKey = null;
    sessionStorage.removeItem(DEVICE_UNLOCKED_KEY);
    localStorage.removeItem(PRIVATE_KEY_STORAGE_KEY);
}

/**
 * Try to restore keys from localStorage
 */
export async function tryRestoreEncryptionKey(userId: string): Promise<boolean> {
    try {
        const stored = localStorage.getItem(PRIVATE_KEY_STORAGE_KEY);
        if (!stored) return false;
        const { data } = await supabase.from('user_encryption_keys').select('public_key').eq('user_id', userId).single();
        if (!data) return false;
        privateKey = await importPrivateKey(stored);
        publicKey = await importPublicKey(data.public_key);
        sessionStorage.setItem(DEVICE_UNLOCKED_KEY, 'true');
        return true;
    } catch (err) {
        localStorage.removeItem(PRIVATE_KEY_STORAGE_KEY);
        sessionStorage.removeItem(DEVICE_UNLOCKED_KEY);
        return false;
    }
}
