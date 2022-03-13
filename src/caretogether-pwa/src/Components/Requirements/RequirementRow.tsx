import { DatePicker, DateTimePicker } from "@mui/lab";
import { Box, DialogContentText, Divider, FormControl, Grid, InputLabel, Link, MenuItem, Select, Tab, Tabs, TextField, Tooltip } from "@mui/material";
import { format } from "date-fns";
import { useState } from "react";
import { useRecoilValue } from "recoil";
import { ActionRequirement, CompletedRequirementInfo, DocumentLinkRequirement, ExemptedRequirementInfo, MissingArrangementRequirement, NoteEntryRequirement, Permission } from "../../GeneratedClient";
import { policyData } from "../../Model/ConfigurationModel";
import { useDirectoryModel, useFamilyLookup, useUserLookup } from "../../Model/DirectoryModel";
import { uploadFileToTenant } from "../../Model/FilesModel";
import { useReferralsModel } from "../../Model/ReferralsModel";
import { currentLocationState, currentOrganizationState, usePermissions } from "../../Model/SessionModel";
import { useVolunteersModel } from "../../Model/VolunteersModel";
import { PersonName } from "../Families/PersonName";
import { IconRow } from "../IconRow";
import { UpdateDialog } from "../UpdateDialog";

export interface ReferralContext {
  kind: "Referral"
  partneringFamilyId: string
  referralId: string
}

export interface ArrangementContext {
  kind: "Arrangement"
  partneringFamilyId: string
  referralId: string
  arrangementId: string
}

export interface VolunteerFamilyContext {
  kind: "Volunteer Family"
  volunteerFamilyId: string
}

export interface IndividualVolunteerContext {
  kind: "Individual Volunteer"
  volunteerFamilyId: string
  personId: string
}

export type RequirementContext = ReferralContext | ArrangementContext | VolunteerFamilyContext | IndividualVolunteerContext;

type CompletedRequirementDialogProps = {
  open: boolean
  onClose: () => void
  requirement: CompletedRequirementInfo
  context: RequirementContext
}

function CompletedRequirementDialog({
  open, onClose, requirement, context
}: CompletedRequirementDialogProps) {
  const referrals = useReferralsModel();
  const volunteers = useVolunteersModel();

  return (
    <UpdateDialog open={open} onClose={onClose}
      title="Are you sure you want to mark this step as incomplete?"
      saveLabel="Yes, Mark Incomplete"
      onSave={async () => {
        switch (context.kind) {
          case 'Referral':
            return referrals.markReferralRequirementIncomplete(
              context.partneringFamilyId, context.referralId, requirement);
          case 'Arrangement':
            return referrals.markArrangementRequirementIncomplete(
              context.partneringFamilyId, context.referralId, context.arrangementId, requirement);
          case 'Volunteer Family':
            return volunteers.markFamilyRequirementIncomplete(
              context.volunteerFamilyId, requirement);
          case 'Individual Volunteer':
            return volunteers.markIndividualRequirementIncomplete(
              context.volunteerFamilyId, context.personId, requirement);
        }
      }}>
      <DialogContentText>{`${context.kind} Requirement: ${requirement.requirementName}`}</DialogContentText>
    </UpdateDialog>
  );
}

type ExemptedRequirementDialogProps = {
  open: boolean
  onClose: () => void
  requirement: ExemptedRequirementInfo
  context: RequirementContext
}

function ExemptedRequirementDialog({
  open, onClose, requirement, context
}: ExemptedRequirementDialogProps) {
  const referrals = useReferralsModel();
  const volunteers = useVolunteersModel();

  return (
    <UpdateDialog open={open} onClose={onClose}
      title="Are you sure you want to remove the exemption for this requirement?"
      saveLabel="Yes, Remove Exemption"
      onSave={async () => {
        switch (context.kind) {
          case 'Referral':
            return referrals.unexemptReferralRequirement(
              context.partneringFamilyId, context.referralId, requirement);
          case 'Arrangement':
            return referrals.unexemptArrangementRequirement(
              context.partneringFamilyId, context.referralId, context.arrangementId, requirement);
          case 'Volunteer Family':
            return volunteers.unexemptVolunteerFamilyRequirement(
              context.volunteerFamilyId, requirement);
          case 'Individual Volunteer':
            return volunteers.unexemptVolunteerRequirement(
              context.volunteerFamilyId, context.personId, requirement);
        }
      }}>
      <DialogContentText>{`${context.kind} Requirement: ${requirement.requirementName}`}</DialogContentText>
    </UpdateDialog>
  );
}

type MissingRequirementDialogProps = {
  open: boolean
  onClose: () => void
  requirement: MissingArrangementRequirement | string
  context: RequirementContext
  policy: ActionRequirement
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`full-width-tabpanel-${index}`}
      aria-labelledby={`full-width-tab-${index}`}
    >
      {value === index && (
        <Box sx={{ padding: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `full-width-tab-${index}`,
    'aria-controls': `full-width-tabpanel-${index}`,
  };
}

function MissingRequirementDialog({
  open, onClose, requirement, context, policy
}: MissingRequirementDialogProps) {
  const directory = useDirectoryModel();
  const referrals = useReferralsModel();
  const volunteers = useVolunteersModel();
  
  const [tabValue, setTabValue] = useState(0);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentId, setDocumentId] = useState<string>("");
  const [completedAtLocal, setCompletedAtLocal] = useState(null as Date | null);
  const [notes, setNotes] = useState("");
  const UPLOAD_NEW = "__uploadnew__";
  const organizationId = useRecoilValue(currentOrganizationState);
  const locationId = useRecoilValue(currentLocationState);

  const familyLookup = useFamilyLookup();
  const contextFamilyId = context.kind === 'Referral' || context.kind === 'Arrangement'
    ? context.partneringFamilyId
    : context.volunteerFamilyId;
  const contextFamily = familyLookup(contextFamilyId);
  
  const enableSave = () => tabValue === 0
    ? // mark complete
      completedAtLocal != null &&
      ((documentId === UPLOAD_NEW && documentFile) ||
      (documentId !== UPLOAD_NEW && documentId !== "") ||
      policy.documentLink !== DocumentLinkRequirement.Required) &&
      (notes !== "" || policy.noteEntry !== NoteEntryRequirement.Required)
    : // grant exemption
      true;
  
  const requirementName = requirement instanceof MissingArrangementRequirement ? requirement.actionName! : requirement;

  async function markComplete() {
    let document = documentId;
    if (documentId === UPLOAD_NEW) {
      document = await uploadFileToTenant(organizationId, locationId, documentFile!);
      await directory.uploadFamilyDocument(contextFamilyId, document, documentFile!.name);
    }
    if (notes !== "")
      await directory.createDraftNote(contextFamilyId as string, notes);
    switch (context.kind) {
      case 'Referral':
        await referrals.completeReferralRequirement(contextFamilyId, context.referralId,
          requirementName, policy, completedAtLocal!, document === "" ? null : document);
        break;
      case 'Arrangement':
        //TODO: Support completing for multiple arrangements simultaneously
        await referrals.completeArrangementRequirement(contextFamilyId, context.referralId, context.arrangementId,
          requirementName, policy, completedAtLocal!, document === "" ? null : document);
        break;
      case 'Volunteer Family':
        await volunteers.completeFamilyRequirement(contextFamilyId,
          requirementName, policy, completedAtLocal!, document === "" ? null : document);
        break;
      case 'Individual Volunteer':
        await volunteers.completeIndividualRequirement(contextFamilyId, context.personId,
          requirementName, policy, completedAtLocal!, document === "" ? null : document);
        break;
    }
  }

  async function exempt() {

  }

  async function save() {
    if (tabValue === 0) {
      await markComplete();
    } else {
      await exempt();
    }
  }
  
  return (
    <UpdateDialog open={open} onClose={onClose}
      title={`${context.kind} Requirement: ${requirementName}`}
      enableSave={enableSave}
      onSave={save}>
      <Tabs value={tabValue}
        onChange={(_, newValue) => setTabValue(newValue)}
        indicatorColor="secondary"
        variant="fullWidth">
        <Tab label="Mark Complete" {...a11yProps(0)} />
        <Tab label="Grant Exemption" {...a11yProps(1)} />
      </Tabs>
      <TabPanel value={tabValue} index={0}>
        {policy.instructions && <DialogContentText>{policy.instructions}</DialogContentText>}
        {policy.infoLink && (
          <DialogContentText>
            <Link
              href={policy.infoLink}
              target="_blank"
              rel="noreferrer"
              underline="hover">{policy.infoLink}</Link>
          </DialogContentText>)}
        <br />
        <Grid container spacing={2}>
          <Grid item xs={12}>
            {requirement instanceof MissingArrangementRequirement
              ? <DateTimePicker
                  label="When was this requirement completed?"
                  value={completedAtLocal}
                  disableFuture inputFormat="MM/dd/yyyy hh:mm a"
                  onChange={(date) => date && setCompletedAtLocal(date)}
                  showTodayButton
                  renderInput={(params) => <TextField fullWidth required {...params} />} />
              : <DatePicker
                  label="When was this requirement completed?"
                  value={completedAtLocal}
                  disableFuture inputFormat="MM/dd/yyyy"
                  onChange={(date) => date && setCompletedAtLocal(date)}
                  showTodayButton
                  renderInput={(params) => <TextField fullWidth required {...params} />} />}
          </Grid>
          {(policy.documentLink === DocumentLinkRequirement.Allowed ||
            policy.documentLink === DocumentLinkRequirement.Required) &&
            <>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small" required={policy.documentLink === DocumentLinkRequirement.Required}>
                  <InputLabel id="document-label">Document</InputLabel>
                  <Select
                    labelId="document-label" id="document"
                    value={documentId}
                    onChange={e => setDocumentId(e.target.value as string)}>
                      <MenuItem key="placeholder" value="">
                        None
                      </MenuItem>
                      <MenuItem key={UPLOAD_NEW} value={UPLOAD_NEW}>
                        Upload new...
                      </MenuItem>
                      <Divider />
                      {contextFamily!.uploadedDocuments?.map(document =>
                        <MenuItem key={document.uploadedDocumentId} value={document.uploadedDocumentId}>{document.uploadedFileName}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                {documentId === UPLOAD_NEW &&
                  <input
                    accept="*/*"
                    multiple={false}
                    id="document-file"
                    type="file"
                    onChange={async (e) => {if (e.target.files && e.target.files.length > 0) {
                      setDocumentFile(e.target.files[0]);
                    } else {
                      setDocumentFile(null);
                    }}}
                  />}
              </Grid>
            </>}
          {(policy.noteEntry === NoteEntryRequirement.Allowed ||
            policy.noteEntry === NoteEntryRequirement.Required) &&
            <Grid item xs={12}>
              <TextField
                id="notes" required={policy.noteEntry === NoteEntryRequirement.Required}
                label="Notes" placeholder="Space for any general notes"
                multiline fullWidth variant="outlined" minRows={6} size="medium"
                value={notes} onChange={e => setNotes(e.target.value)}
              />
            </Grid>}
        </Grid>
      </TabPanel>
      <TabPanel value={tabValue} index={1}>
        or... EXEMPT ME
      </TabPanel>
    </UpdateDialog>
  );
}

type CompletedRequirementRowProps = {
  requirement: CompletedRequirementInfo
  context: RequirementContext
}

export function CompletedRequirementRow({ requirement, context }: CompletedRequirementRowProps) {
  const userLookup = useUserLookup();
  const permissions = usePermissions();

  const [dialogOpen, setDialogOpen] = useState(false);
  const openDialog = () => setDialogOpen(true);
  
  const canMarkIncomplete =
    context.kind === 'Referral' || context.kind === 'Arrangement'
    ? true //TODO: Implement these permissions!
    : permissions(Permission.EditApprovalRequirementCompletion);
  
  return (
    <>
      <IconRow icon="✅" onClick={canMarkIncomplete ? openDialog : undefined}>
        <Tooltip title={
          <>
            Completed by <PersonName person={userLookup(requirement.userId)} />
          </>}>
          <span>
            {requirement.requirementName}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            {requirement.completedAtUtc &&
              <span style={{float:'right'}}>
                {format(requirement.completedAtUtc, "M/d/yy h:mm a")}
              </span>}
          </span>
        </Tooltip>
      </IconRow>
      <CompletedRequirementDialog open={dialogOpen} onClose={() => setDialogOpen(false)}
        requirement={requirement} context={context} />
    </>
  );
}

type ExemptedRequirementRowProps = {
  requirement: ExemptedRequirementInfo
  context: RequirementContext
}

export function ExemptedRequirementRow({ requirement, context }: ExemptedRequirementRowProps) {
  const userLookup = useUserLookup();
  const permissions = usePermissions();

  const [dialogOpen, setDialogOpen] = useState(false);
  const openDialog = () => setDialogOpen(true);

  const canExempt =
    context.kind === 'Referral' || context.kind === 'Arrangement'
    ? true //TODO: Implement these permissions!
    : permissions(Permission.EditApprovalRequirementExemption);
  
  return (
    <>
      <IconRow icon="🚫" onClick={canExempt ? openDialog : undefined}>
        <Tooltip title={
          <>
            Granted by <PersonName person={userLookup(requirement.userId)} /> {format(requirement.timestampUtc!, "M/d/yy h:mm a")}
          </>}>
          <span>
            {requirement.requirementName}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            {requirement.exemptionExpiresAtUtc &&
              <span style={{float:'right'}}>
                until {format(requirement.exemptionExpiresAtUtc, "M/d/yy")}
              </span>}
            <br />
            <span style={{lineHeight: '1.5em', paddingLeft: 30, fontStyle: 'italic'}}>
              {requirement.additionalComments}
            </span>
          </span>
        </Tooltip>
      </IconRow>
      <ExemptedRequirementDialog open={dialogOpen} onClose={() => setDialogOpen(false)}
        requirement={requirement} context={context} />
    </>
  );
}

type MissingArrangementRequirementRowProps = {
  requirement: MissingArrangementRequirement
  context: RequirementContext
}

export function MissingArrangementRequirementRow({ requirement, context }: MissingArrangementRequirementRowProps) {
  const policy = useRecoilValue(policyData);
  const permissions = usePermissions();

  const requirementPolicy = policy.actionDefinitions![requirement.actionName!];

  const [dialogOpen, setDialogOpen] = useState(false);
  const openDialog = () => setDialogOpen(true);
  
  const canComplete =
    context.kind === 'Referral' || context.kind === 'Arrangement'
    ? true //TODO: Implement these permissions!
    : permissions(Permission.EditApprovalRequirementCompletion);
  
  return (
    <>
      {requirement.dueBy
        ? <IconRow icon='📅' onClick={canComplete ? openDialog : undefined}>
            {requirement.actionName}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            <span style={{float:'right'}}>{format(requirement.dueBy, "M/d/yy h:mm a")}</span>
          </IconRow>
        : <IconRow icon='❌' onClick={canComplete ? openDialog : undefined}>
            {requirement.actionName}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            {requirement.pastDueSince && <span style={{float:'right'}}>{format(requirement.pastDueSince, "M/d/yy h:mm a")}</span>}
          </IconRow>}
      <MissingRequirementDialog open={dialogOpen} onClose={() => setDialogOpen(false)}
        requirement={requirement} context={context} policy={requirementPolicy} />
    </>
  );
}

type MissingRequirementRowProps = {
  requirement: string
  context: RequirementContext
  isAvailableApplication?: boolean
}

export function MissingRequirementRow({ requirement, context, isAvailableApplication }: MissingRequirementRowProps) {
  const policy = useRecoilValue(policyData);
  const permissions = usePermissions();

  const requirementPolicy = policy.actionDefinitions![requirement];

  const [dialogOpen, setDialogOpen] = useState(false);
  const openDialog = () => setDialogOpen(true);
  
  const canComplete =
    context.kind === 'Referral' || context.kind === 'Arrangement'
    ? true //TODO: Implement these permissions!
    : permissions(Permission.EditApprovalRequirementCompletion);
  
  return (
    <>
      <IconRow icon={isAvailableApplication ? "💤" : "❌"}
        onClick={canComplete ? openDialog : undefined}>{requirement}</IconRow>
      <MissingRequirementDialog open={dialogOpen} onClose={() => setDialogOpen(false)}
        requirement={requirement} context={context} policy={requirementPolicy} />
    </>
  );
}
