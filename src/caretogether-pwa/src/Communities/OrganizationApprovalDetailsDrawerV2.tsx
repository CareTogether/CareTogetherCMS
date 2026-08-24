import CloseIcon from '@mui/icons-material/Close';
import {
  Alert,
  Box,
  Button,
  Chip,
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
import { useEffect, useState, type ReactNode } from 'react';
import {
  CommunityInfo,
  CompletedRequirementInfo,
  DocumentLinkRequirement,
  EffectiveLocationPolicy,
  ExemptedRequirementInfo,
  Permission,
} from '../GeneratedClient';
import type {
  ApprovalLedgerOccurrence,
  ApprovalLedgerRow,
  ApprovalLedgerStatus,
} from '../Families/approvalLedgerViewModel';
import { PersonName } from '../Families/PersonName';
import { v2Typography } from '../Families/v2Typography';
import { useBackdrop } from '../Hooks/useBackdrop';
import { useUserLookup } from '../Model/DirectoryModel';
import { useOrganizationApprovalsModel } from '../Model/OrganizationApprovalsModel';
import { useCommunityPermissions } from '../Model/SessionModel';
import { formatUtcDateOnly } from '../Utilities/dateUtils';

type OrganizationApprovalDetailsDrawerV2Props = {
  communityInfo: CommunityInfo;
  policy: EffectiveLocationPolicy;
  row: ApprovalLedgerRow | null;
  open: boolean;
  onClose: () => void;
};

type RequirementManagementMode =
  | 'complete'
  | 'grantExemption'
  | 'markIncomplete'
  | 'removeExemption';

const statusLabels: Record<ApprovalLedgerStatus, string> = {
  missing: 'Missing',
  completed: 'Completed',
  exempted: 'Exempted',
  expiring: 'Expiring',
  expired: 'Expired',
  availableApplication: 'Application',
};

function statusColor(status: ApprovalLedgerStatus) {
  switch (status) {
    case 'missing':
      return 'error';
    case 'expired':
    case 'expiring':
      return 'warning';
    case 'availableApplication':
      return 'info';
    case 'completed':
      return 'success';
    case 'exempted':
    default:
      return 'default';
  }
}

function DetailField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <Box>
      <Typography {...v2Typography.fieldLabel}>{label}</Typography>
      <Typography {...v2Typography.primaryValue}>{children}</Typography>
    </Box>
  );
}

function DrawerSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Stack spacing={1}>
      <Typography {...v2Typography.sectionTitle}>{title}</Typography>
      {children}
    </Stack>
  );
}

function actionableOccurrence(row: ApprovalLedgerRow | null) {
  return row?.occurrences.find((occurrence) =>
    ['missing', 'availableApplication', 'completed', 'exempted'].includes(
      occurrence.status
    )
  );
}

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

function OrganizationRequirementManagementDrawerV2({
  communityInfo,
  mode,
  occurrence,
  open,
  policy,
  onClose,
}: {
  communityInfo: CommunityInfo;
  mode: RequirementManagementMode | null;
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

  const title =
    mode === 'complete'
      ? 'Complete'
      : mode === 'grantExemption'
        ? 'Exempt'
        : mode === 'markIncomplete'
          ? 'Mark Incomplete'
          : 'Remove Exemption';

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
                {title}
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

export function OrganizationApprovalDetailsDrawerV2({
  communityInfo,
  policy,
  row,
  open,
  onClose,
}: OrganizationApprovalDetailsDrawerV2Props) {
  const [managementMode, setManagementMode] =
    useState<RequirementManagementMode | null>(null);
  const permissions = useCommunityPermissions(communityInfo);
  const userLookup = useUserLookup();
  const workflowOccurrence = actionableOccurrence(row);
  const completedOrExemptedOn = row?.completedOrExemptedOn
    ? formatUtcDateOnly(row.completedOrExemptedOn)
    : undefined;
  const validUntil = row?.validUntil
    ? formatUtcDateOnly(row.validUntil)
    : undefined;
  const documents = communityInfo.community.uploadedDocuments.filter(
    (document) => row?.linkedDocumentIds.includes(document.uploadedDocumentId)
  );
  const canReadDocuments = permissions(Permission.ReadOrganizationDocuments);

  useEffect(() => {
    if (!open) setManagementMode(null);
  }, [open]);

  const headerActions = (() => {
    if (!workflowOccurrence) return null;
    if (
      workflowOccurrence.status === 'missing' ||
      workflowOccurrence.status === 'availableApplication'
    ) {
      return (
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
          <Button
            disabled={
              !permissions(Permission.EditApprovalRequirementCompletion)
            }
            onClick={() => setManagementMode('complete')}
            variant="contained"
          >
            Complete
          </Button>
          <Button
            disabled={!permissions(Permission.EditApprovalRequirementExemption)}
            onClick={() => setManagementMode('grantExemption')}
            variant="contained"
          >
            Exempt
          </Button>
        </Stack>
      );
    }
    if (workflowOccurrence.status === 'completed') {
      return (
        <Button
          color="error"
          disabled={!permissions(Permission.EditApprovalRequirementCompletion)}
          onClick={() => setManagementMode('markIncomplete')}
          variant="contained"
        >
          Mark Incomplete
        </Button>
      );
    }
    return (
      <Button
        color="error"
        disabled={!permissions(Permission.EditApprovalRequirementExemption)}
        onClick={() => setManagementMode('removeExemption')}
        variant="contained"
      >
        Remove Exemption
      </Button>
    );
  })();

  return (
    <>
      <Drawer
        anchor="right"
        aria-labelledby="organization-approval-details-title"
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
        {row && (
          <Stack spacing={2}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 1,
              }}
            >
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                  {...v2Typography.fieldLabel}
                  sx={[
                    v2Typography.fieldLabel.sx,
                    { textTransform: 'uppercase' },
                  ]}
                >
                  Requirement
                </Typography>
                <Typography
                  className="ph-unmask"
                  id="organization-approval-details-title"
                  {...v2Typography.workspaceTitle}
                >
                  {row.requirementName}
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1,
                    mt: 1,
                    flexWrap: 'wrap',
                  }}
                >
                  <Chip
                    className="ph-unmask"
                    color={statusColor(row.status)}
                    label={statusLabels[row.status]}
                    size="small"
                  />
                  {headerActions}
                </Box>
              </Box>
              <IconButton aria-label="close approval details" onClick={onClose}>
                <CloseIcon />
              </IconButton>
            </Box>

            <Stack spacing={1.25}>
              <DetailField label="Applies To">
                {row.appliesTo.map((subject) => subject.label).join(', ') ||
                  'No subject'}
              </DetailField>
              <Box>
                <Typography {...v2Typography.fieldLabel}>
                  Needed For Roles
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {row.neededForRoleLabels.length === 0 ? (
                    <Typography {...v2Typography.primaryValue}>None</Typography>
                  ) : (
                    row.neededForRoleLabels.map((label) => (
                      <Chip
                        key={label}
                        className="ph-unmask"
                        label={label}
                        size="small"
                        variant="outlined"
                      />
                    ))
                  )}
                </Box>
              </Box>
              {row.completedOrExemptedByUserId && (
                <DetailField
                  label={
                    row.status === 'completed' ? 'Completed By' : 'Exempted By'
                  }
                >
                  <PersonName
                    person={userLookup(row.completedOrExemptedByUserId)}
                  />
                </DetailField>
              )}
              {completedOrExemptedOn && (
                <DetailField
                  label={
                    row.status === 'completed' ? 'Completed On' : 'Exempted On'
                  }
                >
                  {completedOrExemptedOn}
                </DetailField>
              )}
              {validUntil && (
                <DetailField
                  label={
                    row.status === 'completed'
                      ? 'Valid Until'
                      : 'Exempted Until'
                  }
                >
                  {validUntil}
                </DetailField>
              )}
            </Stack>

            <DrawerSection title="Documents">
              {!canReadDocuments ? (
                <Typography {...v2Typography.secondaryValue}>
                  You do not have permission to view documents.
                </Typography>
              ) : documents.length === 0 ? (
                <Typography {...v2Typography.secondaryValue}>
                  No documents.
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {documents.map((document) => (
                    <Box
                      key={document.uploadedDocumentId}
                      sx={{
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        p: 1,
                      }}
                    >
                      <Typography {...v2Typography.browserCell}>
                        {document.uploadedFileName}
                      </Typography>
                      <Typography {...v2Typography.fieldLabel}>
                        Uploaded by{' '}
                        <PersonName person={userLookup(document.userId)} />
                        {document.timestampUtc
                          ? ` on ${formatUtcDateOnly(document.timestampUtc)}`
                          : ''}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              )}
            </DrawerSection>

            <DrawerSection title="Notes">
              {row.notes.length === 0 ? (
                <Typography {...v2Typography.secondaryValue}>
                  No notes.
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {row.notes.map((note, index) => (
                    <Box
                      key={`${note}:${index}`}
                      sx={{
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        p: 1,
                      }}
                    >
                      <Typography {...v2Typography.browserCell}>
                        {note}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              )}
            </DrawerSection>
          </Stack>
        )}
      </Drawer>
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
