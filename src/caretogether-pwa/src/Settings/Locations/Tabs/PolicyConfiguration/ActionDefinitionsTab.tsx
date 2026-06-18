import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { useMemo, useState } from 'react';
import { ActionRequirement, DocumentLinkRequirement, EffectiveLocationPolicy, NoteEntryRequirement } from '../../../../GeneratedClient';
import { useSidePanel } from '../../../../Hooks/useSidePanel';
import { ActionDefinitionSidePanel, DeleteRowAction, EditableActions, EmptyRow, SectionHeader, ValuesText, clonePolicyWithActionDefinition, enumName, formatValidity, getRequirementUsage } from './shared';

export function ActionDefinitionsTab({
  policy,
  onPolicyChange,
}: {
  policy: EffectiveLocationPolicy;
  onPolicyChange: (policy: EffectiveLocationPolicy) => void;
}) {
  const usage = useMemo(() => getRequirementUsage(policy), [policy]);
  const rows = Object.entries(policy.actionDefinitions ?? {});
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

  function deleteAction(actionName: string) {
    const actionDefinitions = { ...(policy.actionDefinitions ?? {}) };
    delete actionDefinitions[actionName];
    onPolicyChange(
      new EffectiveLocationPolicy({ ...policy, actionDefinitions })
    );
  }

  return (
    <Box>
      <SectionHeader
        title="Action Definitions"
        actions={<EditableActions onAdd={openAddAction} />}
      />

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Action Name</TableCell>
              <TableCell>Document</TableCell>
              <TableCell>Note</TableCell>
              <TableCell>Instructions</TableCell>
              <TableCell>URL</TableCell>
              <TableCell>Validity</TableCell>
              <TableCell>Alternate Names</TableCell>
              <TableCell>Usage</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <EmptyRow colSpan={9} label="No action definitions configured." />
            ) : (
              rows.map(([actionName, action]) => (
                <TableRow
                  key={actionName}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => openEditAction(actionName, action)}
                >
                  <TableCell>{actionName}</TableCell>
                  <TableCell>
                    {enumName(DocumentLinkRequirement, action.documentLink)}
                  </TableCell>
                  <TableCell>
                    {enumName(NoteEntryRequirement, action.noteEntry)}
                  </TableCell>
                  <TableCell>{action.instructions ?? '-'}</TableCell>
                  <TableCell>{action.infoLink ?? '-'}</TableCell>
                  <TableCell>{formatValidity(action.validity)}</TableCell>
                  <TableCell>
                    <ValuesText values={action.alternateNames} />
                  </TableCell>
                  <TableCell>{usage.get(actionName)?.length ?? 0}</TableCell>
                  <TableCell align="right">
                    <DeleteRowAction
                      label={actionName}
                      onClick={() => deleteAction(actionName)}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <ActionSidePanel>
        <ActionDefinitionSidePanel
          key={workingAction?.actionName ?? 'new-action-definition'}
          actionName={workingAction?.actionName}
          action={workingAction?.action}
          existingActionNames={rows.map(([actionName]) => actionName)}
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

