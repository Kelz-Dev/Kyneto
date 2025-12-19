const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:3000' : `http://${window.location.hostname}:3000`;
let socket;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetchStats();
    fetchDeals();
    initWebSocket();

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

    socket.on('deal:created', (data) => {
        addActivity('New Deal', `Deal #${data.dealId} created for ${data.size} GB`, 'deal');
        fetchDeals();
    });

    socket.on('disconnect', () => {
        addActivity('System', 'Disconnected from event stream', 'system');
    });
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
