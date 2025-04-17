import { Route, Routes } from 'react-router-dom';
import { OpenTicketForm } from './OpenTicketForm';
import { ScheduleCall } from './SchedualeCall';
import { Box } from '@mui/material';

export function Support() {
  return (
    <Routes>
      <Route
        path="*"
        element={
          <Box px={2} py={4}>
            <ScheduleCall />
            <OpenTicketForm />
          </Box>
        }
      />
    </Routes>
  );
}
