import { Box, Stack, Typography } from '@mui/material';
import { useCallback, useMemo, useRef, useState } from 'react';
import Grid from '../Generic/GridLegacyCompat';
import { api } from '../Api/Api';
import type {
  CombinedFamilyInfo,
  Permission,
  V1Referral,
} from '../GeneratedClient';
import {
  downloadFamilyFile,
  downloadV1ReferralFile,
} from '../Model/FilesModel';
import { DeleteDocumentDialog } from './DeleteDocumentDialog';
import { FamilyDocumentPreviewDrawerV2 } from './FamilyDocumentPreviewDrawerV2';
import { FamilyDocumentsDataGridV2 } from './FamilyDocumentsDataGridV2';
import {
  buildFamilyDocumentRowsV2,
  FamilyDocumentRowV2,
} from './familyDocumentsViewModelV2';

type FamilyDocumentsSectionV2Props = {
  family: CombinedFamilyInfo;
  hideTitle?: boolean;
  locationId: string;
  organizationId: string;
  permissions: (permission: Permission) => boolean;
  referrals?: V1Referral[];
  uploaderLabel?: (userId?: string) => string | undefined;
};

function EmptyFamilyDocumentsState() {
  return (
    <Box
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        bgcolor: 'background.paper',
        px: 2,
        py: 3,
        textAlign: 'center',
      }}
    >
      <Typography className="ph-unmask" variant="subtitle1">
        No documents yet.
      </Typography>
      <Typography
        className="ph-unmask"
        color="text.secondary"
        variant="body2"
        sx={{ mt: 0.5 }}
      >
        Family and referral documents will appear here once they are uploaded.
      </Typography>
    </Box>
  );
}

export function FamilyDocumentsSectionV2({
  family,
  hideTitle = false,
  locationId,
  organizationId,
  permissions,
  referrals = [],
  uploaderLabel,
}: FamilyDocumentsSectionV2Props) {
  const previewRequestIdRef = useRef(0);
  const [selectedDocumentForPreview, setSelectedDocumentForPreview] =
    useState<FamilyDocumentRowV2 | null>(null);
  const [selectedDocumentForDelete, setSelectedDocumentForDelete] =
    useState<FamilyDocumentRowV2 | null>(null);
  const [previewError, setPreviewError] = useState<string | undefined>();
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>();
  const rows = useMemo(
    () =>
      buildFamilyDocumentRowsV2({
        family,
        permissions,
        referrals,
        uploaderLabel,
      }),
    [family, permissions, referrals, uploaderLabel]
  );

  function closePreview() {
    previewRequestIdRef.current += 1;
    setSelectedDocumentForPreview(null);
    setPreviewError(undefined);
    setPreviewLoading(false);
    setPreviewUrl(undefined);
  }

  const downloadDocument = useCallback(
    (row: FamilyDocumentRowV2) => {
      if (!row.permissionFlags.canDownload || !row.uploadedDocumentId) return;

      if (row.source.type === 'family') {
        void downloadFamilyFile(
          organizationId,
          locationId,
          row.source.familyId,
          row.uploadedDocumentId
        );
        return;
      }

      void downloadV1ReferralFile(
        organizationId,
        locationId,
        row.source.referralId,
        row.uploadedDocumentId
      );
    },
    [locationId, organizationId]
  );

  const openDeleteDialog = useCallback((row: FamilyDocumentRowV2) => {
    if (!row.permissionFlags.canDelete || row.source.type !== 'family') return;

    setSelectedDocumentForDelete(row);
  }, []);

  const openPreview = useCallback(async (row: FamilyDocumentRowV2) => {
    const requestId = previewRequestIdRef.current + 1;

    previewRequestIdRef.current = requestId;
    setSelectedDocumentForPreview(row);
    setPreviewError(undefined);
    setPreviewLoading(true);
    setPreviewUrl(undefined);

    if (!row.permissionFlags.canPreview || !row.uploadedDocumentId) {
      setPreviewError('This document cannot be previewed.');
      setPreviewLoading(false);
      return;
    }

    try {
      const url =
        row.source.type === 'family'
          ? await api.files.getFamilyDocumentReadValetUrl(
              organizationId,
              locationId,
              row.source.familyId,
              row.uploadedDocumentId
            )
          : await api.files.getV1ReferralDocumentReadValetUrl(
              organizationId,
              locationId,
              row.source.referralId,
              row.uploadedDocumentId
            );

      if (previewRequestIdRef.current !== requestId) return;

      setPreviewUrl(url);
    } catch {
      if (previewRequestIdRef.current !== requestId) return;

      setPreviewError('Preview is unavailable for this document.');
    } finally {
      if (previewRequestIdRef.current === requestId) {
        setPreviewLoading(false);
      }
    }
  }, [locationId, organizationId]);

  return (
    <Grid item xs={12} mb={2}>
      <Stack spacing={1}>
        {!hideTitle && (
          <Typography className="ph-unmask" variant="h6">
            Documents
          </Typography>
        )}
        {rows.length > 0 ? (
          <FamilyDocumentsDataGridV2
            rows={rows}
            onDelete={openDeleteDialog}
            onDownload={downloadDocument}
            onPreview={(row) => void openPreview(row)}
            onRowClick={(row) => void openPreview(row)}
          />
        ) : (
          <EmptyFamilyDocumentsState />
        )}
        <FamilyDocumentPreviewDrawerV2
          error={previewError}
          loading={previewLoading}
          previewUrl={previewUrl}
          row={selectedDocumentForPreview}
          onClose={closePreview}
          onDownload={downloadDocument}
        />
        {selectedDocumentForDelete?.source.type === 'family' && (
          <DeleteDocumentDialog
            familyId={selectedDocumentForDelete.source.familyId}
            document={selectedDocumentForDelete.source.document}
            onClose={() => setSelectedDocumentForDelete(null)}
          />
        )}
      </Stack>
    </Grid>
  );
}
