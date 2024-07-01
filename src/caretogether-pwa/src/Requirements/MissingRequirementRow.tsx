import { useRecoilValue } from "recoil";
import { Permission } from "../GeneratedClient";
import { policyData } from "../Model/ConfigurationModel";
import { useFamilyIdPermissions } from "../Model/SessionModel";
import { useDialogHandle } from "../Hooks/useDialogHandle";
import { IconRow } from "../Generic/IconRow";
import { MissingRequirementDialog } from "./MissingRequirementDialog";
import { RequirementContext } from "./RequirementContext";
import { Chip } from "@mui/material";

type MissingRequirementRowProps = {
  requirement: string;
  policyVersion?: string;
  context: RequirementContext;
  isAvailableApplication?: boolean;
};

export function MissingRequirementRow({ requirement, policyVersion, context, isAvailableApplication }: MissingRequirementRowProps) {
  const policy = useRecoilValue(policyData);
  const permissions = useFamilyIdPermissions(
    context.kind === 'Referral' ||
      context.kind === 'Arrangement' ||
      context.kind === 'Family Volunteer Assignment' ||
      context.kind === 'Individual Volunteer Assignment'
      ? context.partneringFamilyId
      : context.volunteerFamilyId
  );

  const dialogHandle = useDialogHandle();

  const requirementPolicy = policy.actionDefinitions![requirement];

  if (context.kind === 'Arrangement' ||
    context.kind === 'Family Volunteer Assignment' ||
    context.kind === 'Individual Volunteer Assignment')
    throw new Error(`Invalid missing requirement context '${context.kind}'`);

  const canComplete = context.kind === 'Referral'
    ? permissions(Permission.EditReferralRequirementCompletion)
    : permissions(Permission.EditApprovalRequirementCompletion);
  const canExempt = context.kind === 'Referral'
    ? permissions(Permission.EditReferralRequirementExemption)
    : permissions(Permission.EditApprovalRequirementExemption);

  return (
    <>
      <IconRow icon={isAvailableApplication ? "💤" : "❌"}
        onClick={canComplete || canExempt ? dialogHandle.openDialog : undefined}>
        {requirement}
        {policyVersion && <Chip label={policyVersion} color='default' size='small' sx={{ ml: 1 }} />}
      </IconRow>
      {dialogHandle.open && <MissingRequirementDialog handle={dialogHandle}
        requirement={requirement} context={context} policy={requirementPolicy} />}
    </>
  );
}
