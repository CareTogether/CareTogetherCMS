import type { Page } from '@playwright/test';
import { ATLANTIS_ROUTE } from './constants';

export async function openHome(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
}

export async function openAtlantisHome(page: Page): Promise<void> {
  await page.goto(ATLANTIS_ROUTE);
  await page.waitForLoadState('domcontentloaded');
}

export function sideNavigation(page: Page) {
  return page.getByRole('list', {
    name: /secondary navigation/i,
  });
}
