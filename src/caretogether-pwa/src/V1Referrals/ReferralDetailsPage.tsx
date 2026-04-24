import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  Grid,
  Stack,
  Typography,
  Snackbar,
  Alert,
} from '@mui/material';
import { useRecoilValue } from 'recoil';
import {
  AddCircle as AddCircleIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';

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
import {
  SelectReferralFamilyDrawer,
  FamilyOption,
} from './SelectReferralFamilyDrawer';
import { UploadV1ReferralDocumentsDialog } from './UploadV1ReferralDocumentsDialog';
import {
  LinkReferralToExistingCaseDialog,
  LinkReferralToExistingCaseOption,
} from './LinkReferralToExistingCaseDialog';
import { formatStatusWithDate } from './formatStatusWithDate';

function formatDate(date?: Date) {
  return date
    ? new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(date)
    : undefined;
}

function formatCaseLabel(isOpenCase: boolean, closedAtUtc?: Date) {
  if (isOpenCase) {
    return 'Open Case';
  }

  const closedDate = formatDate(closedAtUtc);
  return closedDate ? `Closed Case (${closedDate})` : 'Closed Case';
}

export function ReferralDetailsPage() {
  useScreenTitle('Referrals');

  const { referralId } = useParams<{ referralId: string }>();
  const referrals = useRecoilValue(visibleReferralsQuery);
  const familyLookup = useFamilyLookup();
  const families = useLoadable(partneringFamiliesData) || [];
  const policy = useRecoilValue(policyData);
  const appNavigate = useAppNavigate();

  const { reopenReferral, updateReferralFamily, linkReferralToCaseAndAccept } =
    useV1ReferralsModel();

  const { organizationId, locationId } = useRecoilValue(
    selectedLocationContextState
  );

  const [working, setWorking] = useState(false);
  const [openCreateFamily, setOpenCreateFamily] = useState(false);
  const [openEditReferral, setOpenEditReferral] = useState(false);
  const [openOpenCaseDialog, setOpenOpenCaseDialog] = useState(false);
  const [showAcceptedMessage, setShowAcceptedMessage] = useState(false);
  const [openCloseReferralDialog, setOpenCloseReferralDialog] = useState(false);
  const [openAddNoteDialog, setOpenAddNoteDialog] = useState(false);
  const [openUploadDocumentDialog, setOpenUploadDocumentDialog] =
    useState(false);
  const [openSelectFamilyDrawer, setOpenSelectFamilyDrawer] = useState(false);
  const [openLinkCaseDialog, setOpenLinkCaseDialog] = useState(false);
  const [selectedFamilyCaseOptions, setSelectedFamilyCaseOptions] = useState<
    LinkReferralToExistingCaseOption[]
  >([]);
  const [selectedCaseIdToLink, setSelectedCaseIdToLink] = useState<string>('');

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

  const currentReferral = referral;

  const referralRequirementContext: V1ReferralContext = {
    kind: 'V1Referral',
    referralId: currentReferral.referralId,
  };

  const family = currentReferral.familyId
    ? familyLookup(currentReferral.familyId)
    : undefined;

  const linkedV1Case =
    family?.partneringFamilyInfo?.openV1Case?.linkedV1ReferralIds?.includes(
      currentReferral.referralId
    )
      ? family.partneringFamilyInfo.openV1Case
      : family?.partneringFamilyInfo?.closedV1Cases?.find((v1Case) =>
          v1Case.linkedV1ReferralIds?.includes(currentReferral.referralId)
        );

  const familyHasOpenCase = !!family?.partneringFamilyInfo?.openV1Case;

  const referralAlreadyLinkedToCase = !!linkedV1Case;

  const familyHasAnyCase =
    !!family?.partneringFamilyInfo?.openV1Case ||
    (family?.partneringFamilyInfo?.closedV1Cases?.length ?? 0) > 0;

  const isOpen = currentReferral.status === V1ReferralStatus.Open;
  const isClosed = currentReferral.status === V1ReferralStatus.Closed;
  const canSelectFamily = isOpen && !currentReferral.familyId;

  const familyOptions: FamilyOption[] = families
    .filter((f) => f.family?.id)
    .map((f) => ({
      id: f.family!.id,
      label: familyNameString(f),
    }));

  const referralCustomFields: CustomField[] =
    policy.referralPolicy?.customFields ?? [];

  const referralRequirements = referral.missingIntakeRequirements ?? [];

  const detailLinkButtonSx = {
    padding: 0,
    minWidth: 'auto',
    textTransform: 'none',
    fontSize: 'inherit',
    fontWeight: 'inherit',
    lineHeight: 'inherit',
    verticalAlign: 'baseline',
  };

  function buildCaseOptionsForFamily(familyId: string) {
    const selectedFamily = familyLookup(familyId);

    return [
      ...(selectedFamily?.partneringFamilyInfo?.openV1Case
        ? [
            {
              id: selectedFamily.partneringFamilyInfo.openV1Case.id,
              label: formatCaseLabel(true),
            },
          ]
        : []),
      ...(selectedFamily?.partneringFamilyInfo?.closedV1Cases?.map(
        (v1Case) => ({
          id: v1Case.id,
          label: formatCaseLabel(false, v1Case.closedAtUtc),
        })
      ) ?? []),
    ];
  }

  function resetLinkCaseDialogState() {
    setOpenLinkCaseDialog(false);
    setSelectedFamilyCaseOptions([]);
    setSelectedCaseIdToLink('');
  }

  async function handleSaveSelectedExistingFamily(
    currentReferralId: string,
    familyId: string
  ) {
    if (working) return;

    try {
      setWorking(true);
      await updateReferralFamily(currentReferralId, familyId);
      setOpenSelectFamilyDrawer(false);

      const caseOptions = buildCaseOptionsForFamily(familyId);

      if (caseOptions.length > 0) {
        setSelectedFamilyCaseOptions(caseOptions);
        setSelectedCaseIdToLink(caseOptions[0].id);
        setOpenLinkCaseDialog(true);
      }
    } finally {
      setWorking(false);
    }
  }

  async function handleSaveNewFamily(
    currentReferralId: string,
    familyId: string
  ) {
    if (working) return;

    try {
      setWorking(true);
      await updateReferralFamily(currentReferralId, familyId);
      setOpenCreateFamily(false);
    } finally {
      setWorking(false);
    }
  }

  async function handleLinkReferralToSelectedCase() {
    if (!currentReferral.familyId || !selectedCaseIdToLink || working) return;

    try {
      setWorking(true);
      await linkReferralToCaseAndAccept(
        currentReferral.familyId,
        selectedCaseIdToLink,
        currentReferral.referralId,
        new Date()
      );
      resetLinkCaseDialogState();
      setShowAcceptedMessage(true);
    } finally {
      setWorking(false);
    }
  }

  function handleOpenLinkExistingCaseDialog() {
    if (!family || referralAlreadyLinkedToCase) return;

    const caseOptions = buildCaseOptionsForFamily(family.family.id);

    if (caseOptions.length === 0) return;

    setSelectedFamilyCaseOptions(caseOptions);
    setSelectedCaseIdToLink(caseOptions[0].id);
    setOpenLinkCaseDialog(true);
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
            {currentReferral.title}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          {!isClosed && (
            <Button
              variant="outlined"
              onClick={() => setOpenEditReferral(true)}
            >
              Edit Referral
            </Button>
          )}

          {isOpen && (
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
                  await reopenReferral(currentReferral.referralId);
                } finally {
                  setWorking(false);
                }
              }}
            >
              Reopen Referral
            </Button>
          )}

          {isOpen && currentReferral.familyId && !familyHasOpenCase && (
            <Button
              variant="contained"
              onClick={() => setOpenOpenCaseDialog(true)}
            >
              Open Case
            </Button>
          )}

          {!isClosed &&
            currentReferral.familyId &&
            familyHasAnyCase &&
            !referralAlreadyLinkedToCase && (
              <Button
                variant="outlined"
                onClick={handleOpenLinkExistingCaseDialog}
              >
                Link to Existing Case
              </Button>
            )}
          {!isClosed && !currentReferral.familyId && (
            <Button
              variant="contained"
              onClick={() => setOpenCreateFamily(true)}
            >
              ADD NEW CLIENT FAMILY
            </Button>
          )}

          {canSelectFamily && (
            <Button
              variant="contained"
              onClick={() => setOpenSelectFamilyDrawer(true)}
            >
              Select Family
            </Button>
          )}
        </Box>
      </Grid>

      <Grid container spacing={0}>
        <Grid item xs={12} md={4} sx={{ pr: { md: 2 }, mb: { xs: 3, md: 0 } }}>
          <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="small"
              sx={{ margin: 1 }}
              startIcon={<AddCircleIcon />}
              onClick={() => setOpenAddNoteDialog(true)}
            >
              Note
            </Button>

            <Button
              variant="contained"
              size="small"
              sx={{ margin: 1 }}
              startIcon={<CloudUploadIcon />}
              disabled={isClosed}
              onClick={() => setOpenUploadDocumentDialog(true)}
            >
              Upload
            </Button>
          </Box>

          <ReferralTimeline referral={currentReferral} />
        </Grid>

        <Grid item xs={12} md={8}>
          <Grid item xs={12} sx={{ mb: 2 }}>
            <Stack spacing={0.5}>
              <Typography>
                <strong>Status:</strong>{' '}
                {formatStatusWithDate(
                  currentReferral.status,
                  currentReferral.createdAtUtc,
                  currentReferral.acceptedAtUtc,
                  currentReferral.closedAtUtc
                )}
              </Typography>

              {family ? (
                <>
                  <Typography>
                    <strong>Family:</strong>{' '}
                    <Button
                      variant="text"
                      sx={detailLinkButtonSx}
                      onClick={() => appNavigate.family(family.family.id)}
                    >
                      {familyNameString(family)}
                    </Button>
                  </Typography>

                  <Typography>
                    <strong>Case:</strong>{' '}
                    {linkedV1Case ? (
                      <Button
                        variant="text"
                        sx={detailLinkButtonSx}
                        onClick={() =>
                          appNavigate.family(family.family.id, linkedV1Case.id)
                        }
                      >
                        {formatCaseLabel(
                          linkedV1Case ===
                            family.partneringFamilyInfo?.openV1Case,
                          linkedV1Case.closedAtUtc
                        )}
                      </Button>
                    ) : (
                      '—'
                    )}
                  </Typography>
                </>
              ) : (
                <>
                  <Typography>
                    <strong>Family:</strong> —
                  </Typography>

                  <Typography>
                    <strong>Case:</strong> —
                  </Typography>
                </>
              )}
            </Stack>
          </Grid>

          <Divider sx={{ width: '100%', mb: 2 }} />

          {referralCustomFields.length > 0 && (
            <Grid item xs={12} sx={{ mb: 2 }}>
              {referralCustomFields.map((field) => {
                const value =
                  currentReferral.completedCustomFields?.[field.name]?.value;

                let displayValue = '—';
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

          {currentReferral.comment && (
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
                {currentReferral.comment}
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

              {currentReferral.completedRequirements?.map((completed, i) => (
                <CompletedRequirementRow
                  key={`${completed.completedRequirementId}:${i}`}
                  requirement={completed}
                  context={referralRequirementContext}
                />
              ))}

              {currentReferral.exemptedRequirements?.map((exempted, i) => (
                <ExemptedRequirementRow
                  key={`${exempted.requirementName}:${i}`}
                  requirement={exempted}
                  context={referralRequirementContext}
                />
              ))}
            </Grid>

            {(currentReferral.uploadedDocuments?.length ?? 0) > 0 && (
              <>
                <Divider sx={{ width: '100%', my: 3 }} />
                <Grid item xs={12}>
                  <Typography fontWeight={600} sx={{ mb: 1 }}>
                    Referral Documents
                  </Typography>

                  <Box component="ul" sx={{ pl: 3, m: 0 }}>
                    {currentReferral.uploadedDocuments.map((doc) => (
                      <Box
                        component="li"
                        key={doc.uploadedDocumentId}
                        sx={{ cursor: 'pointer', mb: 0.5 }}
                        onClick={() =>
                          downloadV1ReferralFile(
                            organizationId,
                            locationId,
                            currentReferral.referralId,
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
            if (!familyId) return;
            await handleSaveNewFamily(currentReferral.referralId, familyId);
          }}
        />
      )}

      {openEditReferral && (
        <EditReferralDrawer
          referral={currentReferral}
          onClose={() => setOpenEditReferral(false)}
        />
      )}

      {openOpenCaseDialog && currentReferral.familyId && (
        <OpenNewV1CaseDialog
          partneringFamilyId={currentReferral.familyId}
          referralId={currentReferral.referralId}
          onClose={() => setOpenOpenCaseDialog(false)}
        />
      )}

      {openCloseReferralDialog && (
        <CloseV1ReferralDrawer
          referralId={currentReferral.referralId}
          onClose={() => setOpenCloseReferralDialog(false)}
        />
      )}

      {openAddNoteDialog && (
        <AddEditV1ReferralNoteDialog
          referralId={currentReferral.referralId}
          onClose={() => setOpenAddNoteDialog(false)}
        />
      )}

      {openUploadDocumentDialog && (
        <UploadV1ReferralDocumentsDialog
          referralId={currentReferral.referralId}
          onClose={() => setOpenUploadDocumentDialog(false)}
        />
      )}

      <SelectReferralFamilyDrawer
        open={openSelectFamilyDrawer}
        working={working}
        familyOptions={familyOptions}
        onCancel={() => setOpenSelectFamilyDrawer(false)}
        onSave={(familyId) =>
          handleSaveSelectedExistingFamily(currentReferral.referralId, familyId)
        }
      />

      <LinkReferralToExistingCaseDialog
        open={openLinkCaseDialog}
        working={working}
        caseOptions={selectedFamilyCaseOptions}
        selectedCaseId={selectedCaseIdToLink}
        onSelectedCaseIdChange={setSelectedCaseIdToLink}
        onClose={resetLinkCaseDialogState}
        onLink={handleLinkReferralToSelectedCase}
      />

      <Snackbar
        open={showAcceptedMessage}
        autoHideDuration={5000}
        onClose={() => setShowAcceptedMessage(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() => setShowAcceptedMessage(false)}
        >
          Referral linked and accepted.
        </Alert>
      </Snackbar>
    </Grid>
  );
}
