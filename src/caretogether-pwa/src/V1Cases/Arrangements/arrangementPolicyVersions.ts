import {
  Arrangement,
  ArrangementPolicy,
  ArrangementPolicyVersion,
} from '../../GeneratedClient';

export function hasPolicyVersions(arrangementPolicy: ArrangementPolicy) {
  return (arrangementPolicy.policyVersions?.length ?? 0) > 0;
}

export function getAvailablePolicyVersions(
  arrangementPolicy: ArrangementPolicy,
  now = new Date()
) {
  return (
    arrangementPolicy.policyVersions?.filter(
      (policyVersion) =>
        !policyVersion.supersededAtUtc ||
        new Date(policyVersion.supersededAtUtc) > now
    ) ?? []
  );
}

export function isArrangementPolicyAvailable(
  arrangementPolicy: ArrangementPolicy,
  now = new Date()
) {
  if (hasPolicyVersions(arrangementPolicy)) {
    return getAvailablePolicyVersions(arrangementPolicy, now).length > 0;
  }

  return (
    !arrangementPolicy.supersededAtUtc ||
    new Date(arrangementPolicy.supersededAtUtc) > now
  );
}

export function getAutomaticPolicyVersion(
  arrangementPolicy: ArrangementPolicy
) {
  if (!hasPolicyVersions(arrangementPolicy)) return null;

  const availableVersions = getAvailablePolicyVersions(arrangementPolicy);
  return availableVersions.length === 1 ? availableVersions[0].version : null;
}

export function withPolicyVersion(
  arrangementPolicy: ArrangementPolicy,
  policyVersion: ArrangementPolicyVersion
): ArrangementPolicy {
  return new ArrangementPolicy({
    ...arrangementPolicy,
    childInvolvement: policyVersion.childInvolvement,
    arrangementFunctions: policyVersion.arrangementFunctions,
    requiredSetupActionNames: policyVersion.requiredSetupActionNames,
    requiredMonitoringActions: policyVersion.requiredMonitoringActions,
    requiredCloseoutActionNames: policyVersion.requiredCloseoutActionNames,
    requiredSetupActions: policyVersion.requiredSetupActions,
    requiredMonitoringActionsNew: policyVersion.requiredMonitoringActionsNew,
    requiredCloseoutActions: policyVersion.requiredCloseoutActions,
    supersededAtUtc: policyVersion.supersededAtUtc,
  });
}

export function resolveArrangementPolicy(
  arrangementPolicies: ArrangementPolicy[] | undefined,
  arrangement: Arrangement
) {
  const arrangementPolicy = arrangementPolicies?.find(
    (policy) => policy.arrangementType === arrangement.arrangementType
  );

  if (!arrangementPolicy || !arrangement.arrangementPolicyVersion) {
    return arrangementPolicy;
  }

  const policyVersion = arrangementPolicy.policyVersions?.find(
    (version) => version.version === arrangement.arrangementPolicyVersion
  );

  return policyVersion
    ? withPolicyVersion(arrangementPolicy, policyVersion)
    : arrangementPolicy;
}
