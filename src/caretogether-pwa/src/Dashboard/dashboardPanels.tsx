import {
  AssignmentIndOutlined,
  FactCheckOutlined,
  VerifiedUserOutlined,
} from '@mui/icons-material';

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

export const myAssignmentsPanel = {
  title: 'My assignments',
  icon: <AssignmentIndOutlined fontSize="small" />,
  emptyTitle: 'No assignments',
  emptyMessage: 'You have no active case, arrangement, or role assignments.',
  itemType: 'assignment',
  loadingMessage: 'Loading assignments…',
} as const;
