import { Box, Chip, Tooltip } from '@mui/material';

export type ApprovalAttentionCounts = {
  missing: number;
  expired: number;
};

export function ApprovalTabLabel({
  label,
  counts,
}: {
  label: string;
  counts: ApprovalAttentionCounts;
}) {
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        flexWrap: 'nowrap',
        whiteSpace: 'nowrap',
        width: 'max-content',
      }}
    >
      <Box component="span" className="ph-unmask" sx={{ flexShrink: 0 }}>
        {label}
      </Box>
      {counts.missing > 0 && (
        <Tooltip title={`${counts.missing} missing`}>
          <Chip
            className="ph-unmask"
            size="small"
            color="error"
            label={counts.missing}
            aria-label={`${counts.missing} missing approvals`}
            sx={{
              height: 20,
              flexShrink: 0,
              '& .MuiChip-label': { px: 0.75 },
            }}
          />
        </Tooltip>
      )}
      {counts.expired > 0 && (
        <Tooltip title={`${counts.expired} expired`}>
          <Chip
            className="ph-unmask"
            size="small"
            color="warning"
            label={counts.expired}
            aria-label={`${counts.expired} expired approvals`}
            sx={{
              height: 20,
              flexShrink: 0,
              '& .MuiChip-label': { px: 0.75 },
            }}
          />
        </Tooltip>
      )}
    </Box>
  );
}
