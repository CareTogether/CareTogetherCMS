import {
  Alert,
  Box,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { DataGridPremium, useGridApiRef } from '@mui/x-data-grid-premium';
import { useCallback, useMemo, useState } from 'react';
import {
  ActionRequirement,
  EffectiveLocationPolicy,
} from '../../../../GeneratedClient';
import { v2DataGridStyles } from '../../../../Families/v2DataGridStyles';
import { useSidePanel } from '../../../../Hooks/useSidePanel';
import {
  usePolicyTransitionGuard,
  useUnsavedPolicyNavigation,
} from '../../../../Hooks/useUnsavedPolicyNavigation';
import {
  ActionDefinitionSidePanel,
  DeleteRowAction,
  EditableActions,
  SectionHeader,
  clonePolicyWithActionDefinition,
  getRequirementUsage,
} from './shared';
import {
  buildActionDefinitionGridColumns,
  buildActionDefinitionGridRows,
  actionDefinitionFromGridRow,
  canEditActionValidity,
  type ActionDefinitionGridRow,
} from './actionDefinitionsDataGrid';
import { usePolicyGridDraft } from './usePolicyGridDraft';
import { PolicyGridDraftActions } from './PolicyGridDraftActions';
import { discardPolicyGridCellEdits } from './policyGridDraft';

function NoActionDefinitionsOverlay() {
  return (
    <Typography color="text.secondary" variant="body2">
      No action definitions configured.
    </Typography>
  );
}

export function ActionDefinitionsTab({
  policy,
  onPolicyChange,
}: {
  policy: EffectiveLocationPolicy;
  onPolicyChange: (policy: EffectiveLocationPolicy) => Promise<boolean>;
}) {
  const theme = useTheme();
  const draft = usePolicyGridDraft(policy, onPolicyChange);
  const apiRef = useGridApiRef();
  const [editing, setEditing] = useState(false);
  const [drawerDirty, setDrawerDirty] = useState(false);
  useUnsavedPolicyNavigation(drawerDirty || editing, draft.saving);
  const canClose = usePolicyTransitionGuard({
    dirty: drawerDirty,
    saving: draft.saving,
  });
  const usage = useMemo(() => getRequirementUsage(draft.value), [draft.value]);
  const rows = useMemo(
    () => buildActionDefinitionGridRows(draft.value, usage),
    [draft.value, usage]
  );
  const {
    SidePanel: ActionSidePanel,
    openSidePanel,
    closeSidePanel,
    requestCloseSidePanel,
  } = useSidePanel({
    onBeforeClose: async () => {
      if (!(await canClose())) return false;
      setDrawerDirty(false);
      return true;
    },
  });
  const [workingAction, setWorkingAction] = useState<
    { actionName?: string; action?: ActionRequirement } | undefined
  >();
  const [editError, setEditError] = useState<string>();
  const saving = draft.saving;

  function openAddAction() {
    setWorkingAction(undefined);
    openSidePanel();
  }

  const openEditAction = useCallback(
    (actionName: string, action: ActionRequirement) => {
      setWorkingAction({ actionName, action });
      openSidePanel();
    },
    [openSidePanel]
  );

  const deleteAction = useCallback(
    (actionName: string) => {
      const actionDefinitions = { ...(draft.value.actionDefinitions ?? {}) };
      delete actionDefinitions[actionName];
      draft.stage(
        new EffectiveLocationPolicy({ ...draft.value, actionDefinitions })
      );
    },
    [draft]
  );
  const columns = useMemo(
    () =>
      buildActionDefinitionGridColumns((row) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Edit details">
            <IconButton
              size="small"
              aria-label={`Edit details ${row.actionName}`}
              disabled={saving || editing}
              onClick={() => openEditAction(row.actionName, row.action)}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <DeleteRowAction
            label={row.actionName}
            disabled={saving || editing}
            onClick={() => deleteAction(row.actionName)}
          />
        </Stack>
      )),
    [deleteAction, openEditAction, saving, editing]
  );

  function processRowUpdate(updated: ActionDefinitionGridRow) {
    const candidate = actionDefinitionFromGridRow(updated);
    draft.stage((current) =>
      clonePolicyWithActionDefinition(
        current,
        updated.actionName,
        updated.actionName,
        candidate
      )
    );
    setEditing(false);
    setEditError(undefined);
    return { ...updated, action: candidate };
  }

  return (
    <Box>
      <SectionHeader
        title="Action Definitions"
        actions={
          <EditableActions onAdd={openAddAction} disabled={saving || editing} />
        }
      />

      {editError && (
        <Alert severity="error" sx={{ mb: 1 }}>
          {editError}
        </Alert>
      )}

      <PolicyGridDraftActions
        saveSuccessId={draft.saveSuccessId}
        changeCount={draft.changeCount}
        saving={saving}
        editing={editing}
        error={draft.error}
        onSave={() => void draft.save()}
        onCancel={() => {
          draft.cancel();
          if (apiRef.current) discardPolicyGridCellEdits(apiRef.current);
          setEditing(false);
          setEditError(undefined);
        }}
      />
      <Box sx={v2DataGridStyles(theme)}>
        <DataGridPremium
          aria-label="Action Definitions"
          apiRef={apiRef}
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
          onCellDoubleClick={(_, event) => {
            event.defaultMuiPrevented = true;
          }}
          onCellEditStart={() => setEditing(true)}
          onCellEditStop={(params, event) => {
            if (params.reason === 'cellFocusOut')
              event.defaultMuiPrevented = true;
            if (params.reason === 'escapeKeyDown') setEditing(false);
          }}
          showToolbar
          autoHeight
          rows={rows}
          columns={columns}
          rowHeight={56}
          columnHeaderHeight={42}
          disableRowSelectionOnClick
          disableClipboardPaste
          disableColumnSorting
          disableAggregation
          disablePivoting
          disableRowGrouping
          hideFooter
          initialState={{ pinnedColumns: { right: ['actions'] } }}
          slots={{ noRowsOverlay: NoActionDefinitionsOverlay }}
          isCellEditable={({ row, field }) =>
            !saving &&
            (field !== 'validity' || canEditActionValidity(row.action.validity))
          }
          processRowUpdate={processRowUpdate}
          sx={{
            '& .MuiDataGrid-cell--editable': {
              cursor: 'text',
              '&:hover': { bgcolor: 'action.hover' },
              '&:focus-within': {
                outline: '2px solid',
                outlineColor: 'primary.main',
              },
            },
          }}
          onProcessRowUpdateError={(error) =>
            setEditError(
              error instanceof Error
                ? error.message
                : 'The change could not be saved.'
            )
          }
        />
      </Box>

      <ActionSidePanel>
        <ActionDefinitionSidePanel
          key={workingAction?.actionName ?? 'new-action-definition'}
          actionName={workingAction?.actionName}
          action={workingAction?.action}
          saveLabel="Apply to draft"
          onDirtyChange={setDrawerDirty}
          existingActionNames={rows.map((row) => row.actionName)}
          onClose={requestCloseSidePanel}
          onSave={(previousName, actionName, action) => {
            draft.stage(
              clonePolicyWithActionDefinition(
                draft.value,
                previousName,
                actionName,
                action
              )
            );
            closeSidePanel();
            setDrawerDirty(false);
          }}
        />
      </ActionSidePanel>
    </Box>
  );
}
