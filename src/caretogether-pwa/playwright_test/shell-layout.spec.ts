import { expect, test } from './support/fixtures';
import { ATLANTIS_ROUTE } from './support/constants';
import { FAMILY_SCREEN_V2_EARLY_ACCESS_FEATURE_FLAG } from '../src/featureFlags';
import type { Page } from '@playwright/test';
import { build } from 'rolldown';
import { fileURLToPath } from 'node:url';
import { ignoreModuleLevelDirectives } from './support/harnessBuild';

type FullscreenTestWindow = typeof window & {
  fullscreenTest: {
    requests: number;
    exits: number;
    setActive: (active: boolean) => void;
    complete: () => void;
  };
};

const fullscreenTest = test.extend({ video: 'off' });

fullscreenTest.describe('responsive fullscreen toggle', () => {
  fullscreenTest.use({ storageState: { cookies: [], origins: [] } });
  let bundle: string;

  fullscreenTest.beforeAll(async () => {
    const entry = fileURLToPath(
      new URL('./shell-fullscreen-entry.tsx', import.meta.url)
    );
    const result = await build({
      input: 'shell-fullscreen-entry',
      platform: 'browser',
      tsconfig: false,
      onLog: ignoreModuleLevelDirectives,
      transform: {
        jsx: { runtime: 'automatic' },
        define: { 'process.env.NODE_ENV': JSON.stringify('production') },
      },
      plugins: [
        {
          name: 'shell-fullscreen-entry',
          resolveId(source) {
            return source === 'shell-fullscreen-entry' ? entry : null;
          },
          load(id) {
            if (id.replaceAll('\\', '/') !== entry.replaceAll('\\', '/'))
              return null;
            return `
            import { createElement } from 'react';
            import { createRoot } from 'react-dom/client';
            import { flushSync } from 'react-dom';
            import { ThemeProvider } from '@mui/material';
            import { theme } from '../src/theme';
            import { ShellFullscreenToggle } from '../src/Shell/ShellFullscreenToggle';
            const root = createRoot(document.getElementById('fullscreen-root'));
            flushSync(() => root.render(createElement(ThemeProvider, { theme }, createElement(ShellFullscreenToggle))));
            document.body.dataset.fullscreenReady = 'true';
          `;
          },
        },
      ],
      output: { format: 'iife' },
      write: false,
    });
    const output = result.output.find((item) => item.type === 'chunk');
    if (!output || output.type !== 'chunk')
      throw new Error('Missing fullscreen browser bundle');
    bundle = output.code;
  });

  async function mountFullscreen(
    page: Page,
    {
      width = 1440,
      active = false,
      support = 'enabled',
      behavior = 'immediate',
    }: {
      width?: number;
      active?: boolean;
      support?: 'enabled' | 'disabled' | 'missing-request' | 'missing-exit';
      behavior?: 'immediate' | 'pending' | 'reject';
    } = {}
  ) {
    await page.setViewportSize({ width, height: 844 });
    await page.setContent(
      '<html><body><div id="fullscreen-root"></div></body></html>'
    );
    await page.evaluate(
      ({ active, support, behavior }) => {
        let element: Element | null = active ? document.documentElement : null;
        const state = {
          requests: 0,
          exits: 0,
          setActive(next: boolean) {
            element = next ? document.documentElement : null;
            document.dispatchEvent(new Event('fullscreenchange'));
          },
          complete: () => {},
        };
        function change(next: boolean) {
          if (behavior === 'reject')
            return Promise.reject(new Error('Fullscreen denied'));
          if (behavior === 'pending')
            return new Promise<void>((resolve) => {
              state.complete = () => {
                state.setActive(next);
                resolve();
              };
            });
          state.setActive(next);
          return Promise.resolve();
        }
        Object.defineProperties(document, {
          fullscreenEnabled: {
            configurable: true,
            get: () => support !== 'disabled',
          },
          fullscreenElement: { configurable: true, get: () => element },
          exitFullscreen: {
            configurable: true,
            value:
              support === 'missing-exit'
                ? undefined
                : () => {
                    state.exits++;
                    return change(false);
                  },
          },
        });
        Object.defineProperty(document.documentElement, 'requestFullscreen', {
          configurable: true,
          value:
            support === 'missing-request'
              ? undefined
              : () => {
                  state.requests++;
                  return change(true);
                },
        });
        (window as FullscreenTestWindow).fullscreenTest = state;
      },
      { active, support, behavior }
    );
    await page.addScriptTag({ content: bundle });
    await expect(page.locator('body')).toHaveAttribute(
      'data-fullscreen-ready',
      'true'
    );
  }

  for (const width of [
    320, 390, 599, 600, 768, 899, 900, 1024, 1100, 1199, 1200, 1280, 1440,
  ]) {
    fullscreenTest(
      `fullscreen entry follows the lg breakpoint at ${width}px`,
      async ({ page }) => {
        await mountFullscreen(page);
        const enter = page.getByRole('button', {
          name: 'Enter fullscreen',
          exact: true,
        });
        await expect(enter).toBeVisible();
        await page.setViewportSize({ width, height: 844 });
        if (width < 1200) {
          await expect(enter).toHaveCount(0);
          await expect(page.locator('#fullscreen-root')).toBeEmpty();
        } else {
          await expect(enter).toBeVisible();
          await expect(enter.locator('svg')).toHaveCount(1);
        }
        expect(
          await page.evaluate(
            () => (window as FullscreenTestWindow).fullscreenTest.requests
          )
        ).toBe(0);
      }
    );
  }

  for (const support of [
    'disabled',
    'missing-request',
    'missing-exit',
  ] as const) {
    fullscreenTest(
      `fullscreen remains unavailable when support is ${support}`,
      async ({ page }) => {
        await mountFullscreen(page, { support });
        await expect(page.getByRole('button')).toHaveCount(0);
        await expect(page.locator('#fullscreen-root')).toBeEmpty();
      }
    );
  }

  fullscreenTest(
    'desktop fullscreen retains its tooltip, icons and browser API interactions',
    async ({ page }) => {
      await mountFullscreen(page);
      const enter = page.getByRole('button', {
        name: 'Enter fullscreen',
        exact: true,
      });
      await enter.hover();
      await expect(page.getByRole('tooltip')).toHaveText('Enter fullscreen');
      const enteringIcon = await enter.locator('svg path').getAttribute('d');
      await enter.click();
      const exit = page.getByRole('button', {
        name: 'Exit fullscreen',
        exact: true,
      });
      await expect(exit).toBeEnabled();
      await expect(exit.locator('svg')).toHaveCount(1);
      expect(await exit.locator('svg path').getAttribute('d')).not.toBe(
        enteringIcon
      );
      expect(
        await page.evaluate(
          () => (window as FullscreenTestWindow).fullscreenTest.requests
        )
      ).toBe(1);
      await exit.click();
      await expect(enter).toBeEnabled();
      await expect(enter.locator('svg path')).toHaveAttribute(
        'd',
        enteringIcon!
      );
      expect(
        await page.evaluate(
          () => (window as FullscreenTestWindow).fullscreenTest.exits
        )
      ).toBe(1);
    }
  );

  fullscreenTest(
    'active fullscreen retains a keyboard-accessible exit after resizing to mobile',
    async ({ page }) => {
      await mountFullscreen(page);
      await page
        .getByRole('button', { name: 'Enter fullscreen', exact: true })
        .click();
      await page.setViewportSize({ width: 390, height: 844 });
      const exit = page.getByRole('button', {
        name: 'Exit fullscreen',
        exact: true,
      });
      await expect(exit).toBeVisible();
      await expect(page.getByRole('button')).toHaveCount(1);
      await exit.focus();
      await expect(exit).toBeFocused();
      await exit.press('Enter');
      await expect(page.locator('#fullscreen-root')).toBeEmpty();
      expect(
        await page.evaluate(
          () => (window as FullscreenTestWindow).fullscreenTest.exits
        )
      ).toBe(1);
      await page.setViewportSize({ width: 1200, height: 844 });
      await expect(
        page.getByRole('button', { name: 'Enter fullscreen', exact: true })
      ).toBeVisible();
    }
  );

  fullscreenTest(
    'fullscreen already active on mobile still exposes Exit',
    async ({ page }) => {
      await mountFullscreen(page, { width: 320, active: true });
      const exit = page.getByRole('button', {
        name: 'Exit fullscreen',
        exact: true,
      });
      for (const width of [
        390, 768, 899, 900, 1024, 1100, 1199, 1200, 1280, 1440,
      ]) {
        await page.setViewportSize({ width, height: 844 });
        await expect(exit).toBeVisible();
        await expect(page.getByRole('button')).toHaveCount(1);
        await exit.focus();
        await expect(exit).toBeFocused();
      }
      await page.setViewportSize({ width: 390, height: 844 });
      await exit.press('Enter');
      await expect(page.locator('#fullscreen-root')).toBeEmpty();
    }
  );

  fullscreenTest(
    'pending fullscreen operations stay protected across a mobile resize',
    async ({ page }) => {
      await mountFullscreen(page, { behavior: 'pending' });
      const enter = page.getByRole('button', {
        name: 'Enter fullscreen',
        exact: true,
      });
      await enter.click();
      await expect(enter).toBeDisabled();
      await page.setViewportSize({ width: 768, height: 844 });
      await expect(enter).toHaveCount(0);
      await page.evaluate(() =>
        (window as FullscreenTestWindow).fullscreenTest.complete()
      );
      const exit = page.getByRole('button', {
        name: 'Exit fullscreen',
        exact: true,
      });
      await expect(exit).toBeEnabled();
      await exit.click();
      await expect(exit).toBeDisabled();
      await page.evaluate(() =>
        (window as FullscreenTestWindow).fullscreenTest.complete()
      );
      await expect(page.locator('#fullscreen-root')).toBeEmpty();
      expect(
        await page.evaluate(() => {
          const { requests, exits } = (window as FullscreenTestWindow)
            .fullscreenTest;
          return { requests, exits };
        })
      ).toEqual({ requests: 1, exits: 1 });
    }
  );

  for (const active of [false, true]) {
    fullscreenTest(
      `failed fullscreen ${active ? 'exit' : 'entry'} retains feedback and clears pending state`,
      async ({ page }) => {
        await mountFullscreen(page, { active, behavior: 'reject' });
        const button = page.getByRole('button', {
          name: active ? 'Exit fullscreen' : 'Enter fullscreen',
          exact: true,
        });
        await button.click();
        await expect(page.getByRole('alert')).toHaveText(
          'Unable to change fullscreen mode.'
        );
        await expect(button).toBeEnabled();
      }
    );
  }

  fullscreenTest(
    'fullscreenchange synchronizes even while the mobile entry control is absent',
    async ({ page }) => {
      await mountFullscreen(page, { width: 599 });
      await expect(page.locator('#fullscreen-root')).toBeEmpty();
      await page.evaluate(() =>
        (window as FullscreenTestWindow).fullscreenTest.setActive(true)
      );
      await expect(
        page.getByRole('button', { name: 'Exit fullscreen', exact: true })
      ).toBeVisible();
      await page.evaluate(() =>
        (window as FullscreenTestWindow).fullscreenTest.setActive(false)
      );
      await expect(page.locator('#fullscreen-root')).toBeEmpty();
    }
  );
});

test.describe('V2 shell', () => {
  test('aligns page headings with the Clients content edge', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    async function headingBounds(route: string, title: string) {
      await page.goto(`${ATLANTIS_ROUTE}${route}`);
      const heading = page.getByRole('heading', { name: title, exact: true });
      await expect(heading).toBeVisible();
      return heading.boundingBox();
    }

    const clients = await headingBounds('clients', 'Clients');
    expect(clients).not.toBeNull();

    for (const [route, title] of [
      ['', 'Dashboard'],
      ['inbox', 'Inbox'],
      ['organizations', 'Organizations'],
      ['referrals', 'Referrals'],
      ['settings', 'Settings'],
    ]) {
      const heading = await headingBounds(route, title);
      expect(heading).not.toBeNull();
      expect(
        Math.abs(heading!.x - clients!.x),
        `${title} left edge`
      ).toBeLessThan(1);
      expect(
        Math.abs(heading!.y - clients!.y),
        `${title} top edge`
      ).toBeLessThan(1);
    }
  });

  test('keeps application context and toggle position when collapsing the sidebar', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 900, height: 800 });
    await page.goto(`${ATLANTIS_ROUTE}inbox`);
    const header = page.getByRole('banner');
    await expect(
      page.getByRole('heading', { name: 'Inbox', exact: true })
    ).toBeVisible();
    await expect(
      header.getByRole('heading', { name: 'Inbox', exact: true })
    ).toHaveCount(0);
    await expect(
      header.getByText('CareTogether', { exact: true })
    ).toBeVisible();
    await expect(
      header.getByRole('combobox', { name: 'Location', exact: true })
    ).toBeVisible();

    const expand = header.getByRole('button', {
      name: 'Expand sidebar',
      exact: true,
    });
    if (await expand.isVisible()) await expand.click();
    const collapse = header.getByRole('button', {
      name: 'Collapse sidebar',
      exact: true,
    });
    await expect(collapse).toHaveAttribute('aria-expanded', 'true');
    const expandedBounds = await collapse.boundingBox();
    await collapse.click();
    await expect(expand).toHaveAttribute('aria-expanded', 'false');
    const collapsedBounds = await expand.boundingBox();
    expect(collapsedBounds?.x).toBe(expandedBounds?.x);
    await expect(
      header.getByRole('combobox', { name: 'Location', exact: true })
    ).toBeVisible();
    await page.reload();
    await expect(expand).toBeVisible();
    await expand.click();
    await expect(collapse).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    ).toBe(true);
  });

  test('retains mobile navigation and location selection in its menu', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${ATLANTIS_ROUTE}inbox`);
    const header = page.getByRole('banner');
    await expect(
      page.getByRole('heading', { name: 'Inbox', exact: true })
    ).toBeVisible();
    await expect(header.getByRole('button', { name: /sidebar/ })).toHaveCount(
      0
    );
    await expect(
      header.getByRole('combobox', { name: 'Location', exact: true })
    ).toHaveCount(0);
    await expect(header.getByPlaceholder('Search families')).toBeVisible();
    await page
      .locator('.MuiBottomNavigation-root')
      .getByRole('button')
      .first()
      .click();
    await expect(
      page.getByRole('combobox', { name: 'Location', exact: true })
    ).toBeVisible();
  });
});

test.describe('legacy shell', () => {
  test.use({
    featureFlags: { [FAMILY_SCREEN_V2_EARLY_ACCESS_FEATURE_FLAG]: false },
  });

  test('keeps Inbox in the top bar without adding a page heading', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${ATLANTIS_ROUTE}inbox`);
    await expect(
      page
        .getByRole('banner')
        .getByRole('heading', { name: 'Inbox', exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Inbox', exact: true })
    ).toHaveCount(1);
    await expect(
      page.getByRole('banner').getByText('CareTogether', { exact: true })
    ).toHaveCount(0);
  });
});
