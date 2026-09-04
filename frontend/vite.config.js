import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { execSync } from 'child_process'

function gitInfo() {
  try {
    const hash = execSync('git rev-parse --short HEAD').toString().trim();
    const message = execSync('git log -1 --pretty=%s').toString().trim();
    return { hash, message };
  } catch {
    return { hash: 'unknown', message: '' };
  }
}

const git = gitInfo();

// https://vitejs.dev/config/
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.jsx',
  },
  define: {
    __GIT_HASH__: JSON.stringify(git.hash),
    __GIT_MESSAGE__: JSON.stringify(git.message),
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          maplibre: ['maplibre-gl', '@protomaps/basemaps'],
          mui: ['@mui/material', '@mui/icons-material'],
          recharts: ['recharts'],
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'vathra.xyz | ΓΥΣ βάθρα',
        short_name: 'vathra.xyz',
        description: 'An interactive map of Hellenic trigonometric points.',
        theme_color: '#1C1A14',
        background_color: '#F7F2E8',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})