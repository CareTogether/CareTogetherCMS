import { Card, CardContent, Typography, Box, Avatar, IconButton, Link } from '@mui/material';
import {
  Phone as PhoneIcon,
  Email as EmailIcon,
  Home as HomeIcon,
  MoreVert as MoreVertIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import { ProjectStatusChip } from '../chips/ProjectStatusChip';
import { ProjectStatus } from '../chips/chipTypes';
import { ScheduleItem } from '@caretogether/ui-components';

/**
 * Address data from API
 */
export interface AddressData {
  id: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

/**
 * Phone number from API
 */
export interface PhoneNumberData {
  id?: string;
  number: string;
  type: number; // PhoneNumberType enum
}

/**
 * Email address from API
 */
export interface EmailAddressData {
  id: string;
  address: string;
  type: number; // EmailAddressType enum
}

/**
 * Age data from API
 */
export interface AgeData {
  dateOfBirth: Date;
  type: string;
}

/**
 * Volunteer assignment for display
 */
export interface VolunteerAssignment {
  id: string;
  arrangementId: string;
  arrangementType: string;
  color: string;
  onClick?: () => void;
}

/**
 * Person profile data matching API structure
 */
export interface PersonProfileData {
  /** Person ID from API */
  id: string;
  /** Active status */
  active: boolean;
  /** First name */
  firstName: string;
  /** Last name */
  lastName: string;
  /** Gender enum (0=Male, 1=Female, 2=SeeNotes) */
  gender?: number;
  /** Age object with dateOfBirth */
  age?: AgeData;
  /** Ethnicity */
  ethnicity?: string;
  /** Addresses array from Person */
  addresses?: AddressData[];
  /** Current address ID */
  currentAddressId?: string;
  /** Phone numbers array from Person */
  phoneNumbers?: PhoneNumberData[];
  /** Preferred phone number ID */
  preferredPhoneNumberId?: string;
  /** Email addresses array from Person */
  emailAddresses?: EmailAddressData[];
  /** Preferred email address ID */
  preferredEmailAddressId?: string;
  /** Concerns from Person */
  concerns?: string;
  /** Notes from Person */
  notes?: string;
  /** Project/requirement completion status (UI-specific) */
  completionStatus: ProjectStatus;
  /** Volunteer assignments (derived from arrangements) */
  volunteerAssignments?: VolunteerAssignment[];
  /** URL for avatar image */
  avatarUrl?: string;
}

interface PersonProfileCardProps {
  /** The person profile data to display */
  data: PersonProfileData;
  /** Callback for more menu */
  onMoreClick?: () => void;
  /** Callback for view schedule link */
  onViewSchedule?: () => void;
}

/**
 * PersonProfileCard displays a person's profile information including
 * demographics, contact details, completion status, and activity assignments.
 */
export const PersonProfileCard = ({
  data,
  onMoreClick,
  onViewSchedule,
}: PersonProfileCardProps) => {
  const fullName = `${data.firstName} ${data.lastName}`;
  const initials = `${data.firstName[0]}${data.lastName[0]}`;

  // Calculate age from dateOfBirth
  const age = data.age?.dateOfBirth
    ? Math.floor(
        (new Date().getTime() - new Date(data.age.dateOfBirth).getTime()) /
          (365.25 * 24 * 60 * 60 * 1000)
      )
    : undefined;

  // Get current address
  const currentAddress = data.addresses?.find(a => a.id === data.currentAddressId);
  const addressString = currentAddress
    ? `${currentAddress.line1 || ''}${currentAddress.line2 ? ' ' + currentAddress.line2 : ''}, ${currentAddress.city || ''}, ${currentAddress.state || ''} ${currentAddress.postalCode || ''}`.trim()
    : undefined;

  // Get preferred contact info
  const preferredPhone = data.phoneNumbers?.find(p => p.id === data.preferredPhoneNumberId);
  const preferredEmail = data.emailAddresses?.find(e => e.id === data.preferredEmailAddressId);

  const hasComments = !!(data.concerns || data.notes);
  const commentsText = data.concerns || data.notes || 'Comments about this arrangement';

  return (
    <Card sx={{ borderRadius: 2 }}>
      <CardContent>
        {/* Header with Avatar & Name */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <Avatar
            src={data.avatarUrl}
            sx={{
              width: 56,
              height: 56,
              mr: 2,
              bgcolor: '#E0E0E0',
              color: '#616161',
              fontSize: '1.25rem',
              fontWeight: 600,
            }}
          >
            {initials}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              {fullName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Adult{age ? `, ${age}` : ''}
              {data.ethnicity ? `, ${data.ethnicity}` : ''}
            </Typography>
          </Box>
          <IconButton size="small" onClick={onMoreClick}>
            <MoreVertIcon />
          </IconButton>
        </Box>

        {/* Contact Information */}
        {addressString && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <HomeIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Typography variant="body2">{addressString}</Typography>
          </Box>
        )}
        {preferredPhone && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <PhoneIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Typography variant="body2">{preferredPhone.number}</Typography>
          </Box>
        )}
        {preferredEmail && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <EmailIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Typography variant="body2">{preferredEmail.address}</Typography>
          </Box>
        )}

        {/* Comments & Completion Status */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          {hasComments ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <DescriptionIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {commentsText}
              </Typography>
            </Box>
          ) : (
            <Box />
          )}
          <ProjectStatusChip status={data.completionStatus} size="small" />
        </Box>

        {/* Volunteer Assignments */}
        {data.volunteerAssignments && data.volunteerAssignments.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {data.volunteerAssignments.map(assignment => (
                <ScheduleItem
                  key={assignment.id}
                  label={assignment.arrangementType}
                  color={assignment.color}
                  size="small"
                  onClick={assignment.onClick}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* View Schedule Link */}
        {data.volunteerAssignments && data.volunteerAssignments.length > 0 && (
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Link
              component="button"
              variant="body2"
              onClick={onViewSchedule}
              sx={{ cursor: 'pointer', fontWeight: 500, color: '#07666C' }}
            >
              View Schedule
            </Link>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
