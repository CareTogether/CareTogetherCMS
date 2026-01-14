import { ColoredChip } from '@caretogether/ui-components';
import type { ColoredChipProps } from '@caretogether/ui-components';
import HelpRoundedIcon from '@mui/icons-material/HelpRounded';
import RemoveCircleOutlinedIcon from '@mui/icons-material/RemoveCircleOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeFilledRoundedIcon from '@mui/icons-material/AccessTimeFilledRounded';
import BlockIcon from '@mui/icons-material/Block';
import CircleOutlinedIcon from '@mui/icons-material/CircleOutlined';
import type { ReactElement } from 'react';
import { ProjectStatus } from './chipTypes';
import type { ProjectStatus as ProjectStatusValue } from './chipTypes';
import { useTheme } from '@mui/material';
import type { Theme } from '@mui/material/styles';
import { amber, cyan, green, indigo, red } from '@mui/material/colors';

interface ProjectStatusChipProps extends Pick<ColoredChipProps, 'sx' | 'size' | 'className'> {
  status: ProjectStatusValue;
}

export const ProjectStatusChip = ({ status, sx, size, className }: ProjectStatusChipProps) => {
  const theme = useTheme();
  const config = getProjectStatusConfig(status, theme);
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

interface ProjectStatusConfig {
  label: string;
  icon: ReactElement;
  color: string;
}

function getProjectStatusConfig(status: ProjectStatusValue, theme: Theme): ProjectStatusConfig {
  switch (status) {
    case ProjectStatus.CompletingIntake:
      return {
        label: 'Completing Intake',
        icon: <CircleOutlinedIcon />,
        color: theme.palette.grey[900],
      };
    case ProjectStatus.IntakeInProgress:
      return {
        label: 'Intake In Progress',
        icon: <AccessTimeFilledRoundedIcon />,
        color: amber[700],
      };
    case ProjectStatus.CompletedIntake:
      return {
        label: 'Completed Intake',
        icon: <CheckCircleIcon />,
        color: green[600],
      };
    case ProjectStatus.Optional:
      return {
        label: 'Optional',
        icon: <HelpRoundedIcon />,
        color: indigo[600],
      };
    case ProjectStatus.Exempted:
      return {
        label: 'Exempted',
        icon: <BlockIcon />,
        color: cyan[600],
      };
    case ProjectStatus.Incomplete:
      return {
        label: 'Incomplete',
        icon: <RemoveCircleOutlinedIcon />,
        color: red[600],
      };
    case ProjectStatus.Completed:
      return {
        label: 'Completed',
        icon: <CheckCircleIcon />,
        color: green[600],
      };
    case ProjectStatus.InProgress:
      return {
        label: 'In Progress',
        icon: <AccessTimeFilledRoundedIcon />,
        color: amber[700],
      };
    case ProjectStatus.DaysRemaining:
      return {
        label: 'Days Remaining',
        icon: <AccessTimeFilledRoundedIcon />,
        color: red[600],
      };
  }
}
