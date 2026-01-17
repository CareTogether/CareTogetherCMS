import { TableRow, TableCell, Box } from '@mui/material';
import { useAppNavigate } from '../Hooks/useAppNavigate';

export interface ReferralRowModel {
  id: string;
  title: string;
  status: 'OPEN' | 'CLOSED';
  openedAtUtc?: Date;
  closedAtUtc?: Date;
  clientFamilyName: string | null;
  county: string | null;
  comments?: string;
}

interface ReferralRowProps {
  referral: ReferralRowModel;
  expanded: boolean;
}

function formatDate(date?: Date) {
  if (!date) return '';
  return date.toLocaleDateString();
}

export function ReferralRow({ referral, expanded }: ReferralRowProps) {
  const appNavigate = useAppNavigate();

  const comments = referral.comments ?? '';
  const preview =
    comments.length > 500 ? comments.slice(0, 500) + '…' : comments;

  const statusDate =
    referral.status === 'OPEN' ? referral.openedAtUtc : referral.closedAtUtc;

  return (
    <>
      <TableRow
        sx={{ backgroundColor: '#eef', cursor: 'pointer' }}
        onClick={() => appNavigate.referral(referral.id)}
      >
        <TableCell>{referral.title}</TableCell>
        <TableCell>
          <Box sx={{ fontWeight: 400, fontSize: '0.875rem' }}>
            {referral.status === 'OPEN' ? 'Open since' : 'Closed since'}
            {statusDate && (
              <Box component="span" sx={{ ml: 0.5 }}>
                {formatDate(statusDate)}
              </Box>
            )}
          </Box>
        </TableCell>

        <TableCell>{referral.clientFamilyName ?? ''}</TableCell>

        <TableCell>{referral.county ?? ''}</TableCell>
      </TableRow>

      {expanded && comments && (
        <TableRow
          sx={{ cursor: 'pointer' }}
          onClick={() => appNavigate.referral(referral.id)}
        >
          <TableCell colSpan={4} sx={{ pl: 3 }}>
            <Box sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}>
              {preview}
            </Box>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
