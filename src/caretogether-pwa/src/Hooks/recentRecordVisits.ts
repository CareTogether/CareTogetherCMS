import type { LocationScope } from '../Model/LocationScope';

export function nextRecordVisit(
  previous: string | null,
  scope: LocationScope,
  userId: string | undefined,
  type: string | number,
  id: string | undefined
) {
  if (!userId || !id) return null;
  const visit = JSON.stringify([
    userId,
    scope.organizationId,
    scope.locationId,
    type,
    id,
  ]);
  return visit === previous ? null : visit;
}
