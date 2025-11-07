import React from 'react';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { useMatch } from 'react-router';
import {
  Link as RouterLink,
  LinkProps as RouterLinkProps,
} from 'react-router-dom';
import { DistributiveOmit } from '@mui/types';
import {
  Box,
  Collapse,
  Divider,
  List,
  ListItemButton,
  ListItemButtonProps,
  Tooltip,
} from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';

function TruncatedTooltip({
  children,
  title,
}: {
  children: React.ReactElement;
  title: string;
}) {
  const [showTooltip, setShowTooltip] = React.useState(false);

  const handleMouseEnter = (event: React.MouseEvent<HTMLElement>) => {
    const textElement = event.currentTarget.querySelector(
      '.MuiListItemText-primary'
    ) as HTMLElement;
    if (textElement) {
      setShowTooltip(textElement.offsetWidth < textElement.scrollWidth);
    }
  };

  return (
    <Tooltip title={showTooltip ? title : ''} placement="right" arrow>
      <Box
        onMouseEnter={handleMouseEnter}
        sx={{
          minWidth: 0,
          flex: 1,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {children}
      </Box>
    </Tooltip>
  );
}

interface ListItemLinkCollapsibleProps {
  icon?: React.ReactElement;
  primary: string;
  to?: string;
  onClick?: () => void;
  subitems?: {
    label: string;
    isActive: boolean;
    onClick: () => void;
  }[];
  defaultOpen?: boolean;
  className?: string;
  paddingLeft?: number;
  darkColor?: boolean;
  buttonProps?: Omit<ListItemButtonProps, 'onClick' | 'selected' | 'sx'> &
    Record<string, unknown>;
}

export function ListItemLink(props: ListItemLinkCollapsibleProps) {
  const {
    icon,
    primary,
    to,
    onClick,
    subitems,
    defaultOpen,
    className,
    paddingLeft = 1.5,
    darkColor,
    buttonProps,
  } = props;

  const match = useMatch(to ?? '');
  const selected = !!match;

  const renderLink = React.useMemo(
    () =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      React.forwardRef<any, DistributiveOmit<RouterLinkProps, 'to'>>(
        (itemProps, ref) => (
          <RouterLink to={to ?? ''} ref={ref} {...itemProps} />
        )
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
            component={to ? renderLink : 'button'}
            {...(to ? { to } : {})}
            onClick={onClick}
            selected={selected}
            sx={{
              paddingLeft,
              flexGrow: 1,
              color,
              cursor: onClick ? 'pointer' : 'default',
            }}
            {...buttonProps}
          >
            {icon ? <ListItemIcon sx={{ color }}>{icon}</ListItemIcon> : null}

            <TruncatedTooltip title={primary}>
              <ListItemText
                primary={primary}
                sx={{
                  marginLeft: -2,
                  color,
                  // Ensure the text container allows truncation
                  minWidth: 0,
                  flex: 1,
                  '& .MuiListItemText-primary': {
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  },
                }}
              />
            </TruncatedTooltip>
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
                <TruncatedTooltip title={item.label}>
                  <ListItemText
                    primary={item.label}
                    sx={{
                      marginLeft: 6,
                      color: item.isActive ? '#fff' : '#fff8',
                      // Ensure the text container allows truncation
                      minWidth: 0,
                      flex: 1,
                      '& .MuiListItemText-primary': {
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      },
                    }}
                  />
                </TruncatedTooltip>
              </ListItemButton>
            </li>
          ))}
        </List>
      </Collapse>
    </>
  );
}
