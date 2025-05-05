import {
  Stack,
  MenuItem,
  Button,
  Menu,
  Typography,
  Breadcrumbs,
  Link as MuiLink,
  TextField,
  Chip,
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
  // IContextualPermissionSet,
  OwnFamilyPermissionContext,
  OwnReferralAssigneeFamiliesPermissionContext,
  PermissionContext,
  RoleDefinition,
} from '../../GeneratedClient';
import { useLoadable } from '../../Hooks/useLoadable';
import {
  organizationConfigurationEdited,
  organizationConfigurationQuery,
} from '../../Model/ConfigurationModel';
// import { useGlobalPermissions } from '../../Model/SessionModel';
import { ProgressBackdrop } from '../../Shell/ProgressBackdrop';
import useScreenTitle from '../../Shell/ShellScreenTitle';
import { useBackdrop } from '../../Hooks/useBackdrop';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { api } from '../../Api/Api';
import { selectedLocationContextState } from '../../Model/Data';
import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { Box } from '@mui/system';

export function LocationEdit() {
  const { locationId } = useParams<{ locationId: string }>();

  const configuration = useLoadable(organizationConfigurationQuery);
  const { organizationId } = useRecoilValue(selectedLocationContextState);

  const location = configuration?.locations?.find(
    (location) => location.id === locationId
  );

  const [timezone, setTimezone] = useState('America/New_York');
  const PHONE_NUMBERS = ['+1 101-101-0101', '+1 555-555-555', '+1 202-202-202'];

  const [phoneNumbers, setPhoneNumbers] = useState<string[]>(PHONE_NUMBERS);

  const storeEdits = useSetRecoilState(organizationConfigurationEdited);
  const roles = configuration?.roles;

  // const permissions = useGlobalPermissions();

  const selectedRole = roles?.find((role) => role.roleName === locationId);

  const [workingRole, setWorkingRole] = useState<RoleDefinition | undefined>(
    selectedRole
  );
  const [dirty, setDirty] = useState(false);

  // const isEditable = Boolean(
  //   workingRole &&
  //     permissions(Permission.AddEditRoles) &&
  //     isRoleEditable(workingRole)
  // );

  const isEditable = true;

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

  // function deletePermissionSetAtIndex(i: number) {
  //   const newPermissionSets = workingRole!.permissionSets!.filter(
  //     (_, j) => j !== i
  //   );
  //   const newWorkingRole = {
  //     roleName: workingRole!.roleName,
  //     permissionSets: newPermissionSets,
  //   } as RoleDefinition;
  //   setWorkingRole(newWorkingRole);
  //   setDirty(true);
  // }

  // function updatePermissionSetAtIndex(
  //   i: number,
  //   newValue: IContextualPermissionSet
  // ) {
  //   const newPermissionSets = workingRole!.permissionSets!.map((oldValue, j) =>
  //     j === i ? newValue : oldValue
  //   );
  //   const newWorkingRole = {
  //     roleName: workingRole!.roleName,
  //     permissionSets: newPermissionSets,
  //   } as RoleDefinition;
  //   setWorkingRole(newWorkingRole);
  //   setDirty(true);
  // }

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

  return !location ? (
    <ProgressBackdrop>
      <p>Loading location configuration...</p>
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
            Locations
          </MuiLink>

          <Typography color="text.primary">{location.name}</Typography>
        </Breadcrumbs>

        <Typography sx={{ marginY: 2 }} variant="h2">
          Editing {location.name} configuration
        </Typography>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Basic configuration
        </Typography>
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <TextField
            type="text"
            // fullWidth
            required
            label="Location name"
            placeholder="Enter a name for the location"
            // error={roleName.length === 0}
            value={location.name}
            // onChange={(e) => setRoleName(e.target.value)}
            // autoFocus
          />
          <TextField
            label="Timezone"
            select
            value={timezone}
            onChange={(e) => {
              setTimezone(e.target.value);
              setDirty(true);
            }}
          >
            {['America/New_York', 'Europe/London', 'America/Sao_Paulo'].map(
              (tz) => (
                <MenuItem key={tz} value={tz}>
                  {tz}
                </MenuItem>
              )
            )}
          </TextField>

          <TextField
            label="SMS source numbers"
            select
            fullWidth
            SelectProps={{
              multiple: true,
              renderValue: (selected) => {
                const selectedValues = selected as string[];
                return (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selectedValues.map((value) => (
                      <Box key={value} onMouseDown={(e) => e.stopPropagation()}>
                        <Chip
                          label={value}
                          onDelete={() => {
                            setPhoneNumbers((prev) =>
                              prev.filter((v) => v !== value)
                            );
                            setDirty(true);
                          }}
                        />
                      </Box>
                    ))}
                  </Box>
                );
              },
            }}
            value={phoneNumbers}
            onChange={(e) => {
              const value =
                typeof e.target.value === 'string'
                  ? e.target.value.split(',')
                  : e.target.value;
              setPhoneNumbers(value);
              setDirty(true);
            }}
          >
            {PHONE_NUMBERS.map((num) => (
              <MenuItem key={num} value={num}>
                {num}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Box>

      {/* <TableContainer>
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
      </TableContainer> */}

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
