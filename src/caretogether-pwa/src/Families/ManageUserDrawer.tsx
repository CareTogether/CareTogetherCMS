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
  useMediaQuery,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Box,
  CircularProgress,
} from '@mui/material';
import { Permission, Person, UserInfo } from '../GeneratedClient';
import {
  useFamilyIdPermissions,
  useGlobalPermissions,
} from '../Model/SessionModel';
import { useBackdrop } from '../Hooks/useBackdrop';
import { useRecoilCallback, useRecoilValue } from 'recoil';
import { personNameString } from './PersonName';
import {
  AccountCircle,
  NoAccounts,
  PersonAdd,
  ContentCopy,
} from '@mui/icons-material';
import { organizationConfigurationQuery } from '../Model/ConfigurationModel';
import { useState } from 'react';
import { api } from '../Api/Api';
import {
  selectedLocationContextState,
  visibleAggregatesState,
} from '../Model/Data';
import { UserLoginInfoDisplay } from './UserLoginInfoDisplay';
import { useGlobalSnackBar } from '../Hooks/useGlobalSnackBar';

interface ManageUserDrawerProps {
  onClose: () => void;
  familyId: string;
  adult: Person;
  user?: UserInfo;
}

export function ManageUserDrawer({
  onClose,
  familyId,
  adult,
  user,
}: ManageUserDrawerProps) {
  const { organizationId, locationId } = useRecoilValue(
    selectedLocationContextState
  );
  const configuration = useRecoilValue(organizationConfigurationQuery);

  const withBackdrop = useBackdrop();

  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviteLinkLoading, setInviteLinkLoading] = useState(false);

  async function generateInviteLink() {
    setInviteLinkLoading(true);

    const inviteLink = await api.users.generatePersonInviteLink(
      organizationId,
      locationId,
      adult.id
    );

    setInviteLinkLoading(false);
    setInviteLink(inviteLink);
  }

  const { setAndShowGlobalSnackBar } = useGlobalSnackBar();

  function copyInviteLink() {
    navigator.clipboard.writeText(String(inviteLink));
    setAndShowGlobalSnackBar('Invite link copied!');
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

  const familyPermissions = useFamilyIdPermissions(familyId);
  const globalPermissions = useGlobalPermissions();

  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('sm'));

  const currentSorted = user?.locationRoles?.slice().sort() || [];
  const rolesChanged =
    selectedRoles.length !== currentSorted.length ||
    selectedRoles
      .slice()
      .sort()
      .some(function (value, index) {
        return value !== currentSorted[index];
      });

  const unsavedChanges = rolesChanged;

  const savePersonRoles = useRecoilCallback(({ set }) => {
    const asyncCallback = async () => {
      const updatedAggregate = await api.users.changePersonRoles(
        organizationId,
        locationId,
        adult.id,
        selectedRoles
      );

      set(visibleAggregatesState, (current) =>
        current.some(
          (currentEntry) =>
            currentEntry.id === updatedAggregate.id &&
            currentEntry.constructor === updatedAggregate.constructor
        )
          ? current.map((currentEntry) =>
            currentEntry.id === updatedAggregate.id &&
              currentEntry.constructor === updatedAggregate.constructor
              ? updatedAggregate
              : currentEntry
          )
          : current.concat(updatedAggregate)
      );
    };
    return asyncCallback;
  });

  function revert() {
    setSelectedRoles(user?.locationRoles ?? []);
  }

  function close() {
    if (
      !unsavedChanges ||
      window.confirm(
        'You have unsaved changes that will be lost. Are you sure?'
      )
    ) {
      onClose();
    }
  }

  async function save() {
    await withBackdrop(async () => {
      if (rolesChanged) {
        await savePersonRoles();
      }
    });
  }

  return (
    <Grid container spacing={2} maxWidth={500}>
      <Grid item xs={12}>
        <h3>Manage User: {personNameString(adult)}</h3>
      </Grid>
      <Grid item xs={12}>
        {user?.userId ? (
          <p style={{ color: theme.palette.info.main }}>
            <Icon color="info" sx={{ verticalAlign: 'sub', marginRight: 1 }}>
              <AccountCircle />
            </Icon>
            User account activated
            {familyPermissions(Permission.ViewPersonUserLoginInfo) &&
              adult.id && <UserLoginInfoDisplay personId={adult.id} />}
          </p>
        ) : (
          <p style={{ color: theme.palette.grey[500] }}>
            <Icon
              color="disabled"
              sx={{ verticalAlign: 'sub', marginRight: 1 }}
            >
              <NoAccounts />
            </Icon>
            Account not yet created
            <Button
              variant="contained"
              color="primary"
              endIcon={<PersonAdd />}
              onClick={generateInviteLink}
              disabled={inviteLinkLoading}
              sx={{ marginLeft: 2 }}
            >
              Invite
            </Button>
          </p>
        )}

        {inviteLinkLoading && (
          <Box
            sx={{
              mb: 3,
              display: 'flex',
              flexFlow: 'column',
              alignItems: 'center',
              opacity: 0,
              animation: 'fadeIn 0.3s ease-in-out 0.2s forwards',
              '@keyframes fadeIn': {
                '0%': { opacity: 0 },
                '100%': { opacity: 1 },
              },
            }}
          >
            <Typography
              align="center"
              gutterBottom
            >
              Generating invite link
            </Typography>
            <CircularProgress />
          </Box>
        )}

        {!inviteLinkLoading && inviteLink && (
          <FormControl sx={{ mt: 2, mb: 3 }} fullWidth variant="outlined">
            <InputLabel htmlFor="invite-link">Invite link</InputLabel>
            <OutlinedInput
              id="invite-link"
              type="text"
              defaultValue={inviteLink}
              onFocus={(event) => event.target.select()}
              readOnly
              endAdornment={
                <InputAdornment position="end">
                  <IconButton
                    aria-label="copy invite link"
                    onClick={copyInviteLink}
                    edge="end"
                  >
                    <ContentCopy />
                  </IconButton>
                </InputAdornment>
              }
              label="Invite link"
            />
          </FormControl>
        )}
        <Divider />
      </Grid>
      <Grid item xs={12}>
        <Typography variant="h6">Assigned Roles</Typography>
        <List
          sx={{ '& .MuiListItemIcon-root': { minWidth: 36 } }}
          dense={isDesktop}
        >
          {configuration?.roles?.map((role, i) => (
            <ListItem key={role.roleName} disablePadding>
              <ListItemButton
                role="checkbox"
                disabled={
                  role.isProtected
                    ? !globalPermissions(
                      Permission.EditPersonUserProtectedRoles
                    )
                    : !globalPermissions(Permission.EditPersonUserStandardRoles)
                }
                onClick={toggleRoleSelection(role.roleName!)}
              >
                <ListItemIcon>
                  <Checkbox
                    edge="start"
                    size={isDesktop ? 'small' : 'medium'}
                    checked={selectedRoles.indexOf(role.roleName!) !== -1}
                    tabIndex={-1}
                    disableRipple
                    inputProps={{ 'aria-labelledby': `checkbox-role-${i}` }}
                  />
                </ListItemIcon>
                <ListItemText
                  id={`checkbox-role-${i}`}
                  primary={
                    role.roleName +
                    (role.isProtected ? ' (protected role)' : '')
                  }
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Grid>
      <Grid item xs={12} sx={{ textAlign: 'right' }}>
        <Button
          color="secondary"
          variant="text"
          disabled={!unsavedChanges}
          sx={{ marginRight: 2 }}
          onClick={revert}
        >
          Revert
        </Button>
        <Button
          color="secondary"
          variant="contained"
          sx={{ marginRight: 2 }}
          onClick={close}
        >
          Close
        </Button>
        <Button
          color="primary"
          variant="contained"
          disabled={!unsavedChanges}
          onClick={save}
        >
          Save
        </Button>
      </Grid>
    </Grid>
  );
}
