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
  DataGridPremium,
  GridColDef,
  GridFilterModel,
  GridRowSelectionModel,
} from '@mui/x-data-grid-premium';
import { useMemo } from 'react';
import { CustomField } from '../GeneratedClient';
import { familyLastName } from '../Families/FamilyUtils';
import { TestFamilyBadge } from '../Families/TestFamilyBadge';
import { v2DataGridStyles } from '../Families/v2DataGridStyles';
import { v2Typography } from '../Families/v2Typography';
import { filterOption } from './VolunteerApprovalTab/filterOption';
import { VolunteerApprovalRolesCellV2 } from './VolunteerApprovalRolesCellV2';
import { renderVolunteerCustomFieldValue } from './VolunteerApprovalTab/volunteerCustomFieldPresentation';
import {
  completeRequirementFilterValue,
  missingRequirementFilterValue,
} from './VolunteerApprovalTab/volunteerMissingRequirementsPresentation';
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
  filterModel: GridFilterModel;
  loading?: boolean;
  onFilterModelChange: (model: GridFilterModel) => void;
  onRowClick: (row: VolunteerBrowserRowV2) => void;
  onRowSelectionModelChange: (model: GridRowSelectionModel) => void;
  requirementFilterOptions: string[];
  roleFilters: filterOption[];
  rowSelectionModel: GridRowSelectionModel;
  rows: VolunteerBrowserRowV2[];
  statusFilters: filterOption[];
  updateTestFamilyFlagEnabled?: boolean;
};

function displayValues(values: string[]) {
  return values.length > 0 ? values.join(', ') : '-';
}

function filterValueOptions(filters: filterOption[]) {
  return filters
    .filter((filter) => filter.value !== undefined)
    .map((filter) => ({
      label: filter.key,
      value: filter.value!,
    }));
}

function requirementValueOptions(requirementNames: string[]) {
  return [
    { label: 'Missing', value: missingRequirementFilterValue },
    { label: 'Complete', value: completeRequirementFilterValue },
  ].concat(
    requirementNames.map((requirementName) => ({
      label: requirementName,
      value: requirementName,
    }))
  );
}

function compareByFamilyLastName(
  firstRow: VolunteerBrowserRowV2 | null,
  secondRow: VolunteerBrowserRowV2 | null
) {
  const firstFamilyName = firstRow ? familyLastName(firstRow.sourceFamily) : '';
  const secondFamilyName = secondRow
    ? familyLastName(secondRow.sourceFamily)
    : '';
  const familyNameComparison = firstFamilyName.localeCompare(secondFamilyName);

  return familyNameComparison !== 0
    ? familyNameComparison
    : (firstRow?.id ?? '').localeCompare(secondRow?.id ?? '');
}

function buildColumns(
  customFields: CustomField[],
  roleFilters: filterOption[],
  statusFilters: filterOption[],
  requirementFilterOptions: string[],
  updateTestFamilyFlagEnabled?: boolean
): GridColDef<VolunteerBrowserRowV2>[] {
  const fixedColumns: GridColDef<VolunteerBrowserRowV2>[] = [
    {
      field: 'family',
      headerName: 'Family Name',
      flex: 1,
      minWidth: 220,
      filterable: false,
      sortComparator: (_value1, _value2, cellParams1, cellParams2) =>
        compareByFamilyLastName(
          cellParams1.api.getRow(
            cellParams1.id
          ) as VolunteerBrowserRowV2 | null,
          cellParams2.api.getRow(cellParams2.id) as VolunteerBrowserRowV2 | null
        ),
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
      filterable: false,
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
      type: 'singleSelect',
      valueGetter: (_value, row) => row.roleFilterValues.join(', '),
      valueOptions: filterValueOptions(roleFilters),
      renderCell: ({ row }) => <VolunteerApprovalRolesCellV2 roles={row.roles} />,
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 0.6,
      minWidth: 160,
      type: 'singleSelect',
      valueGetter: (_value, row) => row.statusFilterValues.join(', '),
      valueOptions: filterValueOptions(statusFilters),
      renderCell: ({ row }) => (
        <Typography noWrap {...v2Typography.browserCell}>
          {displayValues(row.statusLabels)}
        </Typography>
      ),
    },
    {
      field: 'missingRequirements',
      headerName: 'Missing Requirements',
      flex: 1,
      minWidth: 280,
      type: 'singleSelect',
      valueGetter: (_value, row) => row.requirementFilterValues.join(', '),
      valueOptions: requirementValueOptions(requirementFilterOptions),
      renderCell: ({ row }) => <MissingRequirementsCell row={row} />,
    },
  ];

  const customFieldColumns: GridColDef<VolunteerBrowserRowV2>[] =
    customFields.map((customField) => ({
      field: `customField:${customField.name}`,
      headerName: customField.name,
      flex: 0.7,
      minWidth: 160,
      filterable: false,
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
  filterModel,
  loading = false,
  onFilterModelChange,
  onRowClick,
  onRowSelectionModelChange,
  requirementFilterOptions,
  roleFilters,
  rowSelectionModel,
  rows,
  statusFilters,
  updateTestFamilyFlagEnabled,
}: VolunteersDataGridV2Props) {
  const theme = useTheme();
  const columns = useMemo(
    () =>
      buildColumns(
        customFields,
        roleFilters,
        statusFilters,
        requirementFilterOptions,
        updateTestFamilyFlagEnabled
      ),
    [
      customFields,
      requirementFilterOptions,
      roleFilters,
      statusFilters,
      updateTestFamilyFlagEnabled,
    ]
  );

  return (
    <Box sx={v2DataGridStyles(theme, { height: '100%' })}>
      <DataGridPremium
        rows={rows}
        columns={columns}
        loading={loading}
        getEstimatedRowHeight={() => 88}
        getRowHeight={() => 'auto'}
        columnHeaderHeight={42}
        checkboxSelection
        disableRowSelectionOnClick
        disableRowSelectionExcludeModel
        filterMode="server"
        filterModel={filterModel}
        onRowClick={({ row }) => onRowClick(row)}
        onFilterModelChange={onFilterModelChange}
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
          sorting: {
            sortModel: [{ field: 'family', sort: 'asc' }],
          },
        }}
      />
    </Box>
  );
}
