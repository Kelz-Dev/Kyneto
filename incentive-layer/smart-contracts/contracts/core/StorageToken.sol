// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title StorageToken
 * @dev ERC-20 token for the decentralized storage marketplace
 * Optimized for Polygon with low gas operations
 */
contract StorageToken is ERC20, Ownable {
    // Constants
    uint256 public constant INITIAL_SUPPLY = 500_000_000 * 10 ** 18; // 500 million tokens
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10 ** 18; // 1 billion max (with inflation)

    // Inflation parameters
    uint256 public annualInflationRate = 500; // 5.00% (500 basis points)
    uint256 public lastInflationTimestamp;
    uint256 public constant INFLATION_DECREASE_PER_YEAR = 50; // 0.50% decrease per year
    uint256 public constant MIN_INFLATION_RATE = 0; // Eventually becomes deflationary

    // Authorized minters (for rewards distribution)
    mapping(address => bool) public authorizedMinters;
    // Authorized burners (for slashing)
    mapping(address => bool) public authorizedBurners;

    // Global stats
    uint256 public totalTokensBurned;

    // Events
    event MinterAuthorized(address indexed minter);
    event MinterRevoked(address indexed minter);
    event BurnerAuthorized(address indexed burner);
    event BurnerRevoked(address indexed burner);
    event InflationRateUpdated(uint256 newRate);
    event TokensBurned(address indexed from, uint256 amount);

    constructor() ERC20("Kyneto", "KYN") Ownable(msg.sender) {
        _mint(msg.sender, INITIAL_SUPPLY);
        lastInflationTimestamp = block.timestamp;
    }

    /**
     * @dev Mint new tokens (inflation)
     * Can only be called by authorized minters (PaymentDistributor contract)
     */
    function mint(address to, uint256 amount) external {
        require(authorizedMinters[msg.sender], "Not authorized to mint");
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(to, amount);
    }

    /**
     * @dev Burn tokens (from slashing)
     * Can be called by anyone for their own tokens, or by authorized burners
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
        totalTokensBurned += amount;
        emit TokensBurned(msg.sender, amount);
    }

    /**
     * @dev Burn tokens from another address (for slashing)
     * Can only be called by authorized burners (SlashingManager contract).
     * NOTE: This is a PRIVILEGED burn — it does NOT check ERC20 allowance.
     * Slashing is enforced by protocol governance, not by user consent.
     */
    function burnFrom(address from, uint256 amount) external {
        require(authorizedBurners[msg.sender], "Not authorized to burn");
        _burn(from, amount);
        totalTokensBurned += amount;
        emit TokensBurned(from, amount);
    }

    /**
     * @dev Authorize a burner
     */
    function authorizeBurner(address burner) external onlyOwner {
        authorizedBurners[burner] = true;
        emit BurnerAuthorized(burner);
    }

    /**
     * @dev Revoke burner authorization
     */
    function revokeBurner(address burner) external onlyOwner {
        authorizedBurners[burner] = false;
        emit BurnerRevoked(burner);
    }

    /**
     * @dev Authorize a minter
     */
    function authorizeMinter(address minter) external onlyOwner {
        authorizedMinters[minter] = true;
        emit MinterAuthorized(minter);
    }

    /**
     * @dev Revoke minter authorization
     */
    function revokeMinter(address minter) external onlyOwner {
        authorizedMinters[minter] = false;
        emit MinterRevoked(minter);
    }

    /**
     * @dev Update inflation rate (called annually)
     */
    function updateInflationRate() external onlyOwner {
        require(
            block.timestamp >= lastInflationTimestamp + 365 days,
            "Too early"
        );

        if (annualInflationRate > MIN_INFLATION_RATE) {
            if (annualInflationRate > INFLATION_DECREASE_PER_YEAR) {
                annualInflationRate -= INFLATION_DECREASE_PER_YEAR;
            } else {
                annualInflationRate = MIN_INFLATION_RATE;
            }
            emit InflationRateUpdated(annualInflationRate);
        }

        lastInflationTimestamp = block.timestamp;
    }

    /**
     * @dev Batch transfer for gas efficiency
     * Useful for distributing rewards to multiple providers
     */
    function batchTransfer(
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external {
        require(recipients.length == amounts.length, "Arrays length mismatch");
        require(recipients.length <= 100, "Too many recipients"); // Gas limit protection

        for (uint256 i = 0; i < recipients.length; i++) {
            transfer(recipients[i], amounts[i]);
        }
    }
}
