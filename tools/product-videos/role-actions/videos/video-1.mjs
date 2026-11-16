// Remove a role and Complete Other, for one person (Skywalker family) and for
// the whole family (Brambleswift family).
// It opens each form and closes it without saving, so it changes nothing in
// Atlantis, with or without --dry.

export const output = 'role-actions.mp4';
export const startUrl = '/families/22222222-2222-2222-2222-222222222222';

const BRAMBLESWIFT = '/families/3ec519ec-a262-4047-b8ef-5ad8c00a2495';
const REMOVAL_COMMENT = 'Leia stepped back from volunteering this year.';

export async function ready(page) {
  await page.getByRole('heading', { name: 'Skywalker Family' }).waitFor();
}

export function steps({ page, h, baseUrl }) {
  const hanCard = page.getByRole('button', { name: /^Han Solo Family Friend/ });
  const leiaCard = page.getByRole('button', { name: /^Leia Skywalker Family Friend/ });
  const roleDetails = page.getByRole('dialog').filter({ hasText: 'Role Details' });
  const managementPanel = (title) =>
    page.getByRole('dialog').filter({ has: page.getByRole('heading', { name: title, exact: true }) });
  const completeOther = managementPanel('Complete Other');
  const removeRole = page.getByRole('dialog').filter({ hasText: 'Role Management' }).filter({
    has: page.getByRole('heading', { name: 'Remove Role', exact: true }),
  });
  const familyRoleDetails = page
    .getByRole('dialog')
    .filter({ hasText: 'Role Details' })
    .filter({ has: page.getByRole('heading', { name: 'Host Family', exact: true }) });
  const familyMenuButton = page
    .getByRole('button', { name: 'Note', exact: true })
    .locator('xpath=following-sibling::button[1]');

  return {
    'role-cards': async () => {
      await h.sleep(500);
      await h.screenshot('role-cards', [hanCard, leiaCard]);
      await h.highlightArea([hanCard, leiaCard], 2600);
      await h.moveTo(leiaCard);
      await h.highlight(leiaCard, 1800);
    },
    'open-card': async () => {
      await h.click(leiaCard);
      await roleDetails.waitFor();
      await h.sleep(800);
      const buttons = [
        roleDetails.getByRole('button', { name: 'Remove Role' }),
        roleDetails.getByRole('button', { name: 'Complete Other' }),
      ];
      await h.screenshot('role-details', buttons);
      await h.highlightArea(buttons, 2600);
    },
    'complete-other': async () => {
      await h.click(roleDetails.getByRole('button', { name: 'Complete Other' }));
      await completeOther.waitFor();
      await h.sleep(500);
      await h.click(completeOther.getByRole('combobox', { name: 'Search any action' }));
      await page.getByRole('option').first().waitFor();
      await h.sleep(600);
      await h.screenshot('complete-other-search', [completeOther.getByRole('combobox', { name: 'Search any action' })]);
      await h.typeSlowly('Bg');
      await h.sleep(500);
      await h.click(page.getByRole('option', { name: 'Bg check', exact: true }));
    },
    'complete-or-exempt': async () => {
      const buttons = [
        completeOther.getByRole('button', { name: 'Complete', exact: true }),
        completeOther.getByRole('button', { name: 'Exempt', exact: true }),
      ];
      await buttons[0].waitFor();
      await h.screenshot('complete-other-actions', buttons);
      await h.highlightArea(buttons, 2600);
      await h.click(completeOther.getByRole('button', { name: 'close role management' }));
      await completeOther.waitFor({ state: 'hidden' });
    },
    'remove-role': async () => {
      await h.click(roleDetails.getByRole('button', { name: 'Remove Role' }));
      await removeRole.waitFor();
      await h.sleep(500);
      await h.highlight(removeRole.getByRole('radiogroup', { name: 'removal reason' }), 1600);
      await h.click(removeRole.getByRole('textbox', { name: 'Comments' }));
      await h.typeSlowly(REMOVAL_COMMENT);
      await h.sleep(400);
    },
    'remove-confirm': async () => {
      const confirm = removeRole.getByRole('button', { name: 'Remove Role', exact: true });
      await h.screenshot('remove-role-form', [removeRole.getByRole('radiogroup', { name: 'removal reason' }), confirm]);
      await h.highlight(confirm, 2000);
      // Never remove the role, even in a real take: Cancel keeps Leia's Family Friend role.
      await h.click(removeRole.getByRole('button', { name: 'Cancel' }));
      await removeRole.waitFor({ state: 'hidden' });
      await h.click(roleDetails.getByRole('button', { name: 'close role details' }));
      await roleDetails.waitFor({ state: 'hidden' });
    },
    'family-card': async () => {
      // Navigate inside the app: a full page load shows a blank white frame.
      await page.evaluate((url) => {
        window.history.pushState({}, '', url);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }, new URL(baseUrl + BRAMBLESWIFT).pathname);
      await page.getByRole('heading', { name: 'Brambleswift Family' }).waitFor();
      await h.sleep(600);
      const familyCard = page.getByRole('button', { name: /^Family Host Family/ });
      await h.highlight(familyCard, 1400);
      await h.click(familyCard);
      await familyRoleDetails.waitFor();
      await h.sleep(800);
      await h.highlight(familyRoleDetails.getByRole('button', { name: 'Complete Other' }), 2400);
    },
    'family-members': async () => {
      const members = familyRoleDetails.getByText('Family Members', { exact: true });
      const removeButtons = familyRoleDetails.getByRole('button', { name: 'Remove from role' });
      await members.scrollIntoViewIfNeeded();
      await h.sleep(400);
      await h.screenshot('family-role-members', [members, removeButtons.last()]);
      await h.highlightArea([members, removeButtons.first()], 2400);
      const requirement = familyRoleDetails.getByRole('button', { name: /^Missing Comprehensive Background Check/ }).first();
      await h.moveTo(requirement);
      await h.highlight(requirement, 2000);
      await h.click(familyRoleDetails.getByRole('button', { name: 'close role details' }));
      await familyRoleDetails.waitFor({ state: 'hidden' });
    },
    'family-menu': async () => {
      await h.click(familyMenuButton);
      const items = [
        page.getByRole('menuitem', { name: 'Remove from Host Family role' }),
        page.getByRole('menuitem', { name: 'Complete other...' }),
      ];
      await items[0].waitFor();
      await h.sleep(400);
      await h.screenshot('family-menu', items);
      await h.highlightArea(items, 2600);
      await page.keyboard.press('Escape');
      await h.sleep(500);
    },
  };
}
