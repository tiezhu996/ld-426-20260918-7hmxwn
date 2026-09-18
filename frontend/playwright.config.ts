import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60000,
  workers: 1,
  fullyParallel: false,
  use: {
    baseURL: 'http://localhost:18806',
    headless: true,
    launchOptions: {
      args: [
        '--no-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-software-rasterizer',
        '--disable-gl-drawing-for-tests',
        '--disable-extensions'
      ]
    }
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:18806',
    reuseExistingServer: true,
    timeout: 60000
  }
});
