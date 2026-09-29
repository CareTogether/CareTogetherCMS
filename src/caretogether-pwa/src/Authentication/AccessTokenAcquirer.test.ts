import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createAccessTokenAcquirer,
  createSilentRedirectUri,
  getIdentityProviderErrorCode,
  isInteractiveRecoveryRequired,
} from './AccessTokenAcquirer.ts';

type Account = { id: string };

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
}

test('returns a silently acquired token without opening an interaction', async () => {
  const account = { id: 'account-1' };
  let interactiveCalls = 0;
  const acquireAccessToken = createAccessTokenAcquirer<Account>({
    getActiveAccount: () => account,
    acquireTokenSilently: async () => ({ accessToken: 'silent-token' }),
    acquireTokenInteractively: async () => {
      interactiveCalls += 1;
      return { accessToken: 'interactive-token', account };
    },
    isInteractionRequired: () => false,
    setActiveAccount: () => undefined,
    onEvent: () => undefined,
  });

  assert.equal(await acquireAccessToken(), 'silent-token');
  assert.equal(interactiveCalls, 0);
});

test('recovers an expired identity session interactively and returns its token', async () => {
  const account = { id: 'account-1' };
  const interactionRequired = new Error('interaction required');
  const events: string[] = [];
  let activeAccount: Account | null = account;
  const acquireAccessToken = createAccessTokenAcquirer<Account>({
    getActiveAccount: () => activeAccount,
    acquireTokenSilently: async () => {
      throw interactionRequired;
    },
    acquireTokenInteractively: async () => ({
      accessToken: 'recovered-token',
      account: { id: 'account-2' },
    }),
    isInteractionRequired: (error) => error === interactionRequired,
    setActiveAccount: (account) => {
      activeAccount = account;
    },
    onEvent: (event) => events.push(event),
  });

  assert.equal(await acquireAccessToken(), 'recovered-token');
  assert.deepEqual(activeAccount, { id: 'account-2' });
  assert.deepEqual(events, [
    'silent_failed_interaction_required',
    'interactive_started',
    'interactive_succeeded',
  ]);
});

test('shares one interactive recovery between concurrent requests', async () => {
  const account = { id: 'account-1' };
  const popup = deferred<{ accessToken: string; account: Account }>();
  let interactiveCalls = 0;
  const acquireAccessToken = createAccessTokenAcquirer<Account>({
    getActiveAccount: () => account,
    acquireTokenSilently: async () => {
      throw new Error('interaction required');
    },
    acquireTokenInteractively: () => {
      interactiveCalls += 1;
      return popup.promise;
    },
    isInteractionRequired: () => true,
    setActiveAccount: () => undefined,
    onEvent: () => undefined,
  });

  const firstRequest = acquireAccessToken();
  const secondRequest = acquireAccessToken();
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.equal(interactiveCalls, 1);
  popup.resolve({ accessToken: 'shared-token', account });
  assert.deepEqual(await Promise.all([firstRequest, secondRequest]), [
    'shared-token',
    'shared-token',
  ]);
});

test('does not turn unexpected silent failures into an interactive login', async () => {
  const unexpectedError = new Error('network failed');
  let interactiveCalls = 0;
  const acquireAccessToken = createAccessTokenAcquirer<Account>({
    getActiveAccount: () => ({ id: 'account-1' }),
    acquireTokenSilently: async () => {
      throw unexpectedError;
    },
    acquireTokenInteractively: async () => {
      interactiveCalls += 1;
      return { accessToken: 'interactive-token', account: null };
    },
    isInteractionRequired: () => false,
    setActiveAccount: () => undefined,
    onEvent: () => undefined,
  });

  await assert.rejects(acquireAccessToken(), unexpectedError);
  assert.equal(interactiveCalls, 0);
});

test('opens an interaction when MSAL has no active account', async () => {
  const account = { id: 'account-1' };
  const events: string[] = [];
  let activeAccount: Account | null = null;
  const acquireAccessToken = createAccessTokenAcquirer<Account>({
    getActiveAccount: () => activeAccount,
    acquireTokenSilently: async () => ({ accessToken: 'unused' }),
    acquireTokenInteractively: async () => ({
      accessToken: 'interactive-token',
      account,
    }),
    isInteractionRequired: () => false,
    setActiveAccount: (newAccount) => {
      activeAccount = newAccount;
    },
    onEvent: (event) => events.push(event),
  });

  assert.equal(await acquireAccessToken(), 'interactive-token');
  assert.equal(activeAccount, account);
  assert.deepEqual(events, [
    'no_active_account',
    'interactive_started',
    'interactive_succeeded',
  ]);
});

test('places silent authentication on a dedicated callback document', () => {
  assert.equal(
    createSilentRedirectUri('https://app.caretogether.io/invites/accept'),
    'https://app.caretogether.io/silent-callback.html'
  );
});

test('extracts a stable Azure B2C error code for telemetry', () => {
  assert.equal(
    getIdentityProviderErrorCode(
      new Error('interaction_required: AADB2C90077: User has no session')
    ),
    'AADB2C90077'
  );
  assert.equal(
    getIdentityProviderErrorCode(new Error('network failed')),
    undefined
  );
});

test('treats a silent iframe timeout as recoverable interactive auth', () => {
  assert.equal(
    isInteractiveRecoveryRequired(
      { errorCode: 'monitor_window_timeout' },
      () => false
    ),
    true
  );
});
