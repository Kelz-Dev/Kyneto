// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ProviderRegistry
 * @dev Manages storage provider registration, reputation, and status
 */
contract ProviderRegistry is Ownable {
    struct Provider {
        bool registered;
        uint256 registrationTime;
        uint256 totalCapacityGB; // Total pledged across all pledges
        uint256 reputationScore; // 0-100
        string peerId; // IPFS/Libp2p peer ID
        string endpoint; // Provider API endpoint
        string region; // Geographic region for diversity
        uint256 totalDealsCompleted;
        uint256 totalDealsFailed;
        uint256 totalSlashingEvents;
        bool active; // Can be deactivated for cooldown period
        uint256 deactivatedUntil; // Timestamp when provider can reactivate
        uint256 minPriceUSD; // Minimum price in USD (6 decimals)
    }

    mapping(address => Provider) public providers;
    address[] public providerList;

    // Reputation thresholds
    uint256 public constant INITIAL_REPUTATION = 50;
    uint256 public constant MAX_REPUTATION = 100;
    uint256 public constant MIN_REPUTATION = 0;
    uint256 public constant COOLDOWN_PERIOD = 7 days;

    // Events
    event ProviderRegistered(
        address indexed provider,
        string peerId,
        string region
    );
    event ProviderUpdated(address indexed provider);
    event ReputationUpdated(
        address indexed provider,
        uint256 newScore,
        string reason
    );
    event ProviderDeactivated(address indexed provider, uint256 reactivateTime);
    event ProviderReactivated(address indexed provider);

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Register as a storage provider
     */
    function registerProvider(
        string calldata peerId,
        string calldata endpoint,
        string calldata region,
        uint256 minPriceUSD
    ) external {
        require(!providers[msg.sender].registered, "Already registered");
        require(bytes(peerId).length > 0, "Invalid peer ID");

        providers[msg.sender] = Provider({
            registered: true,
            registrationTime: block.timestamp,
            totalCapacityGB: 0,
            reputationScore: INITIAL_REPUTATION,
            peerId: peerId,
            endpoint: endpoint,
            region: region,
            totalDealsCompleted: 0,
            totalDealsFailed: 0,
            totalSlashingEvents: 0,
            active: true,
            deactivatedUntil: 0,
            minPriceUSD: minPriceUSD
        });

        providerList.push(msg.sender);

        emit ProviderRegistered(msg.sender, peerId, region);
    }

    /**
     * @dev Update provider information
     */
    function updateProvider(
        string calldata endpoint,
        string calldata region,
        uint256 minPriceUSD
    ) external {
        require(providers[msg.sender].registered, "Not registered");

        providers[msg.sender].endpoint = endpoint;
        providers[msg.sender].region = region;
        providers[msg.sender].minPriceUSD = minPriceUSD;

        emit ProviderUpdated(msg.sender);
    }

    /**
     * @dev Update total capacity (called by CapacityPledge contract)
     */
    function updateCapacity(
        address provider,
        uint256 newTotalCapacityGB
    ) external onlyOwner {
        require(providers[provider].registered, "Provider not registered");
        providers[provider].totalCapacityGB = newTotalCapacityGB;
    }

    /**
     * @dev Increase reputation (successful deal or proof)
     */
    function increaseReputation(
        address provider,
        uint256 amount,
        string memory reason
    ) public onlyOwner {
        require(providers[provider].registered, "Provider not registered");

        uint256 newScore = providers[provider].reputationScore + amount;
        if (newScore > MAX_REPUTATION) {
            newScore = MAX_REPUTATION;
        }

        providers[provider].reputationScore = newScore;
        emit ReputationUpdated(provider, newScore, reason);
    }

    /**
     * @dev Decrease reputation (failed deal, missed proof, slashing)
     */
    function decreaseReputation(
        address provider,
        uint256 amount,
        string memory reason
    ) public onlyOwner {
        require(providers[provider].registered, "Provider not registered");

        uint256 currentScore = providers[provider].reputationScore;
        uint256 newScore = currentScore > amount
            ? currentScore - amount
            : MIN_REPUTATION;

        providers[provider].reputationScore = newScore;
        emit ReputationUpdated(provider, newScore, reason);

        // Auto-deactivate if reputation drops too low
        if (newScore < 20) {
            deactivateProvider(provider);
        }
    }

    /**
     * @dev Record successful deal completion
     */
    function recordDealCompleted(address provider) external onlyOwner {
        require(providers[provider].registered, "Provider not registered");
        providers[provider].totalDealsCompleted++;

        // Small reputation increase for successful deals
        increaseReputation(provider, 1, "Successful deal completion");
    }

    /**
     * @dev Record failed deal
     */
    function recordDealFailed(address provider) external onlyOwner {
        require(providers[provider].registered, "Provider not registered");
        providers[provider].totalDealsFailed++;

        // Reputation decrease for failed deals
        decreaseReputation(provider, 5, "Failed deal");
    }

    /**
     * @dev Record slashing event
     */
    function recordSlashing(address provider) external onlyOwner {
        require(providers[provider].registered, "Provider not registered");
        providers[provider].totalSlashingEvents++;

        // Significant reputation decrease for slashing
        decreaseReputation(provider, 20, "Slashing event");

        // Deactivate after 5 slashing events
        if (providers[provider].totalSlashingEvents >= 5) {
            deactivateProvider(provider);
        }
    }

    /**
     * @dev Deactivate a provider (cooldown period)
     */
    function deactivateProvider(address provider) internal {
        providers[provider].active = false;
        providers[provider].deactivatedUntil =
            block.timestamp +
            COOLDOWN_PERIOD;

        emit ProviderDeactivated(
            provider,
            providers[provider].deactivatedUntil
        );
    }

    /**
     * @dev Reactivate provider after cooldown
     */
    function reactivateProvider() external {
        require(providers[msg.sender].registered, "Not registered");
        require(!providers[msg.sender].active, "Already active");
        require(
            block.timestamp >= providers[msg.sender].deactivatedUntil,
            "Cooldown not complete"
        );

        providers[msg.sender].active = true;
        providers[msg.sender].reputationScore = INITIAL_REPUTATION; // Reset to initial
        providers[msg.sender].totalSlashingEvents = 0; // Clear slashing history

        emit ProviderReactivated(msg.sender);
    }

    /**
     * @dev Check if provider is active and available
     */
    function isProviderActive(address provider) external view returns (bool) {
        return providers[provider].registered && providers[provider].active;
    }

    /**
     * @dev Get provider details
     */
    function getProvider(
        address provider
    ) external view returns (Provider memory) {
        return providers[provider];
    }

    /**
     * @dev Get total number of registered providers
     */
    function getProviderCount() external view returns (uint256) {
        return providerList.length;
    }

    /**
     * @dev Get list of active providers (for shard placement)
     */
    /**
     * @dev Get list of eligible providers based on price and reputation
     */
    function getEligibleProviders(
        uint256 maxPriceUSD,
        uint256 minReputation
    ) external view returns (address[] memory) {
        uint256 eligibleCount = 0;

        for (uint256 i = 0; i < providerList.length; i++) {
            address provider = providerList[i];
            if (
                providers[provider].active &&
                providers[provider].reputationScore >= minReputation &&
                providers[provider].minPriceUSD <= maxPriceUSD
            ) {
                eligibleCount++;
            }
        }

        address[] memory eligibleProviders = new address[](eligibleCount);
        uint256 index = 0;
        for (uint256 i = 0; i < providerList.length; i++) {
            address provider = providerList[i];
            if (
                providers[provider].active &&
                providers[provider].reputationScore >= minReputation &&
                providers[provider].minPriceUSD <= maxPriceUSD
            ) {
                eligibleProviders[index] = provider;
                index++;
            }
        }

        return eligibleProviders;
    }
}
