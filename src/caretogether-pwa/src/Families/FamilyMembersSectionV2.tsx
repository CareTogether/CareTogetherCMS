import { Box, Stack, Typography } from '@mui/material';
import { useMemo } from 'react';
import { FamilyMemberCardV2 } from './FamilyMemberCardV2';
import type { FamilyMemberRowV2 } from './familyMemberViewModel';

type FamilyMembersSectionV2Props = {
  rows: FamilyMemberRowV2[];
  onMemberClick: (row: FamilyMemberRowV2) => void;
};

function EmptyFamilyMembersState() {
  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        px: 2,
        py: 3,
        textAlign: 'center',
      }}
    >
      <Typography className="ph-unmask" variant="subtitle1">
        No family members yet.
      </Typography>
      <Typography
        className="ph-unmask"
        color="text.secondary"
        variant="body2"
        sx={{ mt: 0.5 }}
      >
        Add an adult or child to start building this family record.
      </Typography>
    </Box>
  );
}

export function FamilyMembersSectionV2({
  rows,
  onMemberClick,
}: FamilyMembersSectionV2Props) {
  const sortedRows = useMemo(
    () =>
      [...rows].sort((left, right) =>
        left.displayName.localeCompare(right.displayName)
      ),
    [rows]
  );

  if (rows.length === 0) {
    return (
      <Stack spacing={1}>
        <Typography className="ph-unmask" variant="h6">
          Family Members
        </Typography>
        <EmptyFamilyMembersState />
      </Stack>
    );
  }

  return (
    <Stack spacing={1.25}>
      <Box
        sx={{
          alignItems: { xs: 'flex-start', sm: 'center' },
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 1,
          justifyContent: 'space-between',
        }}
      >
        <Typography className="ph-unmask" variant="h6">
          Family Members
        </Typography>
      </Box>
      <Box
        sx={{
          display: 'grid',
          gap: 1.5,
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))',
        }}
      >
        {sortedRows.map((row) => (
          <FamilyMemberCardV2
            key={row.id}
            row={row}
            onClick={onMemberClick}
          />
        ))}
      </Box>
    </Stack>
  );
}
