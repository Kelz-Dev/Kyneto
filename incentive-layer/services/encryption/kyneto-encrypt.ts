import * as crypto from 'crypto';

/**
 * Kyneto File Encryption Module
 * ==============================
 * AES-256-GCM for file encryption + ECIES-style key wrapping
 * using the user's Ethereum secp256k1 public key.
 *
 * Usage:
 *   const { encryptedData, encryptedKey, iv, authTag } = await encryptFile(fileBuffer, ethPublicKey);
 *   const plaintext = await decryptFile(encryptedData, encryptedKey, iv, authTag, ethPrivateKey);
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits recommended for GCM
const KEY_LENGTH = 32; // 256 bits

/**
 * Encrypt a file buffer with AES-256-GCM.
 * The AES key is then encrypted with the user's Ethereum public key using ECIES.
 *
 * @param fileBuffer - Raw file data
 * @param ethPublicKeyHex - Ethereum public key (uncompressed, 65 bytes hex, with or without 0x04 prefix)
 * @returns Encrypted payload
 */
export async function encryptFile(
    fileBuffer: Buffer,
    ethPublicKeyHex: string
): Promise<{
    encryptedData: Buffer;
    encryptedKey: string;
    iv: string;
    authTag: string;
}> {
    // 1. Generate random AES key and IV
    const aesKey = crypto.randomBytes(KEY_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);

    // 2. Encrypt file with AES-256-GCM
    const cipher = crypto.createCipheriv(ALGORITHM, aesKey, iv);
    const encryptedData = Buffer.concat([
        cipher.update(fileBuffer),
        cipher.final()
    ]);
    const authTag = cipher.getAuthTag();

    // 3. Encrypt the AES key with the user's public key using ECIES
    const encryptedKey = await eciesEncrypt(ethPublicKeyHex, aesKey);

    return {
        encryptedData,
        encryptedKey: encryptedKey.toString('hex'),
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
    };
}

/**
 * Decrypt a file using the user's Ethereum private key.
 *
 * @param encryptedData - AES-encrypted file data
 * @param encryptedKeyHex - ECIES-encrypted AES key (hex)
 * @param ivHex - AES initialization vector (hex)
 * @param authTagHex - AES-GCM authentication tag (hex)
 * @param ethPrivateKeyHex - Ethereum private key (hex, with or without 0x prefix)
 * @returns Decrypted file buffer
 */
export async function decryptFile(
    encryptedData: Buffer,
    encryptedKeyHex: string,
    ivHex: string,
    authTagHex: string,
    ethPrivateKeyHex: string
): Promise<Buffer> {
    // 1. Decrypt the AES key using the private key
    const encryptedKey = Buffer.from(encryptedKeyHex, 'hex');
    const privateKey = normalizePrivateKey(ethPrivateKeyHex);
    const aesKey = await eciesDecrypt(privateKey, encryptedKey);

    // 2. Decrypt the file with the recovered AES key
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, aesKey, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
        decipher.update(encryptedData),
        decipher.final()
    ]);

    return decrypted;
}

// ============================================================
// ECIES (Elliptic Curve Integrated Encryption Scheme)
// Manual implementation using Node.js crypto (no external deps)
// Uses secp256k1 (same curve as Ethereum)
// ============================================================

/**
 * ECIES encrypt: encrypt data for a given public key.
 * 1. Generate ephemeral key pair
 * 2. Derive shared secret via ECDH
 * 3. Encrypt payload with AES-256-GCM using derived key
 */
async function eciesEncrypt(publicKeyHex: string, data: Buffer): Promise<Buffer> {
    const pubKey = normalizePublicKey(publicKeyHex);

    // Generate ephemeral key pair
    const ephemeral = crypto.createECDH('secp256k1');
    ephemeral.generateKeys();

    // Derive shared secret
    const sharedSecret = ephemeral.computeSecret(pubKey);
    const derivedKey = crypto.createHash('sha256').update(sharedSecret).digest();

    // Encrypt data with derived key
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv);
    const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
    const tag = cipher.getAuthTag();

    // Pack: [ephemeral_pub_key (65 bytes) | iv (12 bytes) | tag (16 bytes) | ciphertext]
    const ephemeralPub = ephemeral.getPublicKey();
    return Buffer.concat([ephemeralPub, iv, tag, encrypted]);
}

/**
 * ECIES decrypt: decrypt data using a private key.
 */
async function eciesDecrypt(privateKeyHex: string, encryptedPayload: Buffer): Promise<Buffer> {
    // Unpack
    const ephemeralPub = encryptedPayload.subarray(0, 65);
    const iv = encryptedPayload.subarray(65, 65 + IV_LENGTH);
    const tag = encryptedPayload.subarray(65 + IV_LENGTH, 65 + IV_LENGTH + 16);
    const ciphertext = encryptedPayload.subarray(65 + IV_LENGTH + 16);

    // Derive shared secret
    const ecdh = crypto.createECDH('secp256k1');
    ecdh.setPrivateKey(Buffer.from(privateKeyHex, 'hex'));
    const sharedSecret = ecdh.computeSecret(ephemeralPub);
    const derivedKey = crypto.createHash('sha256').update(sharedSecret).digest();

    // Decrypt
    const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv);
    decipher.setAuthTag(tag);

    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

// ============================================================
// Helpers
// ============================================================

function normalizePrivateKey(key: string): string {
    return key.startsWith('0x') ? key.slice(2) : key;
}

function normalizePublicKey(key: string): Buffer {
    let hex = key.startsWith('0x') ? key.slice(2) : key;
    // If compressed (33 bytes / 66 hex chars), we need to decompress
    // If uncompressed with 04 prefix (65 bytes / 130 hex chars), use as-is
    // If uncompressed without prefix (64 bytes / 128 hex chars), add 04 prefix
    if (hex.length === 128) {
        hex = '04' + hex;
    }
    return Buffer.from(hex, 'hex');
}
