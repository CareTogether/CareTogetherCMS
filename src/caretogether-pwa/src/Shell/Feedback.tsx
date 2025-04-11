import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import Button from '@mui/material/Button';

export default function Feedback() {
  return (
    <Button
      id="posthog-feedback-btn"
      startIcon={<SentimentSatisfiedAltIcon />}
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
      <span>Feedback</span>
    </Button>
  );
}
