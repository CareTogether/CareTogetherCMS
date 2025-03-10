import { useRecoilValue } from 'recoil';
import { queueItemsQuery } from '../../../src/Model/QueueModel';
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import EmojiPeopleOutlinedIcon from '@mui/icons-material/EmojiPeopleOutlined';
import { FamilyName } from '../../Families/FamilyName';

export function ChildLocationAlert() {
  const queueItems = useRecoilValue(queueItemsQuery);

  const childNotReturnedAlerts = queueItems.filter(
    (item) => item.type === 'ChildNotReturned'
  );

  if (childNotReturnedAlerts.length === 0) return null;
  return (
    <List>
      {childNotReturnedAlerts.map((alert, i) => (
        <ListItem key={`child-alert-${i}`} disableGutters>
          <ListItemIcon sx={{ minWidth: 34 }}>
            <EmojiPeopleOutlinedIcon sx={{ color: 'red' }} />
          </ListItemIcon>
          <ListItemText
            primary={
              <Typography
                variant="body1"
                sx={{ fontWeight: 'bold', color: 'black' }}
              >
                Child not returned to parent: {alert.child.firstName}{' '}
                {alert.child.lastName}
              </Typography>
            }
            secondary={
              <Typography variant="body2" sx={{ color: 'black' }}>
                <FamilyName family={alert.family} />
              </Typography>
            }
          />
        </ListItem>
      ))}
    </List>
  );
}
