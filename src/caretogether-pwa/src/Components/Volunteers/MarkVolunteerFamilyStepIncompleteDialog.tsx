import { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, FormControl, Grid, InputLabel, Link, MenuItem, Select } from '@material-ui/core';
import { CombinedFamilyInfo, ActionRequirement, DocumentLinkRequirement, CompletedRequirementInfo } from '../../GeneratedClient';
import { KeyboardDatePicker } from '@material-ui/pickers';
import { useVolunteersModel } from '../../Model/VolunteersModel';
import { uploadFileToTenant } from "../../Model/FilesModel";
import { currentLocationState, currentOrganizationState } from '../../Model/SessionModel';
import { useRecoilValue } from 'recoil';
import { useBackdrop } from '../RequestBackdrop';
import { useDirectoryModel } from '../../Model/DirectoryModel';

const useStyles = makeStyles((theme) => ({
  fileInput: {
  }
}));

interface MarkVolunteerFamilyStepIncompleteDialogProps {
  volunteerFamily: CombinedFamilyInfo,
  completedRequirement: CompletedRequirementInfo,
  onClose: () => void
}

export function MarkVolunteerFamilyStepIncompleteDialog({volunteerFamily, completedRequirement, onClose}: MarkVolunteerFamilyStepIncompleteDialogProps) {
  const classes = useStyles();
  const organizationId = useRecoilValue(currentOrganizationState);
  const locationId = useRecoilValue(currentLocationState);
  const volunteerFamiliesModel = useVolunteersModel();
  const directoryModel = useDirectoryModel();
  const UPLOAD_NEW = "__uploadnew__";

  const withBackdrop = useBackdrop();
  
  async function save() {
    await withBackdrop(async () => {
      // await volunteerFamiliesModel.completeFamilyRequirement(volunteerFamily.family?.id as string,
      //   requirementName, stepActionRequirement, completedAtLocal, document === "" ? null : document);
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
