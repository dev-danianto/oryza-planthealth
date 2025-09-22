import {
  defineConfig
} from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import {
  VitePWA
} from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',

      manifest: {
        name: 'ORYZA - Plant AI',
        short_name: 'ORYZA',
        description: 'AI plant disease assistant',
        start_url: '/',
        scope: '/',

        // ✅ INI YANG PENTING - HILANGKAN BROWSER UI
        display: 'standalone', // atau 'fullscreen' untuk full screen

        orientation: 'portrait',
        background_color: '#ffffff',
        theme_color: '#10b981',

        icons: [{
          src: '/icons/pwa-512.png',
          sizes: '512x512',
          type: 'image/png'
        }]
      },

      // Minimal workbox config
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg}'],
        skipWaiting: true,
        clientsClaim: true
      },

      devOptions: {
        enabled: true
      }
    })
  ]
})