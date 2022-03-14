import { format } from "date-fns";
import { useRecoilValue } from "recoil";
import { MissingArrangementRequirement, Permission } from "../../GeneratedClient";
import { policyData } from "../../Model/ConfigurationModel";
import { usePermissions } from "../../Model/SessionModel";
import { useDialogHandle } from "../../useDialogHandle";
import { IconRow } from "../IconRow";
import { MissingRequirementDialog } from "./MissingRequirementDialog";
import { RequirementContext } from "./RequirementContext";

type MissingArrangementRequirementRowProps = {
  requirement: MissingArrangementRequirement;
  context: RequirementContext;
};

export function MissingArrangementRequirementRow({ requirement, context }: MissingArrangementRequirementRowProps) {
  const policy = useRecoilValue(policyData);
  const permissions = usePermissions();
  
  const dialogHandle = useDialogHandle();
  
  const requirementPolicy = policy.actionDefinitions![requirement.actionName!];
  
  const canComplete = context.kind === 'Referral' || context.kind === 'Arrangement'
    ? true //TODO: Implement these permissions!
    : permissions(Permission.EditApprovalRequirementCompletion);

  return (
    <>
      {requirement.dueBy
        ? <IconRow icon='📅' onClick={canComplete ? dialogHandle.openDialog : undefined}>
          {requirement.actionName}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          <span style={{ float: 'right' }}>{format(requirement.dueBy, "M/d/yy h:mm a")}</span>
        </IconRow>
        : <IconRow icon='❌' onClick={canComplete ? dialogHandle.openDialog : undefined}>
          {requirement.actionName}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          {requirement.pastDueSince && <span style={{ float: 'right' }}>{format(requirement.pastDueSince, "M/d/yy h:mm a")}</span>}
        </IconRow>}
      <MissingRequirementDialog handle={dialogHandle}
        requirement={requirement} context={context} policy={requirementPolicy} />
    </>
  );
}
