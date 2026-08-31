import {
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import type { GridColDef } from '@mui/x-data-grid';
import type { FamilyDocumentRowV2 } from './familyDocumentsViewModelV2';
import { v2Typography } from './v2Typography';

type FamilyDocumentsDataGridColumnActions = {
  onDelete: (row: FamilyDocumentRowV2) => void;
  onDownload: (row: FamilyDocumentRowV2) => void;
};

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

export function familyDocumentsDataGridColumns({
  onDelete,
  onDownload,
}: FamilyDocumentsDataGridColumnActions): GridColDef<FamilyDocumentRowV2>[] {
  return [
    {
      field: 'documentName',
      headerClassName: 'ph-unmask',
      headerName: 'Document Name',
      minWidth: 280,
      flex: 1.3,
      renderCell: ({ row }) => (
        <Typography {...v2Typography.browserCell} noWrap>
          {row.documentName}
        </Typography>
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
      width: 92,
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
