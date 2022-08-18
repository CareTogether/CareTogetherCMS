import { useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { CombinedFamilyInfo } from '../GeneratedClient';
import { uploadFileToTenant } from '../Model/FilesModel';
import { useRecoilValue } from 'recoil';
import { currentOrganizationState, currentLocationState } from '../Model/SessionModel';
import { useBackdrop } from '../Hooks/useBackdrop';
import { useDirectoryModel } from '../Model/DirectoryModel';

interface UploadFamilyDocumentsDialogProps {
  family: CombinedFamilyInfo,
  onClose: () => void
}

export function UploadFamilyDocumentsDialog({family, onClose}: UploadFamilyDocumentsDialogProps) {
  const [documentFiles, setDocumentFiles] = useState<FileList>();
  const organizationId = useRecoilValue(currentOrganizationState);
  const locationId = useRecoilValue(currentLocationState);
  const directoryModel = useDirectoryModel();

  const withBackdrop = useBackdrop();

  async function uploadDocument() {
    await withBackdrop(async () => {
      if (!documentFiles) {
        alert("No files were selected. Try again.");
      } else {
        await Promise.all(Array.from(documentFiles).map(async documentFile => {
          const documentId = await uploadFileToTenant(organizationId, locationId, documentFile);
          await directoryModel.uploadFamilyDocument(family.family!.id!, documentId, documentFile.name);
        }));
        //TODO: Error handling (start with a basic error dialog w/ request to share a screenshot, and App Insights logging)
        onClose();
      }
    });
  }

  return (
    <Dialog open={true} onClose={onClose} aria-labelledby="upload-family-documents-title">
      <DialogTitle id="upload-family-documents-title">Upload Family Documents</DialogTitle>
      <DialogContent>
        <DialogContentText>Select one or more documents to upload for this family.</DialogContentText>
        <input
          accept="*/*"
          multiple={true}
          id="family-document-file"
          type="file"
          onChange={async (e) => {if (e.target.files && e.target.files.length > 0) {
            setDocumentFiles(e.target.files);
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
