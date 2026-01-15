# Kyneto Protocol: Master Testing Guide

This guide provides a comprehensive walkthrough for testing the entire Kyneto Protocol stack, from the user-facing dashboard to the core cryptographic and repair services.

---

## 🏗️ Environment Setup

### 1. Core Infrastructure
Ensure the following are running in the background:
- **Blockchain:** 
    - *Option A (Recommended for E2E):* Local Hardhat/Anvil on `http://localhost:8545`
    - *Option B (Live Testing):* Polygon Amoy Testnet (Ensure `.env` has the Amoy RPC URL)
- **IPFS Node:** Kubo running on `http://localhost:5001`
- **Database:** PostgreSQL running on `http://localhost:5432`

### 2. Service Deployment
Deploy the smart contracts and start the backend services:
```bash
# 1. Deploy Contracts
cd incentive-layer/smart-contracts
npx hardhat run scripts/deploy.ts --network localhost

# 2. Start API Server
cd ../api/rest-api
npm run dev

# 3. Start Indexer
cd ../../indexer
npm run dev
```

---

## 🖥️ Phase 1: Dashboard & User Flow

### 1. Wallet Connection
1.  Open `incentive-layer/dashboard/index.html` in your browser.
2.  Click **"Connect Wallet"**.
3.  Verify that your MetaMask/AppKit wallet connects and shows your address in the top right.
4.  **Check:** The "Live Network Activity" feed should show `Wallet connected`.

### 2. Becoming a Provider (Economic Lifecycle)
1.  Navigate to **"Provider Portal"** -> **"Become a Provider"**.
2.  **Stake Tokens:** Click "Stake 1,000 KYN". Confirm the transaction.
3.  **Register Node:**
    - Enter Capacity (e.g., 100 GB).
    - Enter Peer ID (get from `ipfs id`).
    - Enter Endpoint (`http://localhost:3002`).
    - Select a Region.
    - Click "Register Node".
4.  **Check:** The "Active Nodes" list should now show your newly registered node.

### 3. Creating a Storage Deal
1.  Navigate to **"Marketplace"** -> **"Create New Deal"**.
2.  Drag and drop a file.
3.  Wait for the "File CID" to be generated.
4.  Enter Duration and click **"Initiate Deal"**.
5.  **Check:** Navigate to "My Files" or "Network Dashboard" to see the new deal in the "Recent Storage Deals" table.

---

## ⚙️ Phase 2: Backend Services & Proofs

### 1. Provider Daemon (PoSt Proofs)
1.  Start the daemon:
    ```bash
    cd incentive-layer/services/provider-daemon
    npm run dev
    ```
2.  **Check:** The daemon should log `🌳 Building Merkle tree for shard...` for your new deal.

### 2. Proof Generation
1.  Start the generator:
    ```bash
    cd incentive-layer/services/proof-generator
    npm run dev
    ```
2.  **Check:** Watch for `🧪 Generating real Merkle proofs` in the daemon logs and `✅ PoSt proof submitted` in the generator logs.

---

## 🛡️ Phase 3: Resilience & Advanced Features

### 1. Automated Repair (Self-Healing)
1.  Start the orchestrator:
    ```bash
    cd incentive-layer/services/deal-orchestrator
    npm run dev
    ```
2.  **Trigger Repair:**
    - Unpin a shard: `ipfs pin rm <CID>`
    - Run garbage collection: `ipfs repo gc`
3.  **Check:** The orchestrator should log `🚨 Shard missing! Initiating repair...` and successfully re-deploy the shard.

### 2. Incentivized Retrieval
1.  On the Dashboard, go to **"My Deals"**.
2.  Click **"Retrieve"** on an active deal.
3.  Enter a KYN amount and confirm.
4.  **Check:** Verify the `RetrievalInitiated` event appears in the activity feed.

### 3. Decentralized Mode
1.  On the Dashboard header, toggle **"Decentralized Mode: ON"**.
2.  Click the refresh icon on the deals table.
3.  **Check:** Verify the dashboard fetches data from IPFS (check browser console for `ipfs.io` requests).

---

## 🧪 Phase 4: Automated Testing

Run the full E2E suite to verify everything at once:
```bash
cd incentive-layer
npm run e2e:up    # Start Docker environment
npm run test:e2e  # Run full simulation
```

**Success Criteria:** All steps in the E2E script show `✅` and the dashboard reflects live network activity.

---

## 🛠️ Troubleshooting

### PowerShell: "running scripts is disabled on this system"
If you see this error when running `npx` or `hardhat`, run the following command in your PowerShell terminal to allow script execution for the current user:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```
Alternatively, use `npx.cmd` instead of `npx` on Windows.
