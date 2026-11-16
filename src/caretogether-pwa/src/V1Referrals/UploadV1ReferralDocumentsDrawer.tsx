import { useId, useRef, useState } from "react";
import { Box, Button, Drawer, Typography } from "@mui/material";
import { CloudUpload as CloudUploadIcon } from "@mui/icons-material";

import { useRequiredSelectedLocationContext } from "../Model/Data";
import { uploadV1ReferralFileToTenant } from "../Model/FilesModel";
import { useV1ReferralsModel } from "../Model/V1ReferralsModel";

type HttpErrorLike = {
  response?: {
    status?: number;
    data?: unknown;
  };
  message?: string;
};

function formatUploadError(e: unknown): string {
  if (typeof e === "object" && e !== null) {
    const err = e as HttpErrorLike;

    const status = err.response?.status;
    if (typeof status === "number") {
      const data =
        err.response?.data === undefined
          ? ""
          : `: ${JSON.stringify(err.response.data)}`;
      return `Upload failed (${status})${data}`;
    }

    if (typeof err.message === "string" && err.message.trim() !== "") {
      return `Upload failed: ${err.message}`;
    }
  }

  return "Upload failed. Please try again.";
}

export function UploadV1ReferralDocumentsDrawer(props: {
  referralId: string;
  onClose: (didUpload?: boolean) => void;
}) {
  const { referralId, onClose } = props;
  const titleId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { organizationId, locationId } = useRequiredSelectedLocationContext();

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
        file,
      );

      await uploadReferralDocumentMetadata(referralId, documentId, file.name);

      onClose(true);
    } catch (e: unknown) {
      setError(formatUploadError(e));
      setWorking(false);
    }
  }

  return (
    <Drawer
      anchor="right"
      open
      onClose={() => !working && onClose(false)}
      slotProps={{
        paper: {
          role: "dialog",
          "aria-modal": true,
          "aria-labelledby": titleId,
          sx: {
            width: { xs: "100%", sm: 600 },
            top: 45,
            height: "calc(100% - 45px)",
            display: "flex",
          },
        },
      }}
    >
      <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", p: 3 }}>
        <Typography id={titleId} variant="h6" sx={{ mb: 2 }}>
          Upload Referral Document
        </Typography>
        <Box sx={{ mt: 1 }}>
          <Button
            autoFocus
            onClick={() => fileInputRef.current?.click()}
            variant="outlined"
            startIcon={<CloudUploadIcon />}
            disabled={working}
          >
            Choose file
          </Button>
          <input
            ref={fileInputRef}
            hidden
            type="file"
            disabled={working}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />

          <Typography sx={{ mt: 1 }}>
            {file ? file.name : "No file selected"}
          </Typography>

          {error && (
            <Typography sx={{ mt: 1 }} color="error">
              {error}
            </Typography>
          )}
        </Box>
      </Box>

      <Box
        sx={{
          borderTop: 1,
          borderColor: "divider",
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: 1,
          justifyContent: "flex-end",
          p: 2,
          pb: "calc(16px + env(safe-area-inset-bottom))",
          backgroundColor: "background.paper",
        }}
      >
        <Button onClick={() => !working && onClose(false)} disabled={working}>
          Cancel
        </Button>
        <Button
          onClick={upload}
          variant="contained"
          disabled={!file || working}
        >
          Upload
        </Button>
      </Box>
    </Drawer>
  );
}
