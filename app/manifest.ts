import { Manifest } from 'next'

export default function manifest(): Manifest {
  return {
    name: 'Lintas - Project Management for Teams',
    short_name: 'Lintas',
    description: 'Modern, beautiful project management for small teams and freelancers',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#2563eb',
    orientation: 'portrait-primary',
    scope: '/',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
    categories: ['productivity', 'business'],
    lang: 'id',
    dir: 'ltr',
  }
}