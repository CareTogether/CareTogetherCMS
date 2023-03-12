import { Container, Toolbar } from '@mui/material';
import { useParams } from 'react-router-dom';
import { useCommunityLookup, useDataInitialized } from '../Model/DirectoryModel';
import { ProgressBackdrop } from '../Shell/ProgressBackdrop';
import useScreenTitle from '../Shell/ShellScreenTitle';

export function CommunityScreen() {
  const communityIdMaybe = useParams<{ communityId: string; }>();
  const communityId = communityIdMaybe.communityId as string;

  const dataInitialized = useDataInitialized();

  const communityLookup = useCommunityLookup();
  const community = communityLookup(communityId)!;
  
  useScreenTitle(community?.name || "...");

  // const policy = useRecoilValue(policyData);
  // const theme = useTheme();
  // const isDesktop = useMediaQuery(theme.breakpoints.up('sm'));
  // const isWideScreen = useMediaQuery(theme.breakpoints.up('xl'));
  // const permissions = useCommunityPermissions(community);
  
  return (!dataInitialized
    ? <ProgressBackdrop>
        <p>Loading community...</p>
      </ProgressBackdrop>
    :
    <Container maxWidth={false} sx={{ paddingLeft: '12px' }}>
      <Toolbar variant="dense" disableGutters={true}>
      </Toolbar>
      <pre>{communityId}</pre>
    </Container>);
}
