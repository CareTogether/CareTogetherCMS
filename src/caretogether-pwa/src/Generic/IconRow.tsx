import { Box } from '@mui/material';

type IconRowProps = {
  icon: string;
  onClick?: () => void;
  children?: React.ReactNode;
};

export const IconRow: React.FC<IconRowProps> = ({
  icon,
  onClick,
  children,
}) => (
  <Box
    style={{ lineHeight: 1, paddingTop: 8, paddingBottom: 8, clear: 'both' }}
    onClick={onClick}
    sx={
      (onClick && {
        '&:hover': { backgroundColor: 'primary.light', cursor: 'pointer' },
      }) ||
      null
    }
  >
    <span style={{ display: 'inline-block', width: 30 }}>{icon}</span>
    {children}
  </Box>
);
