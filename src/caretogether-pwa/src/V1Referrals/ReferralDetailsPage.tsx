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
  Snackbar,
  Alert,
} from '@mui/material';
import { useRecoilValue } from 'recoil';

import { useFamilyLookup } from '../Model/DirectoryModel';
import { familyNameString } from '../Families/FamilyName';
import { useScreenTitle } from '../Shell/ShellScreenTitle';
import {
  visibleReferralsQuery,
  selectedLocationContextState,
} from '../Model/Data';
import { useV1ReferralsModel } from '../Model/V1ReferralsModel';
import {
  V1ReferralStatus,
  CustomField,
  CustomFieldType,
} from '../GeneratedClient';

import { MissingRequirementRow } from '../Requirements/MissingRequirementRow';
import { CompletedRequirementRow } from '../Requirements/CompletedRequirementRow';
import { ExemptedRequirementRow } from '../Requirements/ExemptedRequirementRow';
import { V1ReferralContext } from '../Requirements/RequirementContext';
import { CreatePartneringFamilyDrawer } from '../V1Cases/CreatePartneringFamilyDrawer';
import { partneringFamiliesData } from '../Model/V1CasesModel';
import { useLoadable } from '../Hooks/useLoadable';
import { EditReferralDrawer } from '../V1Referrals/EditReferralDrawer';
import { policyData } from '../Model/ConfigurationModel';
import { OpenNewV1CaseDialog } from '../V1Cases/OpenNewV1CaseDialog';
import { useAppNavigate } from '../Hooks/useAppNavigate';
import { CloseV1ReferralDrawer } from './CloseV1ReferralDrawer';
import { downloadV1ReferralFile } from '../Model/FilesModel';

import { AddEditV1ReferralNoteDialog } from './AddEditV1ReferralNoteDialog';
import { ReferralTimeline } from './V1ReferralTimeline';

function formatStatusWithDate(
  status: V1ReferralStatus,
  openedAt?: Date,
  acceptedAt?: Date,
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

  if (status === V1ReferralStatus.Accepted) {
    return `Accepted on ${format(acceptedAt)}`;
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
  const appNavigate = useAppNavigate();

  const { reopenReferral, updateReferralFamily } = useV1ReferralsModel();

  const { organizationId, locationId } = useRecoilValue(
    selectedLocationContextState
  );

  const [working, setWorking] = useState(false);
  const [openCreateFamily, setOpenCreateFamily] = useState(false);
  const [selectingFamily, setSelectingFamily] = useState(false);
  const [openEditReferral, setOpenEditReferral] = useState(false);
  const [openOpenCaseDialog, setOpenOpenCaseDialog] = useState(false);
  const [showAcceptedMessage, setShowAcceptedMessage] = useState(false);
  const [openCloseReferralDialog, setOpenCloseReferralDialog] = useState(false);

  const [openAddNoteDialog, setOpenAddNoteDialog] = useState(false);

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

  const referralRequirementContext: V1ReferralContext = {
    kind: 'V1Referral',
    referralId: referral.referralId,
  };

  const family = referral.familyId
    ? familyLookup(referral.familyId)
    : undefined;

  const familyHasOpenCase = !!family?.partneringFamilyInfo?.openV1Case;

  const isOpen = referral.status === V1ReferralStatus.Open;
  const isClosed = referral.status === V1ReferralStatus.Closed;
  const canSelectFamily = isOpen && !referral.familyId;

  const familyOptions = families.map((f) => ({
    id: f.family?.id ?? '',
    label: familyNameString(f),
    family: f,
  }));

  const referralCustomFields: CustomField[] =
    policy.referralPolicy?.customFields ?? [];
  const referralRequirements =
    policy.referralPolicy?.intakeRequirements?.filter((req) => {
      const completed = referral.completedRequirements?.some(
        (c) => c.requirementName === req.actionName
      );

      const exempted = referral.exemptedRequirements?.some(
        (e) => e.requirementName === req.actionName
      );

      return !completed && !exempted;
    }) ?? [];

  async function handleSelectFamily(familyId: string) {
    if (!referral || working) return;

    const selectedFamily = familyLookup(familyId);
    const hasOpenCase = !!selectedFamily?.partneringFamilyInfo?.openV1Case;

    try {
      setWorking(true);

      await updateReferralFamily(referral.referralId, familyId);

      if (hasOpenCase) {
        setShowAcceptedMessage(true);
      }

      setSelectingFamily(false);
    } finally {
      setWorking(false);
    }
  }

  return (
    <Grid container sx={{ p: 3 }} spacing={0}>
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
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          {isOpen && (
            <Button
              variant="outlined"
              onClick={() => setOpenEditReferral(true)}
            >
              Edit Referral
            </Button>
          )}

          {isOpen && !referral.familyId && (
            <Button
              variant="outlined"
              onClick={() => setOpenCloseReferralDialog(true)}
            >
              Close Referral
            </Button>
          )}

          {isClosed && (
            <Button
              variant="contained"
              disabled={working}
              onClick={async () => {
                setWorking(true);
                try {
                  await reopenReferral(referral.referralId);
                } finally {
                  setWorking(false);
                }
              }}
            >
              Reopen Referral
            </Button>
          )}

          {isOpen && referral.familyId && !familyHasOpenCase && (
            <Button
              variant="contained"
              onClick={() => setOpenOpenCaseDialog(true)}
            >
              Open Case
            </Button>
          )}

          {!isClosed && !referral.familyId && (
            <Button
              variant="contained"
              onClick={() => setOpenCreateFamily(true)}
            >
              ADD NEW CLIENT FAMILY
            </Button>
          )}

          {canSelectFamily && !selectingFamily && (
            <Button
              variant="contained"
              onClick={() => setSelectingFamily(true)}
            >
              Select Family
            </Button>
          )}
        </Box>
      </Grid>

      <Grid container spacing={0}>
        <Grid item xs={12} md={4} sx={{ pr: { md: 2 }, mb: { xs: 3, md: 0 } }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Timeline
          </Typography>
          <ReferralTimeline referral={referral} />
        </Grid>

        <Grid item xs={12} md={8}>
          <Grid item xs={12} sx={{ mb: 2 }}>
            <Typography>
              <strong>Status:</strong>{' '}
              {formatStatusWithDate(
                referral.status,
                referral.createdAtUtc,
                referral.acceptedAtUtc,
                referral.closedAtUtc
              )}
            </Typography>

            <Box sx={{ mt: 1 }}>
              {family && (
                <Typography>
                  <strong>Family:</strong>{' '}
                  <Button
                    variant="text"
                    sx={{ padding: 0, minWidth: 'auto', textTransform: 'none' }}
                    onClick={() => appNavigate.family(family.family.id)}
                  >
                    {familyNameString(family)}
                  </Button>
                </Typography>
              )}

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
              {referralCustomFields.map((field) => {
                const value =
                  referral.completedCustomFields?.[field.name]?.value;

                let displayValue: string = '—';
                if (value !== null && value !== undefined && value !== '') {
                  displayValue =
                    field.type === CustomFieldType.Boolean
                      ? value === true
                        ? 'Yes'
                        : 'No'
                      : String(value);
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

          <Divider sx={{ width: '100%', my: 3 }} />

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Incomplete Requirements
              </Typography>

              {referralRequirements.map((requirement) => (
                <MissingRequirementRow
                  key={requirement.actionName}
                  requirement={requirement}
                  context={referralRequirementContext}
                />
              ))}
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Completed Requirements
              </Typography>

              {referral.completedRequirements?.map((completed, i) => (
                <CompletedRequirementRow
                  key={`${completed.completedRequirementId}:${i}`}
                  requirement={completed}
                  context={referralRequirementContext}
                />
              ))}

              {referral.exemptedRequirements?.map((exempted, i) => (
                <ExemptedRequirementRow
                  key={`${exempted.requirementName}:${i}`}
                  requirement={exempted}
                  context={referralRequirementContext}
                />
              ))}
            </Grid>

            {(referral.uploadedDocuments?.length ?? 0) > 0 && (
              <>
                <Divider sx={{ width: '100%', my: 3 }} />
                <Grid item xs={12}>
                  <Typography fontWeight={600} sx={{ mb: 1 }}>
                    Referral Documents
                  </Typography>

                  <Box component="ul" sx={{ pl: 3, m: 0 }}>
                    {referral.uploadedDocuments!.map((doc) => (
                      <Box
                        component="li"
                        key={doc.uploadedDocumentId}
                        sx={{ cursor: 'pointer', mb: 0.5 }}
                        onClick={() =>
                          downloadV1ReferralFile(
                            organizationId,
                            locationId,
                            referral.referralId,
                            doc.uploadedDocumentId!
                          )
                        }
                      >
                        📃 {doc.uploadedFileName}
                      </Box>
                    ))}
                  </Box>
                </Grid>
              </>
            )}
          </Grid>
        </Grid>
      </Grid>

      {openCreateFamily && (
        <CreatePartneringFamilyDrawer
          onClose={async (familyId?: string) => {
            setOpenCreateFamily(false);
            if (!familyId || !referral) return;
            await handleSelectFamily(familyId);
          }}
        />
      )}

      {openEditReferral && (
        <EditReferralDrawer
          referral={referral}
          onClose={() => setOpenEditReferral(false)}
        />
      )}

      {openOpenCaseDialog && referral.familyId && (
        <OpenNewV1CaseDialog
          partneringFamilyId={referral.familyId}
          onClose={() => setOpenOpenCaseDialog(false)}
        />
      )}

      {openCloseReferralDialog && (
        <CloseV1ReferralDrawer
          referralId={referral.referralId}
          onClose={() => setOpenCloseReferralDialog(false)}
        />
      )}

      {openAddNoteDialog && (
        <AddEditV1ReferralNoteDialog
          referralId={referral.referralId}
          onClose={() => setOpenAddNoteDialog(false)}
        />
      )}

      <Snackbar
        open={showAcceptedMessage}
        autoHideDuration={5000}
        onClose={() => setShowAcceptedMessage(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity="warning"
          variant="filled"
          onClose={() => setShowAcceptedMessage(false)}
        >
          This referral has been accepted since the family already has an open
          case.
        </Alert>
      </Snackbar>
    </Grid>
  );
}
