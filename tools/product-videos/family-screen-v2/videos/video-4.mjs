// Video 4: upload, search and preview documents, on the Doe family.
// A real run uploads one image to the family; --dry cancels the upload and
// previews an existing file instead.

import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const output = 'video-4-documents.mp4';
export const startUrl = '/families/11111111-1111-1111-1111-111111111111';

const FILE_NAME = 'Eric vaccination record.png';
const IMAGE = path.join(path.dirname(fileURLToPath(import.meta.url)), '../assets', FILE_NAME);
const DRY_RUN_FILE_NAME = 'Jane Doe case info.pdf';

export async function ready(page) {
  await page.getByRole('heading', { name: 'Doe Family' }).waitFor();
  // The grid remembers its quick filter between visits; start every take with an empty search.
  const cleared = await page.evaluate(() => {
    const keys = Object.keys(localStorage).filter((key) => /familyDocuments/i.test(key));
    keys.forEach((key) => localStorage.removeItem(key));
    return keys.length;
  });
  if (cleared > 0) {
    await page.reload();
    await page.getByRole('heading', { name: 'Doe Family' }).waitFor();
  }
}

export function steps({ page, dryRun, h }) {
  const uploadDialog = page.getByRole('dialog').filter({ hasText: 'Upload Family Documents' });
  const documentsTab = page.getByRole('tab', { name: /Documents/i });
  const fileName = dryRun ? DRY_RUN_FILE_NAME : FILE_NAME;
  const fileRow = page.getByRole('row').filter({ hasText: fileName }).first();
  const previewPanel = page
    .getByRole('dialog')
    .filter({ has: page.getByRole('button', { name: 'Close document preview' }) });

  return {
    upload: async () => {
      await h.sleep(400);
      await h.click(page.getByRole('button', { name: 'Upload', exact: true }));
      await uploadDialog.waitFor();
      const chooser = page.waitForEvent('filechooser');
      await h.click(uploadDialog.getByRole('button', { name: 'Choose Files' }));
      await (await chooser).setFiles(IMAGE);
      await uploadDialog.getByText(FILE_NAME).waitFor();
      await h.sleep(800);
      await h.click(uploadDialog.getByRole('button', { name: dryRun ? 'Cancel' : 'Upload', exact: true }));
      await uploadDialog.waitFor({ state: 'hidden', timeout: 60_000 });
    },
    'documents-tab': async () => {
      await h.click(documentsTab);
      await page.getByRole('columnheader', { name: /Document Name/ }).waitFor();
      await fileRow.waitFor();
      await h.sleep(600);
      await h.highlight(page.getByRole('row').nth(1), 2400);
    },
    search: async () => {
      const searchButton = page.getByRole('button', { name: 'Search', exact: true });
      if (await searchButton.isVisible()) await h.click(searchButton);
      const searchBox = page.getByRole('searchbox');
      await searchBox.waitFor();
      await h.click(searchBox);
      await h.typeSlowly(dryRun ? 'case' : 'vacc');
      await h.sleep(900);
      await h.highlight(fileRow, 1800);
    },
    preview: async () => {
      await h.click(fileRow.getByRole('button', { name: /^Preview / }));
      await previewPanel.waitFor();
      await h.sleep(2500);
      const content = previewPanel.locator('img, iframe').first();
      await content.waitFor();
      await h.highlight(content, 2400);
    },
    'preview-actions': async () => {
      await h.highlightArea(
        [
          previewPanel.getByRole('link', { name: /in a new tab$/ }),
          previewPanel.getByRole('button', { name: /^Download / }),
        ],
        2600
      );
      await h.click(previewPanel.getByRole('button', { name: 'Close document preview' }));
      await previewPanel.waitFor({ state: 'hidden' });
    },
  };
}
