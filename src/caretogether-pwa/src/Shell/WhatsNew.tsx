import { Badge } from '@mui/material';
import CampaignIcon from '@mui/icons-material/Campaign';
import { useGlobalPermissions } from '../Model/SessionModel';
import { Permission } from '../GeneratedClient';
import { ListItemLink } from './ListItemLink';
import { useRecoilValue } from 'recoil';
import { changelogUnreadCountState } from '../Hooks/useFeaturebase';

export default function WhatsNew() {
  const permissions = useGlobalPermissions();
  const hasAccess = permissions(Permission.AccessSupportScreen);

  const unreadCount = useRecoilValue(changelogUnreadCountState);

  if (!hasAccess) return null;

  return (
    <ListItemLink
      className="ph-unmask"
      primary="What's New"
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
