import { TestFamilyBadge } from './TestFamilyBadge';
import { Box, Chip, Typography } from '@mui/material';
import {
  Email as EmailIcon,
  Handshake as HandshakeIcon,
  Home as HomeIcon,
  People as PeopleIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material';
import { CombinedFamilyInfo } from '../GeneratedClient';
import { ContactInfoCopyButton } from './ContactInfoCopyButton';
import { familyLastName } from './FamilyUtils';
import { PrimaryContactEditor } from './PrimaryContactEditor';
import { v2Typography } from './v2Typography';

type FamilyPrimaryHeaderInfoV2Props = {
  family: CombinedFamilyInfo;
  primaryAddressText?: string;
  primaryEmailAddress?: string;
  primaryPhoneNumber?: string;
  onCopied: (message: string) => void;
};

export function FamilyPrimaryHeaderInfoV2({
  family,
  primaryAddressText,
  primaryEmailAddress,
  primaryPhoneNumber,
  onCopied,
}: FamilyPrimaryHeaderInfoV2Props) {
  const familyTypeChip = family.partneringFamilyInfo ? (
    <Chip icon={<HandshakeIcon />} label="Client" />
  ) : family.volunteerFamilyInfo ? (
    <Chip icon={<PeopleIcon />} label="Volunteer" />
  ) : null;

  return (
    <Box sx={{ flex: '1 1 auto', minWidth: 0 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1,
          minWidth: 0,
          mb: 0.5,
        }}
      >
        <Typography variant="h4">
          {familyLastName(family)}{' '}
          <Box component="span" className="ph-unmask">
            Family
          </Box>
        </Typography>
        <TestFamilyBadge family={family} />
        {familyTypeChip}
      </Box>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          columnGap: 2,
          rowGap: 0.5,
        }}
      >
        <Box>
          <PrimaryContactEditor family={family} />
        </Box>
        {primaryEmailAddress && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              minWidth: { xs: 0, sm: 'auto' },
              maxWidth: { xs: '100%', sm: 'none' },
            }}
          >
            <EmailIcon fontSize="small" color="action" />
            <Typography
              {...v2Typography.browserCell}
              sx={{
                minWidth: { xs: 0, sm: 'auto' },
                overflowWrap: { xs: 'anywhere', sm: 'normal' },
              }}
            >
              {primaryEmailAddress}
            </Typography>
            <ContactInfoCopyButton
              value={primaryEmailAddress}
              label="Email"
              onCopied={onCopied}
            />
          </Box>
        )}
        {primaryPhoneNumber && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              minWidth: { xs: 0, sm: 'auto' },
              maxWidth: { xs: '100%', sm: 'none' },
            }}
          >
            <PhoneIcon fontSize="small" color="action" />
            <Typography
              {...v2Typography.browserCell}
              sx={{
                minWidth: { xs: 0, sm: 'auto' },
                overflowWrap: { xs: 'anywhere', sm: 'normal' },
              }}
            >
              {primaryPhoneNumber}
            </Typography>
            <ContactInfoCopyButton
              value={primaryPhoneNumber}
              label="Phone number"
              onCopied={onCopied}
            />
          </Box>
        )}
        {primaryAddressText && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              minWidth: { xs: 0, sm: 'auto' },
              maxWidth: { xs: '100%', sm: 'none' },
            }}
          >
            <HomeIcon fontSize="small" color="action" />
            <Typography
              {...v2Typography.browserCell}
              sx={{
                minWidth: { xs: 0, sm: 'auto' },
                overflowWrap: { xs: 'anywhere', sm: 'normal' },
              }}
            >
              {primaryAddressText}
            </Typography>
            <ContactInfoCopyButton
              value={primaryAddressText}
              label="Address"
              onCopied={onCopied}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}
