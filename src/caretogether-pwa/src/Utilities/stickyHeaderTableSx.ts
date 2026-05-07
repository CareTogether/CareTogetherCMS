export const stickyHeaderTableSx = {
  '& .MuiTableHead-root': {
    position: 'relative',
    zIndex: 11,
  },
  '& .MuiTableCell-stickyHeader': {
    top: { xs: 56, sm: 64, md: 48 },
    zIndex: 1,
    backgroundColor: '#fff',
    fontWeight: 600,
    fontSize: { xs: '0.75rem', sm: 'inherit' },
    whiteSpace: 'nowrap',
    px: { xs: 1, sm: 1.5 },
    py: { xs: 1, sm: 1.5 },
  },
};
