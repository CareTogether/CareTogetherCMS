import { Drawer, Stack, useTheme } from '@mui/material';

interface ShellSideNavigationProps {
  open: boolean;
  width: number;
}
export function ShellSideNavigation({ open, width }: ShellSideNavigationProps) {
  const theme = useTheme();

  return (
    <Drawer variant='permanent' open={open}
      sx={{
        width: width,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        boxSizing: 'border-box',
        overflowX: 'hidden',
        '& .MuiDrawer-paper': {
          backgroundColor: theme.palette.primary.dark,
          color: theme.palette.primary.contrastText
        }
      }}>
      <Stack sx={{ width: width, paddingTop: { xs: 7, sm: 8, md: 6 } }}>
        <p>Hello!</p>
      </Stack>
    </Drawer>
  );
}
