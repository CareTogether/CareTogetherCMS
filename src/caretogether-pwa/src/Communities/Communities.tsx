import { Container, Toolbar } from '@mui/material';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import useScreenTitle from '../Shell/ShellScreenTitle';
import { CommunitiesList } from './CommunitiesList';

function CommunityScreen() {
  const communityIdMaybe = useParams<{ communityId: string }>();
  const communityId = communityIdMaybe.communityId as string;

  // const communityLookup = useCommunityLookup();
  // const community = communityLookup(communityId)!;

  // const policy = useRecoilValue(policyData);

  // const theme = useTheme();
  // const isDesktop = useMediaQuery(theme.breakpoints.up('sm'));
  // const isWideScreen = useMediaQuery(theme.breakpoints.up('xl'));

  // const permissions = useCommunityPermissions(community);

  useScreenTitle("Community PLACEHOLDER");
  // useScreenTitle(community
  //   ? `${community.name}`
  //   : "...");

  return (/*!community
  ? <ProgressBackdrop>
      <p>Loading community...</p>
    </ProgressBackdrop>
  :*/
    <Container maxWidth={false} sx={{paddingLeft: '12px'}}>
      <Toolbar variant="dense" disableGutters={true}>
      </Toolbar>
      <h1>Community</h1>
      <pre>{communityId}</pre>
    </Container>);
}

export function Communities() {
  return (
    <Routes>
      <Route path="" element={<CommunitiesList />} />
      <Route path="community/:communityId" element={<CommunityScreen />} />
      <Route path="*" element={<Navigate to="" replace />} />
    </Routes>
  );
}
