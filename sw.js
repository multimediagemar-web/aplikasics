const CACHE_NAME = 'donasiapp-v1.1.0'; // Ubah angka versi ini di GitHub setiap kali Anda melakukan update besar
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192x192.png',
  './icon-512x512.png'
];

// Install Service Worker dan simpan cache dasar
self.addEventListener('install', event => {
  self.skipWaiting(); // Langsung aktif tanpa menunggu tab ditutup
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Hapus cache versi lama agar memori HP pengguna tidak penuh
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => cacheName !== CACHE_NAME)
                  .map(cacheName => caches.delete(cacheName))
      );
    })
  );
  self.clients.claim(); // Langsung ambil alih kontrol halaman client
});

// Strategi: Network First (Coba internet dulu, jika gagal/offline baru pakai Cache)
// Ini menjamin pengguna selalu mendapat index.html versi terbaru dari GitHub
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Jika sukses ditarik dari internet, update cache dengan data terbaru
        const resClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, resClone);
        });
        return response;
      })
      .catch(() => {
        // Jika gagal (karena offline), ambil dari cache yang tersimpan di HP
        return caches.match(event.request);
      })
  );
});

// Listener untuk menerima perintah skip waiting dari index.html (saat update ditemukan)
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
