import {
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { containedStickyHeaderTableSx } from '../Utilities/stickyHeaderTableSx';
import { WideTableContainer } from '../Utilities/WideTableContainer';
import { ContactInfoCopyButton } from './ContactInfoCopyButton';
import type { FamilyMemberRowV2 } from './familyMemberViewModel';

type FamilyMembersTableV2Props = {
  rows: FamilyMemberRowV2[];
  onRowClick?: (row: FamilyMemberRowV2) => void;
  onCopied: (message: string) => void;
};

function ContactValue({
  label,
  value,
  onCopied,
}: {
  label: string;
  value: string;
  onCopied: (message: string) => void;
}) {
  return (
    <Box
      sx={{
        alignItems: 'center',
        display: 'flex',
        gap: 0.5,
        minWidth: 0,
      }}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <Typography className="ph-unmask" variant="body2">
        {value}
      </Typography>
      <ContactInfoCopyButton
        label={label}
        value={value}
        onCopied={onCopied}
      />
    </Box>
  );
}

function ContactCell({
  row,
  onCopied,
}: {
  row: FamilyMemberRowV2;
  onCopied: (message: string) => void;
}) {
  if (!row.phone && !row.email) {
    return <Typography color="text.secondary">-</Typography>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
      {row.phone && (
        <ContactValue label="Phone" value={row.phone} onCopied={onCopied} />
      )}
      {row.email && (
        <ContactValue label="Email" value={row.email} onCopied={onCopied} />
      )}
    </Box>
  );
}

function StatusCell({ row }: { row: FamilyMemberRowV2 }) {
  if (row.statusLabels.length === 0) {
    return <Typography color="text.secondary">-</Typography>;
  }

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
      {row.statusLabels.map((statusLabel) => (
        <Chip key={statusLabel} label={statusLabel} size="small" />
      ))}
    </Box>
  );
}

function RelationshipCell({ row }: { row: FamilyMemberRowV2 }) {
  const memberType = row.kind === 'adult' ? 'Adult' : 'Child';

  if (!row.relationshipLabel || row.relationshipLabel === memberType) {
    return <Typography color="text.secondary">-</Typography>;
  }

  return <>{row.relationshipLabel}</>;
}

export function FamilyMembersTableV2({
  rows,
  onRowClick,
  onCopied,
}: FamilyMembersTableV2Props) {
  return (
    <Box
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        overflow: 'hidden',
      }}
    >
      <WideTableContainer>
      <Table
        aria-label="Family members"
        stickyHeader
        size="small"
        sx={{
          ...containedStickyHeaderTableSx,
          minWidth: 720,
          '& .MuiTableCell-root': {
            px: { xs: 1, sm: 1.5 },
            py: 1,
          },
          '& tbody tr:hover td': {
            backgroundColor: 'action.hover',
          },
        }}
      >
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Relationship</TableCell>
            <TableCell>Contact</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={4}>
                <Typography color="text.secondary" variant="body2">
                  No family members found.
                </Typography>
              </TableCell>
            </TableRow>
          )}
          {rows.map((row) => (
            <TableRow
              key={row.id}
              hover
              role={onRowClick ? 'button' : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              sx={{
                cursor: onRowClick ? 'pointer' : 'default',
              }}
              onClick={() => onRowClick?.(row)}
              onKeyDown={(event) => {
                if (!onRowClick) {
                  return;
                }

                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onRowClick(row);
                }
              }}
            >
              <TableCell>
                <Typography
                  className="ph-unmask"
                  sx={{ fontWeight: 600 }}
                  variant="body2"
                >
                  {row.name}
                </Typography>
                <Typography color="text.secondary" variant="caption">
                  {[row.kind === 'adult' ? 'Adult' : 'Child', row.ageLabel]
                    .filter(Boolean)
                    .join(' · ')}
                </Typography>
              </TableCell>
              <TableCell>
                <RelationshipCell row={row} />
              </TableCell>
              <TableCell>
                <ContactCell row={row} onCopied={onCopied} />
              </TableCell>
              <TableCell>
                <StatusCell row={row} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </WideTableContainer>
    </Box>
  );
}
