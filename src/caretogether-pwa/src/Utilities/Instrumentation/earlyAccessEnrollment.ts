type PostHogEnrollmentReader = {
  get_property: (propertyName: string) => unknown;
};

const POSTHOG_STORED_PERSON_PROPERTIES_KEY = '$stored_person_properties';

export function getEarlyAccessEnrollment(
  posthog: PostHogEnrollmentReader,
  flagKey: string
) {
  const personProperties = posthog.get_property(
    POSTHOG_STORED_PERSON_PROPERTIES_KEY
  ) as Record<string, unknown> | undefined;
  const enrollment = personProperties?.[`$feature_enrollment/${flagKey}`];

  return typeof enrollment === 'boolean' ? enrollment : undefined;
}
