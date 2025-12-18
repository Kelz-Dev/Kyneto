// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./StorageToken.sol";
import "./ProviderRegistry.sol";

/**
 * @title SlashingManager
 * @dev Manages penalties for provider misbehavior (Filecoin + Storj inspired)
 */
contract SlashingManager is Ownable {
    StorageToken public immutable token;
    ProviderRegistry public immutable registry;
    
    // Penalty rates (basis points, 1% = 100)
    uint256 public constant MISSED_POST_PENALTY_RATE = 100; // 1% per miss
    uint256 public constant DATA_LOSS_PENALTY_RATE = 10000; // 100% of deal collateral
    uint256 public constant MAX_CONSECUTIVE_MISSES = 5;
    
    // Repeated failure multiplier
    uint256 public constant REPEAT_MULTIPLIER = 2; // 2x penalty for repeats within window
    uint256 public constant REPEAT_WINDOW = 30 days;
    
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
        uint256 slashCountInWindow; // Slashes within REPEAT_WINDOW
    }
    
    mapping(address => ProviderPenaltyState) public penaltyStates;
    mapping(address => SlashingRecord[]) public slashingHistory;
    
    // Appeal mechanism
    uint256 public constant APPEAL_WINDOW = 48 hours;
    mapping(address => mapping(uint256 => uint256)) public appealDeadlines;
    
    // Events
    event ProviderSlashed(address indexed provider, uint256 amount, string reason);
    event AppealSubmitted(address indexed provider, uint256 slashingIndex, string evidence);
    event AppealResolved(address indexed provider, uint256 slashingIndex, bool upheld);
    event ProviderDeregistered(address indexed provider, string reason);
    
    constructor(address _token, address _registry) Ownable(msg.sender) {
        token = StorageToken(_token);
        registry = ProviderRegistry(_registry);
    }
    
    /**
     * @dev Slash for missed PoSt proof
     */
    function slashMissedPost(address provider, uint256 collateral) external onlyOwner {
        ProviderPenaltyState storage state = penaltyStates[provider];
        
        // Check if this is a consecutive miss
        if (block.timestamp - state.lastMissedPostTime <= 48 hours) {
            state.consecutiveMissedPosts++;
        } else {
            state.consecutiveMissedPosts = 1;
        }
        
        state.lastMissedPostTime = block.timestamp;
        
        // Calculate penalty with repeat multiplier
        uint256 basePenalty = (collateral * MISSED_POST_PENALTY_RATE) / 10000;
        uint256 multiplier = calculateRepeatMultiplier(provider);
        uint256 penalty = basePenalty * multiplier;
        
        // Apply slashing
        _applySlashing(provider, penalty, "Missed PoSt proof");
        
        // Deregister after max consecutive misses
        if (state.consecutiveMissedPosts >= MAX_CONSECUTIVE_MISSES) {
            _deregisterProvider(provider, "Exceeded maximum consecutive missed proofs");
        }
        
        // Update registry
        registry.recordSlashing(provider);
    }
    
    /**
     * @dev Slash for data loss
     */
    function slashDataLoss(address provider, uint256 dealCollateral) external onlyOwner {
        // 100% of deal collateral
        uint256 penalty = dealCollateral;
        
        _applySlashing(provider, penalty, "Data loss");
        
        // Severe reputation penalty
        registry.decreaseReputation(provider, 50, "Data loss");
        registry.recordSlashing(provider);
    }
    
    /**
     * @dev Slash for early pledge exit (calculated by CapacityPledge)
     */
    function slashEarlyExit(address provider, uint256 penaltyAmount) external onlyOwner {
        _applySlashing(provider, penaltyAmount, "Early pledge exit");
    }
    
    /**
     * @dev Apply slashing and record
     */
    function _applySlashing(address provider, uint256 amount, string memory reason) internal {
        ProviderPenaltyState storage state = penaltyStates[provider];
        
        // Burn tokens (deflationary)
        token.burnFrom(provider, amount);
        
        // Update state
        state.totalSlashed += amount;
        
        // Track repeat offenses
        if (block.timestamp - state.lastSlashTime <= REPEAT_WINDOW) {
            state.slashCountInWindow++;
        } else {
            state.slashCountInWindow = 1;
        }
        state.lastSlashTime = block.timestamp;
        
        // Record slashing
        uint256 recordIndex = slashingHistory[provider].length;
        slashingHistory[provider].push(SlashingRecord({
            timestamp: block.timestamp,
            amount: amount,
            reason: reason,
            appealed: false,
            resolved: false
        }));
        
        // Set appeal deadline
        appealDeadlines[provider][recordIndex] = block.timestamp + APPEAL_WINDOW;
        
        emit ProviderSlashed(provider, amount, reason);
    }
    
    /**
     * @dev Calculate repeat offense multiplier
     */
    function calculateRepeatMultiplier(address provider) internal view returns (uint256) {
        ProviderPenaltyState storage state = penaltyStates[provider];
        
        if (block.timestamp - state.lastSlashTime > REPEAT_WINDOW) {
            return 1; // No recent slashes
        }
        
        // Exponential: 1x, 2x, 4x, max 8x
        uint256 multiplier = 2 ** state.slashCountInWindow;
        return multiplier > 8 ? 8 : multiplier;
    }
    
    /**
     * @dev Submit appeal for slashing
     */
    function submitAppeal(uint256 slashingIndex, string calldata evidence) external {
        require(slashingIndex < slashingHistory[msg.sender].length, "Invalid index");
        SlashingRecord storage record = slashingHistory[msg.sender][slashingIndex];
        
        require(!record.appealed, "Already appealed");
        require(!record.resolved, "Already resolved");
        require(block.timestamp <= appealDeadlines[msg.sender][slashingIndex], "Appeal window closed");
        
        record.appealed = true;
        
        emit AppealSubmitted(msg.sender, slashingIndex, evidence);
    }
    
    /**
     * @dev Resolve appeal (governance or automated)
     */
    function resolveAppeal(address provider, uint256 slashingIndex, bool upheld) external onlyOwner {
        require(slashingIndex < slashingHistory[provider].length, "Invalid index");
        SlashingRecord storage record = slashingHistory[provider][slashingIndex];
        
        require(record.appealed, "Not appealed");
        require(!record.resolved, "Already resolved");
        
        record.resolved = true;
        
        if (!upheld) {
            // Appeal successful - refund tokens (mint new ones)
            token.mint(provider, record.amount);
            
            // Restore some reputation
            registry.increaseReputation(provider, 10, "Appeal upheld");
        }
        
        emit AppealResolved(provider, slashingIndex, upheld);
    }
    
    /**
     * @dev Deregister provider
     */
    function _deregisterProvider(address provider, string memory reason) internal {
        // Provider marked as inactive in registry (handled by registry contract)
        // This function just emits event
        emit ProviderDeregistered(provider, reason);
    }
    
    /**
     * @dev Get provider slashing history
     */
    function getSlashingHistory(address provider) external view returns (SlashingRecord[] memory) {
        return slashingHistory[provider];
    }
    
    /**
     * @dev Get penalty state
     */
    function getPenaltyState(address provider) external view returns (ProviderPenaltyState memory) {
        return penaltyStates[provider];
    }
}
