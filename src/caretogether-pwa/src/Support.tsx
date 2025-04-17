import { Route, Routes } from 'react-router-dom';
import { OpenTicketForm } from './OpenTicketForm';
import { ScheduleCall } from './ScheduleCall';
import { Box, Grid } from '@mui/material';

export function Support() {
  return (
    <Routes>
      <Route
        path="*"
        element={
          <Box px={2} py={4}>
            <Grid container spacing={4}>
              <Grid item xs={12} lg={4}>
                <ScheduleCall />
              </Grid>
              <Grid item xs={12} lg={8}>
                <OpenTicketForm />
              </Grid>
            </Grid>
          </Box>
        }
      />
    </Routes>
  );
}
