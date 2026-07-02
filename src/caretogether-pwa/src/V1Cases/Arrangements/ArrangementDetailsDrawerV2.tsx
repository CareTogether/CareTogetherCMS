import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Chip,
  Drawer,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import { type ReactNode } from 'react';
import { ArrangementPhase, Permission } from '../../GeneratedClient';
import { useBackdrop } from '../../Hooks/useBackdrop';
import { useFamilyIdPermissions } from '../../Model/SessionModel';
import { useV1CasesModel } from '../../Model/V1CasesModel';
import { ArrangementComments } from './ArrangementComments';
import { ArrangementReason } from './ArrangementReason';
import { ArrangementRowV2 } from './arrangementViewModel';
import { DateDisplayEditor } from './DateDisplayEditor';

type ArrangementDetailsDrawerV2Props = {
  row: ArrangementRowV2 | null;
  open: boolean;
  onClose: () => void;
};

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

type DateCommand = (
  aggregateId: string,
  v1CaseId: string,
  arrangementId: string,
  date: Date
) => Promise<void>;

function DateFields({ row }: { row: ArrangementRowV2 }) {
  const arrangement = row.source;
  const partneringFamilyId = row.partneringFamily.family!.id!;
  const v1CaseId = row.v1Case.id!;
  const permissions = useFamilyIdPermissions(partneringFamilyId);
  const v1CasesModel = useV1CasesModel();
  const withBackdrop = useBackdrop();
  const canEdit = permissions(Permission.EditArrangement);

  const onDateChange = async (callback: DateCommand, newDate: Date) => {
    await withBackdrop(async () => {
      await callback(partneringFamilyId, v1CaseId, arrangement.id!, newDate);
    });
  };

  return (
    <Stack className="ph-unmask" spacing={0.5}>
      <DateDisplayEditor
        label="Requested"
        initialValue={arrangement.requestedAtUtc}
        canEdit={canEdit}
        availableInCurrentPhase
        onChange={(newDate) =>
          onDateChange(v1CasesModel.editArrangementRequestedAt, newDate)
        }
      />
      <DateDisplayEditor
        label="Cancelled"
        initialValue={arrangement.cancelledAtUtc}
        canEdit={canEdit}
        availableInCurrentPhase={arrangement.phase === ArrangementPhase.Cancelled}
        unavailableTooltip="Only available when the arrangement is cancelled"
        onChange={(newDate) =>
          onDateChange(v1CasesModel.editArrangementCancelledAt, newDate)
        }
      />
      <DateDisplayEditor
        label="Planned start"
        initialValue={arrangement.plannedStartUtc}
        disableFuture={false}
        canEdit={canEdit}
        availableInCurrentPhase
        onChange={(newDate) =>
          onDateChange(v1CasesModel.planArrangementStart, newDate)
        }
      />
      <DateDisplayEditor
        label="Started"
        initialValue={arrangement.startedAtUtc}
        canEdit={canEdit}
        availableInCurrentPhase={
          (arrangement.phase || 0) >= ArrangementPhase.Started
        }
        unavailableTooltip="Only available when the arrangement is started"
        onChange={(newDate) =>
          onDateChange(v1CasesModel.editArrangementStartTime, newDate)
        }
      />
      <DateDisplayEditor
        label="Planned end"
        initialValue={arrangement.plannedEndUtc}
        disableFuture={false}
        canEdit={canEdit}
        availableInCurrentPhase
        onChange={(newDate) =>
          onDateChange(v1CasesModel.planArrangementEnd, newDate)
        }
      />
      <DateDisplayEditor
        label="Ended"
        initialValue={arrangement.endedAtUtc}
        canEdit={canEdit}
        availableInCurrentPhase={arrangement.phase === ArrangementPhase.Ended}
        unavailableTooltip="Only available when the arrangement is ended"
        onChange={(newDate) =>
          onDateChange(v1CasesModel.editArrangementEndTime, newDate)
        }
      />
    </Stack>
  );
}

function SummaryFields({ row }: { row: ArrangementRowV2 }) {
  const arrangement = row.source;
  const partneringFamily = row.partneringFamily;
  const v1CaseId = row.v1Case.id!;

  return (
    <Stack spacing={1.15}>
      <DetailField label="Arrangement">{row.arrangementType}</DetailField>
      <Box>
        <Typography color="text.secondary" variant="caption">
          Status
        </Typography>
        <Box sx={{ mt: 0.25 }}>
          <Chip label={row.statusLabel} size="small" />
        </Box>
      </Box>
      <DetailField label="Case">{row.caseLabel}</DetailField>
      <DetailField label="Child / Person">{row.childOrPersonLabel}</DetailField>
      <DetailField label="Family">{row.familyLabel}</DetailField>
      <DetailField label="Arrangement Type">{row.arrangementType}</DetailField>
      <Box>
        <Typography color="text.secondary" variant="caption">
          Reason
        </Typography>
        <Typography
          className="ph-unmask"
          component="div"
          variant="body2"
          sx={{ fontWeight: 600 }}
        >
          <ArrangementReason
            arrangement={arrangement}
            hideLabel
            partneringFamily={partneringFamily}
            v1CaseId={v1CaseId}
          />
        </Typography>
      </Box>
    </Stack>
  );
}

function CommentsField({ row }: { row: ArrangementRowV2 }) {
  return (
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
  );
}

function EmptyText({ children }: { children: ReactNode }) {
  return (
    <Typography color="text.secondary" variant="body2">
      {children}
    </Typography>
  );
}

function Section({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <Stack spacing={1.25}>
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Typography variant="subtitle2">{title}</Typography>
        {action}
      </Stack>
      {children}
    </Stack>
  );
}

export function ArrangementDetailsDrawerV2({
  row,
  open,
  onClose,
}: ArrangementDetailsDrawerV2Props) {
  return (
    <Drawer
      anchor="right"
      aria-labelledby="arrangement-details-title"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: 680, md: 1040 },
            p: 2,
            pt: { xs: 7, sm: 8, md: 6 },
          },
        },
      }}
    >
      {row && (
        <Stack spacing={2}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 1,
            }}
          >
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                color="text.secondary"
                sx={{ textTransform: 'uppercase' }}
                variant="caption"
              >
                Arrangement
              </Typography>
              <Typography
                id="arrangement-details-title"
                className="ph-unmask"
                variant="h5"
              >
                {row.arrangementType}
              </Typography>
              <Box
                sx={{
                  alignItems: 'center',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1,
                  justifyContent: 'space-between',
                  mt: 1,
                }}
              >
                <Chip label={row.statusLabel} size="small" />
              </Box>
            </Box>
            <IconButton
              aria-label="close arrangement details"
              onClick={onClose}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gap: { xs: 2.5, md: 4 },
              gridTemplateColumns: {
                xs: '1fr',
                md: 'minmax(0, 1.15fr) minmax(0, 0.85fr)',
              },
              alignItems: 'start',
            }}
          >
            <Stack spacing={2.25}>
              <Section title="Summary">
                <SummaryFields row={row} />
              </Section>

              <Section title="Comments">
                <CommentsField row={row} />
              </Section>
            </Stack>

            <Stack spacing={2}>
              <Section title="Timeline">
                <DateFields row={row} />
              </Section>

              <Section title="Locations">
                {row.currentLocationLabel ? (
                  <DetailField label="Current">
                    {row.currentLocationLabel}
                  </DetailField>
                ) : (
                  <EmptyText>No current location recorded.</EmptyText>
                )}
                {row.nextPlannedLocationLabel ? (
                  <DetailField label="Planned">
                    {row.nextPlannedLocationLabel}
                  </DetailField>
                ) : (
                  <EmptyText>No planned location recorded.</EmptyText>
                )}
              </Section>
            </Stack>
          </Box>
        </Stack>
      )}
    </Drawer>
  );
}
