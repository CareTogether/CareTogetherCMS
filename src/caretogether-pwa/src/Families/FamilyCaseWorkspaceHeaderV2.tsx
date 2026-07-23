import Grid from '../Generic/GridLegacyCompat';
import { Box, Button, Card, Chip, Stack, Typography } from '@mui/material';
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
  Permission,
  V1Case,
  V1Referral,
} from '../GeneratedClient';
import { V1CaseCommentsV2 } from '../V1Cases/V1CaseCommentsV2';
import { formatStatusWithDate } from '../V1Referrals/formatStatusWithDate';
import { v2Typography } from './v2Typography';
import { useFamilyPermissions } from '../Model/SessionModel';
import { useAppNavigate } from '../Hooks/useAppNavigate';

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
  canReopenSelectedV1Case: boolean;
  currentReferral?: V1Referral;
  family: CombinedFamilyInfo;
  referralsEnabled: boolean | undefined;
  selectedV1Case?: V1Case;
  onArrangementOpen: (arrangementId: string) => void;
  onCloseCase: () => void;
  onOpenNewCase: () => void;
  onReopenCase: () => void;
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
  canReopenSelectedV1Case,
  currentReferral,
  family,
  referralsEnabled,
  selectedV1Case,
  onArrangementOpen,
  onCloseCase,
  onOpenNewCase,
  onReopenCase,
}: FamilyCaseWorkspaceHeaderV2Props) {
  function handleArrangementKeyDown(
    event: KeyboardEvent,
    arrangementId: string
  ) {
    if (event.key !== 'Enter' && event.key !== ' ') return;

    event.preventDefault();
    onArrangementOpen(arrangementId);
  }

  const caseOverviewGridColumns = getCaseOverviewGridColumns(
    selectedV1Case?.comments,
    activeCaseArrangements
  );

  const permissions = useFamilyPermissions(family);

  const appNavigate = useAppNavigate();

  return (
    <Box
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        p: 2,
        mb: 2,
        bgcolor: 'background.paper',
      }}
    >
      <Grid
        container
        spacing={{ xs: 1.25, md: 2 }}
        sx={{ alignItems: 'flex-start' }}
      >
        <Grid
          item
          xs={12}
          md={
            permissions(Permission.ViewV1CaseComments) && selectedV1Case
              ? caseOverviewGridColumns.caseInformation
              : 12
          }
          sx={{ minWidth: 0 }}
        >
          {selectedV1Case ? (
            <Stack spacing={1}>
              <Box>
                <Typography
                  variant="h3"
                  color="text.secondary"
                  sx={{
                    display: 'block',
                  }}
                >
                  Case
                </Typography>
                <Typography>
                  Opened {format(selectedV1Case.openedAtUtc, 'M/d/yy')}
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
              {currentReferral && (
                <Box>
                  <Chip
                    key={currentReferral.referralId}
                    clickable
                    size="medium"
                    color="primary"
                    variant="outlined"
                    icon={<PermPhoneMsgIcon />}
                    label={`${currentReferral.title} · ${formatStatusWithDate(
                      currentReferral.status,
                      currentReferral.createdAtUtc,
                      currentReferral.acceptedAtUtc,
                      currentReferral.closedAtUtc
                    )}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      appNavigate.referral(currentReferral.referralId);
                    }}
                  />
                </Box>
              )}
              {activeCaseArrangements.length > 0 && (
                <Grid container spacing={1}>
                  {activeCaseArrangements.map((arrangement) => (
                    <Grid
                      item
                      xs="auto"
                      key={arrangement.id}
                      sx={{ maxWidth: '100%', minWidth: 0 }}
                    >
                      <Card
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
                          height: '100%',
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
                          <Typography {...v2Typography.browserSecondary} noWrap>
                            {arrangement.arrangementType}
                          </Typography>
                          <Typography
                            color={
                              arrangement.arrangedPersonLabel === 'Unassigned'
                                ? 'text.secondary'
                                : 'text.primary'
                            }
                            {...v2Typography.primaryValue}
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
                    </Grid>
                  ))}
                </Grid>
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
              {!referralsEnabled && permissions(Permission.CreateV1Case) && (
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
        </Grid>

        {permissions(Permission.ViewV1CaseComments) && selectedV1Case && (
          <Grid
            item
            xs={12}
            md={caseOverviewGridColumns.comments}
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
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
