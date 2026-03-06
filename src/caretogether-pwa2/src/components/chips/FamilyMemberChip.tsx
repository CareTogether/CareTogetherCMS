import { ColoredChip } from '@caretogether/ui-components';
import type { ColoredChipProps } from '@caretogether/ui-components';
import { purple, deepOrange } from '@mui/material/colors';
import { FamilyMemberType } from './chipTypes';
import type { FamilyMemberType as FamilyMemberTypeValue } from './chipTypes';

interface FamilyMemberChipProps extends Pick<ColoredChipProps, 'sx' | 'size' | 'className'> {
  memberType: FamilyMemberTypeValue;
}

export const FamilyMemberChip = ({ memberType, sx, size, className }: FamilyMemberChipProps) => {
  const config = getFamilyMemberConfig(memberType);
  return (
    <ColoredChip
      label={config.label}
      color={config.color}
      size={size}
      sx={sx}
      className={className}
    />
  );
};

interface FamilyMemberConfig {
  label: string;
  color: string;
}

function getFamilyMemberConfig(memberType: FamilyMemberTypeValue): FamilyMemberConfig {
  switch (memberType) {
    case FamilyMemberType.Mother:
      return {
        label: 'Mother',
        color: purple[600],
      };
    case FamilyMemberType.Father:
      return {
        label: 'Father',
        color: purple[600],
      };
    case FamilyMemberType.Daughter:
      return {
        label: 'Daughter',
        color: deepOrange[600],
      };
    case FamilyMemberType.Son:
      return {
        label: 'Son',
        color: deepOrange[600],
      };
  }
}
