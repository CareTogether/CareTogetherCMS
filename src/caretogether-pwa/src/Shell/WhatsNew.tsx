import { Badge } from '@mui/material';
import CampaignIcon from '@mui/icons-material/Campaign';
import { useGlobalPermissions } from '../Model/SessionModel';
import { Permission } from '../GeneratedClient';
import { useFeaturebaseChangelog } from '../Hooks/useFeaturebaseChangelog';
import { ListItemLink } from './ListItemLink';

export default function WhatsNew() {
  const permissions = useGlobalPermissions();
  const hasAccess = permissions(Permission.AccessSupportScreen);

  const unreadCount = useFeaturebaseChangelog();

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
