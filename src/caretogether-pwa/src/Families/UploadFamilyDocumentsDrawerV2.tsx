import {
  Alert,
  Box,
  Button,
  Drawer,
  Stack,
  Typography,
} from '@mui/material';
import { useId, useState } from 'react';
import { useBackdrop } from '../Hooks/useBackdrop';
import { useDirectoryModel } from '../Model/DirectoryModel';
import { uploadFamilyFileToTenant } from '../Model/FilesModel';
import { handleBackdropClick } from '../Utilities/handleBackdropClick';

type UploadFamilyDocumentsDrawerV2Props = {
  familyId: string;
  locationId: string;
  onClose: () => void;
  onUploaded?: (uploadedDocumentIds: string[]) => void;
  open: boolean;
  organizationId: string;
};

function selectedFileSummary(files: File[]) {
  if (files.length === 0) return 'No files selected.';
  if (files.length === 1) return '1 file selected.';

  return `${files.length} files selected.`;
}

export function UploadFamilyDocumentsDrawerV2({
  familyId,
  locationId,
  onClose,
  onUploaded,
  open,
  organizationId,
}: UploadFamilyDocumentsDrawerV2Props) {
  const directoryModel = useDirectoryModel();
  const fileInputId = useId();
  const withBackdrop = useBackdrop();
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [validationMessage, setValidationMessage] = useState<string | null>(
    null
  );
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const canUpload = documentFiles.length > 0 && !uploading;

  function closeDrawer() {
    if (uploading) return;

    onClose();
  }

  function selectFiles(files: FileList | null) {
    const selectedFiles = Array.from(files ?? []);

    setDocumentFiles(selectedFiles);
    setUploadError(null);
    setValidationMessage(
      selectedFiles.length === 0 ? 'Select at least one file.' : null
    );
  }

  async function uploadDocuments() {
    if (documentFiles.length === 0) {
      setValidationMessage('Select at least one file.');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      await withBackdrop(async () => {
        const uploadedDocumentIds = await Promise.all(
          documentFiles.map(async (documentFile) => {
            const documentId = await uploadFamilyFileToTenant(
              organizationId,
              locationId,
              familyId,
              documentFile
            );

            await directoryModel.uploadFamilyDocument(
              familyId,
              documentId,
              documentFile.name
            );

            return documentId;
          })
        );

        onUploaded?.(uploadedDocumentIds);
        onClose();
      });
    } catch {
      setUploadError('Unable to upload documents. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={(event, reason) =>
        handleBackdropClick(closeDrawer, event, reason)
      }
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
        <Stack spacing={2}>
          <Box>
            <Typography
              className="ph-unmask"
              id="upload-family-documents-v2-title"
              variant="h6"
            >
              Upload Family Documents
            </Typography>
            <Typography
              className="ph-unmask"
              color="text.secondary"
              variant="body2"
              sx={{ mt: 0.5 }}
            >
              Select one or more documents to upload for this family.
            </Typography>
          </Box>

          {uploadError && <Alert severity="error">{uploadError}</Alert>}

          <Box>
            <Button
              className="ph-unmask"
              component="label"
              disabled={uploading}
              htmlFor={fileInputId}
              variant="outlined"
            >
              Choose Files
              <input
                accept="*/*"
                hidden
                id={fileInputId}
                multiple
                type="file"
                onChange={(event) => selectFiles(event.target.files)}
              />
            </Button>
            <Typography
              color={validationMessage ? 'error' : 'text.secondary'}
              variant="body2"
              sx={{ mt: 1 }}
            >
              {validationMessage ?? selectedFileSummary(documentFiles)}
            </Typography>
          </Box>

          {documentFiles.length > 0 && (
            <Stack spacing={0.75}>
              {documentFiles.map((file) => (
                <Typography key={`${file.name}-${file.lastModified}`}>
                  {file.name}
                </Typography>
              ))}
            </Stack>
          )}
        </Stack>
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
        <Button
          className="ph-unmask"
          color="secondary"
          disabled={uploading}
          onClick={closeDrawer}
        >
          Cancel
        </Button>
        <Button
          className="ph-unmask"
          aria-busy={uploading}
          disabled={!canUpload}
          onClick={() => void uploadDocuments()}
          variant="contained"
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </Button>
      </Box>
    </Drawer>
  );
}
