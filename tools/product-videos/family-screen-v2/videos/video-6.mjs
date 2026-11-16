// Video 6: a client family's case and arrangements, on the Doe family. Changes nothing.

export const output = 'video-6-case.mp4';
export const startUrl = '/families/11111111-1111-1111-1111-111111111111';

export async function ready(page) {
  await page.getByRole('heading', { name: 'Doe Family' }).waitFor();
}

export function steps({ page, h }) {
  const tab = (name) => page.getByRole('tab', { name });
  const panel = page.getByRole('dialog').filter({ hasText: 'Arrangement' });
  const section = (name) => panel.getByRole('heading', { name, exact: true });
  // Atlantis seed dates move when the organization is reset, so match any open date.
  const caseOpened = page.getByText(/^Opened \d/).first();

  return {
    'case-header': async () => {
      await h.sleep(500);
      await h.highlightArea(
        [caseOpened, page.getByRole('button', { name: /^Hosting Eric Doe Host Family/ })],
        2200
      );
      await h.moveTo(page.getByRole('button', { name: /^Hosting Eric Doe Host Family/ }));
      await h.sleep(800);
    },
    'arrangements-tab': async () => {
      await h.click(tab(/Arrangements/i));
      await page.getByRole('row', { name: /^Hosting Eric Doe/ }).waitFor();
      await h.screenshot('arrangements-tab', [page.getByRole('grid')]);
      await h.sleep(500);
      await h.highlight(page.getByRole('grid'), 2200);
    },
    'open-arrangement': async () => {
      await h.click(page.getByRole('row', { name: /^Hosting Eric Doe/ }));
      await panel.waitFor();
      await h.sleep(800);
    },
    panel: async () => {
      await h.highlight(section('Timeline'), 1300);
      await h.highlightArea([section('Assignments'), panel.getByRole('button', { name: /Manage Assignments/ })], 1500);
      await h.highlight(section('Requirements'), 1300);
      await h.highlightArea([section('Child Care'), panel.getByRole('button', { name: 'Plan Future Change' })], 1700);
    },
    'case-history': async () => {
      await h.click(panel.getByRole('button', { name: 'close arrangement details' }));
      await panel.waitFor({ state: 'hidden' });
      await h.click(tab(/Case History/i));
      const closedCase = page.getByRole('button', { name: /^Closed Case/ });
      await closedCase.waitFor();
      await h.sleep(500);
      const currentOpened = await caseOpened.textContent();
      await h.click(closedCase);
      const closedOpened = page.getByText(/^Opened \d/).filter({ hasNotText: currentOpened }).first();
      await closedOpened.waitFor();
      await h.sleep(500);
      await h.highlight(closedOpened.locator('xpath=..'), 2200);
    },
  };
}
