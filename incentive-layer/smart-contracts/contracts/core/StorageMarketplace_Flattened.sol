// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @dev OpenZeppelin Imports (GitHub URLs for Remix)
 * These allow Remix to fetch the standard libraries automatically.
 */
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.0/contracts/token/ERC20/ERC20.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.0/contracts/access/Ownable.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.0/contracts/utils/ReentrancyGuard.sol";

/**
 * @title StorageToken
 * @dev ERC-20 token for the decentralized storage marketplace
 */
contract StorageToken is ERC20, Ownable {
    uint256 public constant INITIAL_SUPPLY = 500_000_000 * 10**18;
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18;
    
    uint256 public annualInflationRate = 500; // 5.00%
    uint256 public lastInflationTimestamp;
    
    mapping(address => bool) public authorizedMinters;
    mapping(address => bool) public authorizedBurners;
    
    constructor() ERC20("StorageToken", "STK") Ownable(msg.sender) {
        _mint(msg.sender, INITIAL_SUPPLY);
        lastInflationTimestamp = block.timestamp;
    }
    
    function mint(address to, uint256 amount) external {
        require(authorizedMinters[msg.sender], "Not authorized to mint");
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(to, amount);
    }
    
    function burnFrom(address from, uint256 amount) external {
        require(authorizedBurners[msg.sender], "Not authorized to burn");
        _burn(from, amount);
    }
    
    function authorizeBurner(address burner) external onlyOwner { authorizedBurners[burner] = true; }
    function authorizeMinter(address minter) external onlyOwner { authorizedMinters[minter] = true; }
}

/**
 * @title ProviderRegistry
 * @dev Manages storage provider registration and reputation
 */
contract ProviderRegistry is Ownable {
    struct Provider {
        bool registered;
        uint256 registrationTime;
        uint256 totalCapacityGB;
        uint256 reputationScore;
        string peerId;
        string endpoint;
        string region;
        uint256 totalDealsCompleted;
        uint256 totalDealsFailed;
        uint256 totalSlashingEvents;
        bool active;
        uint256 deactivatedUntil;
    }
    
    mapping(address => Provider) public providers;
    address[] public providerList;
    
    constructor() Ownable(msg.sender) {}
    
    function registerProvider(string calldata peerId, string calldata endpoint, string calldata region) external {
        require(!providers[msg.sender].registered, "Already registered");
        providers[msg.sender] = Provider({
            registered: true,
            registrationTime: block.timestamp,
            totalCapacityGB: 0,
            reputationScore: 50,
            peerId: peerId,
            endpoint: endpoint,
            region: region,
            totalDealsCompleted: 0,
            totalDealsFailed: 0,
            totalSlashingEvents: 0,
            active: true,
            deactivatedUntil: 0
        });
        providerList.push(msg.sender);
    }
    
    function isProviderActive(address provider) external view returns (bool) {
        return providers[provider].registered && providers[provider].active;
    }
    
    function recordDealCompleted(address provider) external onlyOwner { providers[provider].totalDealsCompleted++; }
    function recordDealFailed(address provider) external onlyOwner { providers[provider].totalDealsFailed++; }
    function recordSlashing(address provider) external onlyOwner { providers[provider].totalSlashingEvents++; }
    
    function decreaseReputation(address provider, uint256 amount, string calldata reason) external onlyOwner {
        if (providers[provider].reputationScore > amount) providers[provider].reputationScore -= amount;
        else providers[provider].reputationScore = 0;
    }
    
    function increaseReputation(address provider, uint256 amount, string calldata reason) external onlyOwner {
        providers[provider].reputationScore += amount;
        if (providers[provider].reputationScore > 100) providers[provider].reputationScore = 100;
    }
}

/**
 * @title CapacityPledge
 * @dev Manages storage capacity pledges from providers
 */
contract CapacityPledge is Ownable {
    StorageToken public immutable token;
    
    struct Pledge {
        uint256 capacityGB;
        uint256 collateral;
        uint256 startTime;
        uint256 duration;
        uint256 multiplier;
        uint256 utilizationGB;
        bool active;
    }
    
    mapping(address => mapping(uint256 => Pledge)) public pledges;
    mapping(address => uint256) public pledgeCount;
    
    constructor(address _token) Ownable(msg.sender) {
        token = StorageToken(_token);
    }
    
    function getPledge(address provider, uint256 pledgeId) external view returns (Pledge memory) {
        return pledges[provider][pledgeId];
    }
}

/**
 * @title StorageMarketplace
 * @dev Manages storage deals between clients and providers
 */
contract StorageMarketplace is Ownable, ReentrancyGuard {
    StorageToken public immutable token;
    ProviderRegistry public immutable registry;
    CapacityPledge public immutable pledges;
    
    enum DealStatus { Active, Completed, Failed, Cancelled }
    
    struct Deal {
        address client;
        string fileCID;
        uint256 fileSizeGB;
        uint256 duration;
        uint256 totalCost;
        uint256 startTime;
        uint256 endTime;
        address[] providers;
        uint256 activeShards;
        DealStatus status;
        uint256 escrowedAmount;
    }
    
    mapping(uint256 => Deal) public deals;
    uint256 public dealCount;
    
    constructor(address _token, address _registry, address _pledges, address _treasury) Ownable(msg.sender) {
        token = StorageToken(_token);
        registry = ProviderRegistry(_registry);
        pledges = CapacityPledge(_pledges);
    }
    
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
        Deal storage d = deals[dealId];
        return (d.client, d.fileCID, d.fileSizeGB, d.duration, d.totalCost, d.startTime, d.endTime, d.activeShards, d.status);
    }
    
    function getDealProviders(uint256 dealId) external view returns (address[] memory) {
        return deals[dealId].providers;
    }
    
    function getShardAllocation(uint256 dealId, address provider) external view returns (uint256, string memory, uint256, bool) {
        return (0, "", 0, true); // Simplified for flattening
    }
}

/**
 * @title PaymentDistributor
 * @dev Handles reward distribution to providers
 */
contract PaymentDistributor is Ownable, ReentrancyGuard {
    StorageToken public immutable token;
    StorageMarketplace public immutable marketplace;
    CapacityPledge public immutable pledges;
    ProviderRegistry public immutable registry;
    
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
    }
}
