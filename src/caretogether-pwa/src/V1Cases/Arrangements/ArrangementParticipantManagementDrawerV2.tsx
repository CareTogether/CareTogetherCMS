import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Button,
  Chip,
  Drawer,
  IconButton,
  List,
  ListItem,
  Stack,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import {
  FamilyVolunteerAssignment,
  IndividualVolunteerAssignment,
  Permission,
} from '../../GeneratedClient';
import { FamilyName } from '../../Families/FamilyName';
import { PersonName } from '../../Families/PersonName';
import { useDialogHandle } from '../../Hooks/useDialogHandle';
import { useFamilyLookup, usePersonLookup } from '../../Model/DirectoryModel';
import { useFamilyIdPermissions } from '../../Model/SessionModel';
import { AssignArrangementFunctionDialog } from './AssignArrangementFunctionDialog';
import type {
  ArrangementFunctionSummaryV2,
  ArrangementRowV2,
} from './arrangementViewModel';
import { UnassignArrangementFunctionDialog } from './UnassignArrangementFunctionDialog';

type ArrangementParticipantManagementDrawerV2Props = {
  functionSummary: ArrangementFunctionSummaryV2 | null;
  row: ArrangementRowV2 | null;
  open: boolean;
  onClose: () => void;
};

function AssignmentLabel({
  assignment,
}: {
  assignment: FamilyVolunteerAssignment | IndividualVolunteerAssignment;
}) {
  const familyLookup = useFamilyLookup();
  const personLookup = usePersonLookup();

  if (assignment instanceof IndividualVolunteerAssignment) {
    return (
      <PersonName
        person={personLookup(assignment.familyId, assignment.personId)}
      />
    );
  }

  return <FamilyName family={familyLookup(assignment.familyId)} />;
}

export function ArrangementParticipantManagementDrawerV2({
  functionSummary,
  row,
  open,
  onClose,
}: ArrangementParticipantManagementDrawerV2Props) {
  const addAssignmentDialogHandle = useDialogHandle();
  const removeAssignmentDialogHandle = useDialogHandle();
  const [unassignmentParameter, setUnassignmentParameter] = useState<
    FamilyVolunteerAssignment | IndividualVolunteerAssignment | null
  >(null);
  const partneringFamilyId = row?.partneringFamily.family?.id ?? '';
  const permissions = useFamilyIdPermissions(partneringFamilyId);
  const canEditAssignments = permissions(Permission.EditAssignments);

  useEffect(() => {
    setUnassignmentParameter(null);
  }, [functionSummary?.functionName, open]);

  const openUnassignDialog = (
    assignment: FamilyVolunteerAssignment | IndividualVolunteerAssignment
  ) => {
    setUnassignmentParameter(assignment);
    removeAssignmentDialogHandle.openDialog();
  };

  return (
    <>
      <Drawer
        anchor="right"
        aria-labelledby="arrangement-participants-title"
        open={open}
        onClose={onClose}
        slotProps={{
          paper: {
            sx: {
              width: { xs: '100%', sm: 500, md: 560 },
              p: 2,
              pt: { xs: 7, sm: 8, md: 6 },
            },
          },
        }}
      >
        {row && functionSummary && (
          <Stack spacing={2}>
            <Box
              sx={{
                alignItems: 'flex-start',
                display: 'flex',
                gap: 1,
                justifyContent: 'space-between',
              }}
            >
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                  color="text.secondary"
                  sx={{ textTransform: 'uppercase' }}
                  variant="caption"
                >
                  Arrangement Participants
                </Typography>
                <Typography
                  id="arrangement-participants-title"
                  className="ph-unmask"
                  variant="h5"
                >
                  {functionSummary.functionName}
                </Typography>
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ alignItems: 'center', flexWrap: 'wrap', mt: 1 }}
                >
                  <Chip label={functionSummary.statusLabel} size="small" />
                  <Typography color="text.secondary" variant="caption">
                    {functionSummary.requirementLabel}
                  </Typography>
                </Stack>
              </Box>
              <IconButton
                aria-label="close arrangement participant management"
                onClick={onClose}
              >
                <CloseIcon />
              </IconButton>
            </Box>

            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
              <Button
                disabled={!canEditAssignments}
                onClick={addAssignmentDialogHandle.openDialog}
                variant="contained"
              >
                Assign
              </Button>
            </Stack>

            <Stack spacing={1}>
              <Typography variant="subtitle2">Current Assignments</Typography>
              {functionSummary.assignments.length === 0 ? (
                <Typography color="text.secondary" variant="body2">
                  No assignments.
                </Typography>
              ) : (
                <List disablePadding dense>
                  {functionSummary.assignments.map((assignment, index) => (
                    <ListItem
                      key={`${functionSummary.functionName}:${index}`}
                      disableGutters
                      secondaryAction={
                        <Button
                          disabled={!canEditAssignments}
                          onClick={() => openUnassignDialog(assignment)}
                          size="small"
                          variant="outlined"
                        >
                          Unassign
                        </Button>
                      }
                      sx={{ pr: 12 }}
                    >
                      <Stack spacing={0.25}>
                        <Typography className="ph-unmask" variant="body2">
                          <AssignmentLabel assignment={assignment} />
                        </Typography>
                        {assignment.arrangementFunctionVariant && (
                          <Typography color="text.secondary" variant="caption">
                            {assignment.arrangementFunctionVariant}
                          </Typography>
                        )}
                      </Stack>
                    </ListItem>
                  ))}
                </List>
              )}
              {functionSummary.missingVariantLabels.length > 0 && (
                <Typography color="error.main" variant="caption">
                  Missing variant: {functionSummary.missingVariantLabels.join(', ')}
                </Typography>
              )}
            </Stack>
          </Stack>
        )}
      </Drawer>

      {row && functionSummary && addAssignmentDialogHandle.open && (
        <AssignArrangementFunctionDialog
          arrangement={row.source}
          arrangementFunction={functionSummary.functionPolicy}
          arrangementPolicy={row.arrangementPolicy!}
          handle={addAssignmentDialogHandle}
          v1CaseId={row.v1Case.id!}
        />
      )}
      {row &&
        functionSummary &&
        removeAssignmentDialogHandle.open &&
        unassignmentParameter && (
          <UnassignArrangementFunctionDialog
            arrangement={row.source}
            arrangementFunction={functionSummary.functionPolicy}
            arrangementPolicy={row.arrangementPolicy!}
            assignment={unassignmentParameter}
            handle={removeAssignmentDialogHandle}
            partneringFamilyId={partneringFamilyId}
            v1CaseId={row.v1Case.id!}
          />
        )}
    </>
  );
}
