import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
  devToolbar: {
    enabled: false,
  },
  security: {
    checkOrigin: false,
  },
  vite: {
    server: {
      allowedHosts: ['salakawy7.com', 'www.salakawy7.com'],
    }
  }
});

