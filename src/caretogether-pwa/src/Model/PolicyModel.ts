import { useEffect, useMemo } from 'react';
import {
  atom as jotaiAtom,
  useAtom,
  useAtomValue,
  useSetAtom,
  type Atom,
} from 'jotai';
import { atomFamily } from 'jotai-family';
import {
  buildRoleFilters,
  roleFiltersState,
} from '../Volunteers/VolunteerApprovalTab/roleFiltersState';
import { statusFiltersState } from '../Volunteers/VolunteerApprovalTab/statusFiltersState';
import {
  LocationContext,
  useRequiredSelectedLocationContext,
  useSelectedLocationContext,
} from './Data';
import { isSameLocationScope } from './LocationScope';
import { api } from '../Api/Api';
import { EffectiveLocationPolicy, RequirementStage } from '../GeneratedClient';
import { useJotaiLoadable } from '../State/jotai/useJotaiLoadable';
import { createRefreshTokenAtom } from '../State/jotai/refreshAtom';

const policyRefreshTokenAtomFamily = atomFamily(
  () => createRefreshTokenAtom(),
  isSameLocationScope
);

const policyAtomFamily = atomFamily(
  ({ organizationId, locationId }: LocationContext) =>
    jotaiAtom(async (get): Promise<EffectiveLocationPolicy> => {
      get(policyRefreshTokenAtomFamily({ organizationId, locationId }));

      return await api.configuration.getEffectiveLocationPolicy(
        organizationId,
        locationId
      );
    }),
  isSameLocationScope
);

const allApprovalAndOnboardingRequirementsAtomFamily = atomFamily(
  (locationContext: LocationContext) =>
    jotaiAtom(async (get) => {
      const policy = await get(policyAtomFamily(locationContext));
      const ActionNames =
        (policy.actionDefinitions &&
          Object.entries(policy.actionDefinitions).map(
            ([actionName]) => actionName
          )) ||
        [];
      return ActionNames.filter(
        (actionName) =>
          (policy.volunteerPolicy?.volunteerFamilyRoles &&
            Object.entries(policy.volunteerPolicy.volunteerFamilyRoles).some(
              ([, rolePolicy]) =>
                rolePolicy.policyVersions &&
                Object.entries(rolePolicy.policyVersions).some(
                  ([, rolePolicyVersion]) =>
                    rolePolicyVersion.requirements &&
                    rolePolicyVersion.requirements.some(
                      (requirement) =>
                        requirement.actionName === actionName &&
                        requirement.stage !== RequirementStage.Application
                    )
                )
            )) ||
          (policy.volunteerPolicy?.volunteerRoles &&
            Object.entries(policy.volunteerPolicy.volunteerRoles).some(
              ([, rolePolicy]) =>
                rolePolicy.policyVersions &&
                Object.entries(rolePolicy.policyVersions).some(
                  ([, rolePolicyVersion]) =>
                    rolePolicyVersion.requirements &&
                    rolePolicyVersion.requirements.some(
                      (requirement) =>
                        requirement.actionName === actionName &&
                        requirement.stage !== RequirementStage.Application
                    )
                )
            ))
      );
    }),
  isSameLocationScope
);

const allFunctionsInPolicyAtomFamily = atomFamily(
  (locationContext: LocationContext) =>
    jotaiAtom(async (get) => {
      const policy = await get(policyAtomFamily(locationContext));
      const allFunctions =
        policy.referralPolicy?.arrangementPolicies?.flatMap(
          (arrangement) =>
            arrangement.arrangementFunctions?.map(
              (arrangementFunction) => arrangementFunction.functionName!
            ) || []
        ) || [];
      return Array.from(new Set(allFunctions));
    }),
  isSameLocationScope
);

const allFunctionAssignmentRolesInPolicyAtomFamily = atomFamily(
  (locationContext: LocationContext) =>
    jotaiAtom(async (get) => {
      const policy = await get(policyAtomFamily(locationContext));
      const allFunctionAssignmentRoles = [
        ...(policy.referralPolicy?.functionAssignmentPolicies ?? []),
        ...(policy.v1ReferralPolicy?.functionAssignmentPolicies ?? []),
      ].map(
        (volunteerAssignmentPolicy) =>
          volunteerAssignmentPolicy.assignmentRole
      );
      return Array.from(new Set(allFunctionAssignmentRoles)).filter(
        (assignmentRole): assignmentRole is string => Boolean(assignmentRole)
      );
    }),
  isSameLocationScope
);

const noStringList = jotaiAtom(async (): Promise<string[]> => []);

function usePolicyStringListAtom(
  atomSelector: (locationContext: LocationContext) => Atom<Promise<string[]>>
) {
  const selectedLocationContext = useSelectedLocationContext();

  return selectedLocationContext
    ? atomSelector(selectedLocationContext)
    : noStringList;
}

export function usePolicy() {
  const selectedLocationContext = useRequiredSelectedLocationContext();
  return useAtomValue(policyAtomFamily(selectedLocationContext));
}

export function useRefreshPolicy() {
  const selectedLocationContext = useRequiredSelectedLocationContext();
  const refreshPolicy = useSetAtom(
    policyRefreshTokenAtomFamily(selectedLocationContext)
  );

  return () => refreshPolicy((previous) => previous + 1);
}

export function useAllApprovalAndOnboardingRequirements() {
  return useAtomValue(
    usePolicyStringListAtom(allApprovalAndOnboardingRequirementsAtomFamily)
  );
}

export function useAllFunctionsInPolicyLoadable() {
  return useJotaiLoadable(
    usePolicyStringListAtom(allFunctionsInPolicyAtomFamily)
  );
}

export function useAllFunctionAssignmentRolesInPolicyLoadable() {
  return useJotaiLoadable(
    usePolicyStringListAtom(allFunctionAssignmentRolesInPolicyAtomFamily)
  );
}

export function useRoleFilters() {
  const policy = usePolicy();
  const [roleFilters, setRoleFilters] = useAtom(roleFiltersState);
  const initialRoleFilters = useMemo(() => buildRoleFilters(policy), [policy]);

  useEffect(() => {
    if (roleFilters !== null) return;
    setRoleFilters(initialRoleFilters);
  }, [initialRoleFilters, roleFilters, setRoleFilters]);

  return [roleFilters ?? initialRoleFilters, setRoleFilters] as const;
}

export function useStatusFilters() {
  return useAtom(statusFiltersState);
}
