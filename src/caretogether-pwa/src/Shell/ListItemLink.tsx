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
  IconButton,
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
  children?: React.ReactNode;
  isActive?: boolean;
  wrapText?: boolean;
  icon?: React.ReactElement;
  primary: string;
  to?: string;
  subitems?: {
    label: string;
    isActive: boolean;
    onClick: () => void;
  }[];
  defaultOpen?: boolean;
  className?: string;
  paddingLeft?: number;
  collapsed?: boolean;
  darkColor?: boolean;
  buttonProps?: Omit<ListItemButtonProps, 'onClick' | 'selected' | 'sx'> &
    Record<string, unknown>;
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
    collapsed = false,
    darkColor,
    buttonProps,
    children,
    isActive,
    wrapText = false,
  } = props;

  const match = useMatch(to ?? '');
  const selected = isActive ?? !!match;

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
  const submenuId = React.useId();
  React.useEffect(() => {
    if (defaultOpen) setCollapsibleOpen(true);
  }, [defaultOpen]);

  const hasSubitems = !collapsed && Boolean(children || subitems?.length);

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
            selected={selected}
            aria-current={match ? 'page' : undefined}
            aria-label={collapsed ? primary : undefined}
            sx={{
              paddingLeft: collapsed ? 0 : paddingLeft,
              paddingRight: collapsed ? 0 : undefined,
              minHeight: 48,
              flexGrow: 1,
              color,
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
            }}
            {...buttonProps}
          >
            {icon ? (
              <ListItemIcon
                sx={{
                  color,
                  minWidth: collapsed ? 0 : 40,
                  mr: collapsed ? 0 : 1,
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {icon}
              </ListItemIcon>
            ) : null}

            {!collapsed && (
              <TruncatedTooltip title={primary}>
                <ListItemText
                  primary={primary}
                  sx={{
                    color,
                    // Ensure the text container allows truncation
                    minWidth: 0,
                    flex: 1,
                    my: 0,
                    '& .MuiListItemText-primary': {
                      whiteSpace: wrapText ? 'normal' : 'nowrap',
                      overflowWrap: wrapText ? 'anywhere' : undefined,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    },
                  }}
                />
              </TruncatedTooltip>
            )}
          </ListItemButton>

          {hasSubitems && (
            <>
              <Divider orientation="vertical" flexItem />
              <IconButton
                aria-label={`Toggle ${primary}`}
                aria-expanded={collapsibleOpen}
                aria-controls={submenuId}
                onClick={() => setCollapsibleOpen((prev) => !prev)}
                sx={{ mx: 0.5, color: 'inherit' }}
              >
                {collapsibleOpen ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </>
          )}
        </Box>
      </li>
      <Collapse
        id={submenuId}
        in={hasSubitems && collapsibleOpen}
        timeout="auto"
        unmountOnExit
      >
        <List component="div" disablePadding>
          {children}
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
