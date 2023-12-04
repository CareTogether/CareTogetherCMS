import React from 'react';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { useMatch } from 'react-router';
import { Link as RouterLink, LinkProps as RouterLinkProps } from 'react-router-dom';
import { DistributiveOmit } from '@mui/types';
import { OpenInNew } from '@mui/icons-material';

// Reference: https://material-ui.com/guides/composition/

interface ListItemLinkProps {
  icon?: React.ReactElement;
  primary: string;
  to: string;
  newTab?: boolean;
  darkColor?: boolean;
}

function ListItemLink(props: ListItemLinkProps) {
  const { icon, primary, to, newTab, darkColor } = props;

  const match = useMatch({
    path: to
  });

  const renderLink = React.useMemo(
    () =>
      React.forwardRef<any, DistributiveOmit<RouterLinkProps, 'to'>>((itemProps, ref) => (
        <RouterLink to={to} ref={ref} {...itemProps} target={newTab ? "_blank" : undefined} />
      )),
    [to],
  );

  return (
    <li>
      <ListItem button component={renderLink} selected={match !== null}
        sx={{paddingLeft: 1.5, color: darkColor ? '#555' : '#fff8'}}>
        {icon ? <ListItemIcon>{icon}</ListItemIcon> : null}
        <ListItemText primary={primary} sx={{marginLeft: -2}} />
        {newTab && <OpenInNew fontSize='small' sx={{marginLeft: 1}} />}
      </ListItem>
    </li>
  );
}

export { ListItemLink };
