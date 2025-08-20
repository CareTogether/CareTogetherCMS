import React from 'react';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { useMatch } from 'react-router';
import {
  Link as RouterLink,
  LinkProps as RouterLinkProps,
} from 'react-router-dom';
import { DistributiveOmit } from '@mui/types';
import { Box, Collapse, Divider, List, ListItemButton } from '@mui/material';
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
  paddingLeft?: number;
  darkColor?: boolean;
}

export function ListItemLink(props: ListItemLinkCollapsibleProps) {
  const {
    icon,
    primary,
    to,
    subitems,
    defaultOpen,
    className,
    paddingLeft = 1.5,
    darkColor,
  } = props;

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

  const hasSubitems = subitems && subitems.length > 0;

  // TODO: Those names are a bit confusing, we should rename them
  const desktopColor = selected ? '#fff' : '#fff8';
  const mobileColor = '#555';
  const color = darkColor ? mobileColor : desktopColor;

  return (
    <>
      <li className={className}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <ListItemButton
            component={renderLink}
            selected={selected}
            sx={{
              paddingLeft,
              flexGrow: 1,
              color,
            }}
          >
            {icon ? <ListItemIcon sx={{ color }}>{icon}</ListItemIcon> : null}

            <ListItemText primary={primary} sx={{ marginLeft: -2, color }} />
          </ListItemButton>

          {hasSubitems && (
            <>
              <Divider orientation="vertical" flexItem />
              <Box
                onClick={() => setCollapsibleOpen((prev) => !prev)}
                sx={{ px: 1.5, cursor: 'pointer' }}
              >
                {collapsibleOpen ? <ExpandLess /> : <ExpandMore />}
              </Box>
            </>
          )}
        </Box>
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
                sx={{ paddingLeft: 1.5 }}
                onClick={item.onClick}
              >
                {/* {icon ? <ListItemIcon>{icon}</ListItemIcon> : null} */}
                <ListItemText
                  primary={item.label}
                  sx={{
                    marginLeft: 6,
                    color: item.isActive ? '#fff' : '#fff8',
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
