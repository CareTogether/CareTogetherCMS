import {
  AddCircle as AddCircleIcon,
  ChevronRight as ChevronRightIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridToolbarContainer,
} from '@mui/x-data-grid';
import { useRef } from 'react';
import { FamilyMemberRowV2 } from './familyMemberViewModel';

type FamilyMembersDataGridV2Props = {
  rows: FamilyMemberRowV2[];
  onAddAdult: () => void;
  onAddChild: () => void;
  onArrangementClick?: (arrangementId: string, v1CaseId: string) => void;
  onRowClick?: (row: FamilyMemberRowV2) => void;
  canAddAdult?: boolean;
  canAddChild?: boolean;
};

type FamilyMembersToolbarProps = Pick<
  FamilyMembersDataGridV2Props,
  'onAddAdult' | 'onAddChild' | 'canAddAdult' | 'canAddChild'
>;

function FamilyMembersToolbar({
  onAddAdult,
  onAddChild,
  canAddAdult,
  canAddChild,
}: FamilyMembersToolbarProps) {
  return (
    <GridToolbarContainer
      sx={{
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 48,
        px: 1.5,
        py: 1,
      }}
    >
      <Typography color="text.secondary" variant="body2">
        Family members
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        <Button
          size="small"
          startIcon={<AddCircleIcon />}
          onClick={onAddAdult}
          disabled={!canAddAdult}
        >
          Add Adult
        </Button>
        <Button
          size="small"
          startIcon={<AddCircleIcon />}
          onClick={onAddChild}
          disabled={!canAddChild}
        >
          Add Child
        </Button>
      </Box>
    </GridToolbarContainer>
  );
}

function displayValue(value?: string) {
  return value || '-';
}

function textFieldSummary(value?: string) {
  const items =
    value
      ?.split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean) ?? [];

  if (items.length === 0) {
    return {
      fullText: undefined,
      label: '\u2014',
    };
  }

  const [firstItem, ...additionalItems] = items;

  return {
    fullText: value,
    label:
      additionalItems.length > 0
        ? `${firstItem} +${additionalItems.length}`
        : firstItem,
  };
}

function tooltipTitle(fullText?: string) {
  return fullText ? (
    <Box sx={{ whiteSpace: 'pre-line' }}>{fullText}</Box>
  ) : (
    ''
  );
}

function buildColumns({
  onArrangementClick,
  onRowClick,
}: Pick<
  FamilyMembersDataGridV2Props,
  'onArrangementClick' | 'onRowClick'
>): GridColDef<FamilyMemberRowV2>[] {
  return [
    {
      field: 'displayName',
      headerName: 'Name',
      minWidth: 240,
      flex: 1,
      renderCell: ({ row }) => (
        <Stack sx={{ height: '100%', justifyContent: 'center', minWidth: 0 }}>
          <Typography
            className="ph-unmask"
            variant="body2"
            sx={{ fontWeight: 600 }}
            noWrap
          >
            {row.displayName}
          </Typography>
          <Typography color="text.secondary" variant="caption" noWrap>
            {[row.relationshipSummary, row.personType]
              .filter(Boolean)
              .join(' \u2022 ')}
          </Typography>
        </Stack>
      ),
    },
    {
      field: 'ageLabel',
      headerName: 'Age',
      width: 90,
      valueGetter: (_value, row) => displayValue(row.ageLabel),
    },
    {
      field: 'genderLabel',
      headerName: 'Gender',
      width: 120,
      valueGetter: (_value, row) => displayValue(row.genderLabel),
    },
    {
      field: 'primaryContactSummary',
      headerName: 'Contact',
      minWidth: 200,
      flex: 1,
      valueGetter: (_value, row) => displayValue(row.primaryContactSummary),
      renderCell: ({ row }) => (
        <Stack sx={{ height: '100%', justifyContent: 'center', minWidth: 0 }}>
          <Typography
            className="ph-unmask"
            color={row.primaryPhone ? 'text.primary' : 'text.secondary'}
            variant="body2"
            noWrap
          >
            {row.primaryPhone || '-'}
          </Typography>
          {row.primaryEmail && (
            <Typography
              className="ph-unmask"
              color="text.secondary"
              variant="caption"
              noWrap
            >
              {row.primaryEmail}
            </Typography>
          )}
        </Stack>
      ),
    },
    {
      field: 'activeArrangements',
      headerName: 'Arrangements',
      minWidth: 170,
      flex: 0.8,
      sortable: false,
      renderCell: ({ row }) => {
        if (row.activeArrangements.length === 0) {
          return (
            <Typography color="text.secondary" variant="body2">
              {'\u2014'}
            </Typography>
          );
        }

        return (
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'nowrap',
              gap: 0.5,
              minWidth: 0,
              overflow: 'hidden',
            }}
          >
            {row.activeArrangements.slice(0, 2).map((arrangement) => (
              <Tooltip
                key={arrangement.arrangementId}
                title={arrangement.label}
                disableInteractive
              >
                <Chip
                  clickable
                  className="ph-unmask"
                  label={arrangement.label}
                  size="small"
                  variant="outlined"
                  onClick={(event) => {
                    event.stopPropagation();
                    onArrangementClick?.(
                      arrangement.arrangementId,
                      arrangement.v1CaseId
                    );
                  }}
                  sx={{
                    maxWidth: 100,
                    '& .MuiChip-label': {
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    },
                  }}
                />
              </Tooltip>
            ))}
            {row.activeArrangements.length > 2 && (
              <Chip
                label={`+${row.activeArrangements.length - 2}`}
                size="small"
                variant="outlined"
              />
            )}
          </Box>
        );
      },
    },
    {
      field: 'householdStatusLabel',
      headerName: 'Household',
      width: 140,
      sortable: false,
      renderCell: ({ row }) =>
        row.householdStatusLabel ? (
          <Chip color="default" label={row.householdStatusLabel} size="small" />
        ) : null,
    },
    {
      field: 'comments',
      headerName: 'Comments',
      minWidth: 180,
      flex: 0.8,
      sortable: false,
      renderCell: ({ row }) => {
        const summary = textFieldSummary(row.person.notes);

        return (
          <Tooltip title={tooltipTitle(summary.fullText)} disableInteractive>
            <Typography
              className="ph-unmask"
              color={summary.fullText ? 'text.primary' : 'text.secondary'}
              variant="body2"
              noWrap
              sx={{
                fontWeight: summary.fullText ? 600 : undefined,
                minWidth: 0,
              }}
            >
              {summary.label}
            </Typography>
          </Tooltip>
        );
      },
    },
    {
      field: 'concernIndicator',
      headerName: 'Concerns',
      minWidth: 180,
      flex: 0.8,
      sortable: false,
      renderCell: ({ row }) => {
        const summary = textFieldSummary(row.person.concerns);

        return (
          <Tooltip title={tooltipTitle(summary.fullText)} disableInteractive>
            <Box
              sx={{
                alignItems: 'center',
                color: summary.fullText ? 'warning.dark' : 'text.secondary',
                display: 'flex',
                gap: 0.75,
                minWidth: 0,
                width: '100%',
              }}
            >
              {summary.fullText && <WarningIcon fontSize="small" />}
              <Typography
                className="ph-unmask"
                variant="body2"
                noWrap
                sx={{
                  fontWeight: summary.fullText ? 600 : undefined,
                  minWidth: 0,
                }}
              >
                {summary.label}
              </Typography>
            </Box>
          </Tooltip>
        );
      },
    },
    {
      field: 'openDetails',
      headerName: '',
      width: 44,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: () =>
        onRowClick ? (
          <ChevronRightIcon
            fontSize="small"
            sx={{
              color: 'text.secondary',
              opacity: 0,
              transition: 'opacity 120ms ease-in-out',
            }}
          />
        ) : null,
    },
  ];
}

function EmptyFamilyMembersState({
  onAddAdult,
  onAddChild,
  canAddAdult,
  canAddChild,
}: FamilyMembersToolbarProps) {
  return (
    <Box
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        bgcolor: 'background.paper',
        px: 2,
        py: 3,
        textAlign: 'center',
      }}
    >
      <Typography variant="subtitle1">No family members yet.</Typography>
      <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>
        Add an adult or child to start building this family record.
      </Typography>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1,
          justifyContent: 'center',
          mt: 2,
        }}
      >
        <Button
          startIcon={<AddCircleIcon />}
          onClick={onAddAdult}
          disabled={!canAddAdult}
          variant="contained"
        >
          Add Adult
        </Button>
        <Button
          startIcon={<AddCircleIcon />}
          onClick={onAddChild}
          disabled={!canAddChild}
          variant="contained"
        >
          Add Child
        </Button>
      </Box>
    </Box>
  );
}

export function FamilyMembersDataGridV2({
  rows,
  onAddAdult,
  onAddChild,
  onArrangementClick,
  onRowClick,
  canAddAdult = true,
  canAddChild = true,
}: FamilyMembersDataGridV2Props) {
  const theme = useTheme();
  const gridContainerRef = useRef<HTMLDivElement | null>(null);
  const columns = buildColumns({ onArrangementClick, onRowClick });
  const pageSize = 10;
  const paginationNeeded = rows.length > pageSize;
  const gridHeight = paginationNeeded ? pageSize * 56 + 112 : undefined;

  const clearGridFocus = () => {
    const activeElement = document.activeElement;

    if (
      activeElement instanceof HTMLElement &&
      gridContainerRef.current?.contains(activeElement)
    ) {
      activeElement.blur();
    }
  };

  if (rows.length === 0) {
    return (
      <Stack spacing={1}>
        <Typography variant="h6">Family Members</Typography>
        <EmptyFamilyMembersState
          onAddAdult={onAddAdult}
          onAddChild={onAddChild}
          canAddAdult={canAddAdult}
          canAddChild={canAddChild}
        />
      </Stack>
    );
  }

  return (
    <Stack spacing={1}>
      <Typography variant="h6">Family Members</Typography>
      <Box
        ref={gridContainerRef}
        sx={{
          height: gridHeight,
          width: '100%',
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          bgcolor: 'background.paper',
          overflow: 'hidden',
          '& .MuiDataGrid-row': {
            cursor: onRowClick ? 'pointer' : undefined,
            minHeight: 56,
            transition: theme.transitions.create(
              ['background-color', 'box-shadow'],
              {
                duration: theme.transitions.duration.shortest,
              }
            ),
            '&:focus, &:focus-within': {
              backgroundColor: theme.palette.action.focus,
              boxShadow: `inset 3px 0 0 ${theme.palette.primary.main}`,
              outline: 'none',
            },
            '&:focus .MuiDataGrid-cell, &:focus-within .MuiDataGrid-cell': {
              backgroundColor: theme.palette.action.focus,
            },
            '&:focus .MuiSvgIcon-root, &:focus-within .MuiSvgIcon-root': {
              opacity: 1,
            },
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
            },
            '&:hover .MuiDataGrid-cell': {
              backgroundColor: theme.palette.action.hover,
            },
            '&:hover .MuiSvgIcon-root': {
              opacity: 1,
            },
          },
          '& .MuiDataGrid-cell': {
            alignItems: 'center',
            cursor: onRowClick ? 'inherit' : undefined,
            display: 'flex',
            transition: theme.transitions.create('background-color', {
              duration: theme.transitions.duration.shortest,
            }),
          },
          '& .MuiDataGrid-root': {
            border: 0,
          },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: theme.palette.action.hover,
            borderBottomColor: theme.palette.divider,
          },
          '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
            backgroundColor: 'transparent',
            boxShadow: 'none',
            outline: 'none',
          },
          '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within':
            {
              backgroundColor: 'inherit',
              boxShadow: 'none',
              outline: 'none',
            },
        }}
      >
        <DataGrid
          autoHeight={!paginationNeeded}
          rows={rows}
          columns={columns}
          rowHeight={56}
          columnHeaderHeight={42}
          disableRowSelectionOnClick
          hideFooter={!paginationNeeded}
          onRowClick={({ row }) => {
            onRowClick?.(row);
            clearGridFocus();
          }}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: {
              paginationModel: { pageSize },
            },
            sorting: {
              sortModel: [{ field: 'displayName', sort: 'asc' }],
            },
          }}
          slots={{
            toolbar: () => (
              <FamilyMembersToolbar
                onAddAdult={onAddAdult}
                onAddChild={onAddChild}
                canAddAdult={canAddAdult}
                canAddChild={canAddChild}
              />
            ),
          }}
        />
      </Box>
    </Stack>
  );
}
