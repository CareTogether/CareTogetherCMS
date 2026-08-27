import { test as base, expect } from '@playwright/test';
import {
  FAMILY_SCREEN_V2_EARLY_ACCESS_FEATURE_FLAG,
  REFERRALS_FEATURE_FLAG,
  type FeatureFlagOverrides,
} from '../../src/featureFlags';

type FeatureFlagFixtures = {
  featureFlags: FeatureFlagOverrides;
  _installFeatureFlags: void;
};

const defaultE2EFeatureFlags: FeatureFlagOverrides = {
  [FAMILY_SCREEN_V2_EARLY_ACCESS_FEATURE_FLAG]: true,
  [REFERRALS_FEATURE_FLAG]: true,
};

export const test = base.extend<FeatureFlagFixtures>({
  featureFlags: [{}, { option: true }],
  _installFeatureFlags: [
    async ({ context, featureFlags }, use) => {
      const effectiveFeatureFlags = {
        ...defaultE2EFeatureFlags,
        ...featureFlags,
      };

      await context.addInitScript((flags) => {
        window.__CARETOGETHER_E2E_FEATURE_FLAGS__ = flags;
      }, effectiveFeatureFlags);

      await use();
    },
    { auto: true },
  ],
});

export { expect };
