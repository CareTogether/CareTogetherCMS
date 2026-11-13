import { createElement, type ReactNode } from 'react';
import type { GridColDef } from '@mui/x-data-grid-premium';
import {
  DocumentLinkRequirement,
  NoteEntryRequirement,
  ActionRequirement,
} from '../../../../GeneratedClient';
import type { EffectiveLocationPolicy } from '../../../../GeneratedClient';
import { enumName, formatValidity, listText } from './policyUtils';
import { getRequirementUsage } from './policyReferences';
import { ActionValidityEditCell } from './ActionValidityEditCell';

export type ActionDefinitionGridRow = {
  id: string;
  action: ActionRequirement;
  actionName: string;
  alternateNames: string;
  document: DocumentLinkRequirement;
  instructions: string;
  note: NoteEntryRequirement;
  url: string;
  usage: number;
  validity?: string;
};

const operationalColumn = {
  aggregable: false,
  chartable: false,
  groupable: false,
  pivotable: false,
};

export function canEditActionValidity(value?: string) {
  return !value || /^[1-9]\d*\.00:00:00$/.test(value);
}

export function actionDefinitionFromGridRow(row: ActionDefinitionGridRow) {
  if (
    !Object.values(DocumentLinkRequirement)
      .filter((value) => typeof value === 'number')
      .includes(row.document) ||
    !Object.values(NoteEntryRequirement)
      .filter((value) => typeof value === 'number')
      .includes(row.note)
  )
    throw new Error('Select a valid document and notes requirement.');
  if (
    row.validity !== row.action.validity &&
    !canEditActionValidity(row.validity)
  )
    throw new Error(
      'Validity must be a positive whole number of days, months or years.'
    );
  return new ActionRequirement({
    ...row.action,
    documentLink: row.document,
    noteEntry: row.note,
    instructions:
      row.instructions === (row.action.instructions ?? '')
        ? row.action.instructions
        : row.instructions.trim() || undefined,
    infoLink:
      row.url === (row.action.infoLink ?? '')
        ? row.action.infoLink
        : row.url.trim() || undefined,
    validity:
      row.validity === row.action.validity
        ? row.action.validity
        : row.validity || undefined,
  });
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
      document: action.documentLink,
      instructions: action.instructions ?? '',
      note: action.noteEntry,
      url: action.infoLink ?? '',
      usage: usage.get(actionName)?.length ?? 0,
      validity: action.validity,
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
      editable: true,
      type: 'singleSelect',
      valueOptions: [
        DocumentLinkRequirement.None,
        DocumentLinkRequirement.Allowed,
        DocumentLinkRequirement.Required,
      ].map((value) => ({
        value,
        label: enumName(DocumentLinkRequirement, value),
      })),
      headerName: 'Document',
      minWidth: 130,
      flex: 0.6,
    },
    {
      ...operationalColumn,
      field: 'note',
      editable: true,
      type: 'singleSelect',
      valueOptions: [
        NoteEntryRequirement.None,
        NoteEntryRequirement.Allowed,
        NoteEntryRequirement.Required,
      ].map((value) => ({
        value,
        label: enumName(NoteEntryRequirement, value),
      })),
      headerName: 'Note',
      minWidth: 120,
      flex: 0.55,
    },
    {
      ...operationalColumn,
      field: 'instructions',
      editable: true,
      headerName: 'Instructions',
      minWidth: 200,
      flex: 1.2,
    },
    {
      ...operationalColumn,
      field: 'url',
      editable: true,
      headerName: 'URL',
      minWidth: 180,
      flex: 1,
    },
    {
      ...operationalColumn,
      field: 'validity',
      editable: true,
      valueFormatter: (value) => formatValidity(value),
      renderEditCell: (params) => createElement(ActionValidityEditCell, params),
      preProcessEditCellProps: ({ props, row }) => ({
        ...props,
        error:
          props.value !== row.action.validity &&
          !canEditActionValidity(props.value),
      }),
      headerName: 'Validity',
      minWidth: 210,
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
      width: 120,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      disableExport: true,
      getApplyQuickFilterFn: () => null,
      renderCell: ({ row }) => renderDeleteAction(row),
    },
  ];
}
