import { Grid, Table, TableContainer, TableBody, TableHead, TableRow, Stack, Select, InputLabel, FormControl, MenuItem, FormHelperText, TableCell, IconButton, Button } from '@mui/material';
import { useEffect, useState } from 'react';
import { AllPartneringFamiliesPermissionContext, AllVolunteerFamiliesPermissionContext, AssignedFunctionsInReferralCoAssigneeFamiliesPermissionContext, AssignedFunctionsInReferralPartneringFamilyPermissionContext, GlobalPermissionContext, OwnFamilyPermissionContext, OwnReferralAssigneeFamiliesPermissionContext, Permission, RoleDefinition } from '../GeneratedClient';
import { useLoadable } from '../Hooks/useLoadable';
import { configurationClientQuery, organizationConfigurationEdited, organizationConfigurationQuery } from '../Model/ConfigurationModel';
import { currentOrganizationIdQuery, useGlobalPermissions } from '../Model/SessionModel';
import { ProgressBackdrop } from '../Shell/ProgressBackdrop';
import useScreenTitle from '../Shell/ShellScreenTitle';
import DeleteIcon from '@mui/icons-material/Delete'
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

  function deletePermissionSetAtIndex(i: number) {
    const newPermissionSets = workingRole!.permissionSets!.filter((_, j) => j !== i);
    const newWorkingRole = {
      roleName: workingRole!.roleName,
      permissionSets: newPermissionSets
    } as RoleDefinition;
    setWorkingRole(newWorkingRole);
    setDirty(true);
  }

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
    });
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
                      ? "Global"
                      : permissionSet.context instanceof OwnFamilyPermissionContext
                      ? "Own Family"
                      : permissionSet.context instanceof AllVolunteerFamiliesPermissionContext
                      ? "All Volunteer Families"
                      : permissionSet.context instanceof AllPartneringFamiliesPermissionContext
                      ? "All Partnering Families"
                      : permissionSet.context instanceof AssignedFunctionsInReferralPartneringFamilyPermissionContext
                      ? "Assigned Functions in Referral - Partnering Family"
                      : permissionSet.context instanceof AssignedFunctionsInReferralCoAssigneeFamiliesPermissionContext
                      ? "Assigned Functions in Referral - Co-Assigned Families"
                      : permissionSet.context instanceof OwnReferralAssigneeFamiliesPermissionContext
                      ? "Own Referral - Assigned Families"
                      : JSON.stringify(permissionSet.context) }
                  </TableCell>
                  <TableCell>
                    <ul>
                      {permissionSet.permissions?.map(permission => (
                        <li key={permission.toString()}>{permission} - {Permission[permission]}</li>
                      ))}
                    </ul>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>
    </Grid>
  );
}

export { RoleSettings };
