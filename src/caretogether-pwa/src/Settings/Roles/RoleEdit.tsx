import {
  Table,
  TableContainer,
  TableBody,
  TableHead,
  TableRow,
  Stack,
  MenuItem,
  TableCell,
  IconButton,
  Button,
  Menu,
  Typography,
  Breadcrumbs,
  Link as MuiLink,
} from '@mui/material';
import { useState } from 'react';
import {
  AllPartneringFamiliesPermissionContext,
  AllVolunteerFamiliesPermissionContext,
  AssignedFunctionsInReferralCoAssigneeFamiliesPermissionContext,
  AssignedFunctionsInReferralPartneringFamilyPermissionContext,
  CommunityCoMemberFamiliesPermissionContext,
  CommunityMemberPermissionContext,
  ContextualPermissionSet,
  GlobalPermissionContext,
  IContextualPermissionSet,
  OwnFamilyPermissionContext,
  OwnReferralAssigneeFamiliesPermissionContext,
  Permission,
  PermissionContext,
  RoleDefinition,
} from '../../GeneratedClient';
import { useLoadable } from '../../Hooks/useLoadable';
import {
  organizationConfigurationEdited,
  organizationConfigurationQuery,
} from '../../Model/ConfigurationModel';
import { useGlobalPermissions } from '../../Model/SessionModel';
import { ProgressBackdrop } from '../../Shell/ProgressBackdrop';
import useScreenTitle from '../../Shell/ShellScreenTitle';
import AddIcon from '@mui/icons-material/Add';
import { useBackdrop } from '../../Hooks/useBackdrop';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { ContextualPermissionSetRow } from './ContextualPermissionSetRow';
import { api } from '../../Api/Api';
import { selectedLocationContextState } from '../../Model/Data';
import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { Box } from '@mui/system';

export function RoleEdit() {
  const { roleName } = useParams<{ roleName: string }>();

  const configuration = useLoadable(organizationConfigurationQuery);
  const { organizationId } = useRecoilValue(selectedLocationContextState);
  const storeEdits = useSetRecoilState(organizationConfigurationEdited);
  const roles = configuration?.roles;

  const permissions = useGlobalPermissions();

  const selectedRole = roles?.find((role) => role.roleName === roleName);

  const [workingRole, setWorkingRole] = useState<RoleDefinition | undefined>(
    selectedRole
  );
  const [dirty, setDirty] = useState(false);

  const isEditable =
    (workingRole &&
      permissions(Permission.EditRoles) &&
      workingRole.roleName !== 'OrganizationAdministrator') ||
    false;

  function cancel() {
    setWorkingRole(selectedRole);
    setDirty(false);
  }

  const withBackdrop = useBackdrop();

  function save() {
    withBackdrop(async () => {
      const newConfig = await api.configuration.putRoleDefinition(
        organizationId!,
        workingRole!.roleName!,
        workingRole!
      );
      storeEdits(newConfig);
      setDirty(false);
    });
  }

  function deletePermissionSetAtIndex(i: number) {
    const newPermissionSets = workingRole!.permissionSets!.filter(
      (_, j) => j !== i
    );
    const newWorkingRole = {
      roleName: workingRole!.roleName,
      permissionSets: newPermissionSets,
    } as RoleDefinition;
    setWorkingRole(newWorkingRole);
    setDirty(true);
  }

  function updatePermissionSetAtIndex(
    i: number,
    newValue: IContextualPermissionSet
  ) {
    const newPermissionSets = workingRole!.permissionSets!.map((oldValue, j) =>
      j === i ? newValue : oldValue
    );
    const newWorkingRole = {
      roleName: workingRole!.roleName,
      permissionSets: newPermissionSets,
    } as RoleDefinition;
    setWorkingRole(newWorkingRole);
    setDirty(true);
  }

  const [addPermissionSetMenuAnchorEl, setAddPermissionSetMenuAnchorEl] =
    useState<null | HTMLElement>(null);

  function addPermissionSet<T extends PermissionContext>(factory: () => T) {
    const newContext = factory();
    const newSet = new ContextualPermissionSet({
      context: newContext,
      permissions: [],
    });
    const newWorkingRole = {
      roleName: workingRole!.roleName,
      permissionSets: workingRole!.permissionSets!.concat(newSet),
    } as RoleDefinition;
    setWorkingRole(newWorkingRole);
    setDirty(true);
    setAddPermissionSetMenuAnchorEl(null);
  }

  useScreenTitle('Roles');

  return !roles ? (
    <ProgressBackdrop>
      <p>Loading roles...</p>
    </ProgressBackdrop>
  ) : (
    <Stack paddingY={2} height="calc(100vh - 48px)" spacing={0}>
      <Box>
        <Breadcrumbs
          aria-label="breadcrumb"
          separator={<NavigateNextIcon fontSize="small" />}
        >
          <MuiLink component={Link} underline="hover" color="inherit" to="..">
            Settings
          </MuiLink>

          <MuiLink
            component={Link}
            underline="hover"
            color="inherit"
            to="..#roles"
          >
            Roles
          </MuiLink>

          <Typography color="text.primary">{roleName}</Typography>
        </Breadcrumbs>

        <Typography sx={{ marginY: 2 }} variant="h2">
          Editing {roleName} role
        </Typography>
      </Box>

      <TableContainer>
        <Table sx={{ minWidth: '700px' }} stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell></TableCell>
              <TableCell>Context</TableCell>
              <TableCell>Permissions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {workingRole?.permissionSets?.map((permissionSet, i) => (
              <ContextualPermissionSetRow
                key={`${workingRole.permissionSets?.length}-${i}`}
                editable={isEditable}
                permissionSet={permissionSet}
                onDelete={() => deletePermissionSetAtIndex(i)}
                onUpdate={(newValue: IContextualPermissionSet) =>
                  updatePermissionSetAtIndex(i, newValue)
                }
              />
            ))}
            {isEditable && (
              <TableRow>
                <TableCell>
                  <IconButton
                    onClick={(event) =>
                      setAddPermissionSetMenuAnchorEl(event.currentTarget)
                    }
                  >
                    <AddIcon />
                  </IconButton>
                </TableCell>
                <TableCell colSpan={2}></TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Menu
        open={Boolean(addPermissionSetMenuAnchorEl)}
        anchorEl={addPermissionSetMenuAnchorEl}
        onClose={() => setAddPermissionSetMenuAnchorEl(null)}
      >
        <MenuItem
          dense
          onClick={() => addPermissionSet(() => new GlobalPermissionContext())}
        >
          Global
        </MenuItem>
        <MenuItem
          dense
          onClick={() =>
            addPermissionSet(() => new OwnFamilyPermissionContext())
          }
        >
          Own Family
        </MenuItem>
        <MenuItem
          dense
          onClick={() =>
            addPermissionSet(() => new AllVolunteerFamiliesPermissionContext())
          }
        >
          All Volunteer Families
        </MenuItem>
        <MenuItem
          dense
          onClick={() =>
            addPermissionSet(() => new AllPartneringFamiliesPermissionContext())
          }
        >
          All Partnering Families
        </MenuItem>
        <MenuItem
          dense
          onClick={() =>
            addPermissionSet(
              () =>
                new AssignedFunctionsInReferralPartneringFamilyPermissionContext()
            )
          }
        >
          Assigned Functions in Referral - Partnering Family
        </MenuItem>
        <MenuItem
          dense
          onClick={() =>
            addPermissionSet(
              () =>
                new AssignedFunctionsInReferralCoAssigneeFamiliesPermissionContext()
            )
          }
        >
          Assigned Functions in Referral - Co-Assigned Families
        </MenuItem>
        <MenuItem
          dense
          onClick={() =>
            addPermissionSet(
              () => new OwnReferralAssigneeFamiliesPermissionContext()
            )
          }
        >
          Own Referral - Assigned Families
        </MenuItem>
        <MenuItem
          dense
          onClick={() =>
            addPermissionSet(() => new CommunityMemberPermissionContext())
          }
        >
          Community Member - Community
        </MenuItem>
        <MenuItem
          dense
          onClick={() =>
            addPermissionSet(
              () => new CommunityCoMemberFamiliesPermissionContext()
            )
          }
        >
          Community Member - Co-Member Families
        </MenuItem>
      </Menu>

      <Box paddingY={2} borderTop={1} borderColor="divider">
        <Stack direction="row" justifyContent="flex-end">
          {isEditable && (
            <Button
              color="secondary"
              variant="contained"
              sx={{ marginRight: 2 }}
              disabled={!dirty}
              onClick={cancel}
            >
              Cancel
            </Button>
          )}
          {isEditable && (
            <Button
              color="primary"
              variant="contained"
              disabled={!dirty}
              onClick={save}
            >
              Save
            </Button>
          )}
        </Stack>
      </Box>
    </Stack>
  );
}
