# Incentive Layer - Blockchain Storage Marketplace

A Filecoin-like decentralized storage incentive layer built on top of Kubo/IPFS with Polygon blockchain integration.

## Overview

This project adds economic incentives and blockchain-based contracts to IPFS storage, enabling:
- **Storage marketplace** with provider pledges and client deals
- **Proof-of-Spacetime** verification for continuous storage
- **Reed-Solomon erasure coding** (10+5 configuration) for fault tolerance
- **Auto-repair** system that survives 5 simultaneous node failures
- **ERC-20 token** economics on Polygon (low gas fees)
- **Filecoin/Storj-inspired penalties** for provider accountability

## Architecture

```
incentive-layer/
├── smart-contracts/      # Polygon smart contracts (Solidity)
├── services/             # Backend services (Node.js/TypeScript)
│   ├── erasure-coding/   # Reed-Solomon shard management
│   ├── kubo-adapter/     # IPFS integration (uses Kubo HTTP API)
│   ├── blockchain-listener/ # Contract event processing
│   └── ...
├── api/                  # REST API + WebSocket
├── cli/                  # Provider & client CLI tools
├── sdk/                  # JavaScript SDK for developers
├── config/               # Chain & network configuration
└── docs/                 # Documentation

```

## Key Features

**50% Parity Erasure Coding**: Files split into 15 shards (10 data + 5 parity), survives 5 provider failures  
**Storage Pledges**: Providers commit capacity and earn passive rewards  
**Per GB/Month Pricing**: $0.05/GB for clients, $0.01-0.04/GB earnings for providers  
**Auto-Replication**: Network automatically repairs lost shards  
**Filecoin-Style Proofs**: PoRep (initial) + PoSt (continuous 24h verification)  
**Migration Ready**: Easy migration from Polygon to custom blockchain  

## Quick Start

### Prerequisites

- Node.js 18+
- Kubo/IPFS node running locally
- Polygon wallet with MATIC for gas

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

### Deploy Contracts

```bash
cd smart-contracts
npx hardhat run scripts/deploy.js --network mumbai
```

## Economic Model

See [economics_model.md](docs/economics_model.md) for detailed pricing, token economics, and provider earnings.

**Summary**:
- Clients: $0.05/GB/month
- Providers: $0.01/GB pledged + $0.03/GB used
- 1.5× storage overhead (vs 3× for replication)
- ERC-20 token on Polygon

## Documentation

- [Implementation Plan](docs/implementation_plan.md) - Full technical architecture
- [Economics Model](docs/economics_model.md) - Pricing and token economics
- [Smart Contracts Guide](docs/smart-contracts.md) - Contract specifications
- [Provider Guide](docs/provider-guide.md) - How to become a storage provider
- [Client Guide](docs/client-guide.md) - How to use the storage network

## Development Status

**Under Active Development**

- [x] Architecture design
- [x] Erasure coding configuration (10+5 Reed-Solomon)
- [ ] Smart contracts implementation
- [ ] Erasure coding services
- [ ] CLI tools
- [ ] Testing & deployment

## License

Same as Kubo - Dual-licensed under Apache 2.0 and MIT

## Integration with Kubo

This layer **does not modify Kubo source code**. It uses Kubo's HTTP API (`/api/v0`) for all IPFS operations, maintaining clean separation and easy upgradability.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.
