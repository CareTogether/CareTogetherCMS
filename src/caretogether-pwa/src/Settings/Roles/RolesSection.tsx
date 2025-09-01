import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
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
import { isRoleEditable } from './isRoleEditable';
import { useRecoilValue } from 'recoil';
import { selectedLocationContextState } from '../../Model/Data';
import { camelCaseToSpaces } from '../../Utilities/stringUtils';
import { Breadcrumbs } from '../../Generic/Breadcrumbs';

export function RolesSection() {
  const configuration = useLoadable(organizationConfigurationQuery);
  const roles = configuration?.roles;

  const sortedRoles = [...(roles || [])].sort((a, b) =>
    a.roleName! < b.roleName! ? -1 : a.roleName! > b.roleName! ? 1 : 0
  );

  const { organizationId, locationId } = useRecoilValue(
    selectedLocationContextState
  );

  const appNavigate = useAppNavigate();

  const { SidePanel, openSidePanel, closeSidePanel } = useSidePanel();

  const permissions = useGlobalPermissions();

  const canEdit = permissions(Permission.AddEditRoles);

  return (
    <>
      <Breadcrumbs
        items={[
          {
            label: 'Settings',
            to: `/org/${organizationId}/${locationId}/settings`,
          },
        ]}
        currentPageLabel="Roles"
        sx={{ mb: 2 }}
      />

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
            {sortedRoles.map((role) => {
              const canDelete = isRoleEditable(role) && canEdit;

              const deleteRoleButton = (
                <DeleteRoleButton
                  roleName={role.roleName!}
                  disabled={!canDelete}
                />
              );

              return (
                <TableRow
                  key={role.roleName}
                  hover
                  role="listitem"
                  tabIndex={-1}
                  sx={{ cursor: 'pointer' }}
                  onClick={() => appNavigate.role(role.roleName!)}
                >
                  <TableCell align="left" sx={{ minWidth: 200 }}>
                    {camelCaseToSpaces(role.roleName!)}
                  </TableCell>

                  <TableCell
                    // We don't want clicks in this cell to open the item
                    // For some reason, the event is not being stopped in the IconButton in DeleteRoleButton
                    onClick={(event) => event.stopPropagation()}
                  >
                    {canDelete ? (
                      deleteRoleButton
                    ) : (
                      // Explain why user can't delete the role. Have to use MUI's Tooltip as per:
                      // https://v5.mui.com/material-ui/react-tooltip/#disabled-elements
                      // https://github.com/mui/material-ui/issues/8416#issuecomment-332556082
                      <Tooltip
                        title="Not allowed to delete this role"
                        placement="bottom"
                      >
                        <span>{deleteRoleButton}</span>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {canEdit && (
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
