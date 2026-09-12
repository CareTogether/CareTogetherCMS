import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './playwright_test',
  testMatch: /referrals-grid-(phase[12]|review)\.spec\.ts/,
  testIgnore: /\.local/,
  workers: 1,
  reporter: 'list',
});
