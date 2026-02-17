import { Box, Button, Typography, Link } from '@mui/material';
import { useState, useMemo } from 'react';
import { useRecoilValue } from 'recoil';
import { policyData } from '../../../Model/ConfigurationModel';
import {
  AddActionDefinition,
  ActionDefinitionData,
} from './AddActionDefinition';
import { useSidePanel } from '../../../Hooks/useSidePanel';
import { useUserIsOrganizationAdministrator } from '../../../Model/SessionModel';
import {
  DataGrid,
  GridColDef,
  GridRowParams,
  GridToolbar,
} from '@mui/x-data-grid';

type ActionDefinitionRow = {
  id: string;
  name: string;
  alternateNames: string[];
  documentRequirement: 0 | 1 | 2;
  noteRequirement: 0 | 1 | 2;
  instructions?: string;
  infoLink?: string;
  validity?: string;
  canView?: string;
  canEdit?: string;
};

const requirementLabel: Record<number, string> = {
  0: 'None',
  1: 'Allowed',
  2: 'Required',
};

function truncate(text?: string | null, length = 40) {
  if (!text) return '-';
  return text.length <= length ? text : text.slice(0, length) + '…';
}

function formatValidity(value?: string | null) {
  if (!value) return '-';
  const [days] = value.split('.');
  return `${days} days`;
}

function parseValidityInDays(value?: string | null) {
  if (!value) return null;
  const [days] = value.split('.');
  const parsed = Number.parseInt(days, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function ActionDefinitions() {
  const effectiveLocationPolicy = useRecoilValue(policyData);
  const actionDefinitions = effectiveLocationPolicy?.actionDefinitions;

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const canEdit = useUserIsOrganizationAdministrator();

  const {
    SidePanel: SidePanelAdd,
    openSidePanel: openSidePanelAdd,
    closeSidePanel: closeSidePanelAdd,
  } = useSidePanel();
  const {
    SidePanel: SidePanelEdit,
    openSidePanel: openSidePanelEdit,
    closeSidePanel: closeSidePanelEdit,
  } = useSidePanel();
  const [workingActionDefinition, setWorkingActionDefinition] =
    useState<ActionDefinitionData | null>(null);

  const entries = Object.entries(actionDefinitions ?? {});

  const rows = useMemo<ActionDefinitionRow[]>(
    () =>
      entries.map(([name, def]) => ({
        id: name,
        name,
        alternateNames: def.alternateNames ?? [],
        documentRequirement: def.documentLink as 0 | 1 | 2,
        noteRequirement: def.noteEntry as 0 | 1 | 2,
        instructions: def.instructions ?? undefined,
        infoLink: def.infoLink ?? undefined,
        validity: def.validity ?? undefined,
        canView: def.canView,
        canEdit: def.canEdit,
      })),
    [entries]
  );

  const columns = useMemo<GridColDef<ActionDefinitionRow>[]>(
    () => [
      {
        field: 'name',
        headerName: 'Name',
        minWidth: 220,
        flex: 1.2,
        renderCell: (params) => (
          <Box sx={{ py: 0.5 }}>
            <Typography variant="body2">{params.row.name}</Typography>
            {params.row.alternateNames.length > 0 && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ display: 'block', mt: 0.5 }}
              >
                {params.row.alternateNames.join(', ')}
              </Typography>
            )}
          </Box>
        ),
      },
      {
        field: 'documentRequirement',
        headerName: 'Document Link',
        minWidth: 140,
        flex: 0.7,
        valueFormatter: (params) =>
          requirementLabel[params.value as number] ?? '-',
      },
      {
        field: 'noteRequirement',
        headerName: 'Note',
        minWidth: 110,
        flex: 0.6,
        valueFormatter: (params) =>
          requirementLabel[params.value as number] ?? '-',
      },
      {
        field: 'instructions',
        headerName: 'Instructions',
        minWidth: 180,
        flex: 1,
        renderCell: (params) => truncate(params.row.instructions),
      },
      {
        field: 'infoLink',
        headerName: 'Info Link',
        minWidth: 220,
        flex: 1,
        sortable: false,
        renderCell: (params) =>
          params.row.infoLink ? (
            <Link
              href={params.row.infoLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              {params.row.infoLink}
            </Link>
          ) : (
            '-'
          ),
      },
      {
        field: 'validity',
        headerName: 'Validity',
        minWidth: 110,
        flex: 0.6,
        renderCell: (params) => formatValidity(params.row.validity),
      },
    ],
    []
  );

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Action Definitions
      </Typography>

      <Box sx={{ width: '100%', mb: 1 }}>
        <DataGrid
          autoHeight
          rows={rows}
          columns={columns}
          pageSize={rowsPerPage}
          onPageSizeChange={(newPageSize) => setRowsPerPage(newPageSize)}
          rowsPerPageOptions={[5, 10, 25, 50]}
          pagination
          rowHeight={64}
          disableSelectionOnClick
          components={{ Toolbar: GridToolbar }}
          componentsProps={{
            toolbar: {
              showQuickFilter: true,
              quickFilterProps: { debounceMs: 300 },
            },
          }}
          localeText={{
            noRowsLabel: 'No action definitions yet for this location.',
          }}
          initialState={{
            sorting: {
              sortModel: [{ field: 'name', sort: 'asc' }],
            },
          }}
          onRowClick={(params: GridRowParams<ActionDefinitionRow>) => {
            if (!canEdit) return;
            const row = params.row;
            setWorkingActionDefinition({
              originalActionName: row.name,
              name: row.name,
              alternateNames: row.alternateNames,
              instructions: row.instructions,
              infoLink: row.infoLink,
              documentRequirement: row.documentRequirement,
              noteRequirement: row.noteRequirement,
              validityInDays: parseValidityInDays(row.validity),
              canView: row.canView,
              canEdit: row.canEdit,
            });
            openSidePanelEdit();
          }}
          sx={{
            '& .MuiDataGrid-row': {
              cursor: canEdit ? 'pointer' : 'default',
            },
          }}
        />
      </Box>

      {canEdit && (
        <>
          <Button
            sx={{ marginY: 2 }}
            variant="contained"
            onClick={() => openSidePanelAdd()}
          >
            Add new action definition
          </Button>

          <SidePanelAdd>
            <AddActionDefinition
              onClose={() => {
                closeSidePanelAdd();
              }}
            />
          </SidePanelAdd>

          <SidePanelEdit>
            <AddActionDefinition
              data={workingActionDefinition ?? undefined}
              onClose={() => {
                closeSidePanelEdit();
              }}
            />
          </SidePanelEdit>
        </>
      )}
    </Box>
  );
}
