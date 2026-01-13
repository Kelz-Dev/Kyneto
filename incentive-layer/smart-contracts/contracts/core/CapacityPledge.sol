// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./StorageToken.sol";

/**
 * @title CapacityPledge
 * @dev Manages storage capacity pledges from providers
 * Providers lock collateral and commit capacity for a duration to earn base rewards
 */
contract CapacityPledge is Ownable {
    StorageToken public immutable token;

    // Pledge durations and multipliers
    uint256 public constant DURATION_30_DAYS = 30 days;
    uint256 public constant DURATION_90_DAYS = 90 days;
    uint256 public constant DURATION_180_DAYS = 180 days;
    uint256 public constant DURATION_365_DAYS = 365 days;

    uint256 public constant MULTIPLIER_30 = 100; // 1.0x (100%)
    uint256 public constant MULTIPLIER_90 = 110; // 1.1x (110%)
    uint256 public constant MULTIPLIER_180 = 120; // 1.2x (120%)
    uint256 public constant MULTIPLIER_365 = 130; // 1.3x (130%)

    uint256 public constant EARLY_EXIT_PENALTY_PERCENT = 20; // 20% of collateral

    struct Pledge {
        uint256 capacityGB; // Pledged capacity in GB
        uint256 collateral; // Locked tokens as collateral
        uint256 startTime;
        uint256 duration;
        uint256 multiplier;
        uint256 utilizationGB; // Currently used capacity
        bool active;
    }

    // Provider address => Pledge ID => Pledge
    mapping(address => mapping(uint256 => Pledge)) public pledges;
    mapping(address => uint256) public pledgeCount;

    // Total pledged capacity across network
    uint256 public totalPledgedCapacityGB;
    uint256 public totalActiveCollateral;

    // Events
    event PledgeCreated(
        address indexed provider,
        uint256 indexed pledgeId,
        uint256 capacityGB,
        uint256 duration,
        uint256 collateral
    );
    event PledgeCompleted(
        address indexed provider,
        uint256 indexed pledgeId,
        uint256 returnedCollateral
    );
    event PledgeExitedEarly(
        address indexed provider,
        uint256 indexed pledgeId,
        uint256 penalty,
        uint256 returned
    );
    event UtilizationUpdated(
        address indexed provider,
        uint256 indexed pledgeId,
        uint256 newUtilization
    );

    constructor(address _token) Ownable(msg.sender) {
        token = StorageToken(_token);
    }

    /**
     * @dev Create a new capacity pledge
     * @param capacityGB Amount of storage capacity to pledge in GB
     * @param duration Duration of pledge (must match predefined durations)
     * @param collateralAmount Amount of tokens to lock as collateral
     */
    function createPledge(
        uint256 capacityGB,
        uint256 duration,
        uint256 collateralAmount
    ) external {
        require(capacityGB > 0, "Capacity must be > 0");

        // Determine multiplier based on duration
        uint256 multiplier;
        if (duration == DURATION_30_DAYS) {
            multiplier = MULTIPLIER_30;
        } else if (duration == DURATION_90_DAYS) {
            multiplier = MULTIPLIER_90;
        } else if (duration == DURATION_180_DAYS) {
            multiplier = MULTIPLIER_180;
        } else if (duration == DURATION_365_DAYS) {
            multiplier = MULTIPLIER_365;
        } else {
            revert("Invalid duration");
        }

        // Verify sufficient collateral (should be >= 3 months of expected earnings)
        uint256 minCollateral = calculateMinimumCollateral(
            capacityGB,
            duration
        );
        require(collateralAmount >= minCollateral, "Insufficient collateral");

        // Transfer collateral from provider
        require(
            token.transferFrom(msg.sender, address(this), collateralAmount),
            "Collateral transfer failed"
        );

        // Create pledge
        uint256 pledgeId = pledgeCount[msg.sender]++;
        pledges[msg.sender][pledgeId] = Pledge({
            capacityGB: capacityGB,
            collateral: collateralAmount,
            startTime: block.timestamp,
            duration: duration,
            multiplier: multiplier,
            utilizationGB: 0,
            active: true
        });

        totalPledgedCapacityGB += capacityGB;
        totalActiveCollateral += collateralAmount;

        emit PledgeCreated(
            msg.sender,
            pledgeId,
            capacityGB,
            duration,
            collateralAmount
        );
    }

    /**
     * @dev Complete a pledge after duration expires
     */
    function completePledge(uint256 pledgeId) external {
        Pledge storage pledge = pledges[msg.sender][pledgeId];
        require(pledge.active, "Pledge not active");
        require(
            block.timestamp >= pledge.startTime + pledge.duration,
            "Pledge period not complete"
        );

        uint256 returnAmount = pledge.collateral;
        pledge.active = false;

        totalPledgedCapacityGB -= pledge.capacityGB;
        totalActiveCollateral -= pledge.collateral;

        require(
            token.transfer(msg.sender, returnAmount),
            "Collateral return failed"
        );

        emit PledgeCompleted(msg.sender, pledgeId, returnAmount);
    }

    /**
     * @dev Exit pledge early (with penalty)
     */
    function exitPledgeEarly(uint256 pledgeId) external {
        Pledge storage pledge = pledges[msg.sender][pledgeId];
        require(pledge.active, "Pledge not active");

        uint256 elapsed = block.timestamp - pledge.startTime;
        uint256 remaining = pledge.duration > elapsed
            ? pledge.duration - elapsed
            : 0;

        // Calculate penalty: (remaining / total) * 20% of collateral
        uint256 penalty = (pledge.collateral *
            remaining *
            EARLY_EXIT_PENALTY_PERCENT) / (pledge.duration * 100);
        uint256 returnAmount = pledge.collateral - penalty;

        pledge.active = false;
        totalPledgedCapacityGB -= pledge.capacityGB;
        totalActiveCollateral -= pledge.collateral;

        // Burn penalty tokens (deflationary)
        if (penalty > 0) {
            token.burn(penalty);
        }

        if (returnAmount > 0) {
            require(token.transfer(msg.sender, returnAmount), "Return failed");
        }

        emit PledgeExitedEarly(msg.sender, pledgeId, penalty, returnAmount);
    }

    /**
     * @dev Update utilization (called by StorageMarketplace when deals are created/ended)
     * Can only be called by authorized contracts
     */
    function updateUtilization(
        address provider,
        uint256 pledgeId,
        uint256 newUtilizationGB
    ) external onlyOwner {
        Pledge storage pledge = pledges[provider][pledgeId];
        require(pledge.active, "Pledge not active");
        require(
            newUtilizationGB <= pledge.capacityGB,
            "Utilization exceeds capacity"
        );

        pledge.utilizationGB = newUtilizationGB;
        emit UtilizationUpdated(provider, pledgeId, newUtilizationGB);
    }

    /**
     * @dev Calculate minimum required collateral
     * Should be >= value of pledged capacity for 3 months
     */
    function calculateMinimumCollateral(
        uint256 capacityGB,
        uint256 /* duration */
    ) public pure returns (uint256) {
        // Assuming $0.025 per GB for 3 months, and token price of $0.10
        // Min collateral = capacityGB * 0.025 * 3 / 0.10 = capacityGB * 0.75 tokens
        // For simplicity, using a fixed ratio
        return capacityGB * 75 * 10 ** 16; // 0.75 tokens per GB (18 decimals)
    }

    /**
     * @dev Get pledge information
     */
    function getPledge(
        address provider,
        uint256 pledgeId
    ) external view returns (Pledge memory) {
        return pledges[provider][pledgeId];
    }

    /**
     * @dev Get available capacity for a provider
     */
    function getAvailableCapacity(
        address provider,
        uint256 pledgeId
    ) external view returns (uint256) {
        Pledge storage pledge = pledges[provider][pledgeId];
        if (!pledge.active) return 0;
        return pledge.capacityGB - pledge.utilizationGB;
    }
}
