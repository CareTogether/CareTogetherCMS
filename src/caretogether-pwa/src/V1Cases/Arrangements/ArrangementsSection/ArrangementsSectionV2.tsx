import { AddCircle as AddCircleIcon } from '@mui/icons-material';
import { Box, Button, Typography } from '@mui/material';
import { useState } from 'react';
import { useRecoilValue } from 'recoil';
import Grid from '../../../Generic/GridLegacyCompat';
import {
  ArrangementPolicy,
  Permission,
  V1Case,
} from '../../../GeneratedClient';
import { policyData } from '../../../Model/ConfigurationModel';
import { ArrangementsDataGridV2 } from '../ArrangementsDataGridV2';
import { ArrangementRowV2 } from '../arrangementViewModel';
import { CreateArrangementDialog } from '../CreateArrangementDialog';
import { isArrangementPolicyAvailable } from '../arrangementPolicyVersions';

type ArrangementSectionProps = {
  arrangementRows: ArrangementRowV2[];
  v1Case: V1Case;
  permissions: (permission: Permission) => boolean;
  hideTitle?: boolean;
  onArrangementRowClick: (row: ArrangementRowV2) => void;
  scrollToArrangementId?: string;
};

export function ArrangementsSection({
  arrangementRows,
  v1Case,
  permissions,
  hideTitle = false,
  onArrangementRowClick,
  scrollToArrangementId,
}: ArrangementSectionProps) {
  const [
    createArrangementDialogParameter,
    setCreateArrangementDialogParameter,
  ] = useState<ArrangementPolicy | null>(null);
  const policy = useRecoilValue(policyData);

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
              ?.filter((arrangementPolicy) =>
                isArrangementPolicyAvailable(arrangementPolicy)
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
          onRowClick={onArrangementRowClick}
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
    </Grid>
  );
}
