# Kyneto v2.1 Migration Guide

This guide covers the breaking changes introduced in the v2.1 security hardening update and how to migrate your dashboard, provider daemon, and integrations.

## Breaking Changes

### 1. REST API Authentication (EIP-191 Signatures)

**What changed:**
- `POST /api/heartbeat` now requires `signature` field
- `DELETE /api/deals/:id` now requires `client_address` + `signature`
- `POST /api/deals/:id/key` now requires `signature`

**Impact:** All existing dashboard users and provider daemons will see `400 signature required` or `401 Invalid signature` errors until updated.

**Migration:**

**Dashboard users:** Refresh the page. The dashboard now loads `kyneto-auth.js`, which automatically signs protected requests using your connected MetaMask/AppKit wallet. No manual action needed.

**Provider daemon operators:** Update your provider daemon to v2.1+ or patch `sendHeartbeat()`:

```typescript
const message = 'Kyneto Provider Heartbeat';
const signature = await wallet.signMessage(message);

await axios.post(`${API_URL}/api/heartbeat`, {
    provider_address: wallet.address,
    signature: signature,
    storage: { ... }
});
```

**Custom API clients:** See [API_AUTHENTICATION.md](../incentive-layer/docs/API_AUTHENTICATION.md) for message formats and code examples.

---

### 2. Smart Contract Re-deployment Required

**What changed:**
- `StorageMarketplace` now has `paymentDistributor` address and releases provider payments on `completeDeal()`
- `ProofVerifier` has a `checked` flag to prevent double-slashing
- `CapacityPledge` enforces a 1% minimum early-exit penalty
- `ProviderRegistry` can clean up provider deal lists on shard repair

**Impact:** Old contract deployments on Amoy will not have these fixes. Provider payments will remain locked.

**Migration:**

1. Deploy new contracts:
```bash
cd incentive-layer/smart-contracts
npx hardhat run scripts/deploy-v2.js --network amoy
```

2. Wire the PaymentDistributor:
```javascript
await marketplace.setPaymentDistributor(paymentDistributorAddress);
```

3. Update your `.env` files with the new contract addresses.

4. Re-register providers on the new `ProviderRegistry` contract.

---

### 3. File Upload: Memory → Disk Storage

**What changed:**
- The REST API no longer buffers uploads in RAM. Files are streamed to `/tmp/kyneto-uploads` before pinning to IPFS.

**Impact:** Prevents OOM crashes on the API server during concurrent uploads.

**Migration:**
- **No action required for dashboard users.** Uploads work the same way.
- **For Docker deployments:** Ensure the container has write access to `/tmp` or mount a volume there.

---

### 4. ML Sidecar: Input Validation & Model Hash Verification

**What changed:**
- The `/predict/failure` and `/predict/reliability` endpoints now reject invalid inputs (negative stake, uptime > 1, etc.)
- Model files are verified against `MANIFEST.json` SHA-256 hashes on startup

**Impact:** Old clients sending malformed data will receive `400` errors. Tampered model files will be skipped.

**Migration:**
- Ensure your prediction requests conform to the schema (see `api.py` `validate_input()`)
- If you rebuild the Docker image, `MANIFEST.json` is auto-generated during build. For custom models, update the manifest with `python -c "import hashlib; ..."`

---

### 5. Docker Compose: No More Default Passwords

**What changed:**
- PostgreSQL and Grafana no longer have hardcoded `password` / `admin` credentials
- They now read from environment variables with `changeme` fallback

**Impact:** First-time Docker users must set passwords or the stack won't start securely.

**Migration:**
Create a `.env` file in the project root:
```bash
POSTGRES_DB=incentive_layer
POSTGRES_USER=kyneto_user
POSTGRES_PASSWORD=your_secure_password_here
GRAFANA_ADMIN_PASSWORD=your_secure_password_here
```

---

## Non-Breaking Improvements

| Feature | Benefit |
|---------|---------|
| Real Reed-Solomon encoding in REST API | Actual 10+5 fault tolerance instead of broken XOR |
| WebSocket room-scoped emits | Shard CIDs no longer broadcast to all connected clients |
| Trust proxy conditional | API safer when not behind Nginx |
| IP-API timeout | Region detection no longer hangs indefinitely |
| Indexer pagination | `SELECT * FROM deals` replaced with `LIMIT 1000` to prevent OOM |
| Ethers v6 consistency | All TypeScript services now use `ethers.JsonRpcProvider` |

---

## Quick Verification Checklist

After migrating, run these checks:

- [ ] Provider daemon heartbeats return `200` (not `401`)
- [ ] Dashboard can cancel a deal and the signature prompt appears in MetaMask
- [ ] Upload a file → create deal → wait for expiration → verify provider can withdraw from PaymentDistributor
- [ ] Run `npx hardhat test` in `smart-contracts/` — all tests pass
- [ ] Run `npm test` in `api/rest-api/` — all tests pass
- [ ] Docker Compose starts without `password` warnings

---

## Support

If you encounter issues during migration:
1. Check the [API Authentication docs](../incentive-layer/docs/API_AUTHENTICATION.md)
2. Review the [Integration Tests](../incentive-layer/smart-contracts/test/Integration.test.js) for expected behavior
3. Ensure all contract addresses in `.env` point to the v2.1 deployment
