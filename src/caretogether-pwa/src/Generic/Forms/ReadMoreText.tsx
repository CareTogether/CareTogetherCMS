import { useState, memo } from 'react';
import { Box, Button } from '@mui/material';

type ReadMoreTextProps = {
  text: string;
  limit?: number;
};

export const ReadMoreText = memo(function ReadMoreText({
  text,
  limit = 350,
}: ReadMoreTextProps) {
  const [expanded, setExpanded] = useState(false);

  const safeText = text ?? '';

  const isLong = safeText.length > limit;
  const visibleText = expanded ? safeText : safeText.slice(0, limit);

  return (
    <Box
      sx={{
        whiteSpace: 'pre-wrap',
        overflowWrap: 'break-word',
        lineHeight: 1.45,
      }}
    >
      {visibleText}
      {!expanded && isLong ? '...' : ''}

      {isLong && (
        <Button
          onClick={() => setExpanded((prev) => !prev)}
          size="small"
          variant="text"
          sx={{ mt: 0.5, p: 0, textTransform: 'none' }}
        >
          {expanded ? 'Show Less' : 'Show More'}
        </Button>
      )}
    </Box>
  );
});
