import { useState, memo, useRef, useLayoutEffect } from 'react';
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
  const lineHeight = 1.45;

  useLayoutEffect(() => {
    function updateOverflow() {
      if (!textRef.current) {
        return;
      }

      const element = textRef.current;
      const computedLineHeight = parseFloat(getComputedStyle(element).lineHeight);
      const maxHeight = computedLineHeight * limit;
      setIsOverflowing(element.scrollHeight > maxHeight);
    }

    updateOverflow();

    const observer =
      typeof ResizeObserver === 'undefined'
        ? undefined
        : new ResizeObserver(updateOverflow);

    if (textRef.current) {
      observer?.observe(textRef.current);
    }

    return () => observer?.disconnect();
  }, [text, limit]);

  const textContent = (
    <Typography
      ref={textRef}
      sx={{
        whiteSpace: 'pre-wrap',
        overflowWrap: 'break-word',
        lineHeight,
      }}
    >
      {text}
    </Typography>
  );

  return (
    <Box>
      <Box sx={{ position: 'relative' }}>
        {isOverflowing ? (
          <Collapse in={expanded} collapsedSize={`${limit * lineHeight}em`}>
            {textContent}
          </Collapse>
        ) : (
          textContent
        )}
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
