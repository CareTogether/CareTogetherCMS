import { ColoredChip } from '@caretogether/ui-components';
import type { ColoredChipProps } from '@caretogether/ui-components';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import HomeIcon from '@mui/icons-material/Home';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircle';
import type { ReactElement } from 'react';
import { LocationStatus } from './chipTypes';
import type { LocationStatus as LocationStatusValue } from './chipTypes';
import { indigo } from '@mui/material/colors';

interface LocationStatusChipProps extends Pick<ColoredChipProps, 'sx' | 'size' | 'className'> {
  locationStatus: LocationStatusValue;
}

export const LocationStatusChip = ({
  locationStatus,
  sx,
  size,
  className,
}: LocationStatusChipProps) => {
  const config = getLocationStatusConfig(locationStatus);
  return (
    <ColoredChip
      label={config.label}
      startIcon={config.icon}
      color={config.color}
      size={size}
      sx={sx}
      className={className}
    />
  );
};

interface LocationStatusConfig {
  label: string;
  icon: ReactElement;
  color: string;
}

function getLocationStatusConfig(locationStatus: LocationStatusValue): LocationStatusConfig {
  switch (locationStatus) {
    case LocationStatus.LocationSpecified:
      return {
        label: 'Location Specified',
        icon: <HelpOutlineIcon />,
        color: indigo[600],
      };
    case LocationStatus.Family:
      return {
        label: 'Family',
        icon: <HomeIcon />,
        color: 'primary',
      };
    case LocationStatus.LocationUnspecified:
      return {
        label: 'Location Unspecified',
        icon: <RemoveCircleOutlineIcon />,
        color: 'error',
      };
  }
}
