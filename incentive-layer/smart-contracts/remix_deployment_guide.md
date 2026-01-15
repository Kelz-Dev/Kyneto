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
    - Open `contracts/core/StorageMarketplace_Flattened.sol`.
    - Go to the **Solidity Compiler** tab.
    - Set the compiler version to **0.8.19**.
    - Click **Compile**.

## Method 2: Manual Copy-Paste (Flattened)
If you prefer not to use `remixd`, you can copy the contents of the flattened contract provided in the `contracts/core/StorageMarketplace_Flattened.sol` file into a new file in Remix.

## Resolving Library Errors
If you see errors like `File not found: @openzeppelin/contracts/...`, you can change the imports in Remix to use GitHub URLs:

**Change:**
```solidity
import "@openzeppelin/contracts/access/Ownable.sol";
```
**To (for Solidity 0.8.19):**
```solidity
import "@openzeppelin/contracts@4.9.0/access/Ownable.sol";
```
Remix will automatically fetch the library from NPM.
## Deployment Order & Constructor Arguments

To deploy the system correctly, you **must** follow this order and provide the addresses from previous steps:

1.  **StorageToken**
    -   **Constructor Arguments**: None.
    -   *Action*: Deploy this first and copy its address.
2.  **ProviderRegistry**
    -   **Constructor Arguments**: None.
    -   *Action*: Deploy this second and copy its address.
3.  **CapacityPledge**
    -   **Constructor Arguments**: `_token` (Address of `StorageToken`).
4.  **StorageMarketplace**
    -   **Constructor Arguments**:
        -   `_token`: Address of `StorageToken`.
        -   `_registry`: Address of `ProviderRegistry`.
        -   `_pledges`: Address of `CapacityPledge`.
        -   `_treasury`: Your wallet address (or a dedicated treasury address).
5.  **PaymentDistributor**
    -   **Constructor Arguments**:
        -   `_token`: Address of `StorageToken`.
        -   `_marketplace`: Address of `StorageMarketplace`.
        -   `_pledges`: Address of `CapacityPledge`.
        -   `_registry`: Address of `ProviderRegistry`.

## Troubleshooting Common Errors

### 1. "Gas estimation failed"
-   **Cause A: EVM Version (Most Common)**: Solidity `0.8.20` introduced the `PUSH0` opcode, which is not supported on all networks (like some older Polygon or BSC versions).
    -   **Fix**: Go to the **Solidity Compiler** tab, click **Advanced Configurations**, and change **EVM Version** from `default` to `paris` or `shanghai`. Then re-compile and deploy.
-   **Cause B: Missing Arguments**: You might have left a constructor argument blank.
    -   **Fix**: Ensure all boxes (e.g., `_token`, `_registry`, etc.) are filled with valid addresses before clicking **Deploy**.
-   **Cause C: Insufficient Funds**: Your MetaMask account needs enough native tokens (e.g., POL/MATIC) to cover the gas.

### 2. "Execution Reverted"
-   **Fix**: Check if you are passing `0x0000000000000000000000000000000000000000` as an address. Most contracts in this system will revert if a required dependency address is missing.

### 3. "Wrong Contract Selected"
-   **Fix**: The flattened file contains multiple contracts. In the **Deploy & Run Transactions** tab, ensure the **Contract** dropdown has the specific contract you want to deploy (e.g., `StorageMarketplace`) selected, NOT `Ownable` or `ERC20`.

### 4. "MetaMask Not Connecting"
-   **Fix**: Ensure Remix is set to **Injected Provider - MetaMask** in the **Environment** dropdown. Check that MetaMask is unlocked and on the correct network (e.g., Polygon Amoy).
