import type { ReactNode } from 'react';
import type { GridColDef } from '@mui/x-data-grid-premium';
import {
  DocumentLinkRequirement,
  NoteEntryRequirement,
} from '../../../../GeneratedClient';
import type {
  ActionRequirement,
  EffectiveLocationPolicy,
} from '../../../../GeneratedClient';
import { enumName, formatValidity, listText } from './policyUtils';
import { getRequirementUsage } from './policyReferences';

export type ActionDefinitionGridRow = {
  id: string;
  action: ActionRequirement;
  actionName: string;
  alternateNames: string;
  document: string;
  instructions: string;
  note: string;
  url: string;
  usage: number;
  validity: string;
};

const operationalColumn = {
  aggregable: false,
  chartable: false,
  groupable: false,
  pivotable: false,
};

function displayText(value: string | undefined) {
  return value ?? '-';
}

export function buildActionDefinitionGridRows(
  policy: EffectiveLocationPolicy,
  usage: ReturnType<typeof getRequirementUsage>
): ActionDefinitionGridRow[] {
  return Object.entries(policy.actionDefinitions ?? {}).map(
    ([actionName, action]) => ({
      id: actionName,
      action,
      actionName,
      alternateNames: listText(action.alternateNames),
      document: enumName(DocumentLinkRequirement, action.documentLink),
      instructions: displayText(action.instructions),
      note: enumName(NoteEntryRequirement, action.noteEntry),
      url: displayText(action.infoLink),
      usage: usage.get(actionName)?.length ?? 0,
      validity: formatValidity(action.validity),
    })
  );
}

export function buildActionDefinitionGridColumns(
  renderDeleteAction: (row: ActionDefinitionGridRow) => ReactNode
): GridColDef<ActionDefinitionGridRow>[] {
  return [
    {
      ...operationalColumn,
      field: 'actionName',
      headerName: 'Action Name',
      minWidth: 180,
      flex: 1,
    },
    {
      ...operationalColumn,
      field: 'document',
      headerName: 'Document',
      minWidth: 130,
      flex: 0.6,
    },
    {
      ...operationalColumn,
      field: 'note',
      headerName: 'Note',
      minWidth: 120,
      flex: 0.55,
    },
    {
      ...operationalColumn,
      field: 'instructions',
      headerName: 'Instructions',
      minWidth: 200,
      flex: 1.2,
    },
    {
      ...operationalColumn,
      field: 'url',
      headerName: 'URL',
      minWidth: 180,
      flex: 1,
    },
    {
      ...operationalColumn,
      field: 'validity',
      headerName: 'Validity',
      minWidth: 120,
      flex: 0.55,
    },
    {
      ...operationalColumn,
      field: 'alternateNames',
      headerName: 'Alternate Names',
      minWidth: 180,
      flex: 0.9,
    },
    {
      ...operationalColumn,
      field: 'usage',
      headerName: 'Usage',
      type: 'number',
      align: 'right',
      headerAlign: 'right',
      width: 100,
    },
    {
      ...operationalColumn,
      field: 'actions',
      headerName: 'Actions',
      align: 'right',
      headerAlign: 'right',
      width: 96,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      disableExport: true,
      getApplyQuickFilterFn: () => null,
      renderCell: ({ row }) => renderDeleteAction(row),
    },
  ];
}
