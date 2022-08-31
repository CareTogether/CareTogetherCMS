import { Grid, Table, TableContainer, TableBody, TableHead, TableRow, Stack, Select, InputLabel, FormControl, MenuItem, FormHelperText, TableCell, IconButton, Button, Menu, List, ListItem, ListItemText, Divider, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { AllPartneringFamiliesPermissionContext, AllVolunteerFamiliesPermissionContext, AssignedFunctionsInReferralCoAssigneeFamiliesPermissionContext, AssignedFunctionsInReferralPartneringFamilyPermissionContext, ContextualPermissionSet, GlobalPermissionContext, OwnFamilyPermissionContext, OwnReferralAssigneeFamiliesPermissionContext, Permission, PermissionContext, RoleDefinition } from '../GeneratedClient';
import { useLoadable } from '../Hooks/useLoadable';
import { configurationClientQuery, organizationConfigurationEdited, organizationConfigurationQuery } from '../Model/ConfigurationModel';
import { currentOrganizationIdQuery, useGlobalPermissions } from '../Model/SessionModel';
import { ProgressBackdrop } from '../Shell/ProgressBackdrop';
import useScreenTitle from '../Shell/ShellScreenTitle';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useBackdrop } from '../Hooks/useBackdrop';
import { useRecoilValue, useSetRecoilState } from 'recoil';

function RoleSettings() {
  const configuration = useLoadable(organizationConfigurationQuery);
  const configurationClient = useLoadable(configurationClientQuery);
  const organizationId = useRecoilValue(currentOrganizationIdQuery);
  const storeEdits = useSetRecoilState(organizationConfigurationEdited);
  const roles = configuration?.roles;
  
  const permissions = useGlobalPermissions();

  const [selectedRoleName, setSelectedRoleName] = useState("");
  const [workingRole, setWorkingRole] = useState<RoleDefinition | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const selectedRole = roles?.find(role => role.roleName === selectedRoleName);
    if (selectedRole) {
      setWorkingRole(selectedRole);
    }
  }, [roles, selectedRoleName, setWorkingRole]);

  const isEditable = workingRole && permissions(Permission.EditRoles) &&
    workingRole.roleName !== "OrganizationAdministrator";

  function cancel() {
    const selectedRole = roles?.find(role => role.roleName === selectedRoleName);
    setWorkingRole(selectedRole || null);
    setDirty(false);
  }

  const withBackdrop = useBackdrop();
  function save() {
    withBackdrop(async () => {
      const newConfig = await configurationClient!.putRoleDefinition(
        organizationId, workingRole!.roleName!, workingRole!);
      storeEdits(newConfig);
      setDirty(false);
    });
  }
  
  function deletePermissionSetAtIndex(i: number) {
    const newPermissionSets = workingRole!.permissionSets!.filter((_, j) => j !== i);
    const newWorkingRole = {
      roleName: workingRole!.roleName,
      permissionSets: newPermissionSets
    } as RoleDefinition;
    setWorkingRole(newWorkingRole);
    setDirty(true);
  }

  function removePermissionFromPermissionSet(i: number, permission: Permission) {
    const newPermissionSets = workingRole!.permissionSets!.map((set, j) => j === i
      ? {
          context: set.context,
          permissions: set.permissions!.filter(p => p !== permission)
        } as ContextualPermissionSet
      : set);
    const newWorkingRole = {
      roleName: workingRole!.roleName,
      permissionSets: newPermissionSets
    } as RoleDefinition;
    setWorkingRole(newWorkingRole);
    setDirty(true);
  }

  const [addPermissionSetMenuAnchorEl, setAddPermissionSetMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [addPermissionMenuAnchorEl, setAddPermissionMenuAnchorEl] = useState<null | HTMLElement>(null);

  const [currentPermissionSet, setCurrentPermissionSet] = useState<null | ContextualPermissionSet>(null);
  function openAddPermissionMenu(permissionSet: ContextualPermissionSet, anchorElement: HTMLElement) {
    setAddPermissionMenuAnchorEl(anchorElement);
    setCurrentPermissionSet(permissionSet);
  }

  function closeAddPermissionMenu() {
    setAddPermissionMenuAnchorEl(null);
    setCurrentPermissionSet(null);
  }

  function addPermissionSet<T extends PermissionContext>(factory: () => T) {
    const newContext = factory();
    const newSet = new ContextualPermissionSet({ context: newContext, permissions: [] });
    const newWorkingRole = {
      roleName: workingRole!.roleName,
      permissionSets: workingRole!.permissionSets!.concat(newSet)
    } as RoleDefinition;
    setWorkingRole(newWorkingRole);
    setDirty(true);
    setAddPermissionSetMenuAnchorEl(null);
  }

  function addPermission(permission: Permission) {
    const newPermissionSets = workingRole!.permissionSets!.map(set => set === currentPermissionSet
      ? {
          context: set.context,
          permissions: set.permissions!.concat(permission)
        } as ContextualPermissionSet
      : set);
    const newWorkingRole = {
      roleName: workingRole!.roleName,
      permissionSets: newPermissionSets
    } as RoleDefinition;
    setWorkingRole(newWorkingRole);
    setDirty(true);
    closeAddPermissionMenu();
  }

  useScreenTitle("Roles");

  return (!roles
  ? <ProgressBackdrop>
      <p>Loading roles...</p>
    </ProgressBackdrop>
  : <Grid container>
      <Grid item xs={12}>
        <Stack direction='row' sx={{marginTop: 1}}>
          <FormControl>
            <InputLabel id='role-select-label'>Role</InputLabel>
            <Select size='small'
              sx={{minWidth: 200}}
              labelId='role-select-label'
              label="Role"
              value={selectedRoleName}
              onChange={e => setSelectedRoleName(e.target.value)}>
              {roles.map(role => (
                <MenuItem key={role.roleName} value={role.roleName}>{role.roleName}</MenuItem>
              ))}
            </Select>
            <FormHelperText>{!workingRole && "Select a role to edit"}</FormHelperText>
          </FormControl>
          {isEditable && <Button color='secondary' disabled={!dirty} onClick={cancel}>Cancel</Button>}
          {isEditable && <Button color='primary' disabled={!dirty} onClick={save}>Save</Button>}
        </Stack>
      </Grid>
      <Grid item xs={12}>
        <TableContainer>
          <Table sx={{minWidth: '700px'}} size="small">
            <TableHead>
              <TableRow>
                <TableCell></TableCell>
                <TableCell>Context</TableCell>
                <TableCell>Permissions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {workingRole?.permissionSets?.map((permissionSet, i) => (
                <TableRow key={`${workingRole.permissionSets?.length}-${i}`}>
                  <TableCell>
                    {isEditable
                      ? <IconButton onClick={() => deletePermissionSetAtIndex(i)}>
                          <DeleteIcon />
                        </IconButton>
                      : <></>}
                  </TableCell>
                  <TableCell>
                    { permissionSet.context instanceof GlobalPermissionContext
                      ? <Stack>
                          <Typography variant='h6'>Global</Typography>
                        </Stack>
                      : permissionSet.context instanceof OwnFamilyPermissionContext
                      ? <Stack>
                          <Typography variant='h6'>Own Family</Typography>
                        </Stack>
                      : permissionSet.context instanceof AllVolunteerFamiliesPermissionContext
                      ? <Stack>
                          <Typography variant='h6'>All Volunteer Families</Typography>
                        </Stack>
                      : permissionSet.context instanceof AllPartneringFamiliesPermissionContext
                      ? <Stack>
                          <Typography variant='h6'>All Partnering Families</Typography>
                        </Stack>
                      : permissionSet.context instanceof AssignedFunctionsInReferralPartneringFamilyPermissionContext
                      ? <Stack>
                          <Typography variant='h6'>Assigned Functions in Referral - Partnering Family</Typography>
                          <Stack dir='row'>
                            {permissionSet.context.whenOwnFunctionIsIn}
                            {permissionSet.context.whenReferralIsOpen}
                          </Stack>
                        </Stack>
                      : permissionSet.context instanceof AssignedFunctionsInReferralCoAssigneeFamiliesPermissionContext
                      ? <Stack>
                          <Typography variant='h6'>Assigned Functions in Referral - Co-Assigned Families</Typography>
                          <Stack dir='row'>
                            {permissionSet.context.whenAssigneeFunctionIsIn}
                            {permissionSet.context.whenOwnFunctionIsIn}
                            {permissionSet.context.whenReferralIsOpen}
                          </Stack>
                        </Stack>
                      : permissionSet.context instanceof OwnReferralAssigneeFamiliesPermissionContext
                      ? <Stack>
                          <Typography variant='h6'>Own Referral - Assigned Families</Typography>
                          <Stack dir='row'>
                            {permissionSet.context.whenAssigneeFunctionIsIn}
                            {permissionSet.context.whenReferralIsOpen}
                          </Stack>
                        </Stack>
                      : JSON.stringify(permissionSet.context) }
                  </TableCell>
                  <TableCell>
                    <List dense>
                      {permissionSet.permissions?.map(permission => (
                        <ListItem key={permission.toString()} disablePadding>
                          {isEditable &&
                            <IconButton edge='start' onClick={() => removePermissionFromPermissionSet(i, permission)}>
                              <DeleteIcon />
                            </IconButton>}
                          <ListItemText>{Permission[permission]}</ListItemText>
                        </ListItem>
                      ))}
                      {isEditable &&
                        <ListItem disablePadding>
                          <IconButton edge='start' onClick={(event) => openAddPermissionMenu(permissionSet, event.currentTarget)}>
                            <AddIcon />
                          </IconButton>
                        </ListItem>}
                    </List>
                  </TableCell>
                </TableRow>
              ))}
              {isEditable &&
                <TableRow>
                  <TableCell>
                    <IconButton onClick={(event) => setAddPermissionSetMenuAnchorEl(event.currentTarget)}>
                      <AddIcon />
                    </IconButton>
                  </TableCell>
                  <TableCell colSpan={2}>
                  </TableCell>
                </TableRow>}
            </TableBody>
          </Table>
        </TableContainer>
        <Menu
          open={Boolean(addPermissionSetMenuAnchorEl)}
          anchorEl={addPermissionSetMenuAnchorEl}
          onClose={() => setAddPermissionSetMenuAnchorEl(null)}>
          <MenuItem dense onClick={() => addPermissionSet(() => new GlobalPermissionContext())}>Global</MenuItem>
          <MenuItem dense onClick={() => addPermissionSet(() => new OwnFamilyPermissionContext())}>Own Family</MenuItem>
          <MenuItem dense onClick={() => addPermissionSet(() => new AllVolunteerFamiliesPermissionContext())}>All Volunteer Families</MenuItem>
          <MenuItem dense onClick={() => addPermissionSet(() => new AllPartneringFamiliesPermissionContext())}>All Partnering Families</MenuItem>
          <MenuItem dense onClick={() => addPermissionSet(() => new AssignedFunctionsInReferralPartneringFamilyPermissionContext())}>Assigned Functions in Referral - Partnering Family</MenuItem>
          <MenuItem dense onClick={() => addPermissionSet(() => new AssignedFunctionsInReferralCoAssigneeFamiliesPermissionContext())}>Assigned Functions in Referral - Co-Assigned Families</MenuItem>
          <MenuItem dense onClick={() => addPermissionSet(() => new OwnReferralAssigneeFamiliesPermissionContext())}>Own Referral - Assigned Families</MenuItem>
        </Menu>
        <Menu
          open={Boolean(addPermissionMenuAnchorEl)}
          anchorEl={addPermissionMenuAnchorEl}
          onClose={closeAddPermissionMenu}>
          {Object.entries(Permission).filter(permission =>
            typeof permission[1] !== 'string' &&
            !currentPermissionSet?.permissions?.some(p => p === permission[1])).map((permission, i, all) => {
              const permissionMenuItem = (
                <MenuItem key={permission[0]} dense
                  onClick={() => addPermission(permission[1] as Permission)}>
                  {permission[0]}
                </MenuItem>);
              // Group similar permission items
              return i > 0 && Math.floor((all[i-1][1] as number)/100) < Math.floor((permission[1] as number)/100)
                ? [<Divider />, permissionMenuItem]
                : permissionMenuItem;
            })}
        </Menu>
      </Grid>
    </Grid>
  );
}

export { RoleSettings };
