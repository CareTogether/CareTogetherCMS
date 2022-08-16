import React from 'react';
import { Backdrop, CircularProgress, Stack, useTheme, Container } from '@mui/material';

interface ProgressBackdropProps {
  children?: React.ReactNode
  open?: boolean
  opaque?: boolean
}
export function ProgressBackdrop({ children, open, opaque }: ProgressBackdropProps) {
  const theme = useTheme();

  return <Backdrop
    sx={opaque
      ? { backgroundColor: theme.palette.primary.main, color: theme.palette.primary.contrastText }
      : undefined}
    // style={{zIndex: 10000}}
    open={ typeof open === 'undefined' ? true : open }>
    <Container sx={{ textAlign: 'center' }}>
      <Stack>
        <CircularProgress color="secondary" sx={{ marginLeft: 'auto', marginRight: 'auto' }} />
        {children}
      </Stack>
    </Container>
  </Backdrop>;
}
