import {
  Add as AddIcon,
  ControlPointDuplicate as DuplicateIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Switch,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { ReactNode, useMemo, useState } from 'react';
import {
  ActionRequirement,
  ArrangementFunction,
  ArrangementPolicy,
  ChildInvolvement,
  CustomField,
  CustomFieldType,
  CustomFieldValidation,
  DocumentLinkRequirement,
  EffectiveLocationPolicy,
  FunctionAssignmentEligibility,
  FunctionAssignmentPolicy,
  FunctionEligibility,
  FunctionPolicy,
  FunctionRequirement,
  LocationConfiguration,
  MonitoringRequirement,
  NoteEntryRequirement,
  RecurrencePolicy,
  RequirementDefinition,
  RequirementStage,
  V1CasePolicy,
  V1ReferralPolicy,
  VolunteerApprovalRequirement,
  VolunteerFamilyApprovalRequirement,
  VolunteerFamilyRolePolicy,
  VolunteerFamilyRolePolicyVersion,
  VolunteerFamilyRequirementScope,
  VolunteerPolicy,
  VolunteerRolePolicy,
  VolunteerRolePolicyVersion,
} from '../../../GeneratedClient';
import { useSidePanel } from '../../../Hooks/useSidePanel';

type PolicyConfigurationProps = {
  policy: EffectiveLocationPolicy;
  locationRoles: string[];
  onPolicyChange: (policy: EffectiveLocationPolicy) => void;
  section:
    | 'actionDefinitions'
    | 'customFamilyFields'
    | 'casePolicy'
    | 'v1ReferralPolicy'
    | 'volunteerPolicy';
};

type ActionDefinitionDraft = {
  actionName: string;
  documentLink: DocumentLinkRequirement;
  noteEntry: NoteEntryRequirement;
  instructions: string;
  infoLink: string;
  validityEnabled: boolean;
  validityAmount: string;
  validityUnit: ValidityUnit;
  canView: string;
  canEdit: string;
  alternateNames: string;
};

type ValidityUnit = 'days' | 'months' | 'years';

type CustomFieldDraft = {
  name: string;
  type: CustomFieldType;
  validationEnabled: boolean;
  validValues: string;
};

type RequirementDraft = {
  actionName: string;
  isRequired: boolean;
};

type FunctionAssignmentPolicyDraft = {
  assignmentRole: string;
  eligibleLocationRoles: string;
  eligibleIndividualVolunteerRoles: string;
  eligibleVolunteerFamilyRoles: string;
  eligiblePeople: string;
};

type FunctionPolicyDraft = {
  functionName: string;
  eligibleIndividualVolunteerRoles: string;
  eligibleVolunteerFamilyRoles: string;
  eligiblePeople: string;
};

type ArrangementPolicyDraft = {
  arrangementType: string;
  childInvolvement: ChildInvolvement;
  superseded: boolean;
  supersededAtUtc: string;
};

type VolunteerRolePolicyVersionDraft = {
  roleName: string;
  version: string;
  superseded: boolean;
  supersededAtUtc: string;
  requirements: string;
};

type NamedPolicyReference = {
  area: string;
  owner: string;
};

const enumLabelOverrides = new Map<object, Record<string, string>>([
  [
    CustomFieldType,
    {
      String: 'Text',
      Boolean: 'Yes/No',
      StringArray: 'Suggestions',
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

function humanizeIdentifier(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
}

function enumName<T extends object>(enumType: T, value: unknown) {
  if (value === null || typeof value === 'undefined') return '-';
  const rawName = String(
    (enumType as Record<string, string | number>)[String(value)] ?? value
  );
  return (
    enumLabelOverrides.get(enumType)?.[rawName] ?? humanizeIdentifier(rawName)
  );
}

function enumOptions<T extends object>(enumType: T) {
  return Object.entries(enumType)
    .filter(([, value]) => typeof value === 'number')
    .map(([, value]) => ({
      label: enumName(enumType, value),
      value: value as number,
    }));
}

function formatDate(value?: Date) {
  return value ? value.toLocaleString() : 'Current';
}

function summarizeCount(
  count: number,
  singular: string,
  plural = `${singular}s`
) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function listText(items?: string[]) {
  if (!items || items.length === 0) return '-';
  return items.join(', ');
}

function splitCommaSeparated(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

const validityUnitDayMultipliers: Record<ValidityUnit, number> = {
  days: 1,
  months: 30,
  years: 365,
};

function validityUnitLabel(unit: ValidityUnit) {
  if (unit === 'days') return 'day';
  if (unit === 'months') return 'month';
  return 'year';
}

function normalizeValidityDays(
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

function parseValidity(
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

function parseValidityAmount(value: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0 || !Number.isInteger(amount)) {
    return undefined;
  }

  return amount;
}

function toTimeSpanString(
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

function formatValidity(value?: string) {
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

function actionToDraft(
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
    alternateNames: action?.alternateNames?.join(', ') ?? '',
  };
}

function customFieldToDraft(field?: CustomField): CustomFieldDraft {
  return {
    name: field?.name ?? '',
    type: field?.type ?? CustomFieldType.String,
    validationEnabled: typeof field?.validation !== 'undefined',
    validValues: field?.validValues?.join(', ') ?? '',
  };
}

function requirementToDraft(
  requirement?: RequirementDefinition
): RequirementDraft {
  return {
    actionName: requirement?.actionName ?? '',
    isRequired: requirement?.isRequired ?? true,
  };
}

function functionAssignmentPolicyToDraft(
  policy?: FunctionAssignmentPolicy
): FunctionAssignmentPolicyDraft {
  return {
    assignmentRole: policy?.assignmentRole ?? '',
    eligibleLocationRoles:
      policy?.eligibility?.eligibleLocationRoles?.join(', ') ?? '',
    eligibleIndividualVolunteerRoles:
      policy?.eligibility?.eligibleIndividualVolunteerRoles?.join(', ') ?? '',
    eligibleVolunteerFamilyRoles:
      policy?.eligibility?.eligibleVolunteerFamilyRoles?.join(', ') ?? '',
    eligiblePeople: policy?.eligibility?.eligiblePeople?.join(', ') ?? '',
  };
}

function functionPolicyToDraft(policy?: FunctionPolicy): FunctionPolicyDraft {
  return {
    functionName: policy?.functionName ?? '',
    eligibleIndividualVolunteerRoles:
      policy?.eligibility?.eligibleIndividualVolunteerRoles?.join(', ') ?? '',
    eligibleVolunteerFamilyRoles:
      policy?.eligibility?.eligibleVolunteerFamilyRoles?.join(', ') ?? '',
    eligiblePeople: policy?.eligibility?.eligiblePeople?.join(', ') ?? '',
  };
}

function arrangementPolicyToDraft(
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

function volunteerRolePolicyVersionToDraft(
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

function clonePolicyWithActionDefinition(
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

function clonePolicyWithCustomFamilyFields(
  policy: EffectiveLocationPolicy,
  fields: CustomField[]
) {
  return new EffectiveLocationPolicy({ ...policy, customFamilyFields: fields });
}

function clonePolicyWithVolunteerCustomFields(
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

function clonePolicyWithCasePolicy(
  policy: EffectiveLocationPolicy,
  casePolicy: V1CasePolicy
) {
  return new EffectiveLocationPolicy({ ...policy, referralPolicy: casePolicy });
}

function clonePolicyWithV1ReferralPolicy(
  policy: EffectiveLocationPolicy,
  v1ReferralPolicy: V1ReferralPolicy
) {
  return new EffectiveLocationPolicy({ ...policy, v1ReferralPolicy });
}

function clonePolicyWithVolunteerPolicy(
  policy: EffectiveLocationPolicy,
  volunteerPolicy: VolunteerPolicy
) {
  return new EffectiveLocationPolicy({ ...policy, volunteerPolicy });
}

function upsertCustomField(
  fields: CustomField[] | undefined,
  previousName: string | undefined,
  field: CustomField
) {
  return [
    ...(fields ?? []).filter((existing) => existing.name !== previousName),
    field,
  ];
}

function removeCustomField(fields: CustomField[] | undefined, name: string) {
  return (fields ?? []).filter((field) => field.name !== name);
}

function upsertByName<T>(
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

function removeByName<T>(
  items: T[] | undefined,
  name: string,
  getName: (item: T) => string
) {
  return (items ?? []).filter((item) => getName(item) !== name);
}

function nextCopyName(baseName: string, existingNames: string[]) {
  const copyName = `${baseName} Copy`;
  if (!existingNames.includes(copyName)) return copyName;

  let copyNumber = 2;
  while (existingNames.includes(`${copyName} ${copyNumber}`)) {
    copyNumber += 1;
  }

  return `${copyName} ${copyNumber}`;
}

function parseRequirementStage(value: string): RequirementStage {
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

function parseVolunteerFamilyRequirementScope(
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

function parseVolunteerRequirements(value: string) {
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

function parseVolunteerFamilyRequirements(value: string) {
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

function upsertVolunteerRolePolicyVersion(
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

function upsertVolunteerFamilyRolePolicyVersion(
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

function removeVolunteerRolePolicyVersion(
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

function removeVolunteerFamilyRolePolicyVersion(
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

function ValuesText({ values }: { values?: string[] }) {
  return <Typography variant="body2">{listText(values)}</Typography>;
}

function EditableActions({ onAdd }: { onAdd: () => void }) {
  return (
    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
      <Button
        size="small"
        variant="contained"
        startIcon={<AddIcon />}
        onClick={onAdd}
      >
        Add
      </Button>
    </Stack>
  );
}

function SectionHeader({
  title,
  children,
  actions,
}: {
  title: string;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <Stack spacing={1.5} sx={{ mb: 2 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="space-between"
      >
        <Typography variant="h6">{title}</Typography>
        {actions}
      </Stack>
      {children}
    </Stack>
  );
}

function EmptyRow({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      </TableCell>
    </TableRow>
  );
}

function ConfirmedRowAction({
  label,
  action,
  icon,
  title,
  message,
  onClick,
}: {
  label: string;
  action: string;
  icon: ReactNode;
  title: string;
  message: string;
  onClick: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  function closeDialog() {
    setConfirming(false);
  }

  function confirmDuplicate() {
    onClick();
    closeDialog();
  }

  return (
    <>
      <Tooltip title={action}>
        <IconButton
          size="small"
          aria-label={`${action} ${label}`}
          onClick={(event) => {
            event.stopPropagation();
            setConfirming(true);
          }}
        >
          {icon}
        </IconButton>
      </Tooltip>

      <Dialog
        open={confirming}
        onClose={closeDialog}
        onClick={(event) => event.stopPropagation()}
      >
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <DialogContentText>{message}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>No</Button>
          <Button variant="contained" onClick={confirmDuplicate}>
            Yes
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function DuplicateRowAction({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <ConfirmedRowAction
      label={label}
      action="Duplicate"
      icon={<DuplicateIcon fontSize="small" />}
      title={`Duplicate ${label}?`}
      message={`Are you sure you want to duplicate ${label}?`}
      onClick={onClick}
    />
  );
}

function DeleteRowAction({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <ConfirmedRowAction
      label={label}
      action="Delete"
      icon={<DeleteIcon fontSize="small" />}
      title={`Delete ${label}?`}
      message={`Are you sure you want to delete ${label}?`}
      onClick={onClick}
    />
  );
}

function getRequirementUsage(policy: EffectiveLocationPolicy) {
  const references = new Map<string, NamedPolicyReference[]>();

  const addReference = (
    actionName: string | undefined,
    area: string,
    owner: string
  ) => {
    if (!actionName) return;
    references.set(actionName, [
      ...(references.get(actionName) ?? []),
      { area, owner },
    ]);
  };

  policy.referralPolicy?.intakeRequirements?.forEach((requirement) =>
    addReference(
      requirement.actionName,
      'CasePolicy.IntakeRequirements',
      'CasePolicy'
    )
  );

  policy.referralPolicy?.arrangementPolicies?.forEach((arrangement) => {
    const owner = arrangement.arrangementType;

    arrangement.requiredSetupActions?.forEach((requirement) =>
      addReference(
        requirement.actionName,
        'CasePolicy.ArrangementPolicies.RequiredSetupActions',
        owner
      )
    );
    arrangement.requiredMonitoringActionsNew?.forEach((requirement) =>
      addReference(
        requirement.action?.actionName,
        'CasePolicy.ArrangementPolicies.RequiredMonitoringActions',
        owner
      )
    );
    arrangement.requiredCloseoutActions?.forEach((requirement) =>
      addReference(
        requirement.actionName,
        'CasePolicy.ArrangementPolicies.RequiredCloseoutActions',
        owner
      )
    );

    arrangement.arrangementFunctions?.forEach((arrangementFunction) => {
      arrangementFunction.variants?.forEach((variant) => {
        const variantOwner = `${owner} / ${arrangementFunction.functionName} / ${variant.variantName}`;
        variant.requiredSetupActions?.forEach((requirement) =>
          addReference(
            requirement.actionName,
            'CasePolicy.ArrangementFunctionVariant.RequiredSetupActions',
            variantOwner
          )
        );
        variant.requiredMonitoringActionsNew?.forEach((requirement) =>
          addReference(
            requirement.action?.actionName,
            'CasePolicy.ArrangementFunctionVariant.RequiredMonitoringActions',
            variantOwner
          )
        );
        variant.requiredCloseoutActions?.forEach((requirement) =>
          addReference(
            requirement.actionName,
            'CasePolicy.ArrangementFunctionVariant.RequiredCloseoutActions',
            variantOwner
          )
        );
      });
    });
  });

  Object.entries(policy.volunteerPolicy?.volunteerRoles ?? {}).forEach(
    ([roleName, rolePolicy]) => {
      rolePolicy.policyVersions?.forEach((version) => {
        version.requirements?.forEach((requirement) =>
          addReference(
            requirement.actionName,
            'VolunteerPolicy.VolunteerRoles.Requirements',
            `${roleName} ${version.version}`
          )
        );
      });
    }
  );

  Object.entries(policy.volunteerPolicy?.volunteerFamilyRoles ?? {}).forEach(
    ([roleName, rolePolicy]) => {
      rolePolicy.policyVersions?.forEach((version) => {
        version.requirements?.forEach((requirement) =>
          addReference(
            requirement.actionName,
            'VolunteerPolicy.VolunteerFamilyRoles.Requirements',
            `${roleName} ${version.version}`
          )
        );
      });
    }
  );

  return references;
}

function EligibilitySummary({
  eligibility,
}: {
  eligibility?: FunctionEligibility | FunctionAssignmentEligibility;
}) {
  if (!eligibility) return <Typography variant="body2">-</Typography>;

  const locationRoles =
    'eligibleLocationRoles' in eligibility
      ? eligibility.eligibleLocationRoles
      : undefined;

  return (
    <Stack spacing={0.5}>
      {locationRoles && (
        <Typography variant="body2">
          Location Roles: {listText(locationRoles)}
        </Typography>
      )}
      <Typography variant="body2">
        Individual Volunteer Roles:{' '}
        {listText(eligibility.eligibleIndividualVolunteerRoles)}
      </Typography>
      <Typography variant="body2">
        Volunteer Family Roles:{' '}
        {listText(eligibility.eligibleVolunteerFamilyRoles)}
      </Typography>
      <Typography variant="body2">
        Eligible People:{' '}
        {summarizeCount(
          eligibility.eligiblePeople?.length ?? 0,
          'person',
          'people'
        )}
      </Typography>
    </Stack>
  );
}

function FunctionAssignmentPoliciesTable({
  policies,
  emptyLabel,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  policies?: FunctionAssignmentPolicy[];
  emptyLabel: string;
  onEdit?: (policy: FunctionAssignmentPolicy) => void;
  onDuplicate?: (policy: FunctionAssignmentPolicy) => void;
  onDelete?: (policy: FunctionAssignmentPolicy) => void;
}) {
  const rows = policies ?? [];
  const hasActions = Boolean(onDuplicate || onDelete);

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Assignment Role</TableCell>
            <TableCell>Eligibility</TableCell>
            {hasActions && <TableCell align="right">Actions</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <EmptyRow colSpan={hasActions ? 3 : 2} label={emptyLabel} />
          ) : (
            rows.map((policy) => (
              <TableRow
                key={policy.assignmentRole}
                hover={Boolean(onEdit)}
                sx={onEdit ? { cursor: 'pointer' } : undefined}
                onClick={() => onEdit?.(policy)}
              >
                <TableCell>{policy.assignmentRole}</TableCell>
                <TableCell>
                  <EligibilitySummary eligibility={policy.eligibility} />
                </TableCell>
                {hasActions && (
                  <TableCell align="right">
                    <Stack
                      direction="row"
                      justifyContent="flex-end"
                      spacing={0.5}
                    >
                      {onDuplicate && (
                        <DuplicateRowAction
                          label={policy.assignmentRole}
                          onClick={() => onDuplicate(policy)}
                        />
                      )}
                      {onDelete && (
                        <DeleteRowAction
                          label={policy.assignmentRole}
                          onClick={() => onDelete(policy)}
                        />
                      )}
                    </Stack>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function RecurrenceSummary({ recurrence }: { recurrence?: RecurrencePolicy }) {
  if (!recurrence) return <Typography variant="body2">-</Typography>;

  const data = recurrence.toJSON();
  const discriminator = data.discriminator ?? recurrence.constructor.name;

  if ('stages' in data && Array.isArray(data.stages)) {
    return (
      <Stack spacing={0.5}>
        <Typography variant="body2">{discriminator}</Typography>
        <Typography variant="body2" color="text.secondary">
          {data.stages
            .map(
              (
                stage: { delay?: string; maxOccurrences?: number },
                index: number
              ) =>
                `${index + 1}: ${stage.delay ?? 'no delay'}, ${
                  typeof stage.maxOccurrences === 'undefined'
                    ? 'unlimited'
                    : `${stage.maxOccurrences} occurrence(s)`
                }`
            )
            .join(' | ')}
        </Typography>
      </Stack>
    );
  }

  return (
    <Typography variant="body2">
      {discriminator}
      {data.delay ? `, delay ${data.delay}` : ''}
    </Typography>
  );
}

function RequirementsTable({
  requirements,
  emptyLabel,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  requirements?: RequirementDefinition[];
  emptyLabel: string;
  onEdit?: (requirement: RequirementDefinition) => void;
  onDuplicate?: (requirement: RequirementDefinition) => void;
  onDelete?: (requirement: RequirementDefinition) => void;
}) {
  const rows = requirements ?? [];
  const hasActions = Boolean(onDuplicate || onDelete);

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Action Name</TableCell>
            <TableCell>Required</TableCell>
            {hasActions && <TableCell align="right">Actions</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <EmptyRow colSpan={hasActions ? 3 : 2} label={emptyLabel} />
          ) : (
            rows.map((requirement) => (
              <TableRow
                key={requirement.actionName}
                hover={Boolean(onEdit)}
                sx={onEdit ? { cursor: 'pointer' } : undefined}
                onClick={() => onEdit?.(requirement)}
              >
                <TableCell>{requirement.actionName}</TableCell>
                <TableCell>{requirement.isRequired ? 'Yes' : 'No'}</TableCell>
                {hasActions && (
                  <TableCell align="right">
                    <Stack
                      direction="row"
                      justifyContent="flex-end"
                      spacing={0.5}
                    >
                      {onDuplicate && (
                        <DuplicateRowAction
                          label={requirement.actionName}
                          onClick={() => onDuplicate(requirement)}
                        />
                      )}
                      {onDelete && (
                        <DeleteRowAction
                          label={requirement.actionName}
                          onClick={() => onDelete(requirement)}
                        />
                      )}
                    </Stack>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function MonitoringRequirementsTable({
  requirements,
}: {
  requirements?: MonitoringRequirement[];
}) {
  const rows = requirements ?? [];

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Action Name</TableCell>
            <TableCell>Required</TableCell>
            <TableCell>Recurrence</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <EmptyRow
              colSpan={3}
              label="No monitoring requirements configured."
            />
          ) : (
            rows.map((requirement, index) => (
              <TableRow key={`${requirement.action?.actionName}-${index}`}>
                <TableCell>{requirement.action?.actionName}</TableCell>
                <TableCell>
                  {requirement.action?.isRequired ? 'Yes' : 'No'}
                </TableCell>
                <TableCell>
                  <RecurrenceSummary recurrence={requirement.recurrence} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function ActionDefinitionSidePanel({
  actionName,
  action,
  existingActionNames,
  onClose,
  onSave,
}: {
  actionName?: string;
  action?: ActionRequirement;
  existingActionNames: string[];
  onClose: () => void;
  onSave: (
    previousName: string | undefined,
    actionName: string,
    action: ActionRequirement
  ) => void;
}) {
  const [draft, setDraft] = useState<ActionDefinitionDraft>(() =>
    actionToDraft(actionName, action)
  );

  const trimmedName = draft.actionName.trim();
  const duplicateName =
    trimmedName.length > 0 &&
    trimmedName !== actionName &&
    existingActionNames.includes(trimmedName);
  const alternateNames = splitCommaSeparated(draft.alternateNames);
  const validityAmountIsValid =
    !draft.validityEnabled ||
    typeof parseValidityAmount(draft.validityAmount) !== 'undefined';
  const canSave =
    trimmedName.length > 0 &&
    !duplicateName &&
    validityAmountIsValid;

  function save() {
    if (!canSave) return;

    onSave(
      actionName,
      trimmedName,
      new ActionRequirement({
        documentLink: draft.documentLink,
        noteEntry: draft.noteEntry,
        instructions: draft.instructions.trim() || undefined,
        infoLink: draft.infoLink.trim() || undefined,
        validity: toTimeSpanString(
          draft.validityEnabled,
          draft.validityAmount,
          draft.validityUnit
        ),
        canView: draft.canView.trim() || undefined,
        canEdit: draft.canEdit.trim() || undefined,
        alternateNames: alternateNames.length > 0 ? alternateNames : undefined,
      })
    );
  }

  return (
    <Grid
      container
      spacing={2}
      maxWidth={520}
      component="form"
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <Grid item xs={12}>
        <Typography variant="h6">
          {actionName ? 'Edit Action Definition' : 'Add Action Definition'}
        </Typography>
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          required
          autoFocus
          label="Action Name"
          value={draft.actionName}
          error={duplicateName}
          helperText={duplicateName ? 'Action name must be unique.' : undefined}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              actionName: event.target.value,
            }))
          }
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          select
          label="Document Link"
          value={draft.documentLink}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              documentLink: Number(
                event.target.value
              ) as DocumentLinkRequirement,
            }))
          }
        >
          {enumOptions(DocumentLinkRequirement).map((option) => (
            <MenuItem key={option.label} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          select
          label="Note Entry"
          value={draft.noteEntry}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              noteEntry: Number(event.target.value) as NoteEntryRequirement,
            }))
          }
        >
          {enumOptions(NoteEntryRequirement).map((option) => (
            <MenuItem key={option.label} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          multiline
          minRows={3}
          label="Instructions"
          value={draft.instructions}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              instructions: event.target.value,
            }))
          }
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Info Link"
          value={draft.infoLink}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              infoLink: event.target.value,
            }))
          }
        />
      </Grid>

      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={draft.validityEnabled}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  validityEnabled: event.target.checked,
                }))
              }
            />
          }
          label="Validity"
        />
      </Grid>

      {draft.validityEnabled && (
        <>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Valid For"
              value={draft.validityAmount}
              error={!validityAmountIsValid}
              helperText={
                validityAmountIsValid
                  ? undefined
                  : 'Enter a positive whole number.'
              }
              inputProps={{ inputMode: 'numeric' }}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  validityAmount: event.target.value,
                }))
              }
            />
          </Grid>

          <Grid item xs={6}>
            <TextField
              fullWidth
              select
              label="Time Period"
              value={draft.validityUnit}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  validityUnit: event.target
                    .value as ActionDefinitionDraft['validityUnit'],
                }))
              }
            >
              <MenuItem value="days">Days</MenuItem>
              <MenuItem value="months">Months</MenuItem>
              <MenuItem value="years">Years</MenuItem>
            </TextField>
          </Grid>
        </>
      )}

      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Alternate Names"
          value={draft.alternateNames}
          helperText="Comma-separated aliases."
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              alternateNames: event.target.value,
            }))
          }
        />
      </Grid>

      <Grid item xs={12} sx={{ textAlign: 'right' }}>
        <Button
          variant="contained"
          color="secondary"
          sx={{ mr: 2 }}
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={!canSave}>
          Save
        </Button>
      </Grid>
    </Grid>
  );
}

function CustomFieldSidePanel({
  title,
  field,
  existingNames,
  onClose,
  onSave,
}: {
  title: string;
  field?: CustomField;
  existingNames: string[];
  onClose: () => void;
  onSave: (previousName: string | undefined, field: CustomField) => void;
}) {
  const [draft, setDraft] = useState<CustomFieldDraft>(() =>
    customFieldToDraft(field)
  );
  const trimmedName = draft.name.trim();
  const duplicateName =
    trimmedName.length > 0 &&
    trimmedName !== field?.name &&
    existingNames.includes(trimmedName);
  const validValues = splitCommaSeparated(draft.validValues);
  const canSave = trimmedName.length > 0 && !duplicateName;

  function save() {
    if (!canSave) return;

    onSave(
      field?.name,
      new CustomField({
        name: trimmedName,
        type: draft.type,
        validation: draft.validationEnabled
          ? CustomFieldValidation.SuggestOnly
          : undefined,
        validValues:
          draft.type === CustomFieldType.Boolean || validValues.length === 0
            ? undefined
            : validValues,
      })
    );
  }

  return (
    <Grid
      container
      spacing={2}
      maxWidth={520}
      component="form"
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <Grid item xs={12}>
        <Typography variant="h6">{title}</Typography>
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          required
          autoFocus
          label="Name"
          value={draft.name}
          error={duplicateName}
          helperText={duplicateName ? 'Name must be unique.' : undefined}
          onChange={(event) =>
            setDraft((current) => ({ ...current, name: event.target.value }))
          }
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          select
          label="Type"
          value={draft.type}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              type: Number(event.target.value) as CustomFieldType,
              validationEnabled:
                Number(event.target.value) === CustomFieldType.Boolean
                  ? false
                  : current.validationEnabled,
              validValues:
                Number(event.target.value) === CustomFieldType.Boolean
                  ? ''
                  : current.validValues,
            }))
          }
        >
          {enumOptions(CustomFieldType).map((option) => (
            <MenuItem key={option.label} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      </Grid>

      {draft.type !== CustomFieldType.Boolean && (
        <>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={draft.validationEnabled}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      validationEnabled: event.target.checked,
                    }))
                  }
                />
              }
              label="Suggestions Only"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Valid Values"
              value={draft.validValues}
              helperText="Comma-separated values."
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  validValues: event.target.value,
                }))
              }
            />
          </Grid>
        </>
      )}

      <Grid item xs={12} sx={{ textAlign: 'right' }}>
        <Button
          variant="contained"
          color="secondary"
          sx={{ mr: 2 }}
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={!canSave}>
          Save
        </Button>
      </Grid>
    </Grid>
  );
}

function RequirementSidePanel({
  title,
  requirement,
  actionNames,
  existingActionNames,
  onClose,
  onSave,
}: {
  title: string;
  requirement?: RequirementDefinition;
  actionNames: string[];
  existingActionNames: string[];
  onClose: () => void;
  onSave: (
    previousName: string | undefined,
    requirement: RequirementDefinition
  ) => void;
}) {
  const [draft, setDraft] = useState<RequirementDraft>(() =>
    requirementToDraft(requirement)
  );
  const trimmedActionName = draft.actionName.trim();
  const duplicateName =
    trimmedActionName.length > 0 &&
    trimmedActionName !== requirement?.actionName &&
    existingActionNames.includes(trimmedActionName);
  const unknownActionName =
    trimmedActionName.length > 0 && !actionNames.includes(trimmedActionName);
  const canSave =
    trimmedActionName.length > 0 && !duplicateName && !unknownActionName;

  function save() {
    if (!canSave) return;
    onSave(
      requirement?.actionName,
      new RequirementDefinition({
        actionName: trimmedActionName,
        isRequired: draft.isRequired,
      })
    );
  }

  return (
    <Grid
      container
      spacing={2}
      maxWidth={520}
      component="form"
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <Grid item xs={12}>
        <Typography variant="h6">{title}</Typography>
      </Grid>

      <Grid item xs={12}>
        <Autocomplete
          fullWidth
          options={actionNames}
          value={draft.actionName || null}
          onChange={(_, value) =>
            setDraft((current) => ({ ...current, actionName: value ?? '' }))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              required
              label="Action Name"
              error={duplicateName || unknownActionName}
              helperText={
                duplicateName
                  ? 'Action name is already referenced in this list.'
                  : unknownActionName
                    ? 'Action name must exist in Action Definitions.'
                    : undefined
              }
            />
          )}
        />
      </Grid>

      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={draft.isRequired}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  isRequired: event.target.checked,
                }))
              }
            />
          }
          label="Required"
        />
      </Grid>

      <Grid item xs={12} sx={{ textAlign: 'right' }}>
        <Button
          variant="contained"
          color="secondary"
          sx={{ mr: 2 }}
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={!canSave}>
          Save
        </Button>
      </Grid>
    </Grid>
  );
}

function FunctionAssignmentPolicySidePanel({
  title,
  policy,
  existingAssignmentRoles,
  locationRoles,
  volunteerRoles,
  volunteerFamilyRoles,
  onClose,
  onSave,
}: {
  title: string;
  policy?: FunctionAssignmentPolicy;
  existingAssignmentRoles: string[];
  locationRoles: string[];
  volunteerRoles: string[];
  volunteerFamilyRoles: string[];
  onClose: () => void;
  onSave: (
    previousRole: string | undefined,
    policy: FunctionAssignmentPolicy
  ) => void;
}) {
  const [draft, setDraft] = useState<FunctionAssignmentPolicyDraft>(() =>
    functionAssignmentPolicyToDraft(policy)
  );
  const trimmedRole = draft.assignmentRole.trim();
  const duplicateRole =
    trimmedRole.length > 0 &&
    trimmedRole !== policy?.assignmentRole &&
    existingAssignmentRoles.includes(trimmedRole);
  const eligibleLocationRoles = splitCommaSeparated(
    draft.eligibleLocationRoles
  );
  const eligibleIndividualVolunteerRoles = splitCommaSeparated(
    draft.eligibleIndividualVolunteerRoles
  );
  const eligibleVolunteerFamilyRoles = splitCommaSeparated(
    draft.eligibleVolunteerFamilyRoles
  );
  const eligiblePeople = splitCommaSeparated(draft.eligiblePeople);
  const unknownLocationRoles = eligibleLocationRoles.filter(
    (role) => !locationRoles.includes(role)
  );
  const unknownVolunteerRoles = eligibleIndividualVolunteerRoles.filter(
    (role) => !volunteerRoles.includes(role)
  );
  const unknownVolunteerFamilyRoles = eligibleVolunteerFamilyRoles.filter(
    (role) => !volunteerFamilyRoles.includes(role)
  );
  const hasEligibility =
    eligibleLocationRoles.length +
      eligibleIndividualVolunteerRoles.length +
      eligibleVolunteerFamilyRoles.length +
      eligiblePeople.length >
    0;
  const canSave =
    trimmedRole.length > 0 &&
    !duplicateRole &&
    hasEligibility &&
    unknownLocationRoles.length === 0 &&
    unknownVolunteerRoles.length === 0 &&
    unknownVolunteerFamilyRoles.length === 0;

  function save() {
    if (!canSave) return;

    onSave(
      policy?.assignmentRole,
      new FunctionAssignmentPolicy({
        assignmentRole: trimmedRole,
        eligibility: new FunctionAssignmentEligibility({
          eligibleLocationRoles,
          eligibleIndividualVolunteerRoles,
          eligibleVolunteerFamilyRoles,
          eligiblePeople,
        }),
      })
    );
  }

  return (
    <Grid
      container
      spacing={2}
      maxWidth={560}
      component="form"
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <Grid item xs={12}>
        <Typography variant="h6">{title}</Typography>
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          required
          label="Assignment Role"
          value={draft.assignmentRole}
          error={duplicateRole}
          helperText={
            duplicateRole ? 'Assignment role must be unique.' : undefined
          }
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              assignmentRole: event.target.value,
            }))
          }
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Eligible Location Roles"
          value={draft.eligibleLocationRoles}
          error={unknownLocationRoles.length > 0}
          helperText={
            unknownLocationRoles.length > 0
              ? `Unknown roles: ${unknownLocationRoles.join(', ')}`
              : 'Comma-separated configured organization role names.'
          }
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              eligibleLocationRoles: event.target.value,
            }))
          }
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Eligible Individual Volunteer Roles"
          value={draft.eligibleIndividualVolunteerRoles}
          error={unknownVolunteerRoles.length > 0}
          helperText={
            unknownVolunteerRoles.length > 0
              ? `Unknown roles: ${unknownVolunteerRoles.join(', ')}`
              : 'Comma-separated volunteer role names from Volunteer Policies > Volunteer Roles.'
          }
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              eligibleIndividualVolunteerRoles: event.target.value,
            }))
          }
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Eligible Volunteer Family Roles"
          value={draft.eligibleVolunteerFamilyRoles}
          error={unknownVolunteerFamilyRoles.length > 0}
          helperText={
            unknownVolunteerFamilyRoles.length > 0
              ? `Unknown roles: ${unknownVolunteerFamilyRoles.join(', ')}`
              : 'Comma-separated family role names from Volunteer Policies > Volunteer Family Roles.'
          }
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              eligibleVolunteerFamilyRoles: event.target.value,
            }))
          }
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Eligible People"
          value={draft.eligiblePeople}
          helperText="Comma-separated person IDs."
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              eligiblePeople: event.target.value,
            }))
          }
        />
      </Grid>

      {!hasEligibility && (
        <Grid item xs={12}>
          <Typography variant="body2" color="error">
            At least one eligibility dimension is required.
          </Typography>
        </Grid>
      )}

      <Grid item xs={12} sx={{ textAlign: 'right' }}>
        <Button
          variant="contained"
          color="secondary"
          sx={{ mr: 2 }}
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={!canSave}>
          Save
        </Button>
      </Grid>
    </Grid>
  );
}

function FunctionPolicySidePanel({
  policy,
  existingFunctionNames,
  volunteerRoles,
  volunteerFamilyRoles,
  onClose,
  onSave,
}: {
  policy?: FunctionPolicy;
  existingFunctionNames: string[];
  volunteerRoles: string[];
  volunteerFamilyRoles: string[];
  onClose: () => void;
  onSave: (previousName: string | undefined, policy: FunctionPolicy) => void;
}) {
  const [draft, setDraft] = useState<FunctionPolicyDraft>(() =>
    functionPolicyToDraft(policy)
  );
  const trimmedName = draft.functionName.trim();
  const duplicateName =
    trimmedName.length > 0 &&
    trimmedName !== policy?.functionName &&
    existingFunctionNames.includes(trimmedName);
  const eligibleIndividualVolunteerRoles = splitCommaSeparated(
    draft.eligibleIndividualVolunteerRoles
  );
  const eligibleVolunteerFamilyRoles = splitCommaSeparated(
    draft.eligibleVolunteerFamilyRoles
  );
  const eligiblePeople = splitCommaSeparated(draft.eligiblePeople);
  const unknownVolunteerRoles = eligibleIndividualVolunteerRoles.filter(
    (role) => !volunteerRoles.includes(role)
  );
  const unknownVolunteerFamilyRoles = eligibleVolunteerFamilyRoles.filter(
    (role) => !volunteerFamilyRoles.includes(role)
  );
  const canSave =
    trimmedName.length > 0 &&
    !duplicateName &&
    unknownVolunteerRoles.length === 0 &&
    unknownVolunteerFamilyRoles.length === 0;

  function save() {
    if (!canSave) return;
    onSave(
      policy?.functionName,
      new FunctionPolicy({
        functionName: trimmedName,
        eligibility: new FunctionEligibility({
          eligibleIndividualVolunteerRoles,
          eligibleVolunteerFamilyRoles,
          eligiblePeople,
        }),
      })
    );
  }

  return (
    <Grid
      container
      spacing={2}
      maxWidth={560}
      component="form"
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <Grid item xs={12}>
        <Typography variant="h6">
          {policy ? 'Edit Function Policy' : 'Add Function Policy'}
        </Typography>
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          required
          label="Function Name"
          value={draft.functionName}
          error={duplicateName}
          helperText={
            duplicateName ? 'Function name must be unique.' : undefined
          }
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              functionName: event.target.value,
            }))
          }
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Eligible Individual Volunteer Roles"
          value={draft.eligibleIndividualVolunteerRoles}
          error={unknownVolunteerRoles.length > 0}
          helperText={
            unknownVolunteerRoles.length > 0
              ? `Unknown roles: ${unknownVolunteerRoles.join(', ')}`
              : 'Comma-separated volunteer role names from Volunteer Policies > Volunteer Roles.'
          }
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              eligibleIndividualVolunteerRoles: event.target.value,
            }))
          }
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Eligible Volunteer Family Roles"
          value={draft.eligibleVolunteerFamilyRoles}
          error={unknownVolunteerFamilyRoles.length > 0}
          helperText={
            unknownVolunteerFamilyRoles.length > 0
              ? `Unknown roles: ${unknownVolunteerFamilyRoles.join(', ')}`
              : 'Comma-separated family role names from Volunteer Policies > Volunteer Family Roles.'
          }
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              eligibleVolunteerFamilyRoles: event.target.value,
            }))
          }
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Eligible People"
          value={draft.eligiblePeople}
          helperText="Comma-separated person IDs."
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              eligiblePeople: event.target.value,
            }))
          }
        />
      </Grid>

      <Grid item xs={12} sx={{ textAlign: 'right' }}>
        <Button
          variant="contained"
          color="secondary"
          sx={{ mr: 2 }}
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={!canSave}>
          Save
        </Button>
      </Grid>
    </Grid>
  );
}

function ArrangementPolicySidePanel({
  arrangement,
  existingArrangementTypes,
  onClose,
  onSave,
}: {
  arrangement?: ArrangementPolicy;
  existingArrangementTypes: string[];
  onClose: () => void;
  onSave: (
    previousType: string | undefined,
    arrangement: ArrangementPolicy
  ) => void;
}) {
  const [draft, setDraft] = useState<ArrangementPolicyDraft>(() =>
    arrangementPolicyToDraft(arrangement)
  );
  const trimmedType = draft.arrangementType.trim();
  const duplicateType =
    trimmedType.length > 0 &&
    trimmedType !== arrangement?.arrangementType &&
    existingArrangementTypes.includes(trimmedType);
  const canSave = trimmedType.length > 0 && !duplicateType;

  function save() {
    if (!canSave) return;

    onSave(
      arrangement?.arrangementType,
      new ArrangementPolicy({
        requiredSetupActions_PRE_MIGRATION:
          arrangement?.requiredSetupActions_PRE_MIGRATION ?? [],
        requiredMonitoringActions_PRE_MIGRATION:
          arrangement?.requiredMonitoringActions_PRE_MIGRATION ?? [],
        requiredCloseoutActionNames_PRE_MIGRATION:
          arrangement?.requiredCloseoutActionNames_PRE_MIGRATION ?? [],
        arrangementType: trimmedType,
        childInvolvement: draft.childInvolvement,
        arrangementFunctions: arrangement?.arrangementFunctions ?? [],
        requiredSetupActionNames: arrangement?.requiredSetupActionNames ?? [],
        requiredMonitoringActions: arrangement?.requiredMonitoringActions ?? [],
        requiredCloseoutActionNames:
          arrangement?.requiredCloseoutActionNames ?? [],
        requiredSetupActions: arrangement?.requiredSetupActions ?? [],
        requiredMonitoringActionsNew:
          arrangement?.requiredMonitoringActionsNew ?? [],
        requiredCloseoutActions: arrangement?.requiredCloseoutActions ?? [],
        supersededAtUtc:
          draft.superseded && draft.supersededAtUtc
            ? new Date(draft.supersededAtUtc)
            : undefined,
      })
    );
  }

  return (
    <Grid
      container
      spacing={2}
      maxWidth={560}
      component="form"
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <Grid item xs={12}>
        <Typography variant="h6">
          {arrangement ? 'Edit Arrangement Policy' : 'Add Arrangement Policy'}
        </Typography>
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          required
          label="Arrangement Type"
          value={draft.arrangementType}
          error={duplicateType}
          helperText={
            duplicateType ? 'Arrangement type must be unique.' : undefined
          }
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              arrangementType: event.target.value,
            }))
          }
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          select
          label="Child Involvement"
          value={draft.childInvolvement}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              childInvolvement: Number(event.target.value) as ChildInvolvement,
            }))
          }
        >
          {enumOptions(ChildInvolvement).map((option) => (
            <MenuItem key={option.label} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      </Grid>

      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={draft.superseded}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  superseded: event.target.checked,
                }))
              }
            />
          }
          label="Superseded"
        />
      </Grid>

      {draft.superseded && (
        <Grid item xs={12}>
          <TextField
            fullWidth
            type="datetime-local"
            label="Superseded Date"
            value={draft.supersededAtUtc}
            InputLabelProps={{ shrink: true }}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                supersededAtUtc: event.target.value,
              }))
            }
          />
        </Grid>
      )}

      <Grid item xs={12} sx={{ textAlign: 'right' }}>
        <Button
          variant="contained"
          color="secondary"
          sx={{ mr: 2 }}
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={!canSave}>
          Save
        </Button>
      </Grid>
    </Grid>
  );
}

function VolunteerRolePolicyVersionSidePanel({
  title,
  roleName,
  version,
  existingRoleNames,
  existingVersionsForRole,
  family,
  actionNames,
  onClose,
  onSave,
}: {
  title: string;
  roleName?: string;
  version?: VolunteerRolePolicyVersion | VolunteerFamilyRolePolicyVersion;
  existingRoleNames: string[];
  existingVersionsForRole: string[];
  family: boolean;
  actionNames: string[];
  onClose: () => void;
  onSave: (
    previousRoleName: string | undefined,
    previousVersion: string | undefined,
    roleName: string,
    version: VolunteerRolePolicyVersion | VolunteerFamilyRolePolicyVersion
  ) => void;
}) {
  const [draft, setDraft] = useState<VolunteerRolePolicyVersionDraft>(() =>
    volunteerRolePolicyVersionToDraft(roleName, version, family)
  );
  const trimmedRoleName = draft.roleName.trim();
  const trimmedVersion = draft.version.trim();
  const requirements = family
    ? parseVolunteerFamilyRequirements(draft.requirements)
    : parseVolunteerRequirements(draft.requirements);
  const referencedActions = requirements.map(
    (requirement) => requirement.actionName
  );
  const unknownActions = referencedActions.filter(
    (actionName) => !actionNames.includes(actionName)
  );
  const duplicateVersion =
    trimmedVersion.length > 0 &&
    (trimmedRoleName !== roleName || trimmedVersion !== version?.version) &&
    existingVersionsForRole.includes(trimmedVersion);
  const canSave =
    trimmedRoleName.length > 0 &&
    trimmedVersion.length > 0 &&
    !duplicateVersion &&
    unknownActions.length === 0;

  function save() {
    if (!canSave) return;

    onSave(
      roleName,
      version?.version,
      trimmedRoleName,
      family
        ? new VolunteerFamilyRolePolicyVersion({
            version: trimmedVersion,
            supersededAtUtc:
              draft.superseded && draft.supersededAtUtc
                ? new Date(draft.supersededAtUtc)
                : undefined,
            requirements: requirements as VolunteerFamilyApprovalRequirement[],
          })
        : new VolunteerRolePolicyVersion({
            version: trimmedVersion,
            supersededAtUtc:
              draft.superseded && draft.supersededAtUtc
                ? new Date(draft.supersededAtUtc)
                : undefined,
            requirements: requirements as VolunteerApprovalRequirement[],
          })
    );
  }

  return (
    <Grid
      container
      spacing={2}
      maxWidth={580}
      component="form"
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <Grid item xs={12}>
        <Typography variant="h6">{title}</Typography>
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          required
          label={family ? 'Volunteer Family Role Type' : 'Volunteer Role Type'}
          value={draft.roleName}
          helperText={
            existingRoleNames.includes(trimmedRoleName)
              ? 'Editing an existing role policy.'
              : 'A new role policy will be created.'
          }
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              roleName: event.target.value,
            }))
          }
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          required
          label="Version"
          value={draft.version}
          error={duplicateVersion}
          helperText={
            duplicateVersion
              ? 'Version must be unique for this role.'
              : undefined
          }
          onChange={(event) =>
            setDraft((current) => ({ ...current, version: event.target.value }))
          }
        />
      </Grid>

      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={draft.superseded}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  superseded: event.target.checked,
                }))
              }
            />
          }
          label="Superseded"
        />
      </Grid>

      {draft.superseded && (
        <Grid item xs={12}>
          <TextField
            fullWidth
            type="datetime-local"
            label="Superseded Date"
            value={draft.supersededAtUtc}
            InputLabelProps={{ shrink: true }}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                supersededAtUtc: event.target.value,
              }))
            }
          />
        </Grid>
      )}

      <Grid item xs={12}>
        <TextField
          fullWidth
          multiline
          minRows={5}
          label="Requirements"
          value={draft.requirements}
          error={unknownActions.length > 0}
          helperText={
            unknownActions.length > 0
              ? `Unknown Action Definitions: ${unknownActions.join(', ')}`
              : family
                ? 'One per line: Stage | Action Name | Scope'
                : 'One per line: Stage | Action Name'
          }
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              requirements: event.target.value,
            }))
          }
        />
      </Grid>

      <Grid item xs={12} sx={{ textAlign: 'right' }}>
        <Button
          variant="contained"
          color="secondary"
          sx={{ mr: 2 }}
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={!canSave}>
          Save
        </Button>
      </Grid>
    </Grid>
  );
}

function ActionDefinitionsTab({
  policy,
  onPolicyChange,
}: {
  policy: EffectiveLocationPolicy;
  onPolicyChange: (policy: EffectiveLocationPolicy) => void;
}) {
  const usage = useMemo(() => getRequirementUsage(policy), [policy]);
  const rows = Object.entries(policy.actionDefinitions ?? {});
  const {
    SidePanel: ActionSidePanel,
    openSidePanel,
    closeSidePanel,
  } = useSidePanel();
  const [workingAction, setWorkingAction] = useState<
    { actionName?: string; action?: ActionRequirement } | undefined
  >();

  function openAddAction() {
    setWorkingAction(undefined);
    openSidePanel();
  }

  function openEditAction(actionName: string, action: ActionRequirement) {
    setWorkingAction({ actionName, action });
    openSidePanel();
  }

  function deleteAction(actionName: string) {
    const actionDefinitions = { ...(policy.actionDefinitions ?? {}) };
    delete actionDefinitions[actionName];
    onPolicyChange(
      new EffectiveLocationPolicy({ ...policy, actionDefinitions })
    );
  }

  return (
    <Box>
      <SectionHeader
        title="Action Definitions"
        actions={<EditableActions onAdd={openAddAction} />}
      />

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Action Name</TableCell>
              <TableCell>Document Link</TableCell>
              <TableCell>Note Entry</TableCell>
              <TableCell>Validity</TableCell>
              <TableCell>Alternate Names</TableCell>
              <TableCell>Usage</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <EmptyRow colSpan={7} label="No action definitions configured." />
            ) : (
              rows.map(([actionName, action]) => (
                <TableRow
                  key={actionName}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => openEditAction(actionName, action)}
                >
                  <TableCell>{actionName}</TableCell>
                  <TableCell>
                    {enumName(DocumentLinkRequirement, action.documentLink)}
                  </TableCell>
                  <TableCell>
                    {enumName(NoteEntryRequirement, action.noteEntry)}
                  </TableCell>
                  <TableCell>{formatValidity(action.validity)}</TableCell>
                  <TableCell>
                    <ValuesText values={action.alternateNames} />
                  </TableCell>
                  <TableCell>{usage.get(actionName)?.length ?? 0}</TableCell>
                  <TableCell align="right">
                    <DeleteRowAction
                      label={actionName}
                      onClick={() => deleteAction(actionName)}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <ActionSidePanel>
        <ActionDefinitionSidePanel
          key={workingAction?.actionName ?? 'new-action-definition'}
          actionName={workingAction?.actionName}
          action={workingAction?.action}
          existingActionNames={rows.map(([actionName]) => actionName)}
          onClose={closeSidePanel}
          onSave={(previousName, actionName, action) => {
            onPolicyChange(
              clonePolicyWithActionDefinition(
                policy,
                previousName,
                actionName,
                action
              )
            );
            closeSidePanel();
          }}
        />
      </ActionSidePanel>
    </Box>
  );
}

function CustomFieldsTable({
  fields,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  fields?: CustomField[];
  onEdit?: (field: CustomField) => void;
  onDuplicate?: (field: CustomField) => void;
  onDelete?: (field: CustomField) => void;
}) {
  const rows = fields ?? [];
  const hasActions = Boolean(onDuplicate || onDelete);

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Validation</TableCell>
            <TableCell>Valid Values</TableCell>
            {hasActions && <TableCell align="right">Actions</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <EmptyRow
              colSpan={hasActions ? 5 : 4}
              label="No custom fields configured."
            />
          ) : (
            rows.map((field) => (
              <TableRow
                key={field.name}
                hover={Boolean(onEdit)}
                sx={onEdit ? { cursor: 'pointer' } : undefined}
                onClick={() => onEdit?.(field)}
              >
                <TableCell>{field.name}</TableCell>
                <TableCell>{enumName(CustomFieldType, field.type)}</TableCell>
                <TableCell>
                  {typeof field.validation === 'undefined'
                    ? '-'
                    : enumName(CustomFieldValidation, field.validation)}
                </TableCell>
                <TableCell>
                  <ValuesText values={field.validValues} />
                </TableCell>
                {hasActions && (
                  <TableCell align="right">
                    <Stack
                      direction="row"
                      justifyContent="flex-end"
                      spacing={0.5}
                    >
                      {onDuplicate && (
                        <DuplicateRowAction
                          label={field.name}
                          onClick={() => onDuplicate(field)}
                        />
                      )}
                      {onDelete && (
                        <DeleteRowAction
                          label={field.name}
                          onClick={() => onDelete(field)}
                        />
                      )}
                    </Stack>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function CustomFamilyFieldsTab({
  policy,
  onPolicyChange,
}: {
  policy: EffectiveLocationPolicy;
  onPolicyChange: (policy: EffectiveLocationPolicy) => void;
}) {
  const {
    SidePanel: CustomFieldPanel,
    openSidePanel,
    closeSidePanel,
  } = useSidePanel();
  const [workingField, setWorkingField] = useState<CustomField | undefined>();
  const fields = policy.customFamilyFields ?? [];

  function openAddCustomField() {
    setWorkingField(undefined);
    openSidePanel();
  }

  function duplicateCustomField(field: CustomField) {
    saveField(
      undefined,
      new CustomField({
        ...field,
        name: nextCopyName(
          field.name,
          fields.map((item) => item.name)
        ),
      })
    );
  }

  function saveField(previousName: string | undefined, field: CustomField) {
    onPolicyChange(
      clonePolicyWithCustomFamilyFields(
        policy,
        upsertCustomField(fields, previousName, field)
      )
    );
    closeSidePanel();
  }

  function deleteCustomField(field: CustomField) {
    onPolicyChange(
      clonePolicyWithCustomFamilyFields(
        policy,
        removeCustomField(fields, field.name)
      )
    );
  }

  return (
    <Box>
      <SectionHeader
        title="Custom Family Fields"
        actions={<EditableActions onAdd={openAddCustomField} />}
      />
      <CustomFieldsTable
        fields={fields}
        onEdit={(field) => {
          setWorkingField(field);
          openSidePanel();
        }}
        onDuplicate={duplicateCustomField}
        onDelete={deleteCustomField}
      />

      <CustomFieldPanel>
        <CustomFieldSidePanel
          key={workingField?.name ?? 'new-custom-family-field'}
          title={
            workingField
              ? 'Edit Custom Family Field'
              : 'Add Custom Family Field'
          }
          field={workingField}
          existingNames={fields.map((field) => field.name)}
          onClose={closeSidePanel}
          onSave={saveField}
        />
      </CustomFieldPanel>
    </Box>
  );
}

function ArrangementFunctionSummary({
  arrangementFunction,
}: {
  arrangementFunction: ArrangementFunction;
}) {
  const inheritsEligibility =
    typeof arrangementFunction.eligibleIndividualVolunteerRoles ===
      'undefined' &&
    typeof arrangementFunction.eligibleVolunteerFamilyRoles === 'undefined' &&
    typeof arrangementFunction.eligiblePeople === 'undefined';

  return (
    <Stack spacing={0.5}>
      <Typography variant="body2">
        {arrangementFunction.functionName} -{' '}
        {enumName(FunctionRequirement, arrangementFunction.requirement)}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {inheritsEligibility ? 'Inherited eligibility' : 'Override eligibility'}{' '}
        - {summarizeCount(arrangementFunction.variants?.length ?? 0, 'variant')}
      </Typography>
    </Stack>
  );
}

function ArrangementPolicyDetails({
  arrangement,
}: {
  arrangement: ArrangementPolicy;
}) {
  const setupActions =
    arrangement.requiredSetupActions ??
    arrangement.requiredSetupActions_PRE_MIGRATION;
  const monitoringActions =
    arrangement.requiredMonitoringActionsNew ??
    arrangement.requiredMonitoringActions_PRE_MIGRATION;
  const closeoutActions =
    arrangement.requiredCloseoutActions ??
    arrangement.requiredCloseoutActionNames_PRE_MIGRATION;

  return (
    <Stack spacing={2}>
      <Accordion variant="outlined">
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Required Setup Actions</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <RequirementsTable
            requirements={setupActions}
            emptyLabel="No setup requirements configured."
          />
        </AccordionDetails>
      </Accordion>

      <Accordion variant="outlined">
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Required Monitoring Actions</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <MonitoringRequirementsTable requirements={monitoringActions} />
        </AccordionDetails>
      </Accordion>

      <Accordion variant="outlined">
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Required Closeout Actions</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <RequirementsTable
            requirements={closeoutActions}
            emptyLabel="No closeout requirements configured."
          />
        </AccordionDetails>
      </Accordion>

      <Accordion variant="outlined">
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Arrangement Functions</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Function Name</TableCell>
                  <TableCell>Eligibility</TableCell>
                  <TableCell>Variants</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(arrangement.arrangementFunctions ?? []).length === 0 ? (
                  <EmptyRow
                    colSpan={3}
                    label="No arrangement functions configured."
                  />
                ) : (
                  arrangement.arrangementFunctions.map(
                    (arrangementFunction) => (
                      <TableRow key={arrangementFunction.functionName}>
                        <TableCell>
                          <ArrangementFunctionSummary
                            arrangementFunction={arrangementFunction}
                          />
                        </TableCell>
                        <TableCell>
                          <ValuesText
                            values={[
                              ...(arrangementFunction.eligibleIndividualVolunteerRoles ??
                                []),
                              ...(arrangementFunction.eligibleVolunteerFamilyRoles ??
                                []),
                            ]}
                          />
                        </TableCell>
                        <TableCell>
                          <ValuesText
                            values={arrangementFunction.variants?.map(
                              (variant) => variant.variantName
                            )}
                          />
                        </TableCell>
                      </TableRow>
                    )
                  )
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </AccordionDetails>
      </Accordion>
    </Stack>
  );
}

function CasePolicyTab({
  policy,
  locationRoles,
  onPolicyChange,
}: {
  policy: EffectiveLocationPolicy;
  locationRoles: string[];
  onPolicyChange: (policy: EffectiveLocationPolicy) => void;
}) {
  const casePolicy = policy.referralPolicy;
  const arrangementPolicies = casePolicy?.arrangementPolicies ?? [];
  const volunteerRoles = Object.keys(
    policy.volunteerPolicy?.volunteerRoles ?? {}
  );
  const volunteerFamilyRoles = Object.keys(
    policy.volunteerPolicy?.volunteerFamilyRoles ?? {}
  );
  const {
    SidePanel: FunctionAssignmentPanel,
    openSidePanel: openFunctionAssignmentPanel,
    closeSidePanel: closeFunctionAssignmentPanel,
  } = useSidePanel();
  const {
    SidePanel: FunctionPolicyPanel,
    openSidePanel: openFunctionPolicyPanel,
    closeSidePanel: closeFunctionPolicyPanel,
  } = useSidePanel();
  const {
    SidePanel: ArrangementPolicyPanel,
    openSidePanel: openArrangementPolicyPanel,
    closeSidePanel: closeArrangementPolicyPanel,
  } = useSidePanel();
  const [workingFunctionAssignmentPolicy, setWorkingFunctionAssignmentPolicy] =
    useState<FunctionAssignmentPolicy | undefined>();
  const [workingFunctionPolicy, setWorkingFunctionPolicy] = useState<
    FunctionPolicy | undefined
  >();
  const [workingArrangementPolicy, setWorkingArrangementPolicy] = useState<
    ArrangementPolicy | undefined
  >();

  function updateCasePolicy(update: Partial<V1CasePolicy>) {
    onPolicyChange(
      clonePolicyWithCasePolicy(
        policy,
        new V1CasePolicy({
          ...casePolicy,
          ...update,
        })
      )
    );
  }

  function duplicateCaseFunctionAssignmentPolicy(
    assignmentPolicy: FunctionAssignmentPolicy
  ) {
    const existingRoles =
      casePolicy?.functionAssignmentPolicies?.map(
        (item) => item.assignmentRole
      ) ?? [];
    updateCasePolicy({
      functionAssignmentPolicies: upsertByName(
        casePolicy?.functionAssignmentPolicies ?? [],
        undefined,
        new FunctionAssignmentPolicy({
          ...assignmentPolicy,
          assignmentRole: nextCopyName(
            assignmentPolicy.assignmentRole,
            existingRoles
          ),
        }),
        (item) => item.assignmentRole
      ),
    });
  }

  function deleteCaseFunctionAssignmentPolicy(
    assignmentPolicy: FunctionAssignmentPolicy
  ) {
    updateCasePolicy({
      functionAssignmentPolicies: removeByName(
        casePolicy?.functionAssignmentPolicies,
        assignmentPolicy.assignmentRole,
        (item) => item.assignmentRole
      ),
    });
  }

  function duplicateCaseFunctionPolicy(functionPolicy: FunctionPolicy) {
    const existingFunctionNames =
      casePolicy?.functionPolicies?.map((item) => item.functionName) ?? [];
    updateCasePolicy({
      functionPolicies: upsertByName(
        casePolicy?.functionPolicies ?? [],
        undefined,
        new FunctionPolicy({
          ...functionPolicy,
          functionName: nextCopyName(
            functionPolicy.functionName,
            existingFunctionNames
          ),
        }),
        (item) => item.functionName
      ),
    });
  }

  function deleteCaseFunctionPolicy(functionPolicy: FunctionPolicy) {
    updateCasePolicy({
      functionPolicies: removeByName(
        casePolicy?.functionPolicies,
        functionPolicy.functionName,
        (item) => item.functionName
      ),
    });
  }

  function duplicateArrangementPolicy(arrangement: ArrangementPolicy) {
    updateCasePolicy({
      arrangementPolicies: upsertByName(
        arrangementPolicies,
        undefined,
        new ArrangementPolicy({
          ...arrangement,
          arrangementType: nextCopyName(
            arrangement.arrangementType,
            arrangementPolicies.map((item) => item.arrangementType)
          ),
        }),
        (item) => item.arrangementType
      ),
    });
  }

  function deleteArrangementPolicy(arrangement: ArrangementPolicy) {
    updateCasePolicy({
      arrangementPolicies: removeByName(
        arrangementPolicies,
        arrangement.arrangementType,
        (item) => item.arrangementType
      ),
    });
  }

  return (
    <Box>
      <SectionHeader title="Case Policies" />

      <Stack spacing={2}>
        <Accordion defaultExpanded variant="outlined">
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Function Assignment Policies</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <EditableActions
                onAdd={() => {
                  setWorkingFunctionAssignmentPolicy(undefined);
                  openFunctionAssignmentPanel();
                }}
              />
              <FunctionAssignmentPoliciesTable
                policies={casePolicy?.functionAssignmentPolicies}
                emptyLabel="No case function assignment policies configured."
                onEdit={(assignmentPolicy) => {
                  setWorkingFunctionAssignmentPolicy(assignmentPolicy);
                  openFunctionAssignmentPanel();
                }}
                onDuplicate={duplicateCaseFunctionAssignmentPolicy}
                onDelete={deleteCaseFunctionAssignmentPolicy}
              />
            </Stack>
          </AccordionDetails>
        </Accordion>

        <Accordion variant="outlined">
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Function Policies</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <EditableActions
                onAdd={() => {
                  setWorkingFunctionPolicy(undefined);
                  openFunctionPolicyPanel();
                }}
              />
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Function Name</TableCell>
                      <TableCell>Eligibility</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(casePolicy?.functionPolicies ?? []).length === 0 ? (
                      <EmptyRow
                        colSpan={3}
                        label="No function policies configured."
                      />
                    ) : (
                      casePolicy?.functionPolicies?.map((functionPolicy) => (
                        <TableRow
                          key={functionPolicy.functionName}
                          hover
                          sx={{ cursor: 'pointer' }}
                          onClick={() => {
                            setWorkingFunctionPolicy(functionPolicy);
                            openFunctionPolicyPanel();
                          }}
                        >
                          <TableCell>{functionPolicy.functionName}</TableCell>
                          <TableCell>
                            <EligibilitySummary
                              eligibility={functionPolicy.eligibility}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Stack
                              direction="row"
                              justifyContent="flex-end"
                              spacing={0.5}
                            >
                              <DuplicateRowAction
                                label={functionPolicy.functionName}
                                onClick={() =>
                                  duplicateCaseFunctionPolicy(functionPolicy)
                                }
                              />
                              <DeleteRowAction
                                label={functionPolicy.functionName}
                                onClick={() =>
                                  deleteCaseFunctionPolicy(functionPolicy)
                                }
                              />
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Stack>
          </AccordionDetails>
        </Accordion>

        <Accordion variant="outlined">
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Arrangement Policies</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <EditableActions
                onAdd={() => {
                  setWorkingArrangementPolicy(undefined);
                  openArrangementPolicyPanel();
                }}
              />
              {arrangementPolicies.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No arrangement policies configured.
                </Typography>
              ) : (
                arrangementPolicies.map((arrangement) => (
                  <Accordion
                    key={arrangement.arrangementType}
                    variant="outlined"
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={1}
                        alignItems={{ xs: 'flex-start', sm: 'center' }}
                      >
                        <Typography>{arrangement.arrangementType}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {arrangement.supersededAtUtc
                            ? 'Superseded'
                            : 'Current'}
                        </Typography>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={(event) => {
                            event.stopPropagation();
                            setWorkingArrangementPolicy(arrangement);
                            openArrangementPolicyPanel();
                          }}
                        >
                          Edit
                        </Button>
                        <DuplicateRowAction
                          label={arrangement.arrangementType}
                          onClick={() =>
                            duplicateArrangementPolicy(arrangement)
                          }
                        />
                        <DeleteRowAction
                          label={arrangement.arrangementType}
                          onClick={() => deleteArrangementPolicy(arrangement)}
                        />
                      </Stack>
                    </AccordionSummary>
                    <AccordionDetails>
                      <ArrangementPolicyDetails arrangement={arrangement} />
                    </AccordionDetails>
                  </Accordion>
                ))
              )}
            </Stack>
          </AccordionDetails>
        </Accordion>
      </Stack>

      <FunctionAssignmentPanel>
        <FunctionAssignmentPolicySidePanel
          key={
            workingFunctionAssignmentPolicy?.assignmentRole ??
            'new-case-assignment-policy'
          }
          title={
            workingFunctionAssignmentPolicy
              ? 'Edit Case Policies Function Assignment Policy'
              : 'Add Case Policies Function Assignment Policy'
          }
          policy={workingFunctionAssignmentPolicy}
          existingAssignmentRoles={
            casePolicy?.functionAssignmentPolicies?.map(
              (item) => item.assignmentRole
            ) ?? []
          }
          locationRoles={locationRoles}
          volunteerRoles={volunteerRoles}
          volunteerFamilyRoles={volunteerFamilyRoles}
          onClose={closeFunctionAssignmentPanel}
          onSave={(previousRole, assignmentPolicy) => {
            updateCasePolicy({
              functionAssignmentPolicies: upsertByName(
                casePolicy?.functionAssignmentPolicies ?? [],
                previousRole,
                assignmentPolicy,
                (item) => item.assignmentRole
              ),
            });
            closeFunctionAssignmentPanel();
          }}
        />
      </FunctionAssignmentPanel>

      <FunctionPolicyPanel>
        <FunctionPolicySidePanel
          key={workingFunctionPolicy?.functionName ?? 'new-function-policy'}
          policy={workingFunctionPolicy}
          existingFunctionNames={
            casePolicy?.functionPolicies?.map((item) => item.functionName) ?? []
          }
          volunteerRoles={volunteerRoles}
          volunteerFamilyRoles={volunteerFamilyRoles}
          onClose={closeFunctionPolicyPanel}
          onSave={(previousName, functionPolicy) => {
            updateCasePolicy({
              functionPolicies: upsertByName(
                casePolicy?.functionPolicies ?? [],
                previousName,
                functionPolicy,
                (item) => item.functionName
              ),
            });
            closeFunctionPolicyPanel();
          }}
        />
      </FunctionPolicyPanel>

      <ArrangementPolicyPanel>
        <ArrangementPolicySidePanel
          key={
            workingArrangementPolicy?.arrangementType ??
            'new-arrangement-policy'
          }
          arrangement={workingArrangementPolicy}
          existingArrangementTypes={arrangementPolicies.map(
            (item) => item.arrangementType
          )}
          onClose={closeArrangementPolicyPanel}
          onSave={(previousType, arrangement) => {
            updateCasePolicy({
              arrangementPolicies: upsertByName(
                arrangementPolicies,
                previousType,
                arrangement,
                (item) => item.arrangementType
              ),
            });
            closeArrangementPolicyPanel();
          }}
        />
      </ArrangementPolicyPanel>
    </Box>
  );
}

function V1ReferralPolicyTab({
  policy,
  locationRoles,
  onPolicyChange,
}: {
  policy: EffectiveLocationPolicy;
  locationRoles: string[];
  onPolicyChange: (policy: EffectiveLocationPolicy) => void;
}) {
  const casePolicy = policy.referralPolicy;
  const intakeRequirements =
    casePolicy?.intakeRequirements ??
    casePolicy?.intakeRequirements_PRE_MIGRATION;
  const actionNames = Object.keys(policy.actionDefinitions ?? {});
  const volunteerRoles = Object.keys(
    policy.volunteerPolicy?.volunteerRoles ?? {}
  );
  const volunteerFamilyRoles = Object.keys(
    policy.volunteerPolicy?.volunteerFamilyRoles ?? {}
  );
  const {
    SidePanel: RequirementPanel,
    openSidePanel: openRequirementPanel,
    closeSidePanel: closeRequirementPanel,
  } = useSidePanel();
  const {
    SidePanel: CustomFieldPanel,
    openSidePanel: openCustomFieldPanel,
    closeSidePanel: closeCustomFieldPanel,
  } = useSidePanel();
  const {
    SidePanel: FunctionAssignmentPanel,
    openSidePanel: openFunctionAssignmentPanel,
    closeSidePanel: closeFunctionAssignmentPanel,
  } = useSidePanel();
  const [workingRequirement, setWorkingRequirement] = useState<
    RequirementDefinition | undefined
  >();
  const [workingCustomField, setWorkingCustomField] = useState<
    CustomField | undefined
  >();
  const [workingFunctionAssignmentPolicy, setWorkingFunctionAssignmentPolicy] =
    useState<FunctionAssignmentPolicy | undefined>();
  const functionAssignmentPolicies =
    policy.v1ReferralPolicy?.functionAssignmentPolicies ?? [];

  function updateCasePolicy(update: Partial<V1CasePolicy>) {
    onPolicyChange(
      clonePolicyWithCasePolicy(
        policy,
        new V1CasePolicy({
          ...casePolicy,
          ...update,
        })
      )
    );
  }

  function duplicateReferralCustomField(field: CustomField) {
    updateCasePolicy({
      customFields: upsertCustomField(
        casePolicy?.customFields,
        undefined,
        new CustomField({
          ...field,
          name: nextCopyName(
            field.name,
            casePolicy?.customFields?.map((item) => item.name) ?? []
          ),
        })
      ),
    });
  }

  function deleteReferralIntakeRequirement(requirement: RequirementDefinition) {
    updateCasePolicy({
      intakeRequirements: removeByName(
        casePolicy?.intakeRequirements,
        requirement.actionName,
        (item) => item.actionName
      ),
    });
  }

  function deleteReferralCustomField(field: CustomField) {
    updateCasePolicy({
      customFields: removeCustomField(casePolicy?.customFields, field.name),
    });
  }

  function duplicateReferralFunctionAssignmentPolicy(
    assignmentPolicy: FunctionAssignmentPolicy
  ) {
    const existingRoles = functionAssignmentPolicies.map(
      (item) => item.assignmentRole
    );
    onPolicyChange(
      clonePolicyWithV1ReferralPolicy(
        policy,
        new V1ReferralPolicy({
          ...policy.v1ReferralPolicy,
          functionAssignmentPolicies: upsertByName(
            functionAssignmentPolicies,
            undefined,
            new FunctionAssignmentPolicy({
              ...assignmentPolicy,
              assignmentRole: nextCopyName(
                assignmentPolicy.assignmentRole,
                existingRoles
              ),
            }),
            (item) => item.assignmentRole
          ),
        })
      )
    );
  }

  function deleteReferralFunctionAssignmentPolicy(
    assignmentPolicy: FunctionAssignmentPolicy
  ) {
    onPolicyChange(
      clonePolicyWithV1ReferralPolicy(
        policy,
        new V1ReferralPolicy({
          ...policy.v1ReferralPolicy,
          functionAssignmentPolicies: removeByName(
            functionAssignmentPolicies,
            assignmentPolicy.assignmentRole,
            (item) => item.assignmentRole
          ),
        })
      )
    );
  }

  return (
    <Box>
      <SectionHeader title="Referral Policies" />

      <Stack spacing={2}>
        <Accordion defaultExpanded variant="outlined">
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Intake Requirements</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <EditableActions
                onAdd={() => {
                  setWorkingRequirement(undefined);
                  openRequirementPanel();
                }}
              />
              <RequirementsTable
                requirements={intakeRequirements}
                emptyLabel="No intake requirements configured."
                onEdit={(requirement) => {
                  setWorkingRequirement(requirement);
                  openRequirementPanel();
                }}
                onDelete={deleteReferralIntakeRequirement}
              />
            </Stack>
          </AccordionDetails>
        </Accordion>

        <Accordion variant="outlined">
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Custom Fields</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <EditableActions
                onAdd={() => {
                  setWorkingCustomField(undefined);
                  openCustomFieldPanel();
                }}
              />
              <CustomFieldsTable
                fields={casePolicy?.customFields}
                onEdit={(field) => {
                  setWorkingCustomField(field);
                  openCustomFieldPanel();
                }}
                onDuplicate={duplicateReferralCustomField}
                onDelete={deleteReferralCustomField}
              />
            </Stack>
          </AccordionDetails>
        </Accordion>

        <Accordion variant="outlined">
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Function Assignment Policies</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <EditableActions
                onAdd={() => {
                  setWorkingFunctionAssignmentPolicy(undefined);
                  openFunctionAssignmentPanel();
                }}
              />
              <FunctionAssignmentPoliciesTable
                policies={functionAssignmentPolicies}
                emptyLabel="No referral function assignment policies configured."
                onEdit={(assignmentPolicy) => {
                  setWorkingFunctionAssignmentPolicy(assignmentPolicy);
                  openFunctionAssignmentPanel();
                }}
                onDuplicate={duplicateReferralFunctionAssignmentPolicy}
                onDelete={deleteReferralFunctionAssignmentPolicy}
              />
            </Stack>
          </AccordionDetails>
        </Accordion>
      </Stack>

      <RequirementPanel>
        <RequirementSidePanel
          key={
            workingRequirement?.actionName ?? 'new-referral-intake-requirement'
          }
          title={
            workingRequirement
              ? 'Edit Referral Policies Intake Requirement'
              : 'Add Referral Policies Intake Requirement'
          }
          requirement={workingRequirement}
          actionNames={actionNames}
          existingActionNames={
            intakeRequirements?.map((requirement) => requirement.actionName) ??
            []
          }
          onClose={closeRequirementPanel}
          onSave={(previousName, requirement) => {
            updateCasePolicy({
              intakeRequirements: upsertByName(
                casePolicy?.intakeRequirements ?? [],
                previousName,
                requirement,
                (item) => item.actionName
              ),
            });
            closeRequirementPanel();
          }}
        />
      </RequirementPanel>

      <CustomFieldPanel>
        <CustomFieldSidePanel
          key={workingCustomField?.name ?? 'new-referral-custom-field'}
          title={
            workingCustomField
              ? 'Edit Referral Policies Custom Field'
              : 'Add Referral Policies Custom Field'
          }
          field={workingCustomField}
          existingNames={
            casePolicy?.customFields?.map((field) => field.name) ?? []
          }
          onClose={closeCustomFieldPanel}
          onSave={(previousName, field) => {
            updateCasePolicy({
              customFields: upsertCustomField(
                casePolicy?.customFields,
                previousName,
                field
              ),
            });
            closeCustomFieldPanel();
          }}
        />
      </CustomFieldPanel>

      <FunctionAssignmentPanel>
        <FunctionAssignmentPolicySidePanel
          key={
            workingFunctionAssignmentPolicy?.assignmentRole ??
            'new-referral-assignment-policy'
          }
          title={
            workingFunctionAssignmentPolicy
              ? 'Edit Referral Policies Function Assignment Policy'
              : 'Add Referral Policies Function Assignment Policy'
          }
          policy={workingFunctionAssignmentPolicy}
          existingAssignmentRoles={functionAssignmentPolicies.map(
            (item) => item.assignmentRole
          )}
          locationRoles={locationRoles}
          volunteerRoles={volunteerRoles}
          volunteerFamilyRoles={volunteerFamilyRoles}
          onClose={closeFunctionAssignmentPanel}
          onSave={(previousRole, assignmentPolicy) => {
            onPolicyChange(
              clonePolicyWithV1ReferralPolicy(
                policy,
                new V1ReferralPolicy({
                  ...policy.v1ReferralPolicy,
                  functionAssignmentPolicies: upsertByName(
                    functionAssignmentPolicies,
                    previousRole,
                    assignmentPolicy,
                    (item) => item.assignmentRole
                  ),
                })
              )
            );
            closeFunctionAssignmentPanel();
          }}
        />
      </FunctionAssignmentPanel>
    </Box>
  );
}

function RolePolicyVersionsTable({
  rows,
  family,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  rows: {
    roleName: string;
    version: string;
    supersededAtUtc?: Date;
    requirements: ReactNode;
    policyVersion:
      | VolunteerRolePolicyVersion
      | VolunteerFamilyRolePolicyVersion;
  }[];
  family?: boolean;
  onEdit?: (row: {
    roleName: string;
    version: string;
    supersededAtUtc?: Date;
    requirements: ReactNode;
    policyVersion:
      | VolunteerRolePolicyVersion
      | VolunteerFamilyRolePolicyVersion;
  }) => void;
  onDuplicate?: (row: {
    roleName: string;
    version: string;
    supersededAtUtc?: Date;
    requirements: ReactNode;
    policyVersion:
      | VolunteerRolePolicyVersion
      | VolunteerFamilyRolePolicyVersion;
  }) => void;
  onDelete?: (row: {
    roleName: string;
    version: string;
    supersededAtUtc?: Date;
    requirements: ReactNode;
    policyVersion:
      | VolunteerRolePolicyVersion
      | VolunteerFamilyRolePolicyVersion;
  }) => void;
}) {
  const hasActions = Boolean(onDuplicate || onDelete);

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>
              {family ? 'Volunteer Family Role Type' : 'Volunteer Role Type'}
            </TableCell>
            <TableCell>Version</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Requirements</TableCell>
            {hasActions && <TableCell align="right">Actions</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <EmptyRow
              colSpan={hasActions ? 5 : 4}
              label="No role policies configured."
            />
          ) : (
            rows.map((row) => (
              <TableRow
                key={`${row.roleName}-${row.version}`}
                hover={Boolean(onEdit)}
                sx={onEdit ? { cursor: 'pointer' } : undefined}
                onClick={() => onEdit?.(row)}
              >
                <TableCell>{row.roleName}</TableCell>
                <TableCell>{row.version}</TableCell>
                <TableCell>{formatDate(row.supersededAtUtc)}</TableCell>
                <TableCell>{row.requirements}</TableCell>
                {hasActions && (
                  <TableCell align="right">
                    <Stack
                      direction="row"
                      justifyContent="flex-end"
                      spacing={0.5}
                    >
                      {onDuplicate && (
                        <DuplicateRowAction
                          label={`${row.roleName} ${row.version}`}
                          onClick={() => onDuplicate(row)}
                        />
                      )}
                      {onDelete && (
                        <DeleteRowAction
                          label={`${row.roleName} ${row.version}`}
                          onClick={() => onDelete(row)}
                        />
                      )}
                    </Stack>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function VolunteerPolicyTab({
  policy,
  onPolicyChange,
}: {
  policy: EffectiveLocationPolicy;
  onPolicyChange: (policy: EffectiveLocationPolicy) => void;
}) {
  const volunteerPolicy: VolunteerPolicy | undefined = policy.volunteerPolicy;
  const customFields = volunteerPolicy?.customFields ?? [];
  const actionNames = Object.keys(policy.actionDefinitions ?? {});
  const {
    SidePanel: CustomFieldPanel,
    openSidePanel,
    closeSidePanel,
  } = useSidePanel();
  const {
    SidePanel: VolunteerRolePanel,
    openSidePanel: openVolunteerRolePanel,
    closeSidePanel: closeVolunteerRolePanel,
  } = useSidePanel();
  const {
    SidePanel: VolunteerFamilyRolePanel,
    openSidePanel: openVolunteerFamilyRolePanel,
    closeSidePanel: closeVolunteerFamilyRolePanel,
  } = useSidePanel();
  const [workingField, setWorkingField] = useState<CustomField | undefined>();
  const [workingVolunteerRoleVersion, setWorkingVolunteerRoleVersion] =
    useState<
      { roleName?: string; version?: VolunteerRolePolicyVersion } | undefined
    >();
  const [
    workingVolunteerFamilyRoleVersion,
    setWorkingVolunteerFamilyRoleVersion,
  ] = useState<
    | { roleName?: string; version?: VolunteerFamilyRolePolicyVersion }
    | undefined
  >();

  const individualRows = Object.entries(
    volunteerPolicy?.volunteerRoles ?? {}
  ).flatMap(
    ([roleName, rolePolicy]) =>
      rolePolicy.policyVersions?.map((version) => ({
        roleName,
        version: version.version,
        supersededAtUtc: version.supersededAtUtc,
        policyVersion: version,
        requirements: (
          <Stack spacing={0.5}>
            {version.requirements?.length ? (
              version.requirements.map((requirement) => (
                <Typography
                  key={`${requirement.stage}-${requirement.actionName}`}
                  variant="body2"
                >
                  {enumName(RequirementStage, requirement.stage)} -{' '}
                  {requirement.actionName}
                </Typography>
              ))
            ) : (
              <Typography variant="body2">-</Typography>
            )}
          </Stack>
        ),
      })) ?? []
  );

  const familyRows = Object.entries(
    volunteerPolicy?.volunteerFamilyRoles ?? {}
  ).flatMap(
    ([roleName, rolePolicy]) =>
      rolePolicy.policyVersions?.map((version) => ({
        roleName,
        version: version.version,
        supersededAtUtc: version.supersededAtUtc,
        policyVersion: version,
        requirements: (
          <Stack spacing={0.5}>
            {version.requirements?.length ? (
              version.requirements.map((requirement) => (
                <Typography
                  key={`${requirement.stage}-${requirement.actionName}-${requirement.scope}`}
                  variant="body2"
                >
                  {enumName(RequirementStage, requirement.stage)} -{' '}
                  {requirement.actionName} -{' '}
                  {enumName(VolunteerFamilyRequirementScope, requirement.scope)}
                </Typography>
              ))
            ) : (
              <Typography variant="body2">-</Typography>
            )}
          </Stack>
        ),
      })) ?? []
  );

  function duplicateVolunteerCustomField(field: CustomField) {
    onPolicyChange(
      clonePolicyWithVolunteerCustomFields(
        policy,
        upsertCustomField(
          customFields,
          undefined,
          new CustomField({
            ...field,
            name: nextCopyName(
              field.name,
              customFields.map((item) => item.name)
            ),
          })
        )
      )
    );
  }

  function deleteVolunteerCustomField(field: CustomField) {
    onPolicyChange(
      clonePolicyWithVolunteerCustomFields(
        policy,
        removeCustomField(customFields, field.name)
      )
    );
  }

  function duplicateVolunteerRoleVersion(row: {
    roleName: string;
    version: string;
    policyVersion:
      | VolunteerRolePolicyVersion
      | VolunteerFamilyRolePolicyVersion;
  }) {
    const existingVersions =
      volunteerPolicy?.volunteerRoles?.[row.roleName]?.policyVersions?.map(
        (version) => version.version
      ) ?? [];
    onPolicyChange(
      clonePolicyWithVolunteerPolicy(
        policy,
        upsertVolunteerRolePolicyVersion(
          volunteerPolicy,
          undefined,
          undefined,
          row.roleName,
          new VolunteerRolePolicyVersion({
            ...(row.policyVersion as VolunteerRolePolicyVersion),
            version: nextCopyName(row.version, existingVersions),
          })
        )
      )
    );
  }

  function duplicateVolunteerFamilyRoleVersion(row: {
    roleName: string;
    version: string;
    policyVersion:
      | VolunteerRolePolicyVersion
      | VolunteerFamilyRolePolicyVersion;
  }) {
    const existingVersions =
      volunteerPolicy?.volunteerFamilyRoles?.[
        row.roleName
      ]?.policyVersions?.map((version) => version.version) ?? [];
    onPolicyChange(
      clonePolicyWithVolunteerPolicy(
        policy,
        upsertVolunteerFamilyRolePolicyVersion(
          volunteerPolicy,
          undefined,
          undefined,
          row.roleName,
          new VolunteerFamilyRolePolicyVersion({
            ...(row.policyVersion as VolunteerFamilyRolePolicyVersion),
            version: nextCopyName(row.version, existingVersions),
          })
        )
      )
    );
  }

  function deleteVolunteerRoleVersion(row: {
    roleName: string;
    version: string;
  }) {
    onPolicyChange(
      clonePolicyWithVolunteerPolicy(
        policy,
        removeVolunteerRolePolicyVersion(
          volunteerPolicy,
          row.roleName,
          row.version
        )
      )
    );
  }

  function deleteVolunteerFamilyRoleVersion(row: {
    roleName: string;
    version: string;
  }) {
    onPolicyChange(
      clonePolicyWithVolunteerPolicy(
        policy,
        removeVolunteerFamilyRolePolicyVersion(
          volunteerPolicy,
          row.roleName,
          row.version
        )
      )
    );
  }

  return (
    <Box>
      <SectionHeader title="Volunteer Policies" />

      <Stack spacing={2}>
        <Accordion defaultExpanded variant="outlined">
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Volunteer Roles</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <EditableActions
                onAdd={() => {
                  setWorkingVolunteerRoleVersion(undefined);
                  openVolunteerRolePanel();
                }}
              />
              <RolePolicyVersionsTable
                rows={individualRows}
                onEdit={(row) => {
                  setWorkingVolunteerRoleVersion({
                    roleName: row.roleName,
                    version: row.policyVersion as VolunteerRolePolicyVersion,
                  });
                  openVolunteerRolePanel();
                }}
                onDuplicate={duplicateVolunteerRoleVersion}
                onDelete={deleteVolunteerRoleVersion}
              />
            </Stack>
          </AccordionDetails>
        </Accordion>

        <Accordion variant="outlined">
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Volunteer Family Roles</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <EditableActions
                onAdd={() => {
                  setWorkingVolunteerFamilyRoleVersion(undefined);
                  openVolunteerFamilyRolePanel();
                }}
              />
              <RolePolicyVersionsTable
                rows={familyRows}
                family
                onEdit={(row) => {
                  setWorkingVolunteerFamilyRoleVersion({
                    roleName: row.roleName,
                    version:
                      row.policyVersion as VolunteerFamilyRolePolicyVersion,
                  });
                  openVolunteerFamilyRolePanel();
                }}
                onDuplicate={duplicateVolunteerFamilyRoleVersion}
                onDelete={deleteVolunteerFamilyRoleVersion}
              />
            </Stack>
          </AccordionDetails>
        </Accordion>

        <Accordion variant="outlined">
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Custom Fields</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <EditableActions
                onAdd={() => {
                  setWorkingField(undefined);
                  openSidePanel();
                }}
              />
              <CustomFieldsTable
                fields={customFields}
                onEdit={(field) => {
                  setWorkingField(field);
                  openSidePanel();
                }}
                onDuplicate={duplicateVolunteerCustomField}
                onDelete={deleteVolunteerCustomField}
              />
            </Stack>
          </AccordionDetails>
        </Accordion>
      </Stack>

      <CustomFieldPanel>
        <CustomFieldSidePanel
          key={workingField?.name ?? 'new-volunteer-custom-field'}
          title={
            workingField
              ? 'Edit Volunteer Policies Custom Field'
              : 'Add Volunteer Policies Custom Field'
          }
          field={workingField}
          existingNames={customFields.map((field) => field.name)}
          onClose={closeSidePanel}
          onSave={(previousName, field) => {
            onPolicyChange(
              clonePolicyWithVolunteerCustomFields(
                policy,
                upsertCustomField(customFields, previousName, field)
              )
            );
            closeSidePanel();
          }}
        />
      </CustomFieldPanel>

      <VolunteerRolePanel>
        <VolunteerRolePolicyVersionSidePanel
          key={`${workingVolunteerRoleVersion?.roleName ?? 'new-volunteer-role'}-${workingVolunteerRoleVersion?.version?.version ?? 'version'}`}
          title={
            workingVolunteerRoleVersion
              ? 'Edit Volunteer Policies Role Version'
              : 'Add Volunteer Policies Role Version'
          }
          roleName={workingVolunteerRoleVersion?.roleName}
          version={workingVolunteerRoleVersion?.version}
          existingRoleNames={Object.keys(volunteerPolicy?.volunteerRoles ?? {})}
          existingVersionsForRole={
            workingVolunteerRoleVersion?.roleName
              ? (volunteerPolicy?.volunteerRoles?.[
                  workingVolunteerRoleVersion.roleName
                ]?.policyVersions?.map((version) => version.version) ?? [])
              : []
          }
          family={false}
          actionNames={actionNames}
          onClose={closeVolunteerRolePanel}
          onSave={(previousRoleName, previousVersion, roleName, version) => {
            onPolicyChange(
              clonePolicyWithVolunteerPolicy(
                policy,
                upsertVolunteerRolePolicyVersion(
                  volunteerPolicy,
                  previousRoleName,
                  previousVersion,
                  roleName,
                  version as VolunteerRolePolicyVersion
                )
              )
            );
            closeVolunteerRolePanel();
          }}
        />
      </VolunteerRolePanel>

      <VolunteerFamilyRolePanel>
        <VolunteerRolePolicyVersionSidePanel
          key={`${workingVolunteerFamilyRoleVersion?.roleName ?? 'new-volunteer-family-role'}-${workingVolunteerFamilyRoleVersion?.version?.version ?? 'version'}`}
          title={
            workingVolunteerFamilyRoleVersion
              ? 'Edit Volunteer Policies Family Role Version'
              : 'Add Volunteer Policies Family Role Version'
          }
          roleName={workingVolunteerFamilyRoleVersion?.roleName}
          version={workingVolunteerFamilyRoleVersion?.version}
          existingRoleNames={Object.keys(
            volunteerPolicy?.volunteerFamilyRoles ?? {}
          )}
          existingVersionsForRole={
            workingVolunteerFamilyRoleVersion?.roleName
              ? (volunteerPolicy?.volunteerFamilyRoles?.[
                  workingVolunteerFamilyRoleVersion.roleName
                ]?.policyVersions?.map((version) => version.version) ?? [])
              : []
          }
          family
          actionNames={actionNames}
          onClose={closeVolunteerFamilyRolePanel}
          onSave={(previousRoleName, previousVersion, roleName, version) => {
            onPolicyChange(
              clonePolicyWithVolunteerPolicy(
                policy,
                upsertVolunteerFamilyRolePolicyVersion(
                  volunteerPolicy,
                  previousRoleName,
                  previousVersion,
                  roleName,
                  version as VolunteerFamilyRolePolicyVersion
                )
              )
            );
            closeVolunteerFamilyRolePanel();
          }}
        />
      </VolunteerFamilyRolePanel>
    </Box>
  );
}

export function SmsSourcePhoneNumbers({
  locationConfiguration,
}: {
  locationConfiguration: LocationConfiguration;
}) {
  const rows = locationConfiguration.smsSourcePhoneNumbers ?? [];

  return (
    <Box>
      <SectionHeader title="SMS Source Phone Numbers" />

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Source Phone Number</TableCell>
              <TableCell>Description</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <EmptyRow
                colSpan={2}
                label="No SMS source phone numbers configured."
              />
            ) : (
              rows.map((row) => (
                <TableRow key={row.sourcePhoneNumber}>
                  <TableCell>{row.sourcePhoneNumber}</TableCell>
                  <TableCell>{row.description}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export function PolicyConfiguration({
  policy,
  locationRoles,
  onPolicyChange,
  section,
}: PolicyConfigurationProps) {
  return (
    <Stack spacing={2} sx={{ maxWidth: 1200, pb: 4 }}>
      {section === 'actionDefinitions' && (
        <ActionDefinitionsTab policy={policy} onPolicyChange={onPolicyChange} />
      )}
      {section === 'customFamilyFields' && (
        <CustomFamilyFieldsTab
          policy={policy}
          onPolicyChange={onPolicyChange}
        />
      )}
      {section === 'casePolicy' && (
        <CasePolicyTab
          policy={policy}
          locationRoles={locationRoles}
          onPolicyChange={onPolicyChange}
        />
      )}
      {section === 'v1ReferralPolicy' && (
        <V1ReferralPolicyTab
          policy={policy}
          locationRoles={locationRoles}
          onPolicyChange={onPolicyChange}
        />
      )}
      {section === 'volunteerPolicy' && (
        <VolunteerPolicyTab policy={policy} onPolicyChange={onPolicyChange} />
      )}
    </Stack>
  );
}
