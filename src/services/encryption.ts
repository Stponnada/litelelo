// src/services/encryption.ts
// End-to-End Encryption service using asymmetric RSA + symmetric AES
// Each user has a public/private key pair. Messages are encrypted with recipient's public key.

import { argon2id } from 'hash-wasm';
import { supabase } from './supabase';

// Constants
const PRIVATE_KEY_STORAGE_KEY = 'litelelo_chat_private_key';
const DEVICE_UNLOCKED_KEY = 'litelelo_e2ee_unlocked';

// Key state (in-memory, cleared on page refresh)
let privateKey: CryptoKey | null = null;
let publicKey: CryptoKey | null = null;

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
    encrypted_private_key: string;
    public_key: string;
    salt: string;
    key_version: number;
    hint: string | null;
    failed_attempts: number;
    locked_until: string | null;
}

export interface EncryptedMessage {
    encrypted_content: string;        // AES-encrypted message
    encrypted_key_sender: string;     // AES key encrypted with sender's public key
    encrypted_key_recipient: string;  // AES key encrypted with recipient's public key
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

// ============ KEY DERIVATION (for encrypting private key with PIN) ============

async function deriveKeyFromPin(pin: string, salt: Uint8Array): Promise<Uint8Array> {
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

async function importAesKey(rawKey: Uint8Array): Promise<CryptoKey> {
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

// ============ SYMMETRIC AES ENCRYPTION (for message content) ============

async function encryptAesGcm(data: Uint8Array, key: CryptoKey): Promise<Uint8Array> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const dataBuffer = new ArrayBuffer(data.length);
    new Uint8Array(dataBuffer).set(data);
    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        dataBuffer
    );
    return concatUint8Arrays(iv, new Uint8Array(ciphertext));
}

async function decryptAesGcm(encryptedData: Uint8Array, key: CryptoKey): Promise<Uint8Array> {
    const iv = encryptedData.slice(0, 12);
    const ciphertext = encryptedData.slice(12);
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

// ============ RSA KEY PAIR GENERATION ============

async function generateRsaKeyPair(): Promise<CryptoKeyPair> {
    return crypto.subtle.generateKey(
        {
            name: 'RSA-OAEP',
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: 'SHA-256',
        },
        true, // extractable
        ['encrypt', 'decrypt']
    );
}

async function exportPublicKey(key: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey('spki', key);
    return arrayBufferToBase64(exported);
}

async function exportPrivateKey(key: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey('pkcs8', key);
    return arrayBufferToBase64(exported);
}

async function importPublicKey(base64Key: string): Promise<CryptoKey> {
    const keyData = base64ToUint8Array(base64Key);
    const keyBuffer = new ArrayBuffer(keyData.length);
    new Uint8Array(keyBuffer).set(keyData);
    return crypto.subtle.importKey(
        'spki',
        keyBuffer,
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        false,
        ['encrypt']
    );
}

async function importPrivateKey(base64Key: string): Promise<CryptoKey> {
    const keyData = base64ToUint8Array(base64Key);
    const keyBuffer = new ArrayBuffer(keyData.length);
    new Uint8Array(keyBuffer).set(keyData);
    return crypto.subtle.importKey(
        'pkcs8',
        keyBuffer,
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        false,
        ['decrypt']
    );
}

// ============ RSA ENCRYPTION/DECRYPTION (for AES key) ============

async function rsaEncrypt(data: Uint8Array, publicKey: CryptoKey): Promise<Uint8Array> {
    const dataBuffer = new ArrayBuffer(data.length);
    new Uint8Array(dataBuffer).set(data);
    const encrypted = await crypto.subtle.encrypt(
        { name: 'RSA-OAEP' },
        publicKey,
        dataBuffer
    );
    return new Uint8Array(encrypted);
}

async function rsaDecrypt(encryptedData: Uint8Array, privateKey: CryptoKey): Promise<Uint8Array> {
    const dataBuffer = new ArrayBuffer(encryptedData.length);
    new Uint8Array(dataBuffer).set(encryptedData);
    const decrypted = await crypto.subtle.decrypt(
        { name: 'RSA-OAEP' },
        privateKey,
        dataBuffer
    );
    return new Uint8Array(decrypted);
}

// ============ PUBLIC API ============

/**
 * Check if the current user has set up E2EE
 */
export async function getEncryptionStatus(userId: string): Promise<EncryptionStatus> {
    const { data, error } = await supabase
        .from('user_encryption_keys')
        .select('hint, failed_attempts, locked_until')
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

    const isUnlocked = privateKey !== null || sessionStorage.getItem(DEVICE_UNLOCKED_KEY) === 'true';

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
 * Generates RSA key pair, stores public key, encrypts private key with PIN
 */
export async function setupEncryption(userId: string, pin: string, hint?: string): Promise<{ success: boolean; error?: string }> {
    try {
        if (!/^\d{6}$/.test(pin)) {
            return { success: false, error: 'PIN must be exactly 6 digits' };
        }

        // Generate RSA key pair
        const keyPair = await generateRsaKeyPair();

        // Export keys
        const publicKeyBase64 = await exportPublicKey(keyPair.publicKey);
        const privateKeyBase64 = await exportPrivateKey(keyPair.privateKey);

        // Encrypt private key with PIN-derived key
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const wrappingKeyRaw = await deriveKeyFromPin(pin, salt);
        const wrappingKey = await importAesKey(wrappingKeyRaw);
        const privateKeyBytes = base64ToUint8Array(privateKeyBase64);
        const encryptedPrivateKey = await encryptAesGcm(privateKeyBytes, wrappingKey);

        // Store in database
        const { error } = await supabase
            .from('user_encryption_keys')
            .upsert({
                user_id: userId,
                encrypted_private_key: arrayBufferToBase64(encryptedPrivateKey),
                public_key: publicKeyBase64,
                salt: arrayBufferToBase64(salt),
                key_version: 1,
                hint: hint || null,
                failed_attempts: 0,
                locked_until: null,
            });

        if (error) {
            console.error('Error storing encryption keys:', error);
            return { success: false, error: 'Failed to save encryption keys' };
        }

        // Store keys in memory
        privateKey = keyPair.privateKey;
        publicKey = keyPair.publicKey;

        // Mark device as unlocked
        sessionStorage.setItem(DEVICE_UNLOCKED_KEY, 'true');

        // Store private key in localStorage for persistence
        localStorage.setItem(PRIVATE_KEY_STORAGE_KEY, privateKeyBase64);

        return { success: true };
    } catch (err) {
        console.error('Error setting up encryption:', err);
        return { success: false, error: 'Failed to set up encryption' };
    }
}

/**
 * Unlock E2EE with PIN
 */
export async function unlockEncryption(userId: string, pin: string): Promise<{ success: boolean; error?: string; remainingAttempts?: number }> {
    try {
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

        // Try to decrypt the private key
        try {
            const encryptedPrivateKey = base64ToUint8Array(record.encrypted_private_key);
            const decryptedPrivateKeyBytes = await decryptAesGcm(encryptedPrivateKey, wrappingKey);
            const privateKeyBase64 = arrayBufferToBase64(decryptedPrivateKeyBytes);

            // Import keys
            privateKey = await importPrivateKey(privateKeyBase64);
            publicKey = await importPublicKey(record.public_key);

            // Reset failed attempts
            await supabase
                .from('user_encryption_keys')
                .update({ failed_attempts: 0, locked_until: null })
                .eq('user_id', userId);

            // Mark as unlocked
            sessionStorage.setItem(DEVICE_UNLOCKED_KEY, 'true');
            localStorage.setItem(PRIVATE_KEY_STORAGE_KEY, privateKeyBase64);

            return { success: true };
        } catch {
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
        return { success: false, error: 'Failed to unlock encryption' };
    }
}

/**
 * Try to restore keys from localStorage
 */
export async function tryRestoreEncryptionKey(userId: string): Promise<boolean> {
    try {
        const storedPrivateKey = localStorage.getItem(PRIVATE_KEY_STORAGE_KEY);
        if (!storedPrivateKey) return false;

        // Get public key from database
        const { data, error } = await supabase
            .from('user_encryption_keys')
            .select('public_key')
            .eq('user_id', userId)
            .single();

        if (error || !data) return false;

        privateKey = await importPrivateKey(storedPrivateKey);
        publicKey = await importPublicKey(data.public_key);
        sessionStorage.setItem(DEVICE_UNLOCKED_KEY, 'true');
        return true;
    } catch {
        localStorage.removeItem(PRIVATE_KEY_STORAGE_KEY);
        sessionStorage.removeItem(DEVICE_UNLOCKED_KEY);
        return false;
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
 * Get a user's public key from the database
 */
export async function getUserPublicKey(userId: string): Promise<CryptoKey | null> {
    try {
        const { data, error } = await supabase
            .from('user_encryption_keys')
            .select('public_key')
            .eq('user_id', userId)
            .single();

        if (error || !data) return null;
        return await importPublicKey(data.public_key);
    } catch {
        return null;
    }
}

/**
 * Encrypt a message for a recipient
 * Returns encrypted content + encrypted AES keys for both sender and recipient
 */
export async function encryptMessageForRecipient(
    content: string,
    recipientId: string
): Promise<EncryptedMessage | null> {
    if (!privateKey || !publicKey) {
        console.warn('Encryption keys not available');
        return null;
    }

    try {
        // Get recipient's public key
        const recipientPublicKey = await getUserPublicKey(recipientId);
        if (!recipientPublicKey) {
            console.warn('Recipient has not set up encryption');
            return null;
        }

        // Generate random AES key for this message
        const aesKeyRaw = crypto.getRandomValues(new Uint8Array(32));
        const aesKey = await importAesKey(aesKeyRaw);

        // Encrypt message content with AES
        const encoder = new TextEncoder();
        const messageBytes = encoder.encode(content);
        const encryptedContent = await encryptAesGcm(messageBytes, aesKey);

        // Encrypt AES key with sender's public key (so sender can read their sent messages)
        const encryptedKeyForSender = await rsaEncrypt(aesKeyRaw, publicKey);

        // Encrypt AES key with recipient's public key
        const encryptedKeyForRecipient = await rsaEncrypt(aesKeyRaw, recipientPublicKey);

        return {
            encrypted_content: arrayBufferToBase64(encryptedContent),
            encrypted_key_sender: arrayBufferToBase64(encryptedKeyForSender),
            encrypted_key_recipient: arrayBufferToBase64(encryptedKeyForRecipient),
        };
    } catch (err) {
        console.error('Error encrypting message:', err);
        return null;
    }
}

/**
 * Decrypt a message (tries both sender and recipient keys)
 */
export async function decryptMessage(
    encryptedContent: string,
    encryptedKeySender: string | null,
    encryptedKeyRecipient: string | null
): Promise<string | null> {
    if (!privateKey) {
        console.warn('Private key not available');
        return null;
    }

    try {
        let aesKeyRaw: Uint8Array | null = null;

        // Try to decrypt the AES key with our private key
        // First try recipient key, then sender key
        if (encryptedKeyRecipient) {
            try {
                const encryptedKey = base64ToUint8Array(encryptedKeyRecipient);
                aesKeyRaw = await rsaDecrypt(encryptedKey, privateKey);
            } catch {
                // Not the recipient, try sender key
            }
        }

        if (!aesKeyRaw && encryptedKeySender) {
            try {
                const encryptedKey = base64ToUint8Array(encryptedKeySender);
                aesKeyRaw = await rsaDecrypt(encryptedKey, privateKey);
            } catch {
                // Not the sender either
            }
        }

        if (!aesKeyRaw) {
            console.warn('Could not decrypt AES key - message not for this user');
            return null;
        }

        // Decrypt message content
        const aesKey = await importAesKey(aesKeyRaw);
        const encryptedData = base64ToUint8Array(encryptedContent);
        const decryptedBytes = await decryptAesGcm(encryptedData, aesKey);
        const decoder = new TextDecoder();
        return decoder.decode(decryptedBytes);
    } catch (err) {
        console.error('Error decrypting message:', err);
        return null;
    }
}

/**
 * Check if encryption is available
 */
export function isEncryptionAvailable(): boolean {
    return privateKey !== null && publicKey !== null;
}

/**
 * Check if a recipient has encryption set up
 */
export async function recipientHasEncryption(recipientId: string): Promise<boolean> {
    const { data, error } = await supabase
        .from('user_encryption_keys')
        .select('user_id')
        .eq('user_id', recipientId)
        .single();

    return !error && !!data;
}

/**
 * Lock encryption (clear keys from memory)
 */
export function lockEncryption(): void {
    privateKey = null;
    publicKey = null;
    sessionStorage.removeItem(DEVICE_UNLOCKED_KEY);
    localStorage.removeItem(PRIVATE_KEY_STORAGE_KEY);
}
