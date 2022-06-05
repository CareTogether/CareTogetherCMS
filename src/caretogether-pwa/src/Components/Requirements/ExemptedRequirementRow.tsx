import { Tooltip } from "@mui/material";
import { format } from "date-fns";
import { ExemptedRequirementInfo, Permission } from "../../GeneratedClient";
import { useUserLookup } from "../../Model/DirectoryModel";
import { usePermissions } from "../../Model/SessionModel";
import { useDialogHandle } from "../../useDialogHandle";
import { PersonName } from "../Families/PersonName";
import { IconRow } from "../IconRow";
import { ExemptedRequirementDialog } from "./ExemptedRequirementDialog";
import { RequirementContext } from "./RequirementContext";

type ExemptedRequirementRowProps = {
  requirement: ExemptedRequirementInfo;
  context: RequirementContext;
};

export function ExemptedRequirementRow({ requirement, context }: ExemptedRequirementRowProps) {
  const userLookup = useUserLookup();
  const permissions = usePermissions();
  
  const dialogHandle = useDialogHandle();

  const canExempt = context.kind === 'Referral' || context.kind === 'Arrangement'
    ? true //TODO: Implement these permissions!
    : permissions(Permission.EditApprovalRequirementExemption);
  
  return (
    <>
      <IconRow icon="🚫" onClick={canExempt ? dialogHandle.openDialog : undefined}>
        <Tooltip title={<>
          Granted by <PersonName person={userLookup(requirement.userId)} /> {format(requirement.timestampUtc!, "M/d/yy h:mm a")}
        </>}>
          <span>
            {requirement.requirementName}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            {requirement.exemptionExpiresAtUtc &&
              <span style={{ float: 'right' }}>
                until {format(requirement.exemptionExpiresAtUtc, "M/d/yy")}
              </span>}
            <br />
            <span style={{ lineHeight: '1.5em', paddingLeft: 30, fontStyle: 'italic', display: 'inline-block' }}>
              {requirement.additionalComments}
            </span>
          </span>
        </Tooltip>
      </IconRow>
      {dialogHandle.open && <ExemptedRequirementDialog handle={dialogHandle}
        requirement={requirement} context={context} />}
    </>
  );
}
