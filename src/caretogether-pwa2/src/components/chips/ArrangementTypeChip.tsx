import { ColoredChip } from '@caretogether/ui-components';
import type { ColoredChipProps } from '@caretogether/ui-components';
import { pink, yellow, blue } from '@mui/material/colors';
import { ArrangementType } from './chipTypes';
import type { ArrangementType as ArrangementTypeValue } from './chipTypes';

interface ArrangementTypeChipProps extends Pick<ColoredChipProps, 'sx' | 'size' | 'className'> {
  arrangementType: ArrangementTypeValue;
}

export const ArrangementTypeChip = ({
  arrangementType,
  sx,
  size,
  className,
}: ArrangementTypeChipProps) => {
  const config = getArrangementTypeConfig(arrangementType);
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

interface ArrangementTypeConfig {
  label: string;
  color: string;
}

function getArrangementTypeConfig(arrangementType: ArrangementTypeValue): ArrangementTypeConfig {
  switch (arrangementType) {
    case ArrangementType.Hosting:
      return {
        label: 'Hosting',
        color: pink[600],
      };
    case ArrangementType.Friending:
      return {
        label: 'Friending',
        color: yellow[600],
      };
    case ArrangementType.Mentoring:
      return {
        label: 'Mentoring',
        color: blue[600],
      };
  }
}
