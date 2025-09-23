import { Chat, SentimentSatisfiedAlt } from '@mui/icons-material';
import { Stack } from '@mui/material';
import Button from '@mui/material/Button';

export default function Feedback() {
  return (
    <Stack spacing={2} alignItems="center">
      <Button
        href="https://caretogether.featurebase.app/"
        target="_blank"
        rel="noopener noreferrer"
        startIcon={<SentimentSatisfiedAlt />}
        sx={{
          textTransform: 'none',
          borderRadius: 10,
          px: 2,
          py: 1,
          backgroundColor: 'grey.100',
          color: 'black',
          boxShadow: 1,
          transition: 'transform 0.2s ease',
          '&:hover': {
            backgroundColor: 'grey.200',
            transform: 'scale(1.05)',
          },
        }}
      >
        <span>Feature requests</span>
      </Button>
      <Button
        onClick={() => {
          if (window.Featurebase) {
            window.Featurebase('showNewMessage');
          }
        }}
        startIcon={<Chat />}
        sx={{
          textTransform: 'none',
          borderRadius: 10,
          px: 2,
          py: 1,
          backgroundColor: 'grey.100',
          color: 'black',
          boxShadow: 1,
          transition: 'transform 0.2s ease',
          '&:hover': {
            backgroundColor: 'grey.200',
            transform: 'scale(1.05)',
          },
        }}
      >
        <span>I have a problem</span>
      </Button>
    </Stack>
  );
}
