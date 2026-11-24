import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  ImageOutlined,
  InsertDriveFileOutlined,
  PictureAsPdfOutlined,
} from '@mui/icons-material';
import { useMemo } from 'react';
import type { FamilyDocumentRowV2 } from './familyDocumentsViewModelV2';
import { filterFamilyDocumentsByFilename } from './familyDocumentSearch';

type FamilyDocumentsListV2Props = {
  rows: readonly FamilyDocumentRowV2[];
  search: string;
  onSearchChange: (value: string) => void;
  onOpen: (row: FamilyDocumentRowV2) => void;
};

export function FamilyDocumentsListV2({
  rows,
  search,
  onSearchChange,
  onOpen,
}: FamilyDocumentsListV2Props) {
  const matches = useMemo(
    () => filterFamilyDocumentsByFilename(rows, search),
    [rows, search]
  );
  return (
    <Stack spacing={1} sx={{ minWidth: 0 }}>
      <TextField
        label="Search documents"
        placeholder="Search documents"
        type="search"
        size="small"
        fullWidth
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
      />
      {matches.length === 0 ? (
        <Typography className="ph-unmask" role="status" color="text.secondary">
          No matching documents.
        </Typography>
      ) : (
        <List disablePadding aria-label="Family documents">
          {matches.map((row) => (
            <ListItem key={row.id} disablePadding divider>
              <ListItemButton
                onClick={(event) => {
                  event.currentTarget.focus();
                  onOpen(row);
                }}
                sx={(theme) => ({
                  minHeight: 64,
                  minWidth: 0,
                  alignItems: 'flex-start',
                  '&.Mui-focusVisible': {
                    outline: `2px solid ${theme.palette.primary.main}`,
                    outlineOffset: -2,
                  },
                })}
              >
                <ListItemIcon sx={{ minWidth: 36, mt: 0.5 }}>
                  {row.previewKind === 'pdf' ? (
                    <PictureAsPdfOutlined />
                  ) : row.previewKind === 'image' ? (
                    <ImageOutlined />
                  ) : (
                    <InsertDriveFileOutlined />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={row.documentName}
                  secondary={`${row.uploadDateLabel} · ${row.sourceLabel}`}
                  sx={{ minWidth: 0 }}
                  slotProps={{
                    primary: { sx: { overflowWrap: 'anywhere' } },
                    secondary: { sx: { overflowWrap: 'anywhere' } },
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      )}
    </Stack>
  );
}
