import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Grid,
  Typography,
} from '@mui/material';
import { ProgressBackdrop } from '../Shell/ProgressBackdrop';
import useScreenTitle from '../Shell/ShellScreenTitle';
import { useDataLoaded } from '../Model/Data';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { useAppNavigate } from '../Hooks/useAppNavigate';

export function SettingsScreen() {
  useScreenTitle('Settings');
  const dataLoaded = useDataLoaded();
  const appNavigate = useAppNavigate();

  if (!dataLoaded) {
    return (
      <ProgressBackdrop>
        <p>Loading settings...</p>
      </ProgressBackdrop>
    );
  }

  return (
    <Box
      className="ph-unmask"
      sx={{ paddingTop: 4, display: 'flex', justifyContent: 'center' }}
    >
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <Card variant="outlined">
            <CardActionArea onClick={() => appNavigate.settingsRoles()}>
              <CardContent sx={{ textAlign: 'center' }}>
                <AssignmentIndIcon
                  sx={{ fontSize: 30, color: 'primary.main' }}
                />

                <Typography variant="h6">Roles</Typography>
                <Typography variant="body2" color="text.secondary">
                  Configure role definitions for your Staff, Volunteers, and
                  others. Define what each role is able to view and edit.
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card variant="outlined">
            <CardActionArea onClick={() => appNavigate.settingsLocations()}>
              <CardContent sx={{ textAlign: 'center' }}>
                <LocationOnIcon sx={{ fontSize: 30, color: 'primary.main' }} />

                <Typography variant="h6">Locations</Typography>
                <Typography variant="body2" color="text.secondary">
                  Manage your locations, configure approval and arrangement
                  policies, and set up custom fields for family and Cases.
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
