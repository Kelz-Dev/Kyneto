
This project adds economic incentives and blockchain-based contracts to IPFS storage, enabling:
- **Storage marketplace** with provider pledges and client deals
- **Proof-of-Spacetime** verification for continuous storage
- **Reed-Solomon erasure coding** (10+5 configuration) for fault tolerance
- **Auto-repair** system that survives 5 simultaneous node failures
- **ERC-20 token** economics on Polygon (low gas fees)
- **Filecoin/Storj-inspired penalties** for provider accountability

## Architecture

```
kubo-master/
├── incentive-layer/
│   ├── smart-contracts/      # Polygon smart contracts (Solidity)
│   ├── services/             # Backend services (Node.js/TypeScript)
│   │   ├── erasure-coding/   # Reed-Solomon shard management & auto-repair
│   ├── indexer/              # Resilient blockchain listener & IPFS mirror
│   ├── api/rest-api/         # REST API, WebSocket, & Prometheus /metrics
│   ├── config/               # Chain & PostgreSQL schema configuration
│   └── dashboard/            # React Web UI
├── Machine_Learning_sidecar/ # Predictive analytics (Flask/Python)
└── monitoring/               # Prometheus & Grafana configurations
```

> For the comprehensive data flow and inter-service mapping, see the [Full Kyneto Architecture Guide](../docs/KYNETO_ARCHITECTURE.md).

## Key Features

- **50% Parity Erasure Coding**: Files split into 15 shards (10 data + 5 parity), survives 5 provider failures.
- **Storage Pledges**: Providers commit capacity and earn passive rewards.
- **Per GB/Month Pricing**: $0.05/GB for clients, $0.01-0.04/GB earnings for providers.
- **Auto-Replication & Auto-Repair**: Network automatically detects offline nodes and repairs lost shards.
- **Filecoin-Style Proofs**: PoRep (initial) + PoSt (continuous 24h verification).
- **Predictive Intelligence**: Machine Learning sidecar to predict provider failure and classify reliability.
- **Enterprise Observability**: Prometheus metrics and centralized Grafana tracking.
- **Highly Resilient Indexer**: Exponential backoff RPC reconnection and graceful shutdowns.
- **Cryptographic API Authentication**: All state-changing REST endpoints require EIP-191 wallet signatures.

## Dashboard vs. Daemon: How Pledging Works

- **Dashboard**: Your "Management Console" for signing contracts, staking KYN, and checking earnings.
- **Daemon**: Your "Worker Bee" that runs on your laptop, pins data to Kubo, and submits cryptographic proofs.

> [!IMPORTANT]
> Pledging on the dashboard is only the **commitment**. You must run the **provider-daemon** to fulfill that commitment and avoid being slashed.

## Quick Start

### Prerequisites

- Node.js 18+
- Kubo/IPFS node running locally
- Polygon wallet with POL for gas

### Installation

```bash
cd incentive-layer

# Install smart contracts
cd smart-contracts
npm install

# Install services
cd ../services/erasure-coding
npm install

# Repeat for other services...
```

### Configuration

Edit `config/chain-config.json` to set your Polygon RPC and contract addresses.

### Run Tests

#### Smart Contracts (Hardhat)
```bash
cd smart-contracts
npm install
npx hardhat test
```

The integration test (`test/Integration.test.js`) validates the full on-chain lifecycle:
- Provider registration & pledging
- Deal creation, completion, cancellation
- Escrow fund release to PaymentDistributor
- PoSt challenge submission & double-check prevention
- Slashing & appeals

#### REST API (Jest + Supertest)
```bash
cd api/rest-api
npm install
npm test
```

Tests cover authenticated endpoints with mocked PostgreSQL (no external DB required).

### Deploy Contracts

```bash
cd smart-contracts
npx hardhat run scripts/deploy-v2.js --network amoy
```

After deployment, call `setPaymentDistributor()` on `StorageMarketplace` to wire the reward flow.

## Economic Model

See [economics_model.md](docs/economics_model.md) for detailed pricing, token economics, and provider earnings.

**Summary**:
- Clients: $0.05/GB/month
- Providers: $0.01/GB pledged + $0.03/GB used
- 1.5× storage overhead (vs 3× for replication)
- ERC-20 token on Polygon

### Why Polygon?
Kyneto leverages Polygon to provide an enterprise-grade storage backbone:
- **Low-Cost Verification**: Daily PoSt proofs are economically viable due to sub-cent gas fees.
- **High Performance**: Rapid block finality for real-time storage deal signing.
- **EVM Compatibility**: Built on industry-standard Ethereum tools for maximum security.
- **Permissionless Scaling**: While the blockchain is secured by 105 validators, the Kyneto provider network is open to anyone with spare storage.

## Documentation

- [Implementation Plan](docs/implementation_plan.md) - Full technical architecture
- [Economics Model](docs/economics_model.md) - Pricing and token economics
- [Smart Contracts Guide](docs/smart-contracts.md) - Contract specifications
- [Provider Guide](docs/provider-guide.md) - How to become a storage provider
- [Client Guide](docs/client-guide.md) - How to use the storage network
- [API Authentication](docs/API_AUTHENTICATION.md) - EIP-191 signing requirements for protected endpoints

## Development Status

**Under Active Development**

- [x] Architecture design
- [x] Erasure coding configuration (10+5 Reed-Solomon)
- [x] Smart contracts implementation (Polygon Amoy)
- [x] Erasure coding services
- [x] Network Dashboard (Real-time monitoring)
- [/] CLI tools & SDK
- [ ] Mainnet Testing & Deployment

## License

Same as Kubo - Dual-licensed under Apache 2.0 and MIT

## Integration with Kubo

This layer **does not modify Kubo source code**. It uses Kubo's HTTP API (`/api/v0`) for all IPFS operations, maintaining clean separation and easy upgradability.

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.
