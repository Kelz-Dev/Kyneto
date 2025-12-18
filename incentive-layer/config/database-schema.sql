-- Incentive Layer Database Schema

-- Providers table
CREATE TABLE IF NOT EXISTS providers (
  address VARCHAR(42) PRIMARY KEY,
  peer_id VARCHAR(100) NOT NULL,
  endpoint TEXT,
  region VARCHAR(50),
  reputation_score INTEGER DEFAULT 50,
  active BOOLEAN DEFAULT true,
  last_heartbeat TIMESTAMP,
  last_proof_at TIMESTAMP,
  registered_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_providers_active ON providers(active);
CREATE INDEX idx_providers_reputation ON providers(reputation_score);
CREATE INDEX idx_providers_region ON providers(region);

-- Capacity pledges
CREATE TABLE IF NOT EXISTS capacity_pledges (
  provider_address VARCHAR(42),
  pledge_id INTEGER,
  capacity_gb NUMERIC,
  duration_seconds INTEGER,
  collateral NUMERIC,
  utilization_gb NUMERIC DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (provider_address, pledge_id),
  FOREIGN KEY (provider_address) REFERENCES providers(address)
);

CREATE INDEX idx_pledges_active ON capacity_pledges(active);

-- Deals
CREATE TABLE IF NOT EXISTS deals (
  deal_id VARCHAR(20) PRIMARY KEY,
  client_address VARCHAR(42) NOT NULL,
  file_cid TEXT NOT NULL,
  file_size_gb NUMERIC NOT NULL,
  total_cost NUMERIC NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  block_number INTEGER
);

CREATE INDEX idx_deals_client ON deals(client_address);
CREATE INDEX idx_deals_status ON deals(status);
CREATE INDEX idx_deals_created ON deals(created_at);

-- Shards
CREATE TABLE IF NOT EXISTS shards (
  deal_id VARCHAR(20),
  provider_address VARCHAR(42),
  shard_index INTEGER,
  shard_cid TEXT NOT NULL,
  size_bytes BIGINT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  lost_at TIMESTAMP,
  PRIMARY KEY (deal_id, provider_address),
  FOREIGN KEY (deal_id) REFERENCES deals(deal_id),
  FOREIGN KEY (provider_address) REFERENCES providers(address)
);

CREATE INDEX idx_shards_active ON shards(active);
CREATE INDEX idx_shards_deal ON shards(deal_id);

-- Shard loss reports (for 5-min cooldown)
CREATE TABLE IF NOT EXISTS shard_loss_reports (
  deal_id VARCHAR(20),
  provider_address VARCHAR(42),
  shard_index INTEGER,
  shard_cid TEXT,
  reported_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (deal_id, provider_address)
);

-- Repair queue
CREATE TABLE IF NOT EXISTS repair_queue (
  id SERIAL PRIMARY KEY,
  deal_id VARCHAR(20) NOT NULL,
  old_provider VARCHAR(42),
  shard_index INTEGER,
  shard_cid TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  new_provider VARCHAR(42),
  new_shard_cid TEXT,
  error TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE INDEX idx_repair_status ON repair_queue(status);

-- Proof misses
CREATE TABLE IF NOT EXISTS proof_misses (
  id SERIAL PRIMARY KEY,
  provider_address VARCHAR(42),
  challenge_id VARCHAR(20),
  missed_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (provider_address) REFERENCES providers(address)
);

-- Slashing events
CREATE TABLE IF NOT EXISTS slashing_events (
  id SERIAL PRIMARY KEY,
  provider_address VARCHAR(42),
  amount NUMERIC,
  reason TEXT,
  slashed_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (provider_address) REFERENCES providers(address)
);

-- Withdrawals
CREATE TABLE IF NOT EXISTS withdrawals (
  id SERIAL PRIMARY KEY,
  provider_address VARCHAR(42),
  amount NUMERIC,
  withdrawn_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (provider_address) REFERENCES providers(address)
);

-- Indexes for performance
CREATE INDEX idx_provider_deals ON shards(provider_address, deal_id);
CREATE INDEX idx_repair_created ON repair_queue(created_at);
CREATE INDEX idx_slashing_provider ON slashing_events(provider_address);
