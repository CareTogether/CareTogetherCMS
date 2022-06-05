import { format } from "date-fns";
import { useRecoilValue } from "recoil";
import { MissingArrangementRequirement, Permission } from "../../GeneratedClient";
import { policyData } from "../../Model/ConfigurationModel";
import { useFamilyLookup, usePersonLookup } from "../../Model/DirectoryModel";
import { usePermissions } from "../../Model/SessionModel";
import { useDialogHandle } from "../../useDialogHandle";
import { FamilyName } from "../Families/FamilyName";
import { PersonName } from "../Families/PersonName";
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
  
  const canComplete = context.kind === 'Referral' || context.kind === 'Arrangement' ||
    context.kind === 'Family Volunteer Assignment' || context.kind === 'Individual Volunteer Assignment'
    ? true //TODO: Implement these permissions!
    : permissions(Permission.EditApprovalRequirementCompletion);

  const familyLookup = useFamilyLookup();
  const personLookup = usePersonLookup();

  return (
    <>
      {requirement.dueBy
        ? <IconRow icon='📅' onClick={canComplete ? dialogHandle.openDialog : undefined}>
          {requirement.actionName}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          <span style={{ float: 'right' }}>{format(requirement.dueBy, "M/d/yy h:mm a")}</span>
          {requirement.volunteerFamilyId && !requirement.personId &&
            <><br/><span style={{ paddingLeft: '30px', fontStyle: 'italic' }}>
              <FamilyName family={familyLookup(requirement.volunteerFamilyId)} />
            </span></>}
          {requirement.volunteerFamilyId && requirement.personId &&
            <><br/><span style={{ paddingLeft: '30px', fontStyle: 'italic' }}>
              <PersonName person={personLookup(requirement.volunteerFamilyId, requirement.personId)} />
            </span></>}
        </IconRow>
        : <IconRow icon='❌' onClick={canComplete ? dialogHandle.openDialog : undefined}>
          {requirement.actionName}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          {requirement.pastDueSince && <span style={{ float: 'right' }}>{format(requirement.pastDueSince, "M/d/yy h:mm a")}</span>}
          {requirement.volunteerFamilyId && !requirement.personId &&
            <><br/><span style={{ paddingLeft: '30px', fontStyle: 'italic' }}>
              <FamilyName family={familyLookup(requirement.volunteerFamilyId)} />
            </span></>}
          {requirement.volunteerFamilyId && requirement.personId &&
            <><br/><span style={{ paddingLeft: '30px', fontStyle: 'italic' }}>
              <PersonName person={personLookup(requirement.volunteerFamilyId, requirement.personId)} />
            </span></>}
        </IconRow>}
      {dialogHandle.open && <MissingRequirementDialog handle={dialogHandle}
        requirement={requirement} context={context} policy={requirementPolicy} />}
    </>
  );
}
