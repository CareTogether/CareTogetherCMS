import { Badge, Box, ListItemIcon, ListItemText } from '@mui/material';
import CampaignIcon from '@mui/icons-material/Campaign';
import { useGlobalPermissions } from '../Model/SessionModel';
import { Permission } from '../GeneratedClient';
import { useFeaturebaseChangelog } from '../Hooks/useFeaturebaseChangelog';

export default function WhatsNew() {
  const permissions = useGlobalPermissions();
  const hasAccess = permissions(Permission.AccessSupportScreen);

  const unreadCount = useFeaturebaseChangelog();

  if (!hasAccess) return null;

  return (
    <li>
      <button
        data-featurebase-changelog
        style={{
          all: 'unset',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          paddingLeft: '12px',
          paddingRight: '16px',
          height: '40px',
          color: '#fff8',
          borderRadius: '4px',
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)')
        }
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'unset')}
      >
        <ListItemIcon sx={{ color: '#fff8', minWidth: 36 }}>
          <Badge
            color="secondary"
            overlap="rectangular"
            badgeContent={unreadCount > 0 ? unreadCount : null}
          >
            <CampaignIcon />
          </Badge>
        </ListItemIcon>

        <Box
          sx={{ display: 'flex', flex: 1, alignItems: 'center', minWidth: 0 }}
        >
          <ListItemText
            primary="What’s New"
            sx={{
              color: '#fff8',
              '& .MuiListItemText-primary': {
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              },
            }}
          />
        </Box>
      </button>
    </li>
  );
}
