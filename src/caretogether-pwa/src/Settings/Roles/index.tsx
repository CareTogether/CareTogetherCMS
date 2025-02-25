import {
  Button,
  Drawer,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { Permission } from '../../GeneratedClient';
import { useAppNavigate } from '../../Hooks/useAppNavigate';
import { useLoadable } from '../../Hooks/useLoadable';
import { organizationConfigurationQuery } from '../../Model/ConfigurationModel';
import { useGlobalPermissions } from '../../Model/SessionModel';
import { AddRole } from './AddRole';

export function RolesSection() {
  const configuration = useLoadable(organizationConfigurationQuery);
  const roles = configuration?.roles;

  const sortedRoles = [...(roles || [])].sort((a, b) =>
    a.roleName! < b.roleName! ? -1 : a.roleName! > b.roleName! ? 1 : 0
  );

  const appNavigate = useAppNavigate();

  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const permissions = useGlobalPermissions();

  return (
    <>
      <Typography variant="h2">Roles</Typography>

      <TableContainer>
        <Table aria-label="sticky table">
          <TableHead>
            <TableRow>
              <TableCell align="left" sx={{ minWidth: 200 }}>
                Name
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedRoles.map((role) => (
              <TableRow
                key={role.roleName}
                hover
                role="listitem"
                tabIndex={-1}
                sx={{ cursor: 'pointer' }}
                onClick={() => appNavigate.role(role.roleName!)}
              >
                <TableCell align="left" sx={{ minWidth: 200 }}>
                  {role.roleName}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {permissions(Permission.CreateCommunity) && (
        <>
          <Button
            sx={{ marginY: 2 }}
            variant="contained"
            onClick={() => setAddDrawerOpen(true)}
          >
            Add new role
          </Button>
          <Drawer
            // For some reason, without this, the text field in AddRole will not be autofocused
            disableRestoreFocus
            anchor="right"
            open={addDrawerOpen}
            onClose={() => setAddDrawerOpen(false)}
            sx={{
              '.MuiDrawer-paper': {
                padding: 2,
                paddingTop: { xs: 7, sm: 8, md: 6 },
              },
            }}
          >
            <AddRole onClose={() => setAddDrawerOpen(false)} />
          </Drawer>
        </>
      )}
    </>
  );
}
