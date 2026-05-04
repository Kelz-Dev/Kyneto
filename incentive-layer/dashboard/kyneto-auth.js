/**
 * Kyneto Dashboard Auth Wrapper
 * =====================================
 * Automatically signs protected API requests with EIP-191 signatures.
 * 
 * Protected endpoints:
 *   DELETE /api/deals/:id          -> signs message: cancel-deal-${dealId}
 *   POST   /api/deals/:id/key      -> signs message: store-key-${dealId}
 * 
 * This script must be loaded AFTER app.js so that window.signer is available.
 */
(function() {
    'use strict';
    
    if (window.__kynetoAuthInstalled) {
        console.warn('[KynetoAuth] Already installed');
        return;
    }
    window.__kynetoAuthInstalled = true;
    
    const _originalFetch = window.fetch;
    
    async function getSignature(message) {
        if (!window.signer) {
            throw new Error('Wallet not connected. Please connect your wallet first.');
        }
        // EIP-191 personal_sign via ethers.js v5 signer
        return await window.signer.signMessage(message);
    }
    
    window.fetch = async function(url, options) {
        options = options || {};
        const urlStr = url.toString ? url.toString() : String(url);
        const method = (options.method || 'GET').toUpperCase();
        
        try {
            // DELETE /api/deals/:id  -> cancel deal
            const cancelMatch = urlStr.match(/\/api\/deals\/([^/\?]+)$/);
            if (method === 'DELETE' && cancelMatch) {
                const dealId = cancelMatch[1];
                const message = `cancel-deal-${dealId}`;
                const signature = await getSignature(message);
                
                options = {
                    ...options,
                    headers: {
                        ...(options.headers || {}),
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        client_address: window.userAddress || '',
                        signature: signature
                    })
                };
            }
            // POST /api/deals/:id/key -> store encryption key
            else if (method === 'POST' && urlStr.match(/\/api\/deals\/[^/\?]+\/key$/)) {
                const dealId = urlStr.match(/\/api\/deals\/([^/\?]+)\/key$/)[1];
                const message = `store-key-${dealId}`;
                const signature = await getSignature(message);
                
                let bodyObj = {};
                if (options.body) {
                    try {
                        bodyObj = JSON.parse(options.body);
                    } catch (e) {
                        console.warn('[KynetoAuth] Could not parse request body for signing');
                    }
                }
                
                bodyObj.signature = signature;
                
                options = {
                    ...options,
                    headers: {
                        ...(options.headers || {}),
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(bodyObj)
                };
            }
        } catch (err) {
            console.error('[KynetoAuth] Signing failed:', err.message);
            return Promise.reject(err);
        }
        
        return _originalFetch(url, options);
    };
    
    console.log('[KynetoAuth] API request signing enabled (v1.0)');
})();
