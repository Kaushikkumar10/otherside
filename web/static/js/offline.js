// Offline Support and Data Synchronization Module
class OfflineManager {
    constructor(app) {
        this.app = app;
        this.isOnline = navigator.onLine;
        this.syncQueue = [];
        this.offlineStorage = new OfflineStorage();
        
        // Service worker
        this.serviceWorker = null;
        
        // Sync settings
        this.maxRetries = 3;
        this.retryDelay = 5000; // 5 seconds
        this.batchSize = 10;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.registerServiceWorker();
        this.loadOfflineData();
        
        console.log('Offline manager initialized');
    }
    
    setupEventListeners() {
        // Network status changes
        window.addEventListener('online', () => {
            this.handleOnline();
        });
        
        window.addEventListener('offline', () => {
            this.handleOffline();
        });
        
        // Service worker messages
        navigator.serviceWorker?.addEventListener('message', (event) => {
            this.handleServiceWorkerMessage(event);
        });
        
        // Page visibility changes (for background sync)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.isOnline) {
                this.processSync();
            }
        });
    }
    
    async registerServiceWorker() {
        if (!('serviceWorker' in navigator)) {
            console.log('Service Worker not supported');
            return;
        }
        
        try {
            const registration = await navigator.serviceWorker.register('/static/sw.js');
            this.serviceWorker = registration;
            
            console.log('Service Worker registered:', registration);
            
            // Handle service worker updates
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker?.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        this.showUpdateAvailable();
                    }
                });
            });
            
        } catch (error) {
            console.error('Service Worker registration failed:', error);
        }
    }
    
    showUpdateAvailable() {
        this.app.showAlert(
            'A new version is available. Reload to update.',
            'info',
            10000
        );
    }
    
    handleOnline() {
        console.log('App came online');
        this.isOnline = true;
        
        // Update UI
        this.app.updateConnectionStatus();
        
        // Start sync process
        setTimeout(() => {
            this.processSync();
        }, 1000); // Delay to ensure connection is stable
    }
    
    handleOffline() {
        console.log('App went offline');
        this.isOnline = false;
        
        // Update UI
        this.app.updateConnectionStatus();
        
        // Show offline notification
        this.app.showAlert(
            'You are now offline. Data will be saved locally and synced when connection is restored.',
            'warning',
            8000
        );
    }
    
    handleServiceWorkerMessage(event) {
        const { type, data } = event.data;
        
        switch (type) {
            case 'SYNC_BACKGROUND':
                this.processSyncInBackground();
                break;
            case 'CACHE_UPDATED':
                console.log('Cache updated:', data);
                break;
            case 'OFFLINE_FALLBACK':
                this.handleOfflineFallback(data);
                break;
        }
    }
    
    // Offline data storage and queuing
    
    async saveOfflineSession(sessionData) {
        try {
            await this.offlineStorage.saveSession(sessionData);
            this.queueForSync('session', 'create', sessionData);
            
            console.log('Session saved offline:', sessionData.id);
            
        } catch (error) {
            console.error('Failed to save session offline:', error);
        }
    }
    
    async saveOfflineEVP(sessionId, evpData) {
        try {
            await this.offlineStorage.saveEVP(sessionId, evpData);
            this.queueForSync('evp', 'create', { sessionId, evpData });
            
            console.log('EVP saved offline for session:', sessionId);
            
        } catch (error) {
            console.error('Failed to save EVP offline:', error);
        }
    }
    
    async saveOfflineVOX(sessionId, voxData) {
        try {
            await this.offlineStorage.saveVOX(sessionId, voxData);
            this.queueForSync('vox', 'create', { sessionId, voxData });
            
            console.log('VOX saved offline for session:', sessionId);
            
        } catch (error) {
            console.error('Failed to save VOX offline:', error);
        }
    }
    
    async saveOfflineRadar(sessionId, radarData) {
        try {
            await this.offlineStorage.saveRadar(sessionId, radarData);
            this.queueForSync('radar', 'create', { sessionId, radarData });
            
            console.log('Radar event saved offline for session:', sessionId);
            
        } catch (error) {
            console.error('Failed to save radar event offline:', error);
        }
    }
    
    async saveOfflineSLS(sessionId, slsData) {
        try {
            await this.offlineStorage.saveSLS(sessionId, slsData);
            this.queueForSync('sls', 'create', { sessionId, slsData });
            
            console.log('SLS detection saved offline for session:', sessionId);
            
        } catch (error) {
            console.error('Failed to save SLS detection offline:', error);
        }
    }
    
    async saveOfflineInteraction(sessionId, interactionData) {
        try {
            await this.offlineStorage.saveInteraction(sessionId, interactionData);
            this.queueForSync('interaction', 'create', { sessionId, interactionData });
            
            console.log('Interaction saved offline for session:', sessionId);
            
        } catch (error) {
            console.error('Failed to save interaction offline:', error);
        }
    }
    
    queueForSync(type, action, data) {
        const syncItem = {
            id: Date.now() + Math.random(),
            type: type,
            action: action,
            data: data,
            timestamp: new Date().toISOString(),
            retries: 0,
            status: 'pending'
        };
        
        this.syncQueue.push(syncItem);
        this.saveSyncQueue();
        
        // Try immediate sync if online
        if (this.isOnline) {
            setTimeout(() => this.processSync(), 100);
        }
    }
    
    async loadOfflineData() {
        try {
            // Load sync queue from storage
            const savedQueue = localStorage.getItem('otherside_sync_queue');
            if (savedQueue) {
                this.syncQueue = JSON.parse(savedQueue);
            }
            
            // Load cached sessions
            const offlineSessions = await this.offlineStorage.getAllSessions();
            if (offlineSessions.length > 0) {
                console.log(`Loaded ${offlineSessions.length} offline sessions`);
                // Could merge with online sessions here
            }
            
        } catch (error) {
            console.error('Failed to load offline data:', error);
        }
    }
    
    saveSyncQueue() {
        try {
            localStorage.setItem('otherside_sync_queue', JSON.stringify(this.syncQueue));
        } catch (error) {
            console.error('Failed to save sync queue:', error);
        }
    }
    
    // Synchronization processing
    
    async processSync() {
        if (!this.isOnline || this.syncQueue.length === 0) {
            return;
        }
        
        console.log(`Processing sync queue: ${this.syncQueue.length} items`);
        
        const pendingItems = this.syncQueue.filter(item => 
            item.status === 'pending' && item.retries < this.maxRetries
        );
        
        // Process in batches
        const batches = this.chunkArray(pendingItems, this.batchSize);
        
        for (const batch of batches) {
            await this.processSyncBatch(batch);
            
            // Small delay between batches
            await this.delay(500);
        }
        
        // Clean up completed items
        this.cleanupSyncQueue();
    }
    
    async processSyncBatch(batch) {
        const syncPromises = batch.map(item => this.syncItem(item));
        
        try {
            await Promise.allSettled(syncPromises);
        } catch (error) {
            console.error('Batch sync error:', error);
        }
    }
    
    async syncItem(item) {
        try {
            item.status = 'syncing';
            this.saveSyncQueue();
            
            let success = false;
            
            switch (item.type) {
                case 'session':
                    success = await this.syncSession(item);
                    break;
                case 'evp':
                    success = await this.syncEVP(item);
                    break;
                case 'vox':
                    success = await this.syncVOX(item);
                    break;
                case 'radar':
                    success = await this.syncRadar(item);
                    break;
                case 'sls':
                    success = await this.syncSLS(item);
                    break;
                case 'interaction':
                    success = await this.syncInteraction(item);
                    break;
                default:
                    console.warn('Unknown sync item type:', item.type);
                    success = false;
            }
            
            if (success) {
                item.status = 'completed';
                console.log(`Synced ${item.type}:`, item.id);
            } else {
                throw new Error(`Failed to sync ${item.type}`);
            }
            
        } catch (error) {
            console.error(`Sync failed for ${item.type}:`, error);
            
            item.retries++;
            item.status = 'failed';
            item.lastError = error.message;
            
            if (item.retries >= this.maxRetries) {
                console.error(`Max retries exceeded for ${item.type}:`, item.id);
            }
        }
        
        this.saveSyncQueue();
    }
    
    async syncSession(item) {
        try {
            const response = await fetch(`${this.app.apiBaseUrl}/sessions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(item.data)
            });
            
            if (response.ok) {
                const result = await response.json();
                // Update local storage with server ID
                await this.offlineStorage.updateSessionId(item.data.id, result.id);
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Session sync error:', error);
            return false;
        }
    }
    
    async syncEVP(item) {
        try {
            const { sessionId, evpData } = item.data;
            
            const formData = new FormData();
            if (evpData.audioBlob) {
                formData.append('audio', evpData.audioBlob, 'evp-recording.webm');
            }
            formData.append('annotations', JSON.stringify(evpData.annotations || []));
            
            const response = await fetch(
                `${this.app.apiBaseUrl}/sessions/${sessionId}/evp`,
                {
                    method: 'POST',
                    body: formData
                }
            );
            
            return response.ok;
        } catch (error) {
            console.error('EVP sync error:', error);
            return false;
        }
    }
    
    async syncVOX(item) {
        try {
            const { sessionId, voxData } = item.data;
            
            const response = await fetch(
                `${this.app.apiBaseUrl}/sessions/${sessionId}/vox`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(voxData)
                }
            );
            
            return response.ok;
        } catch (error) {
            console.error('VOX sync error:', error);
            return false;
        }
    }
    
    async syncRadar(item) {
        try {
            const { sessionId, radarData } = item.data;
            
            const response = await fetch(
                `${this.app.apiBaseUrl}/sessions/${sessionId}/radar`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(radarData)
                }
            );
            
            return response.ok;
        } catch (error) {
            console.error('Radar sync error:', error);
            return false;
        }
    }
    
    async syncSLS(item) {
        try {
            const { sessionId, slsData } = item.data;
            
            const response = await fetch(
                `${this.app.apiBaseUrl}/sessions/${sessionId}/sls`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(slsData)
                }
            );
            
            return response.ok;
        } catch (error) {
            console.error('SLS sync error:', error);
            return false;
        }
    }
    
    async syncInteraction(item) {
        try {
            const { sessionId, interactionData } = item.data;
            
            const response = await fetch(
                `${this.app.apiBaseUrl}/sessions/${sessionId}/interactions`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(interactionData)
                }
            );
            
            return response.ok;
        } catch (error) {
            console.error('Interaction sync error:', error);
            return false;
        }
    }
    
    cleanupSyncQueue() {
        const before = this.syncQueue.length;
        
        // Remove completed items older than 24 hours
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        this.syncQueue = this.syncQueue.filter(item => {
            if (item.status === 'completed') {
                const itemDate = new Date(item.timestamp);
                return itemDate > oneDayAgo;
            }
            return true;
        });
        
        // Remove failed items that exceeded max retries
        this.syncQueue = this.syncQueue.filter(item => 
            item.status !== 'failed' || item.retries < this.maxRetries
        );
        
        if (this.syncQueue.length !== before) {
            this.saveSyncQueue();
        }
        
        console.log(`Cleaned sync queue: ${before} → ${this.syncQueue.length} items`);
    }
    
    async processSyncInBackground() {
        // Called by service worker for background sync
        console.log('Processing background sync');
        
        if (this.isOnline) {
            await this.processSync();
        }
    }
    
    // Utility methods
    
    chunkArray(array, chunkSize) {
        const chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    handleOfflineFallback(data) {
        // Handle offline fallback scenarios
        console.log('Offline fallback triggered:', data);
        
        this.app.showAlert(
            'Some features are limited while offline. Data will sync when connection is restored.',
            'warning'
        );
    }
    
    // Public API
    
    getSyncStatus() {
        const pending = this.syncQueue.filter(item => item.status === 'pending').length;
        const failed = this.syncQueue.filter(item => item.status === 'failed').length;
        const syncing = this.syncQueue.filter(item => item.status === 'syncing').length;
        
        return {
            pending,
            failed,
            syncing,
            total: this.syncQueue.length
        };
    }
    
    async forceSyncAll() {
        if (!this.isOnline) {
            this.app.showAlert('Cannot sync while offline', 'error');
            return;
        }
        
        // Reset failed items
        this.syncQueue.forEach(item => {
            if (item.status === 'failed') {
                item.status = 'pending';
                item.retries = 0;
            }
        });
        
        await this.processSync();
    }
    
    clearOfflineData() {
        this.syncQueue = [];
        this.saveSyncQueue();
        this.offlineStorage.clear();
        
        this.app.showAlert('Offline data cleared', 'info');
    }
}

// Offline Storage Manager using IndexedDB
class OfflineStorage {
    constructor() {
        this.dbName = 'OtherSideDB';
        this.dbVersion = 1;
        this.db = null;
    }
    
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create object stores
                if (!db.objectStoreNames.contains('sessions')) {
                    const sessionsStore = db.createObjectStore('sessions', { keyPath: 'id' });
                    sessionsStore.createIndex('status', 'status', { unique: false });
                    sessionsStore.createIndex('timestamp', 'start_time', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('evps')) {
                    const evpsStore = db.createObjectStore('evps', { keyPath: 'id', autoIncrement: true });
                    evpsStore.createIndex('sessionId', 'session_id', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('vox')) {
                    const voxStore = db.createObjectStore('vox', { keyPath: 'id', autoIncrement: true });
                    voxStore.createIndex('sessionId', 'session_id', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('radar')) {
                    const radarStore = db.createObjectStore('radar', { keyPath: 'id', autoIncrement: true });
                    radarStore.createIndex('sessionId', 'session_id', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('sls')) {
                    const slsStore = db.createObjectStore('sls', { keyPath: 'id', autoIncrement: true });
                    slsStore.createIndex('sessionId', 'session_id', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('interactions')) {
                    const interactionsStore = db.createObjectStore('interactions', { keyPath: 'id', autoIncrement: true });
                    interactionsStore.createIndex('sessionId', 'session_id', { unique: false });
                }
            };
        });
    }
    
    async ensureDB() {
        if (!this.db) {
            await this.init();
        }
    }
    
    async saveSession(sessionData) {
        await this.ensureDB();
        
        const transaction = this.db.transaction(['sessions'], 'readwrite');
        const store = transaction.objectStore('sessions');
        
        return new Promise((resolve, reject) => {
            const request = store.put(sessionData);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
    
    async saveEVP(sessionId, evpData) {
        await this.ensureDB();
        
        const transaction = this.db.transaction(['evps'], 'readwrite');
        const store = transaction.objectStore('evps');
        
        const data = {
            ...evpData,
            session_id: sessionId,
            created_at: new Date().toISOString()
        };
        
        return new Promise((resolve, reject) => {
            const request = store.add(data);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
    
    async saveVOX(sessionId, voxData) {
        await this.ensureDB();
        
        const transaction = this.db.transaction(['vox'], 'readwrite');
        const store = transaction.objectStore('vox');
        
        const data = {
            ...voxData,
            session_id: sessionId,
            created_at: new Date().toISOString()
        };
        
        return new Promise((resolve, reject) => {
            const request = store.add(data);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
    
    async saveRadar(sessionId, radarData) {
        await this.ensureDB();
        
        const transaction = this.db.transaction(['radar'], 'readwrite');
        const store = transaction.objectStore('radar');
        
        const data = {
            ...radarData,
            session_id: sessionId,
            created_at: new Date().toISOString()
        };
        
        return new Promise((resolve, reject) => {
            const request = store.add(data);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
    
    async saveSLS(sessionId, slsData) {
        await this.ensureDB();
        
        const transaction = this.db.transaction(['sls'], 'readwrite');
        const store = transaction.objectStore('sls');
        
        const data = {
            ...slsData,
            session_id: sessionId,
            created_at: new Date().toISOString()
        };
        
        return new Promise((resolve, reject) => {
            const request = store.add(data);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
    
    async saveInteraction(sessionId, interactionData) {
        await this.ensureDB();
        
        const transaction = this.db.transaction(['interactions'], 'readwrite');
        const store = transaction.objectStore('interactions');
        
        const data = {
            ...interactionData,
            session_id: sessionId,
            created_at: new Date().toISOString()
        };
        
        return new Promise((resolve, reject) => {
            const request = store.add(data);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
    
    async getAllSessions() {
        await this.ensureDB();
        
        const transaction = this.db.transaction(['sessions'], 'readonly');
        const store = transaction.objectStore('sessions');
        
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    async updateSessionId(oldId, newId) {
        await this.ensureDB();
        
        const transaction = this.db.transaction(['sessions'], 'readwrite');
        const store = transaction.objectStore('sessions');
        
        return new Promise((resolve, reject) => {
            const getRequest = store.get(oldId);
            getRequest.onsuccess = () => {
                const session = getRequest.result;
                if (session) {
                    session.id = newId;
                    session.synced = true;
                    
                    const putRequest = store.put(session);
                    putRequest.onsuccess = () => resolve();
                    putRequest.onerror = () => reject(putRequest.error);
                } else {
                    resolve();
                }
            };
            getRequest.onerror = () => reject(getRequest.error);
        });
    }
    
    async clear() {
        await this.ensureDB();
        
        const stores = ['sessions', 'evps', 'vox', 'radar', 'sls', 'interactions'];
        const transaction = this.db.transaction(stores, 'readwrite');
        
        const promises = stores.map(storeName => {
            return new Promise((resolve, reject) => {
                const request = transaction.objectStore(storeName).clear();
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        });
        
        return Promise.all(promises);
    }
}

// Export for use in main app
if (typeof window !== 'undefined') {
    window.OfflineManager = OfflineManager;
}