import { DatePicker, DateTimePicker } from "@mui/lab";
import { DialogContentText, Divider, FormControl, Grid, InputLabel, Link, MenuItem, Select, Tab, Tabs, TextField } from "@mui/material";
import { useState } from "react";
import { useRecoilValue } from "recoil";
import { ActionRequirement, DocumentLinkRequirement, MissingArrangementRequirement, NoteEntryRequirement } from "../../GeneratedClient";
import { useDirectoryModel, useFamilyLookup } from "../../Model/DirectoryModel";
import { uploadFileToTenant } from "../../Model/FilesModel";
import { useReferralsModel } from "../../Model/ReferralsModel";
import { currentLocationState, currentOrganizationState } from "../../Model/SessionModel";
import { useVolunteersModel } from "../../Model/VolunteersModel";
import { UpdateDialog } from "../UpdateDialog";
import { RequirementContext } from "./RequirementContext";
import { a11yProps, TabPanel } from "../TabPanel";

type MissingRequirementDialogProps = {
  open: boolean;
  onClose: () => void;
  requirement: MissingArrangementRequirement | string;
  context: RequirementContext;
  policy: ActionRequirement;
};
export function MissingRequirementDialog({
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
                    {contextFamily!.uploadedDocuments?.map(document => <MenuItem key={document.uploadedDocumentId} value={document.uploadedDocumentId}>{document.uploadedFileName}</MenuItem>)}
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
                    onChange={async (e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setDocumentFile(e.target.files[0]);
                      } else {
                        setDocumentFile(null);
                      }
                    }} />}
              </Grid>
            </>}
          {(policy.noteEntry === NoteEntryRequirement.Allowed ||
            policy.noteEntry === NoteEntryRequirement.Required) &&
            <Grid item xs={12}>
              <TextField
                id="notes" required={policy.noteEntry === NoteEntryRequirement.Required}
                label="Notes" placeholder="Space for any general notes"
                multiline fullWidth variant="outlined" minRows={6} size="medium"
                value={notes} onChange={e => setNotes(e.target.value)} />
            </Grid>}
        </Grid>
      </TabPanel>
      <TabPanel value={tabValue} index={1}>
        or... EXEMPT ME
      </TabPanel>
    </UpdateDialog>
  );
}
