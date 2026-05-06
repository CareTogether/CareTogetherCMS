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
  Permission,
  RemoveCommunityMemberFamily,
} from '../GeneratedClient';
import type {
  EmailAddress,
  Person,
  PhoneNumber,
  ValueTupleOfPersonAndFamilyAdultRelationshipInfo,
} from '../GeneratedClient';
import { useCommunityCommand } from '../Model/DirectoryModel';
import { useCommunityPermissions } from '../Model/SessionModel';
import {
  Email as EmailIcon,
  GroupRemove as GroupRemoveIcon,
  People as PeopleIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material';
import { useBackdrop } from '../Hooks/useBackdrop';
import { useRecoilValue } from 'recoil';
import { FamilyName, familyNameString } from '../Families/FamilyName';
import { familyLastName } from '../Families/FamilyUtils';
import { visibleFamiliesQuery } from '../Model/Data';
import { useAppNavigate } from '../Hooks/useAppNavigate';
import { VolunteerRoleApprovalStatusChip } from '../Volunteers/VolunteerRoleApprovalStatusChip';
import { PersonName } from '../Families/PersonName';
import { useGlobalSnackBar } from '../Hooks/useGlobalSnackBar';
import type { ReactNode } from 'react';

type AdultInfo = ValueTupleOfPersonAndFamilyAdultRelationshipInfo;

interface CommunityMemberFamiliesProps {
  communityInfo: CommunityInfo;
}

function preferredFirst<T extends { id?: string }>(
  values: T[] | undefined,
  preferredId: string | undefined,
  valueSelector: (value: T) => string | undefined
) {
  return (values || [])
    .filter((value) => Boolean(valueSelector(value)?.trim()))
    .map((value, index) => ({ value, index }))
    .sort((a, b) => {
      const aPreferred = a.value.id === preferredId;
      const bPreferred = b.value.id === preferredId;

      if (aPreferred !== bPreferred) {
        return aPreferred ? -1 : 1;
      }

      return a.index - b.index;
    })
    .map(({ value }) => value);
}

function phoneNumbersFor(person?: Person) {
  return preferredFirst(
    person?.phoneNumbers,
    person?.preferredPhoneNumberId,
    (phoneNumber) => phoneNumber.number
  );
}

function emailAddressesFor(person?: Person) {
  return preferredFirst(
    person?.emailAddresses,
    person?.preferredEmailAddressId,
    (emailAddress) => emailAddress.address
  );
}

function adultsFor(family: CombinedFamilyInfo): (AdultInfo | undefined)[] {
  const adults = family.family?.adults || [];

  if (adults.length === 0) {
    return [undefined];
  }

  return adults;
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
  const permissions = useCommunityPermissions(communityInfo);
  const community = communityInfo.community!;

  const visibleFamilies = useRecoilValue(visibleFamiliesQuery);

  const memberFamilies = (community?.memberFamilies || [])
    .map((familyId) =>
      visibleFamilies.find((family) => family.family?.id === familyId)
    )
    .filter((family) => family)
    .sort((a, b) => {
      const aName = familyLastName(a!);
      const bName = familyLastName(b!);
      return aName?.localeCompare(bName, undefined, { sensitivity: 'base' });
    }) as CombinedFamilyInfo[];

  const removeMemberFamily = useCommunityCommand(
    (communityId, familyId: string) => {
      const command = new RemoveCommunityMemberFamily();
      command.communityId = communityId;
      command.familyId = familyId;
      return command;
    }
  );

  const withBackdrop = useBackdrop();
  async function remove(family: CombinedFamilyInfo) {
    //TODO: Use the DeleteDocumentDialog approach - potentially making it reusable?
    if (
      window.confirm(
        'Are you sure you want to remove this member family?\n\n' +
          familyNameString(family)
      )
    ) {
      await withBackdrop(async () => {
        await removeMemberFamily(community.id!, family.family!.id!);
      });
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

  const canEditMemberFamilies = permissions(
    Permission.EditCommunityMemberFamilies
  );

  function canViewContactInfo(family: CombinedFamilyInfo) {
    return (
      permissions(Permission.ViewPersonContactInfo) ||
      (family.userPermissions || []).includes(Permission.ViewPersonContactInfo)
    );
  }

  function renderPhoneNumbers(person: Person | undefined, canView: boolean) {
    if (!canView) {
      return contactUnavailableText('Restricted');
    }

    const phoneNumbers = phoneNumbersFor(person);

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

  function renderEmailAddresses(person: Person | undefined, canView: boolean) {
    if (!canView) {
      return contactUnavailableText('Restricted');
    }

    const emailAddresses = emailAddressesFor(person);

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

  function renderFamilyApprovals(family: CombinedFamilyInfo) {
    return Object.entries(
      family.volunteerFamilyInfo?.familyRoleApprovals || {}
    ).map(([role, roleApprovalStatus]) => (
      <VolunteerRoleApprovalStatusChip
        key={role}
        roleName={role}
        status={roleApprovalStatus.effectiveRoleApprovalStatus}
      />
    ));
  }

  function renderAdultApprovals(
    family: CombinedFamilyInfo,
    person: Person | undefined
  ) {
    if (!person?.id) {
      return null;
    }

    return Object.entries(
      family.volunteerFamilyInfo?.individualVolunteers?.[person.id]
        ?.approvalStatusByRole || {}
    ).map(([role, roleApprovalStatus]) => (
      <VolunteerRoleApprovalStatusChip
        key={role}
        roleName={role}
        status={roleApprovalStatus.effectiveRoleApprovalStatus}
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
          {memberFamilies.length === 0 && (
            <TableRow>
              <TableCell colSpan={canEditMemberFamilies ? 4 : 3}>
                <Typography variant="body2" color="text.secondary">
                  No member families have been added.
                </Typography>
              </TableCell>
            </TableRow>
          )}
          {memberFamilies.flatMap((family) => {
            const adults = adultsFor(family);
            const familyCanViewContactInfo = canViewContactInfo(family);
            const familyId = family.family!.id!;
            const familyHeaderRow = (
              <TableRow key={familyId}>
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
                    alignItems="center"
                    justifyContent="space-between"
                    gap={1}
                  >
                    <Stack
                      direction="row"
                      alignItems="center"
                      flexWrap="wrap"
                      gap={0.75}
                      sx={{ minWidth: 0 }}
                    >
                      <Button
                        variant="text"
                        size="small"
                        startIcon={<PeopleIcon />}
                        onClick={() => appNavigate.family(familyId)}
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
                      {renderFamilyApprovals(family)}
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

            const adultRows = adults.map((adult) => {
              const person = adult?.item1;
              const rowKey = `${familyId}-${person?.id || 'no-adults'}`;

              return (
                <TableRow key={rowKey} className="member-row">
                  <TableCell sx={{ paddingLeft: 4, verticalAlign: 'top' }}>
                    {person ? (
                      <Stack spacing={0.5}>
                        <Stack
                          direction="row"
                          alignItems="center"
                          flexWrap="wrap"
                          gap={0.75}
                        >
                          <PersonName person={person} />
                          {family.family?.primaryFamilyContactPersonId ===
                            person.id && (
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
                        <Stack direction="row" flexWrap="wrap" gap={0.5}>
                          {renderAdultApprovals(family, person)}
                        </Stack>
                      </Stack>
                    ) : (
                      contactUnavailableText('No adult members')
                    )}
                  </TableCell>
                  <TableCell sx={{ maxWidth: 180, verticalAlign: 'top' }}>
                    {renderPhoneNumbers(person, familyCanViewContactInfo)}
                  </TableCell>
                  <TableCell sx={{ maxWidth: 240, verticalAlign: 'top' }}>
                    {renderEmailAddresses(person, familyCanViewContactInfo)}
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
