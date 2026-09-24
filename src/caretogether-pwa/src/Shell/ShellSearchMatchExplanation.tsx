import { Box, Typography } from '@mui/material';
import {
  findShellSearchHighlightRange,
  normalizeShellSearchText,
} from './shellSearch';

export interface ShellSearchMatchDetail {
  label: string;
  value: string;
  normalizedValue: string;
  phoneDigits?: string;
}

interface ShellSearchMatchExplanationProps {
  details: ShellSearchMatchDetail[];
  query: string;
}

function matchingDetail(details: ShellSearchMatchDetail[], query: string) {
  const normalizedQuery = normalizeShellSearchText(query);
  if (!normalizedQuery) return undefined;

  const queryDigits = normalizedQuery.replace(/[^0-9]/g, '');
  return details.find(
    (detail) =>
      detail.normalizedValue.includes(normalizedQuery) ||
      (queryDigits.length > 0 && detail.phoneDigits?.includes(queryDigits))
  );
}

function HighlightedMatch({
  detail,
  query,
}: {
  detail: ShellSearchMatchDetail;
  query: string;
}) {
  const range = findShellSearchHighlightRange(
    detail.value,
    query,
    detail.phoneDigits
  );
  if (!range) return detail.value;

  return (
    <>
      {detail.value.slice(0, range.start)}
      <Box
        component="mark"
        sx={{
          backgroundColor: 'rgba(0, 0, 0, 0.22)',
          borderRadius: 0.25,
          color: 'inherit',
          px: 0.2,
        }}
      >
        {detail.value.slice(range.start, range.end)}
      </Box>
      {detail.value.slice(range.end)}
    </>
  );
}

export function ShellSearchMatchExplanation({
  details,
  query,
}: ShellSearchMatchExplanationProps) {
  const detail = matchingDetail(details, query);
  if (!detail) return null;

  return (
    <Typography variant="caption" sx={{ display: 'block', opacity: 0.82 }}>
      {detail.label}: <HighlightedMatch detail={detail} query={query} />
    </Typography>
  );
}
