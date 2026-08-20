import {
  Box,
  Button,
  Chip,
  Drawer,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { Community, Permission } from '../GeneratedClient';
import { useScreenTitle } from '../Shell/ShellScreenTitle';
import { Add as AddIcon } from '@mui/icons-material';
import { useState } from 'react';
import { useGlobalPermissions } from '../Model/SessionModel';
import { AddEditCommunity } from './AddEditCommunity';
import { useVisibleCommunities } from '../Model/Data';
import { useAppNavigate } from '../Hooks/useAppNavigate';
import { useOrganizationConfigurationLoadable } from '../Model/ConfigurationModel';

export function CommunitiesList() {
  useScreenTitle('Organizations');

  // The array object returned by state is read-only. We need to copy it before we can do an in-place sort.
  const communities = useVisibleCommunities()
    .map((x) => x.community!)
    .sort((a, b) => (a.name! < b.name! ? -1 : a.name! > b.name! ? 1 : 0));
  const organizationConfiguration = useOrganizationConfigurationLoadable();
  const categoriesById = new Map(
    (organizationConfiguration?.organizationCategories ?? []).map(
      (category) => [category.id, category]
    )
  );

  const appNavigate = useAppNavigate();
  function openCommunity(community: Community) {
    appNavigate.organization(community.id!);
  }

  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const permissions = useGlobalPermissions();

  return (
    <>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => setAddDrawerOpen(true)}
        sx={{ marginRight: 'auto', marginY: 2 }}
      >
        Add new organization
      </Button>

      <TableContainer>
        <Table aria-label="sticky table">
          <TableHead>
            <TableRow>
              <TableCell align="left" sx={{ minWidth: 200 }}>
                Name
              </TableCell>
              <TableCell align="left" sx={{ minWidth: 400 }}>
                Description
              </TableCell>
              <TableCell align="left" sx={{ minWidth: 220 }}>
                Categories
              </TableCell>
              <TableCell align="right" sx={{ minWidth: 50 }}>
                Member Families
              </TableCell>
              <TableCell align="right" sx={{ minWidth: 50 }}>
                Role Assigments
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {communities.map((community) => (
              <TableRow
                key={community.id}
                hover
                role="listitem"
                tabIndex={-1}
                sx={{ cursor: 'pointer' }}
                onClick={() => openCommunity(community)}
              >
                <TableCell align="left" sx={{ minWidth: 200 }}>
                  {community.name}
                </TableCell>
                <TableCell align="left" sx={{ minWidth: 400 }}>
                  {community.description}
                </TableCell>
                <TableCell align="left" sx={{ minWidth: 220 }}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(community.categoryIds ?? [])
                      .map((categoryId) => categoriesById.get(categoryId))
                      .filter((category) => category != null)
                      .sort((first, second) =>
                        first.name!.localeCompare(second.name!, undefined, {
                          sensitivity: 'base',
                        })
                      )
                      .map((category) => (
                        <Chip
                          key={category.id}
                          label={category.name}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                  </Box>
                </TableCell>
                <TableCell align="right" sx={{ minWidth: 50 }}>
                  {community.memberFamilies?.length}
                </TableCell>
                <TableCell align="right" sx={{ minWidth: 50 }}>
                  {community.communityRoleAssignments?.length}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {permissions(Permission.CreateOrganization) && (
        <Drawer
          anchor="right"
          open={addDrawerOpen}
          onClose={() => setAddDrawerOpen(false)}
          slotProps={{
            paper: {
              sx: {
                padding: 2,
                paddingTop: { xs: 7, sm: 8, md: 6 },
              },
            },
          }}
        >
          <AddEditCommunity onClose={() => setAddDrawerOpen(false)} />
        </Drawer>
      )}
    </>
  );
}
