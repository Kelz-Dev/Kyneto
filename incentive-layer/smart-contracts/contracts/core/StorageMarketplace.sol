// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./StorageToken.sol";
import "./ProviderRegistry.sol";
import "./CapacityPledge.sol";

/**
 * @title StorageMarketplace
 * @dev Manages storage deals between clients and providers
 * Files are split into 15 shards (10 data + 5 parity) via erasure coding
 */
contract StorageMarketplace is Ownable, ReentrancyGuard {
    StorageToken public immutable token;
    ProviderRegistry public immutable registry;
    CapacityPledge public immutable pledges;
    
    // Protocol Fees
    address public treasury;
    uint256 public protocolFeeBasisPoints = 200; // 2.00%
    uint256 public constant MAX_FEE_BASIS_POINTS = 1000; // 10% max
    uint256 public totalFeesCollected;
    
    uint256 public constant SHARDS_PER_FILE = 15; // 10 data + 5 parity
    uint256 public constant MIN_PROVIDERS = 10; // Minimum to reconstruct
    
    struct Deal {
        address client;
        string fileCID; // IPFS CID of original file
        uint256 fileSizeGB;
        uint256 duration; // In days
        uint256 pricePerGBMonth; // In tokens
        uint256 totalCost;
        uint256 startTime;
        uint256 endTime;
        address[] providers; // 15 providers (one per shard)
        mapping(address => ShardAllocation) shardAllocations;
        uint256 activeShards; // Count of active shards
        DealStatus status;
        uint256 escrowedAmount;
    }
    
    struct ShardAllocation {
        uint256 shardIndex; // 0-14
        string shardCID; // IPFS CID of shard
        uint256 sizeGB;
        bool active;
    }
    
    enum DealStatus {
        Active,
        Completed,
        Failed,
        Cancelled
    }
    
    mapping(uint256 => Deal) public deals;
    uint256 public dealCount;
    
    // Provider => Deal IDs
    mapping(address => uint256[]) public providerDeals;
    
    // Events
    event DealCreated(uint256 indexed dealId, address indexed client, uint256 fileSizeGB, uint256 totalCost);
    event ShardAssigned(uint256 indexed dealId, address indexed provider, uint256 shardIndex, string shardCID);
    event DealCompleted(uint256 indexed dealId);
    event DealFailed(uint256 indexed dealId, string reason);
    event ShardLost(uint256 indexed dealId, address indexed provider, uint256 shardIndex);
    event ShardRepaired(uint256 indexed dealId, address indexed newProvider, uint256 shardIndex);
    event ProtocolFeeUpdated(uint256 newFee);
    event TreasuryUpdated(address newTreasury);
    event FeesWithdrawn(address indexed to, uint256 amount);
    
    constructor(address _token, address _registry, address _pledges, address _treasury) Ownable(msg.sender) {
        token = StorageToken(_token);
        registry = ProviderRegistry(_registry);
        pledges = CapacityPledge(_pledges);
        treasury = _treasury;
    }
    
    /**
     * @dev Create a storage deal
     * Called after file has been erasure coded into 15 shards
     */
    function createDeal(
        string calldata fileCID,
        uint256 fileSizeGB,
        uint256 durationDays,
        uint256 pricePerGBMonth,
        address[] calldata selectedProviders,
        string[] calldata shardCIDs,
        uint256[] calldata shardSizes
    ) external nonReentrant returns (uint256) {
        require(selectedProviders.length == SHARDS_PER_FILE, "Must have 15 providers");
        require(shardCIDs.length == SHARDS_PER_FILE, "Must have 15 shard CIDs");
        require(shardSizes.length == SHARDS_PER_FILE, "Must have 15 shard sizes");
        
        // Verify all providers are active
        for (uint256 i = 0; i < selectedProviders.length; i++) {
            require(registry.isProviderActive(selectedProviders[i]), "Provider not active");
            require(selectedProviders[i] != address(0), "Invalid provider");
        }
        
        // Calculate total cost and fees
        uint256 totalMonths = (durationDays + 29) / 30; // Round up to months
        uint256 providerPayment = fileSizeGB * pricePerGBMonth * totalMonths;
        uint256 protocolFee = (providerPayment * protocolFeeBasisPoints) / 10000;
        uint256 totalCost = providerPayment + protocolFee;
        
        // Transfer payment to escrow
        require(token.transferFrom(msg.sender, address(this), totalCost), "Payment failed");
        
        totalFeesCollected += protocolFee;
        
        // Create deal
        uint256 dealId = dealCount++;
        Deal storage deal = deals[dealId];
        deal.client = msg.sender;
        deal.fileCID = fileCID;
        deal.fileSizeGB = fileSizeGB;
        deal.duration = durationDays;
        deal.pricePerGBMonth = pricePerGBMonth;
        deal.totalCost = totalCost;
        deal.startTime = block.timestamp;
        deal.endTime = block.timestamp + (durationDays * 1 days);
        deal.status = DealStatus.Active;
        deal.escrowedAmount = totalCost;
        deal.activeShards = SHARDS_PER_FILE;
        
        // Assign shards to providers
        for (uint256 i = 0; i < SHARDS_PER_FILE; i++) {
            deal.providers.push(selectedProviders[i]);
            deal.shardAllocations[selectedProviders[i]] = ShardAllocation({
                shardIndex: i,
                shardCID: shardCIDs[i],
                sizeGB: shardSizes[i],
                active: true
            });
            
            providerDeals[selectedProviders[i]].push(dealId);
            emit ShardAssigned(dealId, selectedProviders[i], i, shardCIDs[i]);
        }
        
        emit DealCreated(dealId, msg.sender, fileSizeGB, totalCost);
        return dealId;
    }
    
    /**
     * @dev Complete a deal (called when duration expires)
     */
    function completeDeal(uint256 dealId) external nonReentrant {
        Deal storage deal = deals[dealId];
        require(deal.status == DealStatus.Active, "Deal not active");
        require(block.timestamp >= deal.endTime, "Deal not expired");
        require(deal.activeShards >= MIN_PROVIDERS, "Too many shard failures");
        
        deal.status = DealStatus.Completed;
        
        // This function just marks as complete
        // PaymentDistributor will handle actual payment distribution
        
        // Update provider stats
        for (uint256 i = 0; i < deal.providers.length; i++) {
            if (deal.shardAllocations[deal.providers[i]].active) {
                registry.recordDealCompleted(deal.providers[i]);
            }
        }
        
        emit DealCompleted(dealId);
    }
    
    /**
     * @dev Report a lost shard (provider went offline)
     * Called by monitoring service
     */
    function reportLostShard(uint256 dealId, address provider) external onlyOwner {
        Deal storage deal = deals[dealId];
        require(deal.status == DealStatus.Active, "Deal not active");
        require(deal.shardAllocations[provider].active, "Shard already inactive");
        
        deal.shardAllocations[provider].active = false;
        deal.activeShards--;
        
        emit ShardLost(dealId, provider, deal.shardAllocations[provider].shardIndex);
        
        // Mark deal as failed if too many shards lost
        if (deal.activeShards < MIN_PROVIDERS) {
            deal.status = DealStatus.Failed;
            
            // Refund client
            if (deal.escrowedAmount > 0) {
                uint256 refundAmount = deal.escrowedAmount;
                deal.escrowedAmount = 0;
                require(token.transfer(deal.client, refundAmount), "Refund failed");
            }
            
            emit DealFailed(dealId, "Too many shard failures");
            registry.recordDealFailed(provider);
        }
    }
    
    /**
     * @dev Repair a shard (assign to new provider)
     * Called by repair service after reconstructing shard
     */
    function repairShard(
        uint256 dealId,
        address oldProvider,
        address newProvider,
        string calldata newShardCID
    ) external onlyOwner {
        Deal storage deal = deals[dealId];
        require(deal.status == DealStatus.Active, "Deal not active");
        require(!deal.shardAllocations[oldProvider].active, "Old shard still active");
        require(registry.isProviderActive(newProvider), "New provider not active");
        
        uint256 shardIndex = deal.shardAllocations[oldProvider].shardIndex;
        uint256 shardSize = deal.shardAllocations[oldProvider].sizeGB;
        
        // Remove old allocation
        delete deal.shardAllocations[oldProvider];
        
        // Create new allocation
        deal.shardAllocations[newProvider] = ShardAllocation({
            shardIndex: shardIndex,
            shardCID: newShardCID,
            sizeGB: shardSize,
            active: true
        });
        
        // Update providers array
        for (uint256 i = 0; i < deal.providers.length; i++) {
            if (deal.providers[i] == oldProvider) {
                deal.providers[i] = newProvider;
                break;
            }
        }
        
        deal.activeShards++;
        providerDeals[newProvider].push(dealId);
        
        emit ShardRepaired(dealId, newProvider, shardIndex);
    }
    
    /**
     * @dev Get deal details
     */
    function getDeal(uint256 dealId) external view returns (
        address client,
        string memory fileCID,
        uint256 fileSizeGB,
        uint256 duration,
        uint256 totalCost,
        uint256 startTime,
        uint256 endTime,
        uint256 activeShards,
        DealStatus status
    ) {
        Deal storage deal = deals[dealId];
        return (
            deal.client,
            deal.fileCID,
            deal.fileSizeGB,
            deal.duration,
            deal.totalCost,
            deal.startTime,
            deal.endTime,
            deal.activeShards,
            deal.status
        );
    }
    
    /**
     * @dev Get providers for a deal
     */
    function getDealProviders(uint256 dealId) external view returns (address[] memory) {
        return deals[dealId].providers;
    }
    
    /**
     * @dev Get shard info for a provider in a deal
     */
    function getShardAllocation(uint256 dealId, address provider) external view returns (
        uint256 shardIndex,
        string memory shardCID,
        uint256 sizeGB,
        bool active
    ) {
        ShardAllocation storage shard = deals[dealId].shardAllocations[provider];
        return (shard.shardIndex, shard.shardCID, shard.sizeGB, shard.active);
    }
    
    /**
     * @dev Get all deals for a provider
     */
    function getProviderDeals(address provider) external view returns (uint256[] memory) {
        return providerDeals[provider];
    }

    /**
     * @dev Update protocol fee (only owner)
     */
    function setProtocolFee(uint256 _feeBasisPoints) external onlyOwner {
        require(_feeBasisPoints <= MAX_FEE_BASIS_POINTS, "Fee too high");
        protocolFeeBasisPoints = _feeBasisPoints;
        emit ProtocolFeeUpdated(_feeBasisPoints);
    }

    /**
     * @dev Update treasury address (only owner)
     */
    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid address");
        treasury = _treasury;
        emit TreasuryUpdated(_treasury);
    }

    /**
     * @dev Withdraw collected fees (only owner)
     */
    function withdrawFees() external onlyOwner nonReentrant {
        uint256 amount = totalFeesCollected;
        require(amount > 0, "No fees to withdraw");
        totalFeesCollected = 0;
        require(token.transfer(treasury, amount), "Transfer failed");
        emit FeesWithdrawn(treasury, amount);
    }
}
