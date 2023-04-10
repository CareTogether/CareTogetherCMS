import { Grid, Table, TableContainer, TableBody, TableHead, TableRow, Stack, Select, InputLabel, FormControl, MenuItem, FormHelperText, TableCell, IconButton, Button, Menu } from '@mui/material';
import { useState } from 'react';
import { AllPartneringFamiliesPermissionContext, AllVolunteerFamiliesPermissionContext, AssignedFunctionsInReferralCoAssigneeFamiliesPermissionContext, AssignedFunctionsInReferralPartneringFamilyPermissionContext, CommunityCoMemberFamiliesPermissionContext, CommunityMemberPermissionContext, ContextualPermissionSet, GlobalPermissionContext, IContextualPermissionSet, OwnFamilyPermissionContext, OwnReferralAssigneeFamiliesPermissionContext, Permission, PermissionContext, RoleDefinition } from '../GeneratedClient';
import { useLoadable } from '../Hooks/useLoadable';
import { organizationConfigurationEdited, organizationConfigurationQuery } from '../Model/ConfigurationModel';
import { useGlobalPermissions } from '../Model/SessionModel';
import { ProgressBackdrop } from '../Shell/ProgressBackdrop';
import useScreenTitle from '../Shell/ShellScreenTitle';
import AddIcon from '@mui/icons-material/Add';
import { useBackdrop } from '../Hooks/useBackdrop';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { ContextualPermissionSetRow } from './ContextualPermissionSetRow';
import { api } from '../Api/Api';
import { selectedOrganizationIdState } from '../Model/Data';

function RoleSettings() {
  const configuration = useLoadable(organizationConfigurationQuery);
  const organizationId = useRecoilValue(selectedOrganizationIdState);
  const storeEdits = useSetRecoilState(organizationConfigurationEdited);
  const roles = configuration?.roles;
  
  const permissions = useGlobalPermissions();

  const [selectedRoleName, setSelectedRoleName] = useState("");
  const [workingRole, setWorkingRole] = useState<RoleDefinition | null>(null);
  const [dirty, setDirty] = useState(false);

  function selectRole(roleName: string) {
    setSelectedRoleName(roleName);
    const selectedRole = roles?.find(role => role.roleName === roleName);
    setWorkingRole(selectedRole || null);
  }

  const isEditable = (workingRole && permissions(Permission.EditRoles) &&
    workingRole.roleName !== "OrganizationAdministrator") || false;

  function cancel() {
    const selectedRole = roles?.find(role => role.roleName === selectedRoleName);
    setWorkingRole(selectedRole || null);
    setDirty(false);
  }

  const withBackdrop = useBackdrop();
  function save() {
    withBackdrop(async () => {
      const newConfig = await api.configuration.putRoleDefinition(
        organizationId!, workingRole!.roleName!, workingRole!);
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

  function updatePermissionSetAtIndex(i: number, newValue: IContextualPermissionSet) {
    const newPermissionSets = workingRole!.permissionSets!.map((oldValue, j) => j === i ? newValue : oldValue);
    const newWorkingRole = {
      roleName: workingRole!.roleName,
      permissionSets: newPermissionSets
    } as RoleDefinition;
    setWorkingRole(newWorkingRole);
    setDirty(true);
  }

  const [addPermissionSetMenuAnchorEl, setAddPermissionSetMenuAnchorEl] = useState<null | HTMLElement>(null);

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
              onChange={e => selectRole(e.target.value)}>
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
                <ContextualPermissionSetRow
                  key={`${workingRole.permissionSets?.length}-${i}`}
                  editable={isEditable}
                  permissionSet={permissionSet}
                  onDelete={() => deletePermissionSetAtIndex(i)}
                  onUpdate={(newValue: IContextualPermissionSet) => updatePermissionSetAtIndex(i, newValue)}
                />
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
          <MenuItem dense onClick={() => addPermissionSet(() => new CommunityMemberPermissionContext())}>Community Member - Community</MenuItem>
          <MenuItem dense onClick={() => addPermissionSet(() => new CommunityCoMemberFamiliesPermissionContext())}>Community Member - Co-Member Families</MenuItem>
        </Menu>
      </Grid>
    </Grid>
  );
}

export { RoleSettings };
