import { WarningAmber as WarningAmberIcon } from '@mui/icons-material';
import { Box, Button, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

type ActiveFiltersIndicatorProps = {
  onClear: () => void;
};

export function ActiveFiltersIndicator({ onClear }: ActiveFiltersIndicatorProps) {
  return (
    <Box
      className="ph-unmask"
      sx={(theme) => ({
        alignItems: 'center',
        alignSelf: 'flex-start',
        bgcolor: alpha(theme.palette.warning.main, 0.12),
        borderRadius: 1,
        color: theme.palette.warning.dark,
        display: 'inline-flex',
        flex: '0 1 auto',
        flexWrap: 'wrap',
        gap: 0.75,
        maxWidth: '100%',
        minHeight: 36,
        px: 1,
        py: 0.25,
      })}
    >
      <WarningAmberIcon fontSize="small" />
      <Typography component="span" variant="body2" sx={{ whiteSpace: 'nowrap' }}>
        Filters are active
      </Typography>
      <Button
        className="ph-unmask"
        color="warning"
        onClick={onClear}
        size="small"
        sx={{ minHeight: 28, px: 1 }}
        variant="outlined"
      >
        Clear filters
      </Button>
    </Box>
  );
}
