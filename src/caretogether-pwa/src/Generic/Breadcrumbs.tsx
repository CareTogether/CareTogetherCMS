import {
  Breadcrumbs as MuiBreadcrumbs,
  Link as MuiLink,
  Typography,
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  to: string;
  relative?: 'path' | 'route';
}

export interface StandardBreadcrumbsProps {
  items: BreadcrumbItem[];
  currentPageLabel: string;
  sx?: object;
}

export function Breadcrumbs({
  items,
  currentPageLabel,
  sx,
}: StandardBreadcrumbsProps) {
  return (
    <MuiBreadcrumbs
      aria-label="breadcrumb"
      separator={<NavigateNextIcon fontSize="small" />}
      sx={sx}
    >
      {items.map((item, index) => (
        <MuiLink
          key={index}
          component={Link}
          underline="hover"
          color="inherit"
          to={item.to}
          relative={item.relative}
        >
          {item.label}
        </MuiLink>
      ))}

      <Typography color="text.primary">{currentPageLabel}</Typography>
    </MuiBreadcrumbs>
  );
}
