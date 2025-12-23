import { TableRow, TableCell, Box } from '@mui/material';
import { useAppNavigate } from '../Hooks/useAppNavigate';

export interface ReferralRowModel {
  id: string;
  title: string;
  status: 'OPEN' | 'CLOSED';
  clientFamilyName: string;
  comments?: string;
}

interface ReferralRowProps {
  referral: ReferralRowModel;
  expanded: boolean;
}

export function ReferralRow({ referral, expanded }: ReferralRowProps) {
  const appNavigate = useAppNavigate();

  const comments = referral.comments ?? '';
  const preview =
    comments.length > 500 ? comments.slice(0, 500) + '…' : comments;

  return (
    <>
      <TableRow
        sx={{ backgroundColor: '#eef', cursor: 'pointer' }}
        onClick={() => appNavigate.referral(referral.id)}
      >
        <TableCell>{referral.title}</TableCell>
        <TableCell>{referral.status}</TableCell>
        <TableCell>{referral.clientFamilyName}</TableCell>
      </TableRow>

      {expanded && comments && (
        <TableRow
          sx={{ cursor: 'pointer' }}
          onClick={() => appNavigate.referral(referral.id)}
        >
          <TableCell colSpan={3} sx={{ pl: 3 }}>
            <Box sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}>
              {preview}
            </Box>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
