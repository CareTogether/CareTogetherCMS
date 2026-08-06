import { useState } from 'react';
import {
  Box,
  Button,
  Drawer,
  Typography,
} from '@mui/material';
import { CombinedFamilyInfo } from '../GeneratedClient';
import { uploadFamilyFileToTenant } from '../Model/FilesModel';
import { useRecoilValue } from 'recoil';
import { useBackdrop } from '../Hooks/useBackdrop';
import { useDirectoryModel } from '../Model/DirectoryModel';
import { selectedLocationContextState } from '../Model/Data';

interface UploadFamilyDocumentsDrawerProps {
  family: CombinedFamilyInfo;
  onClose: () => void;
}

export function UploadFamilyDocumentsDrawer({
  family,
  onClose,
}: UploadFamilyDocumentsDrawerProps) {
  const [documentFiles, setDocumentFiles] = useState<FileList>();
  const { organizationId, locationId } = useRecoilValue(
    selectedLocationContextState
  );
  const directoryModel = useDirectoryModel();
  const withBackdrop = useBackdrop();

  async function uploadDocument() {
    await withBackdrop(async () => {
      if (!documentFiles) {
        alert('No files were selected. Try again.');
        return;
      }

      await Promise.all(
        Array.from(documentFiles).map(async (documentFile) => {
          const documentId = await uploadFamilyFileToTenant(
            organizationId,
            locationId,
            family.family!.id!,
            documentFile
          );
          await directoryModel.uploadFamilyDocument(
            family.family!.id!,
            documentId,
            documentFile.name
          );
        })
      );

      onClose();
    });
  }

  return (
    <Drawer
      anchor="right"
      open
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: 600 },
            top: 45,
            height: 'calc(100% - 45px)',
            display: 'flex',
          },
        },
      }}
    >
      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', p: 3 }}>
        <Typography id="upload-family-documents-title" variant="h6" sx={{ mb: 2 }}>
          Upload Family Documents
        </Typography>
        <Typography sx={{ mb: 2 }}>
          Select one or more documents to upload for this family.
        </Typography>
        <input
          accept="*/*"
          multiple={true}
          id="family-document-file"
          type="file"
          onChange={async (e) => {
            if (e.target.files && e.target.files.length > 0) {
              setDocumentFiles(e.target.files);
            }
          }}
        />
      </Box>
      <Box
        sx={{
          borderTop: 1,
          borderColor: 'divider',
          display: 'flex',
          gap: 1,
          justifyContent: 'flex-end',
          p: 2,
          pb: 'calc(16px + env(safe-area-inset-bottom))',
          backgroundColor: 'background.paper',
        }}
      >
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button onClick={uploadDocument} variant="contained" color="primary">
          Upload
        </Button>
      </Box>
    </Drawer>
  );
}
