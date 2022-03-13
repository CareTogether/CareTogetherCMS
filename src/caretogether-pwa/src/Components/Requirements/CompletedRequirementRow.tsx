import { Tooltip } from "@mui/material";
import { format } from "date-fns";
import { useState } from "react";
import { CompletedRequirementInfo, Permission } from "../../GeneratedClient";
import { useUserLookup } from "../../Model/DirectoryModel";
import { usePermissions } from "../../Model/SessionModel";
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

  const [dialogOpen, setDialogOpen] = useState(false);
  const openDialog = () => setDialogOpen(true);

  const canMarkIncomplete = context.kind === 'Referral' || context.kind === 'Arrangement'
    ? true //TODO: Implement these permissions!
    : permissions(Permission.EditApprovalRequirementCompletion);

  return (
    <>
      <IconRow icon="✅" onClick={canMarkIncomplete ? openDialog : undefined}>
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
      <CompletedRequirementDialog open={dialogOpen} onClose={() => setDialogOpen(false)}
        requirement={requirement} context={context} />
    </>
  );
}
