// Video 2: add a note and approve draft notes, on the Doe family.
// A real run adds and approves one note; --dry cancels instead.

export const output = 'video-2-notes.mp4';
export const startUrl = '/families/11111111-1111-1111-1111-111111111111';

const NOTE_TEXT =
  "Called Jane to confirm Saturday's babysitting pickup at 10 am. She'll have Eric's bag ready.";

export async function ready(page) {
  await page.getByText('Recent Activity: Last 7 days').waitFor();
}

function awaitingReviewChip(page) {
  return page.getByText(/\d+ Awaiting Review/i).first();
}

function newNoteItem(page) {
  return page
    .locator('div')
    .filter({ hasText: NOTE_TEXT })
    .filter({ has: page.getByRole('button', { name: 'Approve' }) })
    .last();
}

export function steps({ page, dryRun, h }) {
  const noteButton = page.getByRole('button', { name: 'Note', exact: true });
  const drawer = page.locator('.MuiDrawer-paper').filter({ hasText: 'Add New Note' });
  const recentActivity = page.getByText('Recent Activity: Last 7 days');
  // Dry runs save nothing, so they point at the newest Recent Activity entry instead.
  const firstRecentItem = page.getByText('Family note').first().locator('xpath=..');

  return {
    'add-note': async () => {
      await h.sleep(400);
      await h.click(noteButton);
      await drawer.waitFor();
    },
    'write-note': async () => {
      await h.click(drawer.getByLabel('Notes'));
      await h.typeSlowly(NOTE_TEXT);
      await h.sleep(300);
      await h.click(drawer.getByRole('button', { name: dryRun ? 'Cancel' : 'Save' }));
      await drawer.waitFor({ state: 'hidden' });
    },
    'recent-activity': async () => {
      await h.moveTo(recentActivity);
      const item = dryRun ? firstRecentItem : newNoteItem(page);
      await item.waitFor();
      await h.highlight(item, 2200);
    },
    badge: async () => {
      const chip = awaitingReviewChip(page);
      await h.moveTo(chip);
      await h.highlight(chip, 2200);
    },
    approve: async () => {
      if (dryRun) {
        await h.highlight(firstRecentItem, 1600);
        return;
      }
      const approveButton = newNoteItem(page).getByRole('button', { name: 'Approve' });
      await h.highlight(approveButton.locator('xpath=..'), 1600);
      await h.click(approveButton);
      const dialog = page.getByRole('dialog').filter({
        hasText: 'Do you want to approve and finalize this note?',
      });
      await dialog.waitFor();
      await h.sleep(900);
      await h.click(dialog.getByRole('button', { name: 'Save' }));
      await dialog.waitFor({ state: 'hidden' });
    },
    'count-updates': async () => {
      const chip = awaitingReviewChip(page);
      await h.moveTo(chip);
      await h.highlight(chip, 2000);
    },
    timeline: async () => {
      await h.click(page.getByRole('tab', { name: /Timeline & Notes/i }));
      await h.sleep(700);
      const sortBy = page
        .locator('.MuiFormControl-root')
        .filter({ hasText: 'Sort by' })
        .getByRole('combobox');
      await h.click(sortBy);
      const option = page.getByRole('option', { name: 'Note created date' });
      await option.waitFor();
      await h.sleep(500);
      await h.click(option);
    },
    print: async () => {
      await h.click(noteButton.locator('xpath=following-sibling::button[1]'));
      const printNotes = page.getByRole('menuitem', { name: 'Print notes' });
      await printNotes.waitFor();
      await h.moveTo(printNotes);
      await h.highlight(printNotes, 1800);
    },
  };
}
