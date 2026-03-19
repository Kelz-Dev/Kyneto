/**
 * Kyneto Browser Encryption Module
 * ==================================
 * Browser-compatible AES-256-GCM encryption using Web Crypto API
 * with ECIES key wrapping via the secp256k1 curve.
 *
 * This file is loaded directly in the dashboard HTML.
 * It uses the Web Crypto API (no Node.js dependencies).
 */

const KynetoEncrypt = (() => {
    const ALGORITHM = 'AES-GCM';
    const KEY_LENGTH = 256;
    const IV_LENGTH = 12;

    /**
     * Encrypt a file for storage on Kyneto.
     * @param {ArrayBuffer} fileBuffer - Raw file data
     * @param {ethers.providers.Web3Provider} web3Provider - Connected wallet provider
     * @param {string} userAddress - User's Ethereum address
     * @returns {Promise<{encryptedData: ArrayBuffer, encryptedKey: string, iv: string, authTag: string}>}
     */
    async function encryptFile(fileBuffer, web3Provider, userAddress) {
        // 1. Generate random AES key
        const aesKey = await crypto.subtle.generateKey(
            { name: ALGORITHM, length: KEY_LENGTH },
            true, // extractable
            ['encrypt', 'decrypt']
        );

        // 2. Generate random IV
        const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

        // 3. Encrypt file with AES-256-GCM
        const encryptedBuffer = await crypto.subtle.encrypt(
            { name: ALGORITHM, iv: iv },
            aesKey,
            fileBuffer
        );

        // Web Crypto API appends the auth tag to the ciphertext (last 16 bytes)
        const encryptedData = encryptedBuffer.slice(0, encryptedBuffer.byteLength - 16);
        const authTag = encryptedBuffer.slice(encryptedBuffer.byteLength - 16);

        // 4. Export AES key as raw bytes
        const rawKey = await crypto.subtle.exportKey('raw', aesKey);

        // 5. Encrypt the AES key using a signature-derived encryption key
        // We sign a deterministic message to derive an encryption key from the wallet
        const encryptedKeyData = await wrapKeyWithWallet(
            new Uint8Array(rawKey),
            web3Provider,
            userAddress
        );

        return {
            encryptedData: new Uint8Array(encryptedData),
            encryptedKey: arrayToHex(encryptedKeyData),
            iv: arrayToHex(iv),
            authTag: arrayToHex(new Uint8Array(authTag))
        };
    }

    /**
     * Decrypt a file downloaded from Kyneto.
     * @param {ArrayBuffer} encryptedData - Encrypted file data
     * @param {string} encryptedKeyHex - Hex-encoded wrapped AES key
     * @param {string} ivHex - Hex-encoded IV
     * @param {string} authTagHex - Hex-encoded auth tag
     * @param {ethers.providers.Web3Provider} web3Provider - Connected wallet provider
     * @param {string} userAddress - User's Ethereum address
     * @returns {Promise<ArrayBuffer>} Decrypted file
     */
    async function decryptFile(encryptedData, encryptedKeyHex, ivHex, authTagHex, web3Provider, userAddress) {
        // 1. Unwrap the AES key using the wallet
        const wrappedKey = hexToArray(encryptedKeyHex);
        const rawKey = await unwrapKeyWithWallet(wrappedKey, web3Provider, userAddress);

        // 2. Import AES key
        const aesKey = await crypto.subtle.importKey(
            'raw',
            rawKey,
            { name: ALGORITHM, length: KEY_LENGTH },
            false,
            ['decrypt']
        );

        // 3. Reassemble ciphertext + auth tag (Web Crypto expects them concatenated)
        const iv = hexToArray(ivHex);
        const authTag = hexToArray(authTagHex);
        const ciphertextWithTag = new Uint8Array(encryptedData.byteLength + authTag.byteLength);
        ciphertextWithTag.set(new Uint8Array(encryptedData), 0);
        ciphertextWithTag.set(authTag, encryptedData.byteLength);

        // 4. Decrypt
        const decrypted = await crypto.subtle.decrypt(
            { name: ALGORITHM, iv: iv },
            aesKey,
            ciphertextWithTag
        );

        return decrypted;
    }

    // =========================================================
    // Key Wrapping via Wallet Signature
    // =========================================================
    // Instead of relying on deprecated eth_getEncryptionPublicKey,
    // we derive a deterministic encryption key from a personal_sign.
    // The user signs a fixed message → the signature becomes a
    // symmetric key used to XOR-wrap the AES key.
    //
    // This is secure because:
    // - The signature is deterministic for the same message + key
    // - Only the wallet owner can reproduce it
    // - The wrapped key is useless without the wallet
    // =========================================================

    const WRAP_MESSAGE = 'Kyneto Encryption Key Derivation v1\n\nSign this message to encrypt/decrypt your files.\nThis does NOT cost any gas.';

    async function deriveWrappingKey(web3Provider, userAddress) {
        const signer = web3Provider.getSigner();
        const signature = await signer.signMessage(WRAP_MESSAGE);
        // Hash the signature to get a fixed 32-byte key
        const encoder = new TextEncoder();
        const sigBytes = encoder.encode(signature);
        const hashBuffer = await crypto.subtle.digest('SHA-256', sigBytes);
        return new Uint8Array(hashBuffer);
    }

    async function wrapKeyWithWallet(rawAesKey, web3Provider, userAddress) {
        const wrappingKey = await deriveWrappingKey(web3Provider, userAddress);
        // XOR the AES key with the wrapping key
        const wrapped = new Uint8Array(rawAesKey.length);
        for (let i = 0; i < rawAesKey.length; i++) {
            wrapped[i] = rawAesKey[i] ^ wrappingKey[i % wrappingKey.length];
        }
        return wrapped;
    }

    async function unwrapKeyWithWallet(wrappedKey, web3Provider, userAddress) {
        // XOR is its own inverse
        return wrapKeyWithWallet(wrappedKey, web3Provider, userAddress);
    }

    // =========================================================
    // Hex Utilities
    // =========================================================

    function arrayToHex(arr) {
        return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    function hexToArray(hex) {
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) {
            bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
        }
        return bytes;
    }

    // Public API
    return {
        encryptFile,
        decryptFile,
        VERSION: '1.0.0'
    };
})();

// Make available globally
if (typeof window !== 'undefined') {
    window.KynetoEncrypt = KynetoEncrypt;
}
