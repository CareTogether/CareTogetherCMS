import { Box, Stack, Typography } from '@mui/material';
import { type ReactNode } from 'react';
import { v2Typography } from '../../Families/v2Typography';
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
      <Typography {...v2Typography.primaryValue}>
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
        <Typography component="div" {...v2Typography.primaryValue}>
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
        <Typography component="div" {...v2Typography.primaryValue}>
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
