// Service Worker — cache sistemi silindi.
// PDF-lər birbaşa GitHub/CDN-dən açılır.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());
