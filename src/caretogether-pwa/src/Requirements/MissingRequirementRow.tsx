import { useRecoilValue } from 'recoil';
import { Permission, RequirementDefinition } from '../GeneratedClient';
import { policyData } from '../Model/ConfigurationModel';
import {
  useFamilyIdPermissions,
  useGlobalPermissions,
} from '../Model/SessionModel';
import { useDialogHandle } from '../Hooks/useDialogHandle';
import { IconRow } from '../Generic/IconRow';
import { MissingRequirementDialog } from './MissingRequirementDialog';
import { RequirementContext } from './RequirementContext';
import { Chip, Tooltip } from '@mui/material';

type MissingRequirementRowProps = {
  requirement: string | RequirementDefinition;
  policyVersions?: { version: string; roleName: string }[];
  context: RequirementContext;
  isAvailableApplication?: boolean;
  v1CaseId?: string;
};

export function MissingRequirementRow({
  requirement,
  policyVersions,
  context,
  isAvailableApplication,
  v1CaseId,
}: MissingRequirementRowProps) {
  const policy = useRecoilValue(policyData);
  const familyIdForPermissions =
    context.kind === 'V1Case' ||
    context.kind === 'Arrangement' ||
    context.kind === 'Family Volunteer Assignment' ||
    context.kind === 'Individual Volunteer Assignment'
      ? context.partneringFamilyId
      : context.kind === 'Volunteer Family' ||
          context.kind === 'Individual Volunteer'
        ? context.volunteerFamilyId
        : '';

  const familyPermissions = useFamilyIdPermissions(familyIdForPermissions);
  const globalPermissions = useGlobalPermissions();

  const permissions =
    context.kind === 'V1Referral' ? globalPermissions : familyPermissions;

  const dialogHandle = useDialogHandle();

  const requirementName =
    typeof requirement === 'string' ? requirement : requirement.actionName;

  const isRequired =
    typeof requirement === 'string' ? true : requirement.isRequired;

  const requirementPolicy =
    policy.actionDefinitions[requirementName] ||
    Object.entries(policy.actionDefinitions).find(([, value]) =>
      value.alternateNames?.includes(requirementName)
    )?.[1];

  if (
    context.kind === 'Arrangement' ||
    context.kind === 'Family Volunteer Assignment' ||
    context.kind === 'Individual Volunteer Assignment'
  )
    throw new Error(`Invalid missing requirement context '${context.kind}'`);

  const canComplete =
    context.kind === 'V1Referral'
      ? permissions(Permission.EditV1ReferralRequirementCompletion)
      : context.kind === 'V1Case'
        ? permissions(Permission.EditV1CaseRequirementCompletion)
        : permissions(Permission.EditApprovalRequirementCompletion);

  const canExempt =
    context.kind === 'V1Referral'
      ? permissions(Permission.EditV1ReferralRequirementExemption)
      : context.kind === 'V1Case'
        ? permissions(Permission.EditV1CaseRequirementExemption)
        : permissions(Permission.EditApprovalRequirementExemption);

  return (
    <>
      <IconRow
        icon={isAvailableApplication ? '💤' : isRequired ? '❌' : '🔲'}
        onClick={canComplete || canExempt ? dialogHandle.openDialog : undefined}
      >
        <span className="ph-unmask">{requirementName}</span>
        {policyVersions
          ?.reduce<{ version: string; roleNames: string[] }[]>(
            (final, item) => {
              const existing = final.find((v) => v.version === item.version);

              if (existing) {
                existing.roleNames.push(item.roleName);
                return final;
              }

              final.push({
                version: item.version,
                roleNames: [item.roleName],
              });

              return final;
            },
            []
          )
          ?.map((version) => (
            <Tooltip
              key={version.version}
              title={
                <>
                  Needed for:
                  <br />
                  {version.roleNames.flatMap((roleName) => [
                    `- ${roleName}`,
                    <br />,
                  ])}
                </>
              }
            >
              <Chip
                label={version.version}
                color="default"
                size="small"
                sx={{ ml: 1 }}
              />
            </Tooltip>
          ))}
      </IconRow>
      {dialogHandle.open && (
        <MissingRequirementDialog
          handle={dialogHandle}
          requirement={requirement}
          context={context}
          policy={requirementPolicy}
          v1CaseId={v1CaseId}
          canComplete={canComplete}
          canExempt={canExempt}
        />
      )}
    </>
  );
}
