import React from 'react';

type React19ClientInternals = {
  H: unknown;
};

type React18SecretInternals = {
  ReactCurrentDispatcher: {
    current: unknown;
  };
  ReactCurrentOwner: {
    currentDispatcher: unknown;
  };
};

type ReactWithPrivateInternals = typeof React & {
  __CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE?: React19ClientInternals;
  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED?: React18SecretInternals;
};

const reactWithInternals = React as ReactWithPrivateInternals;
const clientInternals =
  reactWithInternals.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;

if (
  clientInternals &&
  !reactWithInternals.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
) {
  const legacyInternals: React18SecretInternals = {
    ReactCurrentDispatcher: {
      get current() {
        return clientInternals.H;
      },
    },
    ReactCurrentOwner: {
      get currentDispatcher() {
        return clientInternals.H;
      },
    },
  };

  Object.defineProperty(
    reactWithInternals,
    '__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED',
    {
      configurable: true,
      value: legacyInternals,
    }
  );
}
