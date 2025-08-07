import { Masonry } from '@mui/lab';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import { Grid, Typography, Button, useTheme } from '@mui/material';
import { Box, useMediaQuery } from '@mui/system';
import {
  ArrangementPolicy,
  CombinedFamilyInfo,
  Permission,
  V1Case,
} from '../../../GeneratedClient';
import { ArrangementCard } from '../ArrangementCard';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { CreateArrangementDialog } from '../CreateArrangementDialog';
import { useRef, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { policyData } from '../../../Model/ConfigurationModel';
import { getFilteredArrangements } from './getFilteredArrangements';
import { useScrollToArrangement } from './useScrollToArrangement';

type ArrangementSectionProps = {
  v1Case: V1Case;
  family: CombinedFamilyInfo;
  permissions: (permission: Permission) => boolean;
};

export function ArrangementsSection({
  v1Case,
  family,
  permissions,
}: ArrangementSectionProps) {
  const [selectedFilters, setSelectedFilters] = useState<string[]>([
    'Active',
    'Ended',
    'Cancelled',
  ]);

  const policy = useRecoilValue(policyData);

  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('sm'));
  const isWideScreen = useMediaQuery(theme.breakpoints.up('xl'));

  const [
    createArrangementDialogParameter,
    setCreateArrangementDialogParameter,
  ] = useState<ArrangementPolicy | null>(null);

  const filteredArrangements = getFilteredArrangements(v1Case, selectedFilters);

  const arrangementRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useScrollToArrangement(arrangementRefs);

  return (
    <Grid item xs={12}>
      <div
        style={{
          display: `flex`,
          justifyContent: `space-between`,
          maxWidth: `100%`,
          flexWrap: `wrap`,
        }}
      >
        <div
          style={{
            display: `flex`,
            justifyContent: `flex-start`,
            maxWidth: `100%`,
            flexWrap: `wrap`,
          }}
        >
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            flexWrap="wrap"
            gap={2}
            mb={2}
          >
            <Typography
              className="ph-unmask"
              variant="h3"
              sx={{ m: 0, display: 'flex', alignItems: 'center' }}
            >
              Arrangements
            </Typography>

            <ToggleButtonGroup
              value={selectedFilters}
              onChange={(_e, newFilters) => {
                if (newFilters.length > 0) setSelectedFilters(newFilters);
              }}
              aria-label="Arrangement Status Filter"
              size="small"
            >
              <ToggleButton value="Active">Active</ToggleButton>
              <ToggleButton value="Ended">Ended</ToggleButton>
              <ToggleButton value="Cancelled">Cancelled</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </div>
        {permissions(Permission.CreateArrangement) && (
          <Box
            sx={{
              textAlign: 'center',
              display: `flex`,
              flexDirection: `row`,
              maxWidth: `100%`,
              flexWrap: `wrap`,
            }}
          >
            {v1Case &&
              policy.referralPolicy?.arrangementPolicies?.map(
                (arrangementPolicy) => (
                  <Box key={arrangementPolicy.arrangementType}>
                    <Button
                      className="ph-unmask"
                      onClick={() =>
                        setCreateArrangementDialogParameter(arrangementPolicy)
                      }
                      variant="contained"
                      size="small"
                      sx={{ margin: 1 }}
                      startIcon={<AddCircleIcon />}
                    >
                      {arrangementPolicy.arrangementType}
                    </Button>
                  </Box>
                )
              )}
          </Box>
        )}
      </div>
      <Masonry columns={isDesktop ? (isWideScreen ? 3 : 2) : 1} spacing={2}>
        {filteredArrangements.map((arrangement) => (
          <div
            key={arrangement.id}
            ref={(el) => {
              if (arrangement.id) {
                arrangementRefs.current[arrangement.id] = el;
              }
            }}
          >
            <ArrangementCard
              partneringFamily={family}
              v1CaseId={v1Case.id!}
              arrangement={arrangement}
            />
          </div>
        ))}
      </Masonry>

      {createArrangementDialogParameter && (
        <CreateArrangementDialog
          v1CaseId={`${v1Case!.id}`}
          arrangementPolicy={createArrangementDialogParameter}
          onClose={() => setCreateArrangementDialogParameter(null)}
        />
      )}
    </Grid>
  );
}
