const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : `http://${window.location.hostname}:3000`;

let socket;
let provider;
let signer;
let userAddress;
let isProvider = false;
let modal;

// Initialize AppKit
async function initAppKit() {
    if (typeof window.createAppKit === 'undefined') {
        setTimeout(initAppKit, 100);
        return;
    }

    const projectId = 'YOUR_PROJECT_ID'; // User needs to replace this

    const metadata = {
        name: 'Incentive Layer',
        description: 'Decentralized Storage Incentive Layer',
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
        if (isConnected && address) {
            userAddress = address;
            provider = new ethers.providers.Web3Provider(appKitProvider);
            signer = provider.getSigner();
            updateWalletUI(true);
            addActivity('System', `Wallet connected: ${userAddress.substring(0, 6)}...${userAddress.substring(38)}`, 'system');
        } else {
            userAddress = null;
            provider = null;
            signer = null;
            updateWalletUI(false);
            addActivity('System', 'Wallet disconnected', 'system');
        }
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetchStats();
    fetchDeals();
    fetchEvents();
    initWebSocket();
    initAppKit();

    // Auto-refresh stats every 30 seconds
    setInterval(fetchStats, 30000);
});

async function fetchStats() {
    try {
        const response = await fetch(`${API_URL}/api/stats`);
        if (!response.ok) throw new Error('API Offline');

        const stats = await response.json();
        updateStatsUI(stats);
        setOnlineStatus(true);
    } catch (error) {
        console.error('Error fetching stats:', error);
        setOnlineStatus(false);
        // Use mock data for demo if API is offline
        updateStatsUI({
            active_deals: 12,
            active_providers: 5,
            total_capacity_gb: 5000,
            total_utilization_gb: 1250
        });
    }
}

function updateStatsUI(stats) {
    document.querySelector('#stat-deals .value').textContent = stats.active_deals || 0;
    document.querySelector('#stat-providers .value').textContent = stats.active_providers || 0;
    document.querySelector('#stat-capacity .value').textContent = `${stats.total_capacity_gb || 0} GB`;
    document.querySelector('#stat-revenue .value').textContent = `${stats.total_protocol_revenue || 0} STK`;
    document.querySelector('#stat-burned .value').textContent = `${stats.total_tokens_burned || 0} STK`;

    const utilization = stats.total_capacity_gb > 0
        ? Math.round((stats.total_utilization_gb / stats.total_capacity_gb) * 100)
        : 0;
    document.querySelector('#stat-utilization .value').textContent = `${utilization}%`;
}

async function fetchDeals() {
    try {
        const response = await fetch(`${API_URL}/api/deals`);
        const data = await response.json();
        renderDeals(data.deals);
    } catch (error) {
        console.error('Error fetching deals:', error);
        // Mock deals for demo
        renderDeals([
            { deal_id: '101', status: 'active', size_gb: 50, created_at: new Date().toISOString() },
            { deal_id: '102', status: 'pending', size_gb: 120, created_at: new Date().toISOString() }
        ]);
    }
}

function renderDeals(deals) {
    const tbody = document.querySelector('#deals-table tbody');
    tbody.innerHTML = '';

    deals.forEach(deal => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${deal.deal_id}</td>
            <td><span class="status-pill ${deal.status}">${deal.status}</span></td>
            <td>${deal.size_gb || 0} GB</td>
            <td>${new Date(deal.created_at).toLocaleDateString()}</td>
        `;
        tbody.appendChild(tr);
    });
}

function initWebSocket() {
    socket = io(API_URL);

    socket.on('connect', () => {
        console.log('Connected to WebSocket');
        addActivity('System', 'Connected to real-time event stream', 'system');
    });

    socket.on('heartbeat', (data) => {
        addActivity('Heartbeat', `Provider ${data.provider.substring(0, 8)}... is online`, 'heartbeat');
        fetchStats(); // Refresh stats on heartbeat
    });

    socket.on('protocol_event', (data) => {
        addActivity(data.event_type, data.description, data.event_type.toLowerCase());
        fetchStats();
        if (data.event_type === 'DEAL_CREATED') fetchDeals();
    });

    socket.on('disconnect', () => {
        addActivity('System', 'Disconnected from event stream', 'system');
    });
}

async function fetchEvents() {
    try {
        const response = await fetch(`${API_URL}/api/events`);
        const data = await response.json();
        const feed = document.getElementById('activity-feed');
        feed.innerHTML = ''; // Clear initial message

        data.events.reverse().forEach(event => {
            addActivity(event.event_type, event.description, event.event_type.toLowerCase());
        });
    } catch (error) {
        console.error('Error fetching events:', error);
    }
}

function addActivity(type, message, className) {
    const feed = document.getElementById('activity-feed');
    const item = document.createElement('div');
    item.className = `activity-item ${className}`;

    const now = new Date();
    const timeStr = now.getHours().toString().padStart(2, '0') + ':' +
        now.getMinutes().toString().padStart(2, '0') + ':' +
        now.getSeconds().toString().padStart(2, '0');

    item.innerHTML = `
        <span class="time">${timeStr}</span>
        <span class="msg"><strong>${type}:</strong> ${message}</span>
    `;

    feed.prepend(item);

    // Keep only last 20 items
    if (feed.children.length > 20) {
        feed.removeChild(feed.lastChild);
    }
}

function setOnlineStatus(isOnline) {
    const badge = document.getElementById('api-status');
    if (isOnline) {
        badge.classList.add('online');
        badge.querySelector('.text').textContent = 'API Online';
    } else {
        badge.classList.remove('online');
        badge.querySelector('.text').textContent = 'API Offline (Demo Mode)';
    }
}

function refreshDeals() {
    fetchDeals();
    addActivity('System', 'Refreshing deals list...', 'system');
}

// View Management
function switchView(viewId) {
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('onclick').includes(viewId)) {
            item.classList.add('active');
        }
    });

    // Update views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    document.getElementById(`${viewId}-view`).classList.add('active');

    // Update title
    const titles = {
        'dashboard': 'Network Dashboard',
        'marketplace': 'Storage Marketplace',
        'provider': 'Provider Portal',
        'governance': 'Protocol Governance',
        'create-deal': 'Create New Deal',
        'become-provider': 'Become a Provider'
    };
    document.getElementById('view-title').textContent = titles[viewId] || 'Incentive Layer';

    // Fetch view-specific data
    if (viewId === 'marketplace') fetchMarketplace();
}

async function handleCreateDeal(event) {
    event.preventDefault();
    const btn = event.target.querySelector('button');
    const originalText = btn.textContent;

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';

    try {
        // Simulate API call
        await new Promise(r => setTimeout(r, 1500));

        addActivity('System', 'New storage deal initiated successfully!', 'system');
        alert('Deal initiated! It will appear in the dashboard once confirmed by the network.');

        event.target.reset();
        switchView('dashboard');
    } catch (error) {
        alert('Failed to initiate deal. Please try again.');
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

async function fetchMarketplace() {
    const grid = document.querySelector('.marketplace-grid');
    grid.innerHTML = '<div class="loading">Fetching marketplace listings...</div>';

    try {
        // In a real app, this would be an API call
        // For now, we'll simulate with some high-quality mock data
        await new Promise(r => setTimeout(r, 800));

        const listings = [
            { id: 1, name: "Global Content Delivery", size: "500 GB", price: "12 STK/mo", providers: 15, rating: "4.9" },
            { id: 2, name: "Secure Archive Node", size: "2 TB", price: "45 STK/mo", providers: 20, rating: "5.0" },
            { id: 3, name: "High-Speed Edge Cache", size: "100 GB", price: "8 STK/mo", providers: 10, rating: "4.7" }
        ];

        grid.innerHTML = listings.map(item => `
            <div class="stat-card marketplace-item">
                <div class="item-info">
                    <h3>${item.name}</h3>
                    <p class="label">Capacity: ${item.size}</p>
                    <div class="item-meta">
                        <span class="price">${item.price}</span>
                        <span class="rating">⭐ ${item.rating}</span>
                    </div>
                </div>
                <button class="btn-primary" onclick="alert('Initiating deal for ${item.name}...')">Rent Now</button>
            </div>
        `).join('');
    } catch (error) {
        grid.innerHTML = '<div class="error">Failed to load marketplace.</div>';
    }
}

// Web3 & Wallet Connection
async function connectWallet() {
    if (modal) {
        modal.open();
    } else {
        alert('Wallet connection system is still loading. Please try again in a moment.');
    }
}

function updateWalletUI(isConnected) {
    const connectBtn = document.getElementById('connect-wallet-btn');
    const userProfile = document.getElementById('user-profile');
    const walletAddr = document.getElementById('wallet-address');

    if (isConnected && userAddress) {
        connectBtn.classList.add('hidden');
        userProfile.classList.remove('hidden');
        walletAddr.textContent = `${userAddress.substring(0, 6)}...${userAddress.substring(38)}`;
    } else {
        connectBtn.classList.remove('hidden');
        userProfile.classList.add('hidden');
    }
}

// Provider Registration Flow
async function handleStake() {
    if (!userAddress) return alert('Please connect your wallet first!');

    const btn = document.getElementById('stake-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Staking...';

    try {
        // Simulate blockchain transaction
        await new Promise(r => setTimeout(r, 2000));

        addActivity('System', 'Successfully staked 1,000 STK tokens!', 'system');
        document.getElementById('step-register').classList.remove('disabled');
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Staked';
    } catch (error) {
        alert('Staking failed. Please try again.');
        btn.disabled = false;
        btn.textContent = 'Stake 1,000 STK';
    }
}

async function handleRegisterNode(event) {
    event.preventDefault();
    const btn = event.target.querySelector('button');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Registering...';

    try {
        // Simulate registration
        await new Promise(r => setTimeout(r, 1500));

        isProvider = true;
        addActivity('System', 'Node registered successfully! You are now a storage provider.', 'system');

        document.getElementById('no-nodes-state').classList.add('hidden');
        document.getElementById('active-nodes-list').classList.remove('hidden');

        // Inject node into list
        document.getElementById('active-nodes-list').innerHTML = `
            <div class="stat-card">
                <div class="stat-info">
                    <span class="label">Node ID: ${userAddress.substring(0, 10)}...</span>
                    <span class="value">Online</span>
                </div>
                <button class="btn-secondary">Manage</button>
            </div>
        `;

        switchView('provider');
    } catch (error) {
        alert('Registration failed.');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Register Node';
    }
}
