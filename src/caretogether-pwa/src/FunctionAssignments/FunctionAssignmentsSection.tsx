import { Fragment, useEffect, useState } from 'react';
import {
  Autocomplete,
  Box,
  Button,
  Drawer,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  AssignedIndividualVolunteer,
  FunctionAssignmentPolicy,
} from '../GeneratedClient';
import { personNameString } from '../Families/PersonName';
import { useBackdrop } from '../Hooks/useBackdrop';
import { useAppNavigate } from '../Hooks/useAppNavigate';
import {
  buildDraftAssignments,
  functionAssignmentChanges,
} from './functionAssignmentModel';
import { useFunctionAssignmentsViewModel } from './useFunctionAssignmentsViewModel';

type FunctionAssignmentsSectionProps = {
  title?: string;
  assignments: AssignedIndividualVolunteer[];
  policies: FunctionAssignmentPolicy[];
  canEdit: boolean;
  onAssign: (personId: string, assignmentRole: string) => Promise<void>;
  onUnassign: (personId: string, assignmentRole: string) => Promise<void>;
};

type FunctionAssignmentsEditorDrawerProps = {
  open: boolean;
  assignments: AssignedIndividualVolunteer[];
  policies: FunctionAssignmentPolicy[];
  onClose: () => void;
  onAssign: (personId: string, assignmentRole: string) => Promise<void>;
  onUnassign: (personId: string, assignmentRole: string) => Promise<void>;
};

export function FunctionAssignmentsEditorDrawer({
  open,
  assignments,
  policies,
  onClose,
  onAssign,
  onUnassign,
}: FunctionAssignmentsEditorDrawerProps) {
  const withBackdrop = useBackdrop();
  const [draftAssignments, setDraftAssignments] = useState<
    Record<string, string | null>
  >({});
  const [isSaving, setIsSaving] = useState(false);

  const { getOptionsForRole, peopleById, roles } =
    useFunctionAssignmentsViewModel({
      assignments,
      policies,
    });

  useEffect(() => {
    if (!open) {
      setDraftAssignments({});
      return;
    }

    setDraftAssignments(buildDraftAssignments(assignments, roles, peopleById));
  }, [assignments, open, peopleById, roles]);

  function closeDrawer() {
    if (isSaving) return;

    onClose();
  }

  async function saveAssignments() {
    setIsSaving(true);
    try {
      await withBackdrop(async () => {
        for (const change of functionAssignmentChanges(
          assignments,
          roles,
          draftAssignments
        )) {
          if (change.kind === 'unassign') {
            await onUnassign(change.personId, change.assignmentRole);
          } else {
            await onAssign(change.personId, change.assignmentRole);
          }
        }
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={closeDrawer}
      slotProps={{
        paper: {
          sx: {
            width: 500,
            p: 3,
            top: 45,
          },
        },
      }}
    >
      <Stack spacing={2}>
        <Typography variant="h6">Edit Function Assignments</Typography>

        {roles.map((assignmentRole) => {
          const selectedPersonId = draftAssignments[assignmentRole] ?? null;
          const options = getOptionsForRole(assignmentRole, selectedPersonId);
          const selectedCandidate =
            options.find((option) => option.personId === selectedPersonId) ??
            null;

          return (
            <Box key={assignmentRole}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                {assignmentRole}
              </Typography>

              <Autocomplete
                disablePortal
                value={selectedCandidate}
                options={options}
                getOptionLabel={(option) => option.label}
                isOptionEqualToValue={(option, value) =>
                  option.personId === value.personId
                }
                groupBy={(option) => option.candidateType}
                disabled={isSaving}
                noOptionsText="No eligible people available"
                onChange={(_, candidate) => {
                  setDraftAssignments((current) => ({
                    ...current,
                    [assignmentRole]: candidate?.personId ?? null,
                  }));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    label={
                      options.length === 0
                        ? 'No eligible people available'
                        : 'Assigned person'
                    }
                  />
                )}
              />
            </Box>
          );
        })}

        <Stack
          direction="row"
          spacing={2}
          sx={{ justifyContent: 'flex-end' }}
        >
          <Button
            color="secondary"
            variant="contained"
            disabled={isSaving}
            onClick={closeDrawer}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={isSaving}
            onClick={() => {
              void saveAssignments();
            }}
          >
            Save
          </Button>
        </Stack>
      </Stack>
    </Drawer>
  );
}

export function FunctionAssignmentsSection({
  title = 'Function Assignments',
  assignments,
  policies,
  canEdit,
  onAssign,
  onUnassign,
}: FunctionAssignmentsSectionProps) {
  const appNavigate = useAppNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { assignedVolunteerRows, peopleById, roles } =
    useFunctionAssignmentsViewModel({
      assignments,
      policies,
    });

  function openDrawer() {
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
  }

  return (
    <Box className="ph-unmask" sx={{ width: '100%' }}>
      <Stack
        direction="row"
        spacing={2}
        sx={{ alignItems: 'center', mb: 1 }}
      >
        <Typography variant="h3">{title}</Typography>
        {canEdit && (
          <Button variant="outlined" size="small" onClick={openDrawer}>
            Edit assignments
          </Button>
        )}
      </Stack>

      {roles.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No function assignment roles configured.
        </Typography>
      ) : (
        <Stack spacing={0.5}>
          {assignedVolunteerRows.map(({ assignedVolunteers, assignmentRole }) => {
            return (
              <Typography key={assignmentRole}>
                <strong>{assignmentRole}:</strong>{' '}
                {assignedVolunteers.length === 0
                  ? '—'
                  : assignedVolunteers.map((assignment, index) => {
                      const personEntry = peopleById.get(assignment.personId);
                      const name = personNameString(personEntry?.person);

                      return (
                        <Fragment
                          key={`${assignment.assignmentRole}:${assignment.personId}`}
                        >
                          {index > 0 && ', '}
                          {personEntry ? (
                            <Button
                              variant="text"
                              sx={{
                                p: 0,
                                minWidth: 'auto',
                                textTransform: 'none',
                                fontSize: 'inherit',
                                fontWeight: 'inherit',
                                lineHeight: 'inherit',
                                verticalAlign: 'baseline',
                              }}
                              onClick={() =>
                                appNavigate.family(personEntry.familyId)
                              }
                            >
                              {name}
                            </Button>
                          ) : (
                            name
                          )}
                        </Fragment>
                      );
                    })}
              </Typography>
            );
          })}
        </Stack>
      )}

      <FunctionAssignmentsEditorDrawer
        open={drawerOpen}
        assignments={assignments}
        policies={policies}
        onClose={closeDrawer}
        onAssign={onAssign}
        onUnassign={onUnassign}
      />
    </Box>
  );
}
