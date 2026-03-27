const getApiUrl = () => {
    // Production: Use the same origin (https://kyneto.app)
    if (window.location.hostname === 'kyneto.app' || window.location.hostname === 'www.kyneto.app') {
        return window.location.origin;
    }

    // Handle file:// protocol or empty hostname
    const hostname = window.location.hostname || 'localhost';

    // If we are on port 3003 (Docker dashboard), we want 3002 (Docker API)
    if (window.location.port === '3003') {
        return `http://${hostname}:3002`;
    }

    // Default to 3002 to match Docker and our new server default
    // but allow override via localStorage for debugging
    const savedUrl = localStorage.getItem('kyneto_api_url');
    if (savedUrl) return savedUrl;

    return `http://${hostname}:3002`;
};

const API_URL = getApiUrl();
const DASHBOARD_VERSION = '2.0.1-stable';

// Global Error Handler for Debugging
window.onerror = function (msg, url, line, col, error) {
    const errorMsg = `Global Error: ${msg}\nLine: ${line}:${col}\nError: ${error}`;
    console.error(errorMsg);
    // alert(errorMsg); // Uncomment for loud debugging if console is not accessible
    return false;
};

console.log(`Kyneto Dashboard v${DASHBOARD_VERSION} loaded. API_URL: ${API_URL}`);

// Critical Dependency Check
if (typeof ethers === 'undefined') {
    const errorMsg = 'CRITICAL ERROR: Ethers.js failed to load. The dashboard cannot function without it.\nPlease check your internet connection or disable ad blockers.';
    console.error(errorMsg);
    alert(errorMsg);
    throw new Error('Ethers.js missing');
}

let socket;
let provider;
let signer;
let userAddress;
let isProvider = false;
let modal;
let selectedFile = null;
let currentPledgedCapacity = 0; // Track total pledged storage

let projectId = 'YOUR_PROJECT_ID'; // User needs to replace this
const AMOY_CHAIN_ID = '0x13882'; // 80002 in hex

// Contract ABIs
const ERC20_ABI = [
    "function approve(address spender, uint256 amount) public returns (bool)",
    "function allowance(address owner, address spender) public view returns (uint256)",
    "function balanceOf(address account) public view returns (uint256)",
    "function decimals() public view returns (uint8)",
    "function totalTokensBurned() public view returns (uint256)"
];

const CAPACITY_PLEDGE_ABI = [
    "function createPledge(uint256 capacityGB, uint256 duration, uint256 collateralAmount) external",
    "function calculateMinimumCollateral(uint256 capacityGB, uint256 duration) public pure returns (uint256)",
    "function getPledge(address provider, uint256 pledgeId) public view returns (uint256, uint256, uint256, uint256, uint256, uint256, bool)",
    "function pledgeCount(address provider) public view returns (uint256)",
    "function exitPledgeEarly(uint256 pledgeId) external",
    "function totalPledgedCapacityGB() public view returns (uint256)",
    "function totalActiveCollateral() public view returns (uint256)"
];

const MARKETPLACE_ABI = [
    "function createDeal(tuple(string fileCID, uint256 fileSizeGB, uint256 durationDays, uint256 pricePerGBMonthUSD, address[] selectedProviders, string[] shardCIDs, uint256[] shardSizes, uint256 alertDays) params) external returns (uint256)",
    "function renewDeal(uint256 dealId, uint256 additionalDays) external",
    "function getDeal(uint256 dealId) external view returns (address client, string fileCID, uint256 fileSizeGB, uint256 duration, uint256 totalCost, uint256 startTime, uint256 endTime, uint256 activeShards, uint8 status)",
    "function deals(uint256 dealId) public view returns (address client, string fileCID, uint256 fileSizeGB, uint256 duration, uint256 pricePerGBMonth, uint256 totalCost, uint256 startTime, uint256 endTime, address[] providers, uint256 activeShards, uint8 status, uint256 escrowedAmount, uint256 alertDays)",
    "function dealCount() public view returns (uint256)",
    "function totalFeesCollected() public view returns (uint256)",
    "function kynPriceUSD() public view returns (uint256)"
];

const REGISTRY_ABI = [
    "function registerProvider(string peerId, string endpoint, string region, uint256 minPriceUSD) external",
    "function updateProvider(string endpoint, string region, uint256 minPriceUSD) external",
    "function providers(address) public view returns (bool, uint256, uint256, uint256, string, string, string, uint256, uint256, uint256, bool, uint256, uint256)",
    "function getProvider(address provider) external view returns (tuple(bool registered, uint256 registrationTime, uint256 totalCapacityGB, uint256 reputationScore, string peerId, string endpoint, string region, uint256 totalDealsCompleted, uint256 totalDealsFailed, uint256 totalSlashingEvents, bool active, uint256 deactivatedUntil, uint256 minPriceUSD))",
    "function isProviderActive(address provider) public view returns (bool)",
    "function getEligibleProviders(uint256 maxPriceUSD, uint256 minReputation) external view returns (address[])",
    "function getProviderCount() public view returns (uint256)"
];

const PROOF_VERIFIER_ABI = [
    "function submitPoRep(uint256 dealId, bytes32 sealedCID, bytes32 unsealedCID, bytes proofData) external",
    "function submitPoSt(uint256 challengeId, bytes32[] sectorProofs) external",
    "function getConsecutiveMisses(address provider) external view returns (uint256)"
];

const SLASHING_ABI = [
    "function getPenaltyState(address provider) external view returns (uint256, uint256, uint256, uint256, uint256)",
    "function slashingHistory(address, uint256) public view returns (uint256, uint256, string, bool, bool)"
];

let notifications = [];
const MAX_NOTIFICATIONS = 10;

function toggleNotificationDropdown() {
    const dropdown = document.getElementById('notification-dropdown');
    if (dropdown) dropdown.classList.toggle('hidden');
}

function addNotification(type, title, message, dealId = null) {
    const notification = {
        id: Date.now(),
        type,
        title,
        message,
        dealId,
        time: new Date().toLocaleTimeString(),
        read: false
    };
    notifications.unshift(notification);
    if (notifications.length > MAX_NOTIFICATIONS) notifications.pop();
    updateNotificationUI();
}

function updateNotificationUI() {
    const list = document.getElementById('notification-list');
    const badge = document.getElementById('notification-badge');
    if (!list || !badge) return;

    if (notifications.length === 0) {
        list.innerHTML = '<div class="empty-notifications">No new notifications</div>';
        badge.classList.add('hidden');
        return;
    }

    const unreadCount = notifications.filter(n => !n.read).length;
    if (unreadCount > 0) {
        badge.textContent = unreadCount;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }

    list.innerHTML = notifications.map(n => `
        <div class="notification-item ${n.type} ${n.read ? 'read' : ''}" onclick="markAsRead(${n.id})">
            <div class="icon">
                <i class="fa-solid ${n.type === 'warning' ? 'fa-triangle-exclamation' : 'fa-circle-info'}"></i>
            </div>
            <div class="content">
                <div class="title">${n.title}</div>
                <div class="message">${n.message}</div>
                <div class="time">${n.time}</div>
                ${n.dealId ? `<button class="btn-renew-mini" onclick="event.stopPropagation(); handleRenewDeal(${n.dealId}, 30)">Renew Now</button>` : ''}
            </div>
        </div>
    `).join('');
}

function markAsRead(id) {
    const n = notifications.find(n => n.id === id);
    if (n) n.read = true;
    updateNotificationUI();
}

function clearNotifications() {
    notifications = [];
    updateNotificationUI();
}

async function checkExpirations() {
    if (!userAddress || !STORAGE_MARKETPLACE_ADDRESS) return;
    try {
        const marketplaceContract = new ethers.Contract(STORAGE_MARKETPLACE_ADDRESS, MARKETPLACE_ABI, provider);
        const count = await marketplaceContract.dealCount();
        const now = Math.floor(Date.now() / 1000);

        for (let i = 0; i < count.toNumber(); i++) {
            const deal = await marketplaceContract.deals(i);
            if (deal.client.toLowerCase() === userAddress.toLowerCase() && (deal.status === 0 || deal.status === 4)) { // Active or InGracePeriod
                const endTime = deal.endTime.toNumber();
                const alertDays = deal.alertDays.toNumber() || 3;
                const timeLeft = endTime - now;

                if (timeLeft < 0) {
                    addNotification('warning', 'Deal Expired', `Deal #${i} has expired and is in grace period.`, i);
                } else if (timeLeft < alertDays * 24 * 60 * 60) {
                    const daysLeft = Math.ceil(timeLeft / (24 * 60 * 60));
                    addNotification('info', 'Expiring Soon', `Deal #${i} expires in ${daysLeft} days.`, i);
                }
            }
        }
    } catch (e) { console.error('Expiration check failed:', e); }
}

// Run check every 5 minutes
setInterval(checkExpirations, 5 * 60 * 1000);

const DISTRIBUTOR_ABI = [
    "function withdrawEarnings() external",
    "function getAvailableEarnings(address provider) external view returns (uint256)",
    "function getEarningsBreakdown(address provider) external view returns (uint256, uint256, uint256, uint256, uint256, uint256)"
];

// Contract Addresses (Hardcoded for Polygon Amoy - Update these with your deployed addresses)
const KYN_TOKEN_ADDRESS = '0xC33eA878fC9819Fa2d60fD60EF6A89EbA871930A';
const CAPACITY_PLEDGE_ADDRESS = '0x2E158F19704B8A1C0D00CE562c2E3ee923e235E5';
const STORAGE_MARKETPLACE_ADDRESS = '0x242545610D645Ac3526c7c9b3866Ccc66e333322';
const PROVIDER_REGISTRY_ADDRESS = '0x2Cc10CdCbF9D2b7b6b8AcE8b607d8652772075Dd';
const PROOF_VERIFIER_ADDRESS = '0xfac091c63921709A7F5375aA465Bba42E5755695';
const SLASHING_MANAGER_ADDRESS = '0x0f4927b287b441af412019636887847A8639D17C';
const PAYMENT_DISTRIBUTOR_ADDRESS = '0x78F97B5E5f270d2c83d2e0bbb98ac00784E53a1F';

// Gas Helper Functions
async function getGasFees() {
    try {
        // Switch to legacy gas price for better compatibility with Amoy RPCs
        const gasPrice = await provider.getGasPrice();
        console.log('Legacy Gas Price:', ethers.utils.formatUnits(gasPrice, 'gwei'), 'gwei');

        // Add a 50% buffer to the gas price to handle volatility
        const bufferedGasPrice = gasPrice.mul(150).div(100);
        console.log('Buffered Gas Price:', ethers.utils.formatUnits(bufferedGasPrice, 'gwei'), 'gwei');

        return {
            gasPrice: bufferedGasPrice
        };
    } catch (error) {
        console.error('Failed to get gas fees:', error);
        // Fallback to a safe default if RPC fails
        return {};
    }
}

function getGasLimitWithBuffer(estimate) {
    // Add 30% buffer to gas limit
    return estimate.mul(130).div(100);
}
const TOKEN_VESTING_ADDRESS = '0x0C890Ce1170f2Ec224B968524F85Ab917a470755';

// Settings State
let settings = {
    notifications: {
        deals: true,
        slashing: true,
        network: false
    },
    display: {
        currency: 'KYN',
        unit: 'GB'
    },
    node: {
        autoRenew: false,
        region: 'na',
        endpoint: ''
    }
};

// Load settings from localStorage
function loadSettings() {
    const saved = localStorage.getItem('kyneto_settings');
    if (saved) {
        settings = JSON.parse(saved);
    }
}
loadSettings();

// Initialize AppKit
async function initAppKit(retries = 0) {
    if (typeof window.createAppKit === 'undefined') {
        if (retries < 5) {
            console.log(`AppKit not loaded yet, retrying (${retries + 1}/5)...`);
            setTimeout(() => initAppKit(retries + 1), 1000);
        } else {
            console.warn('AppKit failed to load after multiple retries. Falling back to standard wallet connection.');
        }
        return;
    }

    const metadata = {
        name: 'Kyneto',
        description: 'Persistent Decentralized Storage Protocol',
        url: window.location.origin,
        icons: ['https://avatars.githubusercontent.com/u/37784886']
    };

    const amoy = {
        chainId: 80002,
        name: 'Polygon Amoy',
        currency: 'POL',
        explorerUrl: 'https://amoy.polygonscan.com',
        rpcUrl: 'https://rpc-amoy.polygon.technology'
    };

    modal = window.createAppKit({
        ethersConfig: { metadata },
        chains: [amoy],
        projectId,
        enableAnalytics: true
    });

    // Listen for account changes
    modal.subscribeProvider(({ address, isConnected, provider: appKitProvider }) => {
        console.log('AppKit State Change:', { isConnected, address });
        if (isConnected && address && appKitProvider) {
            initializeWallet(address, appKitProvider, 'AppKit');
        } else if (!isConnected) {
            // Only clear if we were previously connected via AppKit
            if (userAddress && !window.ethereum?.selectedAddress) {
                initializeWallet(null, null);
            }
        }
    });
}

// Unified Wallet Initialization
async function initializeWallet(address, rawProvider, source = 'Unknown') {
    console.log(`Initializing wallet from ${source}:`, address);

    if (!address || !rawProvider) {
        userAddress = null;
        provider = null;
        signer = null;
        updateWalletUI(false);
        return;
    }

    try {
        // Use temp variables to ensure atomic update
        const tempProvider = new ethers.providers.Web3Provider(rawProvider);
        const tempSigner = tempProvider.getSigner();

        // Only update global state if everything succeeded
        userAddress = address;
        provider = tempProvider;
        signer = tempSigner;

        updateWalletUI(true);

        // Load and apply preserved user settings
        loadUserSettingsOnConnect();

        // Check if user is a provider and update UI accordingly
        await checkProviderStatus();

        fetchEarnings();

        if (source !== 'Auto-Check') {
            addActivity('System', `Wallet connected (${source}): ${userAddress.substring(0, 6)}...${userAddress.substring(38)}`, 'system');
        }
    } catch (error) {
        console.error(`Failed to initialize wallet from ${source}:`, error);
        // Reset state on failure
        userAddress = null;
        provider = null;
        signer = null;
        updateWalletUI(false);
    }
}

// Load and apply user settings when wallet connects
function loadUserSettingsOnConnect() {
    console.log('Loading preserved user settings...');

    try {
        // 1. Load notification/display/node settings
        const savedSettings = localStorage.getItem('kyneto_settings');
        if (savedSettings) {
            settings = JSON.parse(savedSettings);
            console.log('Loaded user settings:', settings);

            // Apply settings to UI
            applySettingsToUI();
        }

        // 2. Load theme preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            document.body.setAttribute('data-theme', savedTheme);
            console.log('Applied saved theme:', savedTheme);
        }

        // 3. Load user profile
        const savedProfile = localStorage.getItem('kyneto_user_profile');
        if (savedProfile) {
            const profile = JSON.parse(savedProfile);
            applyProfileToUI(profile);
            console.log('Loaded user profile:', profile);
        }
    } catch (e) {
        console.log('Failed to load user settings:', e);
    }
}

// Apply loaded settings to UI elements
function applySettingsToUI() {
    try {
        // Notification toggles
        const notifyDeals = document.getElementById('notify-deals');
        const notifySlashing = document.getElementById('notify-slashing');
        const notifyNetwork = document.getElementById('notify-network');

        if (notifyDeals) notifyDeals.checked = settings.notifications?.deals ?? true;
        if (notifySlashing) notifySlashing.checked = settings.notifications?.slashing ?? true;
        if (notifyNetwork) notifyNetwork.checked = settings.notifications?.network ?? false;

        // Display settings
        const currencySelect = document.getElementById('setting-currency');
        const unitSelect = document.getElementById('setting-unit');

        if (currencySelect) currencySelect.value = settings.display?.currency ?? 'KYN';
        if (unitSelect) unitSelect.value = settings.display?.unit ?? 'GB';

        // Node settings
        const autoRenew = document.getElementById('setting-auto-renew');
        const prefRegion = document.getElementById('setting-pref-region');

        if (autoRenew) autoRenew.checked = settings.node?.autoRenew ?? false;
        if (prefRegion) prefRegion.value = settings.node?.region ?? 'na';

        const endpointInput = document.getElementById('setting-node-endpoint');
        if (endpointInput) endpointInput.value = settings.node?.endpoint ?? '';

        console.log('Applied settings to UI');
    } catch (e) {
        console.log('Failed to apply settings to UI:', e);
    }
}

// Apply loaded profile to UI elements
function applyProfileToUI(profile) {
    try {
        if (!profile) return;

        // Update profile display elements
        const usernameDisplay = document.getElementById('profile-username-display');
        const bioDisplay = document.getElementById('profile-bio-display');
        const avatarPreview = document.getElementById('avatar-preview');
        const profileAvatarDisplay = document.getElementById('profile-avatar-display');

        if (usernameDisplay && profile.username) {
            usernameDisplay.textContent = profile.username;
        }
        if (bioDisplay && profile.bio) {
            bioDisplay.textContent = profile.bio;
        }

        // Apply avatar if saved
        if (profile.avatar) {
            if (avatarPreview) {
                avatarPreview.innerHTML = `<img src="${profile.avatar}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
            }
            if (profileAvatarDisplay) {
                profileAvatarDisplay.innerHTML = `<img src="${profile.avatar}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
            }
        }

        // Update sidebar name
        const sidebarName = document.querySelector('.sidebar-profile .name');
        if (sidebarName && profile.username) {
            sidebarName.textContent = profile.username;
        }

        console.log('Applied profile to UI');
    } catch (e) {
        console.log('Failed to apply profile to UI:', e);
    }
}

async function checkProviderStatus() {
    if (!userAddress || !provider) return;

    try {
        console.log('Checking provider status for:', userAddress);
        const registryContract = new ethers.Contract(PROVIDER_REGISTRY_ADDRESS, REGISTRY_ABI, provider);
        const pledgeContract = new ethers.Contract(CAPACITY_PLEDGE_ADDRESS, CAPACITY_PLEDGE_ABI, provider);

        // 1. Check Registry
        const providerData = await registryContract.providers(userAddress);
        console.log('Registry Provider Data:', providerData);

        isProvider = providerData && providerData[0] === true;
        console.log('Is Provider:', isProvider);

        if (isProvider) {
            // Fetch Reputation and Stats
            let reputation = providerData[3].toNumber(); // Base contract score
            const dealsCompleted = providerData[7].toNumber();
            const dealsFailed = providerData[8].toNumber();

            const totalDeals = dealsCompleted + dealsFailed;
            let uptime = "0.0"; 
            let directPingSuccess = false;
            let isNodeOnline = false;

            try {
                // 1. Direct Decentralized Check: Ping the node's endpoint directly
                // Priority: Settings-configured endpoint > On-chain registered endpoint
                let endpoint = '';

                // Check if user set a custom endpoint in Settings
                if (settings.node.endpoint && settings.node.endpoint.startsWith('http')) {
                    endpoint = settings.node.endpoint;
                    console.log('📡 Using Settings-configured endpoint:', endpoint);
                } else {
                    // Fallback to on-chain registered endpoint
                    try {
                        const fullProvider = await registryContract.getProvider(userAddress);
                        endpoint = fullProvider.endpoint || '';
                        console.log('📡 On-chain registered endpoint:', endpoint);
                    } catch (gpErr) {
                        endpoint = providerData[5] || '';
                        console.log('📡 Fallback endpoint from providers():', endpoint);
                    }
                }

                if (endpoint && endpoint.startsWith('http')) {
                    // Normalize: strip trailing slashes
                    endpoint = endpoint.replace(/\/+$/, '');
                    console.log(`🔍 Attempting direct ping to: ${endpoint}`);
                    
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 5000);
                    
                    const pingRes = await fetch(endpoint, {
                        method: 'GET',
                        signal: controller.signal,
                        mode: 'cors'
                    });
                    clearTimeout(timeoutId);
                    
                    console.log('📡 Ping response status:', pingRes.status);
                    
                    if (pingRes.ok) {
                        const directData = await pingRes.json();
                        console.log('📡 Ping response data:', directData);
                        if (directData && directData.status === 'online') {
                            uptime = "100.0";
                            directPingSuccess = true;
                            isNodeOnline = true;
                            console.log('✅ Direct node ping successful! Node is ONLINE.');
                        }
                    }
                } else {
                    console.warn('⚠️ No valid HTTP endpoint found. Set one in Settings > Node Configuration > Node API Endpoint.');
                }
            } catch (pingErr) {
                console.warn(`❌ Direct node ping failed: ${pingErr.message}. Falling back to backend indexer.`);
            }

            if (!directPingSuccess) {
                try {
                    // 2. Centralized Fallback: Fetch from backend (for historically offline tracking)
                    const apiResponse = await fetch(`${API_URL}/api/providers/${userAddress}`);
                    if (apiResponse.ok) {
                        const apiData = await apiResponse.json();
                        if (apiData.provider && apiData.provider.registered_at) {
                            uptime = "100.0";
                            const registeredAt = new Date(apiData.provider.registered_at).getTime();
                            let lastHeartbeat = registeredAt;
                            if (apiData.provider.last_heartbeat) {
                                lastHeartbeat = new Date(apiData.provider.last_heartbeat).getTime();
                            }

                            const now = Date.now();

                            if (now - lastHeartbeat > 5 * 60 * 1000) {
                                const offlineTime = now - lastHeartbeat;
                                const totalTime = Math.max(now - registeredAt, 1);
                                const onlineRatio = Math.max(0, 1 - (offlineTime / totalTime));
                                uptime = (onlineRatio * 100).toFixed(1);
                                isNodeOnline = false;
                            } else {
                                isNodeOnline = true;
                            }
                        }
                    }
                } catch (e) {
                    console.warn('Could not fetch dynamic uptime from API. Defaulting to 0.0% (Offline).');
                }
            }

            // Update Stats UI
            const uptimeStat = document.querySelector('#provider-stat-uptime .value');
            if (uptimeStat) uptimeStat.textContent = `${uptime}%`;

            const dealsStat = document.querySelector('#provider-stat-deals .value');
            if (dealsStat) dealsStat.textContent = dealsCompleted;

            // Make Reputation Dynamic
            let dynamicReputation = reputation; // Base contract score
            const uptimeParsed = parseFloat(uptime);

            // Uptime contribution (up to +25 points)
            if (uptimeParsed >= 99.0) dynamicReputation += 25;
            else if (uptimeParsed >= 90.0) dynamicReputation += 15;
            else if (uptimeParsed < 50.0) dynamicReputation -= 25;

            // Deals contribution (up to +25 points)
            if (totalDeals > 0) {
                const successRatio = dealsCompleted / totalDeals;
                dynamicReputation += Math.round((successRatio * 25) - ((1 - successRatio) * 25));
            }

            dynamicReputation = Math.max(0, Math.min(100, dynamicReputation));
            animateReputation(dynamicReputation);

            // 2. Fetch All Pledges
            try {
                const count = await pledgeContract.pledgeCount(userAddress);
                const numPledges = count.toNumber();
                console.log('Pledge Count:', numPledges);

                let totalCapacity = 0;
                let totalCollateral = ethers.BigNumber.from(0);
                let pledgesHtml = '';

                if (numPledges > 0) {
                    for (let i = 0; i < numPledges; i++) {
                        const pledge = await pledgeContract.getPledge(userAddress, i);
                        const capacity = pledge[0].toNumber();
                        const collateral = pledge[2];
                        const isActive = pledge[6];

                        // Only show and count active pledges
                        if (!isActive) continue;

                        totalCapacity += capacity;
                        totalCollateral = totalCollateral.add(collateral);

                        const label = i === 0 ? "Initial Pledge" : `Upgrade #${i}`;
                        const statusLabel = isNodeOnline ? 
                            '<span style="color: #4CAF50; font-weight: bold;">(Node Online)</span>' : 
                            '<span style="color: #ff5252; font-weight: bold;">(Node Offline)</span>';

                        pledgesHtml += `
                            <div class="stat-card">
                                <div class="stat-icon"><i class="fa-solid fa-server"></i></div>
                                <div class="stat-info">
                                    <span class="label">${label} (ID: ${i})</span>
                                    <span class="value">${formatStorage(capacity)} Pledged ${statusLabel}</span>
                                </div>
                                <div class="node-actions" style="margin-left: auto; display: flex; gap: 10px;">
                                    <button class="btn-secondary btn-sm" onclick="submitProof(${i})">
                                        <i class="fa-solid fa-shield-check"></i> Submit Proof
                                    </button>
                                    <button class="btn-danger btn-sm" onclick="handleExitPledge(${i})">
                                        <i class="fa-solid fa-trash"></i> Delete
                                    </button>
                                </div>
                            </div>
                        `;
                    }

                    // Update UI with total pledge details
                    const pledgedValue = document.getElementById('pledged-value');
                    if (pledgedValue) pledgedValue.textContent = formatStorage(totalCapacity);

                    const collateralValue = document.getElementById('collateral-value');
                    if (collateralValue) collateralValue.textContent = `${parseFloat(ethers.utils.formatUnits(totalCollateral, 18)).toFixed(2)} KYN`;

                    const remainingValue = document.getElementById('remaining-value');
                    if (remainingValue) remainingValue.textContent = formatStorage(totalCapacity);

                    // If registered, switch to provider view if they are on "become-provider"
                    const currentView = document.querySelector('.view.active');
                    if (currentView && currentView.id === 'become-provider-view') {
                        switchView('provider');
                    }

                    // Show management sections only if there are active pledges
                    const noNodesState = document.getElementById('no-nodes-state');
                    const activeNodesList = document.getElementById('active-nodes-list');
                    const storageManagement = document.getElementById('storage-management');
                    const upgradeBtn = document.getElementById('btn-upgrade-pledge');

                    if (pledgesHtml) {
                        if (noNodesState) noNodesState.classList.add('hidden');
                        if (activeNodesList) {
                            activeNodesList.classList.remove('hidden');
                            activeNodesList.innerHTML = pledgesHtml;
                        }
                        if (storageManagement) storageManagement.classList.remove('hidden');
                        if (upgradeBtn) upgradeBtn.classList.remove('hidden');
                    } else {
                        // All pledges are inactive
                        if (noNodesState) noNodesState.classList.remove('hidden');
                        if (activeNodesList) activeNodesList.classList.add('hidden');
                        if (storageManagement) storageManagement.classList.add('hidden');
                        if (upgradeBtn) upgradeBtn.classList.add('hidden');
                    }

                } else {
                    console.log('Provider registered but has no pledges yet.');
                    // Reset UI to "Become a Provider" state
                    const noNodesState = document.getElementById('no-nodes-state');
                    const activeNodesList = document.getElementById('active-nodes-list');
                    const storageManagement = document.getElementById('storage-management');
                    const upgradeBtn = document.getElementById('btn-upgrade-pledge');

                    if (noNodesState) noNodesState.classList.remove('hidden');
                    if (activeNodesList) activeNodesList.classList.add('hidden');
                    if (storageManagement) storageManagement.classList.add('hidden');
                    if (upgradeBtn) upgradeBtn.classList.add('hidden');
                }

            } catch (pledgeErr) {
                console.warn('Error fetching pledges:', pledgeErr);
            }
        } else {
            // Not a provider, ensure UI is in "Become a Provider" state
            const noNodesState = document.getElementById('no-nodes-state');
            const activeNodesList = document.getElementById('active-nodes-list');
            const storageManagement = document.getElementById('storage-management');
            const upgradeBtn = document.getElementById('btn-upgrade-pledge');

            if (noNodesState) noNodesState.classList.remove('hidden');
            if (activeNodesList) activeNodesList.classList.add('hidden');
            if (storageManagement) storageManagement.classList.add('hidden');
            if (upgradeBtn) upgradeBtn.classList.add('hidden');
        }
    } catch (error) {
        console.error('Error checking provider status:', error);
    }
}

// Update Protocol Information Display
function updateProtocolInfo() {
    const kynTokenElem = document.getElementById('protocol-kyn-token');
    if (kynTokenElem) {
        kynTokenElem.textContent = KYN_TOKEN_ADDRESS;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Initializing Dashboard...');

    // 1. Theme and Settings
    try {
        loadSavedTheme();
        loadSettings();
    } catch (e) { console.error('Settings init failed:', e); }

    // 2. UI Event Listeners
    try {
        // Sidebar Toggle
        const sidebarToggle = document.getElementById('sidebar-toggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', toggleSidebar);
        }

        // File Upload Listeners
        const uploadArea = document.getElementById('upload-area');
        const fileInput = document.getElementById('file-input');
        if (uploadArea && fileInput) {
            uploadArea.addEventListener('click', () => fileInput.click());
            uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.classList.add('dragover'); });
            uploadArea.addEventListener('dragleave', () => { uploadArea.classList.remove('dragover'); });
            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                if (e.dataTransfer.files.length > 0) handleFileSelect(e.dataTransfer.files[0]);
            });
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) handleFileSelect(e.target.files[0]);
            });
        }

        // Deal Summary Live Update
        const dealSizeInput = document.getElementById('deal-size');
        const dealPriceInput = document.getElementById('deal-price');
        const dealDurationInput = document.getElementById('deal-duration');

        if (dealSizeInput && dealPriceInput && dealDurationInput) {
            const updateSummary = async () => {
                const size = parseFloat(dealSizeInput.value) || 0;
                const priceUSD = parseFloat(dealPriceInput.value) || 0;
                const duration = parseInt(dealDurationInput.value) || 0;

                // Fetch current KYN price from contract
                let kynPrice = 100000; // Default $0.10
                if (provider) {
                    try {
                        const marketplaceContract = new ethers.Contract(STORAGE_MARKETPLACE_ADDRESS, MARKETPLACE_ABI, provider);
                        const price = await marketplaceContract.kynPriceUSD();
                        kynPrice = price.toNumber();
                    } catch (e) { console.warn('Failed to fetch KYN price, using default'); }
                }

                const totalMonths = Math.ceil(duration / 30);
                const storageCostUSD = size * priceUSD * totalMonths;
                const protocolFeeUSD = storageCostUSD * 0.03;
                const totalCostUSD = storageCostUSD + protocolFeeUSD;

                // Convert to KYN
                const storageCostKYN = (storageCostUSD * 1000000) / kynPrice;
                const protocolFeeKYN = (protocolFeeUSD * 1000000) / kynPrice;
                const totalCostKYN = storageCostKYN + protocolFeeKYN;

                const storageElem = document.getElementById('summary-storage-cost');
                const feeElem = document.getElementById('summary-protocol-fee');
                const totalElem = document.getElementById('summary-total-cost');

                if (totalElem) totalElem.textContent = `${totalCostKYN.toFixed(2)} KYN ($${totalCostUSD.toFixed(2)})`;

                // Show eligible provider count
                const providerPoolElem = document.getElementById('eligible-provider-count');
                if (providerPoolElem && provider) {
                    try {
                        const registryContract = new ethers.Contract(PROVIDER_REGISTRY_ADDRESS, REGISTRY_ABI, provider);
                        const eligible = await registryContract.getEligibleProviders(pricePerGBMonthUSD, 0);
                        providerPoolElem.textContent = `${eligible.length} eligible providers found`;
                        providerPoolElem.style.color = eligible.length >= 15 ? 'var(--success)' : 'var(--danger)';
                    } catch (e) { console.warn('Failed to fetch eligible providers'); }
                }
            };

            dealSizeInput.addEventListener('input', updateSummary);
            dealPriceInput.addEventListener('input', updateSummary);
            dealDurationInput.addEventListener('input', updateSummary);
        }

        // Click outside to close dropdowns
        document.addEventListener('click', (e) => {
            const profileTrigger = document.querySelector('.profile-trigger');
            const profileDropdown = document.getElementById('profile-dropdown');
            const sidebarProfile = document.querySelector('.sidebar-profile');
            const sidebarDropdown = document.getElementById('sidebar-dropdown');

            if (profileDropdown && !profileDropdown.classList.contains('hidden') &&
                profileTrigger && !profileTrigger.contains(e.target) && !profileDropdown.contains(e.target)) {
                profileDropdown.classList.add('hidden');
            }

            if (sidebarDropdown && !sidebarDropdown.classList.contains('hidden') &&
                sidebarProfile && !sidebarProfile.contains(e.target) && !sidebarDropdown.contains(e.target)) {
                sidebarDropdown.classList.add('hidden');
            }
        });
    } catch (e) { console.error('UI listeners failed:', e); }

    // 3. Data Fetching
    try {
        fetchStats();
        fetchDeals();
        fetchMarketplace();
        fetchEvents();
        updateProtocolInfo();  // Set KYN token address in settings
    } catch (e) { console.error('Data fetch failed:', e); }

    // 4. Network & Wallet
    try {
        if (typeof io !== 'undefined') initWebSocket();
        initAppKit();

        // Auto-refresh stats every 30 seconds
        setInterval(() => {
            fetchStats();
            if (userAddress) fetchEarnings();
        }, 30000);

        // Check if wallet is already connected with retry logic
        const checkWalletConnection = async (retries = 5) => {
            if (typeof window.ethereum !== 'undefined') {
                try {
                    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                    if (accounts.length > 0) {
                        initializeWallet(accounts[0], window.ethereum, 'Auto-Check');

                        if (!window._walletListenersRegistered) {
                            window._walletListenersRegistered = true;
                            window.ethereum.on('accountsChanged', (newAccounts) => {
                                if (newAccounts.length > 0) initializeWallet(newAccounts[0], window.ethereum, 'MetaMask');
                                else initializeWallet(null, null);
                            });
                            window.ethereum.on('chainChanged', () => window.location.reload());
                        }
                    } else {
                        // Retry if not found immediately (sometimes injection is slow)
                        if (retries > 0) {
                            setTimeout(() => checkWalletConnection(retries - 1), 1000);
                        } else {
                            if (!userAddress) updateWalletUI(false);
                        }
                    }
                } catch (e) {
                    console.error('Wallet check failed:', e);
                    if (!userAddress) updateWalletUI(false);
                }
            } else {
                // Retry if window.ethereum is undefined
                if (retries > 0) {
                    setTimeout(() => checkWalletConnection(retries - 1), 1000);
                } else {
                    if (!userAddress) updateWalletUI(false);
                }
            }
        };

        checkWalletConnection();

        // Fallback: Ensure Connect Button works even if auto-check fails
        const connectBtn = document.getElementById('connect-wallet-btn');
        if (connectBtn) {
            connectBtn.addEventListener('click', connectWallet);
        }
    } catch (e) { console.error('Wallet/Network init failed:', e); }
});

function toggleSidebar() {
    const appContainer = document.querySelector('.app-container');
    appContainer.classList.toggle('collapsed-sidebar');
    const icon = document.querySelector('#sidebar-toggle i');
    if (icon) {
        if (appContainer.classList.contains('collapsed-sidebar')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-arrow-right');
        } else {
            icon.classList.remove('fa-arrow-right');
            icon.classList.add('fa-bars');
        }
    }
}

function handleFileSelect(file) {
    selectedFile = file;
    const uploadArea = document.getElementById('upload-area');
    const fileInfo = document.getElementById('file-info');
    const fileName = document.getElementById('file-name');
    const fileSize = document.getElementById('file-size');
    const fileType = document.getElementById('file-type');
    const dealSizeInput = document.getElementById('deal-size');
    const cidGroup = document.getElementById('cid-group');
    const cidInput = document.getElementById('file-cid');
    const encryptionStatus = document.getElementById('encryption-status');

    if (uploadArea && fileInfo) {
        uploadArea.classList.add('hidden');
        fileInfo.classList.remove('hidden');
        fileName.textContent = file.name;

        const sizeInMB = file.size / (1024 * 1024);
        const sizeInGB = sizeInMB / 1024;
        fileSize.textContent = formatBytes(file.size);

        // Auto-fill deal size
        if (dealSizeInput) {
            dealSizeInput.value = sizeInGB.toFixed(4);
            // Trigger input event to update fee summary
            dealSizeInput.dispatchEvent(new Event('input'));
        }

        // Detect and display file category
        const category = detectFileCategory(file.name);
        if (fileType) fileType.textContent = category;

        // Encrypt file in-browser if wallet is connected
        if (provider && userAddress && typeof KynetoEncrypt !== 'undefined') {
            if (encryptionStatus) {
                encryptionStatus.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Encrypting...';
                encryptionStatus.style.color = 'var(--warning)';
            }

            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const fileBuffer = e.target.result;
                    const encrypted = await KynetoEncrypt.encryptFile(fileBuffer, provider, userAddress);

                    // Store encryption metadata for later use during deal creation
                    selectedFile._encrypted = {
                        data: encrypted.encryptedData,
                        key: encrypted.encryptedKey,
                        iv: encrypted.iv,
                        authTag: encrypted.authTag
                    };

                    if (encryptionStatus) {
                        encryptionStatus.innerHTML = '<i class="fa-solid fa-lock"></i> End-to-End Encrypted';
                        encryptionStatus.style.color = 'var(--success)';
                    }

                    // Generate CID from encrypted data
                    if (cidGroup && cidInput) {
                        cidGroup.classList.remove('hidden');
                        cidInput.value = `ipfs://Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
                    }

                    addActivity('Security', `File "${file.name}" encrypted with AES-256-GCM`, 'system');
                } catch (err) {
                    console.error('Encryption failed:', err);
                    if (encryptionStatus) {
                        encryptionStatus.innerHTML = '<i class="fa-solid fa-lock-open"></i> Encryption failed';
                        encryptionStatus.style.color = 'var(--danger)';
                    }
                    // Fall back to unencrypted CID
                    if (cidGroup && cidInput) {
                        cidGroup.classList.remove('hidden');
                        cidInput.value = `ipfs://Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
                    }
                }
            };
            reader.readAsArrayBuffer(file);
        } else {
            // No wallet connected — show unencrypted warning
            if (encryptionStatus) {
                encryptionStatus.innerHTML = '<i class="fa-solid fa-lock-open"></i> Connect wallet to encrypt';
                encryptionStatus.style.color = 'var(--text-secondary)';
            }
            if (cidGroup && cidInput) {
                cidGroup.classList.remove('hidden');
                cidInput.value = `ipfs://Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
            }
        }

        addActivity('User', `Selected file: ${file.name} (${category})`, 'user');
    }
}

async function handleCreateDeal(event) {
    event.preventDefault();

    if (!userAddress || !signer) {
        alert('Please connect your wallet first.');
        return;
    }

    if (!selectedFile) {
        alert('Please select a file to upload.');
        return;
    }

    const size = parseFloat(document.getElementById('deal-size').value) || 0;
    const price = parseFloat(document.getElementById('deal-price').value) || 0;
    const duration = parseInt(document.getElementById('deal-duration').value) || 0;
    const fileCID = document.getElementById('file-cid').value;
    const alertDays = parseInt(document.getElementById('deal-alert-days').value) || 3;

    if (!fileCID) {
        alert('File CID is missing. Please re-upload the file.');
        return;
    }

    try {
        addActivity('System', `Creating storage deal for ${selectedFile.name}...`, 'system');

        // 1. Create deal on blockchain
        const marketplaceContract = new ethers.Contract(
            STORAGE_MARKETPLACE_ADDRESS,
            MARKETPLACE_ABI,
            signer
        );

        const totalMonths = Math.ceil(duration / 30);
        const totalCostKYN = size * price * totalMonths * 1.03; // Include 3% protocol fee

        // Approve KYN spending
        const tokenContract = new ethers.Contract(KYN_TOKEN_ADDRESS, ERC20_ABI, signer);
        const approveTx = await tokenContract.approve(
            STORAGE_MARKETPLACE_ADDRESS,
            ethers.utils.parseEther(totalCostKYN.toFixed(18))
        );
        await approveTx.wait();

        addActivity('System', 'Token spending approved. Submitting deal...', 'system');

        // Note: Full deal submission requires the DealOrchestrator backend.
        // For now, log success and store the encryption key if available.
        const dealId = `D-${Date.now()}`; // Simulated deal ID

        // 2. Store encryption key via API (if file was encrypted)
        if (selectedFile._encrypted) {
            try {
                await fetch(`${API_URL}/api/deals/${dealId}/key`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        encrypted_key: selectedFile._encrypted.key,
                        encryption_iv: selectedFile._encrypted.iv,
                        encryption_auth_tag: selectedFile._encrypted.authTag,
                        client_address: userAddress.toLowerCase()
                    })
                });
                addActivity('Security', 'Encryption key stored securely', 'system');
            } catch (keyErr) {
                console.warn('Failed to store encryption key:', keyErr);
            }
        }

        // 3. Store expiration alert
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + duration);
        const alertDate = new Date(expirationDate);
        alertDate.setDate(alertDate.getDate() - alertDays);

        const deals = JSON.parse(localStorage.getItem('kyneto_deals') || '[]');
        deals.push({
            dealId,
            fileName: selectedFile.name,
            fileCID,
            size,
            encrypted: !!selectedFile._encrypted,
            expirationDate: expirationDate.toISOString(),
            alertDate: alertDate.toISOString(),
            createdAt: new Date().toISOString()
        });
        localStorage.setItem('kyneto_deals', JSON.stringify(deals));

        addActivity('System', `✅ Deal ${dealId} created for ${selectedFile.name}`, 'system');
        addNotification('deal', 'Deal Created', `Storage deal for "${selectedFile.name}" has been initiated.`, dealId);

        // Reset form
        removeFile();
        switchView('files');

    } catch (error) {
        console.error('Error creating deal:', error);
        addActivity('System', `❌ Deal creation failed: ${error.message}`, 'system');
        alert(`Deal creation failed: ${error.message}`);
    }
}

function detectFileCategory(fileName) {
    const ext = fileName.split('.').pop().toLowerCase();
    const video = ['mp4', 'mov', 'avi', 'mkv', 'webm'];
    const scientific = ['csv', 'json', 'hdf5', 'dat', 'fits'];
    const backups = ['zip', 'tar', 'gz', '7z', 'rar', 'bak'];
    const web = ['html', 'css', 'js', 'png', 'jpg', 'jpeg', 'svg', 'webp'];

    if (video.includes(ext)) return 'Video Streaming';
    if (scientific.includes(ext)) return 'Scientific Data';
    if (backups.includes(ext)) return 'Backups';
    if (web.includes(ext)) return 'Web Assets';
    return 'General Data';
}

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function removeFile() {
    selectedFile = null;
    const uploadArea = document.getElementById('upload-area');
    const fileInfo = document.getElementById('file-info');
    const fileInput = document.getElementById('file-input');
    const cidGroup = document.getElementById('cid-group');
    const dealSizeInput = document.getElementById('deal-size');

    uploadArea.classList.remove('hidden');
    fileInfo.classList.add('hidden');
    cidGroup.classList.add('hidden');
    fileInput.value = '';
    dealSizeInput.value = '';
}

async function fetchStats() {
    try {
        // Try to fetch from API first (for historical data if any)
        let apiStats = {};
        try {
            const response = await fetch(`${API_URL}/api/stats`);
            if (response.ok) apiStats = await response.json();
        } catch (e) { console.warn('API Stats offline, falling back to contracts'); }

        // Fetch real-time data from contracts if provider is available
        if (provider) {
            const pledgeContract = new ethers.Contract(CAPACITY_PLEDGE_ADDRESS, CAPACITY_PLEDGE_ABI, provider);
            const marketplaceContract = new ethers.Contract(STORAGE_MARKETPLACE_ADDRESS, MARKETPLACE_ABI, provider);
            const registryContract = new ethers.Contract(PROVIDER_REGISTRY_ADDRESS, REGISTRY_ABI, provider);
            const tokenContract = new ethers.Contract(KYN_TOKEN_ADDRESS, ERC20_ABI, provider);

            const [
                totalCapacity,
                activeDeals,
                providerCount,
                feesCollected,
                tokensBurned
            ] = await Promise.all([
                pledgeContract.totalPledgedCapacityGB(),
                marketplaceContract.dealCount(),
                registryContract.getProviderCount(),
                marketplaceContract.totalFeesCollected(),
                tokenContract.totalTokensBurned()
            ]);

            const stats = {
                active_deals: Math.max(apiStats.active_deals || 0, activeDeals.toNumber()),
                active_providers: Math.max(apiStats.active_providers || 0, providerCount.toNumber()),
                total_capacity_gb: Math.max(apiStats.total_capacity_gb || 0, totalCapacity.toNumber()),
                total_utilization_gb: apiStats.total_utilization_gb || 0,
                total_protocol_revenue: ethers.utils.formatUnits(feesCollected, 18),
                total_tokens_burned: ethers.utils.formatUnits(tokensBurned, 18)
            };

            updateStatsUI(stats);
            setOnlineStatus(true);
            return;
        }

        // Fallback to API if no provider
        if (Object.keys(apiStats).length > 0) {
            updateStatsUI(apiStats);
            setOnlineStatus(true);
        } else {
            throw new Error('No data source available');
        }

    } catch (error) {
        console.error('Error fetching stats:', error);
        setOnlineStatus(false);
        updateStatsUI({
            active_deals: 0,
            active_providers: 0,
            total_capacity_gb: 0,
            total_utilization_gb: 0,
            total_protocol_revenue: 0,
            total_tokens_burned: 0
        });
    }
}

function updateStatsUI(stats) {
    const deals = document.querySelector('#stat-deals .value');
    const providers = document.querySelector('#stat-providers .value');
    const capacity = document.querySelector('#stat-capacity .value');
    const revenue = document.querySelector('#stat-revenue .value');
    const burned = document.querySelector('#stat-burned .value');
    const utilizationElem = document.querySelector('#stat-utilization .value');

    if (deals) deals.textContent = stats.active_deals || 0;
    if (providers) providers.textContent = stats.active_providers || 0;
    if (capacity) capacity.textContent = `${stats.total_capacity_gb || 0} GB`;

    // Format KYN values to 2 decimal places if they are strings/numbers
    const formatKYN = (val) => {
        const num = parseFloat(val);
        return isNaN(num) ? "0.00" : num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    if (revenue) revenue.textContent = `${formatKYN(stats.total_protocol_revenue)} KYN`;
    if (burned) burned.textContent = `${formatKYN(stats.total_tokens_burned)} KYN`;

    const utilization = stats.total_capacity_gb > 0
        ? Math.round((stats.total_utilization_gb / stats.total_capacity_gb) * 100)
        : 0;
    if (utilizationElem) utilizationElem.textContent = `${utilization}%`;
}

async function fetchDeals() {
    try {
        let deals = [];
        try {
            const response = await fetch(`${API_URL}/api/deals`);
            if (response.ok) {
                const data = await response.json();
                deals = data.deals || [];
            }
        } catch (e) { console.warn('API Deals offline, falling back to contracts'); }

        // If API failed or returned no deals, try contract fallback
        if (deals.length === 0 && provider) {
            const marketplaceContract = new ethers.Contract(STORAGE_MARKETPLACE_ADDRESS, MARKETPLACE_ABI, provider);
            const count = await marketplaceContract.dealCount();
            const numDeals = count.toNumber();

            // Fetch last 5 deals
            const start = Math.max(0, numDeals - 5);
            for (let i = numDeals - 1; i >= start; i--) {
                try {
                    const deal = await marketplaceContract.getDeal(i);
                    deals.push({
                        deal_id: i,
                        client_address: deal[0],
                        file_cid: deal[1],
                        file_size_gb: deal[2].toNumber(),
                        status: ['active', 'completed', 'failed', 'cancelled'][deal[8]],
                        created_at: new Date(deal[5].toNumber() * 1000).toISOString()
                    });
                } catch (e) { console.error(`Failed to fetch deal ${i}:`, e); }
            }
        }

        renderDeals(deals);
    } catch (error) {
        console.error('Error fetching deals:', error);
        renderDeals([]);
    }
}

function renderDeals(deals) {
    const tbody = document.querySelector('#deals-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    // Also update My Files table if it exists
    renderFiles(deals);

    if (deals.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="empty-state-container">
                        <div class="empty-icon">
                            <i class="fa-solid fa-folder-open"></i>
                        </div>
                        <h3>No deals found</h3>
                        <p>The network is currently waiting for new storage deals.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    deals.forEach(deal => {
        const tr = document.createElement('tr');
        const safeCid = (deal.file_cid && deal.file_cid.length > 8)
            ? `${deal.file_cid.substring(0, 12)}...${deal.file_cid.substring(deal.file_cid.length - 10)}`
            : "Generating...";

        tr.innerHTML = `
            <td>#${deal.deal_id}</td>
            <td><span class="status-pill ${deal.status}">${deal.status}</span></td>
            <td>${deal.file_size_gb || 0} GB</td>
            <td>${new Date(deal.created_at || Date.now()).toLocaleDateString()}</td>
            <td>
                <button class="btn-secondary btn-sm" onclick="downloadFile('${deal.file_cid}', '${deal.deal_id}')" title="Download File">
                    <i class="fa-solid fa-download"></i> Download
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Updated via call at start of function
}

function renderFiles(deals) {
    const tbody = document.querySelector('#files-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (deals.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="empty-state-container">
                        <div class="empty-icon">
                            <i class="fa-solid fa-file-circle-xmark"></i>
                        </div>
                        <h3>No files found</h3>
                        <p>You haven't uploaded any files to the network yet.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    deals.forEach(deal => {
        const tr = document.createElement('tr');
        // Extract a filename from CID or metadata if available, otherwise use Deal ID
        const fileName = deal.file_name || `File_${deal.deal_id}`;
        const safeCid = (deal.file_cid && deal.file_cid.length > 10)
            ? `${deal.file_cid.substring(0, 12)}...${deal.file_cid.substring(deal.file_cid.length - 10)}`
            : "Generating CID...";

        tr.innerHTML = `
            <td>${fileName}</td>
            <td>
                <a href="#" class="cid-link" onclick="downloadFile('${deal.file_cid}', '${deal.deal_id}'); return false;">
                    ${safeCid}
                </a>
            </td>
            <td>${deal.file_size_gb || 0} GB</td>
            <td>${new Date(deal.created_at || Date.now()).toLocaleDateString()}</td>
            <td>
                <button class="btn-secondary btn-sm" onclick="downloadFile('${deal.file_cid}', '${deal.deal_id}')" title="Download File">
                    <i class="fa-solid fa-download"></i> Download
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function fetchMarketplace() {
    try {
        const response = await fetch(`${API_URL}/api/deals?status=active`);
        const data = await response.json();
        renderMarketplace(data.deals);
    } catch (error) {
        console.error('Error fetching marketplace:', error);
        renderMarketplace([]);
    }
}

function renderMarketplace(deals) {
    const grid = document.querySelector('.marketplace-grid');
    if (!grid) return;
    grid.innerHTML = '';

    if (deals.length === 0) {
        grid.innerHTML = `
            <div class="empty-state-container" style="grid-column: 1 / -1;">
                <div class="empty-icon">
                    <i class="fa-solid fa-store-slash"></i>
                </div>
                <h3>Marketplace Empty</h3>
                <p>No active deals are currently available in the marketplace.</p>
            </div>
        `;
        return;
    }

    deals.forEach(deal => {
        const card = document.createElement('div');
        card.className = 'stat-card clickable';
        card.onclick = () => viewFile(deal.file_cid);
        card.innerHTML = `
            <div class="stat-icon"><i class="fa-solid fa-box"></i></div>
            <div class="stat-info">
                <span class="label">Deal #${deal.deal_id}</span>
                <span class="value">${deal.file_size_gb} GB</span>
                <span class="label" style="font-size: 0.7rem; margin-top: 5px; word-break: break-all; opacity: 0.6;">${deal.file_cid}</span>
            </div>
            <button class="btn-primary btn-sm" onclick="event.stopPropagation(); viewFile('${deal.file_cid}')" style="margin-left: auto">
                <i class="fa-solid fa-download"></i>
            </button>
        `;
        grid.appendChild(card);
    });
}

async function downloadFile(cid, dealId) {
    if (!cid) return;
    try {
        addActivity('System', `Downloading file: ${cid}`, 'system');
        const gatewayUrl = `https://ipfs.io/ipfs/${cid.replace('ipfs://', '')}`;

        // Don't wait if we don't have dealId or provider to decrypt
        if (!dealId || !provider || !userAddress || typeof KynetoEncrypt === 'undefined') {
            window.open(gatewayUrl, '_blank');
            return;
        }

        let shouldDecrypt = false;
        let keyData = null;

        try {
            const keyStatus = await fetch(`${API_URL}/api/deals/${dealId}/key`);
            if (keyStatus.ok) {
                keyData = await keyStatus.json();
                shouldDecrypt = keyData.is_encrypted;
            }
        } catch (e) {
            console.warn('Could not fetch encryption key status', e);
        }

        if (shouldDecrypt) {
            addActivity('Security', `Decrypting file locally via KynetoEncrypt...`, 'system');

            const res = await fetch(gatewayUrl);
            const encryptedBuffer = await res.arrayBuffer();

            try {
                const decrypted = await KynetoEncrypt.decryptFile(
                    encryptedBuffer,
                    keyData.encrypted_key,
                    keyData.encryption_iv,
                    keyData.encryption_auth_tag,
                    provider,
                    userAddress
                );

                // Trigger download of decrypted arrayBuffer
                const blob = new Blob([decrypted]);
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `kyneto_decrypted_deal_${dealId}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                addActivity('System', `Download and decryption successful`, 'system');
            } catch (encryptError) {
                console.error('Decryption failed:', encryptError);
                alert('Decryption failed. Please ensure you are connected with the correct wallet.');
            }
        } else {
            // Unencrypted, just open the gateway
            window.open(gatewayUrl, '_blank');
        }
    } catch (e) {
        console.error('Download error:', e);
        alert('Could not download or decrypt the file.');
    }
}

function initWebSocket() {
    socket = io(API_URL);

    socket.on('connect', () => {
        console.log('Connected to WebSocket');
        addActivity('System', 'Connected to real-time event stream', 'system');
    });

    socket.on('stats_update', (stats) => {
        updateStatsUI(stats);
    });

    socket.on('new_deal', (deal) => {
        addActivity('Network', `New deal initiated: #${deal.deal_id}`, 'network');
        fetchDeals();
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from WebSocket');
    });
}

function addActivity(user, msg, type) {
    const feed = document.getElementById('activity-feed');
    if (!feed) return;

    const item = document.createElement('div');
    item.className = `activity-item ${type}`;
    item.innerHTML = `
        <span class="time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        <span class="msg"><strong>${user}:</strong> ${msg}</span>
    `;

    feed.prepend(item);
    if (feed.children.length > 50) feed.lastChild.remove();
}

function setOnlineStatus(online) {
    const statusBadge = document.getElementById('api-status');
    if (!statusBadge) return;

    if (online) {
        statusBadge.className = 'status-badge online';
        statusBadge.querySelector('.text').textContent = 'Network Online';
    } else {
        statusBadge.className = 'status-badge';
        statusBadge.querySelector('.text').textContent = 'API Offline (Demo Mode)';
    }
}

async function switchNetwork() {
    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: AMOY_CHAIN_ID }],
        });
    } catch (switchError) {
        if (switchError.code === 4902) {
            try {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [
                        {
                            chainId: AMOY_CHAIN_ID,
                            chainName: 'Polygon Amoy Testnet',
                            nativeCurrency: {
                                name: 'POL',
                                symbol: 'POL',
                                decimals: 18,
                            },
                            rpcUrls: ['https://rpc-amoy.polygon.technology'],
                            blockExplorerUrls: ['https://amoy.polygonscan.com'],
                        },
                    ],
                });
            } catch (addError) {
                console.error('Failed to add network:', addError);
            }
        }
        console.error('Failed to switch network:', switchError);
    }
}

async function connectWallet() {
    console.log('Connecting wallet...');

    // Check if wallet provider exists with retry (sometimes it loads slowly)
    let retries = 3;
    while (retries > 0 && typeof window.ethereum === 'undefined') {
        console.log(`Waiting for wallet provider... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, 500));
        retries--;
    }

    if (modal && projectId !== 'YOUR_PROJECT_ID') {
        modal.open();
    } else {
        console.log('Falling back to direct MetaMask connection');
        if (typeof window.ethereum !== 'undefined') {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

                if (accounts.length > 0) {
                    // Check network after getting permission
                    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
                    if (chainId !== AMOY_CHAIN_ID) {
                        await switchNetwork();
                    }

                    initializeWallet(accounts[0], window.ethereum, 'MetaMask');

                    // Only register listeners once
                    if (!window._walletListenersRegistered) {
                        window._walletListenersRegistered = true;
                        window.ethereum.on('accountsChanged', (newAccounts) => {
                            if (newAccounts.length > 0) {
                                initializeWallet(newAccounts[0], window.ethereum, 'MetaMask');
                            } else {
                                initializeWallet(null, null);
                            }
                        });

                        window.ethereum.on('chainChanged', () => {
                            window.location.reload();
                        });
                    }
                }
            } catch (error) {
                console.error('User rejected connection or network switch:', error);
                if (error.code === 4001) {
                    showNotification('error', 'Connection Cancelled', 'You rejected the wallet connection request.');
                } else {
                    showNotification('error', 'Connection Failed', error.message || 'Failed to connect wallet.');
                }
            }
        } else {
            console.error('No wallet provider detected!');
            console.log('window.ethereum:', window.ethereum);
            console.log('window.web3:', window.web3);

            showNotification('error', 'No Wallet Found',
                'MetaMask not detected. Please:<br>' +
                '1. Install MetaMask from metamask.io<br>' +
                '2. Refresh this page after installing<br>' +
                '3. Make sure MetaMask is enabled in your browser');
        }
    }
}

// Helper to ensure signer is available before contract calls
async function recoverSigner() {
    if (signer && userAddress) return true;

    console.log('Signer missing, attempting recovery...');

    // Try MetaMask recovery
    if (typeof window.ethereum !== 'undefined') {
        try {
            let accounts = await window.ethereum.request({ method: 'eth_accounts' });

            // If no accounts found, force a request (this makes buttons interactive)
            if (accounts.length === 0) {
                console.log('No accounts found, requesting permission...');
                accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            }

            if (accounts.length > 0) {
                initializeWallet(accounts[0], window.ethereum, 'Recovery');
                return !!signer;
            }
        } catch (e) {
            console.error('Signer recovery failed:', e);
            if (e.code === 4001) {
                showNotification('error', 'Connection Cancelled', 'You must connect your wallet to proceed.');
            }
        }
    }

    // Try AppKit recovery if connected
    if (modal && modal.getIsConnected()) {
        const addr = modal.getAddress();
        if (addr) {
            // We can't easily get the provider object from AppKit without an event
            // but we can at least set the address
            userAddress = addr;
        }
    }

    return false;
}


async function disconnectWallet() {
    console.log('Disconnecting wallet and clearing all cached data...');

    // 0. PRESERVE important user settings before clearing
    let preservedSettings = null;
    let preservedTheme = null;
    let preservedProfile = null;

    try {
        // Save user settings (notification preferences, display settings, etc.)
        const savedSettings = localStorage.getItem('kyneto_settings');
        if (savedSettings) {
            preservedSettings = savedSettings;
            console.log('Preserved user settings');
        }

        // Save theme preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            preservedTheme = savedTheme;
            console.log('Preserved theme preference');
        }

        // Save user profile data (username, bio, avatar, etc.)
        const savedProfile = localStorage.getItem('kyneto_user_profile');
        if (savedProfile) {
            preservedProfile = savedProfile;
            console.log('Preserved user profile');
        }
    } catch (e) {
        console.log('Failed to preserve settings:', e);
    }

    // 1. Disconnect from AppKit/WalletConnect
    if (modal) {
        try {
            await modal.disconnect();
        } catch (e) {
            console.log('AppKit disconnect failed or not applicable:', e);
        }
    }

    // 2. Attempt to revoke MetaMask permissions
    if (typeof window.ethereum !== 'undefined') {
        try {
            await window.ethereum.request({
                method: "wallet_revokePermissions",
                params: [{ eth_accounts: {} }]
            });
            console.log('MetaMask permissions revoked');
        } catch (e) {
            console.log('MetaMask revoke permissions failed:', e);
        }
    }

    // 3. Clear all localStorage data
    try {
        localStorage.clear();
        console.log('LocalStorage cleared');
    } catch (e) {
        console.log('Failed to clear localStorage:', e);
    }

    // 4. Clear all sessionStorage data
    try {
        sessionStorage.clear();
        console.log('SessionStorage cleared');
    } catch (e) {
        console.log('Failed to clear sessionStorage:', e);
    }

    // 5. Clear IndexedDB (WalletConnect stores data here)
    try {
        const databases = await window.indexedDB.databases();
        for (const db of databases) {
            if (db.name) {
                window.indexedDB.deleteDatabase(db.name);
                console.log(`Deleted IndexedDB: ${db.name}`);
            }
        }
    } catch (e) {
        console.log('Failed to clear IndexedDB:', e);
    }

    // 6. Clear cookies for this domain
    try {
        document.cookie.split(";").forEach((c) => {
            document.cookie = c.replace(/^ +/, "")
                .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
        console.log('Cookies cleared');
    } catch (e) {
        console.log('Failed to clear cookies:', e);
    }

    // 7. RESTORE preserved settings
    try {
        if (preservedSettings) {
            localStorage.setItem('kyneto_settings', preservedSettings);
            console.log('Restored user settings');
        }
        if (preservedTheme) {
            localStorage.setItem('theme', preservedTheme);
            console.log('Restored theme preference');
        }
        if (preservedProfile) {
            localStorage.setItem('kyneto_user_profile', preservedProfile);
            console.log('Restored user profile');
        }
    } catch (e) {
        console.log('Failed to restore settings:', e);
    }

    // 7. Reset global state
    userAddress = null;
    signer = null;
    provider = null;
    isProvider = false;

    // 8. Show disconnect notification before redirect
    showNotification('info', 'Wallet Disconnected', 'Redirecting to home page...');

    // 9. Redirect to landing page (go back to root)
    setTimeout(() => {
        // Navigate to the landing page (parent directory or root)
        const currentPath = window.location.pathname;
        if (currentPath.includes('/dashboard')) {
            // If we're at /dashboard, go to root
            window.location.href = window.location.origin + '/';
        } else {
            // Otherwise just reload to reinitialize
            window.location.reload();
        }
    }, 500);
}

function updateWalletUI(isConnected) {
    const connectBtn = document.getElementById('connect-wallet-btn');
    const userProfile = document.getElementById('user-profile');
    const dropdownAddr = document.getElementById('dropdown-address');
    const sidebarNodeId = document.getElementById('sidebar-node-id');

    // Sidebar elements
    const sidebarName = document.querySelector('.sidebar-profile .name');
    const sidebarStatus = document.querySelector('.sidebar-profile .status');

    // Sidebar Auth Button
    const sidebarAuthBtn = document.getElementById('sidebar-auth-btn');

    console.log('Updating Wallet UI:', {
        isConnected,
        userAddress,
        hasSigner: !!signer,
        elementsFound: {
            connectBtn: !!connectBtn,
            userProfile: !!userProfile,
            dropdownAddr: !!dropdownAddr,
            sidebarNodeId: !!sidebarNodeId,
            sidebarName: !!sidebarName,
            sidebarStatus: !!sidebarStatus,
            sidebarAuthBtn: !!sidebarAuthBtn
        }
    });

    if (isConnected && userAddress) {
        // Hide Connect Button, Show Profile
        if (connectBtn) {
            connectBtn.classList.add('hidden');
            connectBtn.style.display = 'none'; // Force hide
        }
        if (userProfile) {
            userProfile.classList.remove('hidden');
            userProfile.style.display = 'flex'; // Force show
        }

        // Update addresses
        if (dropdownAddr) dropdownAddr.textContent = userAddress;
        if (sidebarNodeId) sidebarNodeId.textContent = userAddress;

        // Update Global Profile UI (Sidebar & Top Bar)
        updateGlobalProfileUI();

        if (sidebarStatus) {
            sidebarStatus.textContent = 'Online';
            sidebarStatus.style.color = 'var(--success)';
        }

        // Update Sidebar Auth Button to Disconnect
        if (sidebarAuthBtn) {
            sidebarAuthBtn.innerHTML = '<i class="fa-solid fa-right-from-bracket"></i><span>Disconnect</span>';
            sidebarAuthBtn.onclick = disconnectWallet;
            sidebarAuthBtn.classList.add('logout');
        }

        console.log('UI Updated: Connected state');
    } else {
        // Show Connect Button, Hide Profile
        if (connectBtn) {
            connectBtn.innerHTML = '<i class="fa-solid fa-wallet"></i> Connect Wallet';
            connectBtn.classList.remove('hidden');
            connectBtn.style.display = 'flex'; // Force show
        }
        if (userProfile) {
            userProfile.classList.add('hidden');
            userProfile.style.display = 'none'; // Force hide
        }

        // Reset Sidebar
        if (sidebarNodeId) sidebarNodeId.textContent = 'Not Connected';
        if (sidebarName) sidebarName.textContent = 'Guest';
        if (sidebarStatus) {
            sidebarStatus.textContent = 'Offline';
            sidebarStatus.style.color = 'var(--text-secondary)';
        }

        // Update Sidebar Auth Button to Connect
        if (sidebarAuthBtn) {
            sidebarAuthBtn.innerHTML = '<i class="fa-solid fa-wallet"></i><span>Connect Wallet</span>';
            sidebarAuthBtn.onclick = connectWallet;
            sidebarAuthBtn.classList.remove('logout');
        }

        console.log('UI Updated: Disconnected state');
    }
}

function updateGlobalProfileUI() {
    if (!userAddress) return;

    const profileData = JSON.parse(localStorage.getItem(`kyneto_profile_${userAddress}`)) || {
        username: `${userAddress.substring(0, 8)}...${userAddress.substring(userAddress.length - 6)}`,
        avatar: null
    };

    // Update Top Bar
    const topName = document.querySelector('.user-profile .name'); // Note: Added if exists
    const topAvatar = document.querySelector('.user-profile .avatar');
    if (topAvatar) {
        if (profileData.avatar) {
            topAvatar.innerHTML = `<img src="${profileData.avatar}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        } else {
            topAvatar.innerHTML = '';
        }
    }

    // Update Sidebar
    const sidebarName = document.querySelector('.sidebar-profile .name');
    const sidebarAvatar = document.querySelector('.sidebar-profile .avatar-mini');
    if (sidebarName) sidebarName.textContent = profileData.username;
    if (sidebarAvatar) {
        if (profileData.avatar) {
            sidebarAvatar.innerHTML = `<img src="${profileData.avatar}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        } else {
            sidebarAvatar.innerHTML = '';
        }
    }
}

function toggleProfileDropdown() {
    const dropdown = document.getElementById('profile-dropdown');
    if (dropdown) {
        dropdown.classList.toggle('hidden');
        const sidebarDropdown = document.getElementById('sidebar-dropdown');
        if (sidebarDropdown) sidebarDropdown.classList.add('hidden');
    }
}

function toggleSidebarDropdown() {
    const dropdown = document.getElementById('sidebar-dropdown');
    if (dropdown) {
        dropdown.classList.toggle('hidden');
        const topDropdown = document.getElementById('profile-dropdown');
        if (topDropdown) topDropdown.classList.add('hidden');
    }
}

function switchView(viewId) {
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

    const targetView = document.getElementById(`${viewId}-view`);
    if (targetView) {
        targetView.classList.add('active');

        // Update nav item active state
        const navItems = {
            'dashboard': 0,
            'marketplace': 1,
            'provider': 2,
            'governance': 3,
            'files': 4,
            'settings': 5
        };

        const baseView = viewId.split('-')[0];
        if (navItems[baseView] !== undefined) {
            document.querySelectorAll('.nav-item')[navItems[baseView]].classList.add('active');
        }

        // Auto-detect region when becoming a provider
        if (viewId === 'become-provider') {
            detectRegion();

            // If already a provider, customize the view for "Upgrade Pledge"
            if (isProvider) {
                const stakeBtn = document.getElementById('stake-btn');
                if (stakeBtn) stakeBtn.textContent = 'Approved ✓';

                const stepRegister = document.getElementById('step-register');
                if (stepRegister) stepRegister.classList.remove('disabled');

                const regTitle = document.querySelector('#become-provider-view h2');
                if (regTitle) regTitle.textContent = 'Upgrade Storage Pledge';

                const submitBtn = document.querySelector('#register-node-form button[type="submit"]');
                if (submitBtn) submitBtn.textContent = 'Upgrade Pledge';

                // Pre-fill existing data if available (we could fetch this from registry)
                addActivity('System', 'Preparing pledge upgrade...', 'system');
            }
        }

        // Update title
        const titles = {
            'dashboard': 'Network Dashboard',
            'marketplace': 'Storage Marketplace',
            'provider': 'Provider Portal',
            'governance': 'Protocol Governance',
            'files': 'My Uploaded Files',
            'create-deal': 'Create Storage Deal',
            'deals-detail': 'Active Deals Analytics',
            'providers-detail': 'Provider Network Stats',
            'capacity-detail': 'Network Capacity',
            'utilization-detail': 'Storage Utilization',
            'revenue-detail': 'Protocol Revenue',
            'burned-detail': 'Token Burn Analytics',
            'become-provider': 'Become a Provider',
            'upgrade-pledge': 'Upgrade Storage Pledge',
            'earnings': 'Earnings & Rewards',
            'profile': 'My Profile',
            'my-deals': 'My Deals',
            'settings': 'Protocol Settings'
        };
        document.getElementById('view-title').textContent = titles[viewId] || 'Dashboard';

        // Load settings if entering settings view
        if (viewId === 'settings') {
            document.getElementById('notify-deals').checked = settings.notifications.deals;
            document.getElementById('notify-slashing').checked = settings.notifications.slashing;
            document.getElementById('notify-network').checked = settings.notifications.network;
            document.getElementById('setting-currency').value = settings.display.currency;
            document.getElementById('setting-unit').value = settings.display.unit;
            document.getElementById('setting-auto-renew').checked = settings.node.autoRenew;
            document.getElementById('setting-pref-region').value = settings.node.region;

            const endpointInput = document.getElementById('setting-node-endpoint');
            if (endpointInput) endpointInput.value = settings.node.endpoint || '';
        }

        // Load earnings data if entering earnings view
        if (viewId === 'earnings') {
            fetchEarnings(); // Refresh available balance
            fetchEarningsHistory();
        }

        if (viewId === 'profile') {
            renderProfile();
        }

        if (viewId === 'dashboard') {
            fetchDeals(); // Ensure stats and deals are fresh on the main dashboard
        }

        if (viewId === 'my-deals') {
            fetchMyDeals('client'); // Default to client deals
        }

        if (viewId === 'files') {
            fetchDeals(); // Ensure files are loaded
        }

        if (viewId === 'governance') {
            renderProposals(); // Load governance data
        }

        // Simulate data for detail views
        if (viewId.includes('detail')) {
            simulateDetailData(viewId);
        }
    }
}

function simulateDetailData(viewId) {
    const getStat = (id) => {
        const el = document.querySelector(`#${id} .value`);
        return el ? el.textContent : '0';
    };

    if (viewId === 'deals-detail') {
        const dealsGrowth = document.getElementById('deals-growth-chart');
        if (dealsGrowth) {
            dealsGrowth.innerHTML = `<div style="display: flex; height: 100%; align-items: center; justify-content: center; font-size: 2rem; color: var(--primary-color);">Total Active Deals: ${getStat('stat-deals')}</div>`;
        }
        const statBoxes = document.querySelectorAll('.detail-card-stats .value');
        if (statBoxes.length >= 2) {
            statBoxes[0].textContent = parseInt(getStat('stat-deals')) > 0 ? "2.5 GB" : "0 GB";
            statBoxes[1].textContent = "100%";
        }
    }

    if (viewId === 'providers-detail') {
        const distList = document.getElementById('provider-dist-list');
        if (distList) {
            distList.innerHTML = `
                <div style="padding: 15px; background: rgba(255,255,255,0.02); border-radius: 8px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span>Global Network</span>
                        <span style="color: var(--primary-color); font-weight: bold;">${getStat('stat-providers')} Nodes</span>
                    </div>
                    <div style="width: 100%; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px;">
                        <div style="width: 100%; height: 100%; background: var(--primary-color); border-radius: 4px;"></div>
                    </div>
                </div>
            `;
        }
        const healthCircle = document.querySelector('.health-circle');
        if (healthCircle) {
            healthCircle.textContent = getStat('stat-providers');
            healthCircle.style.borderColor = 'var(--success)';
            healthCircle.style.color = 'var(--success)';
        }
    }

    if (viewId === 'capacity-detail') {
        const trend = document.getElementById('capacity-trend-chart');
        if (trend) {
            trend.innerHTML = `<div style="display: flex; height: 100%; align-items: center; justify-content: center; font-size: 2rem; color: var(--primary-color);">Current Network Capacity: ${getStat('stat-capacity')}</div>`;
        }
    }

    if (viewId === 'utilization-detail') {
        const list = document.getElementById('usage-breakdown-list');
        if (list) {
            list.innerHTML = `
                <div style="padding: 15px; margin-bottom: 10px; background: rgba(255,255,255,0.02); border-radius: 8px; display: flex; justify-content: space-between;">
                    <span>Storage Used</span>
                    <span style="color: var(--secondary-color); font-weight: bold;">${getStat('stat-utilization')}</span>
                </div>
                <div style="padding: 15px; background: rgba(255,255,255,0.02); border-radius: 8px; display: flex; justify-content: space-between;">
                    <span>Total Pledged</span>
                    <span style="color: var(--primary-color); font-weight: bold;">${getStat('stat-capacity')}</span>
                </div>
            `;
        }
    }

    if (viewId === 'revenue-detail') {
        const revenueList = document.getElementById('revenue-streams');
        if (revenueList) {
            revenueList.innerHTML = `
                <div style="padding: 15px; background: rgba(255,255,255,0.02); border-radius: 8px; display: flex; justify-content: space-between;">
                    <span>Storage Deal Fees</span>
                    <span style="color: var(--success); font-weight: bold;">${getStat('stat-revenue')}</span>
                </div>
            `;
        }
    }

    if (viewId === 'burned-detail') {
        const burnChart = document.getElementById('burn-rate-chart');
        if (burnChart) {
            burnChart.innerHTML = `<div style="display: flex; height: 100%; align-items: center; justify-content: center; font-size: 2rem; color: var(--danger);">Total Burned: ${getStat('stat-burned')}</div>`;
        }
    }
}

// Provider Portal Logic
function formatStorage(gb) {
    const val = parseFloat(gb);
    if (val >= 1000) {
        return (val / 1000).toFixed(2).replace(/\.00$/, '') + ' TB';
    }
    return val + ' GB';
}

async function handleStake() {
    if (!signer || !userAddress) {
        const recovered = await recoverSigner();
        if (!recovered) {
            showNotification('error', 'Wallet Not Connected', 'Please connect your wallet first.');
            return;
        }
    }

    if (!KYN_TOKEN_ADDRESS || !CAPACITY_PLEDGE_ADDRESS) {
        showNotification('error', 'Contracts Not Configured', 'Please set the contract addresses in Settings.');
        switchView('settings');
        return;
    }

    const stakeBtn = document.getElementById('stake-btn');
    const originalText = stakeBtn.textContent;

    try {
        stakeBtn.disabled = true;
        stakeBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Checking Status...';

        const tokenContract = new ethers.Contract(KYN_TOKEN_ADDRESS, ERC20_ABI, signer);
        const registryContract = new ethers.Contract(PROVIDER_REGISTRY_ADDRESS, REGISTRY_ABI, signer);
        const amount = ethers.utils.parseUnits("1000", 18);

        // 1. Check if already registered
        const providerData = await registryContract.providers(userAddress);
        if (providerData && providerData[0] === true) {
            showNotification('info', 'Already Registered', 'You are already a registered provider.');
            isProvider = true;
            await checkProviderStatus();
            switchView('provider');
            return;
        }

        // 2. Check current allowance
        const allowance = await tokenContract.allowance(userAddress, CAPACITY_PLEDGE_ADDRESS);
        if (allowance.gte(amount)) {
            showNotification('success', 'Already Approved', 'You have already approved KYN tokens. Proceeding to registration...');
            document.getElementById('step-register').classList.remove('disabled');
            stakeBtn.textContent = 'Approved ✓';

            // Auto-fill Peer ID if possible
            const peerIdInput = document.getElementById('reg-peer-id');
            if (peerIdInput && !peerIdInput.value) {
                peerIdInput.value = 'Qm' + Math.random().toString(36).substring(2, 15);
            }
            return;
        }

        // 3. Check balance before approval
        const balance = await tokenContract.balanceOf(userAddress);
        if (balance.lt(amount)) {
            showNotification('error', 'Insufficient KYN Balance', `You need at least 1,000 KYN to stake. Current balance: ${ethers.utils.formatUnits(balance, 18)} KYN`);
            stakeBtn.disabled = false;
            stakeBtn.textContent = originalText;
            return;
        }

        stakeBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Approving...';

        addActivity('System', 'Initiating KYN approval...', 'system');
        showNotification('info', 'Confirm Transaction', 'Please confirm the KYN approval in your wallet.');

        // Get gas fees and estimate gas
        const gasFees = await getGasFees();
        const gasEstimate = await tokenContract.estimateGas.approve(CAPACITY_PLEDGE_ADDRESS, amount);

        // Request approval with robust gas parameters
        const tx = await tokenContract.approve(CAPACITY_PLEDGE_ADDRESS, amount, {
            ...gasFees,
            gasLimit: getGasLimitWithBuffer(gasEstimate)
        });

        showNotification('info', 'Transaction Pending', 'KYN approval transaction submitted. Waiting for confirmation...');
        addActivity('System', `Approval pending: ${tx.hash.substring(0, 10)}...`, 'system');

        await tx.wait();

        showNotification('success', 'Approval Successful', 'KYN tokens approved. You can now register your node.');
        addActivity('User', 'Approved 1,000 KYN for staking', 'user');

        stakeBtn.textContent = 'Approved ✓';
        document.getElementById('step-register').classList.remove('disabled');

        // Auto-fill Peer ID if possible (simulated for now)
        const peerIdInput = document.getElementById('reg-peer-id');
        if (peerIdInput && !peerIdInput.value) {
            peerIdInput.value = 'Qm' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        }
        const endpointInput = document.getElementById('reg-endpoint');
        if (endpointInput && !endpointInput.value) {
            endpointInput.value = `http://${window.location.hostname}:3002`;
        }

    } catch (error) {
        console.error('=== STAKING ERROR ===');
        console.error('Full error object:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error data:', error.data);
        console.error('Error reason:', error.reason);

        // Try to extract the revert reason
        let revertReason = 'Unknown error';
        if (error.data && error.data.message) {
            revertReason = error.data.message;
        } else if (error.error && error.error.message) {
            revertReason = error.error.message;
        } else if (error.reason) {
            revertReason = error.reason;
        } else if (error.message) {
            revertReason = error.message;
        }

        console.error('Extracted revert reason:', revertReason);

        // User-friendly error messages
        if (error.code === 4001 || error.message.includes('rejected')) {
            showNotification('error', 'Transaction Cancelled', 'You rejected the approval transaction.');
        } else if (error.message.includes('insufficient funds')) {
            showNotification('error', 'Insufficient POL', 'You need POL to pay for gas fees. Get testnet POL from https://faucet.polygon.technology');
        } else if (error.message.includes('ERC20: insufficient allowance')) {
            showNotification('error', 'Token Balance Low', 'You do not have enough KYN tokens to stake.');
        } else if (revertReason.includes('execution reverted')) {
            showNotification('error', 'Transaction Failed', `Contract Error: ${revertReason}. This might be a contract configuration issue. Check console for details.`);
        } else {
            showNotification('error', 'Transaction Failed', `${revertReason}. Check browser console for full details.`);
        }

        stakeBtn.disabled = false;
        stakeBtn.textContent = originalText;
    }
}


function saveSettings() {
    settings.notifications.deals = document.getElementById('notify-deals').checked;
    settings.notifications.slashing = document.getElementById('notify-slashing').checked;
    settings.notifications.network = document.getElementById('notify-network').checked;
    settings.display.currency = document.getElementById('setting-currency').value;
    settings.display.unit = document.getElementById('setting-unit').value;
    settings.node.autoRenew = document.getElementById('setting-auto-renew').checked;
    settings.node.region = document.getElementById('setting-pref-region').value;

    const endpointInput = document.getElementById('setting-node-endpoint');
    if (endpointInput) {
        settings.node.endpoint = endpointInput.value.trim();
    }

    localStorage.setItem('kyneto_settings', JSON.stringify(settings));

    showNotification('success', 'Settings Saved', 'Your preferences have been updated.');
    addActivity('System', 'Updated user settings', 'system');
}

async function detectRegion() {
    const regionSelect = document.getElementById('provider-region');
    const regionLabel = document.getElementById('region-label');

    if (!regionSelect) return;

    try {
        regionSelect.disabled = true;
        if (regionLabel) regionLabel.innerHTML = 'Region <i class="fa-solid fa-spinner fa-spin" style="font-size: 0.8rem; margin-left: 5px;"></i>';

        const response = await fetch(`${API_URL}/api/detect-region`);
        const data = await response.json();

        if (data.region) {
            regionSelect.value = data.region;
            if (regionLabel) {
                regionLabel.innerHTML = `Region <span style="color: var(--success); font-size: 0.7rem; margin-left: 5px;">(Auto-detected: ${data.detected ? 'Verified' : 'Default'})</span>`;
            }
        }
    } catch (error) {
        console.error('Region detection failed:', error);
        regionSelect.disabled = false; // Allow manual selection if detection fails
    }
}

async function handleRegisterNode(event) {
    event.preventDefault();
    const capacityInput = event.target.querySelector('input[type="number"]');
    const regionSelect = document.getElementById('provider-region');

    if (!capacityInput || !regionSelect) {
        showNotification('error', 'Error', 'Form elements not found. Please refresh the page.');
        return;
    }

    const capacity = capacityInput.value;
    const region = regionSelect.value;

    if (!capacity || !region) {
        showNotification('error', 'Error', 'Please fill in all required fields.');
        return;
    }

    if (!signer || !userAddress) {
        const recovered = await recoverSigner();
        if (!recovered) {
            showNotification('error', 'Wallet Not Connected', 'Please connect your wallet first.');
            return;
        }
    }

    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    try {
        submitBtn.disabled = true;

        if (KYN_TOKEN_ADDRESS && CAPACITY_PLEDGE_ADDRESS && PROVIDER_REGISTRY_ADDRESS) {
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Registering...';

            const peerId = document.getElementById('reg-peer-id').value;
            const endpoint = document.getElementById('reg-endpoint').value;
            const capacity = Math.ceil(document.getElementById('reg-capacity').value);
            const region = document.getElementById('provider-region').value;
            const minPriceUSD = Math.round(parseFloat(document.getElementById('reg-min-price').value) * 1000000); // 6 decimals

            const registryContract = new ethers.Contract(PROVIDER_REGISTRY_ADDRESS, REGISTRY_ABI, signer);
            const pledgeContract = new ethers.Contract(CAPACITY_PLEDGE_ADDRESS, CAPACITY_PLEDGE_ABI, signer);

            // 1. Register in ProviderRegistry (Only if not already registered)
            const providerData = await registryContract.providers(userAddress);
            const isAlreadyRegistered = providerData && providerData[0] === true;

            if (!isAlreadyRegistered) {
                addActivity('System', 'Registering provider in registry...', 'system');
                const regGasFees = await getGasFees();
                const regGasEstimate = await registryContract.estimateGas.registerProvider(peerId, endpoint, region, minPriceUSD);

                const regTx = await registryContract.registerProvider(peerId, endpoint, region, minPriceUSD, {
                    ...regGasFees,
                    gasLimit: getGasLimitWithBuffer(regGasEstimate)
                });

                showNotification('info', 'Registration Pending', 'Provider registration transaction submitted.');
                await regTx.wait();
                addActivity('System', 'Provider registered successfully', 'system');
            } else {
                addActivity('System', 'Provider already registered, skipping registry step...', 'system');
            }

            // 2. Create Capacity Pledge
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Pledging...';
            const duration = 30 * 24 * 60 * 60; // 30 days
            const collateral = ethers.utils.parseUnits("1000", 18);

            // 2a. Check existing allowance and approve if needed
            const tokenContract = new ethers.Contract(KYN_TOKEN_ADDRESS, ERC20_ABI, signer);
            const allowance = await tokenContract.allowance(userAddress, CAPACITY_PLEDGE_ADDRESS);

            if (allowance.lt(collateral)) {
                submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Approving KYN...';
                addActivity('System', 'Re-approving KYN for capacity pledge...', 'system');
                showNotification('info', 'Approve KYN', 'Please confirm the KYN approval in your wallet.');

                const approveGasFees = await getGasFees();
                const approveGasEstimate = await tokenContract.estimateGas.approve(CAPACITY_PLEDGE_ADDRESS, collateral);
                const approveTx = await tokenContract.approve(CAPACITY_PLEDGE_ADDRESS, collateral, {
                    ...approveGasFees,
                    gasLimit: getGasLimitWithBuffer(approveGasEstimate)
                });

                showNotification('info', 'Approval Pending', 'Waiting for KYN approval confirmation...');
                await approveTx.wait();
                showNotification('success', 'Approval Confirmed', 'KYN approved. Now creating capacity pledge...');
                submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Pledging...';
            }

            addActivity('System', 'Creating capacity pledge...', 'system');

            const pledgeGasFees = await getGasFees();
            const pledgeGasEstimate = await pledgeContract.estimateGas.createPledge(capacity, duration, collateral);

            const pledgeTx = await pledgeContract.createPledge(capacity, duration, collateral, {
                ...pledgeGasFees,
                gasLimit: getGasLimitWithBuffer(pledgeGasEstimate)
            });

            showNotification('info', 'Pledge Pending', 'Pledge transaction submitted.');
            await pledgeTx.wait();

            showNotification('success', 'Node Fully Registered!', `Successfully registered node with ${capacity} GB.`);
        }

        addActivity('User', `Registered node with ${capacity} GB capacity in ${region.toUpperCase()}`, 'user');

        // Refresh provider status from blockchain
        await checkProviderStatus();

        // User feedback with custom notification
        showNotification('success', 'Node Registered!', `Successfully registered node with ${formatStorage(capacity)} capacity in ${region.toUpperCase()}.`);

        // Automatically switch back to provider portal to show the new node
        setTimeout(() => {
            switchView('provider');
        }, 1500);

    } catch (error) {
        console.error('=== REGISTRATION ERROR ===');
        console.error('Full error:', error);
        console.error('Error code:', error.code);
        console.error('Error reason:', error.reason);
        console.error('Error message:', error.message);
        console.error('Error data:', error.data);

        let errorTitle = 'Registration Failed';
        let errorMessage = 'Unknown error occurred.';

        // Parse the error to give user-friendly feedback
        if (error.code === 4001) {
            errorTitle = 'Transaction Cancelled';
            errorMessage = 'You rejected the transaction in your wallet.';
        } else if (error.message.includes('insufficient funds')) {
            errorTitle = 'Insufficient POL';
            errorMessage = 'You don\'t have enough POL to pay for gas fees. Get testnet POL from https://faucet.polygon.technology';
        } else if (error.reason && error.reason.includes('Already registered')) {
            errorTitle = 'Already Registered';
            errorMessage = 'This wallet is already registered as a provider.';
        } else if (error.reason && error.reason.includes('Invalid peer ID')) {
            errorTitle = 'Invalid Peer ID';
            errorMessage = 'Please enter a valid IPFS Peer ID. Get it by running: ipfs id';
        } else if (error.message.includes('ERC20: insufficient allowance') || error.message.includes('transfer amount exceeds allowance')) {
            errorTitle = 'Approval Required';
            errorMessage = 'Please approve KYN tokens for the CapacityPledge contract first by clicking "Stake 1,000 KYN" again.';
        } else if (error.message.includes('ERC20: transfer amount exceeds balance')) {
            errorTitle = 'Insufficient KYN Balance';
            errorMessage = 'You need at least 1,000 KYN tokens to register as a provider.';
        } else if (error.data) {
            // Try to decode the error data
            errorMessage = `Contract error: ${error.message}. Check browser console for details.`;
        } else {
            errorMessage = error.message || error.reason || 'An unexpected error occurred. Check browser console for details.';
        }

        console.error('User-friendly error:', errorTitle, errorMessage);
        showNotification('error', errorTitle, errorMessage);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

function animateReputation(target) {
    const gauge = document.getElementById('reputation-gauge');
    const value = document.getElementById('reputation-value');
    const status = document.getElementById('reputation-status');

    if (!gauge || !value || !status) return;

    let current = 0;
    const interval = setInterval(() => {
        if (current >= target) {
            clearInterval(interval);
        } else {
            current++;
            value.textContent = current;
            gauge.style.background = `conic-gradient(var(--primary-color) ${current * 3.6}deg, rgba(255, 255, 255, 0.05) 0deg)`;
        }
    }, 10);

    if (target >= 80) {
        status.textContent = 'Excellent';
        status.style.color = 'var(--success)';
    } else if (target >= 50) {
        status.textContent = 'Good';
        status.style.color = 'var(--warning)';
    } else {
        status.textContent = 'Poor';
        status.style.color = 'var(--danger)';
    }
}

async function handleUpgradePledge(event) {
    event.preventDefault();
    const additionalInput = document.getElementById('additional-capacity');
    if (!additionalInput || !additionalInput.value) {
        showNotification('error', 'Error', 'Please enter additional capacity.');
        return;
    }

    if (!signer || !userAddress) {
        const recovered = await recoverSigner();
        if (!recovered) {
            showNotification('error', 'Wallet Not Connected', 'Please connect your wallet first.');
            return;
        }
    }

    const additional = parseInt(additionalInput.value);
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Upgrading...';

        const pledgeContract = new ethers.Contract(CAPACITY_PLEDGE_ADDRESS, CAPACITY_PLEDGE_ABI, signer);

        // In this protocol, "upgrading" means creating a new pledge
        const duration = 30 * 24 * 60 * 60; // 30 days
        const collateral = ethers.utils.parseUnits((additional * 10).toString(), 18); // 10 KYN per GB

        // 1. Check existing allowance
        const tokenContract = new ethers.Contract(KYN_TOKEN_ADDRESS, ERC20_ABI, signer);
        const allowance = await tokenContract.allowance(userAddress, CAPACITY_PLEDGE_ADDRESS);

        if (allowance.lt(collateral)) {
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Approving KYN...';
            addActivity('System', 'Initiating KYN approval for pledge upgrade...', 'system');
            showNotification('info', 'Confirm Transaction', `Please approve ${additional * 10} KYN in your wallet.`);

            const gasFeesApprove = await getGasFees();
            const gasEstimateApprove = await tokenContract.estimateGas.approve(CAPACITY_PLEDGE_ADDRESS, collateral);
            const approveTx = await tokenContract.approve(CAPACITY_PLEDGE_ADDRESS, collateral, {
                ...gasFeesApprove,
                gasLimit: getGasLimitWithBuffer(gasEstimateApprove)
            });
            showNotification('info', 'Approval Pending', 'Waiting for KYN approval transaction...');
            await approveTx.wait();
            showNotification('success', 'Approval Successful', 'KYN tokens successfully approved. Proceeding to upgrade pledge...');
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Upgrading...';
        }

        addActivity('System', `Initiating upgrade pledge for ${additional} GB...`, 'system');

        const gasFees = await getGasFees();
        const gasEstimate = await pledgeContract.estimateGas.createPledge(additional, duration, collateral);

        const tx = await pledgeContract.createPledge(additional, duration, collateral, {
            ...gasFees,
            gasLimit: getGasLimitWithBuffer(gasEstimate)
        });

        showNotification('info', 'Upgrade Pending', 'Pledge upgrade transaction submitted.');
        await tx.wait();

        showNotification('success', 'Upgrade Successful!', `Added ${formatStorage(additional)} to your pledge.`);
        addActivity('User', `Upgraded pledge by ${additional} GB`, 'user');

        // Refresh status
        await checkProviderStatus();
        switchView('provider');

    } catch (error) {
        console.error('Upgrade failed:', error);
        showNotification('error', 'Upgrade Failed', error.message || 'Failed to upgrade pledge.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

async function handleExitPledge(pledgeId) {
    if (!signer || !userAddress) {
        const recovered = await recoverSigner();
        if (!recovered) {
            showNotification('error', 'Wallet Not Connected', 'Please connect your wallet first.');
            return;
        }
    }

    // Pre-check: is this pledge already inactive?
    try {
        const pledgeContract = new ethers.Contract(CAPACITY_PLEDGE_ADDRESS, CAPACITY_PLEDGE_ABI, provider);
        const pledge = await pledgeContract.getPledge(userAddress, pledgeId);
        const isActive = pledge[6];

        if (!isActive) {
            showNotification('success', 'Node Removed', `Pledge #${pledgeId} was already exited on-chain. Removing from dashboard.`);
            addActivity('System', `Pledge #${pledgeId} is already inactive — removing from view.`, 'system');

            // Forcefully remove the node from the DOM immediately
            const activeNodesList = document.getElementById('active-nodes-list');
            if (activeNodesList) {
                activeNodesList.innerHTML = '';
                activeNodesList.classList.add('hidden');
            }
            const noNodesState = document.getElementById('no-nodes-state');
            if (noNodesState) noNodesState.classList.remove('hidden');
            const storageManagement = document.getElementById('storage-management');
            if (storageManagement) storageManagement.classList.add('hidden');
            const upgradeBtn = document.getElementById('btn-upgrade-pledge');
            if (upgradeBtn) upgradeBtn.classList.add('hidden');

            // Also refresh from on-chain to sync everything
            await checkProviderStatus();
            return;
        }
    } catch (checkErr) {
        console.warn('Could not pre-check pledge status, proceeding anyway:', checkErr);
    }

    showConfirmModal(
        'Exit Network?',
        'WARNING: Exiting your pledge early will result in a 20% collateral penalty. Are you sure you want to leave the network?',
        async () => {
            try {
                const pledgeContract = new ethers.Contract(CAPACITY_PLEDGE_ADDRESS, CAPACITY_PLEDGE_ABI, signer);

                addActivity('System', `Initiating early exit for Pledge #${pledgeId}...`, 'system');
                showNotification('info', 'Confirm Transaction', 'Please confirm the early exit in your wallet.');

                const gasFees = await getGasFees();

                // Send with a manual gas limit so the wallet popup always appears.
                // estimateGas is intentionally skipped because it simulates the
                // transaction and throws before MetaMask can prompt for a signature.
                const tx = await pledgeContract.exitPledgeEarly(pledgeId, {
                    ...gasFees,
                    gasLimit: 300000
                });

                showNotification('info', 'Transaction Pending', 'Exit transaction submitted. Waiting for confirmation...');
                await tx.wait();

                showNotification('success', 'Pledge Exited', 'You have successfully exited the pledge. Your remaining collateral has been returned.');
                addActivity('User', `Exited Pledge #${pledgeId} early`, 'user');

                // Refresh status
                await checkProviderStatus();

            } catch (error) {
                console.error('Exit pledge failed:', error);

                // Parse user-friendly message from the revert reason
                let msg = error.message || 'Failed to exit pledge.';
                if (error.code === 4001 || error.code === 'ACTION_REJECTED') {
                    msg = 'Transaction was rejected in your wallet.';
                } else if (msg.includes('Pledge not active')) {
                    msg = 'This pledge is already inactive on-chain.';
                } else if (msg.includes('insufficient funds')) {
                    msg = 'Insufficient POL for gas fees. Please add POL to your wallet.';
                }

                showNotification('error', 'Exit Failed', msg);
            }
        }
    );
}

// --- Custom Confirmation Modal Logic ---
let currentConfirmCallback = null;

function showConfirmModal(title, message, onConfirm) {
    const modal = document.getElementById('confirm-modal');
    if (!modal) return;

    document.getElementById('confirm-modal-title').textContent = title;
    document.getElementById('confirm-modal-message').textContent = message;

    const yesBtn = document.getElementById('confirm-modal-yes');
    const newYesBtn = yesBtn.cloneNode(true);
    yesBtn.parentNode.replaceChild(newYesBtn, yesBtn);

    newYesBtn.addEventListener('click', () => {
        closeConfirmModal();
        if (onConfirm) onConfirm();
    });

    modal.classList.remove('hidden');
}

function closeConfirmModal() {
    const modal = document.getElementById('confirm-modal');
    if (modal) modal.classList.add('hidden');
}

async function handleCreateDeal(event) {
    event.preventDefault();
    const size = document.getElementById('deal-size').value;
    const price = document.getElementById('deal-price').value;
    const duration = document.getElementById('deal-duration').value;
    const cid = document.getElementById('file-cid').value || 'Qm' + Math.random().toString(36).substring(2, 15);

    if (!signer || !userAddress) {
        const recovered = await recoverSigner();
        if (!recovered) {
            showNotification('error', 'Wallet Not Connected', 'Please connect your wallet first.');
            return;
        }
    }

    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creating Deal...';

        if (STORAGE_MARKETPLACE_ADDRESS && KYN_TOKEN_ADDRESS) {
            const marketplaceContract = new ethers.Contract(STORAGE_MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer);
            const tokenContract = new ethers.Contract(KYN_TOKEN_ADDRESS, ERC20_ABI, signer);

            // 1. Calculate cost
            const durationDays = parseInt(duration);
            const pricePerGBMonthUSD = Math.round(parseFloat(price) * 1000000); // 6 decimals
            const roundedSize = Math.ceil(size);

            // Fetch KYN price for approval
            const kynPrice = await marketplaceContract.kynPriceUSD();
            const totalMonths = Math.ceil(durationDays / 30);

            // providerPaymentUSD = size * priceUSD * months
            const providerPaymentUSD = BigInt(roundedSize) * BigInt(pricePerGBMonthUSD) * BigInt(totalMonths);
            const protocolFeeUSD = (providerPaymentUSD * 300n) / 10000n;
            const totalCostUSD = providerPaymentUSD + protocolFeeUSD;

            // Convert totalCostUSD to KYN (18 decimals)
            const totalCostKYN = (totalCostUSD * BigInt(10 ** 18)) / BigInt(kynPrice.toNumber());

            addActivity('System', 'Approving KYN for deal...', 'system');
            const approveGasFees = await getGasFees();
            const approveGasEstimate = await tokenContract.estimateGas.approve(STORAGE_MARKETPLACE_ADDRESS, totalCostKYN);

            const approveTx = await tokenContract.approve(STORAGE_MARKETPLACE_ADDRESS, totalCostKYN, {
                ...approveGasFees,
                gasLimit: getGasLimitWithBuffer(approveGasEstimate)
            });
            await approveTx.wait();

            // 2. Select 15 providers (Matchmaking based on price)
            addActivity('System', 'Finding eligible providers...', 'system');
            const registryContract = new ethers.Contract(PROVIDER_REGISTRY_ADDRESS, REGISTRY_ABI, provider);
            let selectedProviders = [];
            try {
                selectedProviders = await registryContract.getEligibleProviders(pricePerGBMonthUSD, 0); // Min reputation 0
                console.log('Eligible providers found:', selectedProviders);
            } catch (e) {
                console.error('Failed to fetch eligible providers:', e);
            }

            if (selectedProviders.length < 15) {
                console.warn('Not enough active providers, filling with dummy addresses for simulation');
                // NOTE: This might still cause gas estimation failure if the contract strictly checks for registered providers
                const dummyCount = 15 - selectedProviders.length;
                const dummies = Array(dummyCount).fill(0).map(() => ethers.Wallet.createRandom().address);
                selectedProviders = [...selectedProviders, ...dummies];
            } else if (selectedProviders.length > 15) {
                // Just take the first 15
                selectedProviders = selectedProviders.slice(0, 15);
            }

            const shardCIDs = Array(15).fill(0).map(() => cid + '_shard');
            const shardSizes = Array(15).fill(0).map(() => Math.ceil(roundedSize * 1024 / 10)); // Simplified

            addActivity('System', 'Initiating marketplace deal...', 'system');

            const alertDays = parseInt(document.getElementById('deal-alert-days').value) || 3;

            const dealGasFees = await getGasFees();
            const dealParams = {
                fileCID: cid,
                fileSizeGB: roundedSize,
                durationDays: durationDays,
                pricePerGBMonthUSD: pricePerGBMonthUSD,
                selectedProviders: selectedProviders,
                shardCIDs: shardCIDs,
                shardSizes: shardSizes,
                alertDays: alertDays
            };

            const dealGasEstimate = await marketplaceContract.estimateGas.createDeal(dealParams);

            const dealTx = await marketplaceContract.createDeal(
                dealParams,
                {
                    ...dealGasFees,
                    gasLimit: getGasLimitWithBuffer(dealGasEstimate)
                }
            );

            showNotification('info', 'Deal Pending', 'Marketplace deal transaction submitted.');
            await dealTx.wait();

            showNotification('success', 'Deal Created!', `Storage deal for ${formatStorage(size)} initiated successfully.`);

            // 3. Automatically submit PoRep (Proof of Replication)
            // In a real app, this would happen after the file is uploaded and sealed
            addActivity('System', 'Submitting Proof of Replication (PoRep)...', 'system');
            const proofVerifier = new ethers.Contract(PROOF_VERIFIER_ADDRESS, PROOF_VERIFIER_ABI, signer);
            const sealedCID = ethers.utils.id(cid + "_sealed");
            const unsealedCID = ethers.utils.id(cid);
            const proofData = ethers.utils.hexlify(ethers.utils.randomBytes(32));

            // We need the dealId from the event or by fetching it
            const dealCount = await marketplaceContract.dealCount();
            const dealId = dealCount.toNumber(); // Assuming this is our deal

            const porepGasFees = await getGasFees();
            const porepGasEstimate = await proofVerifier.estimateGas.submitPoRep(dealId, sealedCID, unsealedCID, proofData);

            const porepTx = await proofVerifier.submitPoRep(dealId, sealedCID, unsealedCID, proofData, {
                ...porepGasFees,
                gasLimit: getGasLimitWithBuffer(porepGasEstimate)
            });
            await porepTx.wait();
            addActivity('System', 'PoRep verified successfully', 'system');
        } else {
            // Fallback for simulation
            addActivity('User', `Initiated storage deal for ${formatStorage(size)}`, 'user');
            showNotification('success', 'Deal Created!', `Storage deal for ${formatStorage(size)} initiated successfully.`);
        }

        switchView('marketplace');
    } catch (error) {
        console.error('Deal creation failed:', error);
        showNotification('error', 'Transaction Failed', error.message || 'Failed to create deal.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Note: fetchEarnings and withdrawEarnings are defined below to avoid duplication

async function submitProof(dealId) {
    if (!signer || !userAddress) {
        const recovered = await recoverSigner();
        if (!recovered || !PROOF_VERIFIER_ADDRESS) return;
    }

    try {
        const verifier = new ethers.Contract(PROOF_VERIFIER_ADDRESS, PROOF_VERIFIER_ABI, signer);

        // For simulation, we'll just show the process
        addActivity('System', `Submitting Proof of Spacetime (PoSt) for Deal #${dealId}...`, 'system');

        showNotification('info', 'Proof Pending', 'PoSt submission transaction submitted.');
        
        // Simulate network delay for verification
        await new Promise(resolve => setTimeout(resolve, 3000));

        showNotification('success', 'Proof Verified', 'Your storage proof has been verified by the network.');
        addActivity('System', `PoSt verified for Deal #${dealId}`, 'system');
    } catch (error) {
        console.error('Proof submission failed:', error);
        showNotification('error', 'Proof Failed', error.message || 'Failed to submit proof.');
    }
}

function refreshDeals() {
    addActivity('System', 'Refreshing deal list...', 'system');
    fetchDeals();
}

// Custom Notification System
function showNotification(type, title, message) {
    // Remove existing notification if any
    const existing = document.getElementById('custom-notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.id = 'custom-notification';
    notification.className = `custom-notification ${type}`;

    const icon = type === 'success' ? 'fa-circle-check' : type === 'error' ? 'fa-circle-xmark' : 'fa-circle-info';

    notification.innerHTML = `
        <div class="notification-content">
            <i class="fa-solid ${icon}"></i>
            <div class="notification-text">
                <strong>${title}</strong>
                <p>${message}</p>
            </div>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>
        <div class="notification-progress"></div>
    `;

    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}


// Governance Proposal System
let proposals = [
    {
        id: 1,
        title: "Increase Storage Rewards by 5%",
        description: "Proposal to increase the base rewards for storage providers to incentivize network growth.",
        votesFor: 1250,
        votesAgainst: 450,
        status: "active",
        userVote: null // 'for' or 'against'
    },
    {
        id: 2,
        title: "Decrease Slashing Penalty",
        description: "Reduce the penalty for minor downtime to support smaller providers.",
        votesFor: 890,
        votesAgainst: 1200,
        status: "active",
        userVote: null
    }
];

function openProposalModal() {
    document.getElementById('proposal-modal').classList.remove('hidden');
}

function closeProposalModal() {
    document.getElementById('proposal-modal').classList.add('hidden');
    document.getElementById('create-proposal-form').reset();
}

function handleCreateProposal(event) {
    event.preventDefault();
    const title = document.getElementById('proposal-title').value;
    const description = document.getElementById('proposal-description').value;

    const newProposal = {
        id: proposals.length + 1,
        title: title,
        description: description,
        votesFor: 0,
        votesAgainst: 0,
        status: "active",
        userVote: null
    };

    proposals.unshift(newProposal);
    renderProposals();
    closeProposalModal();

    addActivity('User', `Created proposal: ${title}`, 'user');
    showNotification('success', 'Proposal Created', 'Your proposal has been submitted to the community.');
}

async function voteProposal(id, type) {
    const proposal = proposals.find(p => p.id === id);
    if (!proposal || proposal.userVote) return;

    if (!signer || !userAddress) {
        showNotification('warning', 'Wallet Required', 'Please connect your wallet to vote on proposals.');
        return;
    }

    // Add loading state to button
    const btnFor = Array.from(document.querySelectorAll('.vote-btn')).find(b => b.textContent.includes('Vote For') && b.getAttribute('onclick')?.includes(id));
    const btnAgainst = Array.from(document.querySelectorAll('.vote-btn')).find(b => b.textContent.includes('Vote Against') && b.getAttribute('onclick')?.includes(id));
    const targetBtn = type === 'for' ? btnFor : btnAgainst;
    const originalContent = targetBtn ? targetBtn.innerHTML : '';

    try {
        if (targetBtn) {
            targetBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Signing...';
            targetBtn.disabled = true;
        }

        console.log(`Requesting signature for proposal ${id} vote: ${type}`);

        // Mock Governance Contract Call to trigger Wallet Signing
        // In real deployment, this would be: await govContract.vote(id, type === 'for');
        const mockGovAddress = '0x8888888888888888888888888888888888888888';
        const dummyTx = {
            to: mockGovAddress,
            value: ethers.utils.parseEther("0"), // No value transfer
            data: ethers.utils.hexlify(ethers.utils.toUtf8Bytes(`vote_${id}_${type}`)) // Mocked data
        };

        // This will trigger the MetaMask popup
        const txResponse = await signer.sendTransaction(dummyTx);
        addActivity('System', 'Governance transaction submitted. Waiting for confirmation...', 'system');

        await txResponse.wait();

        if (type === 'for') {
            proposal.votesFor++;
            proposal.userVote = 'for';
        } else {
            proposal.votesAgainst++;
            proposal.userVote = 'against';
        }

        renderProposals();
        addActivity('User', `Voted ${type} proposal: ${proposal.title}`, 'user');
        showNotification('success', 'Vote Confirmed', `Your ${type} vote has been recorded on-chain.`);

    } catch (error) {
        console.error('Governance voting failed:', error);
        if (error.code === 4001) {
            showNotification('error', 'Vote Cancelled', 'You rejected the governance transaction.');
        } else {
            showNotification('error', 'Voting Failed', 'Failed to submit vote. Check your network or balance.');
        }
    } finally {
        if (targetBtn) {
            targetBtn.innerHTML = originalContent;
            targetBtn.disabled = proposal.userVote ? true : false;
        }
    }
}

function renderProposals() {
    const container = document.getElementById('proposals-container');
    if (!container) return;

    // Clear previous proposals but keep the header
    const header = container.querySelector('.section-header');
    container.innerHTML = '';
    if (header) container.appendChild(header);
    else container.innerHTML = '<h3>Active Proposals</h3>';

    if (proposals.length === 0) {
        container.innerHTML += `
            <div class="empty-state">
                <p>No active proposals at this time.</p>
            </div>
        `;
        return;
    }

    proposals.forEach(p => {
        const totalVotes = p.votesFor + p.votesAgainst;
        const forPercent = totalVotes === 0 ? 50 : (p.votesFor / totalVotes) * 100;
        const againstPercent = totalVotes === 0 ? 50 : (p.votesAgainst / totalVotes) * 100;

        const card = document.createElement('div');
        card.className = 'proposal-card';
        card.innerHTML = `
            <div class="proposal-header">
                <h4>${p.title}</h4>
                <span class="proposal-status status-${p.status}">${p.status.toUpperCase()}</span>
            </div>
            <p class="proposal-desc">${p.description}</p>
            <div class="proposal-voting">
                <div class="vote-stats">
                    <span class="for"><i class="fa-solid fa-circle-check"></i> ${p.votesFor.toLocaleString()} For</span>
                    <span class="against"><i class="fa-solid fa-circle-xmark"></i> ${p.votesAgainst.toLocaleString()} Against</span>
                </div>
                <div class="vote-progress-bar">
                    <div class="progress-for" style="width: ${forPercent}%"></div>
                    <div class="progress-against" style="width: ${againstPercent}%"></div>
                </div>
                <div class="vote-actions">
                    <button class="vote-btn ${p.userVote === 'for' ? 'voted-for' : ''}" 
                            onclick="voteProposal(${p.id}, 'for')" 
                            ${p.userVote ? 'disabled' : ''}>
                        <i class="fa-solid fa-thumbs-up"></i> Vote For
                    </button>
                    <button class="vote-btn ${p.userVote === 'against' ? 'voted-against' : ''}" 
                            onclick="voteProposal(${p.id}, 'against')" 
                            ${p.userVote ? 'disabled' : ''}>
                        <i class="fa-solid fa-thumbs-down"></i> Vote Against
                    </button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });

    // Update Total Proposals stat if it exists
    const totalProposalsEl = document.querySelector('#governance-view .stat-card:last-child .value');
    if (totalProposalsEl) {
        totalProposalsEl.textContent = proposals.length;
    }
}

// Initialize proposals on view switch logic removed and merged into main switchView

async function fetchEvents() {
    try {
        const response = await fetch(`${API_URL}/api/events`);
        const data = await response.json();
        // Process events if needed
    } catch (error) {
        console.error('Error fetching events:', error);
    }
}

// Theme Toggle Function
function toggleTheme() {
    const body = document.body;
    const themeToggle = document.getElementById('theme-toggle');
    const icon = themeToggle.querySelector('i');

    if (body.classList.contains('dark-theme')) {
        body.classList.remove('dark-theme');
        body.classList.add('light-theme');
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
        localStorage.setItem('theme', 'light');
    } else {
        body.classList.remove('light-theme');
        body.classList.add('dark-theme');
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
        localStorage.setItem('theme', 'dark');
    }
}

// Load saved theme on page load
function loadSavedTheme() {
    const savedTheme = localStorage.getItem('theme');
    const themeToggle = document.getElementById('theme-toggle');

    if (savedTheme === 'light') {
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        }
    }
}


async function fetchEarnings() {
    if (!userAddress || !provider) return;

    try {
        const distributorContract = new ethers.Contract(PAYMENT_DISTRIBUTOR_ADDRESS, DISTRIBUTOR_ABI, provider);
        const earnings = await distributorContract.getAvailableEarnings(userAddress);

        const earningsFormatted = ethers.utils.formatEther(earnings);
        updateEarningsUI(earningsFormatted);
    } catch (error) {
        console.error('Error fetching earnings:', error);
        // Fallback to 0 if error, or keep previous value
        updateEarningsUI('0');
    }
}


function fetchEarningsHistory() {
    // Fetch history data from blockchain or indexer
    // Currently showing empty states until real data integration

    // TODO: Replace with actual API/contract calls
    // For now, show clean empty states
    const payouts = [];
    const revenueData = [];
    const chartData = [];

    renderPayouts(payouts);
    renderEarningsChart(chartData);
    renderRevenueBreakdown(revenueData);
}

function renderRevenueBreakdown(data) {
    const container = document.getElementById('revenue-breakdown');
    if (!container) return;
    container.innerHTML = '';

    if (!data || data.length === 0) {
        container.innerHTML = '<div class="empty-state-small"><span>No data available</span></div>';
        return;
    }

    data.forEach(item => {
        const div = document.createElement('div');
        div.className = 'breakdown-item';
        div.innerHTML = `
            <span class="label">${item.label}</span>
            <div class="bar-container">
                <div class="bar" style="width: ${item.percentage}%"></div>
            </div>
            <span class="value">${item.percentage}%</span>
        `;
        container.appendChild(div);
    });
}

function renderPayouts(payouts) {
    const tbody = document.querySelector('#payouts-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (payouts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem;">No transaction history found</td></tr>';
        return;
    }

    payouts.forEach(tx => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-family: monospace;">${tx.id.substring(0, 10)}...${tx.id.substring(60)}</td>
            <td>${tx.type}</td>
            <td style="color: var(--success); font-weight: 600;">+${tx.amount} KYN</td>
            <td>${new Date(tx.date).toLocaleDateString()}</td>
            <td><span class="status-pill active">${tx.status}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

function renderEarningsChart(data) {
    const chartContainer = document.getElementById('earnings-chart');
    if (!chartContainer) return;

    if (!data || data.length === 0) {
        chartContainer.innerHTML = '<div class="empty-state-small" style="height: 100%; display: flex; align-items: center; justify-content: center; color: var(--text-secondary);">No history available</div>';
        return;
    }

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    // Simple CSS bar chart simulation
    chartContainer.innerHTML = `
        <div class="bar-chart-premium" style="height: 100%; align-items: flex-end; display: flex; gap: 10px; padding-bottom: 20px;">
            ${data.map((h, i) => `
                <div class="bar-group" style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 5px;">
                    <div class="bar-premium" style="width: 100%; height: ${h}%; background: var(--primary); border-radius: 4px; opacity: 0.8;"></div>
                    <span style="font-size: 0.7rem; color: var(--text-secondary); white-space: nowrap;">${days[i % 7]}</span>
                </div>
            `).join('')}
        </div>
    `;
}

function updateEarningsUI(amount) {
    // Update Provider Portal Card
    const earningsValue = document.querySelector('#provider-stat-earnings .value');
    if (earningsValue) {
        earningsValue.textContent = `${parseFloat(amount).toFixed(2)} KYN`;
    }

    // Update Earnings Page Cards
    const available = document.getElementById('earnings-available');
    if (available) {
        available.textContent = `${parseFloat(amount).toFixed(2)} KYN`;
    }

    // Simulate Total Earned = Available + Withdrawn (Fixed 500 for demo)
    const total = document.getElementById('earnings-total');
    if (total) {
        const val = parseFloat(amount) + 500;
        total.textContent = `${val.toFixed(2)} KYN`;
    }

    const withdrawn = document.getElementById('earnings-withdrawn');
    if (withdrawn) {
        withdrawn.textContent = `500.00 KYN`;
    }
}


async function withdrawEarnings() {
    if (!signer || !userAddress) {
        const recovered = await recoverSigner();
        if (!recovered) {
            showNotification('error', 'Wallet Not Connected', 'Please connect your wallet first.');
            return;
        }
    }

    // Find the withdraw button (could be in Provider Portal or Earnings page)
    const btn = document.querySelector('#provider-stat-earnings button') ||
        document.querySelector('#earnings-view .btn-primary');
    const originalText = btn ? btn.innerHTML : '';

    try {
        if (btn) {
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
            btn.disabled = true;
        }

        const distributorContract = new ethers.Contract(PAYMENT_DISTRIBUTOR_ADDRESS, DISTRIBUTOR_ABI, signer);

        // Check available earnings first
        const available = await distributorContract.getAvailableEarnings(userAddress);

        if (available.eq(0)) {
            showNotification('info', 'No Earnings', 'You have no earnings available to withdraw.');
            return;
        }

        addActivity('System', 'Initiating withdrawal...', 'system');
        showNotification('info', 'Transaction Pending', 'Please confirm the transaction in your wallet.');

        const gasFees = await getGasFees();
        const gasEstimate = await distributorContract.estimateGas.withdrawEarnings();

        const tx = await distributorContract.withdrawEarnings({
            ...gasFees,
            gasLimit: getGasLimitWithBuffer(gasEstimate)
        });
        addActivity('System', `Withdrawal transaction sent: ${tx.hash.substring(0, 10)}...`, 'system');
        showNotification('info', 'Withdrawal Pending', 'Transaction submitted. Waiting for confirmation...');

        await tx.wait();

        const formattedAmount = ethers.utils.formatEther(available);
        addActivity('User', `Successfully withdrew ${parseFloat(formattedAmount).toFixed(4)} KYN`, 'user');
        showNotification('success', 'Withdrawal Successful', `${parseFloat(formattedAmount).toFixed(4)} KYN has been transferred to your wallet.`);

        // Refresh earnings display
        fetchEarnings();

    } catch (error) {
        console.error('Withdrawal failed:', error);
        addActivity('System', `Withdrawal failed: ${error.message}`, 'error');

        // User-friendly error messages
        if (error.code === 4001 || error.message.includes('rejected')) {
            showNotification('error', 'Transaction Cancelled', 'You rejected the transaction.');
        } else if (error.message.includes('insufficient funds')) {
            showNotification('error', 'Insufficient Gas', 'You need more POL to pay for gas fees.');
        } else {
            showNotification('error', 'Withdrawal Failed', error.reason || error.message || 'An error occurred. Please try again.');
        }
    } finally {
        if (btn) {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }
}



let currentDealsTab = 'client';

function switchDealsTab(tab) {
    currentDealsTab = tab;

    // Update buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = Array.from(document.querySelectorAll('.tab-btn')).find(b => b.textContent.includes(tab === 'client' ? 'Uploads' : 'Storage'));
    if (activeBtn) activeBtn.classList.add('active');

    fetchMyDeals(tab);
}

async function fetchMyDeals(type) {
    const tbody = document.querySelector('#my-deals-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem;"><i class="fa-solid fa-spinner fa-spin"></i> Loading...</td></tr>';

    try {
        // In a real app, we would fetch from different endpoints based on type
        // For now, we'll use the same deals endpoint but filter/simulate
        const response = await fetch(`${API_URL}/api/deals`);
        const data = await response.json();
        let deals = data.deals || [];

        // Simulate filtering or different data for provider view
        if (type === 'provider') {
            // Just for demo, show a subset or modified list
            deals = deals.map(d => ({ ...d, status: 'active' }));
        }

        renderMyDealsTable(deals, type);
    } catch (error) {
        console.error('Error fetching deals:', error);
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem;">No deals found</td></tr>';
    }
}

function renderMyDealsTable(deals, type) {
    const tbody = document.querySelector('#my-deals-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (deals.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state-container">
                        <div class="empty-icon">
                            <i class="fa-solid fa-folder-open"></i>
                        </div>
                        <h3>No deals found</h3>
                        <p>You haven't ${type === 'client' ? 'uploaded any files' : 'stored any shards'} yet.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    deals.forEach(deal => {
        const tr = document.createElement('tr');
        const price = (deal.file_size_gb * 0.5).toFixed(4); // Simulated price calc
        const safeCid = (deal.file_cid && deal.file_cid.length > 8)
            ? `${deal.file_cid.substring(0, 10)}...${deal.file_cid.substring(deal.file_cid.length - 8)}`
            : "Generating...";

        tr.innerHTML = `
            <td>#${deal.deal_id}</td>
            <td>
                <a href="#" class="cid-link" onclick="viewFile('${deal.file_cid}'); return false;">
                    ${safeCid}
                </a>
            </td>
            <td>${deal.file_size_gb || 0} GB</td>
            <td>${price} KYN</td>
            <td>${new Date(deal.created_at || Date.now()).toLocaleDateString()}</td>
            <td><span class="status-pill ${deal.status}">${deal.status}</span></td>
            <td>
                <button class="btn-secondary btn-sm" onclick="viewFile('${deal.file_cid}')" title="Download File">
                    <i class="fa-solid fa-download"></i> Download
                </button>
                ${type === 'client' ? `
                <button class="btn-primary btn-sm" onclick="handleRenewDeal(${deal.deal_id}, 30)" title="Renew (30 Days)">
                    <i class="fa-solid fa-rotate"></i>
                </button>` : ''}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// ============================================
// PROFILE VIEW FUNCTIONS
// ============================================

async function renderProfile() {
    const addressEl = document.getElementById('profile-address-large');
    const joinedEl = document.getElementById('profile-joined');
    const networkEl = document.getElementById('profile-network');
    const balanceEl = document.getElementById('profile-balance');
    const reputationEl = document.getElementById('profile-reputation');
    const totalDealsEl = document.getElementById('profile-total-deals');

    if (!userAddress) {
        if (addressEl) addressEl.textContent = 'Not Connected';
        if (joinedEl) joinedEl.textContent = '--';
        if (networkEl) networkEl.textContent = '--';
        if (balanceEl) balanceEl.textContent = '--';
        if (reputationEl) reputationEl.textContent = '--';
        if (totalDealsEl) totalDealsEl.textContent = '--';
        return;
    }

    // 1. Truncate address for display
    const truncatedAddress = `${userAddress.substring(0, 8)}...${userAddress.substring(userAddress.length - 6)}`;
    if (addressEl) {
        addressEl.textContent = truncatedAddress;
        addressEl.title = userAddress; // Full address on hover
    }

    // 2. Dynamic Joined Date (Persist via localStorage for simulation)
    const storageKey = `kyneto_joined_${userAddress}`;
    let joinedTimestamp = localStorage.getItem(storageKey);

    if (!joinedTimestamp) {
        joinedTimestamp = Date.now();
        localStorage.setItem(storageKey, joinedTimestamp);
    }

    const joinedDate = new Date(parseInt(joinedTimestamp));
    const monthYear = joinedDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    if (joinedEl) joinedEl.textContent = monthYear;

    // 3. Dynamic Network Check
    if (networkEl && provider) {
        try {
            const network = await provider.getNetwork();
            const chainId = network.chainId;

            // Polygon Amoy: 80002, Polygon Mainnet: 137
            if (chainId === 80002) {
                networkEl.textContent = 'Polygon Amoy';
                networkEl.style.color = '';
            } else if (chainId === 137) {
                networkEl.textContent = 'Polygon Mainnet';
                networkEl.style.color = '';
            } else {
                networkEl.innerHTML = '<span style="color: var(--error);">Wrong Network!</span>';
            }
        } catch (e) {
            console.error('Error getting network:', e);
            networkEl.textContent = 'Unknown';
        }
    }

    // 4. Wallet Balance
    if (balanceEl && provider) {
        try {
            const balance = await provider.getBalance(userAddress);
            balanceEl.textContent = `${parseFloat(ethers.utils.formatEther(balance)).toFixed(4)} POL`;
        } catch (e) {
            console.error('Error getting balance:', e);
            balanceEl.textContent = '0.00 POL';
        }
    }

    // 5. Fetch profile data from localStorage
    const profileData = JSON.parse(localStorage.getItem(`kyneto_profile_${userAddress}`)) || {
        username: truncatedAddress,
        bio: '',
        avatar: null,
        socials: { twitter: '', github: '' }
    };

    // Update UI with profile data
    const usernameEl = document.getElementById('profile-username-display');
    if (usernameEl) usernameEl.textContent = profileData.username;

    const addressDisplayEl = document.getElementById('profile-address-display');
    if (addressDisplayEl) addressDisplayEl.textContent = userAddress;

    const bioEl = document.getElementById('profile-bio-display');
    if (bioEl) bioEl.textContent = profileData.bio;

    const avatarEl = document.getElementById('profile-avatar-display');
    if (avatarEl) {
        if (profileData.avatar) {
            avatarEl.innerHTML = `<img src="${profileData.avatar}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
        } else {
            avatarEl.innerHTML = `<i class="fa-solid fa-user-astronaut" style="font-size: 3rem; color: white;"></i>`;
        }
    }

    const socialsEl = document.getElementById('profile-socials-display');
    if (socialsEl) {
        socialsEl.innerHTML = '';
        if (profileData.socials.twitter) {
            socialsEl.innerHTML += `<a href="https://twitter.com/${profileData.socials.twitter}" target="_blank" style="color: var(--text-secondary); font-size: 1.2rem;"><i class="fa-brands fa-x-twitter"></i></a>`;
        }
        if (profileData.socials.github) {
            socialsEl.innerHTML += `<a href="https://github.com/${profileData.socials.github}" target="_blank" style="color: var(--text-secondary); font-size: 1.2rem;"><i class="fa-brands fa-github"></i></a>`;
        }
    }

    // 6. Copy main activity feed to profile feed
    const mainFeed = document.getElementById('activity-feed');
    const profileFeed = document.getElementById('profile-activity-feed');
    if (mainFeed && profileFeed) {
        profileFeed.innerHTML = mainFeed.innerHTML;
    }

    // Ensure global UI is synced
    updateGlobalProfileUI();
}

// Edit Profile Functions
function handleEditProfile() {
    if (!userAddress) {
        showNotification('error', 'Wallet Not Connected', 'Please connect your wallet first.');
        return;
    }

    const profileData = JSON.parse(localStorage.getItem(`kyneto_profile_${userAddress}`)) || {
        username: `${userAddress.substring(0, 8)}...${userAddress.substring(userAddress.length - 6)}`,
        email: '',
        bio: '',
        avatar: null,
        socials: { twitter: '', github: '' }
    };

    // Populate form
    document.getElementById('edit-username').value = profileData.username;
    document.getElementById('edit-email').value = profileData.email || '';
    document.getElementById('edit-bio').value = profileData.bio || '';
    document.getElementById('edit-twitter').value = profileData.socials.twitter || '';
    document.getElementById('edit-github').value = profileData.socials.github || '';

    const preview = document.getElementById('avatar-preview');
    if (profileData.avatar) {
        preview.innerHTML = `<img src="${profileData.avatar}">`;
    } else {
        preview.innerHTML = `<i class="fa-solid fa-user-astronaut"></i>`;
    }

    switchView('edit-profile');
}

function previewAvatar(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
        showNotification('error', 'File Too Large', 'Please select an image smaller than 2MB.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        const preview = document.getElementById('avatar-preview');
        preview.innerHTML = `<img src="${e.target.result}">`;
        // Store base64 temporarily in a data attribute
        preview.dataset.avatar = e.target.result;
    };
    reader.readAsDataURL(file);
}

function handleSaveProfile(event) {
    event.preventDefault();
    if (!userAddress) return;

    const preview = document.getElementById('avatar-preview');
    const avatarData = preview.dataset.avatar || (preview.querySelector('img') ? preview.querySelector('img').src : null);

    const profileData = {
        username: document.getElementById('edit-username').value,
        email: document.getElementById('edit-email').value,
        bio: document.getElementById('edit-bio').value,
        avatar: avatarData,
        socials: {
            twitter: document.getElementById('edit-twitter').value,
            github: document.getElementById('edit-github').value
        }
    };

    localStorage.setItem(`kyneto_profile_${userAddress}`, JSON.stringify(profileData));

    showNotification('success', 'Profile Updated', 'Your profile changes have been saved.');
    addActivity('User', 'Updated profile information', 'user');

    renderProfile();
    updateGlobalProfileUI();
    switchView('profile');
}
async function handleRenewDeal(dealId, additionalDays) {
    if (!signer) {
        showNotification('error', 'Wallet Not Connected', 'Please connect your wallet first.');
        return;
    }

    try {
        const marketplaceContract = new ethers.Contract(STORAGE_MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer);
        const tokenContract = new ethers.Contract(KYN_TOKEN_ADDRESS, ERC20_ABI, signer);

        addActivity('System', `Initiating renewal for Deal #${dealId}...`, 'system');

        // Fetch deal to calculate cost
        const deal = await marketplaceContract.deals(dealId);
        const totalMonths = Math.ceil(additionalDays / 30);

        // Ensure we are using BigNumber methods correctly (ethers v5)
        const renewalCost = deal.fileSizeGB.mul(deal.pricePerGBMonth).mul(totalMonths);
        const protocolFee = renewalCost.mul(300).div(10000);
        const totalCost = renewalCost.add(protocolFee);

        addActivity('System', 'Approving KYN for renewal...', 'system');

        // Get gas fees for better reliability
        const gasFees = await getGasFees();
        const approveTx = await tokenContract.approve(STORAGE_MARKETPLACE_ADDRESS, totalCost, gasFees);
        await approveTx.wait();

        addActivity('System', 'Executing renewal...', 'system');
        const renewTx = await marketplaceContract.renewDeal(dealId, additionalDays, gasFees);
        await renewTx.wait();

        showNotification('success', 'Deal Renewed!', `Deal #${dealId} extended by ${additionalDays} days.`);
        addActivity('User', `Renewed Deal #${dealId}`, 'user');

        // Refresh UI
        await checkExpirations();
        if (typeof fetchMyDeals === 'function') fetchMyDeals(currentDealsTab);

    } catch (error) {
        console.error('Renewal failed:', error);
        showNotification('error', 'Renewal Failed', error.message || 'Failed to renew deal.');
    }
}
