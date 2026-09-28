import { Box, Typography, useTheme } from '@mui/material';
import { DataGridPremium, type GridRowParams } from '@mui/x-data-grid-premium';
import { useCallback, useMemo, useState } from 'react';
import {
  ActionRequirement,
  EffectiveLocationPolicy,
} from '../../../../GeneratedClient';
import { v2DataGridStyles } from '../../../../Families/v2DataGridStyles';
import { useSidePanel } from '../../../../Hooks/useSidePanel';
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
  type ActionDefinitionGridRow,
} from './actionDefinitionsDataGrid';

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
  onPolicyChange: (policy: EffectiveLocationPolicy) => void;
}) {
  const theme = useTheme();
  const usage = useMemo(() => getRequirementUsage(policy), [policy]);
  const rows = useMemo(
    () => buildActionDefinitionGridRows(policy, usage),
    [policy, usage]
  );
  const {
    SidePanel: ActionSidePanel,
    openSidePanel,
    closeSidePanel,
  } = useSidePanel();
  const [workingAction, setWorkingAction] = useState<
    { actionName?: string; action?: ActionRequirement } | undefined
  >();

  function openAddAction() {
    setWorkingAction(undefined);
    openSidePanel();
  }

  function openEditAction(actionName: string, action: ActionRequirement) {
    setWorkingAction({ actionName, action });
    openSidePanel();
  }

  const deleteAction = useCallback(
    (actionName: string) => {
      const actionDefinitions = { ...(policy.actionDefinitions ?? {}) };
      delete actionDefinitions[actionName];
      onPolicyChange(
        new EffectiveLocationPolicy({ ...policy, actionDefinitions })
      );
    },
    [onPolicyChange, policy]
  );
  const columns = useMemo(
    () =>
      buildActionDefinitionGridColumns((row) => (
        <DeleteRowAction
          label={row.actionName}
          onClick={() => deleteAction(row.actionName)}
        />
      )),
    [deleteAction]
  );

  return (
    <Box>
      <SectionHeader
        title="Action Definitions"
        actions={<EditableActions onAdd={openAddAction} />}
      />

      <Box sx={v2DataGridStyles(theme)}>
        <DataGridPremium
          showToolbar
          autoHeight
          rows={rows}
          columns={columns}
          rowHeight={56}
          columnHeaderHeight={42}
          disableRowSelectionOnClick
          disableAggregation
          disablePivoting
          disableRowGrouping
          hideFooter
          slots={{ noRowsOverlay: NoActionDefinitionsOverlay }}
          onRowClick={({ row }: GridRowParams<ActionDefinitionGridRow>) =>
            openEditAction(row.actionName, row.action)
          }
        />
      </Box>

      <ActionSidePanel>
        <ActionDefinitionSidePanel
          key={workingAction?.actionName ?? 'new-action-definition'}
          actionName={workingAction?.actionName}
          action={workingAction?.action}
          existingActionNames={rows.map((row) => row.actionName)}
          onClose={closeSidePanel}
          onSave={(previousName, actionName, action) => {
            onPolicyChange(
              clonePolicyWithActionDefinition(
                policy,
                previousName,
                actionName,
                action
              )
            );
            closeSidePanel();
          }}
        />
      </ActionSidePanel>
    </Box>
  );
}
