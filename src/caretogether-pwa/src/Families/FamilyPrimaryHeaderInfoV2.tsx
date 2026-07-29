import {
  Box,
  Chip,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Check as CheckIcon,
  ContentCopy as ContentCopyIcon,
  Email as EmailIcon,
  Handshake as HandshakeIcon,
  Home as HomeIcon,
  People as PeopleIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import { CombinedFamilyInfo } from '../GeneratedClient';
import { familyLastName } from './FamilyUtils';
import { PrimaryContactEditor } from './PrimaryContactEditor';
import { v2Typography } from './v2Typography';

type ContactInfoCopyButtonProps = {
  value: string;
  label: string;
  onCopied: (message: string) => void;
};

function ContactInfoCopyButton({
  value,
  label,
  onCopied,
}: ContactInfoCopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      onCopied(`${label} copied`);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      onCopied(`Unable to copy ${label.toLowerCase()}`);
    }
  }

  return (
    <Tooltip title={copied ? 'Copied' : `Copy ${label.toLowerCase()}`}>
      <IconButton
        size="small"
        aria-label={`copy ${label.toLowerCase()}`}
        onClick={() => void handleCopy()}
        sx={{ p: 0.25 }}
      >
        {copied ? (
          <CheckIcon color="success" fontSize="small" />
        ) : (
          <ContentCopyIcon fontSize="small" />
        )}
      </IconButton>
    </Tooltip>
  );
}

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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <EmailIcon fontSize="small" color="action" />
            <Typography {...v2Typography.browserCell}>
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <PhoneIcon fontSize="small" color="action" />
            <Typography {...v2Typography.browserCell}>
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <HomeIcon fontSize="small" color="action" />
            <Typography {...v2Typography.browserCell}>
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
