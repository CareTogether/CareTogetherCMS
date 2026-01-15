import { List } from '@mui/material';
import {
  Dashboard as DashboardIcon,
  FamilyRestroom as FamilyRestroomIcon,
  VolunteerActivism as VolunteerActivismIcon,
  Diversity3 as Diversity3Icon,
  Settings as SettingsIcon,
  Help as HelpIcon,
} from '@mui/icons-material';
import { NavItem } from '@caretogether/ui-components';

interface AppSidebarProps {
  collapsed: boolean;
}

export function AppSidebar({ collapsed }: AppSidebarProps) {
  return (
    <List sx={{ pt: 2 }}>
      <NavItem
        icon={<DashboardIcon />}
        text="Dashboard"
        collapsed={collapsed}
        onClick={() => console.log('Navigate to Dashboard')}
      />
      <NavItem
        icon={<FamilyRestroomIcon />}
        text="Referrals"
        collapsed={collapsed}
        onClick={() => console.log('Navigate to Referrals')}
      />
      <NavItem
        icon={<VolunteerActivismIcon />}
        text="Volunteers"
        collapsed={collapsed}
        onClick={() => console.log('Navigate to Volunteers')}
      />
      <NavItem
        icon={<Diversity3Icon />}
        text="Communities"
        collapsed={collapsed}
        onClick={() => console.log('Navigate to Communities')}
      />
      <NavItem
        icon={<SettingsIcon />}
        text="Settings"
        collapsed={collapsed}
        onClick={() => console.log('Navigate to Settings')}
      />
      <NavItem
        icon={<HelpIcon />}
        text="Support"
        collapsed={collapsed}
        onClick={() => console.log('Navigate to Support')}
      />
    </List>
  );
}
