const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3002'
    : `http://${window.location.hostname}:3002`;

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
    "function decimals() public view returns (uint8)"
];

const CAPACITY_PLEDGE_ABI = [
    "function createPledge(uint256 capacityGB, uint256 duration, uint256 collateralAmount) external",
    "function calculateMinimumCollateral(uint256 capacityGB, uint256 duration) public pure returns (uint256)",
    "function getPledge(address provider, uint256 pledgeId) public view returns (uint256, uint256, uint256, uint256, uint256, uint256, bool)"
];

const MARKETPLACE_ABI = [
    "function createDeal(string fileCID, uint256 fileSizeGB, uint256 durationDays, uint256 pricePerGBMonth, address[] selectedProviders, string[] shardCIDs, uint256[] shardSizes) external returns (uint256)",
    "function getDeal(uint256 dealId) external view returns (address, string, uint256, uint256, uint256, uint256, uint256, uint256, uint8)",
    "function dealCount() public view returns (uint256)"
];

const REGISTRY_ABI = [
    "function registerProvider(string peerId, string endpoint, string region) external",
    "function providers(address) public view returns (bool, uint256, uint256, uint256, string, string, string, uint256, uint256, uint256, bool, uint256)",
    "function isProviderActive(address provider) public view returns (bool)"
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

const DISTRIBUTOR_ABI = [
    "function withdrawEarnings() external",
    "function getAvailableEarnings(address provider) external view returns (uint256)",
    "function getEarningsBreakdown(address provider) external view returns (uint256, uint256, uint256, uint256, uint256, uint256)"
];

// Contract Addresses (Hardcoded for Polygon Amoy - Update these with your deployed addresses)
const KYN_TOKEN_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const CAPACITY_PLEDGE_ADDRESS = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
const STORAGE_MARKETPLACE_ADDRESS = '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0';
const PROVIDER_REGISTRY_ADDRESS = '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9';
const PROOF_VERIFIER_ADDRESS = '0xDc64a140AaAbE83A934856a75F19704b0874cc45';
const SLASHING_MANAGER_ADDRESS = '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707';
const PAYMENT_DISTRIBUTOR_ADDRESS = '0x0165878A594ca255338adfa4d48449f69242Eb8F';
const TOKEN_VESTING_ADDRESS = '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853';

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
        region: 'na'
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
async function initAppKit() {
    if (typeof window.createAppKit === 'undefined') {
        setTimeout(initAppKit, 100);
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
        if (isConnected && address) {
            userAddress = address;
            provider = new ethers.providers.Web3Provider(appKitProvider);
            signer = provider.getSigner();
            updateWalletUI(true);
            addActivity('System', `Wallet connected (AppKit): ${userAddress.substring(0, 6)}...${userAddress.substring(38)}`, 'system');
        } else {
            userAddress = null;
            updateWalletUI(false);
        }
    });

    // Initial check
    const isConnected = modal.getIsConnected();
    if (isConnected) {
        const addr = modal.getAddress();
        if (addr) {
            userAddress = addr;
            updateWalletUI(true);
        }
    } else {
        updateWalletUI(false);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    fetchStats();
    fetchDeals();
    fetchMarketplace();
    fetchEvents();
    initWebSocket();
    initAppKit();

    // Auto-refresh stats every 30 seconds
    setInterval(fetchStats, 30000);

    // Check if wallet is already connected
    if (typeof window.ethereum !== 'undefined') {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                userAddress = accounts[0];
                updateWalletUI(true);
            } else {
                updateWalletUI(false);
            }
        } catch (e) {
            console.error('Error checking wallet status:', e);
            updateWalletUI(false);
        }
    } else {
        updateWalletUI(false);
    }

    // File Upload Listeners
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');

    if (uploadArea && fileInput) {
        uploadArea.addEventListener('click', () => fileInput.click());

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFileSelect(files[0]);
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFileSelect(e.target.files[0]);
            }
        });
    }

    // Sidebar Toggle Listener
    const sidebarToggle = document.getElementById('sidebar-toggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
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

    if (uploadArea && fileInfo) {
        uploadArea.classList.add('hidden');
        fileInfo.classList.remove('hidden');
        fileName.textContent = file.name;

        const sizeInMB = file.size / (1024 * 1024);
        const sizeInGB = sizeInMB / 1024;
        fileSize.textContent = formatBytes(file.size);

        // Auto-fill deal size
        if (dealSizeInput) dealSizeInput.value = sizeInGB.toFixed(4);

        // Detect and display file category
        const category = detectFileCategory(file.name);
        if (fileType) fileType.textContent = category;

        // Simulate CID generation
        if (cidGroup && cidInput) {
            cidGroup.classList.remove('hidden');
            cidInput.value = `ipfs://Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
        }

        addActivity('User', `Selected file: ${file.name} (${category})`, 'user');
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
        const response = await fetch(`${API_URL}/api/stats`);
        if (!response.ok && response.status !== 304) throw new Error('API Offline');

        const stats = response.status === 304 ? null : await response.json();
        if (stats) updateStatsUI(stats);
        setOnlineStatus(true);
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
    if (revenue) revenue.textContent = `${stats.total_protocol_revenue || 0} KYN`;
    if (burned) burned.textContent = `${stats.total_tokens_burned || 0} KYN`;

    const utilization = stats.total_capacity_gb > 0
        ? Math.round((stats.total_utilization_gb / stats.total_capacity_gb) * 100)
        : 0;
    if (utilizationElem) utilizationElem.textContent = `${utilization}%`;
}

async function fetchDeals() {
    try {
        const response = await fetch(`${API_URL}/api/deals`);
        const data = await response.json();
        renderDeals(data.deals);
    } catch (error) {
        console.error('Error fetching deals:', error);
        renderDeals([]);
    }
}

function renderDeals(deals) {
    const tbody = document.querySelector('#deals-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (deals.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem;">No deals found</td></tr>';
        return;
    }

    deals.forEach(deal => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${deal.deal_id}</td>
            <td><span class="status-pill ${deal.status}">${deal.status}</span></td>
            <td>${deal.file_size_gb || 0} GB</td>
            <td>${new Date(deal.created_at).toLocaleDateString()}</td>
            <td>
                <button class="btn-secondary btn-sm" onclick="viewFile('${deal.file_cid}')">
                    <i class="fa-solid fa-eye"></i> View
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Also update My Files table if it exists
    renderFiles(deals);
}

function renderFiles(deals) {
    const tbody = document.querySelector('#files-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (deals.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem;">No files found</td></tr>';
        return;
    }

    deals.forEach(deal => {
        const tr = document.createElement('tr');
        // Extract a filename from CID or metadata if available, otherwise use Deal ID
        const fileName = `File_${deal.deal_id}`;
        tr.innerHTML = `
            <td>${fileName}</td>
            <td style="font-family: monospace; font-size: 0.8rem;">${deal.file_cid}</td>
            <td>${deal.file_size_gb} GB</td>
            <td>${new Date(deal.created_at).toLocaleDateString()}</td>
            <td>
                <button class="btn-secondary btn-sm" onclick="viewFile('${deal.file_cid}')">
                    <i class="fa-solid fa-download"></i> Retrieve
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
            <div class="empty-state">
                <p>No active deals in the marketplace.</p>
            </div>
        `;
        return;
    }

    deals.forEach(deal => {
        const card = document.createElement('div');
        card.className = 'stat-card';
        card.innerHTML = `
            <div class="stat-icon"><i class="fa-solid fa-box"></i></div>
            <div class="stat-info">
                <span class="label">Deal #${deal.deal_id}</span>
                <span class="value">${deal.file_size_gb} GB</span>
                <span class="label" style="font-size: 0.7rem; margin-top: 5px; word-break: break-all;">${deal.file_cid}</span>
            </div>
            <button class="btn-primary btn-sm" onclick="viewFile('${deal.file_cid}')" style="margin-left: auto">
                <i class="fa-solid fa-download"></i>
            </button>
        `;
        grid.appendChild(card);
    });
}

function viewFile(cid) {
    if (!cid) return;
    // Use a public IPFS gateway for viewing
    const gatewayUrl = `https://ipfs.io/ipfs/${cid.replace('ipfs://', '')}`;
    window.open(gatewayUrl, '_blank');
    addActivity('User', `Viewing file: ${cid}`, 'user');
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
    if (modal && projectId !== 'YOUR_PROJECT_ID') {
        modal.open();
    } else {
        console.log('Falling back to direct MetaMask connection');
        if (typeof window.ethereum !== 'undefined') {
            try {
                const chainId = await window.ethereum.request({ method: 'eth_chainId' });
                if (chainId !== AMOY_CHAIN_ID) {
                    await switchNetwork();
                }

                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                userAddress = accounts[0];
                provider = new ethers.providers.Web3Provider(window.ethereum);
                signer = provider.getSigner();
                updateWalletUI(true);
                addActivity('System', `Wallet connected (Direct - Amoy): ${userAddress.substring(0, 6)}...${userAddress.substring(38)}`, 'system');

                window.ethereum.on('accountsChanged', (accounts) => {
                    if (accounts.length > 0) {
                        userAddress = accounts[0];
                        updateWalletUI(true);
                    } else {
                        userAddress = null;
                        updateWalletUI(false);
                    }
                });

                window.ethereum.on('chainChanged', () => {
                    window.location.reload();
                });
            } catch (error) {
                console.error('User rejected connection or network switch:', error);
            }
        } else {
            alert('MetaMask not detected! Please install MetaMask to test the wallet connection.');
        }
    }
}

async function disconnectWallet() {
    if (modal) {
        try {
            await modal.disconnect();
        } catch (e) {
            console.log('AppKit disconnect failed or not applicable:', e);
        }
    }

    // Attempt to revoke MetaMask permissions
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

    userAddress = null;
    updateWalletUI(false);
    addActivity('System', 'Wallet disconnected', 'system');

    // Close dropdowns
    const sidebarDropdown = document.getElementById('sidebar-dropdown');
    const profileDropdown = document.getElementById('profile-dropdown');
    if (sidebarDropdown) sidebarDropdown.classList.add('hidden');
    if (profileDropdown) profileDropdown.classList.add('hidden');
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

    console.log('Updating Wallet UI:', { isConnected, userAddress });

    // Force check if userAddress is present
    if (userAddress) {
        isConnected = true;
    }

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

        // Update Sidebar
        if (sidebarName) sidebarName.textContent = 'User Node';
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
        }

        // Simulate data for detail views
        if (viewId.includes('detail')) {
            simulateDetailData(viewId);
        }
    }
}

function simulateDetailData(viewId) {
    if (viewId === 'utilization-detail') {
        const list = document.getElementById('usage-breakdown-list');
        if (list) {
            const types = [
                { name: 'Video Streaming', val: 45, color: '#7c4dff' },
                { name: 'Scientific Data', val: 25, color: '#00e676' },
                { name: 'Backups', val: 15, color: '#ffab40' },
                { name: 'Web Assets', val: 10, color: '#00f2fe' },
                { name: 'General Data', val: 5, color: '#ff5252' }
            ];
            list.innerHTML = types.map(t => `
                <div class="usage-item">
                    <div class="usage-info">
                        <span class="name">${t.name}</span>
                        <div class="usage-bar-mini">
                            <div class="usage-fill-mini" style="width: ${t.val}%; background: ${t.color}"></div>
                        </div>
                    </div>
                    <span class="val">${t.val}%</span>
                </div>
            `).join('');
        }
    }
    // Add other simulations as needed...
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
    if (!userAddress || !signer) {
        showNotification('error', 'Wallet Not Connected', 'Please connect your wallet first.');
        return;
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
        stakeBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Approving...';

        const tokenContract = new ethers.Contract(KYN_TOKEN_ADDRESS, ERC20_ABI, signer);
        const amount = ethers.utils.parseUnits("1000", 18);

        addActivity('System', 'Initiating KYN approval...', 'system');

        // Request approval
        const tx = await tokenContract.approve(CAPACITY_PLEDGE_ADDRESS, amount);

        showNotification('info', 'Transaction Pending', 'KYN approval transaction submitted.');
        addActivity('System', `Approval pending: ${tx.hash.substring(0, 10)}...`, 'system');

        await tx.wait();

        showNotification('success', 'Approval Successful', 'KYN tokens approved for staking.');
        addActivity('User', 'Approved 1,000 KYN for staking', 'user');

        stakeBtn.textContent = 'Staked ✓';
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
        console.error('Staking failed:', error);
        showNotification('error', 'Transaction Failed', error.message || 'Failed to approve tokens.');
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

    if (!userAddress || !signer) {
        showNotification('error', 'Wallet Not Connected', 'Please connect your wallet first.');
        return;
    }

    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    try {
        submitBtn.disabled = true;

        if (KYN_TOKEN_ADDRESS && CAPACITY_PLEDGE_ADDRESS && PROVIDER_REGISTRY_ADDRESS) {
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Registering...';

            const peerId = document.getElementById('reg-peer-id').value;
            const endpoint = document.getElementById('reg-endpoint').value;
            const capacity = document.getElementById('reg-capacity').value;
            const region = document.getElementById('provider-region').value;

            const registryContract = new ethers.Contract(PROVIDER_REGISTRY_ADDRESS, REGISTRY_ABI, signer);
            const pledgeContract = new ethers.Contract(CAPACITY_PLEDGE_ADDRESS, CAPACITY_PLEDGE_ABI, signer);

            addActivity('System', 'Registering provider in registry...', 'system');

            // 1. Register in ProviderRegistry
            const regTx = await registryContract.registerProvider(peerId, endpoint, region);
            showNotification('info', 'Registration Pending', 'Provider registration transaction submitted.');
            await regTx.wait();
            addActivity('System', 'Provider registered successfully', 'system');

            // 2. Create Capacity Pledge
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Pledging...';
            const duration = 30 * 24 * 60 * 60; // 30 days
            const collateral = ethers.utils.parseUnits("1000", 18);

            addActivity('System', 'Creating capacity pledge...', 'system');
            const pledgeTx = await pledgeContract.createPledge(capacity, duration, collateral);
            showNotification('info', 'Pledge Pending', 'Pledge transaction submitted.');
            await pledgeTx.wait();

            showNotification('success', 'Node Fully Registered!', `Successfully registered node with ${capacity} GB.`);
        }

        addActivity('User', `Registered node with ${capacity} GB capacity in ${region.toUpperCase()}`, 'user');

        // Safely update elements if they exist
        const noNodesState = document.getElementById('no-nodes-state');
        const activeNodesList = document.getElementById('active-nodes-list');
        const storageManagement = document.getElementById('storage-management');
        const pledgedValue = document.getElementById('pledged-value');
        const remainingValue = document.getElementById('remaining-value');

        if (noNodesState) noNodesState.classList.add('hidden');
        if (activeNodesList) {
            activeNodesList.classList.remove('hidden');
            activeNodesList.innerHTML = `
            <div class="stat-card">
                <div class="stat-icon"><i class="fa-solid fa-server"></i></div>
                <div class="stat-info">
                    <span class="label">Node ID: 0x${Math.random().toString(16).substring(2, 10)}...</span>
                    <span class="value">${formatStorage(capacity)} Pledged</span>
                </div>
                <div class="node-actions" style="margin-left: auto; display: flex; gap: 10px;">
                    <button class="btn-secondary btn-sm" onclick="submitProof(1)">
                        <i class="fa-solid fa-shield-check"></i> Submit Proof
                    </button>
                    <button class="btn-secondary btn-sm" onclick="switchView('upgrade-pledge')">
                        <i class="fa-solid fa-circle-up"></i> Upgrade
                    </button>
                </div>
            </div>
        `;
        }
        if (storageManagement) storageManagement.classList.remove('hidden');

        // Update stats if elements exist
        const uptimeEl = document.getElementById('provider-stat-uptime');
        if (uptimeEl) {
            const valueEl = uptimeEl.querySelector('.value');
            if (valueEl) valueEl.textContent = '99.9%';
        }

        // Update global state
        currentPledgedCapacity = parseInt(capacity);

        if (pledgedValue) pledgedValue.textContent = formatStorage(currentPledgedCapacity);
        if (remainingValue) remainingValue.textContent = formatStorage(currentPledgedCapacity);

        // Update current pledge display
        const currentCapacityDisplay = document.getElementById('current-capacity-display');
        if (currentCapacityDisplay) currentCapacityDisplay.textContent = formatStorage(currentPledgedCapacity);

        // Animate reputation
        animateReputation(98);

        // User feedback with custom notification
        showNotification('success', 'Node Registered!', `Successfully registered node with ${formatStorage(capacity)} capacity in ${region.toUpperCase()}.`);

        // Automatically switch back to provider portal to show the new node
        setTimeout(() => {
            switchView('provider');
        }, 1500);

    } catch (error) {
        console.error('Registration failed:', error);
        showNotification('error', 'Registration Failed', error.message || 'Failed to register node.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

function animateReputation(target) {
    const gauge = document.getElementById('reputation-gauge');
    const value = document.getElementById('reputation-value');
    const status = document.getElementById('reputation-status');

    let current = 0;
    const interval = setInterval(() => {
        if (current >= target) {
            clearInterval(interval);
        } else {
            current++;
            value.textContent = current;
            gauge.style.background = `conic-gradient(var(--primary-color) ${current * 3.6}deg, rgba(255, 255, 255, 0.05) 0deg)`;
        }
    }, 20);

    status.textContent = 'Excellent';
    status.style.color = 'var(--success)';
}

function handleUpgradePledge(event) {
    event.preventDefault();
    const additionalInput = document.getElementById('additional-capacity');
    if (!additionalInput || !additionalInput.value) {
        showNotification('error', 'Error', 'Please enter additional capacity.');
        return;
    }

    const additional = parseInt(additionalInput.value);
    const previousCapacity = currentPledgedCapacity;
    currentPledgedCapacity += additional;

    addActivity('User', `Upgraded pledge by ${additional} GB (Total: ${currentPledgedCapacity} GB)`, 'user');

    // Update displays
    const pledgedValue = document.getElementById('pledged-value');
    const remainingValue = document.getElementById('remaining-value');
    const currentCapacityDisplay = document.getElementById('current-capacity-display');
    const currentStakeDisplay = document.getElementById('current-stake-display');

    if (pledgedValue) pledgedValue.textContent = formatStorage(currentPledgedCapacity);
    if (remainingValue) remainingValue.textContent = formatStorage(currentPledgedCapacity);
    if (currentCapacityDisplay) currentCapacityDisplay.textContent = formatStorage(currentPledgedCapacity);
    if (currentStakeDisplay) currentStakeDisplay.textContent = `${(currentPledgedCapacity * 10).toLocaleString()} KYN`;

    showNotification('success', 'Upgrade Successful!', `Added ${formatStorage(additional)} to your pledge. Total capacity: ${formatStorage(currentPledgedCapacity)} (was ${formatStorage(previousCapacity)}).`);
    switchView('provider');
}

async function handleCreateDeal(event) {
    event.preventDefault();
    const size = document.getElementById('deal-size').value;
    const cid = document.getElementById('file-cid').value || 'Qm' + Math.random().toString(36).substring(2, 15);

    if (!userAddress || !signer) {
        showNotification('error', 'Wallet Not Connected', 'Please connect your wallet first.');
        return;
    }

    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creating Deal...';

        if (STORAGE_MARKETPLACE_ADDRESS && KYN_TOKEN_ADDRESS) {
            const marketplaceContract = new ethers.Contract(STORAGE_MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer);
            const tokenContract = new ethers.Contract(KYN_TOKEN_ADDRESS, ERC20_ABI, signer);

            // 1. Calculate cost (simulated: 0.1 KYN per GB/Month)
            const durationDays = 30;
            const pricePerGBMonth = ethers.utils.parseUnits("0.1", 18);
            const totalCost = pricePerGBMonth.mul(Math.ceil(size));

            addActivity('System', 'Approving KYN for deal...', 'system');
            const approveTx = await tokenContract.approve(STORAGE_MARKETPLACE_ADDRESS, totalCost);
            await approveTx.wait();

            // 2. Select 15 providers (simulated for now - in production fetch from Registry)
            // We'll use some dummy addresses if we don't have enough real ones
            const selectedProviders = Array(15).fill(0).map(() => ethers.Wallet.createRandom().address);
            const shardCIDs = Array(15).fill(0).map(() => cid + '_shard');
            const shardSizes = Array(15).fill(0).map(() => Math.ceil(size * 1024 / 10)); // Simplified

            addActivity('System', 'Initiating marketplace deal...', 'system');
            const dealTx = await marketplaceContract.createDeal(
                cid,
                size,
                durationDays,
                pricePerGBMonth,
                selectedProviders,
                shardCIDs,
                shardSizes
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

            const porepTx = await proofVerifier.submitPoRep(dealId, sealedCID, unsealedCID, proofData);
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

async function fetchEarnings() {
    if (!userAddress || !PAYMENT_DISTRIBUTOR_ADDRESS) return;

    try {
        const distributor = new ethers.Contract(PAYMENT_DISTRIBUTOR_ADDRESS, DISTRIBUTOR_ABI, provider);
        const breakdown = await distributor.getEarningsBreakdown(userAddress);

        // breakdown: [capacity, usage, bonuses, total, withdrawn, available]
        const available = ethers.utils.formatUnits(breakdown[5], 18);
        const total = ethers.utils.formatUnits(breakdown[3], 18);

        const earningsValue = document.getElementById('provider-stat-earnings').querySelector('.value');
        if (earningsValue) earningsValue.textContent = `${parseFloat(available).toFixed(2)} KYN`;

        return {
            available,
            total,
            withdrawn: ethers.utils.formatUnits(breakdown[4], 18)
        };
    } catch (error) {
        console.error('Error fetching earnings:', error);
    }
}

async function withdrawEarnings() {
    if (!userAddress || !signer || !PAYMENT_DISTRIBUTOR_ADDRESS) return;

    try {
        const distributor = new ethers.Contract(PAYMENT_DISTRIBUTOR_ADDRESS, DISTRIBUTOR_ABI, signer);
        const available = await distributor.getAvailableEarnings(userAddress);

        if (available.eq(0)) {
            showNotification('info', 'No Earnings', 'You have no earnings available to withdraw.');
            return;
        }

        addActivity('System', 'Initiating earnings withdrawal...', 'system');
        const tx = await distributor.withdrawEarnings();
        showNotification('info', 'Withdrawal Pending', 'Withdrawal transaction submitted.');
        await tx.wait();

        showNotification('success', 'Withdrawal Successful', `Successfully withdrawn ${ethers.utils.formatUnits(available, 18)} KYN.`);
        addActivity('User', `Withdrew ${ethers.utils.formatUnits(available, 18)} KYN from earnings`, 'user');

        fetchEarnings(); // Refresh
    } catch (error) {
        console.error('Withdrawal failed:', error);
        showNotification('error', 'Withdrawal Failed', error.message || 'Failed to withdraw earnings.');
    }
}

async function submitProof(dealId) {
    if (!userAddress || !signer || !PROOF_VERIFIER_ADDRESS) return;

    try {
        const verifier = new ethers.Contract(PROOF_VERIFIER_ADDRESS, PROOF_VERIFIER_ABI, signer);

        // In a real app, we would fetch the challengeId first
        // For simulation, we'll just show the process
        addActivity('System', `Submitting Proof of Spacetime (PoSt) for Deal #${dealId}...`, 'system');

        const sectorProofs = Array(10).fill(0).map(() => ethers.utils.hexlify(ethers.utils.randomBytes(32)));
        const challengeId = 0; // Simulated

        const tx = await verifier.submitPoSt(challengeId, sectorProofs);
        showNotification('info', 'Proof Pending', 'PoSt submission transaction submitted.');
        await tx.wait();

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

function handleCreateProposal() {
    const recommendations = [
        "Increase Storage Rewards by 5%",
        "Decrease Slashing Penalty",
        "Add New Supported Region: Antarctica",
        "Upgrade Network Protocol v2.0",
        "Fund Developer Grant: IPFS Integration"
    ];

    const choice = prompt("Create Proposal - Select a recommendation (1-5):\n" + recommendations.map((r, i) => `${i + 1}. ${r}`).join("\n"));

    if (choice && choice >= 1 && choice <= 5) {
        addActivity('User', `Created proposal: ${recommendations[choice - 1]}`, 'user');
        alert(`Proposal created: ${recommendations[choice - 1]}`);
    }
}

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

// Initialize theme on load
document.addEventListener('DOMContentLoaded', loadSavedTheme);
