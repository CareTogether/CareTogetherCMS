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
} from '@mui/material';
import { useState } from 'react';
import {
  AllPartneringFamiliesPermissionContext,
  AllVolunteerFamiliesPermissionContext,
  AssignedFunctionsInReferralCoAssigneeFamiliesPermissionContext as AssignedFunctionsInV1CaseCoAssigneeFamiliesPermissionContext,
  AssignedFunctionsInReferralPartneringFamilyPermissionContext as AssignedFunctionsInV1CasePartneringFamilyPermissionContext,
  CommunityCoMemberFamiliesPermissionContext,
  CommunityMemberPermissionContext,
  ContextualPermissionSet,
  GlobalPermissionContext,
  IContextualPermissionSet,
  OwnFamilyPermissionContext,
  OwnReferralAssigneeFamiliesPermissionContext as OwnV1CaseAssigneeFamiliesPermissionContext,
  PermissionContext,
  RoleDefinition,
  Permission,
  CommunityCoMemberFamiliesAssignedFunctionsInReferralPartneringFamilyPermissionContext as CommunityCoMemberFamiliesAssignedFunctionsInV1CasePartneringFamilyPermissionContext,
  CommunityCoMemberFamiliesAssignedFunctionsInReferralCoAssignedFamiliesPermissionContext as CommunityCoMemberFamiliesAssignedFunctionsInV1CaseCoAssignedFamiliesPermissionContext,
} from '../../GeneratedClient';
import { organizationConfigurationEdited } from '../../Model/ConfigurationModel';
import { useGlobalPermissions } from '../../Model/SessionModel';
import AddIcon from '@mui/icons-material/Add';
import { useBackdrop } from '../../Hooks/useBackdrop';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { ContextualPermissionSetRow } from './ContextualPermissionSetRow';
import { api } from '../../Api/Api';
import { selectedLocationContextState } from '../../Model/Data';
import { Box } from '@mui/system';
import { isRoleEditable } from './isRoleEditable';
import { ContextualPermissionSetRowAutocomplete } from './ContextualPermissionSetRowWithAutocomplete';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { Breadcrumbs } from '../../Generic/Breadcrumbs';

export function RoleEdit({
  roleDefinition,
}: {
  roleDefinition: RoleDefinition;
}) {
  const permissions = useGlobalPermissions();

  const storeEdits = useSetRecoilState(organizationConfigurationEdited);

  const { organizationId } = useRecoilValue(selectedLocationContextState);

  const [workingRole, setWorkingRole] =
    useState<RoleDefinition>(roleDefinition);

  const [dirty, setDirty] = useState(false);

  const isEditable = Boolean(
    workingRole &&
      permissions(Permission.AddEditRoles) &&
      isRoleEditable(workingRole)
  );

  function cancel() {
    setWorkingRole(roleDefinition);
    setDirty(false);
  }

  const withBackdrop = useBackdrop();

  function save() {
    withBackdrop(async () => {
      const newConfig = await api.configuration.putRoleDefinition(
        organizationId,
        workingRole.roleName!,
        workingRole
      );
      storeEdits(newConfig);
      setDirty(false);
    });
  }

  function deletePermissionSetAtIndex(i: number) {
    const newPermissionSets = workingRole.permissionSets!.filter(
      (_, j) => j !== i
    );
    const newWorkingRole = {
      roleName: workingRole.roleName,
      permissionSets: newPermissionSets,
    } as RoleDefinition;
    setWorkingRole(newWorkingRole);
    setDirty(true);
  }

  function updatePermissionSetAtIndex(
    i: number,
    newValue: IContextualPermissionSet
  ) {
    const newPermissionSets = workingRole.permissionSets!.map((oldValue, j) =>
      j === i ? newValue : oldValue
    );
    const newWorkingRole = {
      roleName: workingRole.roleName,
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
      roleName: workingRole.roleName,
      permissionSets: workingRole.permissionSets!.concat(newSet),
    } as RoleDefinition;
    setWorkingRole(newWorkingRole);
    setDirty(true);
    setAddPermissionSetMenuAnchorEl(null);
  }

  const shouldUseAutocomplete = useFeatureFlagEnabled(
    'permissionsAutocomplete'
  );

  return (
    <Stack
      className="ph-unmask"
      paddingY={2}
      height="calc(100vh - 48px)"
      spacing={0}
    >
      <Box>
        <Breadcrumbs
          items={[
            {
              label: 'Settings',
              to: '../..',
              relative: 'path',
            },
            {
              label: 'Roles',
              to: '..',
              relative: 'path',
            },
          ]}
          currentPageLabel={roleDefinition.roleName || ''}
        />

        <Typography sx={{ marginY: 2 }} variant="h2">
          Editing {roleDefinition.roleName} role
        </Typography>
      </Box>

      <TableContainer>
        <Table sx={{ minWidth: '700px' }} stickyHeader size="small">
          <colgroup>
            <col />
            <col style={{ width: '50%' }} />
            <col style={{ width: '50%' }} />
          </colgroup>
          <TableHead>
            <TableRow>
              <TableCell></TableCell>
              <TableCell>Context</TableCell>
              <TableCell>Permissions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {workingRole?.permissionSets?.map((permissionSet, i) =>
              shouldUseAutocomplete ? (
                <ContextualPermissionSetRowAutocomplete
                  key={`${workingRole.permissionSets?.length}-${i}`}
                  editable={isEditable}
                  permissionSet={permissionSet}
                  onDelete={() => deletePermissionSetAtIndex(i)}
                  onUpdate={(newValue: IContextualPermissionSet) =>
                    updatePermissionSetAtIndex(i, newValue)
                  }
                />
              ) : (
                <ContextualPermissionSetRow
                  key={`${workingRole.permissionSets?.length}-${i}`}
                  editable={isEditable}
                  permissionSet={permissionSet}
                  onDelete={() => deletePermissionSetAtIndex(i)}
                  onUpdate={(newValue: IContextualPermissionSet) =>
                    updatePermissionSetAtIndex(i, newValue)
                  }
                />
              )
            )}
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
                new AssignedFunctionsInV1CasePartneringFamilyPermissionContext()
            )
          }
        >
          Assigned Functions in Case - Partnering Family
        </MenuItem>
        <MenuItem
          dense
          onClick={() =>
            addPermissionSet(
              () =>
                new AssignedFunctionsInV1CaseCoAssigneeFamiliesPermissionContext()
            )
          }
        >
          Assigned Functions in Case - Co-Assigned Families
        </MenuItem>
        <MenuItem
          dense
          onClick={() =>
            addPermissionSet(
              () => new OwnV1CaseAssigneeFamiliesPermissionContext()
            )
          }
        >
          Own Case - Assigned Families
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
        <MenuItem
          dense
          onClick={() =>
            addPermissionSet(
              () =>
                new CommunityCoMemberFamiliesAssignedFunctionsInV1CasePartneringFamilyPermissionContext()
            )
          }
        >
          Community Member - Co-Member Families - Assigned Functions in Case -
          Partnering Family
        </MenuItem>
        <MenuItem
          dense
          onClick={() =>
            addPermissionSet(
              () =>
                new CommunityCoMemberFamiliesAssignedFunctionsInV1CaseCoAssignedFamiliesPermissionContext()
            )
          }
        >
          Community Member - Co-Member Families - Assigned Functions in Case -
          Co-Assigned Families
        </MenuItem>
      </Menu>

      <Box paddingY={2} borderTop={1} borderColor="divider">
        <Stack direction="row" justifyContent="flex-end" alignItems="center">
          {dirty && (
            <Typography sx={{ fontStyle: 'italic' }} mr={2}>
              There are pending changes to be saved
            </Typography>
          )}

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
