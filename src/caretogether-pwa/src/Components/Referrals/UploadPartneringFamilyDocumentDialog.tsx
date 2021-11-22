import { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@material-ui/core';
import { CombinedFamilyInfo } from '../../GeneratedClient';
import { useReferralsModel } from '../../Model/ReferralsModel';
import { uploadFileToTenant } from '../../Model/FilesModel';
import { useRecoilValue } from 'recoil';
import { currentOrganizationState, currentLocationState } from '../../Model/SessionModel';
import { useBackdrop } from '../RequestBackdrop';

const useStyles = makeStyles((theme) => ({
  fileInput: {
  }
}));

interface UploadPartneringFamilyDocumentDialogProps {
  partneringFamily: CombinedFamilyInfo,
  onClose: () => void
}

export function UploadPartneringFamilyDocumentDialog({partneringFamily, onClose}: UploadPartneringFamilyDocumentDialogProps) {
  const classes = useStyles();
  const [documentFile, setDocumentFile] = useState<File>();
  const organizationId = useRecoilValue(currentOrganizationState);
  const locationId = useRecoilValue(currentLocationState);
  const referralsModel = useReferralsModel();

  const withBackdrop = useBackdrop();

  async function uploadDocument() {
    await withBackdrop(async () => {
      if (!documentFile) {
        alert("No file was selected. Try again.");
      } else {
        const documentId = await uploadFileToTenant(organizationId, locationId, documentFile!);
        await referralsModel.uploadPartneringFamilyDocument(partneringFamily.family!.id!, documentId, documentFile!.name);
        //TODO: Error handling (start with a basic error dialog w/ request to share a screenshot, and App Insights logging)
        onClose();
      }
    });
  }

  return (
    <Dialog open={true} onClose={onClose} aria-labelledby="upload-family-document-title">
      <DialogTitle id="upload-family-document-title">Upload Partnering Family Document</DialogTitle>
      <DialogContent>
        <DialogContentText>Do you want to upload a new document for this family?</DialogContentText>
        <input
          accept="*/*"
          className={classes.fileInput}
          multiple={false}
          id="family-document-file"
          type="file"
          onChange={async (e) => {if (e.target.files && e.target.files.length > 0) {
            setDocumentFile(e.target.files[0]);
          }}}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button onClick={uploadDocument} variant="contained" color="primary">
          Upload
        </Button>
      </DialogActions>
    </Dialog>
  );
}
