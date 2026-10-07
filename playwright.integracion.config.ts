import { defineConfig } from '@playwright/test';

/**
 * Pruebas de integración (HTTP contra CRUD y MID reales, sin navegador).
 * Requiere gestion_contractual_crud en :8080 y gestion_contractual_mid en :8081.
 * Ejecutar: pnpm run test:integracion
 */
export default defineConfig({
  testDir: './e2e/integracion',
  testMatch: '**/*.integracion.ts',
  timeout: 30_000,
  workers: 1,
  reporter: [['list']],
});
