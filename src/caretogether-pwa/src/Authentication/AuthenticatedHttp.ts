import { tryAcquireAccessToken, waitForAccountSwitchIfNeeded } from './Auth';

class AuthenticatedHttp {
  async fetch(url: RequestInfo, init?: RequestInit): Promise<Response> {
    const accessToken = await tryAcquireAccessToken();
    const accountSwitch = waitForAccountSwitchIfNeeded();
    if (accountSwitch) {
      return await accountSwitch;
    }

    if (!accessToken)
      //TODO: Handle this here (globally) and/or wrap this in a way that's easier to detect and handle in client code.
      throw new Error('User sign-in is required.');

    if (init) {
      init.headers = {
        ...init.headers,
        Authorization: `Bearer ${accessToken}`,
      };
    }
    return window.fetch(url, init);
  }
}

export const authenticatingFetch = new AuthenticatedHttp();
