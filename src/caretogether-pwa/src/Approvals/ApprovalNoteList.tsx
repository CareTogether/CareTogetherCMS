import { Box, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { v2Typography } from '../Families/v2Typography';

export type ApprovalNoteListEntry = {
  id: string;
  contents: string;
  attribution?: ReactNode;
};

export function ApprovalNoteList({
  entries,
}: {
  entries: ApprovalNoteListEntry[];
}) {
  if (entries.length === 0) {
    return <Typography {...v2Typography.secondaryValue}>No notes.</Typography>;
  }

  return (
    <Stack component="ul" spacing={1} sx={{ m: 0, p: 0, listStyle: 'none' }}>
      {entries.map((entry) => (
        <Box
          component="li"
          key={entry.id}
          sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1 }}
        >
          <Typography {...v2Typography.browserCell}>
            {entry.contents}
          </Typography>
          {entry.attribution && (
            <Typography {...v2Typography.fieldLabel}>
              {entry.attribution}
            </Typography>
          )}
        </Box>
      ))}
    </Stack>
  );
}
