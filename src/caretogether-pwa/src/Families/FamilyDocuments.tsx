import { useMemo, useState } from 'react';
import { Menu, MenuItem, Chip, Box } from '@mui/material';
import { format } from 'date-fns';
import { useRecoilValue } from 'recoil';
import {
  CombinedFamilyInfo,
  Permission,
  UploadedDocumentInfo,
  V1Referral,
} from '../GeneratedClient';
import {
  downloadFamilyFile,
  downloadV1ReferralFile,
} from '../Model/FilesModel';
import { useFamilyPermissions } from '../Model/SessionModel';
import { DeleteDocumentDialog } from './DeleteDocumentDialog';
import { selectedLocationContextState } from '../Model/Data';

type FamilyDocumentsProps = {
  family: CombinedFamilyInfo;
  referrals?: V1Referral[];
};

type MergedDocumentRow =
  | {
      kind: 'family';
      key: string;
      document: UploadedDocumentInfo;
      uploadedFileName?: string;
      timestampUtc?: Date;
    }
  | {
      kind: 'referral';
      key: string;
      referralId: string;
      referralTitle: string;
      document: UploadedDocumentInfo;
      uploadedFileName?: string;
      timestampUtc?: Date;
    };

export function FamilyDocuments({
  family,
  referrals = [],
}: FamilyDocumentsProps) {
  const { organizationId, locationId } = useRecoilValue(
    selectedLocationContextState
  );

  const [moreMenuAnchor, setMoreMenuAnchor] = useState<{
    anchor: Element;
    document: UploadedDocumentInfo;
  } | null>(null);

  const [deleteParameter, setDeleteParameter] = useState<{
    familyId: string;
    document: UploadedDocumentInfo;
  } | null>(null);

  const permissions = useFamilyPermissions(family);

  function selectDelete(document: UploadedDocumentInfo) {
    setMoreMenuAnchor(null);
    setDeleteParameter({ familyId: family.family!.id!, document });
  }

  const mergedDocuments = useMemo<MergedDocumentRow[]>(() => {
    const familyDocuments: MergedDocumentRow[] =
      family.uploadedDocuments?.map((document, index) => ({
        kind: 'family',
        key: `family-${document.uploadedDocumentId ?? index}`,
        document,
        uploadedFileName: document.uploadedFileName,
        timestampUtc: document.timestampUtc,
      })) ?? [];

    const referralDocuments: MergedDocumentRow[] = referrals.flatMap(
      (referral, referralIndex) =>
        (referral.uploadedDocuments ?? []).map((document, documentIndex) => ({
          kind: 'referral' as const,
          key: `referral-${referral.referralId}-${document.uploadedDocumentId ?? `${referralIndex}-${documentIndex}`}`,
          referralId: referral.referralId,
          referralTitle: referral.title ?? 'Referral',
          document,
          uploadedFileName: document.uploadedFileName,
          timestampUtc: document.timestampUtc,
        }))
    );

    return [...familyDocuments, ...referralDocuments].sort((a, b) => {
      const aTime = a.timestampUtc?.getTime() ?? 0;
      const bTime = b.timestampUtc?.getTime() ?? 0;
      return bTime - aTime;
    });
  }, [family.uploadedDocuments, referrals]);

  return (
    <>
      <Box
        component="ul"
        sx={{
          listStyle: 'none',
          m: 0,
          p: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        {mergedDocuments.map((row) => {
          const canRead =
            row.kind === 'family'
              ? permissions(Permission.ReadFamilyDocuments)
              : true;

          const canDelete =
            row.kind === 'family' &&
            permissions(Permission.DeleteFamilyDocuments);

          const handleClick = () => {
            if (row.kind === 'family') {
              downloadFamilyFile(
                organizationId,
                locationId,
                family.family!.id!,
                row.document.uploadedDocumentId!
              );
              return;
            }

            downloadV1ReferralFile(
              organizationId,
              locationId,
              row.referralId,
              row.document.uploadedDocumentId!
            );
          };

          return (
            <Box
              component="li"
              key={row.key}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                minWidth: 0,
                py: 0.25,
                cursor: canRead ? 'pointer' : 'default',
              }}
              onClick={canRead ? handleClick : undefined}
              onContextMenu={(e) => {
                if (!canDelete) return;
                e.preventDefault();
                setMoreMenuAnchor({
                  anchor: e.currentTarget,
                  document: row.document,
                });
              }}
            >
              <Box
                component="span"
                sx={{
                  flex: 1,
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                📃 {row.uploadedFileName}
              </Box>

              {row.kind === 'referral' && (
                <Chip
                  label={row.referralTitle}
                  size="small"
                  variant="outlined"
                  sx={{
                    flexShrink: 0,
                    maxWidth: 180,
                    '& .MuiChip-label': {
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    },
                  }}
                />
              )}

              {row.timestampUtc && (
                <Box
                  component="span"
                  sx={{
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                    color: 'text.secondary',
                    minWidth: 56,
                    textAlign: 'right',
                  }}
                >
                  {format(row.timestampUtc, 'M/d/yy')}
                </Box>
              )}
            </Box>
          );
        })}
      </Box>

      <Menu
        id="documents-more-menu"
        anchorEl={moreMenuAnchor?.anchor}
        keepMounted
        open={Boolean(moreMenuAnchor)}
        onClose={() => setMoreMenuAnchor(null)}
      >
        <MenuItem onClick={() => selectDelete(moreMenuAnchor!.document)}>
          Delete
        </MenuItem>
      </Menu>

      {deleteParameter && (
        <DeleteDocumentDialog
          familyId={deleteParameter.familyId}
          document={deleteParameter.document}
          onClose={() => setDeleteParameter(null)}
        />
      )}
    </>
  );
}
