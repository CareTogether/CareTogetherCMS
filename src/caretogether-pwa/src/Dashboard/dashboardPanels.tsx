import { FactCheckOutlined } from '@mui/icons-material';

export const noteReviewPanel = {
  title: 'Notes awaiting review',
  icon: <FactCheckOutlined fontSize="small" />,
  emptyTitle: 'Review queue clear',
  emptyMessage: 'No notes awaiting review.',
  itemType: 'note',
} as const;
