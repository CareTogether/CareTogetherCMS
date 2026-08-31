import { Box, Stack, Typography } from '@mui/material';
import { useCallback, useMemo, useState } from 'react';
import Grid from '../Generic/GridLegacyCompat';
import type {
  CombinedFamilyInfo,
  Permission,
  V1Referral,
} from '../GeneratedClient';
import { useAccountInfo } from '../Authentication/Auth';
import { ActiveFiltersIndicator } from '../Generic/ActiveFiltersIndicator';
import { useScopedDataGridFilterPreferences } from '../Hooks/useScopedDataGridFilterPreferences';
import {
  downloadFamilyFile,
  downloadV1ReferralFile,
} from '../Model/FilesModel';
import { DeleteDocumentDialog } from './DeleteDocumentDialog';
import { FamilyDocumentsDataGridV2 } from './FamilyDocumentsDataGridV2';
import { familyDocumentsDataGridColumns } from './familyDocumentsDataGridColumnsV2';
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
  const [selectedDocumentForDelete, setSelectedDocumentForDelete] =
    useState<FamilyDocumentRowV2 | null>(null);
  const accountInfo = useAccountInfo();
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
  const columns = useMemo(
    () =>
      familyDocumentsDataGridColumns({
        onDelete: openDeleteDialog,
        onDownload: downloadDocument,
      }),
    [downloadDocument, openDeleteDialog]
  );
  const {
    clearFilters,
    filterModel,
    hasActiveFilters,
    onFilterModelChange,
  } = useScopedDataGridFilterPreferences({
    columns,
    namespace: 'family-documents-grid-filters',
    scope: {
      entityId: family.family?.id,
      locationId,
      organizationId,
      userId: accountInfo?.userId,
    },
  });

  return (
    <Grid item xs={12} mb={2}>
      <Stack spacing={1}>
        {!hideTitle && (
          <Typography className="ph-unmask" variant="h6">
            Documents
          </Typography>
        )}
        {hasActiveFilters && <ActiveFiltersIndicator onClear={clearFilters} />}
        {rows.length > 0 ? (
          <FamilyDocumentsDataGridV2
            columns={columns}
            filterModel={filterModel}
            rows={rows}
            onFilterModelChange={onFilterModelChange}
          />
        ) : (
          <EmptyFamilyDocumentsState />
        )}
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
