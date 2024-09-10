import {
  Container,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import { useRecoilValueLoadable } from 'recoil';
import {
  locationConfigurationQuery,
  organizationConfigurationQuery,
} from '../Model/ConfigurationModel';
import useScreenTitle from '../Shell/ShellScreenTitle';
import { useDataLoaded } from '../Model/Data';
import { ProgressBackdrop } from '../Shell/ProgressBackdrop';
import { useLoadable } from '../Hooks/useLoadable';
import { PersonName } from '../Families/PersonName';
import { FamilyName } from '../Families/FamilyName';
import { EmojiPeople } from '@mui/icons-material';
import { AppNavigate, useAppNavigate } from '../Hooks/useAppNavigate';
import { QueueItem, queueItemsQuery } from '../Model/QueueModel';

interface InboxMessageProps {
  icon: JSX.Element;
  onClick: () => void;
  primaryContent: JSX.Element;
  secondaryContent?: JSX.Element;
}

function getMessageProps(
  item: QueueItem,
  appNavigate: AppNavigate
): InboxMessageProps {
  switch (item.type) {
    case 'ChildOver18':
      return {
        icon: <EmojiPeople color="error" />,
        onClick: () => appNavigate.family(item.family.family!.id!),
        primaryContent: (
          <>
            <Typography
              variant="body1"
              sx={{ display: 'inline', fontWeight: 'bold' }}
            >
              Child over 18:{' '}
            </Typography>
            <PersonName person={item.child} />
          </>
        ),
        secondaryContent: <FamilyName family={item.family} />,
      };
    case 'MissingPrimaryContact':
      return {
        icon: <EmojiPeople color="error" />,
        onClick: () => appNavigate.family(item.family.family!.id!),
        primaryContent: (
          <Typography
            variant="body1"
            sx={{ display: 'inline', fontWeight: 'bold' }}
          >
            Family missing a primary contact
          </Typography>
        ),
        secondaryContent: <FamilyName family={item.family} />,
      };
  }
}

function InboxMessage({
  icon,
  onClick,
  primaryContent,
  secondaryContent,
}: InboxMessageProps) {
  return (
    <ListItemButton
      disableGutters
      sx={{ paddingTop: 0, paddingBottom: 0 }}
      onClick={onClick}
    >
      <ListItemIcon sx={{ minWidth: 34 }}>{icon}</ListItemIcon>
      <ListItemText primary={primaryContent} secondary={secondaryContent} />
    </ListItemButton>
  );
}

function MessageList() {
  const appNavigate = useAppNavigate();
  const queueItems = useLoadable(queueItemsQuery);

  const messages = queueItems?.map((item) =>
    getMessageProps(item, appNavigate)
  );

  return (
    <List>
      {messages?.map((message, i) => (
        <ListItem key={i} disableGutters>
          <InboxMessage {...message} />
        </ListItem>
      ))}
    </List>
  );
}

export function InboxScreen() {
  const organizationConfiguration = useRecoilValueLoadable(
    organizationConfigurationQuery
  );
  const locationConfiguration = useRecoilValueLoadable(
    locationConfigurationQuery
  );

  const dataLoaded = useDataLoaded();

  useScreenTitle('Inbox');

  return !dataLoaded ||
    (locationConfiguration.state !== 'hasValue' &&
      organizationConfiguration.state !== 'hasValue') ? (
    <ProgressBackdrop>
      <p>Loading messages...</p>
    </ProgressBackdrop>
  ) : (
    <Container maxWidth={false} sx={{ paddingLeft: '12px' }}>
      <MessageList />
    </Container>
  );
}
