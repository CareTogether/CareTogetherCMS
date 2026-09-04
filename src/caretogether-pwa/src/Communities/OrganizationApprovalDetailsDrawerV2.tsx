import CloseIcon from '@mui/icons-material/Close';
import {
  Alert,
  Box,
  Button,
  Drawer,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import {
  CommunityInfo,
  CompletedRequirementInfo,
  DocumentLinkRequirement,
  EffectiveLocationPolicy,
  ExemptedRequirementInfo,
  Permission,
} from '../GeneratedClient';
import {
  ApprovalDetailsDrawerLayout,
  ApprovalDocumentList,
  ApprovalHeaderActions,
} from '../Approvals/ApprovalDetailsDrawerLayout';
import {
  findActionableApprovalOccurrence,
  type ApprovalRequirementManagementMode,
} from '../Approvals/approvalDetails';
import type {
  ApprovalLedgerOccurrence,
  ApprovalLedgerRow,
} from '../Approvals/approvalLedgerViewModel';
import { v2Typography } from '../Families/v2Typography';
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

function requirementName(occurrence: ApprovalLedgerOccurrence | undefined) {
  if (!occurrence) return '';
  if (typeof occurrence.requirement === 'string') {
    return occurrence.requirement;
  }
  if ('actionName' in occurrence.requirement) {
    return occurrence.requirement.actionName;
  }
  return occurrence.requirement.requirementName;
}

function isCompletion(
  occurrence: ApprovalLedgerOccurrence | undefined
): occurrence is ApprovalLedgerOccurrence & {
  requirement: CompletedRequirementInfo;
} {
  return Boolean(
    occurrence &&
      typeof occurrence.requirement !== 'string' &&
      'completedRequirementId' in occurrence.requirement
  );
}

function isExemption(
  occurrence: ApprovalLedgerOccurrence | undefined
): occurrence is ApprovalLedgerOccurrence & {
  requirement: ExemptedRequirementInfo;
} {
  return Boolean(
    occurrence &&
      typeof occurrence.requirement !== 'string' &&
      'additionalComments' in occurrence.requirement
  );
}

function managementTitle(mode: ApprovalRequirementManagementMode) {
  switch (mode) {
    case 'complete':
      return 'Complete';
    case 'grantExemption':
      return 'Exempt';
    case 'markIncomplete':
      return 'Mark Incomplete';
    case 'removeExemption':
      return 'Remove Exemption';
  }
}

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
  const name = requirementName(occurrence);
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
    if (!isCompletion(occurrence)) return;
    await withBackdrop(() =>
      model.markRequirementIncomplete(organization.id, occurrence.requirement)
    );
    onClose();
  }

  async function removeExemption() {
    if (!isExemption(occurrence)) return;
    await withBackdrop(() =>
      model.unexemptRequirement(organization.id, occurrence.requirement)
    );
    onClose();
  }

  return (
    <Drawer
      anchor="right"
      aria-labelledby="organization-requirement-management-title"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: 500, md: 560 },
            p: 2,
            pt: { xs: 7, sm: 8, md: 6 },
          },
        },
      }}
    >
      {occurrence && mode && (
        <Stack spacing={2}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 1,
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography
                color="text.secondary"
                sx={{ textTransform: 'uppercase' }}
                variant="caption"
              >
                Requirement Management
              </Typography>
              <Typography
                id="organization-requirement-management-title"
                variant="h5"
              >
                {managementTitle(mode)}
              </Typography>
              <Typography
                className="ph-unmask"
                color="text.secondary"
                variant="body2"
              >
                {name}
              </Typography>
            </Box>
            <IconButton
              aria-label="close requirement management"
              onClick={onClose}
            >
              <CloseIcon />
            </IconButton>
          </Box>

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
            <Stack spacing={2}>
              <Alert severity="warning">
                This will move the requirement back to missing so it can be
                completed again.
              </Alert>
              <Button
                color="error"
                variant="contained"
                disabled={
                  !permissions(Permission.EditApprovalRequirementCompletion) ||
                  !isCompletion(occurrence)
                }
                onClick={() => void markIncomplete()}
              >
                Mark Incomplete
              </Button>
            </Stack>
          )}

          {mode === 'removeExemption' && (
            <Stack spacing={2}>
              <Alert severity="warning">
                This will remove the exemption and make this requirement needed
                again for approval.
              </Alert>
              <Button
                color="error"
                variant="contained"
                disabled={
                  !permissions(Permission.EditApprovalRequirementExemption) ||
                  !isExemption(occurrence)
                }
                onClick={() => void removeExemption()}
              >
                Remove Exemption
              </Button>
            </Stack>
          )}
        </Stack>
      )}
    </Drawer>
  );
}

function TextNoteList({ notes }: { notes: string[] }) {
  if (notes.length === 0) {
    return <Typography {...v2Typography.secondaryValue}>No notes.</Typography>;
  }

  return (
    <Stack spacing={1}>
      {notes.map((note, index) => (
        <Box
          key={`${note}:${index}`}
          sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1 }}
        >
          <Typography {...v2Typography.browserCell}>{note}</Typography>
        </Box>
      ))}
    </Stack>
  );
}

export function OrganizationApprovalDetailsDrawerV2({
  communityInfo,
  policy,
  row,
  open,
  onClose,
}: OrganizationApprovalDetailsDrawerV2Props) {
  const [managementMode, setManagementMode] =
    useState<ApprovalRequirementManagementMode | null>(null);
  const permissions = useCommunityPermissions(communityInfo);
  const workflowOccurrence = findActionableApprovalOccurrence(row);
  const documents = communityInfo.community.uploadedDocuments.filter(
    (document) => row?.linkedDocumentIds.includes(document.uploadedDocumentId)
  );

  useEffect(() => {
    if (!open) setManagementMode(null);
  }, [open]);

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
            onSelectMode={setManagementMode}
          />
        }
        documents={
          <ApprovalDocumentList
            canReadDocuments={permissions(Permission.ReadOrganizationDocuments)}
            documents={documents}
          />
        }
        notes={<TextNoteList notes={row?.notes ?? []} />}
      />
      <OrganizationRequirementManagementDrawerV2
        communityInfo={communityInfo}
        mode={managementMode}
        occurrence={workflowOccurrence}
        open={managementMode !== null}
        policy={policy}
        onClose={() => setManagementMode(null)}
      />
    </>
  );
}
