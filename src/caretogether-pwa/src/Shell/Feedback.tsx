import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import { useState } from 'react';

export default function Feedback() {
  const [isHovered, setIsHovered] = useState(false);

  const buttonStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '16px',
    backgroundColor: isHovered ? '#e5e7eb' : '#f3f4f6',
    border: 'none',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    transform: isHovered ? 'scale(1.05)' : 'scale(1)',
  };

  return (
    <button
      id="posthog-feedback-btn"
      style={buttonStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <SentimentSatisfiedAltIcon />
      <span>Feedback</span>
    </button>
  );
}
