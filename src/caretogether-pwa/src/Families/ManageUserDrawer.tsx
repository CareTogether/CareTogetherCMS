import {
  Grid,
  Button
} from "@mui/material";
import { Person, UserInfo } from "../GeneratedClient";
import { currentLocationQuery, currentOrganizationIdQuery, usersClientQuery } from "../Model/SessionModel";
import { useBackdrop } from "../Hooks/useBackdrop";
import { useRecoilValue } from "recoil";
import { personNameString } from "./PersonName";

interface ManageUserDrawerProps {
  onClose: () => void;
  adult: Person;
  user?: UserInfo;
}
export function ManageUserDrawer({ onClose, adult, user }: ManageUserDrawerProps) {
  const usersClient = useRecoilValue(usersClientQuery);

  const organizationId = useRecoilValue(currentOrganizationIdQuery);
  const location = useRecoilValue(currentLocationQuery);

  const withBackdrop = useBackdrop();

  async function invitePersonUser(adult: Person) {
    await withBackdrop(async () => {
      const inviteLink = await usersClient.generatePersonInviteLink(
        organizationId, location.locationId, adult.id);
      await navigator.clipboard.writeText(inviteLink);
      alert(`The invite link for ${personNameString(adult)} has been copied to your clipboard.`);
    });
  }

  return (
    <Grid container spacing={2} maxWidth={500}>
      <Grid item xs={12}>
        <h3>
          Manage User
        </h3>
      </Grid>
      {/* TODO: Invite button/user-invite-accepted status! */}
      {/* TODO: Roles!! */}
      {/* TODO: **Default** roles configuration?! - how to implement... */}
      {/* <Grid item xs={12}>
              <TextField type='text' fullWidth required
                label="Name"
                placeholder="Enter a name for the community"
                error={name.length === 0}
                value={name} onChange={e => setName(e.target.value)} />
            </Grid>
            <Grid item xs={12}>
              <TextField type='text' fullWidth multiline minRows={4}
                label="Description"
                placeholder="Provide a description for the community"
                value={description} onChange={e => setDescription(e.target.value)} />
            </Grid> */}
      <Grid item xs={12} sx={{ textAlign: 'right' }}>
        <Button color='secondary' variant='contained'
          sx={{ marginRight: 2 }}
          onClick={onClose}>
          Close
        </Button>
        {/* <Button color='primary' variant='contained'
              disabled={(community && name === community.name && description === community.description) ||
                name.length === 0}
              onClick={save}>
              Save
            </Button> */}
      </Grid>
    </Grid>
  );
}
