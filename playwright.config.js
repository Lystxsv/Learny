// Pruebas de Learny. Se ejecutan con:  npm install  ·  npx playwright install chromium  ·  npx playwright test
const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests',
  timeout: 30000,
  reporter: 'list',
  use: { baseURL: 'http://localhost:4173', serviceWorkers: 'block' }, // sin service worker: así no cachea nada entre pruebas
  webServer: { command: 'npx http-server . -p 4173 -c-1 --silent', url: 'http://localhost:4173', reuseExistingServer: true }
});
