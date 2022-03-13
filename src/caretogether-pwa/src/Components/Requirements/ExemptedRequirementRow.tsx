import { Tooltip } from "@mui/material";
import { format } from "date-fns";
import { useState } from "react";
import { ExemptedRequirementInfo, Permission } from "../../GeneratedClient";
import { useUserLookup } from "../../Model/DirectoryModel";
import { usePermissions } from "../../Model/SessionModel";
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

  const [dialogOpen, setDialogOpen] = useState(false);
  const openDialog = () => setDialogOpen(true);

  const canExempt = context.kind === 'Referral' || context.kind === 'Arrangement'
    ? true //TODO: Implement these permissions!
    : permissions(Permission.EditApprovalRequirementExemption);

  return (
    <>
      <IconRow icon="🚫" onClick={canExempt ? openDialog : undefined}>
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
            <span style={{ lineHeight: '1.5em', paddingLeft: 30, fontStyle: 'italic' }}>
              {requirement.additionalComments}
            </span>
          </span>
        </Tooltip>
      </IconRow>
      <ExemptedRequirementDialog open={dialogOpen} onClose={() => setDialogOpen(false)}
        requirement={requirement} context={context} />
    </>
  );
}
