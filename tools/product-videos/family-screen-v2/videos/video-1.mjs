// Video 1: a tour of the new Family screen. Starts on Volunteers, tours
// Brambleswift, then the Doe family, then Beta Features. Changes nothing.

export const output = 'video-1-tour.mp4';
export const startUrl = '/volunteers';

export async function ready(page) {
  await page.getByText('Brambleswift Family').first().waitFor();
}

export function steps({ page, h }) {
  const tab = (name) => page.getByRole('tab', { name });
  const noteButton = page.getByRole('button', { name: 'Note', exact: true });

  return {
    'open-family': async () => {
      await h.sleep(600);
      await h.click(page.getByText('Brambleswift Family').first());
      await page.getByRole('heading', { name: 'Brambleswift Family' }).waitFor();
      await h.sleep(800);
      await h.moveTo(tab(/Overview/i));
    },
    header: async () => {
      await h.highlightArea(
        [
          page.getByRole('heading', { name: 'Brambleswift Family' }),
          page.getByText('789 Helper St', { exact: false }),
        ],
        3000
      );
    },
    actions: async () => {
      const buttons = ['Upload', 'Adult', 'Child', 'Note'].map((name) =>
        page.getByRole('button', { name, exact: true })
      );
      for (const button of buttons) {
        await h.moveTo(button);
        await h.sleep(250);
      }
      await h.click(noteButton.locator('xpath=following-sibling::button[1]'));
      await page.getByRole('menuitem', { name: 'Print notes' }).waitFor();
      await h.sleep(2600);
      await page.keyboard.press('Escape');
    },
    tabs: async () => {
      for (const name of [/Approvals/i, /Assignments/i, /Documents/i, /Timeline & Notes/i]) {
        await h.click(tab(name));
        await h.sleep(900);
      }
    },
    counts: async () => {
      await h.highlight(tab(/Approvals/i), 2400);
      await h.highlight(page.getByText(/\d+ Awaiting Review/i).first(), 2400);
    },
    overview: async () => {
      await h.click(tab(/Overview/i));
      await h.sleep(500);
      const panel = (name) => page.getByRole('heading', { name }).locator('xpath=../..');
      await h.highlightArea(
        [
          page.getByRole('heading', { name: 'Family Members' }),
          page.getByText('Elda Brambleswift').first().locator('xpath=../../..'),
          page.getByText('Hosting Age Preference'),
        ],
        1800
      );
      await h.highlight(panel('Organizations'), 1600);
      await h.highlight(panel('Recent Activity: Last 7 days'), 2000);
    },
    'client-family': async () => {
      await h.click(page.locator('a[href$="/clients"]').first());
      const doeFamily = page.getByText('Doe Family', { exact: false }).first();
      await doeFamily.waitFor();
      await h.sleep(500);
      await h.click(doeFamily);
      await page.getByRole('heading', { name: 'Doe Family' }).waitFor();
      await h.sleep(600);
      await h.click(tab(/Arrangements/i));
      await h.sleep(1200);
      await h.click(tab(/Case History/i));
    },
    'beta-features': async () => {
      await h.sleep(300);
      await h.click(page.getByRole('button', { name: 'user account' }));
      const betaFeatures = page.getByRole('menuitem', { name: 'Beta Features' });
      await betaFeatures.waitFor();
      await h.sleep(500);
      await h.click(betaFeatures);
      await page.getByRole('dialog').filter({ hasText: 'Family Screen V2' }).waitFor();
    },
    switch: async () => {
      const dialog = page.getByRole('dialog').filter({ hasText: 'Family Screen V2' });
      await dialog.getByText('Family Screen V2').waitFor();
      await h.sleep(500);
      await h.highlight(dialog.getByText('Family Screen V2').locator('xpath=../..'), 2600);
      await h.moveTo(dialog.getByRole('switch'));
      await h.highlight(dialog.getByRole('switch').locator('xpath=../../..'), 2000);
      await h.click(dialog.getByRole('button', { name: 'Close' }));
    },
    feedback: async () => {
      const chatBubble = page.locator('#featurebase-messenger-launcher-frame-wrapper');
      await h.moveTo(chatBubble);
      await h.highlight(chatBubble, 3000);
    },
  };
}
