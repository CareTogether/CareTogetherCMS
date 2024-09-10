import { Container, Box, Tabs, Tab } from '@mui/material';
import { useParams } from 'react-router';
import { useState } from 'react';
import useScreenTitle from '../Shell/ShellScreenTitle';
import { ProgressBackdrop } from '../Shell/ProgressBackdrop';
import { useFamilyLookup } from '../Model/DirectoryModel';
import { familyLastName } from './FamilyUtils';
import FamilyScreenPageVersionSwitch from './FamilyScreenPageVersionSwitch';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import NotesIcon from '@mui/icons-material/Notes';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box pt={2}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

export function FamilyScreenV2() {
  const familyIdMaybe = useParams<{ familyId: string }>();
  const familyId = familyIdMaybe.familyId as string;

  const familyLookup = useFamilyLookup();
  const family = familyLookup(familyId)!;

  // const policy = useRecoilValue(policyData);

  // const permissions = useFamilyPermissions(family);

  // const theme = useTheme();
  // const isDesktop = useMediaQuery(theme.breakpoints.up('sm'));
  // const isWideScreen = useMediaQuery(theme.breakpoints.up('xl'));

  useScreenTitle(family ? `${familyLastName(family)} Family` : '...');

  // const appNavigate = useAppNavigate();

  const [currentTab, setCurrentTab] = useState(0);

  return !family ? (
    <ProgressBackdrop>
      <p>Loading family...</p>
    </ProgressBackdrop>
  ) : (
    <Container maxWidth={false} sx={{ paddingLeft: '12px', paddingTop: 3 }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={currentTab}
          onChange={(_, newTab) => setCurrentTab(newTab)}
          aria-label="Family Screen Tabs"
        >
          <Tab icon={<HomeOutlinedIcon />} label="Overview" {...a11yProps(0)} />
          <Tab icon={<NotesIcon />} label="Notes" {...a11yProps(1)} />
          <Tab
            icon={<DescriptionOutlinedIcon />}
            label="Documents"
            {...a11yProps(2)}
          />
          <Tab icon={<TaskAltOutlinedIcon />} label="Tasks" {...a11yProps(3)} />
          <FamilyScreenPageVersionSwitch />
        </Tabs>
      </Box>
      <CustomTabPanel value={currentTab} index={0}>
        Item Zero
      </CustomTabPanel>
      <CustomTabPanel value={currentTab} index={1}>
        Item One
      </CustomTabPanel>
      <CustomTabPanel value={currentTab} index={2}>
        Item Two
      </CustomTabPanel>
      <CustomTabPanel value={currentTab} index={3}>
        Item Three
      </CustomTabPanel>
    </Container>
  );
}
