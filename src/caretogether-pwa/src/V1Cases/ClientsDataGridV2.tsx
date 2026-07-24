import { Box, Stack, Typography, useTheme } from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridColumnVisibilityModel,
} from '@mui/x-data-grid';
import { useEffect, useMemo, useState } from 'react';
import { v2DataGridStyles } from '../Families/v2DataGridStyles';
import { v2Typography } from '../Families/v2Typography';
import { ClientBrowserRowV2 } from './useClientsBrowserViewModel';
import { ClientFamilyCellV2 } from './ClientFamilyCellV2';
import { ClientArrangementSummaryCellV2 } from './ClientArrangementSummaryCellV2';
import type { CustomField } from '../GeneratedClient';

type ClientsDataGridV2Props = {
  assignmentRoles?: string[];
  customFields?: CustomField[];
  loading?: boolean;
  onRowClick: (row: ClientBrowserRowV2) => void;
  rows: ClientBrowserRowV2[];
};

const CLIENTS_GRID_PAGE_SIZE = 100;

function displayValue(value: string) {
  return value || '-';
}

function buildAssignmentColumns(
  assignmentRoles: string[]
): GridColDef<ClientBrowserRowV2>[] {
  return assignmentRoles.map((assignmentRole) => ({
    field: `assignmentRole:${assignmentRole}`,
    flex: 1,
    headerName: assignmentRole,
    minWidth: 160,
    renderCell: ({ row }) => (
      <Typography {...v2Typography.browserCell}>
        {displayValue(row.assignmentRoleValues[assignmentRole] ?? '')}
      </Typography>
    ),
    sortable: false,
    valueGetter: (_value, row) => row.assignmentRoleValues[assignmentRole] ?? '',
  }));
}

function customFieldColumnField(customFieldName: string) {
  return `customField:${customFieldName}`;
}

function buildCustomFieldColumns(
  customFields: CustomField[]
): GridColDef<ClientBrowserRowV2>[] {
  return customFields.map((customField) => ({
    field: customFieldColumnField(customField.name),
    flex: 1,
    headerName: customField.name,
    minWidth: 160,
    renderCell: ({ row }) => (
      <Typography {...v2Typography.browserCell}>
        {displayValue(row.customFieldValues[customField.name] ?? '')}
      </Typography>
    ),
    valueGetter: (_value, row) => row.customFieldValues[customField.name] ?? '',
  }));
}

function buildColumns(
  assignmentRoles: string[],
  customFields: CustomField[]
): GridColDef<ClientBrowserRowV2>[] {
  return [
    {
      field: 'family',
      flex: 1.3,
      headerName: 'Family',
      minWidth: 220,
      renderCell: ({ row }) => (
        <ClientFamilyCellV2
          familyName={displayValue(row.family)}
          phoneNumber={row.phoneNumber}
          primaryContactName={row.primaryContactName}
        />
      ),
    },
    {
      field: 'status',
      flex: 1,
      headerName: 'Status',
      minWidth: 150,
      renderCell: ({ row }) => (
        <Typography {...v2Typography.browserCell} noWrap>
          {displayValue(row.status)}
        </Typography>
      ),
    },
    {
      field: 'county',
      flex: 1,
      headerName: 'County',
      minWidth: 140,
      renderCell: ({ row }) => (
        <Typography {...v2Typography.browserCell}>
          {displayValue(row.county)}
        </Typography>
      ),
    },
    ...buildAssignmentColumns(assignmentRoles),
    ...buildCustomFieldColumns(customFields),
    {
      field: 'arrangements',
      flex: 1.4,
      headerName: 'Arrangements',
      minWidth: 260,
      renderCell: ({ row }) => (
        <ClientArrangementSummaryCellV2
          arrangementRows={row.arrangementRows}
        />
      ),
    },
  ];
}

function ClientsEmptyState() {
  return (
    <Stack
      spacing={0.5}
      sx={{
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 180,
        px: 2,
        textAlign: 'center',
      }}
    >
      <Typography className="ph-unmask" variant="subtitle1">
        No client families found.
      </Typography>
      <Typography
        className="ph-unmask"
        color="text.secondary"
        variant="body2"
      >
        Client families will appear here when they are available.
      </Typography>
    </Stack>
  );
}

export function ClientsDataGridV2({
  assignmentRoles = [],
  customFields = [],
  loading = false,
  onRowClick,
  rows,
}: ClientsDataGridV2Props) {
  const theme = useTheme();
  const columns = useMemo(() => buildColumns(assignmentRoles, customFields), [
    assignmentRoles,
    customFields,
  ]);
  const [columnVisibilityModel, setColumnVisibilityModel] =
    useState<GridColumnVisibilityModel>({});

  useEffect(() => {
    setColumnVisibilityModel((current) => {
      const customFieldColumnFields = new Set(
        customFields.map((customField) =>
          customFieldColumnField(customField.name)
        )
      );
      const next = Object.fromEntries(
        Object.entries(current).filter(
          ([field]) =>
            !field.startsWith('customField:') ||
            customFieldColumnFields.has(field)
        )
      );

      customFieldColumnFields.forEach((field) => {
        if (!(field in next)) {
          next[field] = false;
        }
      });

      return next;
    });
  }, [customFields]);

  return (
    <Box sx={v2DataGridStyles(theme, { height: '100%' })}>
      <DataGrid
        rows={rows}
        columns={columns}
        columnVisibilityModel={columnVisibilityModel}
        columnHeaderHeight={42}
        density="comfortable"
        disableRowSelectionOnClick
        getRowHeight={() => 'auto'}
        getEstimatedRowHeight={() => 72}
        loading={loading}
        onColumnVisibilityModelChange={setColumnVisibilityModel}
        onRowClick={({ row }) => onRowClick(row)}
        pageSizeOptions={[CLIENTS_GRID_PAGE_SIZE]}
        initialState={{
          pagination: {
            paginationModel: { pageSize: CLIENTS_GRID_PAGE_SIZE },
          },
        }}
        slots={{
          noRowsOverlay: ClientsEmptyState,
        }}
      />
    </Box>
  );
}
