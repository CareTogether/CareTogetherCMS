import { expect, test, type Page } from '@playwright/test';
import { build } from 'rolldown';
import { fileURLToPath } from 'node:url';
import { ignoreModuleLevelDirectives } from './support/harnessBuild';
import {
  filterAndRankShellSearchResults,
  findShellSearchHighlightRange,
  normalizeShellSearchText,
} from '../src/Shell/shellSearch';

const headerSearchTest = test.extend({ video: 'off' });

headerSearchTest.describe(
  'global search copy in the application header',
  () => {
    headerSearchTest.use({ storageState: { cookies: [], origins: [] } });
    let bundle: string;

    headerSearchTest.beforeAll(async () => {
      const entry = fileURLToPath(
        new URL('./shell-search-entry.tsx', import.meta.url)
      );
      const mocks: Record<string, string> = {
        Data: `
        const context = { organizationId: 'org', locationId: 'a' };
        function family(id, firstName, lastName, extra = {}) {
          return { family: { id, primaryFamilyContactPersonId: id + '-primary',
            adults: [{ item1: { id: id + '-primary', firstName, lastName,
              emailAddresses: [{ address: id + '@example.test' }],
              phoneNumbers: [{ number: id === 'smith' ? '(515) 123-4567' : '(555) 987-6543' }],
              addresses: [{ city: id === 'smith' ? 'Ames' : 'Pella' }] } },
              ...(extra.adults ?? [])], children: extra.children ?? [] }, partneringFamilyInfo: {} };
        }
        const families = [family('alex', 'Jordan', 'Alex'), family('smith', 'Alex', 'Smith', {
          adults: [{ item1: { id: 'jamie', firstName: 'Jamie', lastName: 'Smith' } }],
          children: [{ id: 'sam', firstName: 'Sam', lastName: 'Smith' }]
        })];
        export const useVisibleFamilies = () => families;
        export const useRequiredSelectedLocationContext = () => context;
        export const useSelectedLocationContext = () => context;
        export const useCurrentOrganizationLoadable = () => ({ organizationId: 'org', locations: [{ locationId: 'a' }] });
        export const useRefreshUserOrganizationAccess = () => () => {};
      `,
        ConfigurationModel: `
        import { atom } from 'jotai';
        const configuration = { organizationName: 'Organization', locations: [{ id: 'a', name: 'Atlantis' }] };
        export const useOrganizationConfigurationLoadable = () => configuration;
        export const useOrganizationConfiguration = () => configuration;
        export const useLocationConfigurationLoadable = () => configuration.locations[0];
        export const organizationConfigurationEdited = atom(null);
      `,
        SessionModel: `export const useUserIsOrganizationAdministratorLoadable = () => false;`,
        Auth: `export const logoutAsync = async () => { throw new Error('Unexpected logout'); };`,
        Api: `export const api = {};`,
        LocationScopedRoutes: `export const locationScopedRoutes = [];`,
        'posthog-js/react': `
        export const useFeatureFlagEnabled = () => true;
        export const useActiveFeatureFlags = () => [];
        export const usePostHog = () => ({ getEarlyAccessFeatures(callback) { callback([]); } });
      `,
      };
      const result = await build({
        input: 'shell-search-entry',
        platform: 'browser',
        tsconfig: false,
        onLog: ignoreModuleLevelDirectives,
        transform: {
          jsx: { runtime: 'automatic' },
          define: {
            'process.env.NODE_ENV': JSON.stringify('production'),
            'import.meta.env': JSON.stringify({ MODE: 'production' }),
            'import.meta.hot': 'undefined',
          },
        },
        plugins: [
          {
            name: 'shell-search-boundaries',
            resolveId(source, importer) {
              if (source.includes('.local'))
                throw new Error('Excluded local configuration');
              if (source === 'shell-search-entry') return entry;
              if (
                source !== 'posthog-js/react' &&
                importer?.replaceAll('\\', '/').includes('/node_modules/')
              )
                return null;
              const name =
                source === 'posthog-js/react'
                  ? source
                  : source.split('/').at(-1);
              return name && name in mocks ? `virtual:${name}` : null;
            },
            load(id) {
              if (id.startsWith('virtual:')) return mocks[id.slice(8)];
              if (id.replaceAll('\\', '/') !== entry.replaceAll('\\', '/'))
                return null;
              return `
            import { useState } from 'react';
            import { createRoot } from 'react-dom/client';
            import { CssBaseline, ThemeProvider } from '@mui/material';
            import { Provider } from 'jotai';
            import { BrowserRouter, useLocation } from 'react-router-dom';
            import { theme } from '../src/theme';
            import { ShellAppBar } from '../src/Shell/ShellAppBar';
            import { useScreenTitle } from '../src/Shell/ShellScreenTitle';
            import { EXPANDED_DRAWER_WIDTH } from '../src/Shell/shellLayoutConstants';
            function Shell() {
              const [open, setOpen] = useState(true);
              const location = useLocation();
              useScreenTitle('Inbox');
              return <><ShellAppBar menuDrawerOpen={open} setMenuDrawerOpen={setOpen} drawerWidth={EXPANDED_DRAWER_WIDTH + 'px'} />
                <main style={{ paddingTop: 300 }}><button>Outside search</button><output aria-label="Current route">{location.pathname}</output></main></>;
            }
            createRoot(document.getElementById('root')).render(<ThemeProvider theme={theme}><CssBaseline enableColorScheme /><Provider><BrowserRouter><Shell /></BrowserRouter></Provider></ThemeProvider>);
          `;
            },
          },
        ],
        output: { format: 'iife' },
        write: false,
      });
      const output = result.output.find((item) => item.type === 'chunk');
      if (!output || output.type !== 'chunk')
        throw new Error('Missing search browser bundle');
      bundle = output.code;
    });

    async function mountHeader(page: Page, width: number) {
      await page.setViewportSize({ width, height: 844 });
      await page.route('**/*', (route) =>
        route.fulfill({
          contentType: 'text/html',
          body: '<html><body><div id="root"></div></body></html>',
        })
      );
      await page.goto('http://shell.test/org/org/a/inbox');
      await page.evaluate(() => {
        Object.defineProperties(document, {
          fullscreenEnabled: { configurable: true, value: true },
          fullscreenElement: { configurable: true, value: null },
          exitFullscreen: { configurable: true, value: async () => {} },
        });
        Object.defineProperty(document.documentElement, 'requestFullscreen', {
          configurable: true,
          value: async () => {},
        });
      });
      await page.addScriptTag({ content: bundle });
      await expect(page.getByRole('banner')).toBeVisible();
    }

    async function openSearch(page: Page, width: number) {
      const header = page.getByRole('banner');
      const input = header.getByRole('combobox', {
        name: 'Search families and people',
        exact: true,
      });
      if (width < 900) {
        await input.focus();
        await page
          .getByRole('button', { name: 'Outside search', exact: true })
          .click();
        await expect(input).toHaveCount(0);
        await header.locator('.MuiContainer-root').getByRole('button').click();
        await expect(input).toBeVisible();
        await input.click();
        await expect(input).toBeFocused();
      } else await input.focus();
      return input;
    }

    for (const width of [320, 390, 600, 768, 899, 900, 1440]) {
      headerSearchTest(
        `short placeholder fits the real header at ${width}px`,
        async ({ page }) => {
          await mountHeader(page, width);
          const input = await openSearch(page, width);
          await expect(input).toHaveAttribute('placeholder', 'Search families');
          await expect(input).toHaveAccessibleName(
            'Search families and people'
          );
          await expect(
            page.getByPlaceholder('Search families and people')
          ).toHaveCount(0);
          const measurement = await input.evaluate(async (element) => {
            await document.fonts.ready;
            const input = element as HTMLInputElement;
            const style = getComputedStyle(input);
            const placeholder = getComputedStyle(input, '::placeholder');
            const context = document.createElement('canvas').getContext('2d')!;
            context.font = placeholder.font || style.font;
            const spacing = Number.parseFloat(placeholder.letterSpacing) || 0;
            return {
              required:
                context.measureText(input.placeholder).width +
                spacing * (input.placeholder.length - 1),
              available:
                input.clientWidth -
                Number.parseFloat(style.paddingLeft) -
                Number.parseFloat(style.paddingRight),
            };
          });
          expect(
            measurement.required,
            JSON.stringify(measurement)
          ).toBeLessThanOrEqual(measurement.available);
          await expect(
            page
              .getByRole('banner')
              .getByRole('button', { name: 'user account', exact: true })
          ).toBeVisible();
          const fullscreen = page
            .getByRole('banner')
            .getByRole('button', { name: 'Enter fullscreen', exact: true });
          if (width < 1200) await expect(fullscreen).toHaveCount(0);
          else await expect(fullscreen).toBeVisible();
        }
      );
    }

    for (const width of [390, 1440]) {
      headerSearchTest(
        `search results, clearing, dismissal and family navigation stay unchanged at ${width}px`,
        async ({ page }) => {
          await mountHeader(page, width);
          const input = await openSearch(page, width);
          for (const query of [
            'Jamie',
            'Sam',
            'smith@example.test',
            '5151234567',
          ]) {
            await input.fill(query);
            const options = page.getByRole('option');
            await expect(options).toHaveCount(1);
            await expect(options).toContainText('Alex Smith Family');
          }
          await input.fill('Pella');
          await expect(page.getByRole('option')).toHaveCount(1);
          await expect(page.getByRole('option')).toContainText(
            'Jordan Alex Family'
          );
          await input.fill('Alex');
          await expect(page.getByRole('option')).toHaveCount(2);
          await expect(page.getByRole('option').nth(0)).toContainText(
            'Alex Smith Family'
          );
          await expect(page.getByRole('option').nth(1)).toContainText(
            'Jordan Alex Family'
          );
          await input.fill('');
          await expect(input).toHaveValue('');
          await expect(page.getByRole('option')).toHaveCount(2);
          await input.press('Escape');
          await expect(page.getByRole('listbox')).toHaveCount(0);
          await page
            .getByRole('button', { name: 'Outside search', exact: true })
            .click();
          if (width < 900) {
            await expect(input).toHaveCount(0);
            await page
              .getByRole('banner')
              .locator('.MuiContainer-root')
              .getByRole('button')
              .click();
            await expect(input).toBeVisible();
            await input.click();
            await expect(input).toBeFocused();
          } else await input.focus();
          await expect(input).toHaveValue('');
          await input.fill('Alex');
          await input.press('Enter');
          await expect(
            page.getByRole('status', { name: 'Current route', exact: true })
          ).toHaveText('/org/org/a/families/smith');
          await expect(page).toHaveURL(
            'http://shell.test/org/org/a/families/smith'
          );
        }
      );
    }
  }
);

test('normalizes repeated whitespace when matching full names', () => {
  expect(normalizeShellSearchText('Alex  Smith')).toBe(
    normalizeShellSearchText('Alex Smith')
  );
});

test('finds a case-insensitive text range to highlight', () => {
  expect(findShellSearchHighlightRange('Ashley Johnson', 'John')).toEqual({
    start: 7,
    end: 11,
  });
});

test('finds a digit range across formatted phone punctuation', () => {
  expect(
    findShellSearchHighlightRange('(515) 304-8087', '515304', '5153048087')
  ).toEqual({ start: 1, end: 9 });
});

test('ranks primary-contact matches before household and address matches', () => {
  const addressMatch = {
    id: 'address-match',
    normalizedPrimaryContactFirstName: 'katie',
    normalizedPrimaryContactLastName: 'hommer',
    normalizedPrimaryContactName: 'katie hommer',
    normalizedOtherNameTexts: [],
    normalizedSearchText: 'johnston ia',
    phones: [],
  };
  const householdNameMatch = {
    id: 'household-name-match',
    normalizedPrimaryContactFirstName: 'deborah',
    normalizedPrimaryContactLastName: 'dunn',
    normalizedPrimaryContactName: 'deborah dunn',
    normalizedOtherNameTexts: ['john dunn'],
    normalizedSearchText: 'pella ia',
    phones: [],
  };
  const primaryContactMatch = {
    id: 'primary-contact-match',
    normalizedPrimaryContactFirstName: 'john',
    normalizedPrimaryContactLastName: 'rudd',
    normalizedPrimaryContactName: 'john rudd',
    normalizedOtherNameTexts: [],
    normalizedSearchText: 'ames ia',
    phones: [],
  };

  expect(
    filterAndRankShellSearchResults(
      [addressMatch, householdNameMatch, primaryContactMatch],
      'John',
      100
    )
  ).toEqual([primaryContactMatch, householdNameMatch, addressMatch]);
});

test('ranks primary-contact first-name matches before last-name matches', () => {
  const lastNameMatch = {
    id: 'last-name-match',
    normalizedPrimaryContactFirstName: 'ashley',
    normalizedPrimaryContactLastName: 'johnson',
    normalizedPrimaryContactName: 'ashley johnson',
    normalizedOtherNameTexts: [],
    normalizedSearchText: '',
    phones: [],
  };
  const firstNameMatch = {
    id: 'first-name-match',
    normalizedPrimaryContactFirstName: 'john',
    normalizedPrimaryContactLastName: 'rudd',
    normalizedPrimaryContactName: 'john rudd',
    normalizedOtherNameTexts: [],
    normalizedSearchText: '',
    phones: [],
  };

  expect(
    filterAndRankShellSearchResults(
      [lastNameMatch, firstNameMatch],
      'John',
      100
    )
  ).toEqual([firstNameMatch, lastNameMatch]);
});

test('preserves source order within each shell-search priority group', () => {
  const firstAddressMatch = {
    id: 'first-address-match',
    normalizedPrimaryContactFirstName: 'katie',
    normalizedPrimaryContactLastName: 'hommer',
    normalizedPrimaryContactName: 'katie hommer',
    normalizedOtherNameTexts: [],
    normalizedSearchText: 'johnston ia',
    phones: [],
  };
  const secondAddressMatch = {
    id: 'second-address-match',
    normalizedPrimaryContactFirstName: 'tom',
    normalizedPrimaryContactLastName: 'noteboom',
    normalizedPrimaryContactName: 'tom noteboom',
    normalizedOtherNameTexts: [],
    normalizedSearchText: 'johnston ia',
    phones: [],
  };
  const firstNameMatch = {
    id: 'first-name-match',
    normalizedPrimaryContactFirstName: 'deborah',
    normalizedPrimaryContactLastName: 'dunn',
    normalizedPrimaryContactName: 'deborah dunn',
    normalizedOtherNameTexts: ['john dunn'],
    normalizedSearchText: 'pella ia',
    phones: [],
  };
  const secondNameMatch = {
    id: 'second-name-match',
    normalizedPrimaryContactFirstName: 'catherine',
    normalizedPrimaryContactLastName: 'bierman',
    normalizedPrimaryContactName: 'catherine bierman',
    normalizedOtherNameTexts: ['dominic johnson'],
    normalizedSearchText: 'west des moines ia',
    phones: [],
  };

  expect(
    filterAndRankShellSearchResults(
      [firstAddressMatch, firstNameMatch, secondAddressMatch, secondNameMatch],
      'John',
      100
    )
  ).toEqual([
    firstNameMatch,
    secondNameMatch,
    firstAddressMatch,
    secondAddressMatch,
  ]);
});
