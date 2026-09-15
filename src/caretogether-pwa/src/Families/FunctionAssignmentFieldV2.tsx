import { useMemo, useState } from 'react';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import { FunctionAssignmentPolicy, V1Case } from '../GeneratedClient';
import { FunctionAssignmentsEditorDrawer } from '../FunctionAssignments/FunctionAssignmentsSection';
import { useFunctionAssignmentsViewModel } from '../FunctionAssignments/useFunctionAssignmentsViewModel';
import { assignmentNamesForRole } from '../FunctionAssignments/assignmentRoleColumns';

type FunctionAssignmentFieldV2Props = {
  v1Case: V1Case;
  assignmentRole: string;
  policy?: FunctionAssignmentPolicy;
  canEdit: boolean;
  onAssign: (personId: string, assignmentRole: string) => Promise<void>;
  onUnassign: (personId: string, assignmentRole: string) => Promise<void>;
};

export function FunctionAssignmentFieldV2({
  v1Case,
  assignmentRole,
  policy,
  canEdit,
  onAssign,
  onUnassign,
}: FunctionAssignmentFieldV2Props) {
  const [open, setOpen] = useState(false);
  const policies = useMemo(() => (policy ? [policy] : []), [policy]);
  const canEditRole = canEdit && policy !== undefined;
  const editorTitle = `Edit ${assignmentRole}`;
  // Restrict both inputs: the shared editor also includes assigned roles
  // that are not in its policy list.
  const assignments = useMemo(
    () =>
      (v1Case.assignedIndividualVolunteers ?? []).filter(
        (assignment) => assignment.assignmentRole === assignmentRole
      ),
    [v1Case.assignedIndividualVolunteers, assignmentRole]
  );
  const { peopleById } = useFunctionAssignmentsViewModel({
    assignments,
    policies,
  });
  const name = assignmentNamesForRole(
    assignments,
    assignmentRole,
    (personId) => peopleById.get(personId)?.person
  );

  return (
    <Box role="group" aria-label={assignmentRole}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontWeight: 600 }}
      >
        {assignmentRole}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography>{name || 'Not assigned'}</Typography>
        {canEditRole && (
          <Tooltip title={editorTitle}>
            <IconButton
              size="small"
              color="primary"
              aria-label={editorTitle}
              onClick={() => setOpen(true)}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      <FunctionAssignmentsEditorDrawer
        title={editorTitle}
        open={open && canEditRole}
        assignments={assignments}
        policies={policies}
        onClose={() => setOpen(false)}
        onAssign={onAssign}
        onUnassign={onUnassign}
      />
    </Box>
  );
}
