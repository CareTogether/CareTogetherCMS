import { useRecoilValue } from 'recoil';
import { Permission, RequirementDefinition } from '../GeneratedClient';
import { policyData } from '../Model/ConfigurationModel';
import { useFamilyIdPermissions } from '../Model/SessionModel';
import { useDialogHandle } from '../Hooks/useDialogHandle';
import { IconRow } from '../Generic/IconRow';
import { MissingRequirementDialog } from './MissingRequirementDialog';
import { RequirementContext } from './RequirementContext';
import { Chip } from '@mui/material';

type MissingRequirementRowProps = {
  requirement: string | RequirementDefinition;
  policyVersions?: string[];
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
  const permissions = useFamilyIdPermissions(
    context.kind === 'V1Case' ||
      context.kind === 'Arrangement' ||
      context.kind === 'Family Volunteer Assignment' ||
      context.kind === 'Individual Volunteer Assignment'
      ? context.partneringFamilyId
      : context.volunteerFamilyId
  );

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
    context.kind === 'V1Case'
      ? permissions(Permission.EditV1CaseRequirementCompletion)
      : permissions(Permission.EditApprovalRequirementCompletion);
  const canExempt =
    context.kind === 'V1Case'
      ? permissions(Permission.EditV1CaseRequirementExemption)
      : permissions(Permission.EditApprovalRequirementExemption);

  return (
    <>
      <IconRow
        icon={isAvailableApplication ? '💤' : isRequired ? '❌' : '🔲'}
        onClick={canComplete || canExempt ? dialogHandle.openDialog : undefined}
      >
        <span className="ph-unmask">{requirementName}</span>
        {policyVersions?.map((version) => (
          <Chip
            key={version}
            label={version}
            color="default"
            size="small"
            sx={{ ml: 1 }}
          />
        ))}
      </IconRow>
      {dialogHandle.open && (
        <MissingRequirementDialog
          handle={dialogHandle}
          requirement={requirement}
          context={context}
          policy={requirementPolicy}
          v1CaseId={v1CaseId}
          canExempt={canExempt}
        />
      )}
    </>
  );
}
