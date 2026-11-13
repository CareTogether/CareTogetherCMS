import {
  Alert,
  Box,
  Chip,
  Stack,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  DataGridPremium,
  useGridApiRef,
  type GridColDef,
  type GridRenderEditCellParams,
  type GridColumnGroupingModel,
} from '@mui/x-data-grid-premium';
import { useEffect, useMemo, useState } from 'react';
import {
  EffectiveLocationPolicy,
  MonitoringRequirement,
  RecurrencePolicy,
  RequirementDefinition,
} from '../../../../GeneratedClient';
import { v2DataGridStyles } from '../../../../Families/v2DataGridStyles';
import { PolicyGridDraftActions } from './PolicyGridDraftActions';
import { useUnsavedPolicyNavigation } from '../../../../Hooks/useUnsavedPolicyNavigation';
import { usePolicyGridDraft } from './usePolicyGridDraft';
import { discardPolicyGridCellEdits } from './policyGridDraft';
import {
  matrixActions,
  matrixOwner,
  matrixCellHasChanges,
  matrixRequirements,
  matrixScopes,
  applyMatrixEdits,
  matrixPhases,
  type MatrixEdit,
  type MatrixRequirement,
} from './casePolicyMatrix';
import { CasePolicyMatrixCellEditor } from './CasePolicyMatrixCellEditor';
import { variantScheduleSummary } from './arrangementVariantRequirements';

type MatrixCell = {
  dirty: boolean;
  own: MatrixRequirement[];
  shared: MatrixRequirement[];
  edits?: MatrixEdit[];
};
type MatrixRow = {
  id: string;
  actionName: string;
  unresolved: boolean;
  cells: Record<string, MatrixCell>;
};

function summary(cell: MatrixCell, additional: boolean) {
  return (
    [
      ...cell.shared.map(
        (item) =>
          `Shared ${item.phase} ${item.isRequired ? 'Required' : 'Optional'}`
      ),
      ...cell.own.map(
        (item) =>
          `${additional ? 'Additional' : 'Shared'} ${item.phase} ${item.isRequired ? 'Required' : 'Optional'}`
      ),
    ].join('; ') || 'Not used'
  );
}

export function CasePoliciesMatrix({
  policy,
  onPolicyChange,
  onEditingStateChange,
}: {
  policy: EffectiveLocationPolicy;
  onPolicyChange: (policy: EffectiveLocationPolicy) => Promise<boolean>;
  onEditingStateChange?: (state: {
    dirty: boolean;
    editing: boolean;
    saving: boolean;
  }) => void;
}) {
  const theme = useTheme();
  const compact = useMediaQuery(theme.breakpoints.down('sm'));
  const draft = usePolicyGridDraft(policy, onPolicyChange);
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    onEditingStateChange?.({
      dirty: draft.dirty,
      editing,
      saving: draft.saving,
    });
  }, [draft.dirty, draft.saving, editing, onEditingStateChange]);
  useUnsavedPolicyNavigation(editing);
  const apiRef = useGridApiRef();
  const { scopes, issues } = useMemo(
    () => matrixScopes(draft.value),
    [draft.value]
  );
  const rows: MatrixRow[] = useMemo(() => {
    const baseFields = new Set(
      matrixScopes(draft.base).scopes.map((item) => item.field)
    );
    const owners = new Map(
      scopes.map((scope) => [scope.field, matrixOwner(draft.value, scope)])
    );
    const baseOwners = new Map(
      scopes
        .filter((scope) => baseFields.has(scope.field))
        .map((scope) => [scope.field, matrixOwner(draft.base, scope)])
    );
    const baselineScopes = new Set(
      matrixScopes(policy).scopes.map((item) => item.field)
    );
    const requirements = new Map(
      scopes.map((scope) => {
        const owner = matrixOwner(draft.value, scope);
        return [
          scope.field,
          matrixRequirements(
            owner,
            baselineScopes.has(scope.field) ? matrixOwner(policy, scope) : owner
          ),
        ];
      })
    );
    const sharedFields = new Map(
      scopes
        .filter((scope) => !scope.functionName)
        .map((scope) => [scope.arrangement, scope.field])
    );
    const definitions = Object.keys(draft.value.actionDefinitions);
    const actionNames = matrixActions(draft.value);
    return actionNames.map((actionName) => ({
      id: actionName,
      actionName,
      unresolved:
        !actionName.trim() ||
        !Object.hasOwn(draft.value.actionDefinitions, actionName) ||
        actionNames.filter(
          (name) =>
            name.trim().toLowerCase() === actionName.trim().toLowerCase()
        ).length !== 1 ||
        definitions.filter(
          (name) => name.toLowerCase() === actionName.toLowerCase()
        ).length !== 1,
      cells: Object.fromEntries(
        scopes.map((scope) => [
          scope.field,
          {
            dirty:
              baseOwners.has(scope.field) &&
              matrixCellHasChanges(
                baseOwners.get(scope.field)!,
                owners.get(scope.field)!,
                actionName
              ),
            own: requirements
              .get(scope.field)!
              .filter((item) => item.actionName === actionName),
            shared: scope.functionName
              ? requirements
                  .get(sharedFields.get(scope.arrangement)!)!
                  .filter((item) => item.actionName === actionName)
              : [],
          },
        ])
      ),
    }));
  }, [draft.base, draft.value, policy, scopes]);
  const grouping: GridColumnGroupingModel = [];
  for (const scope of scopes) {
    const groupId = JSON.stringify(['arrangement', scope.arrangement]);
    let group = grouping.find((item) => item.groupId === groupId);
    if (!group) {
      group = {
        groupId,
        headerName:
          scope.arrangement + (scope.readOnlyReason ? ' (read-only)' : ''),
        children: [],
      };
      grouping.push(group);
    }
    if (!scope.functionName) {
      group.children.push({ field: scope.field });
      continue;
    }
    const functionId = JSON.stringify([
      'function',
      scope.arrangement,
      scope.functionName,
    ]);
    let fn = group.children.find(
      (item) => 'groupId' in item && item.groupId === functionId
    );
    if (!fn) {
      fn = {
        groupId: functionId,
        headerName: scope.functionName,
        children: [],
      };
      group.children.push(fn);
    }
    if ('groupId' in fn) fn.children.push({ field: scope.field });
  }
  const columns: GridColDef<MatrixRow>[] = [
    {
      field: 'actionName',
      headerName: 'Action Definition',
      minWidth: 140,
      width: compact ? 140 : 240,
      renderCell: ({ row }) => (
        <Stack sx={{ py: 1, whiteSpace: 'normal', overflowWrap: 'anywhere' }}>
          <Typography variant="body2">
            {row.actionName || '(blank reference)'}
          </Typography>
          {row.unresolved && (
            <Typography variant="caption" color="error">
              Unresolved reference · read-only
            </Typography>
          )}
        </Stack>
      ),
    },
    ...scopes.map((scope) => ({
      field: scope.field,
      headerName: scope.label,
      width: 280,
      minWidth: 230,
      editable: true,
      valueGetter: (_value: unknown, row: MatrixRow) =>
        summary(row.cells[scope.field], !!scope.functionName),
      valueSetter: (edits: MatrixEdit[], row: MatrixRow) => ({
        ...row,
        cells: {
          ...row.cells,
          [scope.field]: { ...row.cells[scope.field], edits },
        },
      }),
      renderCell: ({ row }: { row: MatrixRow }) => {
        const cell = row.cells[scope.field];
        return (
          <Stack
            spacing={0.5}
            sx={{
              py: 1,
              whiteSpace: 'normal',
              width: '100%',
              overflowWrap: 'anywhere',
            }}
          >
            {cell.dirty && (
              <Box
                component="span"
                sx={{
                  position: 'absolute',
                  width: '1px',
                  height: '1px',
                  p: 0,
                  margin: '-1px',
                  overflow: 'hidden',
                  clip: 'rect(0, 0, 0, 0)',
                  whiteSpace: 'nowrap',
                  border: 0,
                }}
              >
                Unsaved changes
              </Box>
            )}
            {cell.own.length + cell.shared.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                Not used
              </Typography>
            )}
            {[
              ...cell.shared.map((item) => ({ item, shared: true })),
              ...cell.own.map((item) => ({
                item,
                shared: !scope.functionName,
              })),
            ].map(({ item, shared }, index) => (
              <Stack key={index} spacing={0.25}>
                <Chip
                  size="small"
                  variant={shared ? 'filled' : 'outlined'}
                  color={shared ? 'primary' : 'default'}
                  label={`${shared ? 'Shared' : 'Additional'} · ${item.phase} · ${item.isRequired ? 'Required' : 'Optional'}`}
                  sx={{ maxWidth: '100%', alignSelf: 'flex-start' }}
                />
                {item.phase === 'Monitoring' &&
                  variantScheduleSummary(item.recurrence).map((line, i) => (
                    <Typography variant="caption" key={i}>
                      {line}
                    </Typography>
                  ))}
                {item.readOnlyReason && (
                  <Typography variant="caption" color="text.secondary">
                    {item.readOnlyReason}
                  </Typography>
                )}
              </Stack>
            ))}
          </Stack>
        );
      },
      renderEditCell: (params: GridRenderEditCellParams<MatrixRow>) => (
        <CasePolicyMatrixCellEditor
          params={params}
          requirements={params.row.cells[scope.field].own}
          shared={params.row.cells[scope.field].shared}
          scopeLabel={
            scope.functionName
              ? scope.functionName + ' / ' + scope.variant
              : scope.arrangement + ' / Shared'
          }
          onFinished={() => setEditing(false)}
        />
      ),
    })),
  ];
  return (
    <Stack spacing={2} sx={{ minWidth: 0 }}>
      <Typography variant="body2">
        Shared requirements apply to every variant. Additional requirements
        apply only to the selected assignment variant; they do not override
        Shared. Click a cell or press Enter to edit all of its phases.
      </Typography>
      <PolicyGridDraftActions
        saveSuccessId={draft.saveSuccessId}
        changeCount={draft.changeCount}
        saving={draft.saving}
        editing={editing}
        error={draft.error}
        onSave={() => void draft.save()}
        onCancel={() => {
          if (apiRef.current) discardPolicyGridCellEdits(apiRef.current);
          draft.cancel();
          setEditing(false);
        }}
      />
      {issues.length > 0 && (
        <Alert severity="warning">
          Ambiguous scopes are excluded from the matrix and remain available in
          Manage Arrangements &amp; Functions. {issues.join('; ')}
        </Alert>
      )}
      {scopes.length === 0 && (
        <Alert severity="info">
          No uniquely named arrangements are available. Configure arrangements
          and functions using Manage Arrangements &amp; Functions.
        </Alert>
      )}
      {rows.length === 0 && (
        <Alert severity="info">
          No Action Definitions or requirement references are configured.
        </Alert>
      )}
      <Box
        sx={{
          ...v2DataGridStyles(theme),
          height: { xs: '65vh', md: 650 },
          minWidth: 0,
        }}
      >
        <DataGridPremium<MatrixRow>
          apiRef={apiRef}
          aria-label="Case Policies requirements matrix"
          rows={rows}
          getCellClassName={({ row, field }) =>
            row.cells[field]?.dirty ? 'policy-cell-unsaved' : ''
          }
          columns={columns}
          columnGroupingModel={grouping}
          columnGroupHeaderHeight={42}
          getRowHeight={() => 'auto'}
          getEstimatedRowHeight={() => 120}
          showToolbar
          slotProps={{
            baseButton: { disabled: editing },
            baseIconButton: { disabled: editing },
            baseTextField: { disabled: editing },
          }}
          initialState={{
            pinnedColumns: { left: ['actionName'] },
            density: 'compact',
          }}
          disableRowSelectionOnClick
          disableClipboardPaste
          disableAggregation
          disablePivoting
          disableRowGrouping
          disableColumnMenu={editing}
          disableColumnFilter={editing}
          disableColumnSelector={editing}
          disableColumnReorder={editing}
          disableColumnSorting={editing}
          isCellEditable={({ row, field }) => {
            const scope = scopes.find((item) => item.field === field);
            const own: MatrixRequirement[] = row.cells[field]?.own ?? [];
            return (
              !!scope &&
              !draft.saving &&
              !scope.readOnlyReason &&
              !row.unresolved &&
              (own.some((item) => !item.readOnlyReason) ||
                matrixPhases.some(
                  (phase) => !own.some((item) => item.phase === phase)
                ))
            );
          }}
          onCellClick={(params) => {
            if (
              params.isEditable &&
              apiRef.current!.getCellMode(params.id, params.field) === 'view'
            ) {
              setEditing(true);
              apiRef.current!.startCellEditMode({
                id: params.id,
                field: params.field,
              });
            }
          }}
          onCellEditStart={() => setEditing(true)}
          onCellEditStop={(params, event) => {
            if (params.reason === 'cellFocusOut')
              event.defaultMuiPrevented = true;
            if (params.reason === 'escapeKeyDown') setEditing(false);
          }}
          processRowUpdate={(updated: MatrixRow, original: MatrixRow) => {
            const scope = scopes.find(
              (item) =>
                updated.cells[item.field]?.edits !==
                original.cells[item.field]?.edits
            );
            if (!scope) {
              setEditing(false);
              return original;
            }
            let candidate = draft.value;
            draft.stage((current) => {
              candidate = applyMatrixEdits(
                current,
                policy,
                scope,
                updated.actionName,
                updated.cells[scope.field].edits!,
                (edit, previous) => {
                  const action = new RequirementDefinition({
                    actionName: updated.actionName,
                    isRequired: edit.isRequired,
                  });
                  if (edit.phase !== 'Monitoring') return action;
                  const data = edit.schedule ?? edit.recurrence?.toJSON();
                  const recurrence =
                    previous?.recurrence &&
                    JSON.stringify(data) ===
                      JSON.stringify(previous.recurrence.toJSON())
                      ? previous.recurrence
                      : RecurrencePolicy.fromJS(data);
                  return new MonitoringRequirement({ action, recurrence });
                }
              );
              return candidate;
            });
            setEditing(false);
            const baselineFields = new Set(
              matrixScopes(policy).scopes.map((item) => item.field)
            );
            const baseFields = new Set(
              matrixScopes(draft.base).scopes.map((item) => item.field)
            );
            const projected = new Map(
              scopes.map((item) => {
                const owner = matrixOwner(candidate, item);
                return [
                  item.field,
                  matrixRequirements(
                    owner,
                    baselineFields.has(item.field)
                      ? matrixOwner(policy, item)
                      : owner
                  ).filter(
                    (requirement) =>
                      requirement.actionName === updated.actionName
                  ),
                ];
              })
            );
            return {
              ...updated,
              cells: Object.fromEntries(
                scopes.map((item) => [
                  item.field,
                  {
                    dirty:
                      baseFields.has(item.field) &&
                      matrixCellHasChanges(
                        matrixOwner(draft.base, item),
                        matrixOwner(candidate, item),
                        updated.actionName
                      ),
                    own: projected.get(item.field)!,
                    shared: item.functionName
                      ? projected.get(
                          scopes.find(
                            (shared) =>
                              shared.arrangement === item.arrangement &&
                              !shared.functionName
                          )!.field
                        )!
                      : [],
                  },
                ])
              ),
            };
          }}
          onProcessRowUpdateError={(error) =>
            draft.setError(
              error instanceof Error
                ? error.message
                : 'The cell could not be applied.'
            )
          }
          sx={{
            '& .MuiDataGrid-cell.policy-cell-unsaved, & .MuiDataGrid-cell.policy-cell-unsaved:focus, & .MuiDataGrid-cell.policy-cell-unsaved:focus-within':
              {
                outline: '1px solid',
                outlineColor: 'error.main',
                outlineOffset: '-1px',
              },
            '& .MuiDataGrid-cell--editable': {
              cursor: 'pointer',
              '&:hover': { bgcolor: 'action.hover' },
            },
            '& .MuiDataGrid-cell': { alignItems: 'flex-start' },
          }}
        />
      </Box>
    </Stack>
  );
}
