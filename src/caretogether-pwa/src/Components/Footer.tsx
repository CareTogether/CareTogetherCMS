import makeStyles from '@mui/styles/makeStyles';
import { BottomNavigation, BottomNavigationAction } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import PermPhoneMsgIcon from '@mui/icons-material/PermPhoneMsg';
import PeopleIcon from '@mui/icons-material/People';
import { useFeatureFlags } from '../Model/ConfigurationModel';
//import DashboardIcon from '@mui/icons-material/Dashboard';

const useStyles = makeStyles((theme) => ({
  stickToBottom: {
    width: '100%',
    position: 'fixed',
    bottom: 0,
    backgroundColor: theme.palette.grey[300]
  },
}));

export function Footer(props: any) {
  const location = useLocation();
  const classes = useStyles();
  
  const featureFlags = useFeatureFlags();

  const links = [/*'/dashboard',*/ '/referrals', '/volunteers'];
  const selectedLink = links.findIndex(link => location.pathname.startsWith(link));

  return (
    <BottomNavigation
      value={selectedLink}
      showLabels
      className={classes.stickToBottom}
    >
      {/* <BottomNavigationAction component={Link} to='/dashboard' label="Dashboard" icon={<DashboardIcon />} /> */}
      {featureFlags.viewReferrals && <BottomNavigationAction component={Link} to='/referrals' label="Referrals" icon={<PermPhoneMsgIcon />} />}
      <BottomNavigationAction component={Link} to='/volunteers' label="Volunteers" icon={<PeopleIcon />} />
    </BottomNavigation>
  );
}
