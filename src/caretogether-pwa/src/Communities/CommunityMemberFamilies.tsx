import {
  Box,
  Button,
  Chip,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  CombinedFamilyInfo,
  CommunityInfo,
} from '../GeneratedClient';
import type { EmailAddress, PhoneNumber } from '../GeneratedClient';
import {
  Email as EmailIcon,
  GroupRemove as GroupRemoveIcon,
  People as PeopleIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material';
import { FamilyName, familyNameString } from '../Families/FamilyName';
import { useAppNavigate } from '../Hooks/useAppNavigate';
import { VolunteerRoleApprovalStatusChip } from '../Volunteers/VolunteerRoleApprovalStatusChip';
import { PersonName } from '../Families/PersonName';
import { useGlobalSnackBar } from '../Hooks/useGlobalSnackBar';
import type { ReactNode } from 'react';
import type { CommunityMemberFamilyApprovalRow } from './communityMemberFamiliesModel';
import { useCommunityMemberFamilyCommands } from './useCommunityMemberFamilyCommands';
import { useCommunityMemberFamiliesViewModel } from './useCommunityMemberFamiliesViewModel';

interface CommunityMemberFamiliesProps {
  communityInfo: CommunityInfo;
}

function contactUnavailableText(text: string) {
  return (
    <Typography variant="body2" color="text.secondary">
      {text}
    </Typography>
  );
}

interface ContactCopyButtonProps {
  value: string;
  label: string;
  copiedMessage: string;
  icon: ReactNode;
  onCopy: (value: string, copiedMessage: string) => void;
}

function ContactCopyButton({
  value,
  label,
  copiedMessage,
  icon,
  onCopy,
}: ContactCopyButtonProps) {
  return (
    <Tooltip title="Copy">
      <Button
        variant="text"
        size="small"
        startIcon={icon}
        aria-label={`copy ${label}`}
        onClick={() => onCopy(value, copiedMessage)}
        sx={{
          justifyContent: 'flex-start',
          maxWidth: '100%',
          minWidth: 0,
          paddingX: 0.5,
          textTransform: 'none',
          '& .MuiButton-startIcon': {
            marginRight: 0.5,
          },
        }}
      >
        <Box
          component="span"
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {value}
        </Box>
      </Button>
    </Tooltip>
  );
}

export function CommunityMemberFamilies({
  communityInfo,
}: CommunityMemberFamiliesProps) {
  const { canEditMemberFamilies, community, memberFamilyRows } =
    useCommunityMemberFamiliesViewModel(communityInfo);
  const { removeMemberFamilyFromCommunity } =
    useCommunityMemberFamilyCommands();

  async function remove(family: CombinedFamilyInfo) {
    //TODO: Use the DeleteDocumentDialog approach - potentially making it reusable?
    if (
      window.confirm(
        'Are you sure you want to remove this member family?\n\n' +
          familyNameString(family)
      )
    ) {
      await removeMemberFamilyFromCommunity(community.id!, family.family!.id!);
    }
  }

  const appNavigate = useAppNavigate();
  const { setAndShowGlobalSnackBar } = useGlobalSnackBar();

  async function copyContact(value: string, copiedMessage: string) {
    try {
      await navigator.clipboard.writeText(value);
      setAndShowGlobalSnackBar(copiedMessage);
    } catch {
      setAndShowGlobalSnackBar('Unable to copy');
    }
  }

  function renderPhoneNumbers(phoneNumbers: PhoneNumber[], canView: boolean) {
    if (!canView) {
      return contactUnavailableText('Restricted');
    }

    if (phoneNumbers.length === 0) {
      return contactUnavailableText('No phone');
    }

    return (
      <Stack spacing={0.25}>
        {phoneNumbers.map((phoneNumber: PhoneNumber) => (
          <ContactCopyButton
            key={phoneNumber.id || phoneNumber.number}
            value={phoneNumber.number}
            label="phone number"
            copiedMessage="Copied phone number"
            icon={<PhoneIcon fontSize="small" />}
            onCopy={(value, copiedMessage) =>
              void copyContact(value, copiedMessage)
            }
          />
        ))}
      </Stack>
    );
  }

  function renderEmailAddresses(
    emailAddresses: EmailAddress[],
    canView: boolean
  ) {
    if (!canView) {
      return contactUnavailableText('Restricted');
    }

    if (emailAddresses.length === 0) {
      return contactUnavailableText('No email');
    }

    return (
      <Stack spacing={0.25}>
        {emailAddresses.map((emailAddress: EmailAddress) => (
          <ContactCopyButton
            key={emailAddress.id || emailAddress.address}
            value={emailAddress.address}
            label="email"
            copiedMessage="Copied email"
            icon={<EmailIcon fontSize="small" />}
            onCopy={(value, copiedMessage) =>
              void copyContact(value, copiedMessage)
            }
          />
        ))}
      </Stack>
    );
  }

  function renderFamilyApprovals(
    approvalRows: CommunityMemberFamilyApprovalRow[]
  ) {
    return approvalRows.map(({ roleName, status }) => (
      <VolunteerRoleApprovalStatusChip
        key={roleName}
        roleName={roleName}
        status={status}
      />
    ));
  }

  function renderAdultApprovals(
    approvalRows: CommunityMemberFamilyApprovalRow[]
  ) {
    return approvalRows.map(({ roleName, status }) => (
      <VolunteerRoleApprovalStatusChip
        key={roleName}
        roleName={roleName}
        status={status}
      />
    ));
  }

  return (
    <TableContainer
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        marginTop: 1,
        overflowX: 'auto',
      }}
    >
      <Table
        size="small"
        aria-label="Community member families contact table"
        sx={{
          minWidth: 720,
          '& thead th': {
            backgroundColor: 'grey.50',
            color: 'text.secondary',
            fontWeight: 600,
          },
          '& tbody tr.member-row:hover td': {
            backgroundColor: 'action.hover',
          },
        }}
      >
        <TableHead>
          <TableRow>
            <TableCell sx={{ minWidth: 220 }}>Member</TableCell>
            <TableCell sx={{ minWidth: 150 }}>Phone</TableCell>
            <TableCell sx={{ minWidth: 240 }}>Email</TableCell>
            {canEditMemberFamilies && (
              <TableCell align="right" sx={{ width: 48 }}>
                Actions
              </TableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {memberFamilyRows.length === 0 && (
            <TableRow>
              <TableCell colSpan={canEditMemberFamilies ? 4 : 3}>
                <Typography variant="body2" color="text.secondary">
                  No member families have been added.
                </Typography>
              </TableCell>
            </TableRow>
          )}
          {memberFamilyRows.flatMap((familyRow) => {
            const family = familyRow.family;
            const familyHeaderRow = (
              <TableRow key={familyRow.familyId}>
                <TableCell
                  colSpan={canEditMemberFamilies ? 4 : 3}
                  sx={{
                    backgroundColor: 'grey.50',
                    borderTop: 1,
                    borderTopColor: 'divider',
                    paddingY: 1,
                  }}
                >
                  <Stack
                    direction="row"
                    sx={{
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 1,
                    }}
                  >
                    <Stack
                      direction="row"
                      sx={{
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 0.75,
                        minWidth: 0,
                      }}
                    >
                      <Button
                        variant="text"
                        size="small"
                        startIcon={<PeopleIcon />}
                        onClick={() => appNavigate.family(familyRow.familyId)}
                        sx={{
                          justifyContent: 'flex-start',
                          minWidth: 0,
                          paddingX: 0,
                          textAlign: 'left',
                          textTransform: 'none',
                          whiteSpace: 'normal',
                          '& .MuiButton-startIcon': {
                            marginRight: 0.75,
                          },
                        }}
                      >
                        <FamilyName family={family} />
                      </Button>
                      {renderFamilyApprovals(familyRow.approvalRows)}
                    </Stack>
                    {canEditMemberFamilies && (
                      <Tooltip title="Remove family from community">
                        <IconButton
                          aria-label="remove member family"
                          color="primary"
                          size="small"
                          onClick={() => remove(family)}
                        >
                          <GroupRemoveIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            );

            const adultRows = familyRow.adultRows.map((adultRow) => {
              const person = adultRow.person;

              return (
                <TableRow key={adultRow.rowKey} className="member-row">
                  <TableCell sx={{ paddingLeft: 4, verticalAlign: 'top' }}>
                    {person ? (
                      <Stack spacing={0.5}>
                        <Stack
                          direction="row"
                          sx={{
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: 0.75,
                          }}
                        >
                          <PersonName person={person} />
                          {adultRow.isPrimaryContact && (
                            <Chip
                              label="Primary"
                              size="small"
                              variant="outlined"
                              sx={{
                                height: 20,
                                '& .MuiChip-label': {
                                  paddingX: 0.75,
                                },
                              }}
                            />
                          )}
                        </Stack>
                        <Stack
                          direction="row"
                          sx={{ flexWrap: 'wrap', gap: 0.5 }}
                        >
                          {renderAdultApprovals(adultRow.approvalRows)}
                        </Stack>
                      </Stack>
                    ) : (
                      contactUnavailableText('No adult members')
                    )}
                  </TableCell>
                  <TableCell sx={{ maxWidth: 180, verticalAlign: 'top' }}>
                    {renderPhoneNumbers(
                      adultRow.phoneNumbers,
                      familyRow.canViewContactInfo
                    )}
                  </TableCell>
                  <TableCell sx={{ maxWidth: 240, verticalAlign: 'top' }}>
                    {renderEmailAddresses(
                      adultRow.emailAddresses,
                      familyRow.canViewContactInfo
                    )}
                  </TableCell>
                  {canEditMemberFamilies && <TableCell />}
                </TableRow>
              );
            });

            return [familyHeaderRow, ...adultRows];
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
