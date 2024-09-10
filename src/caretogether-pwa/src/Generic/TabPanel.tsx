import { Box } from '@mui/material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
  padding?: number;
}
export function TabPanel(props: TabPanelProps) {
  const { children, value, index, padding } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`full-width-tabpanel-${index}`}
      aria-labelledby={`full-width-tab-${index}`}
    >
      {value === index && (
        <Box sx={{ padding: typeof padding === 'undefined' ? 3 : padding }}>
          {children}
        </Box>
      )}
    </div>
  );
}
// eslint-disable-next-line react-refresh/only-export-components
export function a11yProps(index: number) {
  return {
    id: `full-width-tab-${index}`,
    'aria-controls': `full-width-tabpanel-${index}`,
  };
}
