// Video 3: complete a volunteer requirement, on the Brambleswift family.
// A real run completes Berrin's Comprehensive Background Check with a PDF;
// reset it with Mark Incomplete before retaking. --dry closes the form instead.

import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const output = 'video-3-requirements.mp4';
export const startUrl = '/families/3ec519ec-a262-4047-b8ef-5ad8c00a2495';

const PDF = path.join(path.dirname(fileURLToPath(import.meta.url)), '../assets/berrin-background-check.pdf');
const COMPLETION_DATE = '10292026';
const NOTE_TEXT = 'Comprehensive check came back clear.';

export async function ready(page) {
  await page.getByRole('heading', { name: 'Brambleswift Family' }).waitFor();
}

export function steps({ page, dryRun, h }) {
  const approvalsTab = page.getByRole('tab', { name: /Approvals/i });
  const roleCard = page.getByRole('button', { name: /^Family Host Family/ });
  const roleDialog = page.getByRole('dialog').filter({ has: page.getByRole('heading', { name: 'Host Family' }) });
  const berrinMissing = page.getByRole('button', { name: /^Missing Comprehensive Background Check/ });
  const requirementDialog = page.getByRole('dialog').filter({ hasText: 'Requirement Management' });
  const eldaExpiring = page.getByRole('button', { name: /^Expiring .*Comprehensive Background Check/ });

  return {
    'approvals-tab': async () => {
      await h.sleep(400);
      await h.click(approvalsTab);
      await page.getByRole('combobox', { name: 'Status' }).waitFor();
      await h.sleep(400);
      await h.highlight(approvalsTab, 2400);
    },
    'role-card': async () => {
      await h.moveTo(roleCard);
      await h.highlight(roleCard, 3000);
    },
    'role-details': async () => {
      await h.click(roleCard);
      await roleDialog.waitFor();
      await h.sleep(800);
      // Family-level requirements first, then each member's own requirements for this role.
      await h.highlightArea(
        [roleDialog.getByRole('heading', { name: 'Requirements' }), roleDialog.getByRole('button', { name: /Host Interview Family$/ })],
        3200
      );
      await h.highlightArea(
        [roleDialog.getByRole('heading', { name: 'Family Members' }), roleDialog.getByRole('button', { name: /Host Family Training Elda Brambleswift$/ })],
        3600
      );
    },
    'open-requirement': async () => {
      await h.click(berrinMissing);
      await h.sleep(900);
      await h.click(page.getByRole('button', { name: 'Complete', exact: true }));
      await requirementDialog.waitFor();
    },
    'fill-completion': async () => {
      await h.click(requirementDialog.getByRole('spinbutton', { name: 'Month' }));
      await h.typeSlowly(COMPLETION_DATE);
      await h.sleep(300);
      await h.click(requirementDialog.getByRole('combobox', { name: 'Documents' }));
      await h.click(page.getByRole('option', { name: 'Upload new...' }));
      const fileInput = requirementDialog.locator('input[type="file"]');
      const chooser = page.waitForEvent('filechooser');
      await h.click(fileInput);
      await (await chooser).setFiles(PDF);
      await h.sleep(400);
      await h.click(requirementDialog.getByRole('textbox', { name: 'Notes' }));
      await h.typeSlowly(NOTE_TEXT);
      await h.sleep(400);
      if (dryRun) {
        await h.highlight(requirementDialog.getByRole('button', { name: 'Complete', exact: true }), 800);
        await h.click(requirementDialog.getByRole('button', { name: 'close requirement management' }));
      } else {
        await h.click(requirementDialog.getByRole('button', { name: 'Complete', exact: true }));
      }
      await requirementDialog.waitFor({ state: 'hidden' });
    },
    updated: async () => {
      // The requirement's panel sits on top of the role panel and still shows the old status, so go back to the role.
      const requirementPanel = page.getByRole('dialog').filter({ hasText: 'Applies To' });
      if (await requirementPanel.isVisible()) {
        await h.click(requirementPanel.getByRole('button', { name: 'close approval details' }));
        await requirementPanel.waitFor({ state: 'hidden' });
      }
      if (dryRun) {
        await h.highlight(berrinMissing, 2400);
        await h.highlight(roleDialog.getByRole('button').filter({ hasText: 'Missing' }).first(), 2400);
        return;
      }
      const berrinCompleted = page
        .getByRole('button', { name: /^Completed .*Comprehensive Background Check/ })
        .filter({ hasNotText: 'Elda' })
        .first();
      await berrinCompleted.waitFor();
      await h.highlight(berrinCompleted, 2400);
      await h.highlight(page.getByRole('button', { name: /^Missing Meet & Greet/ }), 2400);
    },
    exemption: async () => {
      await h.click(eldaExpiring);
      const exemptionDialog = page.getByRole('dialog').filter({ hasText: 'Exempted Until' });
      await exemptionDialog.waitFor();
      await h.sleep(700);
      await h.highlightArea(
        [exemptionDialog.getByText('Exempted On'), exemptionDialog.getByText('11/11/26')],
        2600
      );
      await h.highlight(exemptionDialog.getByText(/Previous background check still valid/), 2600);
      await h.click(exemptionDialog.getByRole('button', { name: 'close approval details' }));
    },
    'complete-other': async () => {
      if (!(await roleDialog.isVisible())) {
        await h.click(roleCard);
        await roleDialog.waitFor();
      }
      await h.click(roleDialog.getByRole('button', { name: 'Complete Other' }));
      const search = page.getByRole('combobox', { name: 'Search any action' });
      await search.waitFor();
      await h.click(search);
      await h.typeSlowly('interview');
      await h.sleep(500);
      await h.click(page.getByRole('option').first());
      await h.sleep(1500);
      await h.click(page.getByRole('button', { name: 'close role management' }));
    },
    'filter-expiring': async () => {
      const closeRole = page.getByRole('button', { name: 'close role details' });
      if (await closeRole.isVisible()) await h.click(closeRole);
      await h.sleep(500);
      await h.click(page.getByRole('combobox', { name: 'Status' }));
      await h.click(page.getByRole('option', { name: 'Expiring' }));
      await page.keyboard.press('Escape');
      await h.sleep(600);
      await h.highlight(page.getByRole('row', { name: /^Expiring Comprehensive Background Check/ }), 2600);
    },
  };
}
