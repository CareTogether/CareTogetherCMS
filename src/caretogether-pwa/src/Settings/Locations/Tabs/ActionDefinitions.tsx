import {
  Box,
  Button,
  IconButton,
  Link,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { useCallback, useMemo, useState } from 'react';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import {
  effectiveLocationPolicyEdited,
  policyData,
} from '../../../Model/ConfigurationModel';
import {
  getOrderedActionDefinitionEntries,
  normalizeActionDefinitionOrder,
} from '../../../Model/ActionDefinitionOrder';
import {
  AddActionDefinition,
  ActionDefinitionData,
} from './AddActionDefinition';
import { useSidePanel } from '../../../Hooks/useSidePanel';
import { useUserIsOrganizationAdministrator } from '../../../Model/SessionModel';
import { selectedLocationContextState } from '../../../Model/Data';
import { api } from '../../../Api/Api';
import { EffectiveLocationPolicy } from '../../../GeneratedClient';
import { useBackdrop } from '../../../Hooks/useBackdrop';
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
  const { organizationId, locationId } = useRecoilValue(
    selectedLocationContextState
  );
  const setEditedPolicy = useSetRecoilState(effectiveLocationPolicyEdited);
  const withBackdrop = useBackdrop();

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

  const entries = useMemo(
    () => getOrderedActionDefinitionEntries(effectiveLocationPolicy),
    [effectiveLocationPolicy]
  );
  const actionDefinitionOrder = useMemo(
    () => entries.map(([name]) => name),
    [entries]
  );
  const rowOrderIndexByName = useMemo(
    () =>
      new Map(
        actionDefinitionOrder.map((actionName, index) => [actionName, index])
      ),
    [actionDefinitionOrder]
  );

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

  const moveAction = useCallback(
    async (actionName: string, direction: 'up' | 'down'): Promise<void> => {
      if (!canEdit) return;

      const currentIndex = actionDefinitionOrder.indexOf(actionName);
      if (currentIndex < 0) return;

      const targetIndex =
        direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= actionDefinitionOrder.length) return;

      const nextOrder = [...actionDefinitionOrder];
      [nextOrder[currentIndex], nextOrder[targetIndex]] = [
        nextOrder[targetIndex],
        nextOrder[currentIndex],
      ];

      await withBackdrop(async () => {
        const currentPolicy = await api.configuration.getEffectiveLocationPolicy(
          organizationId,
          locationId
        );

        const updatedPolicy = new EffectiveLocationPolicy({
          ...currentPolicy,
          actionDefinitionOrder: normalizeActionDefinitionOrder(
            currentPolicy.actionDefinitions,
            nextOrder
          ),
        });

        const savedPolicy = await api.configuration.putEffectiveLocationPolicy(
          organizationId,
          locationId,
          updatedPolicy
        );

        setEditedPolicy(savedPolicy);
      });
    },
    [
      canEdit,
      actionDefinitionOrder,
      withBackdrop,
      organizationId,
      locationId,
      setEditedPolicy,
    ]
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
      {
        field: 'orderActions',
        headerName: 'Order',
        minWidth: 96,
        width: 96,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (params) => {
          if (!canEdit) return '-';

          const rowIndex = rowOrderIndexByName.get(params.row.name) ?? -1;
          const isFirst = rowIndex <= 0;
          const isLast =
            rowIndex < 0 || rowIndex === actionDefinitionOrder.length - 1;

          return (
            <Stack direction="row" spacing={0.5} onClick={(e) => e.stopPropagation()}>
              <Tooltip title="Move up">
                <span>
                  <IconButton
                    size="small"
                    disabled={isFirst}
                    onClick={(e) => {
                      e.stopPropagation();
                      void moveAction(params.row.name, 'up');
                    }}
                  >
                    <ArrowUpwardIcon fontSize="inherit" />
                  </IconButton>
                </span>
              </Tooltip>

              <Tooltip title="Move down">
                <span>
                  <IconButton
                    size="small"
                    disabled={isLast}
                    onClick={(e) => {
                      e.stopPropagation();
                      void moveAction(params.row.name, 'down');
                    }}
                  >
                    <ArrowDownwardIcon fontSize="inherit" />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          );
        },
      },
    ],
    [canEdit, rowOrderIndexByName, actionDefinitionOrder.length, moveAction]
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
