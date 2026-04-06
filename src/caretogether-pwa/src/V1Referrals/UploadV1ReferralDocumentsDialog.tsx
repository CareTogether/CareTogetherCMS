import { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useRecoilValue } from 'recoil';

import { selectedLocationContextState } from '../Model/Data';
import { uploadV1ReferralFileToTenant } from '../Model/FilesModel';
import { useV1ReferralsModel } from '../Model/V1ReferralsModel';

type HttpErrorLike = {
  response?: {
    status?: number;
    data?: unknown;
  };
  message?: string;
};

function formatUploadError(e: unknown): string {
  if (typeof e === 'object' && e !== null) {
    const err = e as HttpErrorLike;

    const status = err.response?.status;
    if (typeof status === 'number') {
      const data =
        err.response?.data === undefined
          ? ''
          : `: ${JSON.stringify(err.response.data)}`;
      return `Upload failed (${status})${data}`;
    }

    if (typeof err.message === 'string' && err.message.trim() !== '') {
      return `Upload failed: ${err.message}`;
    }
  }

  return 'Upload failed. Please try again.';
}

export function UploadV1ReferralDocumentsDialog(props: {
  referralId: string;
  onClose: (didUpload?: boolean) => void;
}) {
  const { referralId, onClose } = props;

  const { organizationId, locationId } = useRecoilValue(
    selectedLocationContextState
  );

  const { uploadReferralDocumentMetadata } = useV1ReferralsModel();

  const [file, setFile] = useState<File | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload() {
    if (!file || working) return;

    setWorking(true);
    setError(null);

    try {
      const documentId = await uploadV1ReferralFileToTenant(
        organizationId,
        locationId,
        referralId,
        file
      );

      await uploadReferralDocumentMetadata(referralId, documentId, file.name);

      onClose(true);
    } catch (e: unknown) {
      setError(formatUploadError(e));
      setWorking(false);
    }
  }

  return (
    <Dialog
      open
      onClose={() => !working && onClose(false)}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>Upload Referral Document</DialogTitle>

      <DialogContent>
        <Box sx={{ mt: 1 }}>
          <Button
            component="label"
            variant="outlined"
            startIcon={<CloudUploadIcon />}
            disabled={working}
          >
            Choose file
            <input
              hidden
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </Button>

          <Typography sx={{ mt: 1 }}>
            {file ? file.name : 'No file selected'}
          </Typography>

          {error && (
            <Typography sx={{ mt: 1 }} color="error">
              {error}
            </Typography>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={() => onClose(false)} disabled={working}>
          Cancel
        </Button>
        <Button
          onClick={upload}
          variant="contained"
          disabled={!file || working}
        >
          Upload
        </Button>
      </DialogActions>
    </Dialog>
  );
}
