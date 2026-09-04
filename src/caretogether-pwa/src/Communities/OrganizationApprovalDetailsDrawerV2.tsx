import {
  Alert,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material';
import { useEffect, useState } from 'react';
import {
  CommunityInfo,
  DocumentLinkRequirement,
  EffectiveLocationPolicy,
  Permission,
} from '../GeneratedClient';
import {
  ApprovalDetailsDrawerLayout,
  ApprovalDocumentList,
  ApprovalHeaderActions,
} from '../Approvals/ApprovalDetailsDrawerLayout';
import {
  approvalRequirementName,
  isCompletedApprovalOccurrence,
  isExemptedApprovalOccurrence,
  type ApprovalRequirementManagementMode,
} from '../Approvals/approvalDetails';
import type {
  ApprovalLedgerOccurrence,
  ApprovalLedgerRow,
} from '../Approvals/approvalLedgerViewModel';
import { ApprovalManagementDrawer } from '../Approvals/ApprovalManagementDrawer';
import { ApprovalNoteList } from '../Approvals/ApprovalNoteList';
import { ApprovalWorkflowConfirmationSectionV2 } from '../Approvals/ApprovalWorkflowConfirmationSectionV2';
import { useApprovalDetailsController } from '../Approvals/useApprovalDetailsController';
import { useBackdrop } from '../Hooks/useBackdrop';
import { useOrganizationApprovalsModel } from '../Model/OrganizationApprovalsModel';
import { useCommunityPermissions } from '../Model/SessionModel';

type OrganizationApprovalDetailsDrawerV2Props = {
  communityInfo: CommunityInfo;
  policy: EffectiveLocationPolicy;
  row: ApprovalLedgerRow | null;
  open: boolean;
  onClose: () => void;
};

function OrganizationRequirementManagementDrawerV2({
  communityInfo,
  mode,
  occurrence,
  open,
  policy,
  onClose,
}: {
  communityInfo: CommunityInfo;
  mode: ApprovalRequirementManagementMode | null;
  occurrence: ApprovalLedgerOccurrence | undefined;
  open: boolean;
  policy: EffectiveLocationPolicy;
  onClose: () => void;
}) {
  const organization = communityInfo.community;
  const permissions = useCommunityPermissions(communityInfo);
  const model = useOrganizationApprovalsModel();
  const withBackdrop = useBackdrop();
  const [completedAt, setCompletedAt] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [documentId, setDocumentId] = useState('');
  const [exemptionComments, setExemptionComments] = useState('');
  const [exemptionExpiresOn, setExemptionExpiresOn] = useState('');
  const name = approvalRequirementName(occurrence);
  const action = policy.actionDefinitions?.[name];
  const requiresDocument =
    action?.documentLink === DocumentLinkRequirement.Required;

  useEffect(() => {
    if (open) return;
    setCompletedAt(new Date().toISOString().slice(0, 10));
    setDocumentId('');
    setExemptionComments('');
    setExemptionExpiresOn('');
  }, [open]);

  async function completeRequirement() {
    if (!name) return;
    await withBackdrop(() =>
      model.completeRequirement(
        organization.id,
        name,
        new Date(`${completedAt}T12:00:00`),
        documentId || undefined
      )
    );
    onClose();
  }

  async function grantExemption() {
    if (!name || !exemptionComments.trim()) return;
    await withBackdrop(() =>
      model.exemptRequirement(
        organization.id,
        name,
        exemptionComments.trim(),
        exemptionExpiresOn
          ? new Date(`${exemptionExpiresOn}T12:00:00`)
          : undefined
      )
    );
    onClose();
  }

  async function markIncomplete() {
    if (!isCompletedApprovalOccurrence(occurrence)) return;
    await withBackdrop(() =>
      model.markRequirementIncomplete(organization.id, occurrence.requirement)
    );
    onClose();
  }

  async function removeExemption() {
    if (!isExemptedApprovalOccurrence(occurrence)) return;
    await withBackdrop(() =>
      model.unexemptRequirement(organization.id, occurrence.requirement)
    );
    onClose();
  }

  return (
    <ApprovalManagementDrawer
      titleId="organization-requirement-management-title"
      mode={mode}
      occurrence={occurrence}
      open={open}
      onClose={onClose}
    >
      {occurrence && mode && (
        <Stack spacing={2}>
          {action?.instructions &&
            (mode === 'complete' || mode === 'grantExemption') && (
              <Alert severity="info">{action.instructions}</Alert>
            )}

          {mode === 'complete' && (
            <Stack spacing={2}>
              <TextField
                type="date"
                label="Completed on"
                value={completedAt}
                slotProps={{ inputLabel: { shrink: true } }}
                onChange={(event) => setCompletedAt(event.target.value)}
              />
              {action?.documentLink !== DocumentLinkRequirement.None && (
                <FormControl required={requiresDocument}>
                  <InputLabel>Organization document</InputLabel>
                  <Select
                    label="Organization document"
                    value={documentId}
                    onChange={(event) => setDocumentId(event.target.value)}
                  >
                    {!requiresDocument && (
                      <MenuItem value="">No document</MenuItem>
                    )}
                    {organization.uploadedDocuments.map((document) => (
                      <MenuItem
                        key={document.uploadedDocumentId}
                        value={document.uploadedDocumentId}
                      >
                        {document.uploadedFileName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
              <Button
                variant="contained"
                disabled={
                  !permissions(Permission.EditApprovalRequirementCompletion) ||
                  (requiresDocument && !documentId)
                }
                onClick={() => void completeRequirement()}
              >
                Complete
              </Button>
            </Stack>
          )}

          {mode === 'grantExemption' && (
            <Stack spacing={2}>
              <TextField
                multiline
                minRows={3}
                required
                label="Exemption reason"
                value={exemptionComments}
                onChange={(event) => setExemptionComments(event.target.value)}
              />
              <TextField
                type="date"
                label="Exempt until (optional)"
                value={exemptionExpiresOn}
                slotProps={{ inputLabel: { shrink: true } }}
                onChange={(event) => setExemptionExpiresOn(event.target.value)}
              />
              <Button
                variant="contained"
                disabled={
                  !permissions(Permission.EditApprovalRequirementExemption) ||
                  !exemptionComments.trim()
                }
                onClick={() => void grantExemption()}
              >
                Exempt
              </Button>
            </Stack>
          )}

          {mode === 'markIncomplete' && (
            <ApprovalWorkflowConfirmationSectionV2
              title="Mark Incomplete"
              description="This will move the requirement back to missing so it can be completed again."
              buttonLabel="Mark Incomplete"
              confirmationTitle="Mark requirement incomplete?"
              confirmationDescription="This will remove the completed status and move this requirement back to missing so it can be completed again."
              disabled={
                !permissions(Permission.EditApprovalRequirementCompletion) ||
                !isCompletedApprovalOccurrence(occurrence)
              }
              onConfirm={markIncomplete}
            />
          )}

          {mode === 'removeExemption' && (
            <ApprovalWorkflowConfirmationSectionV2
              title="Remove Exemption"
              description="This will remove the exemption and make this requirement needed again."
              buttonLabel="Remove Exemption"
              confirmationTitle="Remove this exemption?"
              confirmationDescription="This will remove the exemption and make this requirement needed again for approval."
              disabled={
                !permissions(Permission.EditApprovalRequirementExemption) ||
                !isExemptedApprovalOccurrence(occurrence)
              }
              onConfirm={removeExemption}
            />
          )}
        </Stack>
      )}
    </ApprovalManagementDrawer>
  );
}

export function OrganizationApprovalDetailsDrawerV2({
  communityInfo,
  policy,
  row,
  open,
  onClose,
}: OrganizationApprovalDetailsDrawerV2Props) {
  const {
    closeManagement,
    managementMode,
    selectManagementMode,
    workflowOccurrence,
  } = useApprovalDetailsController(row, open);
  const permissions = useCommunityPermissions(communityInfo);
  const documents = communityInfo.community.uploadedDocuments.filter(
    (document) => row?.linkedDocumentIds.includes(document.uploadedDocumentId)
  );

  return (
    <>
      <ApprovalDetailsDrawerLayout
        row={row}
        open={open}
        onClose={onClose}
        titleId="organization-approval-details-title"
        headerActions={
          <ApprovalHeaderActions
            occurrence={workflowOccurrence}
            canComplete={permissions(
              Permission.EditApprovalRequirementCompletion
            )}
            canExempt={permissions(Permission.EditApprovalRequirementExemption)}
            onSelectMode={selectManagementMode}
          />
        }
        documents={
          <ApprovalDocumentList
            canReadDocuments={permissions(Permission.ReadOrganizationDocuments)}
            documents={documents}
          />
        }
        notes={
          <ApprovalNoteList
            entries={(row?.notes ?? []).map((contents, index) => ({
              id: `text:${contents}:${index}`,
              contents,
            }))}
          />
        }
      />
      <OrganizationRequirementManagementDrawerV2
        communityInfo={communityInfo}
        mode={managementMode}
        occurrence={workflowOccurrence}
        open={managementMode !== null}
        policy={policy}
        onClose={closeManagement}
      />
    </>
  );
}
