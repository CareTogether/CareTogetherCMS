import { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Link } from '@material-ui/core';
import { VolunteerFamily, FormUploadRequirement, ActionRequirement, ActivityRequirement } from '../GeneratedClient';
import { DateTimePicker } from '@material-ui/pickers';
import { useVolunteerFamiliesModel } from '../Model/VolunteerFamiliesModel';

const useStyles = makeStyles((theme) => ({
  fileInput: {
  }
}));

interface RecordFamilyStepDialogProps {
  stepActionRequirement: ActionRequirement | null,
  volunteerFamily: VolunteerFamily,
  onClose: () => void
}

export function RecordFamilyStepDialog({stepActionRequirement, volunteerFamily, onClose}: RecordFamilyStepDialogProps) {
  const classes = useStyles();
  const [formFile, setFormFile] = useState<File>();
  const [performedAtLocal, setPerformedAtLocal] = useState(new Date());
  const volunteerFamiliesModel = useVolunteerFamiliesModel();

  async function recordUploadFormStep() {
    if (!formFile) {
      alert("No file was selected. Try again.");
    } else {
      await volunteerFamiliesModel.uploadForm(volunteerFamily.family?.id as string, stepActionRequirement as FormUploadRequirement, formFile);
      //TODO: Error handling (start with a basic error dialog w/ request to share a screenshot, and App Insights logging)
      onClose();
    }
  }

  async function recordPerformActivityStep() {
    await volunteerFamiliesModel.performActivity(volunteerFamily.family?.id as string, stepActionRequirement as ActivityRequirement, performedAtLocal);
    //TODO: Error handling (start with a basic error dialog w/ request to share a screenshot, and App Insights logging)
    onClose();
  }

  return (
    <Dialog open={Boolean(stepActionRequirement)} onClose={onClose} aria-labelledby="record-family-step-title">
      {(stepActionRequirement && stepActionRequirement instanceof FormUploadRequirement)
        ? (
          <>
            <DialogTitle id="record-family-step-title">Family Form: {stepActionRequirement.formName}</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Do you want to upload this form for this family?
              </DialogContentText>
              <DialogContentText>
                Template: <Link href={stepActionRequirement.templateLink} target="_blank" rel="noreferrer">
                  {stepActionRequirement.formVersion} {stepActionRequirement.formName}
                </Link>
              </DialogContentText>
              <DialogContentText>{stepActionRequirement.instructions}</DialogContentText>
              <input
                accept="*/*"
                className={classes.fileInput}
                multiple={false}
                id="family-form-file"
                type="file"
                onChange={async (e) => {if (e.target.files && e.target.files.length > 0) {
                  setFormFile(e.target.files[0]);
                }}}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={onClose} color="secondary">
                Cancel
              </Button>
              <Button onClick={recordUploadFormStep} color="primary">
                Upload
              </Button>
            </DialogActions>
          </>
        ) : (stepActionRequirement && stepActionRequirement instanceof ActivityRequirement)
        ? (
          <>
            <DialogTitle id="record-family-step-title">Family Activity: {stepActionRequirement.activityName}</DialogTitle>
            <DialogContent>
              <DialogContentText>Do you want to record that this activity has been completed?</DialogContentText>
              <DateTimePicker
                label="When did this occur?"
                value={performedAtLocal}
                disableFuture
                onChange={(date) => date && setPerformedAtLocal(date)}
                showTodayButton />
            </DialogContent>
            <DialogActions>
              <Button onClick={onClose} color="secondary">
                Cancel
              </Button>
              <Button onClick={recordPerformActivityStep} color="primary">
                Mark Complete
              </Button>
            </DialogActions>
          </>
        ) : null}
    </Dialog>
  );
}
