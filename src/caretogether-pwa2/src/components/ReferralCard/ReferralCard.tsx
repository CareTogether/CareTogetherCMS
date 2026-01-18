import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  IconButton,
  Stack,
  Divider,
} from '@mui/material';
import { KeyboardArrowRightSharp as KeyboardArrowRightIcon } from '@mui/icons-material';
import { ExpandableText } from '@caretogether/ui-components';
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
  const fullName = `${data.primaryContact.firstName} ${data.primaryContact.lastName}`;
  const dateOpenedFormatted = data.openedAtUtc.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });

  return (
    <Card>
      <CardContent>
        {/* Header Section */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="body2">Date Opened: {dateOpenedFormatted}</Typography>
            <Typography component="h2" variant="h6" color="tertiary.main">
              {data.familyName}
            </Typography>
          </Box>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="body2">{fullName}</Typography>
            <FamilyTypeChip familyType={data.familyType} size="small" />
            <Button color="primaryDark" variant="outlined" onClick={onNewNote}>
              New Note
            </Button>
            <IconButton color="primaryDark" onClick={onNavigateNext}>
              <KeyboardArrowRightIcon />
            </IconButton>
          </Stack>
        </Stack>

        {/* Action & Metadata Section */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          <Button color="primaryDark" variant="outlined" onClick={onAssignClient}>
            Assign Client
          </Button>
          <ReferralStatusChip status={data.status} size="small" />
          {/* {data.arrangements?.map(arr => (
            <Chip key={arr.id} label={arr.arrangementType} size="small" />
          ))} */}
          <Divider orientation="vertical" sx={{ height: 24 }} />
          {data.primaryContact.phone && (
            <>
              <Button color="primaryDark" variant="text" href={`tel:${data.primaryContact.phone}`}>
                {data.primaryContact.phone}
              </Button>
              <Divider orientation="vertical" sx={{ height: 24 }} />
            </>
          )}
          {data.primaryContact.email && (
            <>
              <Button
                color="primaryDark"
                variant="text"
                href={`mailto:${data.primaryContact.email}`}
              >
                {data.primaryContact.email}
              </Button>
              <Divider orientation="vertical" sx={{ height: 24 }} />
            </>
          )}
          {data.source && <Typography variant="body2">Source: {data.source}</Typography>}
        </Box>

        {/* Description Section */}
        {data.comments && <ExpandableText text={data.comments} length={150} variant="body2" />}
      </CardContent>
    </Card>
  );
};
