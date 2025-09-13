// OtherSide Service Worker for Offline Functionality
const CACHE_NAME = 'otherside-v1.0.0';
const STATIC_CACHE = 'otherside-static-v1.0.0';
const DYNAMIC_CACHE = 'otherside-dynamic-v1.0.0';

// Files to cache immediately (critical app shell)
const STATIC_FILES = [
    '/',
    '/static/index.html',
    '/static/css/style.css',
    '/static/js/app.js',
    '/static/js/audio.js',
    '/static/js/radar.js',
    '/static/js/sls.js',
    '/static/js/offline.js',
    '/static/manifest.json',
    '/static/icons/icon-192.png',
    '/static/icons/icon-512.png'
];

// API endpoints to cache with network-first strategy
const API_ENDPOINTS = [
    '/api/v1/sessions',
    '/health'
];

// Background sync tags
const SYNC_TAGS = {
    SESSION_SYNC: 'session-sync',
    EVP_SYNC: 'evp-sync',
    DATA_SYNC: 'data-sync'
};

// Install Event - Cache static assets
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('Service Worker: Caching static files');
                return cache.addAll(STATIC_FILES);
            })
            .then(() => {
                console.log('Service Worker: Static files cached');
                return self.skipWaiting(); // Activate immediately
            })
            .catch(error => {
                console.error('Service Worker: Error caching static files:', error);
            })
    );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        // Delete old caches
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('Service Worker: Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker: Activated');
                return self.clients.claim(); // Take control immediately
            })
    );
});

// Fetch Event - Intercept network requests
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests and chrome-extension URLs
    if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
        return;
    }
    
    // Handle different types of requests
    if (isStaticAsset(request)) {
        // Cache-first for static assets
        event.respondWith(handleStaticAssets(request));
    } else if (isAPIRequest(request)) {
        // Network-first for API requests
        event.respondWith(handleAPIRequest(request));
    } else if (isNavigationRequest(request)) {
        // App shell for navigation
        event.respondWith(handleNavigation(request));
    } else {
        // Default: network-first with cache fallback
        event.respondWith(handleDefault(request));
    }
});

// Background Sync Event
self.addEventListener('sync', (event) => {
    console.log('Service Worker: Background sync triggered:', event.tag);
    
    if (event.tag === SYNC_TAGS.DATA_SYNC) {
        event.waitUntil(handleDataSync());
    } else if (event.tag === SYNC_TAGS.SESSION_SYNC) {
        event.waitUntil(handleSessionSync());
    }
});

// Push Event (for future notifications)
self.addEventListener('push', (event) => {
    console.log('Service Worker: Push message received');
    
    const options = {
        body: event.data ? event.data.text() : 'New paranormal activity detected',
        icon: '/static/icons/icon-192.png',
        badge: '/static/icons/icon-192.png',
        tag: 'otherside-notification',
        requireInteraction: false,
        actions: [
            {
                action: 'view',
                title: 'View Session'
            },
            {
                action: 'dismiss',
                title: 'Dismiss'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('OtherSide Investigation', options)
    );
});

// Notification Click Event
self.addEventListener('notificationclick', (event) => {
    console.log('Service Worker: Notification click received');
    
    event.notification.close();
    
    if (event.action === 'view') {
        // Open the app
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Message Event - Communication with main thread
self.addEventListener('message', (event) => {
    const { type, data } = event.data;
    
    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
        case 'GET_VERSION':
            event.ports[0].postMessage({ version: CACHE_NAME });
            break;
        case 'CLEAR_CACHE':
            clearAllCaches().then(() => {
                event.ports[0].postMessage({ success: true });
            });
            break;
        case 'FORCE_SYNC':
            handleDataSync();
            break;
    }
});

// Request type detection functions

function isStaticAsset(request) {
    const url = new URL(request.url);
    return url.pathname.startsWith('/static/') || 
           url.pathname.endsWith('.css') ||
           url.pathname.endsWith('.js') ||
           url.pathname.endsWith('.png') ||
           url.pathname.endsWith('.jpg') ||
           url.pathname.endsWith('.ico');
}

function isAPIRequest(request) {
    const url = new URL(request.url);
    return url.pathname.startsWith('/api/') || url.pathname === '/health';
}

function isNavigationRequest(request) {
    return request.mode === 'navigate';
}

// Request handling strategies

async function handleStaticAssets(request) {
    try {
        // Cache-first strategy
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Fetch and cache
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('Service Worker: Error handling static asset:', error);
        return new Response('Asset not available offline', { status: 503 });
    }
}

async function handleAPIRequest(request) {
    try {
        // Network-first strategy
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Cache successful responses
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('Service Worker: Network failed, checking cache for API request');
        
        // Try to serve from cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            // Add custom header to indicate offline response
            const response = cachedResponse.clone();
            response.headers.set('X-Served-By', 'ServiceWorker');
            return response;
        }
        
        // Return offline response for API requests
        return new Response(
            JSON.stringify({
                error: 'Service unavailable offline',
                offline: true,
                timestamp: new Date().toISOString()
            }),
            {
                status: 503,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Served-By': 'ServiceWorker'
                }
            }
        );
    }
}

async function handleNavigation(request) {
    try {
        // Network-first for navigation
        const networkResponse = await fetch(request);
        return networkResponse;
    } catch (error) {
        console.log('Service Worker: Navigation request failed, serving app shell');
        
        // Serve app shell (index.html)
        const cache = await caches.open(STATIC_CACHE);
        const cachedResponse = await cache.match('/static/index.html');
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Fallback offline page
        return new Response(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>OtherSide - Offline</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background: #1a1a1a;
                        color: #ffffff;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                        text-align: center;
                    }
                    .offline-message {
                        max-width: 400px;
                        padding: 40px;
                    }
                    h1 { color: #6c5ce7; }
                    p { margin: 20px 0; }
                    button {
                        background: #6c5ce7;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 5px;
                        cursor: pointer;
                        margin: 10px;
                    }
                </style>
            </head>
            <body>
                <div class="offline-message">
                    <h1>👻 OtherSide</h1>
                    <h2>You're Offline</h2>
                    <p>The paranormal investigation app is not available right now. Please check your connection.</p>
                    <button onclick="window.location.reload()">Try Again</button>
                    <button onclick="window.location.href='/'">Go Home</button>
                </div>
            </body>
            </html>
        `, {
            headers: { 'Content-Type': 'text/html' }
        });
    }
}

async function handleDefault(request) {
    try {
        // Network-first with cache fallback
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        // Try cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Generic offline response
        return new Response('Content not available offline', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}

// Background sync handlers

async function handleDataSync() {
    console.log('Service Worker: Handling data sync');
    
    try {
        // Notify main thread to process sync
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({
                type: 'SYNC_BACKGROUND',
                data: { timestamp: Date.now() }
            });
        });
    } catch (error) {
        console.error('Service Worker: Data sync error:', error);
    }
}

async function handleSessionSync() {
    console.log('Service Worker: Handling session sync');
    
    try {
        // Could implement specific session sync logic here
        await handleDataSync();
    } catch (error) {
        console.error('Service Worker: Session sync error:', error);
    }
}

// Utility functions

async function clearAllCaches() {
    const cacheNames = await caches.keys();
    return Promise.all(
        cacheNames.map(name => caches.delete(name))
    );
}

async function cleanupCache(cacheName, maxItems = 50) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    
    if (keys.length > maxItems) {
        // Remove oldest items
        const itemsToDelete = keys.slice(0, keys.length - maxItems);
        await Promise.all(
            itemsToDelete.map(key => cache.delete(key))
        );
        
        console.log(`Service Worker: Cleaned ${itemsToDelete.length} items from ${cacheName}`);
    }
}

// Periodic cache cleanup
setInterval(() => {
    cleanupCache(DYNAMIC_CACHE, 50);
}, 60000 * 30); // Every 30 minutes

// Log service worker lifecycle
console.log('Service Worker: Script loaded');

// Export for testing (if in testing environment)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CACHE_NAME,
        STATIC_FILES,
        isStaticAsset,
        isAPIRequest,
        isNavigationRequest
    };
}