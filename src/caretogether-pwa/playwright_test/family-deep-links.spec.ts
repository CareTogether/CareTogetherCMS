import { expect, test } from './support/fixtures';
import type { Page } from '@playwright/test';
import { build } from 'rolldown';
import { fileURLToPath } from 'node:url';
import { ignoreModuleLevelDirectives } from './support/harnessBuild';
import { ATLANTIS_ROUTE } from './support/constants';
import {
  FamilyRecordsAggregate,
  Permission,
  RecordsAggregate,
} from '../src/GeneratedClient';

const SKYWALKER_FAMILY_ID = '22222222-2222-2222-2222-222222222222';
const BEN_SOLO_PERSON_ID = '77777777-7777-7777-7777-777777777777';
const DOE_FAMILY_ID = '11111111-1111-1111-1111-111111111111';
const DOE_V1_CASE_ID = '11111111-1111-1111-1111-111111111111';
const DOE_ARRANGEMENT_ID = '11111111-1111-1111-1111-111111111111';

function familyRoute(familyId: string, searchParams?: URLSearchParams) {
  const search = searchParams?.size ? `?${searchParams.toString()}` : '';
  return `${ATLANTIS_ROUTE}families/${familyId}${search}`;
}

type DocumentTestOptions = {
  read?: boolean;
  delete?: boolean;
  referrals?: boolean;
  empty?: boolean;
  many?: boolean;
  familyId?: string;
  locationId?: string;
  expanded?: boolean;
  removed?: string;
};
declare global {
  interface Window {
    documentTest: {
      calls: { kind: string; args: string[] }[];
      scope: { organizationId: string; locationId: string };
      deferred: boolean;
      failPreview: boolean;
      failDownload: boolean;
      pending: ((url: string) => void)[];
      render: (options?: DocumentTestOptions) => void;
    };
  }
}

const documentsTest = test.extend({ video: 'off' });
documentsTest.describe(
  'responsive Family documents with mocked services',
  () => {
    documentsTest.use({ storageState: { cookies: [], origins: [] } });
    let bundle: string;
    documentsTest.beforeAll(async () => {
      const entry = fileURLToPath(
        new URL('./family-documents-entry.tsx', import.meta.url)
      );
      const mocks: Record<string, string> = {
        Auth: `export const useAccountInfo = () => ({userId:'user'});`,
        Data: `export const useSelectedLocationContext = () => window.documentTest.scope;`,
        DirectoryModel: `export const useDirectoryModel = () => ({deleteUploadedFamilyDocument: async (...args) => { window.documentTest.calls.push({kind:'delete',args}); window.documentTest.remove(args[1]); }});`,
        FilesModel: `
        const preview = (kind,args) => {
          const fixture=window.documentTest; fixture.calls.push({kind,args});
          if(fixture.failPreview) return Promise.reject(new Error('preview failed'));
          if(fixture.deferred) return new Promise(resolve=>fixture.pending.push(resolve));
          return Promise.resolve('https://documents.test/'+args.at(-1));
        };
        const download = async (kind,args) => {window.documentTest.calls.push({kind,args}); if(window.documentTest.failDownload) throw new Error('download failed');};
        export const getFamilyFilePreviewUrl = (...args) => preview('family-preview',args);
        export const getV1ReferralFilePreviewUrl = (...args) => preview('referral-preview',args);
        export const downloadFamilyFile = (...args) => download('family-download',args);
        export const downloadV1ReferralFile = (...args) => download('referral-download',args);
      `,
      };
      const result = await build({
        input: 'family-documents-entry',
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
            name: 'document-service-boundaries',
            resolveId(source, importer) {
              if (source.includes('.local'))
                throw new Error('Excluded local configuration');
              if (source === 'family-documents-entry') return entry;
              if (importer?.replaceAll('\\', '/').includes('/node_modules/'))
                return null;
              const name = source.split('/').at(-1);
              return name && name in mocks ? 'virtual:' + name : null;
            },
            load(id) {
              if (id.startsWith('virtual:')) return mocks[id.slice(8)];
              if (id.replaceAll('\\', '/') !== entry.replaceAll('\\', '/'))
                return null;
              return `
            import {createRoot} from 'react-dom/client';
            import {Box,Container,CssBaseline,ThemeProvider,useMediaQuery} from '@mui/material';
            import {Provider} from 'jotai';
            import {theme} from '../src/theme';
            import {CombinedFamilyInfo,Permission,V1Referral} from '../src/GeneratedClient';
            import {FamilyDocumentsSectionV2} from '../src/Families/FamilyDocumentsSectionV2';
            import {FamilyQuickActionsV2} from '../src/Families/FamilyQuickActionsV2';
            const root=createRoot(document.getElementById('root'));
            let options={};
            window.documentTest={calls:[],scope:{organizationId:'org',locationId:'location'},pending:[],deferred:false,failPreview:false,failDownload:false};
            const doc=(id,name,day=1)=>({uploadedDocumentId:id,uploadedFileName:name,timestampUtc:'2026-01-0'+day+'T00:00:00Z',userId:'uploader'});
            function Screen({options}) {
              const desktop=useMediaQuery(theme.breakpoints.up('md'));
              const offset=desktop?(options.expanded===false?48:190):0, nav=desktop?0:56, clearance=desktop?90:146;
              const documents=options.empty?[]:[doc('image','duplicate.png',4),doc('pdf','x'.repeat(100)+'.pdf',3),doc('word','report.docx',2),doc(undefined,'Missing id.pdf'),{uploadedDocumentId:'unknown'}];
              if(options.many&&!options.empty) for(let i=0;i<25;i++)documents.push(doc('extra-'+i,'extra-'+i+'.txt'));
              const family=CombinedFamilyInfo.fromJS({family:{id:options.familyId??'family'},uploadedDocuments:documents.filter(d=>!options.removed||d.uploadedDocumentId!==options.removed)});
              const referrals=options.referrals===false||options.empty?[]:[V1Referral.fromJS({referralId:'referral',title:'Intake',uploadedDocuments:[doc('ref-image','duplicate.png',5)]})];
              const permissions=p=>p===Permission.ReadFamilyDocuments?options.read!==false:p===Permission.DeleteFamilyDocuments?options.delete!==false:true;
              return <Box sx={{'--shell-content-inline-offset':offset+'px','--shell-bottom-navigation-height':nav+'px','--shell-bottom-clearance':clearance+'px'}}>
                <Box sx={{ml:offset+'px'}}><Container maxWidth={false} sx={{px:{xs:2,sm:3},pb:clearance+'px'}}>
                  <FamilyDocumentsSectionV2 family={family} referrals={referrals} permissions={permissions} organizationId="org" locationId={window.documentTest.scope.locationId} uploaderLabel={id=>id?'Uploader Person':undefined}/>
                  <FamilyQuickActionsV2 canAddNotes canUploadDocuments onAddNote={()=>{}} onUploadDocuments={()=>{}}/>
                </Container></Box>
                {!desktop&&<Box aria-label="Fixture navigation" sx={{position:'fixed',bottom:0,left:0,right:0,height:56}}/>}
              </Box>;
            }
            window.documentTest.render=(next={})=>{options=next;window.documentTest.scope={organizationId:'org',locationId:next.locationId??'location'};root.render(<ThemeProvider theme={theme}><CssBaseline/><Provider><Screen options={options}/></Provider></ThemeProvider>);};
            window.documentTest.remove=id=>window.documentTest.render({...options,removed:id});
            window.documentTest.render();
          `;
            },
          },
        ],
        output: { format: 'iife' },
        write: false,
      });
      const output = result.output.find((item) => item.type === 'chunk');
      if (!output) throw new Error('Missing document test bundle');
      bundle = output.code;
    });

    async function mount(
      page: Page,
      width = 390,
      options: DocumentTestOptions = {}
    ) {
      await page.setViewportSize({ width, height: 900 });
      await page.route('**/*', (route) =>
        route.fulfill({ status: 404, body: '' })
      );
      await page.route('http://family-documents.test/**', (route) =>
        route.fulfill({
          contentType: 'text/html',
          body: '<!DOCTYPE html><html><body><div id="root"></div></body></html>',
        })
      );
      await page.goto('http://family-documents.test/');
      await page.addScriptTag({ content: bundle });
      await page.evaluate(
        (options) => window.documentTest.render(options),
        options
      );
      await expect(page.getByText('Documents', { exact: true })).toBeVisible();
    }

    for (const width of [
      320, 390, 600, 768, 899, 900, 1024, 1199, 1200, 1440,
    ]) {
      documentsTest(`document presentation at ${width}px`, async ({ page }) => {
        await mount(page, width, { many: true });
        if (width >= 1200) {
          await expect(page.getByRole('grid')).toBeVisible();
          await expect(
            page.getByRole('columnheader', {
              name: 'Document Name',
              exact: true,
            })
          ).toBeVisible();
          await expect(
            page.getByRole('searchbox', {
              name: 'Search documents',
              exact: true,
            })
          ).toHaveCount(0);
          return;
        }
        await expect(page.getByRole('grid')).toHaveCount(0);
        const list = page.getByRole('list', {
          name: 'Family documents',
          exact: true,
        });
        await expect(list.getByRole('button')).toHaveCount(31);
        const first = list.getByRole('button').first();
        await expect(first).toContainText('Referral: Intake');
        await expect(first).toContainText('01/05/26');
        expect((await first.boundingBox())!.height).toBeGreaterThanOrEqual(48);
        expect(await list.locator('.ph-unmask').count()).toBe(0);
        expect(
          await first.evaluate((element) =>
            Boolean(element.closest('.ph-unmask'))
          )
        ).toBe(false);
        await page.evaluate(() =>
          scrollTo(0, document.documentElement.scrollHeight)
        );
        const last = (await list.getByRole('button').last().boundingBox())!;
        const dock = (await page
          .getByRole('toolbar', { name: 'Family quick actions' })
          .boundingBox())!;
        expect(last.y + last.height).toBeLessThanOrEqual(dock.y);
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth)
        ).toBeLessThanOrEqual(width);
        if (width >= 900) {
          await page.evaluate(() =>
            window.documentTest.render({ many: true, expanded: false })
          );
          await expect(list).toBeVisible();
          expect((await list.boundingBox())!.x).toBeGreaterThanOrEqual(48);
        }
      });
    }

    documentsTest(
      'filename search, duplicate names, no matches and missing metadata',
      async ({ page }) => {
        await mount(page);
        const list = page.getByRole('list', { name: 'Family documents' });
        const search = page.getByRole('searchbox', {
          name: 'Search documents',
        });
        await search.fill('  DUPLICATE.P  ');
        await expect(list.getByRole('button')).toHaveCount(2);
        await search.fill('Uploader');
        await expect(page.getByRole('status')).toHaveText(
          'No matching documents.'
        );
        await search.fill('');
        await expect(list.getByRole('button')).toHaveCount(6);
        await list.getByRole('button', { name: /report.docx/ }).click();
        const dialog = page.getByRole('dialog', {
          name: 'report.docx',
          exact: true,
        });
        await expect(dialog).toContainText('DOCX');
        await expect(dialog).toContainText('Uploader Person');
        expect(await page.evaluate(() => window.documentTest.calls)).toEqual(
          []
        );
        await dialog
          .getByRole('button', { name: 'Close document preview' })
          .click();
        await expect(
          list.getByRole('button', { name: /report.docx/ })
        ).toBeFocused();
      }
    );

    documentsTest(
      'metadata-only details do not request content or expose downloads',
      async ({ page }) => {
        await mount(page, 390, {
          read: false,
          delete: false,
          referrals: false,
        });
        const row = page
          .getByRole('list', { name: 'Family documents' })
          .getByRole('button', { name: /duplicate.png/ });
        await row.focus();
        await row.press('Space');
        const dialog = page.getByRole('dialog', {
          name: 'duplicate.png',
          exact: true,
        });
        await expect(dialog).toBeVisible();
        await expect(
          dialog.getByRole('button', { name: /Download|Delete/ })
        ).toHaveCount(0);
        await expect(dialog.getByRole('link')).toHaveCount(0);
        expect(await page.evaluate(() => window.documentTest.calls)).toEqual(
          []
        );
        await page.keyboard.press('Escape');
        await expect(row).toBeFocused();
      }
    );

    documentsTest(
      'source-specific previews and downloads, failures and missing IDs',
      async ({ page }) => {
        await mount(page);
        const rows = page
          .getByRole('list', { name: 'Family documents' })
          .getByRole('button', { name: /duplicate.png/ });
        await rows.first().click();
        let dialog = page.getByRole('dialog', {
          name: 'duplicate.png',
          exact: true,
        });
        await expect(dialog.locator('img')).toHaveAttribute(
          'src',
          'https://documents.test/ref-image'
        );
        await expect(
          dialog.getByRole('button', { name: /Delete/ })
        ).toHaveCount(0);
        await dialog
          .getByRole('button', { name: 'Download duplicate.png', exact: true })
          .click();
        expect(
          await page.evaluate(() => window.documentTest.calls.at(-1))
        ).toMatchObject({
          kind: 'referral-download',
          args: ['org', 'location', 'referral', 'ref-image'],
        });
        await dialog
          .getByRole('button', { name: 'Close document preview' })
          .click();
        await rows.nth(1).click();
        dialog = page.getByRole('dialog', {
          name: 'duplicate.png',
          exact: true,
        });
        await expect(dialog.locator('img')).toHaveAttribute(
          'src',
          'https://documents.test/image'
        );
        await page.evaluate(() => {
          window.documentTest.failDownload = true;
        });
        await dialog
          .getByRole('button', { name: 'Download duplicate.png', exact: true })
          .click();
        await expect(dialog.getByRole('alert')).toContainText(
          'Download is unavailable'
        );
        expect(
          await page.evaluate(() => window.documentTest.calls.at(-1)?.kind)
        ).toBe('family-download');
        await dialog
          .getByRole('button', { name: 'Close document preview' })
          .click();
        await page.evaluate(() => {
          window.documentTest.failPreview = true;
        });
        await rows.nth(1).click();
        await expect(page.getByRole('dialog')).toContainText(
          'Preview is unavailable'
        );
        await page
          .getByRole('button', { name: 'Close document preview' })
          .click();
        await page
          .getByRole('list', { name: 'Family documents' })
          .getByRole('button', { name: /Missing id.pdf/ })
          .click();
        await expect(page.getByRole('dialog')).toContainText(
          'identifier is missing'
        );
        await expect(
          page
            .getByRole('dialog')
            .getByRole('button', { name: /Download|Delete/ })
        ).toHaveCount(0);
      }
    );

    documentsTest(
      'delete closes details before confirmation and cancel preserves the document',
      async ({ page }) => {
        await mount(page);
        const row = page
          .getByRole('list', { name: 'Family documents' })
          .getByRole('button', { name: /report.docx/ });
        await row.click();
        await page
          .getByRole('button', { name: 'Delete report.docx', exact: true })
          .click();
        const confirmation = page.getByRole('dialog', {
          name: "Are you sure you want to delete 'report.docx'?",
          exact: true,
        });
        await expect(confirmation).toBeVisible();
        await expect(page.getByRole('dialog')).toHaveCount(1);
        await confirmation
          .getByRole('button', { name: 'Cancel', exact: true })
          .click();
        await expect(row).toBeVisible();
        await expect(row).toBeFocused();
        expect(
          await page.evaluate(() =>
            window.documentTest.calls.filter((call) => call.kind === 'delete')
          )
        ).toEqual([]);
        await row.click();
        await page
          .getByRole('button', { name: 'Delete report.docx', exact: true })
          .click();
        await confirmation
          .getByRole('button', { name: 'Save', exact: true })
          .click();
        await expect(row).toHaveCount(0);
        expect(
          await page.evaluate(() => window.documentTest.calls.at(-1))
        ).toMatchObject({ kind: 'delete', args: ['family', 'word'] });
      }
    );

    documentsTest(
      'pending previews are invalidated on close, selection and scope changes',
      async ({ page }) => {
        await mount(page);
        await page.evaluate(() => {
          window.documentTest.deferred = true;
        });
        const rows = page
          .getByRole('list', { name: 'Family documents' })
          .getByRole('button', { name: /duplicate.png/ });
        await rows.first().click();
        await expect(page.getByRole('progressbar')).toBeVisible();
        await page
          .getByRole('button', { name: 'Close document preview' })
          .click();
        await rows.nth(1).click();
        await page.evaluate(() =>
          window.documentTest.pending[0]('https://documents.test/stale')
        );
        await expect(page.getByRole('progressbar')).toBeVisible();
        await page.evaluate(() =>
          window.documentTest.pending[1]('https://documents.test/current')
        );
        await expect(page.getByRole('dialog').locator('img')).toHaveAttribute(
          'src',
          'https://documents.test/current'
        );
        await page.evaluate(() =>
          window.documentTest.render({
            familyId: 'other',
            locationId: 'other-location',
          })
        );
        await expect(page.getByRole('dialog')).toHaveCount(0);
        await expect(
          page.getByRole('searchbox', { name: 'Search documents' })
        ).toHaveValue('');
        await rows.first().click();
        await page.evaluate(() =>
          window.documentTest.render({
            familyId: 'third',
            locationId: 'third-location',
          })
        );
        await page.evaluate(() =>
          window.documentTest.pending[2](
            'https://documents.test/obsolete-scope'
          )
        );
        await expect(page.getByRole('dialog')).toHaveCount(0);
      }
    );

    documentsTest(
      'mobile search does not overwrite desktop filters across resize',
      async ({ page }) => {
        await mount(page, 1440);
        await expect(page.getByRole('grid')).toBeVisible();
        const key =
          'caretogether:dataGridFilterPreferences:v1:familyDocuments:user:org:location:family';
        await page.evaluate(
          (key) =>
            localStorage.setItem(
              key,
              JSON.stringify({
                version: 1,
                items: [],
                logicOperator: 'and',
                quickFilterValues: ['report'],
              })
            ),
          key
        );
        await page.setViewportSize({ width: 390, height: 900 });
        await page
          .getByRole('searchbox', { name: 'Search documents' })
          .fill('duplicate');
        const saved = await page.evaluate(
          (key) => localStorage.getItem(key),
          key
        );
        await page.setViewportSize({ width: 1440, height: 900 });
        await expect(page.getByRole('grid')).toBeVisible();
        await expect(page.getByRole('row')).toHaveCount(2);
        expect(
          await page.evaluate((key) => localStorage.getItem(key), key)
        ).toBe(saved);
      }
    );

    documentsTest(
      'PDF details retain preview, read-only actions and long filenames',
      async ({ page }) => {
        await mount(page, 320, { delete: false, referrals: false });
        const row = page
          .getByRole('list', { name: 'Family documents' })
          .getByRole('button', { name: /x{100}\.pdf/ });
        await row.focus();
        await row.press('Enter');
        const dialog = page.getByRole('dialog', {
          name: 'x'.repeat(100) + '.pdf',
          exact: true,
        });
        await expect(dialog.locator('iframe')).toHaveAttribute(
          'src',
          'https://documents.test/pdf'
        );
        await expect(
          dialog.getByRole('button', { name: /Download/ })
        ).toHaveCount(1);
        await expect(
          dialog.getByRole('button', { name: /Delete/ })
        ).toHaveCount(0);
        await expect(dialog.getByRole('link')).toHaveAttribute(
          'target',
          '_blank'
        );
        expect(
          await dialog.evaluate((e) => e.scrollWidth <= e.clientWidth)
        ).toBe(true);
        await page.keyboard.press('Escape');
        await expect(row).toBeFocused();
        await page
          .getByRole('list', { name: 'Family documents' })
          .getByRole('button', { name: '- - · Family', exact: true })
          .click();
        await expect(page.getByRole('dialog')).toContainText('File type');
        await expect(
          page.getByRole('dialog').getByText('Uploaded by', { exact: true })
        ).toHaveCount(0);
      }
    );

    documentsTest(
      'desktop sorting survives a compact layout and details remain open across resize',
      async ({ page }) => {
        await mount(page, 1440);
        await page
          .getByRole('columnheader', { name: 'Document Name', exact: true })
          .click();
        const names = await page
          .locator('.MuiDataGrid-row [data-field="documentName"]')
          .allTextContents();
        await page.setViewportSize({ width: 390, height: 900 });
        await page
          .getByRole('list', { name: 'Family documents' })
          .getByRole('button', { name: /report.docx/ })
          .click();
        await page.setViewportSize({ width: 1440, height: 900 });
        await expect(
          page.getByRole('dialog', { name: 'report.docx', exact: true })
        ).toBeVisible();
        await page
          .getByRole('button', { name: 'Close document preview' })
          .click();
        await expect(page.getByRole('grid')).toBeVisible();
        expect(
          await page
            .locator('.MuiDataGrid-row [data-field="documentName"]')
            .allTextContents()
        ).toEqual(names);
        await expect(
          page
            .locator('[tabindex="-1"]')
            .filter({ has: page.getByRole('grid') })
            .first()
        ).toBeFocused();
      }
    );

    documentsTest(
      'desktop column visibility survives switching to the list',
      async ({ page }) => {
        await mount(page, 1440);
        await page
          .getByRole('button', { name: 'Columns', exact: true })
          .click();
        await page
          .getByRole('checkbox', { name: 'Source', exact: true })
          .check();
        await page.keyboard.press('Escape');
        await expect(
          page.getByRole('columnheader', { name: 'Source', exact: true })
        ).toBeVisible();
        await page.setViewportSize({ width: 390, height: 900 });
        await expect(
          page.getByRole('list', { name: 'Family documents' })
        ).toBeVisible();
        await page.setViewportSize({ width: 1440, height: 900 });
        await expect(
          page.getByRole('columnheader', { name: 'Source', exact: true })
        ).toBeVisible();
      }
    );

    documentsTest(
      'delete permission remains independent of content read access',
      async ({ page }) => {
        await mount(page, 390, { read: false, referrals: false });
        await page
          .getByRole('list', { name: 'Family documents' })
          .getByRole('button', { name: /report.docx/ })
          .click();
        const dialog = page.getByRole('dialog', {
          name: 'report.docx',
          exact: true,
        });
        await expect(
          dialog.getByRole('button', { name: /Download/ })
        ).toHaveCount(0);
        await dialog
          .getByRole('button', { name: 'Delete report.docx', exact: true })
          .click();
        await expect(page.getByRole('dialog')).toHaveCount(1);
        await page.getByRole('button', { name: 'Cancel', exact: true }).click();
        expect(await page.evaluate(() => window.documentTest.calls)).toEqual(
          []
        );
      }
    );

    documentsTest(
      'empty collections preserve the existing empty state',
      async ({ page }) => {
        await mount(page, 390, { empty: true });
        await expect(
          page.getByText('No documents yet.', { exact: true })
        ).toBeVisible();
        await expect(
          page.getByRole('list', { name: 'Family documents' })
        ).toHaveCount(0);
      }
    );
  }
);

test.describe('family quick actions @pr', () => {
  for (const width of [320, 390, 600, 768, 899, 900, 1024, 1199, 1200, 1440]) {
    test(`persistent quick actions at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(familyRoute(SKYWALKER_FAMILY_ID));
      await expect(
        page.getByRole('button', { name: 'family actions', exact: true })
      ).toBeVisible();
      const toolbar = page.getByRole('toolbar', {
        name: 'Family quick actions',
        exact: true,
      });
      if (width >= 1200) {
        await expect(toolbar).toHaveCount(0);
        await expect(
          page.getByRole('button', { name: 'Note', exact: true })
        ).toHaveCount(1);
        await expect(
          page.getByRole('button', { name: 'Upload', exact: true })
        ).toHaveCount(1);
        return;
      }
      await expect(
        toolbar.getByRole('button', { name: 'Add Note', exact: true })
      ).toBeVisible();
      await expect(
        toolbar.getByRole('button', { name: 'Upload Document', exact: true })
      ).toBeVisible();
      await expect(toolbar.getByRole('button')).toHaveCount(2);
      for (const button of await toolbar.getByRole('button').all()) {
        expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(48);
      }
      const layout = await toolbar.evaluate((element) => {
        const style = getComputedStyle(element);
        const buttons = Array.from(element.querySelectorAll('button'));
        return {
          width: element.getBoundingClientRect().width,
          right:
            element.getBoundingClientRect().right -
            Number.parseFloat(style.paddingRight),
          left:
            element.getBoundingClientRect().left +
            Number.parseFloat(style.paddingLeft),
          buttonWidth: buttons.reduce(
            (sum, button) => sum + button.getBoundingClientRect().width,
            0
          ),
          lastRight: buttons.at(-1)!.getBoundingClientRect().right,
          firstLeft: buttons[0].getBoundingClientRect().left,
          shadow: style.boxShadow,
          borders: [
            style.borderTopWidth,
            style.borderRightWidth,
            style.borderBottomWidth,
            style.borderLeftWidth,
          ],
        };
      });
      expect(layout.buttonWidth).toBeLessThan(layout.width);
      expect(
        Math.abs(
          (layout.firstLeft + layout.lastRight) / 2 -
            (layout.left + layout.right) / 2
        )
      ).toBeLessThanOrEqual(1);
      expect(layout.shadow).toBe('none');
      expect(layout.borders).toEqual(['1px', '0px', '0px', '0px']);
      const navigationHeight =
        width < 900
          ? (await page
              .getByRole('button', {
                name: 'Open navigation menu',
                exact: true,
              })
              .locator('..')
              .boundingBox())!.height
          : 0;
      for (const position of ['start', 'middle', 'bottom']) {
        await page.evaluate((position) => {
          const maximum = document.documentElement.scrollHeight - innerHeight;
          window.scrollTo(
            0,
            position === 'start'
              ? 0
              : position === 'middle'
                ? maximum / 2
                : maximum
          );
        }, position);
        await expect(toolbar).toBeInViewport();
        const dock = (await toolbar.boundingBox())!;
        expect(dock.height).toBe(57);
        expect(
          Math.abs(dock.y + dock.height - (900 - navigationHeight))
        ).toBeLessThanOrEqual(1);
      }
      await page.evaluate(() =>
        window.scrollTo(0, document.documentElement.scrollHeight)
      );
      await expect(toolbar).toBeInViewport();
      const bounds = (await toolbar.boundingBox())!;
      const header = (await page.getByRole('banner').boundingBox())!;
      expect(bounds.y).toBeGreaterThanOrEqual(header.y + header.height);
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth)
      ).toBeLessThanOrEqual(width);
      if (width < 900) {
        const navigation = (await page
          .getByRole('button', { name: 'Open navigation menu', exact: true })
          .boundingBox())!;
        expect(
          Math.abs(bounds.y + bounds.height - navigation.y)
        ).toBeLessThanOrEqual(1);
      } else {
        const header = page.getByRole('banner');
        const expand = header.getByRole('button', {
          name: 'Expand sidebar',
          exact: true,
        });
        if (await expand.isVisible()) await expand.click();
        expect((await toolbar.boundingBox())!.x).toBe(190);
        await header
          .getByRole('button', { name: 'Collapse sidebar', exact: true })
          .click();
        expect((await toolbar.boundingBox())!.x).toBe(48);
        await expand.click();
        expect((await toolbar.boundingBox())!.x).toBe(190);
      }
      expect(
        (await toolbar.locator('..').boundingBox())!.y
      ).toBeLessThanOrEqual(bounds.y);
      await page.setViewportSize({ width: 1200, height: 900 });
      await expect(toolbar).toHaveCount(0);
      await page.setViewportSize({ width, height: 900 });
      await expect(toolbar).toBeVisible();
      const note = toolbar.getByRole('button', {
        name: 'Add Note',
        exact: true,
      });
      await note.focus();
      await note.press('Enter');
      await expect(
        page.getByRole('heading', { name: 'Add New Note', exact: true })
      ).toBeVisible();
      expect(
        await page.evaluate(() => {
          const dock = document.querySelector(
            '[role="toolbar"][aria-label="Family quick actions"]'
          )!;
          const bounds = dock.querySelector('button')!.getBoundingClientRect();
          return dock.contains(
            document.elementFromPoint(
              bounds.x + bounds.width / 2,
              bounds.y + bounds.height / 2
            )
          );
        })
      ).toBe(false);
      await page.getByRole('button', { name: 'Cancel', exact: true }).click();
      await expect(note).toBeFocused();
      const upload = toolbar.getByRole('button', {
        name: 'Upload Document',
        exact: true,
      });
      await upload.focus();
      await upload.press('Space');
      await expect(
        page.getByRole('heading', {
          name: 'Upload Family Documents',
          exact: true,
        })
      ).toBeVisible();
      await page.getByRole('button', { name: 'Cancel', exact: true }).click();
      await expect(upload).toBeFocused();
    });
  }

  for (const [notes, upload] of [
    [true, true],
    [true, false],
    [false, true],
    [false, false],
  ]) {
    test(`quick action permissions notes=${notes}, upload=${upload}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 390, height: 900 });
      await page.route('**/Records', async (route) => {
        const response = await route.fetch();
        const records = (await response.json()).map(
          RecordsAggregate.fromJS
        ) as RecordsAggregate[];
        const target = records.find(
          (record) =>
            record instanceof FamilyRecordsAggregate &&
            record.family?.family?.id === SKYWALKER_FAMILY_ID
        ) as FamilyRecordsAggregate;
        expect(target).toBeTruthy();
        target.family!.userPermissions = (
          target.family!.userPermissions ?? []
        ).filter(
          (permission) =>
            ![
              Permission.AddEditDraftNotes,
              Permission.AddEditOwnDraftNotes,
              Permission.UploadFamilyDocuments,
            ].includes(permission)
        );
        if (notes)
          target.family!.userPermissions.push(Permission.AddEditOwnDraftNotes);
        if (upload)
          target.family!.userPermissions.push(Permission.UploadFamilyDocuments);
        await route.fulfill({ response, json: records });
      });
      await page.goto(familyRoute(SKYWALKER_FAMILY_ID));
      await expect(
        page.getByRole('button', { name: 'family actions', exact: true })
      ).toBeVisible();
      const toolbar = page.getByRole('toolbar', {
        name: 'Family quick actions',
        exact: true,
      });
      await expect(toolbar).toHaveCount(notes || upload ? 1 : 0);
      await expect(
        toolbar.getByRole('button', { name: 'Add Note', exact: true })
      ).toHaveCount(notes ? 1 : 0);
      await expect(
        toolbar.getByRole('button', { name: 'Upload Document', exact: true })
      ).toHaveCount(upload ? 1 : 0);
      if (notes || upload) {
        const centered = await toolbar.evaluate((element) => {
          const style = getComputedStyle(element);
          const lastButton = element.querySelector('button:last-child')!;
          const firstButton = element.querySelector('button')!;
          return (
            Math.abs(
              (element.getBoundingClientRect().left +
                Number.parseFloat(style.paddingLeft) +
                element.getBoundingClientRect().right -
                Number.parseFloat(style.paddingRight)) /
                2 -
                (firstButton.getBoundingClientRect().left +
                  lastButton.getBoundingClientRect().right) /
                  2
            ) <= 1
          );
        });
        expect(centered).toBe(true);
      }
    });
  }
});

test.describe('responsive family actions @pr', () => {
  for (const width of [
    390, 768, 899, 900, 1024, 1100, 1199, 1200, 1280, 1440,
  ]) {
    test(`menu backdrop and keyboard dismissal at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(familyRoute(SKYWALKER_FAMILY_ID));
      const trigger = page.getByRole('button', {
        name: 'family actions',
        exact: true,
      });
      await trigger.focus();
      await trigger.press('Enter');
      const menu = page.locator('#family-more-menu');
      await expect(menu).toBeVisible();
      const backdrop = menu.locator('.MuiBackdrop-root');
      await expect(backdrop).toHaveCSS(
        'background-color',
        width < 1200 ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0)'
      );
      const items = menu.getByRole('menuitem');
      await page.keyboard.press('ArrowDown');
      const focusedItem = menu.locator('[role="menuitem"]:focus');
      await expect(focusedItem).toHaveCount(1);
      const firstFocusedText = await focusedItem.textContent();
      await page.keyboard.press('ArrowDown');
      await expect(focusedItem).toHaveCount(1);
      await expect(focusedItem).not.toHaveText(firstFocusedText!);
      if (width < 1200) {
        for (const item of await items.all()) {
          expect((await item.boundingBox())!.height).toBeGreaterThanOrEqual(48);
        }
      }
      await page.keyboard.press('Escape');
      await expect(menu).toBeHidden();
      await expect(trigger).toBeFocused();
      await trigger.click();
      await page.setViewportSize({
        width: width < 1200 ? 1200 : 390,
        height: 900,
      });
      await expect(backdrop).toHaveCSS(
        'background-color',
        width < 1200 ? 'rgba(0, 0, 0, 0)' : 'rgba(0, 0, 0, 0.5)'
      );
      await page.setViewportSize({ width, height: 900 });
      await backdrop.click({ position: { x: 1, y: 1 } });
      await expect(menu).toBeHidden();
      await expect(trigger).toBeFocused();
    });
  }

  test('mobile family action closes the menu before opening its drawer', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto(familyRoute(SKYWALKER_FAMILY_ID));
    await page
      .getByRole('button', { name: 'family actions', exact: true })
      .click();
    const menu = page.locator('#family-more-menu');
    await menu.getByRole('menuitem', { name: 'Adult', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: /Add Adult to/ })
    ).toBeVisible();
    await expect(menu).toBeHidden();
    await expect(menu.locator('.MuiBackdrop-root')).toBeHidden();
  });
});

test.describe('family deep links @pr', () => {
  test('opens and closes the family member drawer from familyMemberId', async ({
    page,
  }) => {
    const searchParams = new URLSearchParams({
      familyMemberId: BEN_SOLO_PERSON_ID,
      source: 'playwright',
    });

    await page.goto(familyRoute(SKYWALKER_FAMILY_ID, searchParams));

    await expect(page.getByRole('heading', { name: 'Ben Solo' })).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Close family member drawer' })
    ).toBeVisible();

    await page
      .getByRole('button', { name: 'Close family member drawer' })
      .click();

    await expect(page.getByRole('heading', { name: 'Ben Solo' })).toHaveCount(
      0
    );
    await expect(page).toHaveURL(/source=playwright/);
    await expect(page).not.toHaveURL(/familyMemberId=/);
  });

  test('ignores an invalid familyMemberId', async ({ page }) => {
    const searchParams = new URLSearchParams({
      familyMemberId: 'not-a-real-person',
    });

    await page.goto(familyRoute(SKYWALKER_FAMILY_ID, searchParams));

    await expect(
      page.getByRole('button', { name: 'Close family member drawer' })
    ).toHaveCount(0);
  });

  test('opens and closes the arrangement drawer from arrangementId', async ({
    page,
  }) => {
    const searchParams = new URLSearchParams({
      v1CaseId: DOE_V1_CASE_ID,
      arrangementId: DOE_ARRANGEMENT_ID,
    });

    await page.goto(familyRoute(DOE_FAMILY_ID, searchParams));

    await expect(
      page.getByRole('button', { name: 'close arrangement details' })
    ).toBeVisible();

    await page
      .getByRole('button', { name: 'close arrangement details' })
      .click();

    await expect(
      page.getByRole('button', { name: 'close arrangement details' })
    ).toHaveCount(0);
    await expect(page).toHaveURL(/v1CaseId=/);
    await expect(page).not.toHaveURL(/arrangementId=/);
  });

  test('opens the arrangement drawer from a Dashboard calendar item', async ({
    page,
  }) => {
    await page.goto(ATLANTIS_ROUTE);

    await page.getByRole('button', { name: /previous/i }).click();
    const safetyVisit = page.getByText(
      '✅ Eric Doe - Family Coach Safety Visit',
      { exact: true }
    );

    if (!(await safetyVisit.isVisible())) {
      const eventDay = page.getByRole('gridcell').filter({
        has: page.getByText('14', { exact: true }),
      });
      await eventDay.getByRole('button', { name: /more/i }).click();
    }

    await safetyVisit.click();

    await expect(page).toHaveURL(new RegExp(`v1CaseId=${DOE_V1_CASE_ID}`));
    await expect(page).toHaveURL(
      new RegExp(`arrangementId=${DOE_ARRANGEMENT_ID}`)
    );
    await expect(
      page.getByRole('button', { name: 'close arrangement details' })
    ).toBeVisible();
  });
});
