export type InteractiveSignInRecoveryStatus =
  | 'closed'
  | 'ready'
  | 'signing_in'
  | 'popup_failed'
  | 'redirecting'
  | 'redirect_failed';

export type InteractiveSignInRecoverySnapshot = {
  open: boolean;
  status: InteractiveSignInRecoveryStatus;
};

type Recovery<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  popup: () => Promise<T>;
  redirect: () => Promise<void>;
  operationInFlight: boolean;
};

const closedSnapshot: InteractiveSignInRecoverySnapshot = {
  open: false,
  status: 'closed',
};

let snapshot = closedSnapshot;
let recovery: Recovery<unknown> | null = null;
const listeners = new Set<() => void>();

function setSnapshot(next: InteractiveSignInRecoverySnapshot) {
  snapshot = next;
  for (const listener of listeners) {
    listener();
  }
}

export function getInteractiveSignInRecoverySnapshot() {
  return snapshot;
}

export function subscribeToInteractiveSignInRecovery(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function requestInteractiveSignIn<T>(
  popup: () => Promise<T>,
  redirect: () => Promise<void>
): Promise<T> {
  if (recovery) {
    return recovery.promise as Promise<T>;
  }

  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });

  recovery = {
    promise,
    resolve: (value) => resolve(value as T),
    popup,
    redirect,
    operationInFlight: false,
  };
  setSnapshot({ open: true, status: 'ready' });
  return promise;
}

function finishRecovery<T>(activeRecovery: Recovery<T>, result: T) {
  if (recovery !== activeRecovery) {
    return;
  }

  recovery = null;
  setSnapshot(closedSnapshot);
  activeRecovery.resolve(result);
}

export function continueWithPopupSignIn() {
  const activeRecovery = recovery;
  if (!activeRecovery || activeRecovery.operationInFlight) {
    return;
  }

  activeRecovery.operationInFlight = true;
  setSnapshot({ open: true, status: 'signing_in' });

  // Invoke directly from the UI action so the browser still considers it a user gesture.
  let popupPromise: Promise<unknown>;
  try {
    popupPromise = activeRecovery.popup();
  } catch {
    activeRecovery.operationInFlight = false;
    setSnapshot({ open: true, status: 'popup_failed' });
    return;
  }

  void Promise.resolve(popupPromise).then(
    (result) => finishRecovery(activeRecovery, result),
    () => {
      if (recovery !== activeRecovery) {
        return;
      }

      activeRecovery.operationInFlight = false;
      setSnapshot({ open: true, status: 'popup_failed' });
    }
  );
}

export function retryPopupSignIn() {
  continueWithPopupSignIn();
}

export function redirectForSignIn() {
  const activeRecovery = recovery;
  if (!activeRecovery || activeRecovery.operationInFlight) {
    return;
  }

  activeRecovery.operationInFlight = true;
  setSnapshot({ open: true, status: 'redirecting' });

  // This callback is also invoked directly from its button to preserve the gesture.
  let redirectPromise: Promise<void>;
  try {
    redirectPromise = activeRecovery.redirect();
  } catch {
    activeRecovery.operationInFlight = false;
    setSnapshot({ open: true, status: 'redirect_failed' });
    return;
  }

  void Promise.resolve(redirectPromise).then(
    () => {
      // A successful redirect should navigate away; retain the pending request meanwhile.
    },
    () => {
      if (recovery !== activeRecovery) {
        return;
      }

      activeRecovery.operationInFlight = false;
      setSnapshot({ open: true, status: 'redirect_failed' });
    }
  );
}
