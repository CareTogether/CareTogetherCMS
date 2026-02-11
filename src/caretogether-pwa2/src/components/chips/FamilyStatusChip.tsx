import { ColoredChip } from '@caretogether/ui-components';
import type { ColoredChipProps } from '@caretogether/ui-components';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import CloseIcon from '@mui/icons-material/Close';
import type { ReactElement } from 'react';
import { FamilyStatus } from './chipTypes';
import type { FamilyStatus as FamilyStatusValue } from './chipTypes';
import { amber, green, red } from '@mui/material/colors';

interface FamilyStatusChipProps extends Pick<ColoredChipProps, 'sx' | 'size' | 'className'> {
  status: FamilyStatusValue;
}

export const FamilyStatusChip = ({ status, sx, size, className }: FamilyStatusChipProps) => {
  const config = getFamilyStatusConfig(status);
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

interface FamilyStatusConfig {
  label: string;
  icon: ReactElement;
  color: string;
}

function getFamilyStatusConfig(status: FamilyStatusValue): FamilyStatusConfig {
  switch (status) {
    case FamilyStatus.Completed:
      return {
        label: 'Completed',
        icon: <CheckCircleIcon />,
        color: green[600],
      };
    case FamilyStatus.Warning:
      return {
        label: 'Warning',
        icon: <WarningIcon />,
        color: amber[700],
      };
    case FamilyStatus.Incomplete:
      return {
        label: 'Incomplete',
        icon: <CloseIcon />,
        color: red[600],
      };
  }
}
