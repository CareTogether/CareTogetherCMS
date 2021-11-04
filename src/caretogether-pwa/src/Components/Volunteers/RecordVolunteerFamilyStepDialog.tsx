import { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, FormControl, Grid, InputLabel, Link, MenuItem, Select } from '@material-ui/core';
import { VolunteerFamily, ActionRequirement, DocumentLinkRequirement } from '../../GeneratedClient';
import { KeyboardDatePicker } from '@material-ui/pickers';
import { useVolunteersModel } from '../../Model/VolunteersModel';
import { uploadFileToTenant } from "../../Model/FilesModel";
import { currentLocationState, currentOrganizationState } from '../../Model/SessionModel';
import { useRecoilValue } from 'recoil';
import { useBackdrop } from '../RequestBackdrop';

const useStyles = makeStyles((theme) => ({
  fileInput: {
  }
}));

interface RecordVolunteerFamilyStepDialogProps {
  requirementName: string,
  stepActionRequirement: ActionRequirement,
  volunteerFamily: VolunteerFamily,
  onClose: () => void
}

export function RecordVolunteerFamilyStepDialog({requirementName, stepActionRequirement, volunteerFamily, onClose}: RecordVolunteerFamilyStepDialogProps) {
  const classes = useStyles();
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentId, setDocumentId] = useState<string>("");
  const [completedAtLocal, setCompletedAtLocal] = useState(new Date());
  const organizationId = useRecoilValue(currentOrganizationState);
  const locationId = useRecoilValue(currentLocationState);
  const volunteerFamiliesModel = useVolunteersModel();
  const UPLOAD_NEW = "__uploadnew__";

  const withBackdrop = useBackdrop();
  
  async function recordRequirementCompletion() {
    await withBackdrop(async () => {
      if (documentId === UPLOAD_NEW && !documentFile) {
        alert("No file was selected. Try again.");
      } else if (documentId === "" && stepActionRequirement.documentLink === DocumentLinkRequirement.Required) {
        alert("You must either select from an already-uploaded document or upload a new document for this requirement.");
      } else {
        let document = documentId;
        if (documentId === UPLOAD_NEW) {
          document = await uploadFileToTenant(organizationId, locationId, documentFile!);
          await volunteerFamiliesModel.uploadDocument(volunteerFamily.family!.id!, document, documentFile!.name);
        }
        await volunteerFamiliesModel.completeFamilyRequirement(volunteerFamily.family?.id as string,
          requirementName, stepActionRequirement, completedAtLocal, document === "" ? null : document);
        //TODO: Error handling (start with a basic error dialog w/ request to share a screenshot, and App Insights logging)
        onClose();
      }
    });
  }

  return (
    <Dialog open={Boolean(stepActionRequirement)} onClose={onClose} aria-labelledby="record-family-step-title">
      <DialogTitle id="record-family-step-title">Family Requirement: {requirementName}</DialogTitle>
      <DialogContent>
        <DialogContentText>Do you want to complete this requirement for this family?</DialogContentText>
        {stepActionRequirement.instructions && <DialogContentText>{stepActionRequirement.instructions}</DialogContentText>}
        {stepActionRequirement.infoLink && (
          <DialogContentText>
            <Link href={stepActionRequirement.infoLink} target="_blank" rel="noreferrer">More Info</Link>
          </DialogContentText>)}
        <br />
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <KeyboardDatePicker
              label="When was this requirement completed?"
              value={completedAtLocal} fullWidth required
              disableFuture format="MM/dd/yyyy"
              onChange={(date) => date && setCompletedAtLocal(date)}
              showTodayButton />
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
                      {volunteerFamily.uploadedDocuments?.map(document =>
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
