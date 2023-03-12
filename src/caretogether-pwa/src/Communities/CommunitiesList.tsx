import { Container, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Community } from '../GeneratedClient';
import { useLoadable } from '../Hooks/useLoadable';
import { useDataInitialized, visibleCommunitiesQuery } from '../Model/DirectoryModel';
import { ProgressBackdrop } from '../Shell/ProgressBackdrop';
import useScreenTitle from '../Shell/ShellScreenTitle';

export function CommunitiesList() {
  useScreenTitle("Communities");

  const dataInitialized = useDataInitialized();

  // The array object returned by Recoil is read-only. We need to copy it before we can do an in-place sort.
  const communitiesLoadable = useLoadable(visibleCommunitiesQuery);
  const communities = (communitiesLoadable || []).map(x => x).sort((a, b) => a.name! < b.name! ? -1 : a.name! > b.name! ? 1 : 0);

  const navigate = useNavigate();
  function openCommunity(community: Community) {
    navigate(`/communities/community/${community.id}`);
  }

  return (!dataInitialized
    ? <ProgressBackdrop>
      <p>Loading communities...</p>
    </ProgressBackdrop>
    : <Container maxWidth={false} sx={{ paddingLeft: '12px' }}>
      <TableContainer>
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow>
              <TableCell align='left' sx={{ minWidth: 200 }}>
                Name
              </TableCell>
              <TableCell align='left' sx={{ minWidth: 400 }}>
                Description
              </TableCell>
              <TableCell align='right' sx={{ minWidth: 50 }}>
                Member Families
              </TableCell>
              <TableCell align='right' sx={{ minWidth: 50 }}>
                Role Assigments
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {communities.map(community => <TableRow key={community.id}
              hover role='listitem' tabIndex={-1}
              sx={{ cursor: 'pointer' }}
              onClick={() => openCommunity(community)}>
              <TableCell align='left' sx={{ minWidth: 200 }}>
                {community.name}
              </TableCell>
              <TableCell align='left' sx={{ minWidth: 400 }}>
                {community.description}
              </TableCell>
              <TableCell align='right' sx={{ minWidth: 50 }}>
                {community.memberFamilies?.length}
              </TableCell>
              <TableCell align='right' sx={{ minWidth: 50 }}>
                {community.communityRoleAssignments?.length}
              </TableCell>
            </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>);
}
