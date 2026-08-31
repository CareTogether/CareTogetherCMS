export type LocationScope = {
  organizationId: string;
  locationId: string;
};

export const isSameLocationScope = (
  left: LocationScope,
  right: LocationScope
) =>
  left.organizationId === right.organizationId &&
  left.locationId === right.locationId;
