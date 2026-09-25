export type AccessTokenAcquisitionEvent =
  | 'no_active_account'
  | 'silent_failed_interaction_required'
  | 'interactive_started'
  | 'interactive_reused'
  | 'interactive_succeeded'
  | 'interactive_failed';

export function createSilentRedirectUri(applicationRedirectUri: string) {
  return new URL('/silent-callback.html', applicationRedirectUri).toString();
}

export function getIdentityProviderErrorCode(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : undefined;

  return message?.match(/\bAADB2C\d+\b/)?.[0];
}

export function isInteractiveRecoveryRequired(
  error: unknown,
  isInteractionRequired: (error: unknown) => boolean
) {
  if (isInteractionRequired(error)) {
    return true;
  }

  if (typeof error !== 'object' || error === null || !('errorCode' in error)) {
    return false;
  }

  return (
    (error as { errorCode?: unknown }).errorCode === 'monitor_window_timeout'
  );
}

type TokenResult<TAccount> = {
  accessToken: string;
  account?: TAccount | null;
};

type AccessTokenAcquirerDependencies<TAccount> = {
  getActiveAccount: () => TAccount | null;
  acquireTokenSilently: (account: TAccount) => Promise<TokenResult<TAccount>>;
  acquireTokenInteractively: () => Promise<TokenResult<TAccount>>;
  isInteractionRequired: (error: unknown) => boolean;
  setActiveAccount: (account: TAccount) => void;
  onEvent: (event: AccessTokenAcquisitionEvent, error?: unknown) => void;
};

export function createAccessTokenAcquirer<TAccount>(
  dependencies: AccessTokenAcquirerDependencies<TAccount>
) {
  let interactiveAcquisition: Promise<TokenResult<TAccount>> | null = null;

  async function acquireInteractively() {
    if (interactiveAcquisition) {
      dependencies.onEvent('interactive_reused');
      return await interactiveAcquisition;
    }

    dependencies.onEvent('interactive_started');
    interactiveAcquisition = dependencies
      .acquireTokenInteractively()
      .then((result) => {
        if (result.account) {
          dependencies.setActiveAccount(result.account);
        }

        dependencies.onEvent('interactive_succeeded');
        return result;
      })
      .catch((error: unknown) => {
        dependencies.onEvent('interactive_failed', error);
        throw error;
      })
      .finally(() => {
        interactiveAcquisition = null;
      });

    return await interactiveAcquisition;
  }

  return async function acquireAccessToken() {
    const activeAccount = dependencies.getActiveAccount();
    if (!activeAccount) {
      dependencies.onEvent('no_active_account');
      return (await acquireInteractively()).accessToken;
    }

    try {
      return (await dependencies.acquireTokenSilently(activeAccount))
        .accessToken;
    } catch (error) {
      if (
        !isInteractiveRecoveryRequired(
          error,
          dependencies.isInteractionRequired
        )
      ) {
        throw error;
      }

      dependencies.onEvent('silent_failed_interaction_required', error);
      return (await acquireInteractively()).accessToken;
    }
  };
}
