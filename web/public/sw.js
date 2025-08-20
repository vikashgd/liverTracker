// LiverTracker Service Worker
// Provides offline functionality and caching for the medical platform

const CACHE_NAME = 'livertracker-v1.0.0';
const STATIC_CACHE_NAME = 'livertracker-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'livertracker-dynamic-v1.0.0';

// Essential files to cache for offline functionality
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/reports',
  '/manual-entry',
  '/offline.html',
  // Add core CSS and JS files here when they're available
];

// API endpoints that should be cached for offline access
const CACHEABLE_APIS = [
  '/api/reports',
  '/api/auth/session',
];

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('📦 Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS.filter(url => url !== '/offline.html'));
      }),
      
      // Create offline page
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        return cache.add('/offline.html');
      })
    ]).then(() => {
      console.log('✅ Service Worker: Installation complete');
      // Skip waiting to activate immediately
      return self.skipWaiting();
    }).catch((error) => {
      console.error('❌ Service Worker: Installation failed', error);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old caches
          if (cacheName !== STATIC_CACHE_NAME && 
              cacheName !== DYNAMIC_CACHE_NAME &&
              cacheName.startsWith('livertracker-')) {
            console.log('🗑️ Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker: Activation complete');
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  event.respondWith(
    handleFetchRequest(request)
  );
});

async function handleFetchRequest(request) {
  const url = new URL(request.url);
  
  try {
    // For navigation requests (pages)
    if (request.mode === 'navigate') {
      return await handleNavigationRequest(request);
    }
    
    // For API requests
    if (url.pathname.startsWith('/api/')) {
      return await handleApiRequest(request);
    }
    
    // For static assets
    return await handleStaticRequest(request);
    
  } catch (error) {
    console.error('❌ Service Worker: Fetch error', error);
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const cache = await caches.open(STATIC_CACHE_NAME);
      return await cache.match('/offline.html');
    }
    
    // Return a basic error response for other requests
    return new Response('Network error', {
      status: 408,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

async function handleNavigationRequest(request) {
  try {
    // Try network first for navigation
    const networkResponse = await fetch(request);
    
    // Cache successful navigation responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // If network fails, try cache
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If no cache, return offline page
    const staticCache = await caches.open(STATIC_CACHE_NAME);
    return await staticCache.match('/offline.html');
  }
}

async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  // Check if this API should be cached
  const shouldCache = CACHEABLE_APIS.some(api => url.pathname.startsWith(api));
  
  if (!shouldCache) {
    // For non-cacheable APIs, just try network
    return await fetch(request);
  }
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful API responses
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // If network fails, try cache
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('📱 Service Worker: Serving cached API response', url.pathname);
      return cachedResponse;
    }
    
    throw error;
  }
}

async function handleStaticRequest(request) {
  // Try cache first for static assets
  const cache = await caches.open(STATIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // If not in cache, try network and cache the response
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const dynamicCache = await caches.open(DYNAMIC_CACHE_NAME);
      await dynamicCache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    throw error;
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('🔄 Service Worker: Background sync triggered', event.tag);
  
  if (event.tag === 'background-sync-reports') {
    event.waitUntil(syncOfflineReports());
  }
});

async function syncOfflineReports() {
  // This would sync any offline report uploads when connection is restored
  console.log('📤 Service Worker: Syncing offline reports...');
  // Implementation would depend on your offline storage strategy
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('📢 Service Worker: Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New health update available',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'explore',
        title: 'View Dashboard',
        icon: '/icons/dashboard-96x96.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/close-96x96.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('LiverTracker', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Service Worker: Notification clicked', event.action);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    // Open dashboard
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  } else if (event.action === 'close') {
    // Just close the notification
    return;
  } else {
    // Default action - open app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message handling from main thread
self.addEventListener('message', (event) => {
  console.log('💬 Service Worker: Message received', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});
