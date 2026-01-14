import { useState } from 'react';
import { Card, CardContent, Typography, Box, Button, IconButton, Link } from '@mui/material';
import { NavigateNext as NavigateNextIcon } from '@mui/icons-material';
import { ReferralStatusChip } from '../chips/ReferralStatusChip';
import { FamilyTypeChip } from '../chips/FamilyTypeChip';
import { ReferralStatus, FamilyType } from '../chips/chipTypes';

/**
 * Simplified arrangement data for display
 */
export interface ArrangementSummary {
  id: string;
  arrangementType: string;
  phase: number; // ArrangementPhase enum
  requestedAtUtc: Date;
}

/**
 * Primary contact information
 */
export interface PrimaryContact {
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
}

/**
 * Referral/case data matching API structure
 */
export interface ReferralData {
  /** V1Case ID */
  id: string;
  /** Date the case was opened (from V1Case.openedAtUtc) */
  openedAtUtc: Date;
  /** Family name for display */
  familyName: string;
  /** Primary contact person from family.adults */
  primaryContact: PrimaryContact;
  /** Status of the referral */
  status: ReferralStatus;
  /** Type of family arrangement */
  familyType: FamilyType;
  /** Arrangements array from V1Case */
  arrangements?: ArrangementSummary[];
  /** Source of the referral */
  source?: string;
  /** Comments from V1Case */
  comments?: string;
}

interface ReferralCardProps {
  /** The referral data to display */
  data: ReferralData;
  /** Callback for Assign Client button */
  onAssignClient?: () => void;
  /** Callback for New Note button */
  onNewNote?: () => void;
  /** Callback for previous navigation */
  onNavigatePrevious?: () => void;
  /** Callback for next navigation */
  onNavigateNext?: () => void;
}

/**
 * ReferralCard displays case/referral information including
 * date opened, status badges, family details, contact info, and description.
 */
export const ReferralCard = ({
  data,
  onAssignClient,
  onNewNote,
  onNavigateNext,
}: ReferralCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleDescription = () => setIsExpanded(!isExpanded);

  const fullName = `${data.primaryContact.firstName} ${data.primaryContact.lastName}`;
  const dateOpenedFormatted = data.openedAtUtc.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });

  // Truncate description at ~150 characters
  const description = data.comments || '';
  const shouldTruncate = description.length > 150;
  const displayDescription =
    shouldTruncate && !isExpanded ? description.slice(0, 150) + '...' : description;

  return (
    <Card sx={{ borderRadius: 2 }}>
      <CardContent>
        {/* Header Section */}
        <Box
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}
        >
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Date Opened: {dateOpenedFormatted}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 600, mt: 0.5 }}>
              {data.familyName}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Typography variant="body2" sx={{ mr: 1 }}>
              {fullName}
            </Typography>
            <FamilyTypeChip familyType={data.familyType} size="small" />
            <Button variant="outlined" onClick={onNewNote}>
              New Note
            </Button>
            <IconButton size="small" onClick={onNavigateNext}>
              <NavigateNextIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Action & Metadata Section */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          <Button variant="outlined" onClick={onAssignClient}>
            Assign Client
          </Button>
          <ReferralStatusChip status={data.status} size="small" />
          {/* {data.arrangements?.map(arr => (
            <Chip key={arr.id} label={arr.arrangementType} size="small" />
          ))} */}
          <Typography variant="body2" color="text.secondary" sx={{ mx: 1 }}>
            |
          </Typography>
          {data.primaryContact.phone && (
            <>
              <Typography variant="body2">{data.primaryContact.phone}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mx: 1 }}>
                |
              </Typography>
            </>
          )}
          {data.primaryContact.email && (
            <>
              <Typography variant="body2">{data.primaryContact.email}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mx: 1 }}>
                |
              </Typography>
            </>
          )}
          {data.source && (
            <Typography variant="body2" color="text.secondary">
              Source: {data.source}
            </Typography>
          )}
        </Box>

        {/* Description Section */}
        {/* Description Section */}
        {description && (
          // TODO: turn this into its own component for expanding text blocks
          <Typography variant="body2" color="text.secondary">
            {displayDescription}{' '}
            {shouldTruncate && (
              <Link
                component="button"
                variant="body2"
                onClick={toggleDescription}
                sx={{ cursor: 'pointer', fontWeight: 500 }}
              >
                {isExpanded ? 'Less' : 'More'}
              </Link>
            )}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};
