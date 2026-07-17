import {
  ActionRequirement,
  ArrangementFunction,
  ArrangementPolicy,
  ChildInvolvement,
  CombinedFamilyInfo,
  CustomField,
  CustomFieldType,
  CustomFieldValidation,
  DocumentLinkRequirement,
  EffectiveLocationPolicy,
  FunctionAssignmentPolicy,
  FunctionRequirement,
  MonitoringRequirement,
  NoteEntryRequirement,
  Person,
  RequirementDefinition,
  RequirementStage,
  V1CasePolicy,
  V1ReferralPolicy,
  VolunteerApprovalRequirement,
  VolunteerFamilyApprovalRequirement,
  VolunteerFamilyRequirementScope,
  VolunteerPolicy,
  VolunteerRolePolicy,
  VolunteerRolePolicyVersion,
  VolunteerFamilyRolePolicy,
  VolunteerFamilyRolePolicyVersion,
} from '../../../../GeneratedClient';
import { personNameString } from '../../../../Families/PersonName';
import type { ActionDefinitionDraft, ArrangementFunctionDraft, ArrangementPolicyDraft, CustomFieldDraft, FunctionAssignmentPolicyDraft, MonitoringRequirementDraft, RequirementDraft, ValidityUnit, VolunteerRolePolicyVersionDraft } from './types';

const enumLabelOverrides = new Map<object, Record<string, string>>([
  [
    CustomFieldType,
    {
      String: 'Text',
      Boolean: 'Yes/No',
      StringArray: 'Selection',
    },
  ],
  [
    CustomFieldValidation,
    {
      SuggestOnly: 'Suggestions Only',
    },
  ],
  [
    ChildInvolvement,
    {
      ChildHousing: 'Child Housing',
      DaytimeChildCareOnly: 'Daytime Child Care Only',
      NoChildInvolvement: 'No Child Involvement',
      ChildOrAdultInvolvement: 'Child or Adult Involvement',
    },
  ],
  [
    VolunteerFamilyRequirementScope,
    {
      OncePerFamily: 'Once per Family',
      AllAdultsInTheFamily: 'All Adults in the Family',
      AllParticipatingAdultsInTheFamily:
        'All Participating Adults in the Family',
    },
  ],
]);

export function humanizeIdentifier(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
}

export function enumName<T extends object>(enumType: T, value: unknown) {
  if (value === null || typeof value === 'undefined') return '-';
  const rawName = String(
    (enumType as Record<string, string | number>)[String(value)] ?? value
  );
  return (
    enumLabelOverrides.get(enumType)?.[rawName] ?? humanizeIdentifier(rawName)
  );
}

export function enumOptions<T extends object>(enumType: T) {
  return Object.entries(enumType)
    .filter(([, value]) => typeof value === 'number')
    .map(([, value]) => ({
      label: enumName(enumType, value),
      value: value as number,
    }));
}

export function formatDate(value?: Date) {
  return value ? value.toLocaleString() : 'Current';
}

export function summarizeCount(
  count: number,
  singular: string,
  plural = `${singular}s`
) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function listText(items?: string[]) {
  if (!items || items.length === 0) return '-';
  return items.join(', ');
}

export function personOptionsFromFamilies(families: CombinedFamilyInfo[]) {
  return families
    .flatMap((family) => [
      ...(family.family?.adults ?? []).map((adult) => adult.item1),
      ...(family.family?.children ?? []),
    ])
    .filter((person): person is Person => Boolean(person?.id))
    .map((person) => ({
      id: person.id!,
      label: personNameString(person),
      person,
    }))
    .sort((first, second) => first.label.localeCompare(second.label));
}

export function normalizeStringList(values: string[]) {
  return Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter(Boolean)
    )
  );
}

const validityUnitDayMultipliers: Record<ValidityUnit, number> = {
  days: 1,
  months: 30,
  years: 365,
};

export function validityUnitLabel(unit: ValidityUnit) {
  if (unit === 'days') return 'day';
  if (unit === 'months') return 'month';
  return 'year';
}

export function normalizeValidityDays(
  days: number
): Pick<ActionDefinitionDraft, 'validityAmount' | 'validityUnit'> {
  if (days >= 365 && days % 365 === 0) {
    return { validityAmount: String(days / 365), validityUnit: 'years' };
  }

  if (days >= 30 && days % 30 === 0) {
    return { validityAmount: String(days / 30), validityUnit: 'months' };
  }

  return { validityAmount: String(days), validityUnit: 'days' };
}

export function parseValidity(
  value?: string
): Pick<
  ActionDefinitionDraft,
  'validityEnabled' | 'validityAmount' | 'validityUnit'
> {
  if (!value) {
    return {
      validityEnabled: false,
      validityAmount: '30',
      validityUnit: 'days',
    };
  }

  const dayMatch = value.match(/^(\d+)\./);
  if (dayMatch) {
    return {
      validityEnabled: true,
      ...normalizeValidityDays(Number(dayMatch[1])),
    };
  }

  const timeMatch = value.match(/^(\d+):(\d+):/);
  if (!timeMatch) {
    return {
      validityEnabled: true,
      validityAmount: '30',
      validityUnit: 'days',
    };
  }

  return {
    validityEnabled: true,
    validityAmount: '1',
    validityUnit: 'days',
  };
}

export function parseValidityAmount(value: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0 || !Number.isInteger(amount)) {
    return undefined;
  }

  return amount;
}

export function toTimeSpanString(
  enabled: boolean,
  amount: string,
  unit: ActionDefinitionDraft['validityUnit']
) {
  if (!enabled) return undefined;
  const safeAmount = parseValidityAmount(amount);
  if (!safeAmount) return undefined;

  const days = safeAmount * validityUnitDayMultipliers[unit];

  return `${days}.00:00:00`;
}

export function formatValidity(value?: string) {
  if (!value) return '-';

  const dayMatch = value.match(/^(\d+)\./);
  if (dayMatch) {
    const { validityAmount, validityUnit } = normalizeValidityDays(
      Number(dayMatch[1])
    );
    return summarizeCount(
      Number(validityAmount),
      validityUnitLabel(validityUnit)
    );
  }

  const timeMatch = value.match(/^(\d+):(\d+):/);
  if (!timeMatch) return value;

  const hours = Number(timeMatch[1]);
  const minutes = Number(timeMatch[2]);

  if (hours > 0) return summarizeCount(hours, 'hour');
  return summarizeCount(Math.max(minutes, 1), 'minute');
}

export function actionToDraft(
  actionName = '',
  action?: ActionRequirement
): ActionDefinitionDraft {
  const validity = parseValidity(action?.validity);

  return {
    actionName,
    documentLink: action?.documentLink ?? DocumentLinkRequirement.None,
    noteEntry: action?.noteEntry ?? NoteEntryRequirement.None,
    instructions: action?.instructions ?? '',
    infoLink: action?.infoLink ?? '',
    validityEnabled: validity.validityEnabled,
    validityAmount: validity.validityAmount,
    validityUnit: validity.validityUnit,
    canView: action?.canView ?? '',
    canEdit: action?.canEdit ?? '',
    alternateNames: action?.alternateNames ?? [],
  };
}

export function customFieldToDraft(field?: CustomField): CustomFieldDraft {
  return {
    name: field?.name ?? '',
    type: field?.type ?? CustomFieldType.String,
    validationEnabled: typeof field?.validation !== 'undefined',
    validValues: field?.validValues ?? [],
  };
}

export function requirementToDraft(
  requirement?: RequirementDefinition
): RequirementDraft {
  return {
    actionName: requirement?.actionName ?? '',
    isRequired: requirement?.isRequired ?? true,
  };
}

export function monitoringRequirementToDraft(
  requirement?: MonitoringRequirement
): MonitoringRequirementDraft {
  const delay = parseValidity(requirement?.recurrence?.toJSON().delay);

  return {
    ...requirementToDraft(requirement?.action),
    delayEnabled: delay.validityEnabled,
    delayAmount: delay.validityAmount,
    delayUnit: delay.validityUnit,
  };
}

export function functionAssignmentPolicyToDraft(
  policy?: FunctionAssignmentPolicy
): FunctionAssignmentPolicyDraft {
  return {
    assignmentRole: policy?.assignmentRole ?? '',
    eligibleLocationRoles: policy?.eligibility?.eligibleLocationRoles ?? [],
    eligibleIndividualVolunteerRoles:
      policy?.eligibility?.eligibleIndividualVolunteerRoles ?? [],
    eligibleVolunteerFamilyRoles:
      policy?.eligibility?.eligibleVolunteerFamilyRoles ?? [],
    eligiblePeople: policy?.eligibility?.eligiblePeople ?? [],
  };
}

export function arrangementFunctionToDraft(
  arrangementFunction?: ArrangementFunction
): ArrangementFunctionDraft {
  return {
    functionName: arrangementFunction?.functionName ?? '',
    requirement:
      arrangementFunction?.requirement ?? FunctionRequirement.ZeroOrMore,
    eligibleIndividualVolunteerRoles:
      arrangementFunction?.eligibleIndividualVolunteerRoles ?? [],
    eligibleVolunteerFamilyRoles:
      arrangementFunction?.eligibleVolunteerFamilyRoles ?? [],
    eligiblePeople: arrangementFunction?.eligiblePeople ?? [],
  };
}

export function arrangementPolicyToDraft(
  policy?: ArrangementPolicy
): ArrangementPolicyDraft {
  return {
    arrangementType: policy?.arrangementType ?? '',
    childInvolvement:
      policy?.childInvolvement ?? ChildInvolvement.NoChildInvolvement,
    superseded: Boolean(policy?.supersededAtUtc),
    supersededAtUtc: policy?.supersededAtUtc
      ? policy.supersededAtUtc.toISOString().slice(0, 16)
      : '',
  };
}

export function volunteerRolePolicyVersionToDraft(
  roleName: string | undefined,
  version:
    | VolunteerRolePolicyVersion
    | VolunteerFamilyRolePolicyVersion
    | undefined,
  family: boolean
): VolunteerRolePolicyVersionDraft {
  const requirements = family
    ? (
        (version as VolunteerFamilyRolePolicyVersion | undefined)
          ?.requirements ?? []
      )
        .map(
          (requirement) =>
            `${enumName(RequirementStage, requirement.stage)}|${requirement.actionName}|${enumName(
              VolunteerFamilyRequirementScope,
              requirement.scope
            )}`
        )
        .join('\n')
    : ((version as VolunteerRolePolicyVersion | undefined)?.requirements ?? [])
        .map(
          (requirement) =>
            `${enumName(RequirementStage, requirement.stage)}|${requirement.actionName}`
        )
        .join('\n');

  return {
    roleName: roleName ?? '',
    version: version?.version ?? '',
    superseded: Boolean(version?.supersededAtUtc),
    supersededAtUtc: version?.supersededAtUtc
      ? version.supersededAtUtc.toISOString().slice(0, 16)
      : '',
    requirements,
  };
}

export function clonePolicyWithActionDefinition(
  policy: EffectiveLocationPolicy,
  previousName: string | undefined,
  actionName: string,
  action: ActionRequirement
) {
  const actionDefinitions = { ...(policy.actionDefinitions ?? {}) };
  if (previousName && previousName !== actionName) {
    delete actionDefinitions[previousName];
  }
  actionDefinitions[actionName] = action;
  return new EffectiveLocationPolicy({ ...policy, actionDefinitions });
}

export function clonePolicyWithCustomFamilyFields(
  policy: EffectiveLocationPolicy,
  fields: CustomField[]
) {
  return new EffectiveLocationPolicy({ ...policy, customFamilyFields: fields });
}

export function clonePolicyWithVolunteerCustomFields(
  policy: EffectiveLocationPolicy,
  fields: CustomField[]
) {
  return new EffectiveLocationPolicy({
    ...policy,
    volunteerPolicy: new VolunteerPolicy({
      ...policy.volunteerPolicy,
      customFields: fields,
    }),
  });
}

export function clonePolicyWithCasePolicy(
  policy: EffectiveLocationPolicy,
  casePolicy: V1CasePolicy
) {
  return new EffectiveLocationPolicy({ ...policy, referralPolicy: casePolicy });
}

export function clonePolicyWithV1ReferralPolicy(
  policy: EffectiveLocationPolicy,
  v1ReferralPolicy: V1ReferralPolicy
) {
  return new EffectiveLocationPolicy({ ...policy, v1ReferralPolicy });
}

export function clonePolicyWithVolunteerPolicy(
  policy: EffectiveLocationPolicy,
  volunteerPolicy: VolunteerPolicy
) {
  return new EffectiveLocationPolicy({ ...policy, volunteerPolicy });
}

export function upsertCustomField(
  fields: CustomField[] | undefined,
  previousName: string | undefined,
  field: CustomField
) {
  return [
    ...(fields ?? []).filter((existing) => existing.name !== previousName),
    field,
  ];
}

export function removeCustomField(fields: CustomField[] | undefined, name: string) {
  return (fields ?? []).filter((field) => field.name !== name);
}

export function upsertByName<T>(
  items: T[] | undefined,
  previousName: string | undefined,
  item: T,
  getName: (item: T) => string
) {
  return [
    ...(items ?? []).filter((existing) => getName(existing) !== previousName),
    item,
  ];
}

export function removeByName<T>(
  items: T[] | undefined,
  name: string,
  getName: (item: T) => string
) {
  return (items ?? []).filter((item) => getName(item) !== name);
}

export function nextCopyName(baseName: string, existingNames: string[]) {
  const copyName = `${baseName} Copy`;
  if (!existingNames.includes(copyName)) return copyName;

  let copyNumber = 2;
  while (existingNames.includes(`${copyName} ${copyNumber}`)) {
    copyNumber += 1;
  }

  return `${copyName} ${copyNumber}`;
}

export function parseRequirementStage(value: string): RequirementStage {
  if (value in RequirementStage) {
    return RequirementStage[
      value as keyof typeof RequirementStage
    ] as RequirementStage;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue)
    ? (numericValue as RequirementStage)
    : RequirementStage.Application;
}

export function parseVolunteerFamilyRequirementScope(
  value: string
): VolunteerFamilyRequirementScope {
  if (value in VolunteerFamilyRequirementScope) {
    return VolunteerFamilyRequirementScope[
      value as keyof typeof VolunteerFamilyRequirementScope
    ] as VolunteerFamilyRequirementScope;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue)
    ? (numericValue as VolunteerFamilyRequirementScope)
    : VolunteerFamilyRequirementScope.OncePerFamily;
}

export function parseVolunteerRequirements(value: string) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [stage, actionName] = line.split('|').map((part) => part.trim());
      return new VolunteerApprovalRequirement({
        stage: parseRequirementStage(stage),
        actionName,
      });
    })
    .filter((requirement) => Boolean(requirement.actionName));
}

export function parseVolunteerFamilyRequirements(value: string) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [stage, actionName, scope] = line
        .split('|')
        .map((part) => part.trim());
      return new VolunteerFamilyApprovalRequirement({
        stage: parseRequirementStage(stage),
        actionName,
        scope: parseVolunteerFamilyRequirementScope(scope),
      });
    })
    .filter((requirement) => Boolean(requirement.actionName));
}

export function upsertVolunteerRolePolicyVersion(
  volunteerPolicy: VolunteerPolicy | undefined,
  previousRoleName: string | undefined,
  previousVersion: string | undefined,
  roleName: string,
  version: VolunteerRolePolicyVersion
) {
  const volunteerRoles = { ...(volunteerPolicy?.volunteerRoles ?? {}) };
  if (previousRoleName && previousRoleName !== roleName) {
    const previousRole = volunteerRoles[previousRoleName];
    if (previousRole) {
      const remainingVersions = previousRole.policyVersions.filter(
        (item) => item.version !== previousVersion
      );
      if (remainingVersions.length === 0) {
        delete volunteerRoles[previousRoleName];
      } else {
        volunteerRoles[previousRoleName] = new VolunteerRolePolicy({
          ...previousRole,
          policyVersions: remainingVersions,
        });
      }
    }
  }

  const currentRole = volunteerRoles[roleName];
  volunteerRoles[roleName] = new VolunteerRolePolicy({
    volunteerRoleType: roleName,
    policyVersions: upsertByName(
      currentRole?.policyVersions ?? [],
      previousRoleName === roleName ? previousVersion : undefined,
      version,
      (item) => item.version
    ),
  });

  return new VolunteerPolicy({
    ...volunteerPolicy,
    volunteerRoles,
    volunteerFamilyRoles: volunteerPolicy?.volunteerFamilyRoles ?? {},
  });
}

export function upsertVolunteerFamilyRolePolicyVersion(
  volunteerPolicy: VolunteerPolicy | undefined,
  previousRoleName: string | undefined,
  previousVersion: string | undefined,
  roleName: string,
  version: VolunteerFamilyRolePolicyVersion
) {
  const volunteerFamilyRoles = {
    ...(volunteerPolicy?.volunteerFamilyRoles ?? {}),
  };
  if (previousRoleName && previousRoleName !== roleName) {
    const previousRole = volunteerFamilyRoles[previousRoleName];
    if (previousRole) {
      const remainingVersions = previousRole.policyVersions.filter(
        (item) => item.version !== previousVersion
      );
      if (remainingVersions.length === 0) {
        delete volunteerFamilyRoles[previousRoleName];
      } else {
        volunteerFamilyRoles[previousRoleName] = new VolunteerFamilyRolePolicy({
          ...previousRole,
          policyVersions: remainingVersions,
        });
      }
    }
  }

  const currentRole = volunteerFamilyRoles[roleName];
  volunteerFamilyRoles[roleName] = new VolunteerFamilyRolePolicy({
    volunteerFamilyRoleType: roleName,
    policyVersions: upsertByName(
      currentRole?.policyVersions ?? [],
      previousRoleName === roleName ? previousVersion : undefined,
      version,
      (item) => item.version
    ),
  });

  return new VolunteerPolicy({
    ...volunteerPolicy,
    volunteerRoles: volunteerPolicy?.volunteerRoles ?? {},
    volunteerFamilyRoles,
  });
}

export function removeVolunteerRolePolicyVersion(
  volunteerPolicy: VolunteerPolicy | undefined,
  roleName: string,
  versionName: string
) {
  const volunteerRoles = { ...(volunteerPolicy?.volunteerRoles ?? {}) };
  const rolePolicy = volunteerRoles[roleName];

  if (rolePolicy) {
    const remainingVersions = rolePolicy.policyVersions.filter(
      (version) => version.version !== versionName
    );

    if (remainingVersions.length === 0) {
      delete volunteerRoles[roleName];
    } else {
      volunteerRoles[roleName] = new VolunteerRolePolicy({
        ...rolePolicy,
        policyVersions: remainingVersions,
      });
    }
  }

  return new VolunteerPolicy({
    ...volunteerPolicy,
    volunteerRoles,
    volunteerFamilyRoles: volunteerPolicy?.volunteerFamilyRoles ?? {},
  });
}

export function removeVolunteerFamilyRolePolicyVersion(
  volunteerPolicy: VolunteerPolicy | undefined,
  roleName: string,
  versionName: string
) {
  const volunteerFamilyRoles = {
    ...(volunteerPolicy?.volunteerFamilyRoles ?? {}),
  };
  const rolePolicy = volunteerFamilyRoles[roleName];

  if (rolePolicy) {
    const remainingVersions = rolePolicy.policyVersions.filter(
      (version) => version.version !== versionName
    );

    if (remainingVersions.length === 0) {
      delete volunteerFamilyRoles[roleName];
    } else {
      volunteerFamilyRoles[roleName] = new VolunteerFamilyRolePolicy({
        ...rolePolicy,
        policyVersions: remainingVersions,
      });
    }
  }

  return new VolunteerPolicy({
    ...volunteerPolicy,
    volunteerRoles: volunteerPolicy?.volunteerRoles ?? {},
    volunteerFamilyRoles,
  });
}

