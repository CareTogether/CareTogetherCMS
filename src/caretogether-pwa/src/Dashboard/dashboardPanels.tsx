import { FactCheckOutlined, VerifiedUserOutlined } from '@mui/icons-material';

export const expirationPanel = {
  title: 'Expiring approvals and requirements',
  icon: <VerifiedUserOutlined fontSize="small" />,
  emptyTitle: 'All clear in this view',
  emptyMessage: 'No approvals or requirements need attention in this view.',
  emptyIcon: <VerifiedUserOutlined fontSize="small" color="action" />,
  itemType: 'approval work item',
  loadingMessage: 'Loading approvals and requirements…',
} as const;

export const noteReviewPanel = {
  title: 'Notes awaiting review',
  icon: <FactCheckOutlined fontSize="small" />,
  emptyTitle: 'Review queue clear',
  emptyMessage: 'No notes awaiting review.',
  itemType: 'note',
} as const;
