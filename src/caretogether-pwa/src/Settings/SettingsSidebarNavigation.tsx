import SettingsIcon from '@mui/icons-material/Settings';
import { useLocation } from 'react-router-dom';
import { ListItemLink } from '../Shell/ListItemLink';
import { useSelectedLocationContext } from '../Model/Data';
import { useGlobalPermissionsLoadable } from '../Model/SessionModel';
import { Permission } from '../GeneratedClient';
import {
  settingsCategories,
  settingsCategoryPath,
  isSettingsCategoryActive,
} from './settingsSections';

export function SettingsSidebarNavigation({
  collapsed,
}: {
  collapsed: boolean;
}) {
  const route = useLocation();
  const context = useSelectedLocationContext();
  const permissions = useGlobalPermissionsLoadable();
  if (!context || !permissions(Permission.AccessSettingsScreen)) return null;
  const base = `/org/${context.organizationId}/${context.locationId}/settings`;
  return (
    <ListItemLink
      className="ph-unmask"
      to={base}
      buttonProps={{ role: 'link' }}
      primary="Settings"
      icon={<SettingsIcon sx={{ color: '#fff8' }} />}
      collapsed={collapsed}
      defaultOpen={route.pathname.startsWith(base)}
      isActive={route.pathname.startsWith(base)}
    >
      {settingsCategories.map((category) => {
        const path = settingsCategoryPath(
          context.organizationId,
          context.locationId,
          category.id
        );
        const active = isSettingsCategoryActive(route.pathname, category.id);
        return (
          <ListItemLink
            key={category.id}
            primary={category.label}
            to={path}
            buttonProps={{
              role: 'link',
              'aria-current': active
                ? route.pathname.replace(/\/+$/, '') === path
                  ? 'page'
                  : 'location'
                : undefined,
            }}
            paddingLeft={3}
            isActive={active}
            wrapText
          />
        );
      })}
    </ListItemLink>
  );
}
