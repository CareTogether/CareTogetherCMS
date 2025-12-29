import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  Grid,
  Typography,
} from '@mui/material';
import { useRecoilValue } from 'recoil';
import { useFamilyLookup } from '../Model/DirectoryModel';
import { FamilyName } from '../Families/FamilyName';
import { useScreenTitle } from '../Shell/ShellScreenTitle';
import { referralsQuery, useV1ReferralsModel } from '../Model/V1ReferralsModel';
import { V1ReferralStatus } from '../GeneratedClient';
import { CreatePartneringFamilyDialog } from '../V1Cases/CreatePartneringFamilyDrawer';

function statusToLabel(status: V1ReferralStatus): 'Open' | 'Closed' {
  return status === V1ReferralStatus.Open ? 'Open' : 'Closed';
}

export function ReferralDetailsPage() {
  useScreenTitle('Referrals');

  const { referralId } = useParams<{ referralId: string }>();
  const familyLookup = useFamilyLookup();

  const referrals = useRecoilValue(referralsQuery);
  const { closeReferral, reopenReferral } = useV1ReferralsModel();

  const [working, setWorking] = useState(false);
  const [openCreateFamily, setOpenCreateFamily] = useState(false);

  const referral = useMemo(
    () => referrals.find((r) => r.referralId === referralId),
    [referrals, referralId]
  );

  if (!referralId) {
    return <Typography sx={{ p: 3 }}>Invalid referral.</Typography>;
  }

  if (!referral) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  const family = referral.familyId
    ? familyLookup(referral.familyId)
    : undefined;

  const isClosed = referral.status === V1ReferralStatus.Closed;

  async function handleToggleReferral() {
    if (!referral || working) return;

    try {
      setWorking(true);

      if (isClosed) {
        await reopenReferral(referral.referralId);
      } else {
        await closeReferral(referral.referralId);
      }
    } finally {
      setWorking(false);
    }
  }

  return (
    <Grid container sx={{ p: 3 }}>
      <Grid
        item
        xs={12}
        sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}
      >
        <Typography variant="h5" fontWeight={600}>
          {referral.title}
        </Typography>

        <Box sx={{ display: 'flex', gap: 2 }}>
          {!isClosed && (
            <Button
              variant="contained"
              onClick={() => setOpenCreateFamily(true)}
            >
              Open Case
            </Button>
          )}

          <Button
            variant="contained"
            color="primary"
            disabled={working}
            onClick={handleToggleReferral}
          >
            {isClosed ? 'Reopen Referral' : 'Close Referral'}
          </Button>
        </Box>
      </Grid>

      <Grid item xs={12} sx={{ mb: 2 }}>
        <Typography>Status: {statusToLabel(referral.status)}</Typography>
        <Typography>
          Family: {family ? <FamilyName family={family} /> : <span>-</span>}
        </Typography>
      </Grid>

      <Divider sx={{ width: '100%', mb: 2 }} />

      <Grid item xs={12}>
        {referral.comment && (
          <Typography sx={{ whiteSpace: 'pre-wrap' }}>
            {referral.comment}
          </Typography>
        )}
      </Grid>

      {openCreateFamily && (
        <CreatePartneringFamilyDialog
          onClose={() => setOpenCreateFamily(false)}
        />
      )}
    </Grid>
  );
}
