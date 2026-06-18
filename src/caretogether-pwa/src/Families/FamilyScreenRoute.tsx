import { useEffect, useState } from 'react';
import { usePostHog } from 'posthog-js/react';
import {
  FAMILY_SCREEN_V2_EARLY_ACCESS_FEATURE_NAME,
  FAMILY_SCREEN_V2_ENROLLMENT_CHANGED_EVENT,
  POSTHOG_STORED_PERSON_PROPERTIES_KEY,
} from '../featureFlags';
import { ProgressBackdrop } from '../Shell/ProgressBackdrop';
import { FamilyScreen } from './FamilyScreen';
import { FamilyScreenV2 } from './FamilyScreenV2';

type EnrollmentState = 'loading' | 'enrolled' | 'not-enrolled';

function earlyAccessEnrollmentProperty(flagKey: string) {
  return `$feature_enrollment/${flagKey}`;
}

function getEarlyAccessEnrollment(
  posthog: ReturnType<typeof usePostHog>,
  flagKey: string
) {
  const personProperties = posthog.get_property(
    POSTHOG_STORED_PERSON_PROPERTIES_KEY
  ) as Record<string, unknown> | undefined;

  return personProperties?.[earlyAccessEnrollmentProperty(flagKey)] === true;
}

export function FamilyScreenRoute() {
  const posthog = usePostHog();
  const [enrollmentState, setEnrollmentState] =
    useState<EnrollmentState>('loading');
  const [earlyAccessFlagKey, setEarlyAccessFlagKey] = useState<string | null>(
    null
  );

  useEffect(() => {
    let isCurrentLoad = true;

    setEnrollmentState('loading');

    posthog.getEarlyAccessFeatures((features) => {
      if (!isCurrentLoad) {
        return;
      }

      const familyScreenV2Feature = features.find(
        (feature) => feature.name === FAMILY_SCREEN_V2_EARLY_ACCESS_FEATURE_NAME
      );

      if (!familyScreenV2Feature?.flagKey) {
        setEnrollmentState('not-enrolled');
        return;
      }

      setEarlyAccessFlagKey(familyScreenV2Feature.flagKey);
      setEnrollmentState(
        getEarlyAccessEnrollment(posthog, familyScreenV2Feature.flagKey)
          ? 'enrolled'
          : 'not-enrolled'
      );
    }, true);

    return () => {
      isCurrentLoad = false;
    };
  }, [posthog]);

  useEffect(() => {
    if (!earlyAccessFlagKey) {
      return;
    }

    return posthog.onFeatureFlags(() => {
      setEnrollmentState(
        getEarlyAccessEnrollment(posthog, earlyAccessFlagKey)
          ? 'enrolled'
          : 'not-enrolled'
      );
    });
  }, [earlyAccessFlagKey, posthog]);

  useEffect(() => {
    function handleEnrollmentChanged(event: Event) {
      const enrollmentChangedEvent = event as CustomEvent<{
        flagKey: string;
        isEnrolled: boolean;
      }>;

      setEarlyAccessFlagKey(enrollmentChangedEvent.detail.flagKey);
      setEnrollmentState(
        enrollmentChangedEvent.detail.isEnrolled ? 'enrolled' : 'not-enrolled'
      );
    }

    window.addEventListener(
      FAMILY_SCREEN_V2_ENROLLMENT_CHANGED_EVENT,
      handleEnrollmentChanged
    );

    return () => {
      window.removeEventListener(
        FAMILY_SCREEN_V2_ENROLLMENT_CHANGED_EVENT,
        handleEnrollmentChanged
      );
    };
  }, []);

  if (enrollmentState === 'loading') {
    return (
      <ProgressBackdrop opaque>
        <p>Loading...</p>
      </ProgressBackdrop>
    );
  }

  if (enrollmentState !== 'enrolled') {
    return <FamilyScreen />;
  }

  return <FamilyScreenV2 />;
}
