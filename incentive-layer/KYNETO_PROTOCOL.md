# Kyneto Protocol: Polygon-Backed Decentralized Storage on IPFS

The **Kyneto Protocol** is a high-performance, incentivized storage layer built on top of **Kubo (IPFS)** and the **Polygon** blockchain. It transforms IPFS from a best-effort content delivery network into a reliable, enterprise-grade storage marketplace with cryptographic guarantees and economic accountability.

---

## 1. Executive Summary

Kyneto addresses the "persistence gap" in decentralized storage by introducing a marketplace where storage providers are economically incentivized to maintain data. By combining **Reed-Solomon Erasure Coding** with **Proof-of-Spacetime (PoSt)**, Kyneto provides 100% data durability with significantly lower overhead than traditional replication.

### Key Value Propositions:
- **Immutable Storage**: Powered by IPFS content addressing (CIDs).
- **High Durability**: 10+5 Erasure Coding survives up to 5 simultaneous node failures.
- **Low Cost**: $0.05/GB/month, significantly cheaper than traditional cloud providers.
- **Automated Healing**: Self-repairing network that detects and fixes data loss autonomously.
- **Trustless Verification**: Cryptographic proofs submitted to Polygon ensure providers are actually storing data.

---

## 2. Technical Architecture

Kyneto operates as a hybrid orchestration layer that sits between users and a global network of storage providers.

### 2.1. Data Protection: Reed-Solomon (10+5)
Instead of simple replication, Kyneto uses advanced sharding:
- **Sharding**: Every file is split into 10 data shards and 5 parity shards.
- **Reconstruction**: Any 10 shards are sufficient to reconstruct the original file.
- **Efficiency**: 1.5x storage overhead (vs. 3x for standard replication).

### 2.2. The Stack
- **IPFS (Kubo)**: The underlying data transport and content-addressing layer.
- **Polygon (Amoy/Mainnet)**: The settlement and verification layer for smart contracts.
- **Orchestration Services**: Node.js services for erasure coding, health monitoring, and repair.
- **Indexer**: PostgreSQL database for real-time network analytics and dashboard support.

---

## 3. Tokenomics: The KYN Token

The **KYN Token** is the native utility token that powers the Kyneto ecosystem.

### 3.1. Roles & Incentives
- **Clients**: Pay KYN to initiate storage deals.
- **Providers**: Earn KYN by pledging capacity and fulfilling deals.
- **Treasury**: Receives a 10% protocol fee for network maintenance and grants.

### 3.2. Economic Loop
1. **Stake**: Providers stake a minimum of 1,000 KYN to register.
2. **Pledge**: Providers commit storage capacity (e.g., 1 TB).
3. **Earn**: Providers receive **$0.01/GB/month** for pledged capacity and **$0.03/GB/month** for active usage.
4. **Verify**: Successful PoSt submissions unlock reward distributions.

---

## 4. Security & Verification

Kyneto ensures data integrity through a multi-stage verification process.

### 4.1. Proof-of-Replication (PoRep)
When a deal is initiated, providers must submit a PoRep to prove they have received and uniquely encoded the data shard assigned to them.

### 4.2. Proof-of-Spacetime (PoSt)
Every 24 hours, providers are challenged to provide a cryptographic proof that they still possess the data. 
- **Success**: Rewards are distributed.
- **Failure**: Small penalties are deducted; repeated failures lead to **Slashing**.

### 4.3. Slashing Manager
If a provider goes offline for >48 hours or loses data, their staked KYN is slashed (burned). These funds are also used to incentivize the **Auto-Repair Engine**.

---

## 5. Network Resilience: The Repair Engine

Kyneto is a self-healing network.
1. **Detection**: The `health-monitor` identifies a failed proof or offline provider.
2. **Reconstruction**: The `repair-service` fetches 10 healthy shards.
3. **Healing**: It reconstructs the missing shard and redeploys it to a new, healthy provider.
4. **Update**: The storage deal is updated on-chain to reflect the new provider.

---

## 6. Smart Contract Ecosystem

The protocol is governed by a suite of interconnected Solidity contracts on Polygon:
- **StorageToken (KYN)**: ERC-20 utility token.
- **ProviderRegistry**: Manages provider metadata and reputation.
- **CapacityPledge**: Handles storage commitments and staking.
- **ProofVerifier**: Validates PoRep and PoSt submissions.
- **StorageMarketplace**: Facilitates deals between clients and providers.
- **SlashingManager**: Enforces penalties for non-compliance.
- **PaymentDistributor**: Automates reward payouts.

---

## 7. Getting Started

### For Clients
1. Connect your wallet (MetaMask/AppKit) to the [Kyneto Dashboard](dashboard/index.html).
2. Deposit KYN  tokens.
3. Upload your files; the protocol handles sharding and distribution automatically.

### For Providers
1. Run a [Kyneto Provider Stack](provider-stack/docker-compose.yaml).
2. Stake 1,000 KYN via the Provider Portal.
3. Pledging capacity and start earning rewards.

---

## 8. Development Status

Kyneto is currently in **Active Development** on the Polygon Amoy Testnet.
- [x] Core Smart Contracts
- [x] Erasure Coding Engine
- [x] Network Dashboard
- [/] CLI Tools & SDK
- [ ] Mainnet Deployment

---
*Kyneto Protocol - The Future of Persistent Decentralized Storage.*
