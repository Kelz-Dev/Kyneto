cd incentive-layer

# 1. Install smart contracts
cd smart-contracts
npm install

# 2. Copy environment file
cp .env.example .env
# Edit .env with your private key and RPC URLs

# 3. Deploy contracts to Mumbai testnet
npm run deploy:mumbai

# 4. Install erasure coding service
cd ../services/erasure-coding
npm install
npm run build

# 5. Install CLI tools
cd ../../cli
npm install -g commander ethers dotenv
```

---

## For Storage Providers

### 1. Register as Provider

```bash
provider-cli register \
  --peer-id QmYourPeerID \
  --endpoint https://your-api.com \
  --region us-east
```

### 2. Create Capacity Pledge

```bash
provider-cli pledge \
  --capacity 1000 \
  --duration 90 \
  --collateral 750
```

**Pledge Options:**
- 30 days: 1.0× multiplier
- 90 days: 1.1× multiplier (10% bonus)
- 180 days: 1.2× multiplier (20% bonus)
- 365 days: 1.3× multiplier (30% bonus)

### 3. Monitor Earnings

```bash
provider-cli earnings
```

### 4. Withdraw Earnings

```bash
provider-cli withdraw
```

---

## For Storage Clients

### 1. Upload File

```bash
client-cli upload \
  --file ./myfile.pdf \
  --duration 90 \
  --price 0.05
```

### 2. Check Deal Status

```bash
client-cli status --deal-id 123
```

### 3. Check Balance

```bash
client-cli balance
```

---

## Configuration

### Environment Variables

Create `.env` file:

```bash
# Blockchain
PRIVATE_KEY=your_private_key
RPC_URL=https://rpc-mumbai.maticvigil.com
POLYGONSCAN_API_KEY=your_api_key

# Contracts (filled after deployment)
TOKEN_CONTRACT=0x...
REGISTRY_CONTRACT=0x...
PLEDGES_CONTRACT=0x...
MARKETPLACE_CONTRACT=0x...
PAYMENTS_CONTRACT=0x...

# IPFS
KUBO_API_URL=http://localhost:5001

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/incentive_layer
```

---

## Economics at a Glance

### Token Supply
- **Initial**: 500 million KYN
- **Max**: 1 billion KYN (with inflation)
- **Inflation**: 5% annually (decreasing 0.5%/year)

### Pricing
- **Clients pay**: $0.05/GB/month
- **Providers earn**:
  - Capacity: $0.01/GB/month (pledged)
  - Usage: $0.03/GB/month (used)
  - Proofs: $0.10 per PoSt

### Example Provider Earnings

Pledge 10 TB for 90 days (50% utilized):
- Capacity: 10,000 GB × $0.01 × 1.1 = **$110/month**
- Usage: 5,000 GB × $0.03 = **$150/month**
- **Total: $260/month**

---

## Erasure Coding

Files are split into **15 shards** (10 data + 5 parity):
- Stored across 15 different providers
- Can survive **5 simultaneous provider failures**
- **1.5× storage overhead** (vs 3× for replication)
- Automatic repair when providers go offline

---

## Network Commands

### Start Kubo Node

```bash
ipfs daemon
```

### Start Health Monitor

```bash
cd services/erasure-coding
npm start
```

### View Contract Addresses

```bash
cat smart-contracts/deployed-addresses-mumbai.json
```

---

## Verification

After deployment, verify contracts on PolygonScan:

```bash
cd smart-contracts
npm run verify
```

---

## Additional Resources

- [Full Implementation Plan](docs/implementation_plan.md)
- [Economics Model](docs/economics_model.md)
- [Smart Contract Documentation](docs/smart-contracts.md)
- [API Documentation](docs/api.md)

---

## Important Notes

1. **Testnet First**: Always test on Mumbai before mainnet
2. **Keep Keys Safe**: Never commit `.env` file
3. **Back Up Data**: Providers should backup their IPFS data
4. **Monitor Gas**: Polygon gas fees are low but check before bulk operations
5. **Heartbeat**: Providers must send heartbeat every 30 seconds

---

## Troubleshooting

### Connection Issues
```bash
# Check Kubo is running
ipfs id

# Check network connectivity
curl https://rpc-mumbai.maticvigil.com
```

### Contract Errors
```bash
# Verify contract addresses
cat deployed-addresses-mumbai.json

# Check gas balance
client-cli balance
```

---

## Support

- GitHub Issues: `github.com/your-repo/issues`
- Discord: `discord.gg/your-server`
- Docs: `docs.your-project.com`
