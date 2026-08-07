import {
  ArrowDropDown as ArrowDropDownIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import { Button } from '@mui/material';

type VolunteerBrowserFilterButtonV2Props = {
  activeCount?: number;
  label: string;
  selectedLabel?: string;
  totalCount?: number;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
};

export function VolunteerBrowserFilterButtonV2({
  activeCount,
  label,
  selectedLabel,
  totalCount,
  onClick,
}: VolunteerBrowserFilterButtonV2Props) {
  const displayText =
    selectedLabel ?? `${label} (${activeCount ?? 0}/${totalCount ?? 0})`;

  return (
    <Button
      variant="outlined"
      startIcon={<FilterListIcon />}
      endIcon={<ArrowDropDownIcon />}
      onClick={onClick}
      size="small"
      sx={{
        borderColor: 'divider',
        color: 'text.primary',
        minHeight: 34,
        px: 1.25,
      }}
    >
      {displayText}
    </Button>
  );
}
