import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  Grid,
  Typography,
  Autocomplete,
  TextField,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { useRecoilValue } from 'recoil';

import { useFamilyLookup } from '../Model/DirectoryModel';
import { FamilyName, familyNameString } from '../Families/FamilyName';
import { useScreenTitle } from '../Shell/ShellScreenTitle';
import { visibleReferralsQuery } from '../Model/Data';
import { useV1ReferralsModel } from '../Model/V1ReferralsModel';
import {
  V1ReferralStatus,
  CustomField,
  CustomFieldType,
} from '../GeneratedClient';
import { CreatePartneringFamilyDialog } from '../V1Cases/CreatePartneringFamilyDrawer';
import { partneringFamiliesData } from '../Model/V1CasesModel';
import { useLoadable } from '../Hooks/useLoadable';
import { EditReferralDrawer } from '../V1Referrals/EditReferralDrawer';
import { policyData } from '../Model/ConfigurationModel';

function formatStatusWithDate(
  status: V1ReferralStatus,
  openedAt?: Date,
  closedAt?: Date
) {
  const format = (date?: Date) =>
    date
      ? new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }).format(date)
      : '';

  if (status === V1ReferralStatus.Open) {
    return `Open since ${format(openedAt)}`;
  }

  return `Closed on ${format(closedAt)}`;
}

export function ReferralDetailsPage() {
  useScreenTitle('Referrals');

  const { referralId } = useParams<{ referralId: string }>();
  const referrals = useRecoilValue(visibleReferralsQuery);
  const familyLookup = useFamilyLookup();
  const families = useLoadable(partneringFamiliesData) || [];
  const policy = useRecoilValue(policyData);

  const { closeReferral, reopenReferral, updateReferralFamily } =
    useV1ReferralsModel();

  const [working, setWorking] = useState(false);
  const [openCreateFamily, setOpenCreateFamily] = useState(false);
  const [selectingFamily, setSelectingFamily] = useState(false);
  const [openEditReferral, setOpenEditReferral] = useState(false);

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
  const canSelectFamily = !isClosed && !referral.familyId;

  const familyOptions = families.map((f) => ({
    id: f.family?.id ?? '',
    label: familyNameString(f),
    family: f,
  }));

  const referralCustomFields: CustomField[] =
    policy.referralPolicy?.customFields ?? [];

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

  async function handleSelectFamily(familyId: string) {
    if (!referral || working) return;

    try {
      setWorking(true);
      await updateReferralFamily(referral.referralId, familyId);
      setSelectingFamily(false);
    } finally {
      setWorking(false);
    }
  }

  return (
    <Grid container sx={{ p: 3 }}>
      <Grid
        item
        xs={12}
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h5" fontWeight={600}>
            {referral.title}
          </Typography>

          {!isClosed && (
            <Button
              size="small"
              variant="text"
              onClick={() => setOpenEditReferral(true)}
              sx={{ minWidth: 'auto', p: 0.5 }}
            >
              <EditIcon fontSize="small" />
            </Button>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {canSelectFamily && !selectingFamily && (
              <Button
                variant="contained"
                onClick={() => setSelectingFamily(true)}
              >
                Select Family
              </Button>
            )}

            {!isClosed && (
              <Button
                variant="contained"
                onClick={() => setOpenCreateFamily(true)}
              >
                Open Case
              </Button>
            )}
          </Box>

          <Button
            variant="text"
            disabled={working}
            onClick={handleToggleReferral}
          >
            {isClosed ? 'Reopen Referral' : 'Close Referral'}
          </Button>
        </Box>
      </Grid>

      <Grid item xs={12} sx={{ mb: 2 }}>
        <Typography>
          <strong>Status:</strong>{' '}
          {formatStatusWithDate(
            referral.status,
            referral.createdAtUtc,
            referral.closedAtUtc
          )}
        </Typography>

        <Box sx={{ mt: 1 }}>
          <Typography fontWeight={600}>Family</Typography>

          {family && <FamilyName family={family} />}

          {selectingFamily && (
            <Box sx={{ mt: 1, maxWidth: 400 }}>
              <Autocomplete
                options={familyOptions}
                getOptionLabel={(opt) => opt.label}
                onChange={(_, option) =>
                  option && handleSelectFamily(option.id)
                }
                renderInput={(params) => (
                  <TextField {...params} label="Select Family" />
                )}
              />
            </Box>
          )}

          {!family && !selectingFamily && <Typography>-</Typography>}
        </Box>
      </Grid>

      <Divider sx={{ width: '100%', mb: 2 }} />

      {referralCustomFields.length > 0 && (
        <Grid item xs={12} sx={{ mb: 2 }}>
          <Typography fontWeight={600} sx={{ mb: 1 }}>
            Referral Custom Fields
          </Typography>

          {referralCustomFields.map((field) => {
            const value = referral.completedCustomFields?.[field.name]?.value;

            let displayValue: string = '—';

            if (value !== null && value !== undefined && value !== '') {
              if (field.type === CustomFieldType.Boolean) {
                displayValue = value === true ? 'Yes' : 'No';
              } else {
                displayValue = String(value);
              }
            }

            return (
              <Typography key={field.name} variant="body2" sx={{ mb: 0.5 }}>
                <strong>{field.name}:</strong> {displayValue}
              </Typography>
            );
          })}
        </Grid>
      )}

      {referral.comment && (
        <Grid item xs={12}>
          <Typography fontWeight={600} sx={{ mb: 1 }}>
            Referral Comment
          </Typography>

          <Box
            sx={{
              p: 2,
              borderRadius: 1,
              bgcolor: 'grey.100',
              whiteSpace: 'pre-wrap',
            }}
          >
            {referral.comment}
          </Box>
        </Grid>
      )}

      {openCreateFamily && (
        <CreatePartneringFamilyDialog
          onClose={() => setOpenCreateFamily(false)}
        />
      )}

      {openEditReferral && (
        <EditReferralDrawer
          referral={referral}
          onClose={() => setOpenEditReferral(false)}
        />
      )}
    </Grid>
  );
}
