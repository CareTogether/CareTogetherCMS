import { Box, Drawer } from '@mui/material';
import { CommunityInfo } from '../GeneratedClient';
import { AddFamilyCommunitiesFormV2 } from './AddFamilyCommunitiesFormV2';

type AddFamilyCommunitiesDrawerV2Props = {
  candidateCommunities: CommunityInfo[];
  familyId: string;
  onClose: () => void;
};

export function AddFamilyCommunitiesDrawerV2({
  candidateCommunities,
  familyId,
  onClose,
}: AddFamilyCommunitiesDrawerV2Props) {
  return (
    <Drawer
      anchor="right"
      open
      onClose={onClose}
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
        <AddFamilyCommunitiesFormV2
          candidateCommunities={candidateCommunities}
          familyId={familyId}
          onClose={onClose}
        />
      </Box>
    </Drawer>
  );
}
