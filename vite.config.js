import { defineConfig } from 'vite'
import { resolve } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { visualizer } from 'rollup-plugin-visualizer';

// Replaces __SW_VERSION__ in the copied service-worker.js with a build timestamp
const injectSwVersion = {
  name: 'inject-sw-version',
  closeBundle() {
    const swPath = resolve(__dirname, 'dist/service-worker.js');
    if (!existsSync(swPath)) return;
    const version = `v${Date.now()}`;
    const updated = readFileSync(swPath, 'utf-8').replace('__SW_VERSION__', version);
    writeFileSync(swPath, updated);
  },
};

// Custom plugin: redirect clean URLs to actual HTML files in dev (mirrors Netlify redirects)
// Uses 302 redirect so the browser resolves relative asset paths correctly
const devRewrites = {
  name: 'dev-clean-url-redirects',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const map = {
        '/dashboard': '/src/pages/dashboard.html',
        '/create-campaign': '/src/pages/create-campaign.html',
        '/profile': '/src/pages/profile.html',
        '/rewards': '/src/pages/rewards.html',
        '/admin': '/src/pages/admin.html',
        '/privacy': '/src/pages/privacy.html',
        '/events': '/src/pages/events.html',
      };
      const base = req.url.split('?')[0];
      if (map[base]) {
        const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
        res.writeHead(302, { Location: map[base] + qs });
        res.end();
        return;
      }
      // Dynamic routes: /campaign/:id — pass ID as ?id= so getCampaignIdFromUrl() works after redirect
      if (base.startsWith('/campaign/')) {
        const id = base.slice('/campaign/'.length);
        const existingQs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?') + 1) : '';
        const qs = id ? `id=${id}${existingQs ? '&' + existingQs : ''}` : existingQs;
        res.writeHead(302, { Location: '/src/pages/campaign-detail.html' + (qs ? '?' + qs : '') });
        res.end();
        return;
      }
      next();
    });
  },
};

export default defineConfig({
  plugins: [devRewrites, injectSwVersion],
  server: {
    port: 5173,
    open: true
  },
  build: {
    outDir: 'dist',
    minify: 'esbuild',
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      input: {
        main:           resolve(__dirname, 'index.html'),
        dashboard:      resolve(__dirname, 'src/pages/dashboard.html'),
        createCampaign: resolve(__dirname, 'src/pages/create-campaign.html'),
        campaignDetail: resolve(__dirname, 'src/pages/campaign-detail.html'),
        profile:        resolve(__dirname, 'src/pages/profile.html'),
        admin:          resolve(__dirname, 'src/pages/admin.html'),
        rewards:        resolve(__dirname, 'src/pages/rewards.html'),
        privacy:        resolve(__dirname, 'src/pages/privacy.html'),
        events:         resolve(__dirname, 'src/pages/events.html'),
      },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/@supabase')) return 'vendor-supabase';
          if (id.includes('node_modules/leaflet'))   return 'vendor-leaflet';
        },
      },
      plugins: [visualizer({ open: false, filename: 'dist/bundle-stats.html' })],
    },
  },
})
