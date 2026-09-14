import Grid from '../Generic/GridLegacyCompat';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  Stack,
  Typography,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  AddCircle as AddCircleIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';

import { familyNameString } from '../Families/FamilyName';
import { useScreenTitle } from '../Shell/ShellScreenTitle';
import { useRequiredSelectedLocationContext } from '../Model/Data';

import { MissingRequirementRow } from '../Requirements/MissingRequirementRow';
import { CompletedRequirementRow } from '../Requirements/CompletedRequirementRow';
import { ExemptedRequirementRow } from '../Requirements/ExemptedRequirementRow';
import { V1ReferralContext } from '../Requirements/RequirementContext';
import { CreatePartneringFamilyDrawer } from '../V1Cases/CreatePartneringFamilyDrawer';
import { EditReferralDrawer } from '../V1Referrals/EditReferralDrawer';
import { OpenNewV1CaseDialog } from '../V1Cases/OpenNewV1CaseDialog';
import { useAppNavigate } from '../Hooks/useAppNavigate';
import { CloseV1ReferralDrawer } from './CloseV1ReferralDrawer';
import { downloadV1ReferralFile } from '../Model/FilesModel';

import { AddEditV1ReferralNoteDialog } from './AddEditV1ReferralNoteDialog';
import { ReferralTimeline } from './V1ReferralTimeline';
import { SelectReferralFamilyDrawer } from './SelectReferralFamilyDrawer';
import { UploadV1ReferralDocumentsDialog } from './UploadV1ReferralDocumentsDialog';
import { LinkReferralToExistingCaseDialog } from './LinkReferralToExistingCaseDialog';
import { formatStatusWithDate } from './formatStatusWithDate';
import { FunctionAssignmentsSection } from '../FunctionAssignments/FunctionAssignmentsSection';
import { useReferralDetailsCommands } from './useReferralDetailsCommands';
import { useReferralFamilyCaseWorkflow } from './useReferralFamilyCaseWorkflow';
import { useReferralDetailsViewModel } from './useReferralDetailsViewModel';

export function ReferralDetailsPage() {
  useScreenTitle('Referrals');

  const { referralId } = useParams<{ referralId: string }>();
  const appNavigate = useAppNavigate();

  const { organizationId, locationId } = useRequiredSelectedLocationContext();

  const [openEditReferral, setOpenEditReferral] = useState(false);
  const [openOpenCaseDialog, setOpenOpenCaseDialog] = useState(false);
  const [showAcceptedMessage, setShowAcceptedMessage] = useState(false);
  const [openCloseReferralDialog, setOpenCloseReferralDialog] = useState(false);
  const [openAddNoteDialog, setOpenAddNoteDialog] = useState(false);
  const [openUploadDocumentDialog, setOpenUploadDocumentDialog] =
    useState(false);

  const {
    buildCaseOptionsForFamily,
    canCloseReferral,
    canCreateClientFamily,
    canEditFunctionAssignments,
    canEditReferral,
    canLinkExistingCase,
    canOpenCase,
    canReopenReferral,
    canSelectFamily,
    canViewFunctionAssignments,
    family,
    familyOptions,
    functionAssignmentPolicies,
    functionAssignmentsEnabled,
    isClosed,
    isOpen,
    linkedV1Case,
    linkedV1CaseLabel,
    referral,
    referralAlreadyLinkedToCase,
    referralCustomFieldDisplayRows,
    referralDocumentDisplayRows,
    referralRequirements,
  } = useReferralDetailsViewModel(referralId);
  const {
    closeCreateFamilyWorkflow,
    closeSelectFamilyWorkflow,
    continueAfterFamilySelected,
    openCreateFamily,
    openCreateFamilyWorkflow,
    openLinkCaseDialog,
    openLinkExistingCaseDialog,
    openSelectFamilyDrawer,
    openSelectFamilyWorkflow,
    resetLinkCaseDialogState,
    selectedCaseIdToLink,
    selectedFamilyCaseOptions,
    setSelectedCaseIdToLink,
  } = useReferralFamilyCaseWorkflow({
    buildCaseOptionsForFamily,
    family,
    referralAlreadyLinkedToCase,
  });
  const {
    assignIndividualVolunteerToReferral,
    linkReferralToSelectedCase,
    reopenCurrentReferral,
    saveNewFamily,
    saveSelectedExistingFamily,
    unassignIndividualVolunteerFromReferral,
    working,
  } = useReferralDetailsCommands({
    onNewFamilySaved: closeCreateFamilyWorkflow,
    onReferralLinkedToCase: () => {
      resetLinkCaseDialogState();
      setShowAcceptedMessage(true);
    },
    onSelectedExistingFamilySaved: continueAfterFamilySelected,
  });

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

  const detailLinkButtonSx = {
    padding: 0,
    minWidth: 'auto',
    textTransform: 'none',
    fontSize: 'inherit',
    fontWeight: 'inherit',
    lineHeight: 'inherit',
    verticalAlign: 'baseline',
  };

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
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {currentReferral.title}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          {!isClosed && canEditReferral && (
            <Button
              variant="outlined"
              onClick={() => setOpenEditReferral(true)}
            >
              Edit Referral
            </Button>
          )}

          {isOpen && canCloseReferral && (
            <Button
              variant="outlined"
              onClick={() => setOpenCloseReferralDialog(true)}
            >
              Close Referral
            </Button>
          )}

          {isClosed && canReopenReferral && (
            <Button
              variant="contained"
              disabled={working}
              onClick={() => {
                void reopenCurrentReferral(currentReferral.referralId);
              }}
            >
              Reopen Referral
            </Button>
          )}

          {canOpenCase && (
            <Button
              variant="contained"
              onClick={() => setOpenOpenCaseDialog(true)}
            >
              Open Case
            </Button>
          )}

          {canLinkExistingCase && (
            <Button
              variant="outlined"
              onClick={openLinkExistingCaseDialog}
            >
              Link to Existing Case
            </Button>
          )}
          {canCreateClientFamily && (
            <Button
              variant="contained"
              onClick={openCreateFamilyWorkflow}
            >
              ADD NEW CLIENT FAMILY
            </Button>
          )}

          {canSelectFamily && (
            <Button
              variant="contained"
              onClick={openSelectFamilyWorkflow}
            >
              Select Family
            </Button>
          )}
        </Box>
      </Grid>

      <Grid item xs={12} container spacing={0}>
        <Grid item xs={12} md={4} sx={{ pr: { md: 2 }, mb: { xs: 3, md: 0 } }}>
          <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
            {canEditReferral && (
              <Button
                variant="contained"
                size="small"
                sx={{ margin: 1 }}
                startIcon={<AddCircleIcon />}
                onClick={() => setOpenAddNoteDialog(true)}
              >
                Note
              </Button>
            )}

            {!isClosed && canEditReferral && (
              <Button
                variant="contained"
                size="small"
                sx={{ margin: 1 }}
                startIcon={<CloudUploadIcon />}
                onClick={() => setOpenUploadDocumentDialog(true)}
              >
                Upload
              </Button>
            )}
          </Box>

          <ReferralTimeline
            referral={currentReferral}
            canManageNotes={canEditReferral}
          />
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
                        {linkedV1CaseLabel}
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

          {referralCustomFieldDisplayRows.length > 0 && (
            <Grid item xs={12} sx={{ mb: 2 }}>
              {referralCustomFieldDisplayRows.map((field) => (
                <Typography key={field.name} variant="body2" sx={{ mb: 0.5 }}>
                  <strong>{field.name}:</strong> {field.displayValue}
                </Typography>
              ))}
            </Grid>
          )}

          {currentReferral.comment && (
            <Grid item xs={12}>
              <Typography sx={{ fontWeight: 600, mb: 1 }}>
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

          {functionAssignmentsEnabled && canViewFunctionAssignments && (
            <Grid item xs={12} sx={{ mt: 2 }}>
              <FunctionAssignmentsSection
                assignments={currentReferral.assignedIndividualVolunteers ?? []}
                policies={functionAssignmentPolicies}
                canEdit={canEditFunctionAssignments}
                onAssign={(personId, assignmentRole) =>
                  assignIndividualVolunteerToReferral(
                    currentReferral.referralId,
                    personId,
                    assignmentRole
                  )
                }
                onUnassign={(personId, assignmentRole) =>
                  unassignIndividualVolunteerFromReferral(
                    currentReferral.referralId,
                    personId,
                    assignmentRole
                  )
                }
              />
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

            {referralDocumentDisplayRows.length > 0 && (
              <>
                <Divider sx={{ width: '100%', my: 3 }} />
                <Grid item xs={12}>
                  <Typography sx={{ fontWeight: 600, mb: 1 }}>
                    Referral Documents
                  </Typography>

                  <Box component="ul" sx={{ pl: 3, m: 0 }}>
                    {referralDocumentDisplayRows.map((doc) => (
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

      {openCreateFamily && canCreateClientFamily && (
        <CreatePartneringFamilyDrawer
          onClose={async (familyId?: string) => {
            closeCreateFamilyWorkflow();
            if (!familyId) return;
            await saveNewFamily(currentReferral.referralId, familyId);
          }}
        />
      )}

      {openEditReferral && canEditReferral && (
        <EditReferralDrawer
          referral={currentReferral}
          onClose={() => setOpenEditReferral(false)}
        />
      )}

      {openOpenCaseDialog && canOpenCase && currentReferral.familyId && (
        <OpenNewV1CaseDialog
          partneringFamilyId={currentReferral.familyId}
          referralId={currentReferral.referralId}
          onClose={() => setOpenOpenCaseDialog(false)}
        />
      )}

      {openCloseReferralDialog && canCloseReferral && (
        <CloseV1ReferralDrawer
          referralId={currentReferral.referralId}
          onClose={() => setOpenCloseReferralDialog(false)}
        />
      )}

      {openAddNoteDialog && canEditReferral && (
        <AddEditV1ReferralNoteDialog
          referralId={currentReferral.referralId}
          onClose={() => setOpenAddNoteDialog(false)}
        />
      )}

      {openUploadDocumentDialog && !isClosed && canEditReferral && (
        <UploadV1ReferralDocumentsDialog
          referralId={currentReferral.referralId}
          onClose={() => setOpenUploadDocumentDialog(false)}
        />
      )}

      <SelectReferralFamilyDrawer
        open={openSelectFamilyDrawer && canSelectFamily}
        working={working}
        familyOptions={familyOptions}
        onCancel={closeSelectFamilyWorkflow}
        onSave={(familyId) =>
          saveSelectedExistingFamily(currentReferral.referralId, familyId)
        }
      />

      <LinkReferralToExistingCaseDialog
        open={openLinkCaseDialog && canLinkExistingCase}
        working={working}
        caseOptions={selectedFamilyCaseOptions}
        selectedCaseId={selectedCaseIdToLink}
        onSelectedCaseIdChange={setSelectedCaseIdToLink}
        onClose={resetLinkCaseDialogState}
        onLink={() =>
          linkReferralToSelectedCase({
            familyId: currentReferral.familyId,
            referralId: currentReferral.referralId,
            selectedCaseId: selectedCaseIdToLink,
          })
        }
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
