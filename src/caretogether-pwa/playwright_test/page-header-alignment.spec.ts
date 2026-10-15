import { expect, test } from '@playwright/test';
import { build } from 'rolldown';
import { fileURLToPath } from 'node:url';

test.use({ storageState: { cookies: [], origins: [] } });
let bundle: string;
test.beforeAll(async () => {
  const result = await build({
    input: fileURLToPath(new URL('./page-header-harness.tsx', import.meta.url)),
    platform: 'browser',
    tsconfig: false,
    transform: {
      jsx: { runtime: 'automatic' },
      define: { 'process.env.NODE_ENV': JSON.stringify('production') },
    },
    output: { format: 'iife' },
    write: false,
  });
  const chunk = result.output.find((item) => item.type === 'chunk');
  if (!chunk || chunk.type !== 'chunk')
    throw new Error('Missing header bundle');
  bundle = chunk.code;
});

for (const width of [1440, 1024, 768, 375]) {
  test(`header alignment with and without actions at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 667 });
    const positions: { title: number; content: number }[] = [];
    for (const actions of [false, true]) {
      await page.route('**/page-header-harness*', (route) =>
        route.fulfill({
          contentType: 'text/html',
          body: '<html><body><div id="root"></div></body></html>',
        })
      );
      await page.goto(
        `http://localhost:3000/page-header-harness${actions ? '?actions' : ''}`
      );
      await page.addScriptTag({ content: bundle });
      const heading = page.getByRole('heading', {
        name: 'Clients',
        exact: true,
      });
      await expect(heading).toBeVisible();
      const title = (await heading.boundingBox())!.y;
      const content = (await page.getByTestId('content').boundingBox())!.y;
      positions.push({ title, content });
      expect(title).toBe(width < 600 ? 8 : 16);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        )
      ).toBe(true);
      if (actions)
        await expect(
          page.getByRole('button', { name: 'Add family' })
        ).toBeInViewport();
    }
    expect(positions[1].title).toBe(positions[0].title);
    if (width >= 600) expect(positions[1].content).toBe(positions[0].content);
    console.log(JSON.stringify({ width, positions }));
  });
}
