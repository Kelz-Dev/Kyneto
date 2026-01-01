// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts@4.9.0/access/Ownable.sol";

/**
 * @dev Interface for StorageToken (only needed functions)
 */
interface IStorageToken {
    function burnFrom(address from, uint256 amount) external;

    function mint(address to, uint256 amount) external;
}

/**
 * @dev Interface for ProviderRegistry (only needed functions)
 */
interface IProviderRegistry {
    function recordSlashing(address provider) external;

    function decreaseReputation(
        address provider,
        uint256 amount,
        string calldata reason
    ) external;

    function increaseReputation(
        address provider,
        uint256 amount,
        string calldata reason
    ) external;
}

/**
 * @title SlashingManager
 * @dev Manages penalties for provider misbehavior
 */
contract SlashingManager is Ownable {
    IStorageToken public immutable token;
    IProviderRegistry public immutable registry;

    // Penalty rates (basis points, 1% = 100)
    uint256 public constant MISSED_POST_PENALTY_RATE = 100; // 1% per miss
    uint256 public constant DATA_LOSS_PENALTY_RATE = 10000; // 100% of deal collateral
    uint256 public constant MAX_CONSECUTIVE_MISSES = 5;

    struct SlashingRecord {
        uint256 timestamp;
        uint256 amount;
        string reason;
        bool appealed;
        bool resolved;
    }

    struct ProviderPenaltyState {
        uint256 consecutiveMissedPosts;
        uint256 lastMissedPostTime;
        uint256 totalSlashed;
        uint256 lastSlashTime;
        uint256 slashCountInWindow;
    }

    mapping(address => ProviderPenaltyState) public penaltyStates;
    mapping(address => SlashingRecord[]) public slashingHistory;

    event ProviderSlashed(
        address indexed provider,
        uint256 amount,
        string reason
    );

    constructor(address _token, address _registry) {
        token = IStorageToken(_token);
        registry = IProviderRegistry(_registry);
    }

    function slashMissedPost(
        address provider,
        uint256 collateral
    ) external onlyOwner {
        ProviderPenaltyState storage state = penaltyStates[provider];

        if (block.timestamp - state.lastMissedPostTime <= 48 hours) {
            state.consecutiveMissedPosts++;
        } else {
            state.consecutiveMissedPosts = 1;
        }

        state.lastMissedPostTime = block.timestamp;
        uint256 penalty = (collateral * MISSED_POST_PENALTY_RATE) / 10000;

        token.burnFrom(provider, penalty);
        state.totalSlashed += penalty;

        slashingHistory[provider].push(
            SlashingRecord({
                timestamp: block.timestamp,
                amount: penalty,
                reason: "Missed PoSt proof",
                appealed: false,
                resolved: false
            })
        );

        registry.recordSlashing(provider);
        emit ProviderSlashed(provider, penalty, "Missed PoSt proof");
    }

    function slashDataLoss(
        address provider,
        uint256 dealCollateral
    ) external onlyOwner {
        uint256 penalty = dealCollateral;
        token.burnFrom(provider, penalty);

        registry.decreaseReputation(provider, 50, "Data loss");
        registry.recordSlashing(provider);

        emit ProviderSlashed(provider, penalty, "Data loss");
    }
}
