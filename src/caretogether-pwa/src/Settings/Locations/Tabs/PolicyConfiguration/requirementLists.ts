// Policies keep requirements in up to three places while the backend migrates
// from name lists to RequirementDefinition lists:
//   - a legacy list (action names, or MonitoringRequirementOld for monitoring),
//   - the new list (RequirementDefinition / MonitoringRequirement),
//   - a `_PRE_MIGRATION` list, which the server builds by concatenating the two
//     and which is what policy evaluation actually reads. It is serialized with
//     the policy, so an older editor save may have stored a stale copy.
// The editor must show the union of all three and write a single consistent list
// back, otherwise requirements disappear from the UI or silently stop applying.

type Named = { actionName: string };

function uniqueBy<T>(items: T[], getName: (item: T) => string | undefined) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const name = getName(item);
    if (!name || seen.has(name)) return false;
    seen.add(name);
    return true;
  });
}

export function mergeRequirements<R extends Named>(
  legacyNames: string[] | undefined,
  requirements: R[] | undefined,
  evaluated: R[] | undefined,
  fromLegacyName: (actionName: string) => R
): R[] {
  return uniqueBy(
    [
      ...(legacyNames ?? []).map(fromLegacyName),
      ...(requirements ?? []),
      ...(evaluated ?? []),
    ],
    (requirement) => requirement.actionName
  );
}

export function mergeMonitoringRequirements<
  Legacy extends Named,
  M extends { action?: Named },
>(
  legacy: Legacy[] | undefined,
  requirements: M[] | undefined,
  evaluated: M[] | undefined,
  fromLegacy: (requirement: Legacy) => M
): M[] {
  return uniqueBy(
    [
      ...(legacy ?? []).map(fromLegacy),
      ...(requirements ?? []),
      ...(evaluated ?? []),
    ],
    (requirement) => requirement.action?.actionName
  );
}
