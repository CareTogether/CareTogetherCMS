import { Box, Button, Typography } from '@mui/material';

export function ScheduleCall() {
  return (
    <Box mb={4}>
      <Typography variant="h6" gutterBottom>
        Book time with the CareTogether team
      </Typography>
      <Typography variant="body1" paragraph>
        Need help or have questions about using CareTogether? Schedule a meeting
        during our Office Hours to speak directly with our team.
      </Typography>
      <Button
        variant="contained"
        color="primary"
        href="https://support.caretogether.io/"
        target="_blank"
        rel="noopener noreferrer"
      >
        Schedule a Call
      </Button>
    </Box>
  );
}
