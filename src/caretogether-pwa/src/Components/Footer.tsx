import { makeStyles } from '@material-ui/core/styles';
import { BottomNavigation, BottomNavigationAction } from '@material-ui/core';
import { Link, useLocation, withRouter } from 'react-router-dom';
import PermPhoneMsgIcon from '@material-ui/icons/PermPhoneMsg';
import PeopleIcon from '@material-ui/icons/People';
import { useFeatureFlags } from '../Model/ConfigurationModel';
//import DashboardIcon from '@material-ui/icons/Dashboard';

const useStyles = makeStyles((theme) => ({
  stickToBottom: {
    width: '100%',
    position: 'fixed',
    bottom: 0,
    backgroundColor: theme.palette.grey[300]
  },
}));

function Footer(props: any) {
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

export default withRouter(Footer);
