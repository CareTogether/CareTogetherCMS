import { Tooltip } from "@mui/material";
import { format } from "date-fns";
import { CompletedRequirementInfo, Permission } from "../../GeneratedClient";
import { useUserLookup } from "../../Model/DirectoryModel";
import { usePermissions } from "../../Model/SessionModel";
import { useDialogHandle } from "../../useDialogHandle";
import { PersonName } from "../Families/PersonName";
import { IconRow } from "../IconRow";
import { CompletedRequirementDialog } from "./CompletedRequirementDialog";
import { RequirementContext } from "./RequirementContext";

type CompletedRequirementRowProps = {
  requirement: CompletedRequirementInfo;
  context: RequirementContext;
};

export function CompletedRequirementRow({ requirement, context }: CompletedRequirementRowProps) {
  const userLookup = useUserLookup();
  const permissions = usePermissions();

  const dialogHandle = useDialogHandle();

  const canMarkIncomplete = context.kind === 'Referral' || context.kind === 'Arrangement'
    ? true //TODO: Implement these permissions!
    : permissions(Permission.EditApprovalRequirementCompletion);

  return (
    <>
      <IconRow icon="✅" onClick={canMarkIncomplete ? dialogHandle.openDialog : undefined}>
        <Tooltip title={<>
          Completed by <PersonName person={userLookup(requirement.userId)} />
        </>}>
          <span>
            {requirement.requirementName}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            {requirement.completedAtUtc &&
              <span style={{ float: 'right' }}>
                {format(requirement.completedAtUtc, "M/d/yy h:mm a")}
              </span>}
          </span>
        </Tooltip>
      </IconRow>
      {dialogHandle.open && <CompletedRequirementDialog handle={dialogHandle}
        requirement={requirement} context={context} />}
    </>
  );
}
