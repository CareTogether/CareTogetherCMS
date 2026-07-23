import {
  Box,
  Button,
  Card,
  Chip,
  Stack,
  Typography,
} from '@mui/material';
import {
  Event as EventIcon,
  LocationPin as LocationPinIcon,
  PermPhoneMsg as PermPhoneMsgIcon,
} from '@mui/icons-material';
import { KeyboardEvent } from 'react';
import { format } from 'date-fns';
import {
  ArrangementPhase,
  CombinedFamilyInfo,
  V1Case,
  V1Referral,
} from '../GeneratedClient';
import { V1CaseCommentsV2 } from '../V1Cases/V1CaseCommentsV2';
import { formatStatusWithDate } from '../V1Referrals/formatStatusWithDate';
import { v2Typography } from './v2Typography';

export type ActiveCaseArrangementSummaryV2 = {
  id: string;
  arrangementType: string;
  arrangedPersonLabel: string;
  childInvolvement: boolean;
  currentLocationLabel?: string;
  phase: ArrangementPhase;
  relevantDateLabel?: string;
  statusLabel: string;
};

type FamilyCaseWorkspaceHeaderV2Props = {
  activeCaseArrangements: ActiveCaseArrangementSummaryV2[];
  canCloseV1Case: boolean;
  canOpenNewCase: boolean;
  canReopenSelectedV1Case: boolean;
  canViewV1CaseComments: boolean;
  currentReferral?: V1Referral;
  family: CombinedFamilyInfo;
  referralsEnabled: boolean | undefined;
  selectedV1Case?: V1Case;
  onArrangementOpen: (arrangementId: string) => void;
  onCloseCase: () => void;
  onOpenNewCase: () => void;
  onReopenCase: () => void;
  onViewReferral: (referralId: string) => void;
};

function arrangementAccentColor(phase?: ArrangementPhase) {
  if (phase === ArrangementPhase.Started) return 'info.main';
  return 'warning.main';
}

function getCaseOverviewGridColumns(
  comments: string | undefined,
  arrangements: ActiveCaseArrangementSummaryV2[]
) {
  const commentLength = comments?.trim().length ?? 0;
  const arrangementsNeedSpace = arrangements.length >= 3;

  if (commentLength >= 240) return { caseInformation: 6, comments: 6 };
  if (arrangementsNeedSpace && commentLength <= 160) {
    return { caseInformation: 8, comments: 4 };
  }

  return { caseInformation: 7, comments: 5 };
}

export function FamilyCaseWorkspaceHeaderV2({
  activeCaseArrangements,
  canCloseV1Case,
  canOpenNewCase,
  canReopenSelectedV1Case,
  canViewV1CaseComments,
  currentReferral,
  family,
  referralsEnabled,
  selectedV1Case,
  onArrangementOpen,
  onCloseCase,
  onOpenNewCase,
  onReopenCase,
  onViewReferral,
}: FamilyCaseWorkspaceHeaderV2Props) {
  function handleArrangementKeyDown(
    event: KeyboardEvent,
    arrangementId: string
  ) {
    if (event.key !== 'Enter' && event.key !== ' ') return;

    event.preventDefault();
    onArrangementOpen(arrangementId);
  }

  const showCaseComments = canViewV1CaseComments && selectedV1Case;
  const caseOverviewGridColumns = getCaseOverviewGridColumns(
    selectedV1Case?.comments,
    activeCaseArrangements
  );

  return (
    <Box
      sx={{
        borderLeft: 4,
        borderColor: selectedV1Case?.closedAtUtc ? 'divider' : 'primary.main',
        borderRadius: 1,
        bgcolor: 'background.paper',
        boxShadow: 1,
        px: { xs: 1.5, sm: 2 },
        py: 1.5,
        mb: 1.5,
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gap: { xs: 1.25, md: 2 },
          gridTemplateColumns: {
            xs: '1fr',
            md: showCaseComments
              ? `${caseOverviewGridColumns.caseInformation}fr ${caseOverviewGridColumns.comments}fr`
              : '1fr',
          },
          alignItems: 'start',
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          {selectedV1Case ? (
            <Stack spacing={1}>
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    display: 'block',
                    fontWeight: 700,
                    letterSpacing: 0.4,
                    textTransform: 'uppercase',
                  }}
                >
                  Case
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 1.5,
                    flexWrap: 'wrap',
                    mb: 0.5,
                  }}
                >
                  <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                    <Typography {...v2Typography.fieldLabel}>
                      Opened
                    </Typography>
                    <Typography {...v2Typography.primaryValue}>
                      {format(selectedV1Case.openedAtUtc, 'MMM d, yyyy')}
                    </Typography>
                  </Stack>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {!selectedV1Case.closedAtUtc && canCloseV1Case && (
                      <Button
                        className="ph-unmask"
                        onClick={onCloseCase}
                        variant="contained"
                        size="small"
                      >
                        Close Case
                      </Button>
                    )}
                    {selectedV1Case.closedAtUtc && canReopenSelectedV1Case && (
                      <Button
                        className="ph-unmask"
                        onClick={onReopenCase}
                        variant="contained"
                        size="small"
                      >
                        Reopen Case
                      </Button>
                    )}
                  </Box>
                </Box>
              </Box>
              {activeCaseArrangements.length > 0 && (
                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 1,
                  }}
                >
                  {activeCaseArrangements.map((arrangement) => (
                    <Card
                      key={arrangement.id}
                      role="button"
                      tabIndex={0}
                      variant="outlined"
                      onClick={() => onArrangementOpen(arrangement.id)}
                      onKeyDown={(event) =>
                        handleArrangementKeyDown(event, arrangement.id)
                      }
                      sx={(theme) => ({
                        borderColor: 'divider',
                        borderLeft: 3,
                        borderLeftColor: arrangementAccentColor(
                          arrangement.phase
                        ),
                        cursor: 'pointer',
                        maxWidth: '100%',
                        minWidth: 0,
                        transition: theme.transitions.create(['box-shadow'], {
                          duration: theme.transitions.duration.shortest,
                        }),
                        width: 'fit-content',
                        '&:hover': {
                          boxShadow: 2,
                        },
                        '&:focus-visible': {
                          outline: `2px solid ${theme.palette.primary.main}`,
                          outlineOffset: 2,
                        },
                      })}
                    >
                      <Box sx={{ minWidth: 0, px: 1.25, py: 1 }}>
                        <Typography {...v2Typography.primaryValue} noWrap>
                          {arrangement.arrangementType}
                        </Typography>
                        <Typography
                          color="text.secondary"
                          {...v2Typography.browserSecondary}
                          noWrap
                        >
                          {arrangement.statusLabel}
                        </Typography>
                        <Typography
                          color={
                            arrangement.arrangedPersonLabel === 'Unassigned'
                              ? 'text.secondary'
                              : 'text.primary'
                          }
                          {...v2Typography.browserSecondary}
                          noWrap
                        >
                          {arrangement.arrangedPersonLabel}
                        </Typography>
                        {arrangement.relevantDateLabel && (
                          <Typography
                            color="text.secondary"
                            {...v2Typography.browserSecondary}
                            noWrap
                          >
                            <EventIcon
                              fontSize="inherit"
                              sx={{ verticalAlign: 'text-top' }}
                            />
                            &nbsp;
                            {arrangement.relevantDateLabel}
                          </Typography>
                        )}
                        {arrangement.childInvolvement && (
                          <Typography
                            color="text.secondary"
                            {...v2Typography.browserSecondary}
                            noWrap
                          >
                            <LocationPinIcon
                              fontSize="inherit"
                              sx={{ verticalAlign: 'text-top' }}
                            />
                            &nbsp;
                            {arrangement.currentLocationLabel}
                          </Typography>
                        )}
                      </Box>
                    </Card>
                  ))}
                </Box>
              )}
              {currentReferral && (
                <Box
                  sx={{
                    borderLeft: 2,
                    borderColor: 'divider',
                    ml: { xs: 0, sm: 0.5 },
                    pl: 1.5,
                    py: 0.25,
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      display: 'block',
                      fontWeight: 600,
                      letterSpacing: 0.3,
                      mb: 0.25,
                      textTransform: 'uppercase',
                    }}
                  >
                    Linked Referral
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.25,
                      flexWrap: 'wrap',
                    }}
                  >
                    <PermPhoneMsgIcon color="primary" fontSize="small" />
                    <Typography {...v2Typography.primaryValue}>
                      {currentReferral.title}
                    </Typography>
                    <Chip
                      size="small"
                      label={
                        currentReferral.acceptedAtUtc
                          ? `Accepted \u2022 ${format(
                              currentReferral.acceptedAtUtc,
                              'MMM d, yyyy'
                            )}`
                          : formatStatusWithDate(
                              currentReferral.status,
                              currentReferral.createdAtUtc,
                              currentReferral.acceptedAtUtc,
                              currentReferral.closedAtUtc
                            )
                      }
                    />
                    <Chip
                      size="small"
                      variant="outlined"
                      label={`Received \u2022 ${format(
                        currentReferral.createdAtUtc,
                        'MMM d, yyyy'
                      )}`}
                    />
                    <Button
                      className="ph-unmask"
                      onClick={() => onViewReferral(currentReferral.referralId)}
                      variant="text"
                      size="small"
                    >
                      View Referral
                    </Button>
                  </Box>
                </Box>
              )}
            </Stack>
          ) : (
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  display: 'block',
                  fontWeight: 700,
                  letterSpacing: 0.4,
                  mb: 0.25,
                  textTransform: 'uppercase',
                }}
              >
                Case
              </Typography>
              <Typography className="ph-unmask" variant="h3">
                No current case
              </Typography>
              {!referralsEnabled && canOpenNewCase && (
                <Button
                  className="ph-unmask"
                  onClick={onOpenNewCase}
                  variant="contained"
                  size="small"
                  sx={{ mt: 1 }}
                >
                  Open New Case
                </Button>
              )}
            </Box>
          )}
        </Box>

        {showCaseComments && (
          <Box
            sx={{
              minWidth: 0,
              pt: { xs: 0.25, md: 0 },
            }}
          >
            <V1CaseCommentsV2
              compact
              partneringFamily={family}
              v1CaseId={selectedV1Case.id!}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}
