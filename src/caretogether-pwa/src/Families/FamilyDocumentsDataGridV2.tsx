import {
  Box,
  Chip,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import {
  GridColDef,
  GridListViewColDef,
  GridToolbar,
  GridToolbarProps,
  gridSortModelSelector,
  useGridApiContext,
  useGridSelector,
} from '@mui/x-data-grid-premium';
import { useMemo } from 'react';
import { FamilyDocumentRowV2 } from './familyDocumentsViewModelV2';
import { v2DataGridStyles } from './v2DataGridStyles';
import { v2Typography } from './v2Typography';
import { usePersistedGridFilterModel } from '../Hooks/usePersistedGridFilterModel';
import { PersistedFilterDataGridPremium } from '../Generic/PersistedFilterDataGridPremium';

type FamilyDocumentsDataGridV2Props = {
  filterScopeId?: string;
  onDelete: (row: FamilyDocumentRowV2) => void;
  onDownload: (row: FamilyDocumentRowV2) => void;
  rows: FamilyDocumentRowV2[];
};

function DocumentsMobileToolbar(props: GridToolbarProps) {
  const apiRef = useGridApiContext();
  const sortModel = useGridSelector(apiRef, gridSortModelSelector);
  const sortableColumns = apiRef.current
    .getAllColumns()
    .filter((column) => column.sortable);
  const sortValue =
    sortModel.length === 1
      ? `${sortModel[0].field}:${sortModel[0].sort}`
      : sortModel.length === 0
        ? ''
        : 'multiple';

  return (
    <Stack spacing={1} sx={{ minWidth: 0, p: 0.5 }}>
      <GridToolbar {...props} />
      <TextField
        select
        label="Sort documents"
        size="small"
        fullWidth
        sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
        value={sortValue}
        onChange={(event) => {
          if (!event.target.value) {
            apiRef.current.setSortModel([]);
            return;
          }
          const [field, sort] = event.target.value.split(':');
          if (sort === 'asc' || sort === 'desc') {
            apiRef.current.setSortModel([{ field, sort }]);
          }
        }}
      >
        <MenuItem value="">Unsorted</MenuItem>
        {sortModel.length > 1 && (
          <MenuItem value="multiple" disabled>
            Multiple columns
          </MenuItem>
        )}
        {sortableColumns.flatMap((column) => [
          <MenuItem key={`${column.field}:asc`} value={`${column.field}:asc`}>
            {column.headerName} — ascending
          </MenuItem>,
          <MenuItem key={`${column.field}:desc`} value={`${column.field}:desc`}>
            {column.headerName} — descending
          </MenuItem>,
        ])}
      </TextField>
    </Stack>
  );
}

function familyDocumentSearchText(row: FamilyDocumentRowV2) {
  return [
    row.documentName,
    row.sourceLabel,
    row.uploadDateLabel,
    row.uploadedByLabel,
    row.uploadedByUserId,
    row.fileTypeLabel,
  ]
    .filter(Boolean)
    .join(' ');
}

function buildColumns(
  {
    onDelete,
    onDownload,
  }: Pick<FamilyDocumentsDataGridV2Props, 'onDelete' | 'onDownload'>,
  isMobile: boolean
): GridColDef<FamilyDocumentRowV2>[] {
  return [
    {
      field: 'documentName',
      headerClassName: 'ph-unmask',
      headerName: 'Document Name',
      minWidth: 280,
      flex: 1.3,
      renderCell: ({ row }) => (
        <Tooltip title={isMobile ? row.documentName : ''}>
          <Typography {...v2Typography.browserCell} noWrap>
            {row.documentName}
          </Typography>
        </Tooltip>
      ),
    },
    {
      field: 'uploadedAtUtc',
      headerClassName: 'ph-unmask',
      headerName: 'Upload Date',
      width: 130,
      valueGetter: (_value, row) => row.uploadedAtUtc?.getTime() ?? null,
      renderCell: ({ row }) => (
        <Typography {...v2Typography.browserSecondary}>
          {row.uploadDateLabel}
        </Typography>
      ),
    },
    {
      field: 'uploadedByLabel',
      headerClassName: 'ph-unmask',
      headerName: 'Uploaded By',
      minWidth: 180,
      flex: 0.8,
      valueGetter: (_value, row) =>
        row.uploadedByLabel ?? row.uploadedByUserId ?? '-',
      renderCell: ({ row }) => (
        <Typography {...v2Typography.browserSecondary} noWrap>
          {row.uploadedByLabel ?? row.uploadedByUserId ?? '-'}
        </Typography>
      ),
    },
    {
      field: 'fileTypeLabel',
      headerClassName: 'ph-unmask',
      headerName: 'File Type',
      width: 120,
      renderCell: ({ row }) => (
        <Typography {...v2Typography.browserSecondary}>
          {row.fileTypeLabel}
        </Typography>
      ),
    },
    {
      field: 'sourceLabel',
      headerClassName: 'ph-unmask',
      headerName: 'Source',
      minWidth: 180,
      flex: 0.7,
      renderCell: ({ row }) => (
        <Chip
          label={row.sourceLabel}
          size="small"
          variant={row.sourceType === 'family' ? 'filled' : 'outlined'}
        />
      ),
    },
    {
      field: 'actions',
      headerClassName: 'ph-unmask',
      headerName: 'Actions',
      width: isMobile ? 112 : 92,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      align: 'right',
      headerAlign: 'right',
      renderCell: ({ row }) => (
        <Stack
          direction="row"
          spacing={0.5}
          sx={{
            alignItems: 'center',
            justifyContent: 'flex-end',
            width: '100%',
          }}
          onClick={(event) => event.stopPropagation()}
        >
          <Tooltip title="Download">
            <span>
              <IconButton
                className="ph-unmask"
                aria-label={`Download ${row.documentName}`}
                disabled={!row.permissionFlags.canDownload}
                onClick={() => onDownload(row)}
                size="small"
                sx={{
                  minWidth: { xs: 44, sm: 0 },
                  minHeight: { xs: 44, sm: 0 },
                }}
              >
                <DownloadIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          {row.permissionFlags.canDelete && (
            <Tooltip title="Delete">
              <span>
                <IconButton
                  className="ph-unmask"
                  aria-label={`Delete ${row.documentName}`}
                  onClick={() => onDelete(row)}
                  size="small"
                  sx={{
                    minWidth: { xs: 44, sm: 0 },
                    minHeight: { xs: 44, sm: 0 },
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          )}
        </Stack>
      ),
    },
    {
      field: 'searchText',
      headerName: 'Search',
      valueGetter: (_value, row) => familyDocumentSearchText(row),
      hideable: false,
      filterable: true,
      sortable: false,
      disableColumnMenu: true,
      width: 0,
      renderCell: () => null,
    },
  ];
}

export function FamilyDocumentsDataGridV2({
  filterScopeId,
  onDelete,
  onDownload,
  rows,
}: FamilyDocumentsDataGridV2Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isListView = useMediaQuery(theme.breakpoints.down('md'));
  const columns = useMemo(
    () => buildColumns({ onDelete, onDownload }, isMobile),
    [onDelete, onDownload, isMobile]
  );
  const { filterModel, filterModelRestored, onFilterModelChange } =
    usePersistedGridFilterModel({
      columns,
      entityId: filterScopeId,
      namespace: 'familyDocuments',
    });
  const listViewColumn = useMemo<GridListViewColDef<FamilyDocumentRowV2>>(
    () => ({
      field: 'documentList',
      display: 'flex',
      renderCell: (params) => {
        const { row } = params;
        const uploadedBy = row.uploadedByLabel ?? row.uploadedByUserId;
        return (
          <Stack spacing={0.5} sx={{ width: '100%', minWidth: 0, py: 1 }}>
            <Typography
              {...v2Typography.primaryValue}
              sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}
            >
              {row.documentName}
            </Typography>
            <Typography
              {...v2Typography.secondaryValue}
              sx={{ color: 'text.secondary', overflowWrap: 'anywhere' }}
            >
              Uploaded {row.uploadDateLabel}
              {uploadedBy ? ` by ${uploadedBy}` : ''}
            </Typography>
            <Typography
              {...v2Typography.secondaryValue}
              sx={{ color: 'text.secondary', overflowWrap: 'anywhere' }}
            >
              {row.fileTypeLabel} · {row.sourceLabel}
            </Typography>
            <Box
              sx={{
                '& .MuiIconButton-root': { minWidth: 44, minHeight: 44 },
              }}
            >
              {columns
                .find((column) => column.field === 'actions')
                ?.renderCell?.(params)}
            </Box>
          </Stack>
        );
      },
    }),
    [columns]
  );

  return (
    <Box
      sx={{
        ...v2DataGridStyles(theme),
        minWidth: 0,
        maxWidth: '100%',
        height: isListView ? '70dvh' : undefined,
        '& .MuiDataGrid-cell[data-field="actions"]': {
          py: { xs: 0, sm: 1 },
        },
      }}
    >
      <PersistedFilterDataGridPremium
        autoHeight={!isListView}
        listView={isListView}
        listViewColumn={listViewColumn}
        getRowHeight={isListView ? () => 'auto' : undefined}
        getEstimatedRowHeight={isListView ? () => 160 : undefined}
        rows={rows}
        columns={columns}
        filterModel={filterModel}
        filterModelRestored={filterModelRestored}
        onFilterModelChange={onFilterModelChange}
        rowHeight={56}
        columnHeaderHeight={42}
        disableRowSelectionOnClick
        hideFooter
        showToolbar={isListView}
        initialState={{
          columns: {
            columnVisibilityModel: {
              searchText: false,
              sourceLabel: false,
            },
          },
          sorting: {
            sortModel: [{ field: 'uploadedAtUtc', sort: 'desc' }],
          },
        }}
        slots={{ toolbar: isListView ? DocumentsMobileToolbar : GridToolbar }}
        slotProps={{
          toolbar: {
            showQuickFilter: true,
            sx: {
              '& .MuiButtonBase-root': { minWidth: 44, minHeight: 44 },
              '& .MuiDataGrid-toolbarQuickFilter, & .MuiDataGrid-toolbarQuickFilterControl':
                {
                  maxWidth: '100%',
                },
            },
          },
        }}
      />
    </Box>
  );
}
