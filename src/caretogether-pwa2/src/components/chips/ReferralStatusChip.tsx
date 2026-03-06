import { ColoredChip } from '@caretogether/ui-components';
import type { ColoredChipProps } from '@caretogether/ui-components';
import CircleOutlinedIcon from '@mui/icons-material/CircleOutlined';
import AccessTimeFilledRoundedIcon from '@mui/icons-material/AccessTimeFilledRounded';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import type { ReactElement } from 'react';
import { ReferralStatus } from './chipTypes';
import type { ReferralStatus as ReferralStatusValue } from './chipTypes';
import { useTheme } from '@mui/material';
import type { Theme } from '@mui/material/styles';
import { amber, green, red } from '@mui/material/colors';

interface ReferralStatusChipProps extends Pick<ColoredChipProps, 'sx' | 'size' | 'className'> {
  status: ReferralStatusValue;
}

export const ReferralStatusChip = ({ status, sx, size, className }: ReferralStatusChipProps) => {
  const theme = useTheme();
  const config = getReferralStatusConfig(status, theme);
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

interface ReferralStatusConfig {
  label: string;
  icon?: ReactElement;
  color: string;
}

function getReferralStatusConfig(status: ReferralStatusValue, theme: Theme): ReferralStatusConfig {
  switch (status) {
    case ReferralStatus.Pending:
      return {
        label: 'Pending',
        icon: <CircleOutlinedIcon />,
        color: theme.palette.grey[900],
      };
    case ReferralStatus.InProgress:
      return {
        label: 'In Progress',
        icon: <AccessTimeFilledRoundedIcon />,
        color: amber[700],
      };
    case ReferralStatus.Completed:
      return {
        label: 'Completed',
        icon: <CheckCircleIcon />,
        color: green[600],
      };
    case ReferralStatus.Hosting:
      return {
        label: 'Hosting',
        color: red[600],
      };
  }
}
