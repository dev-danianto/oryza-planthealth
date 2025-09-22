import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'OpenRouter AI PWA',
        short_name: 'AI PWA',
        start_url: '/',
        display: 'standalone',
        background_color: '#0ea5e9',
        theme_color: '#0ea5e9',
        // TEMP: comment icons during dev if files not present
        // icons: [
        //   { src: '/icons/pwa-192.png', sizes: '192x192', type: 'image/png' },
        //   { src: '/icons/pwa-512.png', sizes: '512x512', type: 'image/png' },
        //   { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        // ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}']
      },
      devOptions: {
        enabled: false // disable SW in dev to avoid cache issues
      }
    })
  ],
  server: {
    hmr: { overlay: true }
  }
})
