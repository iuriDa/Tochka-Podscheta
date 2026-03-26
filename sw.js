/* ══════════════════════════════════════════
   Точка Подсчёта · sw.js · Service Worker
   Офлайн-режим и кеширование
   ══════════════════════════════════════════ */

const CACHE_NAME = 'tochka-v1.2';

// Всё что нужно для работы офлайн
const ASSETS = [
  './',
  './index.html',
  './app.js',
  './styles.css',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  // Google Fonts — кешируем при первом открытии
  'https://fonts.googleapis.com/css2?family=Unbounded:wght@400;600;700;900&family=JetBrains+Mono:wght@400;700&family=Manrope:wght@400;500;600&display=swap'
];

// ── Установка: кешируем все файлы ──────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Кешируем основные файлы — обязательно
      return cache.addAll([
        './',
        './index.html',
        './app.js',
        './styles.css',
        './manifest.json',
        './icons/icon-192.png',
        './icons/icon-512.png',
      ]).then(() => {
        // Шрифты кешируем отдельно — не критично если нет интернета
        return cache.addAll([
          'https://fonts.googleapis.com/css2?family=Unbounded:wght@400;600;700;900&family=JetBrains+Mono:wght@400;700&family=Manrope:wght@400;500;600&display=swap'
        ]).catch(() => {
          console.log('Шрифты не удалось закешировать — работаем без них');
        });
      });
    }).then(() => self.skipWaiting())
  );
});

// ── Активация: удаляем старые кеши ─────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log('Удаляем старый кеш:', key);
            return caches.delete(key);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ── Перехват запросов: сначала кеш ─────────
self.addEventListener('fetch', event => {
  // Пропускаем не-GET запросы
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) {
        // Есть в кеше — отдаём сразу
        // Фоново обновляем если есть интернет
        event.waitUntil(
          fetch(event.request)
            .then(response => {
              if (response && response.status === 200) {
                caches.open(CACHE_NAME).then(cache => {
                  cache.put(event.request, response.clone());
                });
              }
            })
            .catch(() => {})
        );
        return cached;
      }

      // Нет в кеше — загружаем из сети
      return fetch(event.request).then(response => {
        // Кешируем новый ресурс
        if (response && response.status === 200 && response.type !== 'opaque') {
          const toCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, toCache);
          });
        }
        return response;
      }).catch(() => {
        // Совсем нет интернета — возвращаем главную страницу
        if (event.request.destination === 'document') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
