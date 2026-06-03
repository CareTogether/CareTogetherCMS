import { Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { FunctionAssignmentEligibility, FunctionAssignmentPolicy, MonitoringRequirement, RecurrencePolicy, RequirementDefinition } from '../../../../GeneratedClient';
import { listText, summarizeCount } from './policyUtils';
import { DeleteRowAction, DuplicateRowAction, EmptyRow } from './sharedUi';

export function EligibilitySummary({
  eligibility,
}: {
  eligibility?: FunctionAssignmentEligibility;
}) {
  if (!eligibility) return <Typography variant="body2">-</Typography>;

  return (
    <Stack spacing={0.5}>
      <Typography variant="body2">
        Location Roles: {listText(eligibility.eligibleLocationRoles)}
      </Typography>
      <Typography variant="body2">
        Individual Volunteer Roles:{' '}
        {listText(eligibility.eligibleIndividualVolunteerRoles)}
      </Typography>
      <Typography variant="body2">
        Volunteer Family Roles:{' '}
        {listText(eligibility.eligibleVolunteerFamilyRoles)}
      </Typography>
      <Typography variant="body2">
        Eligible People:{' '}
        {summarizeCount(
          eligibility.eligiblePeople?.length ?? 0,
          'person',
          'people'
        )}
      </Typography>
    </Stack>
  );
}

export function FunctionAssignmentPoliciesTable({
  policies,
  emptyLabel,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  policies?: FunctionAssignmentPolicy[];
  emptyLabel: string;
  onEdit?: (policy: FunctionAssignmentPolicy) => void;
  onDuplicate?: (policy: FunctionAssignmentPolicy) => void;
  onDelete?: (policy: FunctionAssignmentPolicy) => void;
}) {
  const rows = policies ?? [];
  const hasActions = Boolean(onDuplicate || onDelete);

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Function</TableCell>
            <TableCell>Eligibility</TableCell>
            {hasActions && <TableCell align="right">Actions</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <EmptyRow colSpan={hasActions ? 3 : 2} label={emptyLabel} />
          ) : (
            rows.map((policy) => (
              <TableRow
                key={policy.assignmentRole}
                hover={Boolean(onEdit)}
                sx={onEdit ? { cursor: 'pointer' } : undefined}
                onClick={() => onEdit?.(policy)}
              >
                <TableCell>{policy.assignmentRole}</TableCell>
                <TableCell>
                  <EligibilitySummary eligibility={policy.eligibility} />
                </TableCell>
                {hasActions && (
                  <TableCell align="right">
                    <Stack
                      direction="row"
                      justifyContent="flex-end"
                      spacing={0.5}
                    >
                      {onDuplicate && (
                        <DuplicateRowAction
                          label={policy.assignmentRole}
                          onClick={() => onDuplicate(policy)}
                        />
                      )}
                      {onDelete && (
                        <DeleteRowAction
                          label={policy.assignmentRole}
                          onClick={() => onDelete(policy)}
                        />
                      )}
                    </Stack>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export function RecurrenceSummary({ recurrence }: { recurrence?: RecurrencePolicy }) {
  if (!recurrence) return <Typography variant="body2">-</Typography>;

  const data = recurrence.toJSON();
  const discriminator = data.discriminator ?? recurrence.constructor.name;

  if ('stages' in data && Array.isArray(data.stages)) {
    return (
      <Stack spacing={0.5}>
        <Typography variant="body2">{discriminator}</Typography>
        <Typography variant="body2" color="text.secondary">
          {data.stages
            .map(
              (
                stage: { delay?: string; maxOccurrences?: number },
                index: number
              ) =>
                `${index + 1}: ${stage.delay ?? 'no delay'}, ${
                  typeof stage.maxOccurrences === 'undefined'
                    ? 'unlimited'
                    : `${stage.maxOccurrences} occurrence(s)`
                }`
            )
            .join(' | ')}
        </Typography>
      </Stack>
    );
  }

  return (
    <Typography variant="body2">
      {discriminator}
      {data.delay ? `, delay ${data.delay}` : ''}
    </Typography>
  );
}

export function RequirementsTable({
  requirements,
  emptyLabel,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  requirements?: RequirementDefinition[];
  emptyLabel: string;
  onEdit?: (requirement: RequirementDefinition) => void;
  onDuplicate?: (requirement: RequirementDefinition) => void;
  onDelete?: (requirement: RequirementDefinition) => void;
}) {
  const rows = requirements ?? [];
  const hasActions = Boolean(onDuplicate || onDelete);

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Action Name</TableCell>
            <TableCell>Required</TableCell>
            {hasActions && <TableCell align="right">Actions</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <EmptyRow colSpan={hasActions ? 3 : 2} label={emptyLabel} />
          ) : (
            rows.map((requirement) => (
              <TableRow
                key={requirement.actionName}
                hover={Boolean(onEdit)}
                sx={onEdit ? { cursor: 'pointer' } : undefined}
                onClick={() => onEdit?.(requirement)}
              >
                <TableCell>{requirement.actionName}</TableCell>
                <TableCell>{requirement.isRequired ? 'Yes' : 'No'}</TableCell>
                {hasActions && (
                  <TableCell align="right">
                    <Stack
                      direction="row"
                      justifyContent="flex-end"
                      spacing={0.5}
                    >
                      {onDuplicate && (
                        <DuplicateRowAction
                          label={requirement.actionName}
                          onClick={() => onDuplicate(requirement)}
                        />
                      )}
                      {onDelete && (
                        <DeleteRowAction
                          label={requirement.actionName}
                          onClick={() => onDelete(requirement)}
                        />
                      )}
                    </Stack>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export function MonitoringRequirementsTable({
  requirements,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  requirements?: MonitoringRequirement[];
  onEdit?: (requirement: MonitoringRequirement) => void;
  onDuplicate?: (requirement: MonitoringRequirement) => void;
  onDelete?: (requirement: MonitoringRequirement) => void;
}) {
  const rows = requirements ?? [];
  const hasActions = Boolean(onDuplicate || onDelete);

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Action Name</TableCell>
            <TableCell>Required</TableCell>
            <TableCell>Recurrence</TableCell>
            {hasActions && <TableCell align="right">Actions</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <EmptyRow
              colSpan={hasActions ? 4 : 3}
              label="No monitoring requirements configured."
            />
          ) : (
            rows.map((requirement, index) => (
              <TableRow
                key={`${requirement.action?.actionName}-${index}`}
                hover={Boolean(onEdit)}
                sx={onEdit ? { cursor: 'pointer' } : undefined}
                onClick={() => onEdit?.(requirement)}
              >
                <TableCell>{requirement.action?.actionName}</TableCell>
                <TableCell>
                  {requirement.action?.isRequired ? 'Yes' : 'No'}
                </TableCell>
                <TableCell>
                  <RecurrenceSummary recurrence={requirement.recurrence} />
                </TableCell>
                {hasActions && (
                  <TableCell align="right">
                    <Stack
                      direction="row"
                      justifyContent="flex-end"
                      spacing={0.5}
                    >
                      {onDuplicate && (
                        <DuplicateRowAction
                          label={requirement.action?.actionName ?? 'action'}
                          onClick={() => onDuplicate(requirement)}
                        />
                      )}
                      {onDelete && (
                        <DeleteRowAction
                          label={requirement.action?.actionName ?? 'action'}
                          onClick={() => onDelete(requirement)}
                        />
                      )}
                    </Stack>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

