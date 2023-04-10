import {
  Grid,
  Button,
  Icon,
  useTheme,
  Divider,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  Checkbox,
  ListItemText,
  useMediaQuery
} from "@mui/material";
import { Permission, Person, UserInfo } from "../GeneratedClient";
import { useGlobalPermissions } from "../Model/SessionModel";
import { useBackdrop } from "../Hooks/useBackdrop";
import { useRecoilCallback, useRecoilValue } from "recoil";
import { personNameString } from "./PersonName";
import { AccountCircle, NoAccounts, PersonAdd } from "@mui/icons-material";
import { organizationConfigurationQuery } from "../Model/ConfigurationModel";
import { useState } from "react";
import { api } from "../Api/Api";
import { currentLocationQuery, selectedOrganizationIdState, visibleAggregatesState } from "../Model/Data";

interface ManageUserDrawerProps {
  onClose: () => void;
  adult: Person;
  user?: UserInfo;
}

export function ManageUserDrawer({ onClose, adult, user }: ManageUserDrawerProps) {
  const organizationId = useRecoilValue(selectedOrganizationIdState);
  const location = useRecoilValue(currentLocationQuery);
  const configuration = useRecoilValue(organizationConfigurationQuery);

  const withBackdrop = useBackdrop();

  async function invitePersonUser() {
    await withBackdrop(async () => {
      const inviteLink = await api.users.generatePersonInviteLink(
        organizationId, location.locationId, adult.id);
      await navigator.clipboard.writeText(inviteLink);
      alert(`The invite link for ${personNameString(adult)} has been copied to your clipboard.`);
    });
  }

  const [selectedRoles, setSelectedRoles] = useState(user?.locationRoles ?? []);
  const toggleRoleSelection = (role: string) => () => {
    const currentIndex = selectedRoles.indexOf(role);
    const newSelected = [...selectedRoles];

    if (currentIndex === -1) {
      newSelected.push(role);
    } else {
      newSelected.splice(currentIndex, 1);
    }

    setSelectedRoles(newSelected);
  };

  const permissions = useGlobalPermissions();

  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('sm'));

  const currentSorted = user?.locationRoles?.slice().sort() || [];
  const rolesChanged = selectedRoles.length !== currentSorted.length ||
    selectedRoles.slice().sort().some(function(value, index) {
      return value !== currentSorted[index];
    });

  const unsavedChanges = rolesChanged;

  const savePersonRoles = useRecoilCallback(({snapshot, set}) => {
    const asyncCallback = async () => {
      const updatedAggregate = await api.users.changePersonRoles(
        organizationId, location.locationId, adult.id, selectedRoles);

      set(visibleAggregatesState, current => 
        current.some(currentEntry => currentEntry.id === updatedAggregate.id && currentEntry.constructor === updatedAggregate.constructor)
        ? current.map(currentEntry => currentEntry.id === updatedAggregate.id && currentEntry.constructor === updatedAggregate.constructor
          ? updatedAggregate
          : currentEntry)
        : current.concat(updatedAggregate));
    };
    return asyncCallback;
  });

  function revert() {
    setSelectedRoles(user?.locationRoles ?? []);
  }

  function close() {
    if (!unsavedChanges ||
      window.confirm("You have unsaved changes that will be lost. Are you sure?")) {
      onClose();
    }
  }

  async function save() {
    await withBackdrop(async () => {
      if (rolesChanged) {
        await savePersonRoles();
      }
    });
    onClose();
  }

  return (
    <Grid container spacing={2} maxWidth={500}>
      <Grid item xs={12}>
        <h3>Manage User: {personNameString(adult)}</h3>
      </Grid>
      <Grid item xs={12}>
        { user?.userId
          ? <p style={{color: theme.palette.info.main}}>
              <Icon color='info' sx={{verticalAlign: 'sub', marginRight: 1}}>
                <AccountCircle />
              </Icon>
              User account activated
            </p>
          : <p style={{color: theme.palette.grey[500]}}>
              <Icon color='disabled' sx={{verticalAlign: 'sub', marginRight: 1}}>
                <NoAccounts />
              </Icon>
              Account not yet created
              <Button variant='contained' color='primary' endIcon={<PersonAdd />}
                onClick={invitePersonUser}
                sx={{marginLeft: 2}}>
                Invite
              </Button>
            </p>}
        <Divider />
      </Grid>
      <Grid item xs={12}>
        <Typography variant='h6'>
          Assigned Roles
        </Typography>
        <List sx={{ '& .MuiListItemIcon-root': { minWidth: 36 } }} dense={isDesktop}>
          {configuration?.roles?.map((role, i) =>
            <ListItem key={role.roleName} disablePadding>
              <ListItemButton role='checkbox'
                disabled={role.isProtected
                  ? !permissions(Permission.EditPersonUserProtectedRoles)
                  : !permissions(Permission.EditPersonUserStandardRoles)}
                onClick={toggleRoleSelection(role.roleName!)}>
                <ListItemIcon>
                  <Checkbox
                    edge="start" size={isDesktop ? 'small' : 'medium'}
                    checked={selectedRoles.indexOf(role.roleName!) !== -1}
                    tabIndex={-1}
                    disableRipple
                    inputProps={{ 'aria-labelledby': `checkbox-role-${i}` }}
                  />
                </ListItemIcon>
                <ListItemText id={`checkbox-role-${i}`}
                  primary={role.roleName + (role.isProtected ? " (protected role)" : "")} />
              </ListItemButton>
            </ListItem>
          )}
        </List>
      </Grid>
      <Grid item xs={12} sx={{ textAlign: 'right' }}>
        <Button color='secondary' variant='text'
          disabled={!unsavedChanges} sx={{ marginRight: 2 }}
          onClick={revert}>
          Revert
        </Button>
        <Button color='secondary' variant='contained'
          sx={{ marginRight: 2 }}
          onClick={close}>
          Close
        </Button>
        <Button color='primary' variant='contained'
          disabled={!unsavedChanges}
          onClick={save}>
          Save
        </Button>
      </Grid>
    </Grid>
  );
}
