import { Box, Stack, Typography } from '@mui/material';
import { type ReactNode } from 'react';
import { ArrangementRowV2 } from './arrangementViewModel';
import { ArrangementComments } from './ArrangementComments';
import { ArrangementReason } from './ArrangementReason';

function DetailField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <Box>
      <Typography color="text.secondary" variant="caption">
        {label}
      </Typography>
      <Typography
        className="ph-unmask"
        variant="body2"
        sx={{ fontWeight: 600 }}
      >
        {children || '-'}
      </Typography>
    </Box>
  );
}

export function ArrangementOverviewSectionV2({
  row,
}: {
  row: ArrangementRowV2;
}) {
  return (
    <Stack spacing={1.25}>
      <DetailField label="Case">{row.caseLabel}</DetailField>
      <DetailField label="Child / Person">{row.childOrPersonLabel}</DetailField>
      <DetailField label="Family">{row.familyLabel}</DetailField>
      <Box>
        <Typography color="text.secondary" variant="caption">
          Arrangement Reason
        </Typography>
        <Typography
          className="ph-unmask"
          component="div"
          variant="body2"
          sx={{ fontWeight: 600 }}
        >
          <ArrangementReason
            arrangement={row.source}
            hideLabel
            partneringFamily={row.partneringFamily}
            v1CaseId={row.v1Case.id!}
          />
        </Typography>
      </Box>
      <Box>
        <Typography color="text.secondary" variant="caption">
          Arrangement Comments
        </Typography>
        <Typography
          className="ph-unmask"
          component="div"
          variant="body2"
          sx={{ fontWeight: 600 }}
        >
          <ArrangementComments
            arrangement={row.source}
            partneringFamily={row.partneringFamily}
            v1CaseId={row.v1Case.id!}
          />
        </Typography>
      </Box>
    </Stack>
  );
}
