import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { Permission } from '../../GeneratedClient';
import { useAppNavigate } from '../../Hooks/useAppNavigate';
import { useLoadable } from '../../Hooks/useLoadable';
import { organizationConfigurationQuery } from '../../Model/ConfigurationModel';
import { useGlobalPermissions } from '../../Model/SessionModel';
import { AddRole } from './AddRole';
import { useSidePanel } from '../../Hooks/useSidePanel';
import { DeleteRoleButton } from './DeleteRoleButton';

export function RolesSection() {
  const configuration = useLoadable(organizationConfigurationQuery);
  const roles = configuration?.roles;

  const sortedRoles = [...(roles || [])].sort((a, b) =>
    a.roleName! < b.roleName! ? -1 : a.roleName! > b.roleName! ? 1 : 0
  );

  const appNavigate = useAppNavigate();

  const { SidePanel, openSidePanel, closeSidePanel } = useSidePanel();

  const permissions = useGlobalPermissions();

  return (
    <>
      <Typography variant="h2">Roles</Typography>

      <TableContainer>
        <Table aria-label="Roles list" size="small">
          <TableHead>
            <TableRow>
              <TableCell align="left" sx={{ minWidth: 200 }}>
                Name
              </TableCell>
              <TableCell>Actions</TableCell>
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

                <TableCell
                  // We don't want clicks in this cell to open the item
                  // For some reason, the event is not being stopped in the IconButton in DeleteRoleButton
                  onClick={(event) => event.stopPropagation()}
                >
                  <DeleteRoleButton roleName={role.roleName!} />
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
            onClick={() => openSidePanel()}
          >
            Add new role
          </Button>

          <SidePanel>
            <AddRole onClose={() => closeSidePanel()} />
          </SidePanel>
        </>
      )}
    </>
  );
}
