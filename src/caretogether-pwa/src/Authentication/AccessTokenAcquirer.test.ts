import assert from 'node:assert/strict';
import test from 'node:test';
import {
  requestInteractiveSignIn,
  continueWithPopupSignIn,
  getInteractiveSignInRecoverySnapshot,
} from './InteractiveSignInRecovery.ts';
import {
  createAccessTokenAcquirer,
  createSessionAccountValidator,
  createSilentRedirectUri,
  getIdentityProviderErrorCode,
  isInteractiveRecoveryRequired,
} from './AccessTokenAcquirer.ts';

type Account = { id: string };

test('session account validator accepts the expected account', async () => {
  const result = {
    accessToken: 'same-user-token',
    account: { id: 'same-user' },
  };
  let reloads = 0;
  const validate = createSessionAccountValidator({
    getExpectedUserId: async () => 'same-user',
    getUserId: (account: Account) => account.id,
    getAccount: (tokenResult: typeof result) => tokenResult.account,
    setActiveAccount: () => undefined,
    reloadApplication: () => {
      reloads += 1;
    },
  });

  assert.equal(await validate(result), result);
  assert.equal(reloads, 0);
});

test('a silent account change reloads once and never returns the other account token', async () => {
  let activeAccount: Account | null = { id: 'expected-user' };
  let interactiveCalls = 0;
  let reloads = 0;
  let settled = false;
  const validate = createSessionAccountValidator({
    getExpectedUserId: async () => 'expected-user',
    getUserId: (account: Account) => account.id,
    getAccount: (result: { accessToken: string; account?: Account | null }) =>
      result.account,
    setActiveAccount: (account: Account) => {
      activeAccount = account;
    },
    reloadApplication: () => {
      reloads += 1;
    },
  });
  const acquire = createAccessTokenAcquirer<Account>({
    getActiveAccount: () => activeAccount,
    acquireTokenSilently: async () =>
      validate({
        accessToken: 'other-user-token',
        account: { id: 'other-user' },
      }),
    acquireTokenInteractively: async () => {
      interactiveCalls += 1;
      return {
        accessToken: 'interactive-token',
        account: { id: 'expected-user' },
      };
    },
    isInteractionRequired: () => false,
    setActiveAccount: (account) => {
      activeAccount = account;
    },
    onEvent: () => undefined,
  });

  void acquire().then(() => {
    settled = true;
  });
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(settled, false);
  assert.equal(interactiveCalls, 0);
  assert.deepEqual(activeAccount, { id: 'other-user' });
  assert.equal(reloads, 1);
});

test('concurrent account changes set one active account and request one reload', async () => {
  const expectedUser = deferred<string>();
  const updates: Account[] = [];
  let reloads = 0;
  const validate = createSessionAccountValidator({
    getExpectedUserId: () => expectedUser.promise,
    getUserId: (account: Account) => account.id,
    getAccount: (result: { accessToken: string; account: Account }) =>
      result.account,
    setActiveAccount: (account: Account) => updates.push(account),
    reloadApplication: () => {
      reloads += 1;
    },
  });

  assert.equal(validate.waitIfSwitchingAccounts(), null);
  const first = validate({ accessToken: 'token', account: { id: 'new-user' } });
  const second = validate({
    accessToken: 'token',
    account: { id: 'new-user' },
  });
  let firstSettled = false;
  let secondSettled = false;
  void first.then(() => {
    firstSettled = true;
  });
  void second.then(() => {
    secondSettled = true;
  });
  expectedUser.resolve('old-user');
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(reloads, 1);
  assert.deepEqual(updates, [{ id: 'new-user' }]);
  assert.equal(firstSettled, false);
  assert.equal(secondSettled, false);
  assert.ok(validate.waitIfSwitchingAccounts());
});

test('a delayed same-account result also waits after a switch has started', async () => {
  const expectedUser = deferred<string>();
  let reloads = 0;
  const validate = createSessionAccountValidator({
    getExpectedUserId: () => expectedUser.promise,
    getUserId: (account: Account) => account.id,
    getAccount: (result: { accessToken: string; account: Account }) =>
      result.account,
    setActiveAccount: () => undefined,
    reloadApplication: () => {
      reloads += 1;
    },
  });
  let wrongResultSettled = false;
  let sameResultSettled = false;
  const wrongResult = validate({
    accessToken: 'token',
    account: { id: 'new-user' },
  });
  const sameResult = validate({
    accessToken: 'token',
    account: { id: 'old-user' },
  });
  void wrongResult.then(() => {
    wrongResultSettled = true;
  });
  void sameResult.then(() => {
    sameResultSettled = true;
  });

  expectedUser.resolve('old-user');
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(reloads, 1);
  assert.equal(wrongResultSettled, false);
  assert.equal(sameResultSettled, false);
});

test('session account validator fails when a token result has no account', async () => {
  const validate = createSessionAccountValidator({
    getExpectedUserId: async () => 'expected-user',
    getUserId: (account: Account) => account.id,
    getAccount: () => null,
    setActiveAccount: () => undefined,
    reloadApplication: () => undefined,
  });

  await assert.rejects(validate({}), /signed-in account is unavailable/);
});

test('background API recovery waits for a click and survives a blocked popup', async () => {
  let popupCalls = 0;
  let redirectCalls = 0;
  let requestSettled = false;
  let activeAccountUpdates = 0;
  const acquire = createAccessTokenAcquirer<Account>({
    getActiveAccount: () => ({ id: 'new-account' }),
    acquireTokenSilently: async () => {
      throw { errorCode: 'monitor_window_timeout' };
    },
    acquireTokenInteractively: () =>
      requestInteractiveSignIn(
        async () => {
          popupCalls += 1;
          if (popupCalls === 1) {
            throw { errorCode: 'popup_window_error' };
          }
          return {
            accessToken: 'recovered-token',
            account: { id: 'new-account' },
          };
        },
        async () => {
          redirectCalls += 1;
        }
      ),
    isInteractionRequired: () => false,
    setActiveAccount: () => {
      activeAccountUpdates += 1;
    },
    onEvent: () => undefined,
  });

  const requests = Promise.all([acquire(), acquire()]);
  void requests.then(() => {
    requestSettled = true;
  });
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(popupCalls, 0);
  assert.equal(getInteractiveSignInRecoverySnapshot().status, 'ready');

  continueWithPopupSignIn();
  assert.equal(popupCalls, 1);
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(getInteractiveSignInRecoverySnapshot().status, 'popup_failed');
  assert.equal(requestSettled, false);
  assert.equal(redirectCalls, 0);

  continueWithPopupSignIn();
  assert.deepEqual(await requests, ['recovered-token', 'recovered-token']);
  assert.equal(activeAccountUpdates, 1);
  assert.equal(getInteractiveSignInRecoverySnapshot().open, false);
});

test('a popup account change reloads and keeps the old API request pending', async () => {
  let activeAccount: Account | null = { id: 'old-user' };
  let reloads = 0;
  let settled = false;
  const validate = createSessionAccountValidator({
    getExpectedUserId: async () => 'old-user',
    getUserId: (account: Account) => account.id,
    getAccount: (result: { accessToken: string; account: Account }) =>
      result.account,
    setActiveAccount: (account: Account) => {
      activeAccount = account;
    },
    reloadApplication: () => {
      reloads += 1;
    },
  });
  const acquire = createAccessTokenAcquirer<Account>({
    getActiveAccount: () => activeAccount,
    acquireTokenSilently: async () => {
      throw { errorCode: 'monitor_window_timeout' };
    },
    acquireTokenInteractively: () =>
      requestInteractiveSignIn(
        async () =>
          validate({
            accessToken: 'new-user-token',
            account: { id: 'new-user' },
          }),
        async () => undefined
      ),
    isInteractionRequired: () => false,
    setActiveAccount: (account) => {
      activeAccount = account;
    },
    onEvent: () => undefined,
  });

  void acquire().then(() => {
    settled = true;
  });
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(getInteractiveSignInRecoverySnapshot().status, 'ready');
  continueWithPopupSignIn();
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(settled, false);
  assert.equal(reloads, 1);
  assert.deepEqual(activeAccount, { id: 'new-user' });
  assert.equal(getInteractiveSignInRecoverySnapshot().status, 'signing_in');
});

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
