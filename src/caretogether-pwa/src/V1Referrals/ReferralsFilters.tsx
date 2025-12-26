import {
  Stack,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import { MouseEvent } from 'react';
import { SearchBar } from '../Shell/SearchBar';

interface ReferralsFiltersProps {
  filterText: string;
  setFilterText: (value: string) => void;

  expandedView: boolean;
  setExpandedView: (value: boolean) => void;

  onAddNewReferral: () => void;

  statusFilter: ReferralStatusFilter;
  setStatusFilter: (value: ReferralStatusFilter) => void;
}
export type ReferralStatusFilter = 'ALL' | 'OPEN' | 'CLOSED';

export function ReferralsFilters({
  filterText,
  setFilterText,
  expandedView,
  setExpandedView,
  onAddNewReferral,
  statusFilter,
  setStatusFilter,
}: ReferralsFiltersProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleExpandCollapse = (
    _event: MouseEvent<HTMLElement>,
    value: boolean | null
  ) => {
    if (value !== null) {
      setExpandedView(value);
    }
  };

  return (
    <Stack direction="row" sx={{ mt: 2, mb: 2 }}>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        sx={{ mr: 'auto' }}
        onClick={onAddNewReferral}
      >
        Add new referral
      </Button>

      <ToggleButtonGroup
        value={statusFilter}
        exclusive
        onChange={(_, value) => value && setStatusFilter(value)}
        size={isMobile ? 'medium' : 'small'}
        sx={{ ml: 2, mr: 2 }}
      >
        <ToggleButton value="ALL">ALL</ToggleButton>
        <ToggleButton value="OPEN">OPEN</ToggleButton>
        <ToggleButton value="CLOSED">CLOSED</ToggleButton>
      </ToggleButtonGroup>

      <SearchBar value={filterText} onChange={setFilterText} />

      <ToggleButtonGroup
        value={expandedView}
        exclusive
        onChange={handleExpandCollapse}
        size={isMobile ? 'medium' : 'small'}
      >
        <ToggleButton value={true}>
          <UnfoldMoreIcon />
        </ToggleButton>

        <ToggleButton value={false}>
          <UnfoldLessIcon />
        </ToggleButton>
      </ToggleButtonGroup>
    </Stack>
  );
}
