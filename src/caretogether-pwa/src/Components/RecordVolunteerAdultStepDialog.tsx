import { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Link } from '@material-ui/core';
import { VolunteerFamily, ActionRequirement, Person, DocumentLinkRequirement } from '../GeneratedClient';
import { DateTimePicker } from '@material-ui/pickers';

const useStyles = makeStyles((theme) => ({
  fileInput: {
  }
}));

interface RecordVolunteerAdultStepDialogProps {
  requirementName: string,
  stepActionRequirement: ActionRequirement,
  volunteerFamily: VolunteerFamily,
  adult: Person,
  onClose: () => void
}

export function RecordVolunteerAdultStepDialog({requirementName, stepActionRequirement, volunteerFamily, adult, onClose}: RecordVolunteerAdultStepDialogProps) {
  const classes = useStyles();
  const [/*formFile*/, setFormFile] = useState<File>();
  const [completedAtLocal, setCompletedAtLocal] = useState(new Date());
  // const volunteerFamiliesModel = useVolunteerFamiliesModel();

  async function recordRequirementCompletion() {
    alert("To do...");
    onClose();
    // if (!formFile) {
    //   alert("No file was selected. Try again.");
    // } else {
    //   await volunteerFamiliesModel.uploadFormPerson(volunteerFamily.family?.id as string, adult.id as string, stepActionRequirement as FormUploadRequirement, formFile, performedAtLocal);
    //   //TODO: Error handling (start with a basic error dialog w/ request to share a screenshot, and App Insights logging)
    //   onClose();
    // }
  }

  return (
    <Dialog open={Boolean(stepActionRequirement)} onClose={onClose} aria-labelledby="record-adult-step-title">
      <DialogTitle id="record-adult-step-title">Adult Requirement: {requirementName}</DialogTitle>
      <DialogContent>
        <DialogContentText>Do you want to complete this requirement for this adult?</DialogContentText>
        {stepActionRequirement.instructions && <DialogContentText>{stepActionRequirement.instructions}</DialogContentText>}
        {stepActionRequirement.infoLink && (
          <DialogContentText>
            <Link href={stepActionRequirement.infoLink} target="_blank" rel="noreferrer">More Info</Link>
          </DialogContentText>)}
        {stepActionRequirement.documentLink === DocumentLinkRequirement.Allowed &&
          <input
            accept="*/*"
            className={classes.fileInput}
            multiple={false}
            id="adult-form-file"
            type="file"
            onChange={async (e) => {if (e.target.files && e.target.files.length > 0) {
              setFormFile(e.target.files[0]);
            }}}
          />}
        <DateTimePicker
          label="When was this requirement completed?"
          value={completedAtLocal} fullWidth
          disableFuture format="MM/dd/yyyy hh:mm aa"
          onChange={(date) => date && setCompletedAtLocal(date)}
          showTodayButton />
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
