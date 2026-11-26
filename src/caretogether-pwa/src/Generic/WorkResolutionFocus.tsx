import { Box, Typography } from '@mui/material';
import { useEffect, useRef, type ReactNode } from 'react';

export function WorkResolutionFocus({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const frame = requestAnimationFrame(() =>
      ref.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    );
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <Box
      ref={ref}
      sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 0.5 }}
    >
      <Typography variant="caption" className="ph-unmask">
        Dashboard selection
      </Typography>
      {children}
    </Box>
  );
}
