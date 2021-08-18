import { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Link } from '@material-ui/core';
import { VolunteerFamily, FormUploadRequirement, ActionRequirement, ActivityRequirement, Person } from '../GeneratedClient';
import { DateTimePicker } from '@material-ui/pickers';
import { useVolunteerFamiliesModel } from '../Model/VolunteerFamiliesModel';

const useStyles = makeStyles((theme) => ({
  fileInput: {
  }
}));

interface RecordVolunteerAdultStepDialogProps {
  stepActionRequirement: ActionRequirement | null,
  volunteerFamily: VolunteerFamily,
  adult: Person,
  onClose: () => void
}

export function RecordVolunteerAdultStepDialog({stepActionRequirement, volunteerFamily, adult, onClose}: RecordVolunteerAdultStepDialogProps) {
  const classes = useStyles();
  const [formFile, setFormFile] = useState<File>();
  const [performedAtLocal, setPerformedAtLocal] = useState(new Date());
  const volunteerFamiliesModel = useVolunteerFamiliesModel();

  async function recordUploadFormStep() {
    if (!formFile) {
      alert("No file was selected. Try again.");
    } else {
      await volunteerFamiliesModel.uploadFormPerson(volunteerFamily.family?.id as string, adult.id as string, stepActionRequirement as FormUploadRequirement, formFile);
      //TODO: Error handling (start with a basic error dialog w/ request to share a screenshot, and App Insights logging)
      onClose();
    }
  }

  async function recordPerformActivityStep() {
    await volunteerFamiliesModel.performActivityPerson(volunteerFamily.family?.id as string, adult.id as string, stepActionRequirement as ActivityRequirement, performedAtLocal);
    //TODO: Error handling (start with a basic error dialog w/ request to share a screenshot, and App Insights logging)
    onClose();
  }

  return (
    <Dialog open={Boolean(stepActionRequirement)} onClose={onClose} aria-labelledby="record-adult-step-title">
      {(stepActionRequirement && stepActionRequirement instanceof FormUploadRequirement)
        ? (
          <>
            <DialogTitle id="record-adult-step-title">Adult Form: {stepActionRequirement.formName}</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Do you want to upload this form for this adult?
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
                id="adult-form-file"
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
              <Button onClick={recordUploadFormStep} variant="contained" color="primary">
                Upload
              </Button>
            </DialogActions>
          </>
        ) : (stepActionRequirement && stepActionRequirement instanceof ActivityRequirement)
        ? (
          <>
            <DialogTitle id="record-adult-step-title">Adult Activity: {stepActionRequirement.activityName}</DialogTitle>
            <DialogContent>
              <DialogContentText>Do you want to record that this activity has been completed?</DialogContentText>
              <DateTimePicker
                label="When did this occur?"
                value={performedAtLocal}
                disableFuture format="yyyy/MM/dd hh:mm aa"
                onChange={(date) => date && setPerformedAtLocal(date)}
                showTodayButton />
            </DialogContent>
            <DialogActions>
              <Button onClick={onClose} color="secondary">
                Cancel
              </Button>
              <Button onClick={recordPerformActivityStep} variant="contained" color="primary">
                Mark Complete
              </Button>
            </DialogActions>
          </>
        ) : null}
    </Dialog>
  );
}
