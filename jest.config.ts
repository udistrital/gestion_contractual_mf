import { createCjsPreset } from 'jest-preset-angular/presets';
import type { Config } from 'jest';

const jestConfig: Config = {
  ...createCjsPreset(), 
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testEnvironment: 'jest-environment-jsdom',
};

export default jestConfig;
