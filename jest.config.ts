import { createCjsPreset } from 'jest-preset-angular/presets/index.js';
import type { Config } from 'jest';

const jestConfig: Config = {
  ...createCjsPreset(), 
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
  },

};

export default jestConfig;
