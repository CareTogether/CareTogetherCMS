import { AddCircle as AddCircleIcon } from '@mui/icons-material';
import { Box, Button, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import { useRecoilValue } from 'recoil';
import Grid from '../../../Generic/GridLegacyCompat';
import {
  ArrangementPolicy,
  CombinedFamilyInfo,
  Permission,
  V1Case,
} from '../../../GeneratedClient';
import { personNameString } from '../../../Families/PersonName';
import {
  useFamilyLookup,
  usePersonLookup,
} from '../../../Model/DirectoryModel';
import { policyData } from '../../../Model/ConfigurationModel';
import { ArrangementDetailsDrawerV2 } from '../ArrangementDetailsDrawerV2';
import { ArrangementsDataGridV2 } from '../ArrangementsDataGridV2';
import {
  ArrangementRowV2,
  buildArrangementRowsV2,
} from '../arrangementViewModel';
import { CreateArrangementDialog } from '../CreateArrangementDialog';
import { getFilteredArrangements } from './getFilteredArrangements';

type ArrangementSectionProps = {
  v1Case: V1Case;
  family: CombinedFamilyInfo;
  permissions: (permission: Permission) => boolean;
  hideTitle?: boolean;
  scrollToArrangementId?: string;
};

export function ArrangementsSection({
  v1Case,
  family,
  permissions,
  hideTitle = false,
  scrollToArrangementId,
}: ArrangementSectionProps) {
  const [selectedArrangementRowId, setSelectedArrangementRowId] = useState<
    string | null
  >(null);
  const [
    createArrangementDialogParameter,
    setCreateArrangementDialogParameter,
  ] = useState<ArrangementPolicy | null>(null);
  const policy = useRecoilValue(policyData);
  const personLookup = usePersonLookup();
  const familyLookup = useFamilyLookup();
  const arrangements = useMemo(
    () => getFilteredArrangements(v1Case, []),
    [v1Case]
  );
  const arrangementRows = useMemo(
    () =>
      buildArrangementRowsV2({
        arrangements,
        arrangementPolicies: policy.referralPolicy?.arrangementPolicies,
        family,
        v1Case,
        personLabel: (familyId, personId) =>
          personNameString(personLookup(familyId, personId)),
        familyLabel: (familyId) => {
          const matchedFamily = familyLookup(familyId);
          const primaryContactPerson = matchedFamily?.family?.adults?.find(
            (adult) =>
              adult.item1?.id ===
              matchedFamily.family?.primaryFamilyContactPersonId
          )?.item1;

          return primaryContactPerson
            ? `${personNameString(primaryContactPerson)} Family`
            : 'Family';
        },
      }),
    [arrangements, family, familyLookup, personLookup, policy, v1Case]
  );
  const selectedArrangementRow = useMemo(
    () =>
      arrangementRows.find((row) => row.id === selectedArrangementRowId) ?? null,
    [arrangementRows, selectedArrangementRowId]
  );

  return (
    <Grid item xs={12} sx={{ mb: 3 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          maxWidth: '100%',
          flexWrap: 'wrap',
          gap: 2,
          mb: 2,
        }}
      >
        {!hideTitle && (
          <Typography
            className="ph-unmask"
            variant="h3"
            sx={{ m: 0, display: 'flex', alignItems: 'center' }}
          >
            Arrangements
          </Typography>
        )}

        {permissions(Permission.CreateArrangement) && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'flex-end',
              alignItems: 'center',
              flex: '1 1 auto',
              maxWidth: '100%',
              flexWrap: 'wrap',
              gap: 1,
            }}
          >
            {policy.referralPolicy?.arrangementPolicies
              ?.filter(
                (arrangementPolicy) =>
                  !arrangementPolicy.supersededAtUtc ||
                  new Date(arrangementPolicy.supersededAtUtc) > new Date()
              )
              .map((arrangementPolicy) => (
                <Box key={arrangementPolicy.arrangementType}>
                  <Button
                    className="ph-unmask"
                    onClick={() =>
                      setCreateArrangementDialogParameter(arrangementPolicy)
                    }
                    variant="contained"
                    size="small"
                    startIcon={<AddCircleIcon />}
                  >
                    {arrangementPolicy.arrangementType}
                  </Button>
                </Box>
              ))}
          </Box>
        )}
      </Box>

      {arrangementRows.length > 0 ? (
        <ArrangementsDataGridV2
          highlightedArrangementId={scrollToArrangementId}
          rows={arrangementRows}
          onRowClick={(row: ArrangementRowV2) =>
            setSelectedArrangementRowId(row.id)
          }
        />
      ) : (
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
          <Typography color="text.secondary" variant="body2">
            No arrangements yet.
          </Typography>
        </Box>
      )}

      {createArrangementDialogParameter && (
        <CreateArrangementDialog
          v1CaseId={`${v1Case.id}`}
          arrangementPolicy={createArrangementDialogParameter}
          onClose={() => setCreateArrangementDialogParameter(null)}
        />
      )}
      <ArrangementDetailsDrawerV2
        row={selectedArrangementRow}
        open={selectedArrangementRow !== null}
        onClose={() => setSelectedArrangementRowId(null)}
      />
    </Grid>
  );
}
