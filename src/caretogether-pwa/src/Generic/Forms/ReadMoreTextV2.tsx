import { useState, memo, useRef, useEffect } from 'react';
import { Box, Button, Collapse, Typography } from '@mui/material';

type ReadMoreTextV2Props = {
  text: string;
  limit?: number;
};

export const ReadMoreTextV2 = memo(function ReadMoreTextV2({
  text,
  limit = 5,
}: ReadMoreTextV2Props) {
  const [expanded, setExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);
  const textSx = {
    whiteSpace: 'pre-wrap',
    overflowWrap: 'break-word',
    lineHeight: 1.45,
  };

  useEffect(() => {
    if (textRef.current && !expanded) {
      const element = textRef.current;
      const lineHeight = parseFloat(getComputedStyle(element).lineHeight);
      const maxHeight = lineHeight * limit;
      setIsOverflowing(element.scrollHeight > maxHeight);
    }
  }, [text, limit, expanded]);

  return (
    <Box>
      <Box sx={{ position: 'relative' }}>
        {isOverflowing ? (
          <Collapse in={expanded} collapsedSize={`${limit * 1.45}em`}>
            <Typography ref={textRef} sx={textSx}>
              {text}
            </Typography>
          </Collapse>
        ) : (
          <Typography ref={textRef} sx={textSx}>
            {text}
          </Typography>
        )}
        {!expanded && isOverflowing && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '3em',
              background: (theme) =>
                `linear-gradient(to bottom, transparent, ${theme.palette.background.paper})`,
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
