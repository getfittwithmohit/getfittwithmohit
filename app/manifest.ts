import type { MetadataRoute } from 'next'

// Lets clients "Add to Home Screen" and open the app full-screen.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'GFM 1:1 Coaching',
    short_name: 'GFM 1:1',
    description: 'Your 1:1 transformation and peak performance coaching app with Coach Mohit.',
    start_url: '/home',
    display: 'standalone',
    background_color: '#1a1f3a',
    theme_color: '#1a1f3a',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
