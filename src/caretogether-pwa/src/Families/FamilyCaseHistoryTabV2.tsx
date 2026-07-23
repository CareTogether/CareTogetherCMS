import {
  Box,
  Chip,
  ListItemButton,
  Typography,
} from '@mui/material';
import { PermPhoneMsg as PermPhoneMsgIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import { V1Case, V1Referral } from '../GeneratedClient';
import { formatStatusWithDate } from '../V1Referrals/formatStatusWithDate';

export type FamilyCaseHistoryRowV2 = {
  v1Case: V1Case;
  linkedReferrals: V1Referral[];
};

type FamilyCaseHistoryTabV2Props = {
  caseRows: FamilyCaseHistoryRowV2[];
  referralsEnabled: boolean | undefined;
  selectedV1CaseId?: string;
  unlinkedReferrals: V1Referral[];
  onReferralOpen: (referralId: string) => void;
  onSelectCase: (v1CaseId: string) => void;
};

function referralSummaryLabel(referral: V1Referral) {
  return `${referral.title} \u00b7 ${formatStatusWithDate(
    referral.status,
    referral.createdAtUtc,
    referral.acceptedAtUtc,
    referral.closedAtUtc
  )}`;
}

export function FamilyCaseHistoryTabV2({
  caseRows,
  referralsEnabled,
  selectedV1CaseId,
  unlinkedReferrals,
  onReferralOpen,
  onSelectCase,
}: FamilyCaseHistoryTabV2Props) {
  return (
    <Box
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        bgcolor: 'background.paper',
        p: 2,
        mb: 2,
      }}
    >
      <Typography className="ph-unmask" variant="h3" sx={{ mb: 2 }}>
        Case History
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {caseRows.length === 0 ? (
          <Typography color="text.secondary" variant="body2">
            No cases yet.
          </Typography>
        ) : (
          caseRows.map(({ v1Case, linkedReferrals }) => {
            const isSelected = selectedV1CaseId === v1Case.id;
            const caseStatus = v1Case.closedAtUtc ? 'Closed' : 'Open';

            return (
              <ListItemButton
                key={v1Case.id}
                selected={isSelected}
                onClick={() => onSelectCase(v1Case.id)}
                sx={{
                  alignItems: 'flex-start',
                  border: 1,
                  borderColor: isSelected ? 'primary.main' : 'divider',
                  borderRadius: 1,
                  gap: 2,
                }}
              >
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      flexWrap: 'wrap',
                      mb: 0.5,
                    }}
                  >
                    <Typography
                      className="ph-unmask"
                      variant="body2"
                      sx={{ fontWeight: 600 }}
                    >
                      {v1Case.closedAtUtc ? 'Closed Case' : 'Open Case'}
                    </Typography>
                    <Chip
                      size="small"
                      color={v1Case.closedAtUtc ? 'default' : 'success'}
                      label={caseStatus}
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Opened {format(v1Case.openedAtUtc, 'M/d/yy')}
                    {v1Case.closedAtUtc && (
                      <>
                        {' \u00b7 Closed '}
                        {format(v1Case.closedAtUtc, 'M/d/yy')}
                      </>
                    )}
                    {v1Case.closeReason && (
                      <>
                        {' \u00b7 '}
                        {v1Case.closeReason}
                      </>
                    )}
                  </Typography>
                  {linkedReferrals.length > 0 && (
                    <Box
                      sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 1,
                        mt: 1,
                      }}
                    >
                      {linkedReferrals.map((referral) => (
                        <Chip
                          key={referral.referralId}
                          clickable
                          size="small"
                          icon={<PermPhoneMsgIcon />}
                          label={referralSummaryLabel(referral)}
                          onClick={(event) => {
                            event.stopPropagation();
                            onReferralOpen(referral.referralId);
                          }}
                        />
                      ))}
                    </Box>
                  )}
                </Box>
              </ListItemButton>
            );
          })
        )}

        {referralsEnabled && unlinkedReferrals.length > 0 && (
          <Box sx={{ mt: 1 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mb: 1 }}
            >
              Referrals not linked to a case
            </Typography>
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1,
              }}
            >
              {unlinkedReferrals.map((referral) => (
                <Chip
                  key={referral.referralId}
                  clickable
                  size="small"
                  label={referralSummaryLabel(referral)}
                  onClick={() => onReferralOpen(referral.referralId)}
                />
              ))}
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}
