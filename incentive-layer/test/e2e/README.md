# E2E Testing - Incentive Layer

This directory contains the end-to-end testing suite for the Incentive Layer. It uses Docker Compose to spin up a full environment including a local blockchain, IPFS node, database, and all backend services.

## 🏗️ Architecture

- **Hardhat**: Local Polygon/Ethereum node (port 8545)
- **Postgres**: Database for indexing (port 5432)
- **Kubo (IPFS)**: Storage node (port 5001)
- **API Server**: REST API (port 3000)
- **Erasure Coding**: Sharding service

## 🚀 How to Run

### 1. Start the Environment

```bash
docker-compose up -d
```

### 2. Run the E2E Script

```bash
npm install
npx ts-node run-e2e.ts
```

## 🔍 What is Tested?

1.  **Service Connectivity**: Ensures all services can talk to each other.
2.  **Contract Deployment**: Verifies contracts can be deployed to a local node.
3.  **Provider Lifecycle**: Heartbeats and registration.
4.  **Economic Flow**: Pledges and deal creation (simulated).
5.  **Storage Integrity**: Shard generation and verification.

## 🛠️ Troubleshooting

- **Docker Issues**: Run `docker-compose logs -f` to see service output.
- **Database Connection**: Ensure port 5432 is not occupied by another Postgres instance.
- **Port Conflicts**: If ports 3000, 5001, or 8545 are in use, update the `docker-compose.yaml`.
