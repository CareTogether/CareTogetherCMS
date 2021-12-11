import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@material-ui/core';
import { CombinedFamilyInfo, CompletedRequirementInfo } from '../../GeneratedClient';
import { useVolunteersModel } from '../../Model/VolunteersModel';
import { useBackdrop } from '../RequestBackdrop';

interface MarkVolunteerFamilyStepIncompleteDialogProps {
  volunteerFamily: CombinedFamilyInfo,
  completedRequirement: CompletedRequirementInfo,
  onClose: () => void
}

export function MarkVolunteerFamilyStepIncompleteDialog({volunteerFamily, completedRequirement, onClose}: MarkVolunteerFamilyStepIncompleteDialogProps) {
  const volunteerFamiliesModel = useVolunteersModel();

  const withBackdrop = useBackdrop();
  
  async function save() {
    await withBackdrop(async () => {
      await volunteerFamiliesModel.markFamilyRequirementIncomplete(volunteerFamily.family?.id as string,
        completedRequirement);
      //TODO: Error handling (start with a basic error dialog w/ request to share a screenshot, and App Insights logging)
      onClose();
    });
  }

  return (
    <Dialog open={Boolean(completedRequirement)} onClose={onClose} aria-labelledby="mark-family-step-incomplete-title">
      <DialogTitle id="mark-family-step-incomplete-title">Are you sure you want to mark this step as incomplete?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {completedRequirement.requirementName}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button onClick={save} variant="contained" color="primary">
          Yes, Mark Incomplete
        </Button>
      </DialogActions>
    </Dialog>
  );
}
