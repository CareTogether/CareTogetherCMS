import {
  Alert,
  Box,
  Button,
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
import { useLocation } from 'react-router-dom';
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
  arrangementUsedActions,
  matrixActionIsResolved,
  matrixActionPhase,
  type MatrixScope,
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
import { MatrixAddActionDialog } from './MatrixAddActionDialog';
import { MatrixColumnsManagement } from './MatrixColumnsManagement';
import {
  arrangementColumns,
  arrangementVisibilityModel,
  reconcileHiddenArrangements,
  toggleArrangementVisibility,
} from './matrixColumnVisibility';
import { variantScheduleSummary } from './arrangementVariantRequirements';
import {
  CasePolicyMatrixToolbar,
  CasePolicyMatrixHistory,
} from './CasePolicyMatrixToolbar';

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

function MatrixCellContents({
  cell,
  additional,
}: {
  cell: MatrixCell;
  additional: boolean;
}) {
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
        <Typography
          variant="body2"
          color="text.secondary"
          role="img"
          aria-label="Not used"
        >
          —
        </Typography>
      )}
      {[
        ...cell.shared.map((item) => ({ item, shared: true })),
        ...cell.own.map((item) => ({
          item,
          shared: !additional,
        })),
      ].map(({ item, shared }, index) => (
        <Stack key={index} spacing={0.25}>
          <Chip
            size="small"
            variant="outlined"
            label={`${shared ? 'Base' : 'Additional'} · ${item.phase} · ${item.isRequired ? 'Required' : 'Optional'}`}
            sx={{
              maxWidth: '100%',
              alignSelf: 'flex-start',
              bgcolor: 'common.white',
              color: 'text.primary',
              borderColor: 'divider',
            }}
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
}

function updateMatrixPolicy(
  value: EffectiveLocationPolicy,
  baseline: EffectiveLocationPolicy,
  scope: MatrixScope,
  actionName: string,
  edits: MatrixEdit[]
) {
  return applyMatrixEdits(
    value,
    baseline,
    scope,
    actionName,
    edits,
    (edit, previous) => {
      const action = new RequirementDefinition({
        actionName: actionName,
        isRequired: edit.isRequired,
      });
      if (edit.phase !== 'Monitoring') return action;
      const data = edit.schedule ?? edit.recurrence?.toJSON();
      const recurrence =
        previous?.recurrence &&
        JSON.stringify(data) === JSON.stringify(previous.recurrence.toJSON())
          ? previous.recurrence
          : RecurrencePolicy.fromJS(data);
      return new MonitoringRequirement({ action, recurrence });
    }
  );
}

function MatrixGroupHeader({
  name,
  kind,
  readOnly = false,
}: {
  name: string;
  kind: 'arrangement type' | 'function' | 'variant';
  readOnly?: boolean;
}) {
  return (
    <Box
      component="span"
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        minWidth: 0,
        maxWidth: '100%',
      }}
    >
      <Box
        component="span"
        title={name}
        sx={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontWeight: 'var(--unstable_DataGrid-headWeight)',
        }}
      >
        {name}
      </Box>
      {readOnly && (
        <Box component="span" sx={{ flexShrink: 0 }}>
          (read-only)
        </Box>
      )}
      <Box
        component="span"
        sx={{
          fontWeight: 'fontWeightRegular',
          flexShrink: 0,
          whiteSpace: 'nowrap',
        }}
      >
        {`(${kind})`}
      </Box>
    </Box>
  );
}

function summary(cell: MatrixCell, additional: boolean) {
  return (
    [
      ...cell.shared.map(
        (item) =>
          `Base ${item.phase} ${item.isRequired ? 'Required' : 'Optional'}`
      ),
      ...cell.own.map(
        (item) =>
          `${additional ? 'Additional' : 'Base'} ${item.phase} ${item.isRequired ? 'Required' : 'Optional'}`
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
  const draft = usePolicyGridDraft(policy, onPolicyChange, '', true);
  const [cellEditing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [finding, setFinding] = useState<string>();
  const editing = cellEditing || adding;
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
  const { pathname } = useLocation();
  const groups = useMemo(() => arrangementColumns(scopes), [scopes]);
  const [visibility, setVisibility] = useState<{
    scope: string;
    hidden: ReadonlySet<string>;
  }>(() => ({ scope: pathname, hidden: new Set() }));
  const hidden = useMemo(
    () =>
      visibility.scope === pathname
        ? reconcileHiddenArrangements(visibility.hidden, groups)
        : new Set<string>(),
    [visibility, groups, pathname]
  );
  const columnVisibilityModel = useMemo(
    () => arrangementVisibilityModel(groups, hidden),
    [groups, hidden]
  );
  useEffect(() => {
    setVisibility((current) => {
      const next =
        current.scope === pathname
          ? reconcileHiddenArrangements(current.hidden, groups)
          : new Set<string>();
      return current.scope === pathname && current.hidden === next
        ? current
        : { scope: pathname, hidden: next };
    });
  }, [groups, pathname]);
  function toggleVisibility(id: string) {
    if (editing || draft.saving || !groups.some((group) => group.id === id))
      return;
    setVisibility((current) => ({
      scope: pathname,
      hidden: toggleArrangementVisibility(
        current.scope === pathname
          ? reconcileHiddenArrangements(current.hidden, groups)
          : new Set(),
        id
      ),
    }));
  }
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
    const actionNames = arrangementUsedActions(draft.value, draft.base, policy);
    return actionNames.map((actionName) => ({
      id: actionName,
      actionName,
      unresolved: !matrixActionIsResolved(draft.value, actionName),
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
  const actionPhases = useMemo(
    () =>
      new Map(
        rows.map((row) => [
          row.actionName,
          matrixActionPhase(draft.value, policy, row.actionName),
        ])
      ),
    [rows, draft.value, policy]
  );
  useEffect(() => {
    const api = apiRef.current;
    if (!api || !finding || editing) return;
    const actionName = finding;
    let focused = false;
    function focus() {
      if (!api || focused || !api.getRow(actionName)) return;
      const rowIndex = api.getRowIndexRelativeToVisibleRows(actionName);
      if (rowIndex < 0 || rowIndex === undefined) return;
      focused = true;
      api.scrollToIndexes({ rowIndex, colIndex: 0 });
      api.setCellFocus(actionName, 'actionName');
    }
    const unsubscribeRows = api.subscribeEvent('rowsSet', focus);
    const unsubscribeFilters = api.subscribeEvent('filteredRowsSet', focus);
    focus();
    return () => {
      unsubscribeRows();
      unsubscribeFilters();
    };
  }, [apiRef, editing, finding, rows]);
  const grouping: GridColumnGroupingModel = [];
  for (const scope of scopes) {
    const groupId = JSON.stringify(['arrangement', scope.arrangement]);
    let group = grouping.find((item) => item.groupId === groupId);
    if (!group) {
      group = {
        groupId,
        headerName:
          scope.arrangement +
          (scope.readOnlyReason ? ' (read-only)' : '') +
          ' (arrangement type)',
        renderHeaderGroup: () => (
          <MatrixGroupHeader
            name={scope.arrangement}
            kind="arrangement type"
            readOnly={!!scope.readOnlyReason}
          />
        ),
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
        headerName: scope.functionName + ' (function)',
        renderHeaderGroup: () => (
          <MatrixGroupHeader name={scope.functionName!} kind="function" />
        ),
        children: [],
      };
      group.children.push(fn);
    }
    if ('groupId' in fn) fn.children.push({ field: scope.field });
  }
  const columns: GridColDef<MatrixRow>[] = [
    {
      field: 'actionName',
      hideable: false,
      headerName: 'Actions',
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
          {['conflict', 'ambiguous'].includes(
            actionPhases.get(row.actionName)!.status
          ) &&
            !row.unresolved && (
              <Typography variant="caption" color="warning.main">
                {actionPhases.get(row.actionName)!.status === 'conflict'
                  ? 'Phase conflict: ' +
                    [
                      ...new Set(
                        actionPhases
                          .get(row.actionName)!
                          .contributions.map((item) => item.phase)
                      ),
                    ].join(', ')
                  : 'Ambiguous arrangement phase'}
              </Typography>
            )}
        </Stack>
      ),
    },
    ...scopes.map((scope) => ({
      field: scope.field,
      cellClassName: 'policy-requirement-cell',
      hideable: false,
      headerName: scope.functionName ? scope.label + ' (variant)' : scope.label,
      renderHeader: scope.functionName
        ? () => <MatrixGroupHeader name={scope.label} kind="variant" />
        : undefined,
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
      renderCell: ({ row }: { row: MatrixRow }) => (
        <MatrixCellContents
          cell={row.cells[scope.field]}
          additional={!!scope.functionName}
        />
      ),
      renderEditCell: (params: GridRenderEditCellParams<MatrixRow>) => (
        <>
          <Box aria-hidden="true" sx={{ width: '100%' }}>
            <MatrixCellContents
              cell={params.row.cells[scope.field]}
              additional={!!scope.functionName}
            />
          </Box>
          <CasePolicyMatrixCellEditor
            params={params}
            requirements={params.row.cells[scope.field].own}
            shared={params.row.cells[scope.field].shared}
            phaseResolution={actionPhases.get(params.row.actionName)!}
            scopeLabel={
              scope.functionName
                ? scope.functionName + ' / ' + scope.variant
                : scope.arrangement + ' / Base'
            }
            onFinished={() => setEditing(false)}
          />
        </>
      ),
    })),
  ];
  return (
    <CasePolicyMatrixHistory
      value={{
        canUndo: draft.canUndo && !editing,
        canRedo: draft.canRedo && !editing,
        undo: draft.undo,
        redo: draft.redo,
      }}
    >
      <Stack spacing={2} sx={{ minWidth: 0 }}>
        <Typography variant="body2">
          Base requirements apply to every variant. Additional requirements
          apply only to the selected assignment variant; they do not override
          Base. Click a cell or press Enter to edit all of its phases.
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
        <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            disabled={
              editing ||
              draft.saving ||
              !scopes.some((scope) => !scope.readOnlyReason)
            }
            onClick={() => setAdding(true)}
          >
            Add Action
          </Button>
        </Stack>
        {!scopes.some((scope) => !scope.readOnlyReason) && (
          <Typography variant="body2">
            Add Action requires an editable arrangement scope.
          </Typography>
        )}
        {finding && rows.some((row) => row.actionName === finding) && (
          <Alert
            severity="info"
            action={
              <Button
                color="inherit"
                disabled={editing || draft.saving}
                onClick={() => {
                  apiRef.current?.setFilterModel({
                    items: [],
                    quickFilterValues: [],
                  });
                  const rowIndex =
                    apiRef.current?.getRowIndexRelativeToVisibleRows(finding);
                  if (rowIndex !== undefined && rowIndex >= 0) {
                    apiRef.current?.scrollToIndexes({ rowIndex, colIndex: 0 });
                    apiRef.current?.setCellFocus(finding, 'actionName');
                  }
                }}
              >
                Reveal action (clear filters)
              </Button>
            }
          >
            {finding} is in the matrix. If filters hide it, reveal the action to
            configure its available scopes.
          </Alert>
        )}
        {adding && (
          <MatrixAddActionDialog
            policy={draft.value}
            baseline={policy}
            visibleActions={rows.map((row) => row.actionName)}
            onClose={() => setAdding(false)}
            onFind={(name) => {
              setAdding(false);
              setFinding(name);
            }}
            onApply={(name, scope, edit) => {
              draft.stage((current) =>
                updateMatrixPolicy(current, policy, scope, name, [edit])
              );
              setAdding(false);
              setFinding(name);
            }}
          />
        )}
        {issues.length > 0 && (
          <Alert severity="warning">
            Ambiguous scopes are excluded from the matrix and remain available
            in Manage Arrangements &amp; Functions. {issues.join('; ')}
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
            No actions are used in arrangements yet. Use Add Action to configure
            an existing Action Definition.
          </Alert>
        )}
        <Box
          onKeyDown={(event) => {
            if (
              !(event.ctrlKey || event.metaKey) ||
              event.altKey ||
              editing ||
              draft.saving
            )
              return;
            const target = event.target as HTMLElement;
            if (target.closest('input, textarea, [contenteditable="true"]'))
              return;
            const key = event.key.toLowerCase();
            if (key !== 'z' && key !== 'y') return;
            event.preventDefault();
            if (key === 'y' || event.shiftKey) draft.redo();
            else draft.undo();
          }}
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
            columnVisibilityModel={columnVisibilityModel}
            columnGroupHeaderHeight={42}
            getRowHeight={() => 'auto'}
            getEstimatedRowHeight={() => 120}
            showToolbar
            historyStackSize={0}
            slots={{
              toolbar: CasePolicyMatrixToolbar,
              columnsManagement: MatrixColumnsManagement,
            }}
            slotProps={{
              columnsManagement: {
                arrangementVisibility: {
                  groups,
                  hidden,
                  disabled: editing || draft.saving,
                  onToggle: toggleVisibility,
                },
              },
              toolbar: { sx: { flexWrap: 'wrap', flex: '0 0 auto' } },
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
            disableColumnMenu={editing || draft.saving}
            disableColumnFilter={editing}
            disableColumnSelector={editing || draft.saving}
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
                candidate = updateMatrixPolicy(
                  current,
                  policy,
                  scope,
                  updated.actionName,
                  updated.cells[scope.field].edits!
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
              '& .policy-requirement-cell': { bgcolor: 'common.white' },
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
    </CasePolicyMatrixHistory>
  );
}
