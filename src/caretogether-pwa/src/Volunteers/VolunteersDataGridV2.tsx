import {
  Box,
  Chip,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { Check as CheckIcon } from '@mui/icons-material';
import {
  DataGrid,
  GridColDef,
  GridRowSelectionModel,
} from '@mui/x-data-grid';
import { useMemo } from 'react';
import { CustomField } from '../GeneratedClient';
import { TestFamilyBadge } from '../Families/TestFamilyBadge';
import { v2DataGridStyles } from '../Families/v2DataGridStyles';
import { v2Typography } from '../Families/v2Typography';
import { VolunteerApprovalRolesCellV2 } from './VolunteerApprovalRolesCellV2';
import { renderVolunteerCustomFieldValue } from './VolunteerApprovalTab/volunteerCustomFieldPresentation';
import { VolunteerBrowserRowV2 } from './useVolunteersBrowserViewModel';

const MAX_VISIBLE_MISSING_REQUIREMENTS = 4;
const BULK_ACTION_SELECTION_TOOLTIP = 'Select families to enable bulk actions.';

function MissingRequirementsCell({ row }: { row: VolunteerBrowserRowV2 }) {
  const missingRequirements = row.missingRequirementGroups.flatMap(
    (group) => group.requirements
  );

  if (!missingRequirements.length) {
    return (
      <Chip
        color="success"
        icon={<CheckIcon />}
        label="Complete"
        size="small"
        variant="outlined"
      />
    );
  }

  let visibleCount = 0;
  const visibleGroups = row.missingRequirementGroups.flatMap((group) => {
    if (visibleCount >= MAX_VISIBLE_MISSING_REQUIREMENTS) {
      return [];
    }

    const requirements = group.requirements.slice(
      0,
      MAX_VISIBLE_MISSING_REQUIREMENTS - visibleCount
    );
    visibleCount += requirements.length;

    return [{ ...group, requirements }];
  });
  const hiddenCount = missingRequirements.length - visibleCount;
  const tooltipTitle = row.missingRequirementGroups
    .map((group) => `${group.label}:\n${group.requirements.join('\n')}`)
    .join('\n');

  return (
    <Tooltip
      title={<span style={{ whiteSpace: 'pre-line' }}>{tooltipTitle}</span>}
    >
      <Stack spacing={0.25} sx={{ minWidth: 0 }}>
        {visibleGroups.map((group) => (
          <Box key={group.label} sx={{ minWidth: 0 }}>
            <Typography noWrap {...v2Typography.fieldLabel}>
              {group.label}
            </Typography>
            {group.requirements.map((requirement) => (
              <Typography
                key={`${group.label}:${requirement}`}
                noWrap
                {...v2Typography.browserSecondary}
              >
                • {requirement}
              </Typography>
            ))}
          </Box>
        ))}
        {hiddenCount > 0 && (
          <Typography noWrap {...v2Typography.browserSecondary}>
            +{hiddenCount} more
          </Typography>
        )}
      </Stack>
    </Tooltip>
  );
}

type VolunteersDataGridV2Props = {
  customFields: CustomField[];
  loading?: boolean;
  onRowClick: (row: VolunteerBrowserRowV2) => void;
  onRowSelectionModelChange: (model: GridRowSelectionModel) => void;
  rowSelectionModel: GridRowSelectionModel;
  rows: VolunteerBrowserRowV2[];
  updateTestFamilyFlagEnabled?: boolean;
};

function buildColumns(
  customFields: CustomField[],
  updateTestFamilyFlagEnabled?: boolean
): GridColDef<VolunteerBrowserRowV2>[] {
  const fixedColumns: GridColDef<VolunteerBrowserRowV2>[] = [
    {
      field: 'family',
      headerName: 'Family Name',
      flex: 1,
      minWidth: 220,
      renderCell: ({ row }) => (
        <Box sx={{ alignItems: 'center', display: 'flex', minWidth: 0 }}>
          <Typography noWrap {...v2Typography.browserCell}>
            {row.family}
          </Typography>
          {updateTestFamilyFlagEnabled && (
            <TestFamilyBadge family={row.sourceFamily} />
          )}
        </Box>
      ),
    },
    {
      field: 'primaryContact',
      headerName: 'Primary Contact',
      flex: 0.7,
      minWidth: 160,
      renderCell: ({ row }) => (
        <Typography noWrap {...v2Typography.browserCell}>
          {row.primaryContact}
        </Typography>
      ),
    },
    {
      field: 'roles',
      headerName: 'Roles',
      flex: 1.5,
      minWidth: 360,
      sortable: false,
      renderCell: ({ row }) => <VolunteerApprovalRolesCellV2 roles={row.roles} />,
    },
    {
      field: 'missingRequirements',
      headerName: 'Missing Requirements',
      flex: 1,
      minWidth: 280,
      sortable: false,
      renderCell: ({ row }) => <MissingRequirementsCell row={row} />,
    },
  ];

  const customFieldColumns: GridColDef<VolunteerBrowserRowV2>[] =
    customFields.map((customField) => ({
      field: `customField:${customField.name}`,
      headerName: customField.name,
      flex: 0.7,
      minWidth: 160,
      renderCell: ({ row }) =>
        renderVolunteerCustomFieldValue(
          row.customFieldValues[customField.name],
          customField.validValues
        ),
    }));

  return fixedColumns.concat(customFieldColumns);
}

export function VolunteersDataGridV2({
  customFields,
  loading = false,
  onRowClick,
  onRowSelectionModelChange,
  rowSelectionModel,
  rows,
  updateTestFamilyFlagEnabled,
}: VolunteersDataGridV2Props) {
  const theme = useTheme();
  const columns = useMemo(
    () => buildColumns(customFields, updateTestFamilyFlagEnabled),
    [customFields, updateTestFamilyFlagEnabled]
  );

  return (
    <Box sx={v2DataGridStyles(theme, { height: 560 })}>
      <DataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        getEstimatedRowHeight={() => 88}
        getRowHeight={() => 'auto'}
        columnHeaderHeight={42}
        checkboxSelection
        disableRowSelectionOnClick
        disableRowSelectionExcludeModel
        onRowClick={({ row }) => onRowClick(row)}
        onRowSelectionModelChange={onRowSelectionModelChange}
        pageSizeOptions={[25, 50, 100]}
        rowSelectionModel={rowSelectionModel}
        slotProps={{
          baseCheckbox: {
            slotProps: {
              htmlInput: {
                title: BULK_ACTION_SELECTION_TOOLTIP,
              },
            },
          },
        }}
        initialState={{
          pagination: {
            paginationModel: { pageSize: 100 },
          },
        }}
      />
    </Box>
  );
}
