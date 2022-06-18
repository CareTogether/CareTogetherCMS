import { Tooltip } from "@mui/material";
import { format } from "date-fns";
import { CompletedRequirementInfo, Permission } from "../../GeneratedClient";
import { useFamilyLookup, usePersonLookup, useUserLookup } from "../../Model/DirectoryModel";
import { usePermissions } from "../../Model/SessionModel";
import { useDialogHandle } from "../../useDialogHandle";
import { FamilyName } from "../Families/FamilyName";
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

  const familyLookup = useFamilyLookup();
  const personLookup = usePersonLookup();
  
  return (
    <>
      <IconRow icon="✅" onClick={canMarkIncomplete ? dialogHandle.openDialog : undefined}>
        <Tooltip title={<>
          Completed by <PersonName person={userLookup(requirement.userId)} />
        </>}>
          <>
            <span>
              {requirement.requirementName}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              {requirement.completedAtUtc &&
                <span style={{ float: 'right' }}>
                  {format(requirement.completedAtUtc, "M/d/yy h:mm a")}
                </span>}
            </span>
            {requirement.expiresAtUtc &&
              <><br /><span style={{ paddingLeft: '30px' }}>
                {requirement.expiresAtUtc > new Date()
                  ? `⏰ Expires ${format(requirement.expiresAtUtc, "M/d/yy h:mm a")}`
                  : <span style={{ fontWeight: 'bold'}}>❌ Expired {format(requirement.expiresAtUtc, "M/d/yy h:mm a")}</span>}
              </span></>}
            {context.kind === 'Family Volunteer Assignment' &&
              <><br/><span style={{ paddingLeft: '30px' }}>
                <FamilyName family={familyLookup(context.assignment.familyId)} />
              </span></>}
            {context.kind === 'Individual Volunteer Assignment' &&
              <><br/><span style={{ paddingLeft: '30px' }}>
                <PersonName person={personLookup(context.assignment.familyId, context.assignment.personId)} />
              </span></>}
          </>
        </Tooltip>
      </IconRow>
      {dialogHandle.open && <CompletedRequirementDialog handle={dialogHandle}
        requirement={requirement} context={context} />}
    </>
  );
}
