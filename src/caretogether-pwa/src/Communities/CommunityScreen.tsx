import { Container, Grid, List, ListItem, ListItemText, Toolbar, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { familyNameString } from '../Families/FamilyName';
import { personNameString } from '../Families/PersonName';
import { CombinedFamilyInfo, Community } from '../GeneratedClient';
import { useCommunityLookup, useDataInitialized, usePersonAndFamilyLookup, visibleFamiliesQuery } from '../Model/DirectoryModel';
import { ProgressBackdrop } from '../Shell/ProgressBackdrop';
import useScreenTitle from '../Shell/ShellScreenTitle';

interface CommunityDescriptionProps {
  community: Community
}
function CommunityDescription({ community }: CommunityDescriptionProps) {
  return (
    <>
      <Typography variant='caption'>Description</Typography>
      <p>{community.description}</p>
    </>
  );
}

export function CommunityScreen() {
  const communityIdMaybe = useParams<{ communityId: string; }>();
  const communityId = communityIdMaybe.communityId as string;

  const dataInitialized = useDataInitialized();

  const communityLookup = useCommunityLookup();
  const community = communityLookup(communityId)!;

  const personLookup = usePersonAndFamilyLookup();
  const assignees = (community?.communityRoleAssignments || []).map(assignee => ({
    personAndFamily: personLookup(assignee.personId),
    communityRole: assignee.communityRole
  }));

  const visibleFamilies = useRecoilValue(visibleFamiliesQuery);

  const memberFamilies = (community?.memberFamilies || []).map(familyId =>
    visibleFamilies.find(family => family.family?.id === familyId)).filter(family => family) as CombinedFamilyInfo[];
  
  useScreenTitle(community?.name || "...");

  // const policy = useRecoilValue(policyData);
  // const theme = useTheme();
  // const isDesktop = useMediaQuery(theme.breakpoints.up('sm'));
  // const isWideScreen = useMediaQuery(theme.breakpoints.up('xl'));
  // const permissions = useCommunityPermissions(community);
  
  return ((!dataInitialized || !community)
    ? <ProgressBackdrop>
        <p>Loading community...</p>
      </ProgressBackdrop>
    : <Container maxWidth={false} sx={{ paddingLeft: '12px' }}>
        <Toolbar variant="dense" disableGutters={true}>
        </Toolbar>
        <Grid container>
          <Grid item xs={12}>
            <CommunityDescription community={community} />
          </Grid>
          <Grid item xs={12} lg={6}>
            <Typography variant='h6'>Role Assignments</Typography>
            <List>
              {assignees.map(assignee =>
                <ListItem key={`${assignee.personAndFamily!.person!.id}-${assignee.communityRole}`} disablePadding>
                  <ListItemText
                    primary={personNameString(assignee.personAndFamily.person)}
                    secondary={assignee.communityRole} />
                </ListItem>)}
            </List>
          </Grid>
          <Grid item xs={12} lg={6}>
            <Typography variant='h6'>Member Families</Typography>
            <List>
              {memberFamilies.map(family =>
                <ListItem key={family.family!.id} disablePadding>
                  <ListItemText
                    primary={familyNameString(family)} />
                </ListItem>)}
            </List>
          </Grid>
        </Grid>
      </Container>);
}
