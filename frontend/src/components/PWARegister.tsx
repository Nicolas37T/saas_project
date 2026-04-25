'use client';

import { useEffect } from 'react';

export function PWARegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registrado con scope:', registration.scope);

          // Check for updates periodically
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'activated') {
                  console.log('Nueva versión disponible. Recargando...');
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('Error al registrar SW:', error);
        });
    }
  }, []);

  return null;
}
