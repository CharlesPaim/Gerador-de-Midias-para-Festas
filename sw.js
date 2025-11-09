const CACHE_NAME = 'party-media-generator-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/index.tsx',
  '/metadata.json',
  '/types.ts',
  '/App.tsx',
  '/services/geminiService.ts',
  '/components/ImageUploader.tsx',
  '/components/AspectRatioSelector.tsx',
  '/components/ResultCard.tsx',
  '/components/ImageModal.tsx',
  '/components/NarrativeInput.tsx',
  '/components/NarratorSection.tsx',
  '/components/Cartoonizer.tsx',
  '/components/icons/CameraIcon.tsx',
  '/components/icons/UploadIcon.tsx',
  '/components/icons/DownloadIcon.tsx',
  '/components/icons/CopyIcon.tsx',
  '/components/icons/RedoIcon.tsx',
  '/components/icons/ShareIcon.tsx',
  '/components/icons/GalleryIcon.tsx',
  '/components/icons/ListIcon.tsx',
  '/components/icons/ChevronLeftIcon.tsx',
  '/components/icons/ChevronRightIcon.tsx',
  '/components/icons/SwitchIcon.tsx',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
