import { ColoredChip } from '@caretogether/ui-components';
import type { ColoredChipProps } from '@caretogether/ui-components';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import BrightnessIcon from '@mui/icons-material/Brightness6Sharp';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import WorkIcon from '@mui/icons-material/Work';
import type { ReactElement } from 'react';
import { FamilyType } from './chipTypes';
import type { FamilyType as FamilyTypeValue } from './chipTypes';
import { amber, green, lightBlue, purple } from '@mui/material/colors';

interface FamilyTypeChipProps extends Pick<ColoredChipProps, 'sx' | 'size' | 'className'> {
  familyType: FamilyTypeValue;
}

export const FamilyTypeChip = ({ familyType, sx, size, className }: FamilyTypeChipProps) => {
  const config = getFamilyTypeConfig(familyType);
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

interface FamilyTypeConfig {
  label: string;
  icon: ReactElement;
  color: string;
}

function getFamilyTypeConfig(familyType: FamilyTypeValue): FamilyTypeConfig {
  switch (familyType) {
    case FamilyType.PartneringFamily:
      return {
        label: 'Partnering Family',
        icon: <FamilyRestroomIcon />,
        color: lightBlue[600],
      };
    case FamilyType.BehavioralNeeds:
      return {
        label: 'Behavioral needs',
        icon: <BrightnessIcon />,
        color: purple[600],
      };
    case FamilyType.SupportLineVolunteer:
      return {
        label: 'Support Line Volunteer',
        icon: <VolunteerActivismIcon />,
        color: green[600],
      };
    case FamilyType.StaffFamily:
      return {
        label: 'Staff family',
        icon: <WorkIcon />,
        color: amber[700],
      };
  }
}
