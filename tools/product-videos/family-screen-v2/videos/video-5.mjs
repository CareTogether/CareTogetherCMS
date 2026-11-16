// Video 5: update family members, on the Brambleswift family.
// A real run saves a comment on Elda; --dry cancels it. Adding a child and an
// organization only opens and cancels the forms, so nothing else changes.

export const output = 'video-5-members.mp4';
export const startUrl = '/families/3ec519ec-a262-4047-b8ef-5ad8c00a2495';

const COMMENT = 'Prefers a phone call after 5 pm.';

export async function ready(page) {
  await page.getByRole('heading', { name: 'Family Members' }).waitFor();
}

export function steps({ page, dryRun, h }) {
  const drawer = page.getByRole('dialog').filter({ hasText: 'Family Member' });
  const section = (name) => drawer.getByRole('heading', { name, exact: true });
  const organizationsPanel = page.getByRole('heading', { name: 'Organizations' }).locator('xpath=..');

  return {
    'open-member': async () => {
      await h.sleep(400);
      const elda = page.getByText('Elda Brambleswift').first();
      await h.highlight(elda.locator('xpath=../../..'), 1200);
      await h.click(elda);
      await drawer.waitFor();
      await h.sleep(800);
    },
    sections: async () => {
      for (const name of ['Basic Information', 'Contact Information', 'Comments', 'Concerns']) {
        await h.moveTo(section(name));
        await h.highlight(section(name), 1100);
      }
    },
    edit: async () => {
      await h.click(drawer.getByText('Comments:').locator('xpath=..').getByRole('button', { name: 'Edit' }));
      const comments = drawer.getByRole('textbox', { name: 'Comments' });
      await comments.waitFor();
      await h.click(comments);
      await page.keyboard.press('ControlOrMeta+a');
      await h.typeSlowly(COMMENT);
      await h.sleep(400);
      await h.click(drawer.getByRole('button', { name: dryRun ? 'Cancel' : 'Save' }));
      await comments.waitFor({ state: 'hidden' });
      await h.sleep(300);
      if (!dryRun) await h.highlight(drawer.getByText(COMMENT), 1400);
    },
    'add-person': async () => {
      await h.click(drawer.getByRole('button', { name: 'Close family member drawer' }));
      await drawer.waitFor({ state: 'hidden' });
      await h.highlightArea(
        ['Adult', 'Child'].map((name) => page.getByRole('button', { name, exact: true })),
        1200
      );
      await h.click(page.getByRole('button', { name: 'Child', exact: true }));
      const form = page.getByRole('dialog').filter({ hasText: 'Add Child to Brambleswift' });
      await form.waitFor();
      await h.click(form.getByRole('textbox', { name: 'First Name' }));
      await h.typeSlowly('Pip');
      await h.sleep(500);
      await h.highlight(form.getByRole('button', { name: 'Add to Family' }), 1200);
      await h.click(form.getByRole('button', { name: 'Cancel' }));
      await form.waitFor({ state: 'hidden' });
    },
    organizations: async () => {
      await h.highlight(organizationsPanel, 1200);
      await h.click(organizationsPanel.getByRole('button', { name: /Add/ }));
      const dialog = page.getByRole('dialog').filter({ hasText: 'Add Organizations' });
      await dialog.waitFor();
      await h.click(dialog.getByRole('combobox'));
      await h.sleep(1500);
      await page.keyboard.press('Escape');
      await h.sleep(300);
      await h.click(dialog.getByRole('button', { name: 'Cancel' }));
    },
  };
}
