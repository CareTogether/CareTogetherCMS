import { useState } from 'react';
import makeStyles from '@mui/styles/makeStyles';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, FormControl, Grid, InputLabel, Link, MenuItem, Select, TextField } from '@mui/material';
import { CombinedFamilyInfo, ActionRequirement, DocumentLinkRequirement, NoteEntryRequirement } from '../../GeneratedClient';
import { DatePicker } from '@mui/lab';
import { uploadFileToTenant } from "../../Model/FilesModel";
import { currentLocationState, currentOrganizationState } from '../../Model/SessionModel';
import { useRecoilValue } from 'recoil';
import { useBackdrop } from '../RequestBackdrop';
import { useDirectoryModel } from '../../Model/DirectoryModel';
import { useReferralsModel } from '../../Model/ReferralsModel';

const useStyles = makeStyles((theme) => ({
  fileInput: {
  }
}));

interface RecordReferralStepDialogProps {
  requirementName: string,
  stepActionRequirement: ActionRequirement,
  partneringFamily: CombinedFamilyInfo,
  referralId: string,
  onClose: () => void
}

export function RecordReferralStepDialog({requirementName, stepActionRequirement, partneringFamily, referralId, onClose}: RecordReferralStepDialogProps) {
  const classes = useStyles();
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentId, setDocumentId] = useState<string>("");
  const [completedAtLocal, setCompletedAtLocal] = useState(new Date());
  const [notes, setNotes] = useState("");
  const organizationId = useRecoilValue(currentOrganizationState);
  const locationId = useRecoilValue(currentLocationState);
  const referralsModel = useReferralsModel();
  const directoryModel = useDirectoryModel();
  const UPLOAD_NEW = "__uploadnew__";

  const withBackdrop = useBackdrop();
  
  async function recordRequirementCompletion() {
    await withBackdrop(async () => {
      if (documentId === UPLOAD_NEW && !documentFile) {
        alert("No file was selected. Try again.");
      } else if (documentId === "" && stepActionRequirement.documentLink === DocumentLinkRequirement.Required) {
        alert("You must either select from an already-uploaded document or upload a new document for this requirement.");
      } else if (notes === "" && stepActionRequirement.noteEntry === NoteEntryRequirement.Required) {
        alert("You must enter a note for this requirement.");
      } else {
        let document = documentId;
        if (documentId === UPLOAD_NEW) {
          document = await uploadFileToTenant(organizationId, locationId, documentFile!);
          await directoryModel.uploadFamilyDocument(partneringFamily.family!.id!, document, documentFile!.name);
        }
        if (notes !== "")
          await directoryModel.createDraftNote(partneringFamily.family?.id as string, notes);
        await referralsModel.completeReferralRequirement(partneringFamily.family?.id as string, referralId,
          requirementName, stepActionRequirement, completedAtLocal, document === "" ? null : document);
        //TODO: Error handling (start with a basic error dialog w/ request to share a screenshot, and App Insights logging)
        onClose();
      }
    });
  }

  return (
    <Dialog open={Boolean(stepActionRequirement)} onClose={onClose} aria-labelledby="record-referral-step-title">
      <DialogTitle id="record-referral-step-title">Referral Requirement: {requirementName}</DialogTitle>
      <DialogContent>
        <DialogContentText>Do you want to complete this requirement for this referral?</DialogContentText>
        {stepActionRequirement.instructions && <DialogContentText>{stepActionRequirement.instructions}</DialogContentText>}
        {stepActionRequirement.infoLink && (
          <DialogContentText>
            <Link
              href={stepActionRequirement.infoLink}
              target="_blank"
              rel="noreferrer"
              underline="hover">More Info</Link>
          </DialogContentText>)}
        <br />
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <DatePicker
              label="When was this requirement completed?"
              value={completedAtLocal}
              disableFuture inputFormat="MM/dd/yyyy"
              onChange={(date) => date && setCompletedAtLocal(date)}
              showTodayButton
              renderInput={(params) => <TextField fullWidth required {...params} />} />
          </Grid>
          {(stepActionRequirement.documentLink === DocumentLinkRequirement.Allowed ||
            stepActionRequirement.documentLink === DocumentLinkRequirement.Required) &&
            <>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small" required={stepActionRequirement.documentLink === DocumentLinkRequirement.Required}>
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
                      {partneringFamily.uploadedDocuments?.map(document =>
                        <MenuItem key={document.uploadedDocumentId} value={document.uploadedDocumentId}>{document.uploadedFileName}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                {documentId === UPLOAD_NEW &&
                  <input
                    accept="*/*"
                    className={classes.fileInput}
                    multiple={false}
                    id="adult-document-file"
                    type="file"
                    onChange={async (e) => {if (e.target.files && e.target.files.length > 0) {
                      setDocumentFile(e.target.files[0]);
                    } else {
                      setDocumentFile(null);
                    }}}
                  />}
              </Grid>
            </>}
          {(stepActionRequirement.noteEntry === NoteEntryRequirement.Allowed ||
            stepActionRequirement.noteEntry === NoteEntryRequirement.Required) &&
            <Grid item xs={12}>
              <TextField
                id="notes" required={stepActionRequirement.noteEntry === NoteEntryRequirement.Required}
                label="Notes" placeholder="Space for any general notes"
                multiline fullWidth variant="outlined" minRows={6} size="medium"
                value={notes} onChange={e => setNotes(e.target.value)}
              />
            </Grid>}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button onClick={recordRequirementCompletion} variant="contained" color="primary">
          Complete
        </Button>
      </DialogActions>
    </Dialog>
  );
}
