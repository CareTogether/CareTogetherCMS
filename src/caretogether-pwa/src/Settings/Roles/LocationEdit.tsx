import {
  Stack,
  MenuItem,
  Menu,
  Typography,
  Breadcrumbs,
  useTheme,
  useMediaQuery,
  Link as MuiLink,
  IconButton,
} from '@mui/material';
import { useState, useEffect } from 'react';
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
import BasicConfiguration from './BasicConfiguration';
import ActionDefinitions from './ActionDefinitions';
import ApprovalPolicies from './ApprovalPolicies';
import SettingsTabMenu from './SettingsTabMenu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useFeatureFlagEnabled } from 'posthog-js/react';

export function LocationEdit() {
  const { locationId } = useParams<{ locationId: string }>();

  const configuration = useLoadable(organizationConfigurationQuery);
  const { organizationId } = useRecoilValue(selectedLocationContextState);

  const location = configuration?.locations?.find(
    (location) => location.id === locationId
  );

  console.log('Selected location:', location);

  const hideActionsTab = useFeatureFlagEnabled('hide-action-definitions-tab');
  const hidePoliciesTab = useFeatureFlagEnabled('hide-approval-policies-tab');

  const availableTabs: ('basic' | 'actions' | 'policies')[] = ['basic'];
  if (!hideActionsTab) availableTabs.push('actions');
  if (!hidePoliciesTab) availableTabs.push('policies');

  useScreenTitle(`Editing ${location?.name} configuration`);

  const [configurationValues, setConfigurationValues] = useState({
    timezone: location?.timeZone || '',
    ethnicities: location?.ethnicities || [],
    familyRelationships: location?.adultFamilyRelationships || [],
    arrangementReasons: location?.arrangementReasons || [],
  });

  const configurationOptions = {
    timezones: configuration?.availableTimeZones || [],
    ethnicities: configuration?.ethnicities || [],
    familyRelationships: configuration?.adultFamilyRelationships || [],
    arrangementReasons: configuration?.arrangementReasons || [],
  };

  const storeEdits = useSetRecoilState(organizationConfigurationEdited);
  const roles = configuration?.roles;

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    if (isMobile) {
      setIsSidebarCollapsed(true);
    } else {
      setIsSidebarCollapsed(false);
    }
  }, [isMobile]);

  // const permissions = useGlobalPermissions();

  const selectedRole = roles?.find((role) => role.roleName === locationId);

  const [workingRole, setWorkingRole] = useState<RoleDefinition | undefined>(
    selectedRole
  );
  const [, setDirty] = useState(false);

  const [activeTab, setActiveTab] = useState<'basic' | 'actions' | 'policies'>(
    'basic'
  );

  useEffect(() => {
    if (!availableTabs.includes(activeTab)) {
      setActiveTab('basic');
    }
  }, [hideActionsTab, hidePoliciesTab]);

  console.log('timezone value:', configurationValues.timezone);

  // const isEditable = Boolean(
  //   workingRole &&
  //     permissions(Permission.AddEditRoles) &&
  //     isRoleEditable(workingRole)
  // );

  const handleBasicConfigChange = <K extends keyof typeof configurationValues>(
    key: K,
    value: (typeof configurationValues)[K]
  ) => {
    setConfigurationValues((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

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

  return !location ? (
    <ProgressBackdrop>
      <p>Loading location configuration...</p>
    </ProgressBackdrop>
  ) : (
    <Stack spacing={0} sx={{ height: '100%', minHeight: '100vh' }}>
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
      </Box>

      <Box display="flex" flex={1} minHeight={0} sx={{ overflow: 'auto' }}>
        <Box
          sx={{
            width: isMobile && isSidebarCollapsed ? 40 : 240,
            minHeight: '100%',
            borderRight: '1px solid #e0e0e0',
            p: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
          }}
        >
          {isMobile && (
            <IconButton
              size="small"
              onClick={() => setIsSidebarCollapsed((prev) => !prev)}
              sx={{ alignSelf: 'flex-end', mb: 1 }}
              color="primary"
            >
              {isSidebarCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            </IconButton>
          )}

          {(!isMobile || !isSidebarCollapsed) && (
            <Box sx={{ flex: 1, px: 1 }}>
              <SettingsTabMenu
                activeTab={activeTab}
                onTabChange={setActiveTab}
                hideActionsTab={hideActionsTab ?? false}
                hidePoliciesTab={hidePoliciesTab ?? false}
              />
            </Box>
          )}
        </Box>

        <Box flex={1} paddingLeft={4} paddingTop={2}>
          {activeTab === 'basic' && (
            <BasicConfiguration
              data={{
                locationName: location?.name ?? '',
                timezone:
                  typeof configurationValues.timezone === 'string'
                    ? configurationValues.timezone
                    : '',
                ethnicities: configurationValues.ethnicities,
                familyRelationships: configurationValues.familyRelationships,
                arrangementReasons: configurationValues.arrangementReasons,
              }}
              options={configurationOptions}
              onChange={handleBasicConfigChange}
              setDirty={setDirty}
              onSave={save}
              onCancel={cancel}
            />
          )}
          {activeTab === 'actions' && !hideActionsTab && <ActionDefinitions />}
          {activeTab === 'policies' && !hidePoliciesTab && <ApprovalPolicies />}
        </Box>
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
    </Stack>
  );
}
