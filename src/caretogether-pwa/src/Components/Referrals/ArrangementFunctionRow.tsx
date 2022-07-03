import { TableCell, TableRow } from "@mui/material";
import { useState } from "react";
import { Arrangement, ArrangementFunction, ArrangementPolicy, FamilyVolunteerAssignment, FunctionRequirement, IndividualVolunteerAssignment, Permission } from "../../GeneratedClient";
import { useFamilyLookup, usePersonLookup } from "../../Model/DirectoryModel";
import { usePermissions } from "../../Model/SessionModel";
import { useDialogHandle } from "../../useDialogHandle";
import { FamilyName } from "../Families/FamilyName";
import { PersonName } from "../Families/PersonName";
import { IconRow } from "../IconRow";
import { AssignArrangementFunctionDialog } from "./AssignArrangementFunctionDialog";
import { UnassignArrangementFunctionDialog } from "./UnassignArrangementFunctionDialog";

type ArrangementFunctionRowProps = {
  summaryOnly?: boolean
  partneringFamilyId: string
  referralId: string
  arrangement: Arrangement
  arrangementPolicy: ArrangementPolicy
  functionPolicy: ArrangementFunction
};

export function ArrangementFunctionRow({
  summaryOnly, partneringFamilyId, referralId, arrangement, arrangementPolicy, functionPolicy
}: ArrangementFunctionRowProps) {
  const permissions = usePermissions();
  const familyLookup = useFamilyLookup();
  const personLookup = usePersonLookup();
  
  const addAssignmentDialogHandle = useDialogHandle();
  const removeAssignmentDialogHandle = useDialogHandle();

  const canComplete = permissions(Permission.EditAssignments);
  
  const assignments = (arrangement.familyVolunteerAssignments || [] as Array<FamilyVolunteerAssignment | IndividualVolunteerAssignment>).concat(
    arrangement.individualVolunteerAssignments || []).filter(assignment =>
    assignment.arrangementFunction === functionPolicy.functionName) as Array<FamilyVolunteerAssignment | IndividualVolunteerAssignment>;
  
  const isMissing =
    !arrangement.familyVolunteerAssignments?.some(x => x.arrangementFunction === functionPolicy.functionName) &&
    !arrangement.individualVolunteerAssignments?.some(x => x.arrangementFunction === functionPolicy.functionName);

  const [unassignmentParameter, setUnassignmentParameter] = useState<FamilyVolunteerAssignment | IndividualVolunteerAssignment | null>(null);
  function openUnassignDialog(assignment: FamilyVolunteerAssignment | IndividualVolunteerAssignment) {
    setUnassignmentParameter(assignment);
    removeAssignmentDialogHandle.openDialog();
  }
  
  return (
    <>
      <TableRow key={functionPolicy.functionName}>
        <TableCell sx={{ padding: 0 }} colSpan={assignments.length === 0 ? 2 : 1} valign="top">
          <IconRow icon={isMissing
            ? functionPolicy.requirement === FunctionRequirement.ZeroOrMore ? "⚠" : "❌"
            : "✅"}
            onClick={!summaryOnly && canComplete ? addAssignmentDialogHandle.openDialog : undefined}>
            {functionPolicy.functionName}
          </IconRow>
        </TableCell>
        <TableCell sx={{ padding: 0 }}>
          {assignments.map(assignment =>
            <IconRow key={JSON.stringify(assignment)} icon=''
              onClick={!summaryOnly && canComplete ? openUnassignDialog.bind(null, assignment) : undefined}>
              <>
                {assignment instanceof FamilyVolunteerAssignment &&
                  <FamilyName family={familyLookup(assignment.familyId)} />}
                {assignment instanceof IndividualVolunteerAssignment &&
                  <PersonName person={personLookup(assignment.familyId, assignment.personId)} />}
                {assignment.arrangementFunctionVariant &&
                  <>
                    <br />
                    <span style={{paddingLeft: '30px', fontStyle: 'italic'}}>{assignment.arrangementFunctionVariant}</span>
                  </>}
              </>
            </IconRow>)}
        </TableCell>
      </TableRow>
      {addAssignmentDialogHandle.open && <AssignArrangementFunctionDialog handle={addAssignmentDialogHandle}
        referralId={referralId}
        arrangement={arrangement}
        arrangementPolicy={arrangementPolicy}
        arrangementFunction={functionPolicy} />}
      {removeAssignmentDialogHandle.open && <UnassignArrangementFunctionDialog handle={removeAssignmentDialogHandle}
        partneringFamilyId={partneringFamilyId}
        referralId={referralId}
        arrangement={arrangement}
        arrangementPolicy={arrangementPolicy}
        arrangementFunction={functionPolicy}
        assignment={unassignmentParameter!} />}
    </>
  );
}
