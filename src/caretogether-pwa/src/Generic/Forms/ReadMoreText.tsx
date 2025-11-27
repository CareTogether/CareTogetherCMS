import { useState, memo, useRef, useEffect } from 'react';
import { Box, Button, Typography, Collapse } from '@mui/material';

type ReadMoreTextProps = {
  text: string;
  limit?: number;
};

export const ReadMoreText = memo(function ReadMoreText({
  text,
  limit = 5,
}: ReadMoreTextProps) {
  const [expanded, setExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if content is overflowing by temporarily rendering without clamp
    if (textRef.current && !expanded) {
      const element = textRef.current;
      // Check if content would overflow with the line clamp
      const lineHeight = parseFloat(getComputedStyle(element).lineHeight);
      const maxHeight = lineHeight * limit;
      setIsOverflowing(element.scrollHeight > maxHeight);
    }
  }, [text, limit, expanded]);

  return (
    <Box>
      <Box sx={{ position: 'relative' }}>
        <Collapse in={expanded} collapsedSize={`${limit * 1.45 * 1.5}em`}>
          <Typography
            ref={textRef}
            sx={{
              whiteSpace: 'pre-wrap',
              overflowWrap: 'break-word',
              lineHeight: 1.45,
            }}
          >
            {text}
          </Typography>
        </Collapse>
        {!expanded && isOverflowing && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '3em',
              background: 'linear-gradient(to bottom, transparent, white)',
              pointerEvents: 'none',
            }}
          />
        )}
      </Box>

      {isOverflowing && (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Button
            onClick={() => setExpanded((prev) => !prev)}
            size="small"
            variant="text"
            sx={{ mt: 0.5, p: 0, textTransform: 'none' }}
          >
            {expanded ? 'Show Less' : 'Show More'}
          </Button>
        </Box>
      )}
    </Box>
  );
});
