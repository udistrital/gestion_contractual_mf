import { defineConfig } from '@playwright/test';

/**
 * Pruebas E2E de UI. El MF es un microfrontend single-spa y no monta solo, así que
 * se prueba a través del root en ROOT_URL (por defecto http://localhost:4200).
 *
 * Servicios necesarios: root (:4200), MF (:4201), CRUD (:8080) y MID (:8081).
 * Ejecutar: pnpm run test:e2e   (agregar --headed para ver el navegador)
 */
export default defineConfig({
  testDir: './e2e/ui',
  testMatch: '**/*.e2e.ts',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  workers: 1,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'e2e-report' }]],
  use: {
    baseURL: process.env.ROOT_URL ?? 'http://localhost:4200',
    channel: 'chrome',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
});
