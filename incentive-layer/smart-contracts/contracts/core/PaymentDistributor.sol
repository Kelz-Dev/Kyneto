// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./StorageToken.sol";
import "./StorageMarketplace.sol";
import "./CapacityPledge.sol";
import "./ProviderRegistry.sol";

/**
 * @title PaymentDistributor
 * @dev Manages automated payment distribution to providers
 * Handles capacity rewards, usage rewards, and proof bonuses
 */
contract PaymentDistributor is Ownable, ReentrancyGuard {
    StorageToken public immutable token;
    StorageMarketplace public immutable marketplace;
    CapacityPledge public immutable pledges;
    ProviderRegistry public immutable registry;

    // Rates (in basis points, 1% = 100, configurable)
    uint256 public capacityRatePerGBMonth = 1000000000000000; // 0.001 tokens (adjustable)
    uint256 public usageRatePerGBMonth = 3000000000000000; // 0.003 tokens
    uint256 public postBonusPerSubmission = 100000000000000000; // 0.1 tokens

    // Protocol fee (5% basis)
    uint256 public constant PROTOCOL_FEE_RATE = 500; // 5%
    uint256 public protocolFeeCollected;

    // Reserve for repair operations (5%)
    uint256 public constant RESERVE_RATE = 500; // 5%
    uint256 public repairReserve;

    struct ProviderEarnings {
        uint256 capacityRewards;
        uint256 usageRewards;
        uint256 proofBonuses;
        uint256 totalEarned;
        uint256 totalWithdrawn;
        uint256 lastClaimTimestamp;
    }

    mapping(address => ProviderEarnings) public earnings;

    // Monthly distribution tracking
    uint256 public lastDistributionTimestamp;
    uint256 public constant DISTRIBUTION_INTERVAL = 30 days;

    // Events
    event CapacityRewardPaid(address indexed provider, uint256 amount);
    event UsageRewardPaid(
        address indexed provider,
        uint256 dealId,
        uint256 amount
    );
    event ProofBonusPaid(address indexed provider, uint256 amount);
    event RewardsWithdrawn(address indexed provider, uint256 amount);
    event ProtocolFeeCollected(uint256 amount);
    event RepairFunded(uint256 amount);

    constructor(
        address _token,
        address _marketplace,
        address _pledges,
        address _registry
    ) Ownable(msg.sender) {
        token = StorageToken(_token);
        marketplace = StorageMarketplace(_marketplace);
        pledges = CapacityPledge(_pledges);
        registry = ProviderRegistry(_registry);
        lastDistributionTimestamp = block.timestamp;
    }

    /**
     * @dev Distribute monthly capacity rewards to a provider
     * Called by automated service monthly
     */
    function distributeCapacityRewards(
        address provider,
        uint256 pledgeId
    ) external onlyOwner nonReentrant {
        (
            uint256 capacityGB,
            ,
            ,
            ,
            uint256 multiplier,
            ,
            bool active
        ) = _getPledgeInfo(provider, pledgeId);

        require(active, "Pledge not active");
        require(registry.isProviderActive(provider), "Provider not active");

        // Calculate reward with multiplier
        uint256 baseReward = capacityGB * capacityRatePerGBMonth;
        uint256 reward = (baseReward * multiplier) / 100;

        // Mint new tokens for capacity rewards (inflation)
        token.mint(address(this), reward);

        earnings[provider].capacityRewards += reward;
        earnings[provider].totalEarned += reward;

        emit CapacityRewardPaid(provider, reward);
    }

    /**
     * @dev Distribute usage rewards when deal completes
     */
    function distributeUsageRewards(
        uint256 dealId
    ) external onlyOwner nonReentrant {
        (
            ,
            ,
            uint256 fileSizeGB,
            uint256 durationDays,
            uint256 totalCost,
            ,
            ,
            uint256 activeShards,
            StorageMarketplace.DealStatus status
        ) = marketplace.getDeal(dealId);

        require(
            status == StorageMarketplace.DealStatus.Completed,
            "Deal not completed"
        );
        require(activeShards >= 10, "Too many failures");

        address[] memory providers = marketplace.getDealProviders(dealId);

        // Calculate distribution
        uint256 totalMonths = (durationDays + 29) / 30;
        uint256 perShardReward = (fileSizeGB *
            usageRatePerGBMonth *
            totalMonths) / 15;

        // Deduct protocol fee and reserve
        uint256 protocolFee = (totalCost * PROTOCOL_FEE_RATE) / 10000;
        uint256 reserve = (totalCost * RESERVE_RATE) / 10000;

        protocolFeeCollected += protocolFee;
        repairReserve += reserve;

        emit ProtocolFeeCollected(protocolFee);
        emit RepairFunded(reserve);

        // Distribute to active providers
        for (uint256 i = 0; i < providers.length; i++) {
            (, , , bool active) = marketplace.getShardAllocation(
                dealId,
                providers[i]
            );

            if (active) {
                earnings[providers[i]].usageRewards += perShardReward;
                earnings[providers[i]].totalEarned += perShardReward;

                emit UsageRewardPaid(providers[i], dealId, perShardReward);
            }
        }
    }

    /**
     * @dev Pay proof submission bonus
     */
    function payProofBonus(address provider) external onlyOwner {
        require(registry.isProviderActive(provider), "Provider not active");

        earnings[provider].proofBonuses += postBonusPerSubmission;
        earnings[provider].totalEarned += postBonusPerSubmission;

        // Mint bonus from inflation
        token.mint(address(this), postBonusPerSubmission);

        emit ProofBonusPaid(provider, postBonusPerSubmission);
    }

    /**
     * @dev Provider withdraws accumulated earnings
     */
    function withdrawEarnings() external nonReentrant {
        uint256 available = earnings[msg.sender].totalEarned -
            earnings[msg.sender].totalWithdrawn;
        require(available > 0, "No earnings available");

        earnings[msg.sender].totalWithdrawn += available;
        earnings[msg.sender].lastClaimTimestamp = block.timestamp;

        require(token.transfer(msg.sender, available), "Transfer failed");

        emit RewardsWithdrawn(msg.sender, available);
    }

    /**
     * @dev Get available earnings for a provider
     */
    function getAvailableEarnings(
        address provider
    ) external view returns (uint256) {
        return
            earnings[provider].totalEarned - earnings[provider].totalWithdrawn;
    }

    /**
     * @dev Get detailed earnings breakdown
     */
    function getEarningsBreakdown(
        address provider
    )
        external
        view
        returns (
            uint256 capacityRewards,
            uint256 usageRewards,
            uint256 proofBonuses,
            uint256 totalEarned,
            uint256 totalWithdrawn,
            uint256 available
        )
    {
        ProviderEarnings storage e = earnings[provider];
        return (
            e.capacityRewards,
            e.usageRewards,
            e.proofBonuses,
            e.totalEarned,
            e.totalWithdrawn,
            e.totalEarned - e.totalWithdrawn
        );
    }

    /**
     * @dev Withdraw protocol fees (for development fund)
     */
    function withdrawProtocolFees(address recipient) external onlyOwner {
        require(protocolFeeCollected > 0, "No fees to withdraw");

        uint256 amount = protocolFeeCollected;
        protocolFeeCollected = 0;

        require(token.transfer(recipient, amount), "Transfer failed");
    }

    /**
     * @dev Use repair reserve for shard repair operations
     */
    function useRepairReserve(
        address newProvider,
        uint256 amount
    ) external onlyOwner {
        require(repairReserve >= amount, "Insufficient reserve");

        repairReserve -= amount;

        // Pay new provider for taking over shard
        earnings[newProvider].usageRewards += amount;
        earnings[newProvider].totalEarned += amount;
    }

    /**
     * @dev Update rates (governance function)
     */
    function updateRates(
        uint256 newCapacityRate,
        uint256 newUsageRate,
        uint256 newPostBonus
    ) external onlyOwner {
        capacityRatePerGBMonth = newCapacityRate;
        usageRatePerGBMonth = newUsageRate;
        postBonusPerSubmission = newPostBonus;
    }

    /**
     * @dev Helper to get pledge info
     */
    function _getPledgeInfo(
        address provider,
        uint256 pledgeId
    )
        internal
        view
        returns (
            uint256 capacityGB,
            uint256 collateral,
            uint256 startTime,
            uint256 duration,
            uint256 multiplier,
            uint256 utilizationGB,
            bool active
        )
    {
        // Call CapacityPledge contract to get pledge details
        CapacityPledge.Pledge memory pledge = pledges.getPledge(
            provider,
            pledgeId
        );

        return (
            pledge.capacityGB,
            pledge.collateral,
            pledge.startTime,
            pledge.duration,
            pledge.multiplier,
            pledge.utilizationGB,
            pledge.active
        );
    }
}
