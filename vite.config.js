import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  server: {
    port: 5173,
    open: true
  },
  build: {
    outDir: 'dist',
    minify: 'terser',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        dashboard: resolve(__dirname, 'src/pages/dashboard.html'),
        createCampaign: resolve(__dirname, 'src/pages/create-campaign.html'),
        campaignDetail: resolve(__dirname, 'src/pages/campaign-detail.html'),
        profile: resolve(__dirname, 'src/pages/profile.html'),
        admin: resolve(__dirname, 'src/pages/admin.html'),
        rewards: resolve(__dirname, 'src/pages/rewards.html')
      }
    }
  }
})
