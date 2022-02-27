import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@material-ui/core';
import { CombinedFamilyInfo, CompletedRequirementInfo } from '../../GeneratedClient';
import { useReferralsModel } from '../../Model/ReferralsModel';
import { useBackdrop } from '../RequestBackdrop';

interface MarkReferralStepIncompleteDialogProps {
  partneringFamily: CombinedFamilyInfo,
  referralId: string,
  completedRequirement: CompletedRequirementInfo,
  onClose: () => void
}

export function MarkReferralStepIncompleteDialog({partneringFamily, referralId, completedRequirement, onClose}: MarkReferralStepIncompleteDialogProps) {
  const referralsModel = useReferralsModel();

  const withBackdrop = useBackdrop();
  
  async function save() {
    await withBackdrop(async () => {
      await referralsModel.markReferralRequirementIncomplete(partneringFamily.family?.id as string, referralId,
        completedRequirement);
      //TODO: Error handling (start with a basic error dialog w/ request to share a screenshot, and App Insights logging)
      onClose();
    });
  }

  return (
    <Dialog open={Boolean(completedRequirement)} onClose={onClose} aria-labelledby="mark-referral-step-incomplete-title">
      <DialogTitle id="mark-referral-step-incomplete-title">Are you sure you want to mark this step as incomplete?</DialogTitle>
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
