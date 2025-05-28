import React from 'react';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { useMatch } from 'react-router';
import {
  Link as RouterLink,
  LinkProps as RouterLinkProps,
} from 'react-router-dom';
import { DistributiveOmit } from '@mui/types';
import { Collapse, List, ListItemButton } from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';

interface ListItemLinkCollapsibleProps {
  icon?: React.ReactElement;
  primary: string;
  to: string;
  subitems?: {
    label: string;
    isActive: boolean;
    onClick: () => void;
  }[];
  defaultOpen?: boolean;
  className?: string;
}

export function ListItemLinkCollapsible(props: ListItemLinkCollapsibleProps) {
  const { icon, primary, to, subitems, defaultOpen } = props;

  const selected =
    useMatch({
      path: to,
    }) !== null;

  const renderLink = React.useMemo(
    () =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      React.forwardRef<any, DistributiveOmit<RouterLinkProps, 'to'>>(
        (itemProps, ref) => <RouterLink to={to} ref={ref} {...itemProps} />
      ),
    [to]
  );

  const [collapsibleOpen, setCollapsibleOpen] = React.useState(
    defaultOpen || false
  );

  const collapseIcon = collapsibleOpen ? <ExpandLess /> : <ExpandMore />;

  const hasSubitems = subitems && subitems.length > 0;

  return (
    <>
      <li className={props.className}>
        <ListItemButton
          component={renderLink}
          onClick={() => selected && setCollapsibleOpen(!collapsibleOpen)}
          selected={selected}
          sx={{ paddingLeft: 1.5 }}
        >
          {icon ? <ListItemIcon>{icon}</ListItemIcon> : null}

          <ListItemText
            primary={primary}
            sx={{ marginLeft: -2, color: selected ? '#fff' : '#fff8' }}
          />

          {hasSubitems && collapseIcon}
        </ListItemButton>
      </li>

      <Collapse
        in={hasSubitems && collapsibleOpen}
        timeout="auto"
        unmountOnExit
      >
        <List component="div" disablePadding>
          {subitems?.map((item) => (
            <li className="ph-unmask" key={item.label}>
              <ListItemButton
                selected={item.isActive}
                sx={{ paddingLeft: 1.5, color: '#fff8' }}
                onClick={item.onClick}
              >
                {/* {icon ? <ListItemIcon>{icon}</ListItemIcon> : null} */}
                <ListItemText
                  primary={item.label}
                  sx={{
                    marginLeft: 6,
                    color: item.isActive ? '#fff' : undefined,
                  }}
                />
              </ListItemButton>
            </li>
          ))}
        </List>
      </Collapse>
    </>
  );
}
