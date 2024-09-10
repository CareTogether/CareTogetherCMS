import { TableCell, TableRow } from '@mui/material';
import { useState } from 'react';
import {
  Arrangement,
  ArrangementFunction,
  ArrangementPolicy,
  FamilyVolunteerAssignment,
  FunctionRequirement,
  IndividualVolunteerAssignment,
  Permission,
} from '../../GeneratedClient';
import { useFamilyLookup, usePersonLookup } from '../../Model/DirectoryModel';
import { useFamilyIdPermissions } from '../../Model/SessionModel';
import { useDialogHandle } from '../../Hooks/useDialogHandle';
import { FamilyName } from '../../Families/FamilyName';
import { PersonName } from '../../Families/PersonName';
import { IconRow } from '../../Generic/IconRow';
import { AssignArrangementFunctionDialog } from './AssignArrangementFunctionDialog';
import { UnassignArrangementFunctionDialog } from './UnassignArrangementFunctionDialog';

type ArrangementFunctionRowProps = {
  summaryOnly?: boolean;
  partneringFamilyId: string;
  referralId: string;
  arrangement: Arrangement;
  arrangementPolicy: ArrangementPolicy;
  functionPolicy: ArrangementFunction;
};

export function ArrangementFunctionRow({
  summaryOnly,
  partneringFamilyId,
  referralId,
  arrangement,
  arrangementPolicy,
  functionPolicy,
}: ArrangementFunctionRowProps) {
  const permissions = useFamilyIdPermissions(partneringFamilyId);
  const familyLookup = useFamilyLookup();
  const personLookup = usePersonLookup();

  const addAssignmentDialogHandle = useDialogHandle();
  const removeAssignmentDialogHandle = useDialogHandle();

  const canComplete = permissions(Permission.EditAssignments);

  const assignments = (
    arrangement.familyVolunteerAssignments ||
    ([] as Array<FamilyVolunteerAssignment | IndividualVolunteerAssignment>)
  )
    .concat(arrangement.individualVolunteerAssignments || [])
    .filter(
      (assignment) =>
        assignment.arrangementFunction === functionPolicy.functionName
    ) as Array<FamilyVolunteerAssignment | IndividualVolunteerAssignment>;

  const isMissing =
    !arrangement.familyVolunteerAssignments?.some(
      (x) => x.arrangementFunction === functionPolicy.functionName
    ) &&
    !arrangement.individualVolunteerAssignments?.some(
      (x) => x.arrangementFunction === functionPolicy.functionName
    );

  function isMissingVariant(
    assignment: FamilyVolunteerAssignment | IndividualVolunteerAssignment
  ) {
    return (
      functionPolicy.variants &&
      functionPolicy.variants.length > 0 &&
      !assignment.arrangementFunctionVariant
    );
  }

  const [unassignmentParameter, setUnassignmentParameter] = useState<
    FamilyVolunteerAssignment | IndividualVolunteerAssignment | null
  >(null);
  function openUnassignDialog(
    assignment: FamilyVolunteerAssignment | IndividualVolunteerAssignment
  ) {
    setUnassignmentParameter(assignment);
    removeAssignmentDialogHandle.openDialog();
  }

  return (
    <>
      <TableRow key={functionPolicy.functionName}>
        <TableCell
          sx={{ padding: 0 }}
          colSpan={assignments.length === 0 ? 2 : 1}
          valign="top"
        >
          <IconRow
            icon={
              isMissing
                ? functionPolicy.requirement === FunctionRequirement.ZeroOrMore
                  ? '⚠'
                  : '❌'
                : '✅'
            }
            onClick={
              !summaryOnly && canComplete
                ? addAssignmentDialogHandle.openDialog
                : undefined
            }
          >
            {functionPolicy.functionName}
          </IconRow>
        </TableCell>
        <TableCell sx={{ padding: 0 }}>
          {assignments.map((assignment) => (
            <IconRow
              key={JSON.stringify(assignment)}
              icon=""
              onClick={
                !summaryOnly && canComplete
                  ? openUnassignDialog.bind(null, assignment)
                  : undefined
              }
            >
              <>
                {assignment instanceof FamilyVolunteerAssignment && (
                  <FamilyName family={familyLookup(assignment.familyId)} />
                )}
                {assignment instanceof IndividualVolunteerAssignment && (
                  <PersonName
                    person={personLookup(
                      assignment.familyId,
                      assignment.personId
                    )}
                  />
                )}
                {assignment.arrangementFunctionVariant && (
                  <>
                    <br />
                    <span style={{ paddingLeft: '30px', fontStyle: 'italic' }}>
                      {assignment.arrangementFunctionVariant}
                    </span>
                  </>
                )}
                {isMissingVariant(assignment) && (
                  <>
                    <br />
                    <span
                      style={{
                        paddingLeft: '30px',
                        fontWeight: 'bold',
                        display: 'inline-block',
                      }}
                    >
                      ❌ This assignment is missing a variant! Requirements for
                      this assignment will not be calculated. To fix, remove
                      this assignment and add it back with the correct variant.
                    </span>
                  </>
                )}
              </>
            </IconRow>
          ))}
        </TableCell>
      </TableRow>
      {addAssignmentDialogHandle.open && (
        <AssignArrangementFunctionDialog
          handle={addAssignmentDialogHandle}
          referralId={referralId}
          arrangement={arrangement}
          arrangementPolicy={arrangementPolicy}
          arrangementFunction={functionPolicy}
        />
      )}
      {removeAssignmentDialogHandle.open && (
        <UnassignArrangementFunctionDialog
          handle={removeAssignmentDialogHandle}
          partneringFamilyId={partneringFamilyId}
          referralId={referralId}
          arrangement={arrangement}
          arrangementPolicy={arrangementPolicy}
          arrangementFunction={functionPolicy}
          assignment={unassignmentParameter!}
        />
      )}
    </>
  );
}
