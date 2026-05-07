import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import {
  Logout as LogoutIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useRecoilRefresher_UNSTABLE } from 'recoil';
import { logoutAsync } from '../Authentication/Auth';
import { userOrganizationAccessQuery } from '../Model/Data';

export function NoOrganizationAccessScreen() {
  const refreshUserOrganizationAccess = useRecoilRefresher_UNSTABLE(
    userOrganizationAccessQuery
  );

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 6, sm: 10 } }}>
      <Paper variant="outlined" sx={{ p: { xs: 3, sm: 5 } }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              No organization access yet
            </Typography>
            <Typography color="text.secondary">
              You're signed in, but this account is not connected to a
              CareTogether organization or location yet.
            </Typography>
          </Box>

          <Typography color="text.secondary">
            Ask your CareTogether administrator to send or resend your invite.
            If you already have an invite, open that link from this browser and
            accept it to finish connecting your account.
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={refreshUserOrganizationAccess}
            >
              Check Again
            </Button>
            <Button
              variant="text"
              color="inherit"
              startIcon={<LogoutIcon />}
              onClick={() => logoutAsync()}
            >
              Log Out
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Container>
  );
}
