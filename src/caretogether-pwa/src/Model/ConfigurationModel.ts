import { atom as jotaiAtom, type Atom, useAtomValue } from 'jotai';
import { atomFamily } from 'jotai-family';
import {
  CurrentFeatureFlags,
  LocationConfiguration,
  OrganizationConfiguration,
} from '../GeneratedClient';
import { api } from '../Api/Api';
import { LocationContext, useSelectedLocationContext } from './Data';
import { isSameLocationScope } from './LocationScope';
import { useJotaiLoadable } from '../State/jotai/useJotaiLoadable';

//TODO: Distinguish by organization ID
export const organizationConfigurationEdited =
  jotaiAtom<OrganizationConfiguration | null>(null);

export type ExtendedOrganizationConfiguration = OrganizationConfiguration & {
  availableTimeZones?: string[];
  ethnicities?: string[];
  adultFamilyRelationships?: string[];
  arrangementReasons?: string[];
  caseCloseReasons?: string[];
  referralCloseReasons?: string[];
};

const noOrganizationConfiguration = jotaiAtom(
  async (): Promise<ExtendedOrganizationConfiguration | null> => null
);

const organizationConfigurationAtomFamily = atomFamily((organizationId: string) =>
  jotaiAtom(async (get): Promise<ExtendedOrganizationConfiguration | null> => {
    const edited = get(organizationConfigurationEdited);
    if (edited) {
      return edited as ExtendedOrganizationConfiguration;
    }

    const dataResponse =
      await api.configuration.getOrganizationConfiguration(organizationId);
    return dataResponse as ExtendedOrganizationConfiguration;
  })
);

const noLocationConfiguration = jotaiAtom(
  async (): Promise<LocationConfiguration | null> => null
);

const locationConfigurationAtomFamily = atomFamily(
  ({ organizationId, locationId }: LocationContext) =>
    jotaiAtom(async (get): Promise<LocationConfiguration | null> => {
      const organizationConfiguration = await get(
        organizationConfigurationAtomFamily(organizationId)
      );

      return (
        organizationConfiguration?.locations!.find(
          (x) => x.id === locationId
        ) ?? null
      );
    }),
  isSameLocationScope
);

const ethnicitiesAtomFamily = atomFamily(
  (locationContext: LocationContext) =>
    jotaiAtom(async (get) => {
      const locationConfiguration = await get(
        locationConfigurationAtomFamily(locationContext)
      );
      return locationConfiguration!.ethnicities!;
    }),
  isSameLocationScope
);

const adultFamilyRelationshipsAtomFamily = atomFamily(
  (locationContext: LocationContext) =>
    jotaiAtom(async (get) => {
      const locationConfiguration = await get(
        locationConfigurationAtomFamily(locationContext)
      );
      return locationConfiguration!.adultFamilyRelationships!;
    }),
  isSameLocationScope
);

const referralCloseReasonsAtomFamily = atomFamily((organizationId: string) =>
  jotaiAtom(async (get) => {
    const organizationConfiguration = await get(
      organizationConfigurationAtomFamily(organizationId)
    );
    return organizationConfiguration?.referralCloseReasons ?? [];
  })
);

const caseCloseReasonsAtomFamily = atomFamily((organizationId: string) =>
  jotaiAtom(async (get) => {
    const organizationConfiguration = await get(
      organizationConfigurationAtomFamily(organizationId)
    );
    return organizationConfiguration?.caseCloseReasons ?? [];
  })
);

const noStringList = jotaiAtom(async (): Promise<string[]> => []);

function useOrganizationConfigurationAtom() {
  const selectedLocationContext = useSelectedLocationContext();

  return selectedLocationContext
    ? organizationConfigurationAtomFamily(selectedLocationContext.organizationId)
    : noOrganizationConfiguration;
}

function useLocationConfigurationAtom() {
  const selectedLocationContext = useSelectedLocationContext();

  return selectedLocationContext
    ? locationConfigurationAtomFamily(selectedLocationContext)
    : noLocationConfiguration;
}

function useLocationStringListAtom(
  selectAtom: (locationContext: LocationContext) => Atom<Promise<string[]>>
) {
  const selectedLocationContext = useSelectedLocationContext();

  return selectedLocationContext
    ? selectAtom(selectedLocationContext)
    : noStringList;
}

function useOrganizationStringListAtom(
  selectAtom: (organizationId: string) => Atom<Promise<string[]>>
) {
  const selectedLocationContext = useSelectedLocationContext();

  return selectedLocationContext
    ? selectAtom(selectedLocationContext.organizationId)
    : noStringList;
}

export function useOrganizationConfiguration() {
  return useAtomValue(useOrganizationConfigurationAtom());
}

export function useOrganizationConfigurationLoadable() {
  return useJotaiLoadable(useOrganizationConfigurationAtom());
}

export function useLocationConfiguration() {
  return useAtomValue(useLocationConfigurationAtom());
}

export function useLocationConfigurationLoadable() {
  return useJotaiLoadable(useLocationConfigurationAtom());
}

export function useEthnicities() {
  return useAtomValue(useLocationStringListAtom(ethnicitiesAtomFamily));
}

export function useAdultFamilyRelationships() {
  return useAtomValue(
    useLocationStringListAtom(adultFamilyRelationshipsAtomFamily)
  );
}

export function useReferralCloseReasons() {
  return useAtomValue(
    useOrganizationStringListAtom(referralCloseReasonsAtomFamily)
  );
}

export function useCaseCloseReasons() {
  return useAtomValue(
    useOrganizationStringListAtom(caseCloseReasonsAtomFamily)
  );
}

const noLocationFeatureFlags = jotaiAtom(
  async (): Promise<CurrentFeatureFlags | null> => null
);

const featureFlagAtomFamily = atomFamily(
  ({ organizationId, locationId }: LocationContext) =>
    jotaiAtom(async (): Promise<CurrentFeatureFlags | null> => {
      const dataResponse = await api.configuration.getLocationFlags(
        organizationId,
        locationId
      );
      return dataResponse;
    }),
  isSameLocationScope
);

export function useFeatureFlags() {
  const selectedLocationContext = useSelectedLocationContext();

  return useAtomValue(
    selectedLocationContext
      ? featureFlagAtomFamily(selectedLocationContext)
      : noLocationFeatureFlags
  );
}

export function useFeatureFlagsLoadable() {
  const selectedLocationContext = useSelectedLocationContext();

  return useJotaiLoadable(
    selectedLocationContext
      ? featureFlagAtomFamily(selectedLocationContext)
      : noLocationFeatureFlags
  );
}
