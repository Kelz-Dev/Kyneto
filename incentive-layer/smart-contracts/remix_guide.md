# Remix IDE Integration Guide

To compile your smart contracts in Remix IDE while keeping your local files and resolving library issues, follow these steps:

## Method 1: Using Remixd (Recommended)
This connects your local folder directly to Remix.

1.  **Install Remixd** (if not already installed):
    ```bash
    npm install -g @remix-project/remixd
    ```
2.  **Run Remixd** in your `smart-contracts` folder:
    ```bash
    remixd -s "C:\Users\DELL\Downloads\kubo-master\incentive-layer\smart-contracts" --remix-url https://remix.ethereum.org
    ```
3.  **Connect in Remix**:
    - Go to [remix.ethereum.org](https://remix.ethereum.org).
    - In the **File Explorer**, click on the **Workspaces** dropdown and select **- connect to localhost -**.
    - Click **Connect** in the popup.
4.  **Compile**:
    - Open `contracts/core/StorageMarketplace.sol`.
    - Go to the **Solidity Compiler** tab.
    - Ensure the compiler version matches (e.g., `0.8.20`).
    - Click **Compile**.

## Method 2: Manual Copy-Paste (Flattened)
If you prefer not to use `remixd`, you can copy the contents of the flattened contract provided in the `contracts/core/StorageMarketplace_Flattened.sol` file (once generated) into a new file in Remix.

## Resolving Library Errors
If you see errors like `File not found: @openzeppelin/contracts/...`, you can change the imports in Remix to use GitHub URLs:

**Change:**
```solidity
import "@openzeppelin/contracts/access/Ownable.sol";
```
**To:**
```solidity
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.0/contracts/access/Ownable.sol";
```
Remix will automatically fetch the library from GitHub.
