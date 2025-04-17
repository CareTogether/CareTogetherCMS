import { Route, Routes } from 'react-router-dom';
import { OpenTicketForm } from './OpenTicketForm';
import { ScheduleCall } from './SchedualeCall';
import { Box, Grid, Typography } from '@mui/material';

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
                <Typography variant="h6" gutterBottom>
                  Need help with something specific? Submit a support feedback,
                  and our team will get back to you as soon as possible.
                </Typography>
                <OpenTicketForm />
              </Grid>
            </Grid>
          </Box>
        }
      />
    </Routes>
  );
}
