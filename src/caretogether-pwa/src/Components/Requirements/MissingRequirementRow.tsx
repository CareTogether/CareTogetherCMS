import { useRecoilValue } from "recoil";
import { Permission } from "../../GeneratedClient";
import { policyData } from "../../Model/ConfigurationModel";
import { usePermissions } from "../../Model/SessionModel";
import { useDialogHandle } from "../../useDialogHandle";
import { IconRow } from "../IconRow";
import { MissingRequirementDialog } from "./MissingRequirementDialog";
import { RequirementContext } from "./RequirementContext";

type MissingRequirementRowProps = {
  requirement: string;
  context: RequirementContext;
  isAvailableApplication?: boolean;
};

export function MissingRequirementRow({ requirement, context, isAvailableApplication }: MissingRequirementRowProps) {
  const policy = useRecoilValue(policyData);
  const permissions = usePermissions();
  
  const dialogHandle = useDialogHandle();
  
  const requirementPolicy = policy.actionDefinitions![requirement];

  const canComplete = context.kind === 'Referral' || context.kind === 'Arrangement'
    ? true //TODO: Implement these permissions!
    : permissions(Permission.EditApprovalRequirementCompletion);
  
  return (
    <>
      <IconRow icon={isAvailableApplication ? "💤" : "❌"}
        onClick={canComplete ? dialogHandle.openDialog : undefined}>{requirement}</IconRow>
      <MissingRequirementDialog handle={dialogHandle}
        requirement={requirement} context={context} policy={requirementPolicy} />
    </>
  );
}
