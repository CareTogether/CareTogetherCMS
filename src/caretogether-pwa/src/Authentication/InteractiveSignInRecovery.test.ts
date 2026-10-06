import assert from 'node:assert/strict';
import test from 'node:test';
import {
  continueWithPopupSignIn,
  getInteractiveSignInRecoverySnapshot,
  redirectForSignIn,
  requestInteractiveSignIn,
  retryPopupSignIn,
} from './InteractiveSignInRecovery.ts';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, resolve, reject };
}

test('opens recovery before sign-in and invokes popup only from Continue', async () => {
  const popupResult = deferred<string>();
  let popupCalls = 0;
  const request = requestInteractiveSignIn(
    () => {
      popupCalls += 1;
      return popupResult.promise;
    },
    async () => undefined
  );

  assert.deepEqual(getInteractiveSignInRecoverySnapshot(), {
    open: true,
    status: 'ready',
  });
  assert.equal(popupCalls, 0);

  continueWithPopupSignIn();
  assert.equal(popupCalls, 1);
  popupResult.resolve('access-token');
  assert.equal(await request, 'access-token');
  assert.equal(getInteractiveSignInRecoverySnapshot().open, false);
});

test('popup failure leaves the original request pending and retry can complete it', async () => {
  let popupCalls = 0;
  const request = requestInteractiveSignIn(
    async () => {
      popupCalls += 1;
      if (popupCalls === 1) {
        throw new Error('popup_window_error');
      }

      return 'recovered-token';
    },
    async () => undefined
  );
  let settled = false;
  void request.then(() => {
    settled = true;
  });

  continueWithPopupSignIn();
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(getInteractiveSignInRecoverySnapshot().status, 'popup_failed');
  assert.equal(settled, false);

  retryPopupSignIn();
  assert.equal(await request, 'recovered-token');
  assert.equal(popupCalls, 2);
});

test('redirect failure presents a retryable message and only retries by explicit action', async () => {
  let redirectCalls = 0;
  const request = requestInteractiveSignIn(
    async () => 'popup-token',
    async () => {
      redirectCalls += 1;
      throw new Error('redirect failed');
    }
  );

  redirectForSignIn();
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(
    getInteractiveSignInRecoverySnapshot().status,
    'redirect_failed'
  );
  assert.equal(redirectCalls, 1);

  redirectForSignIn();
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(redirectCalls, 2);
  assert.equal(
    getInteractiveSignInRecoverySnapshot().status,
    'redirect_failed'
  );
  assert.equal(getInteractiveSignInRecoverySnapshot().open, true);
  continueWithPopupSignIn();
  assert.equal(await request, 'popup-token');
});

test('ignores repeated Continue clicks while a popup is open', async () => {
  const popupResult = deferred<string>();
  let popupCalls = 0;
  const request = requestInteractiveSignIn(
    () => {
      popupCalls += 1;
      return popupResult.promise;
    },
    async () => undefined
  );

  continueWithPopupSignIn();
  continueWithPopupSignIn();
  assert.equal(popupCalls, 1);
  popupResult.resolve('token');
  assert.equal(await request, 'token');
});

test('treats popup errors uniformly and allows an explicit retry', async () => {
  let popupCalls = 0;
  const request = requestInteractiveSignIn(
    async () => {
      popupCalls += 1;
      if (popupCalls === 1) {
        throw new Error('popup did not finish');
      }

      return 'same-account-token';
    },
    async () => undefined
  );

  continueWithPopupSignIn();
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(getInteractiveSignInRecoverySnapshot().status, 'popup_failed');

  retryPopupSignIn();
  assert.equal(await request, 'same-account-token');
});

test('redirect is explicit, shares concurrent recovery, and keeps successful navigation pending', async () => {
  const popupResult = deferred<string>();
  let popupCalls = 0;
  let redirectCalls = 0;
  const request = requestInteractiveSignIn(
    () => {
      popupCalls += 1;
      return popupResult.promise;
    },
    async () => {
      redirectCalls += 1;
    }
  );
  const sharedRequest = requestInteractiveSignIn(
    async () => 'unused',
    async () => undefined
  );
  let settled = false;
  void request.then(() => {
    settled = true;
  });

  assert.equal(sharedRequest, request);
  assert.equal(redirectCalls, 0);
  assert.equal(popupCalls, 0);

  redirectForSignIn();
  assert.equal(redirectCalls, 1);
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(getInteractiveSignInRecoverySnapshot().status, 'redirecting');
  assert.equal(getInteractiveSignInRecoverySnapshot().open, true);
  assert.equal(settled, false);
  continueWithPopupSignIn();
  assert.equal(popupCalls, 0);
});
