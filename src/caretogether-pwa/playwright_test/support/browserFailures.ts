import type { Page } from '@playwright/test';

export type BrowserFailure = {
  type: 'console' | 'pageerror';
  message: string;
};

type BrowserFailureCollectorOptions = {
  ignoreConsoleMessage?: (message: string) => boolean;
};

export type BrowserFailureCollector = {
  getFailures: () => BrowserFailure[];
  hasFailures: () => boolean;
  summary: () => string;
};

export function isKnownNonFatalSmokeConsoleMessage(message: string): boolean {
  return /favicon|Failed to load resource: the server responded with a status of 404/i.test(
    message
  );
}

export function createBrowserFailureCollector(
  page: Page,
  options: BrowserFailureCollectorOptions = {}
): BrowserFailureCollector {
  const failures: BrowserFailure[] = [];

  page.on('console', (msg) => {
    if (msg.type() !== 'error') {
      return;
    }

    const message = msg.text();
    if (options.ignoreConsoleMessage?.(message)) {
      return;
    }

    failures.push({ type: 'console', message });
  });

  page.on('pageerror', (error) => {
    failures.push({ type: 'pageerror', message: error.message });
  });

  return {
    getFailures: () => failures,
    hasFailures: () => failures.length > 0,
    summary: () =>
      failures
        .map((failure) => `${failure.type}: ${failure.message}`)
        .join(' | '),
  };
}
