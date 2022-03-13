import { Box } from "@mui/material";

type IconRowProps = {
  icon: string,
  interactive?: boolean
}

export const IconRow: React.FC<IconRowProps> = ({
  icon,
  interactive: active,
  children
}) => (
  <Box style={{lineHeight: 1, paddingTop: 8, paddingBottom: 8, clear:'both'}}
    sx={(active && {'&:hover': { backgroundColor: 'primary.light', cursor: 'pointer' }}) || null}>
    <span style={{display: 'inline-block', width: 30}}>{icon}</span>
    {children}
  </Box>
);
