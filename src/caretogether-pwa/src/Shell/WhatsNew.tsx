import { Campaign as CampaignIcon } from '@mui/icons-material';
import { Badge } from '@mui/material';
import { useGlobalPermissionsLoadable } from '../Model/SessionModel';
import { Permission } from '../GeneratedClient';
import { ListItemLink } from './ListItemLink';
import { useAtomValue } from 'jotai';
import { changelogUnreadCountState } from '../Hooks/useFeaturebase';

interface WhatsNewProps {
  collapsed?: boolean;
}

export default function WhatsNew({ collapsed }: WhatsNewProps) {
  const permissions = useGlobalPermissionsLoadable();
  const hasAccess = permissions(Permission.AccessSupportScreen);

  const unreadCount = useAtomValue(changelogUnreadCountState);

  if (!hasAccess) return null;

  return (
    <ListItemLink
      className="ph-unmask"
      primary="What's New"
      collapsed={collapsed}
      icon={
        <Badge badgeContent={unreadCount} color="secondary">
          <CampaignIcon />
        </Badge>
      }
      buttonProps={{
        'data-featurebase-changelog': true,
      }}
    />
  );
}
