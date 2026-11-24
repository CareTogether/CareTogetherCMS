import {
  Alert,
  Box,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  GridColumnVisibilityModel,
  GridSortModel,
} from '@mui/x-data-grid-premium';
import Grid from '../Generic/GridLegacyCompat';
import type {
  CombinedFamilyInfo,
  Permission,
  V1Referral,
} from '../GeneratedClient';
import {
  downloadFamilyFile,
  downloadV1ReferralFile,
  getFamilyFilePreviewUrl,
  getV1ReferralFilePreviewUrl,
} from '../Model/FilesModel';
import { DeleteDocumentDialog } from './DeleteDocumentDialog';
import { FamilyDocumentPreviewDrawerV2 } from './FamilyDocumentPreviewDrawerV2';
import { FamilyDocumentsDataGridV2 } from './FamilyDocumentsDataGridV2';
import { FamilyDocumentsListV2 } from './FamilyDocumentsListV2';
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

export function FamilyDocumentsSectionV2(props: FamilyDocumentsSectionV2Props) {
  return (
    <FamilyDocumentsSectionContent
      key={[
        props.organizationId,
        props.locationId,
        props.family.family?.id,
      ].join(':')}
      {...props}
    />
  );
}

function FamilyDocumentsSectionContent({
  family,
  hideTitle = false,
  locationId,
  organizationId,
  permissions,
  referrals = [],
  uploaderLabel,
}: FamilyDocumentsSectionV2Props) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const [search, setSearch] = useState('');
  const [downloadError, setDownloadError] = useState<string>();
  const [columnVisibilityModel, setColumnVisibilityModel] =
    useState<GridColumnVisibilityModel>({
      searchText: false,
      sourceLabel: false,
    });
  const [sortModel, setSortModel] = useState<GridSortModel>([
    { field: 'uploadedAtUtc', sort: 'desc' },
  ]);
  const previewRequestIdRef = useRef(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const previewTriggerRef = useRef<HTMLElement | null>(null);
  const pendingDeleteRef = useRef<FamilyDocumentRowV2 | null>(null);
  useEffect(
    () => () => {
      previewRequestIdRef.current += 1;
      pendingDeleteRef.current = null;
    },
    []
  );
  const [selectedDocumentForPreview, setSelectedDocumentForPreview] =
    useState<FamilyDocumentRowV2 | null>(null);
  const [previewError, setPreviewError] = useState<string | undefined>();
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>();
  const [selectedDocumentForDelete, setSelectedDocumentForDelete] =
    useState<FamilyDocumentRowV2 | null>(null);
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
    async (row: FamilyDocumentRowV2) => {
      if (!row.permissionFlags.canDownload || !row.uploadedDocumentId) return;
      const requestId = previewRequestIdRef.current;
      setDownloadError(undefined);
      try {
        if (row.source.type === 'family') {
          await downloadFamilyFile(
            organizationId,
            locationId,
            row.source.familyId,
            row.uploadedDocumentId
          );
          return;
        }

        await downloadV1ReferralFile(
          organizationId,
          locationId,
          row.source.referralId,
          row.uploadedDocumentId
        );
      } catch {
        if (previewRequestIdRef.current === requestId)
          setDownloadError(
            'Download is unavailable for this document. Please try again.'
          );
      }
    },
    [locationId, organizationId]
  );

  const openDeleteDialog = useCallback((row: FamilyDocumentRowV2) => {
    if (
      !row.permissionFlags.canDelete ||
      row.source.type !== 'family' ||
      !row.uploadedDocumentId
    )
      return;

    setSelectedDocumentForDelete(row);
  }, []);

  const openPreview = useCallback(
    async (row: FamilyDocumentRowV2) => {
      previewTriggerRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      const requestId = previewRequestIdRef.current + 1;

      previewRequestIdRef.current = requestId;
      setSelectedDocumentForPreview(row);
      setPreviewError(undefined);
      setDownloadError(undefined);
      setPreviewLoading(true);
      setPreviewUrl(undefined);

      if (!row.permissionFlags.canPreview || !row.uploadedDocumentId) {
        if (!row.uploadedDocumentId)
          setPreviewError(
            'This document is unavailable because its identifier is missing.'
          );
        setPreviewLoading(false);
        return;
      }

      try {
        const url =
          row.source.type === 'family'
            ? await getFamilyFilePreviewUrl(
                organizationId,
                locationId,
                row.source.familyId,
                row.uploadedDocumentId
              )
            : await getV1ReferralFilePreviewUrl(
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
    },
    [locationId, organizationId]
  );

  const previewDocument = useCallback(
    (row: FamilyDocumentRowV2) => void openPreview(row),
    [openPreview]
  );
  const previewRow =
    rows.find((row) => row.id === selectedDocumentForPreview?.id) ?? null;

  function deleteFromDetails(row: FamilyDocumentRowV2) {
    if (
      !row.permissionFlags.canDelete ||
      row.source.type !== 'family' ||
      !row.uploadedDocumentId
    )
      return;
    pendingDeleteRef.current = row;
    closePreview();
  }

  function finishClosingPreview() {
    const target = pendingDeleteRef.current;
    pendingDeleteRef.current = null;
    const current = target && rows.find((row) => row.id === target.id);
    (previewTriggerRef.current?.isConnected
      ? previewTriggerRef.current
      : sectionRef.current
    )?.focus();
    if (current) openDeleteDialog(current);
  }

  return (
    <Grid item xs={12} mb={2} ref={sectionRef} tabIndex={-1}>
      <Stack spacing={1}>
        {!hideTitle && (
          <Typography className="ph-unmask" variant="h6">
            Documents
          </Typography>
        )}
        {downloadError && !previewRow && (
          <Alert severity="error" onClose={() => setDownloadError(undefined)}>
            {downloadError}
          </Alert>
        )}
        {rows.length > 0 ? (
          isDesktop ? (
            <FamilyDocumentsDataGridV2
              filterScopeId={family.family?.id}
              rows={rows}
              onDelete={openDeleteDialog}
              onDownload={downloadDocument}
              onPreview={previewDocument}
              columnVisibilityModel={columnVisibilityModel}
              onColumnVisibilityModelChange={setColumnVisibilityModel}
              sortModel={sortModel}
              onSortModelChange={setSortModel}
            />
          ) : (
            <FamilyDocumentsListV2
              rows={rows}
              search={search}
              onSearchChange={setSearch}
              onOpen={previewDocument}
            />
          )
        ) : (
          <EmptyFamilyDocumentsState />
        )}
        <FamilyDocumentPreviewDrawerV2
          error={previewError}
          loading={previewLoading}
          previewUrl={previewUrl}
          row={previewRow}
          onClose={closePreview}
          onDownload={downloadDocument}
          downloadError={downloadError}
          onDelete={!isDesktop ? deleteFromDetails : undefined}
          onExited={finishClosingPreview}
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
