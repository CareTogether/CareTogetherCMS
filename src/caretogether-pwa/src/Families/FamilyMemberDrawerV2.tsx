import CloseIcon from '@mui/icons-material/Close';
import {
  DeleteForever as DeleteForeverIcon,
  EmojiPeople,
  ManageAccounts as ManageAccountsIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  Drawer,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import { differenceInYears } from 'date-fns';
import { useState } from 'react';
import { useRecoilValue } from 'recoil';
import {
  CombinedFamilyInfo,
  CustodialRelationship,
  CustodialRelationshipType,
  EffectiveLocationPolicy,
  ExactAge,
  FamilyAdultRelationshipInfo,
  Gender,
  Permission,
  Person,
} from '../GeneratedClient';
import { useDialogHandle } from '../Hooks/useDialogHandle';
import { useBackdrop } from '../Hooks/useBackdrop';
import { policyData, useFeatureFlags } from '../Model/ConfigurationModel';
import { useDirectoryModel } from '../Model/DirectoryModel';
import { useFamilyPermissions } from '../Model/SessionModel';
import { useDrawer } from '../Generic/ShellDrawer';
import { FAMILY_MEMBER_CUSTOM_FIELDS_FEATURE_FLAG } from '../featureFlags';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { AddressEditor } from './AddressEditor';
import { AdultFamilyRelationshipEditor } from './AdultFamilyRelationshipEditor';
import { AgeText } from './AgeText';
import { AgeEditor } from './AgeEditor';
import { ChildCustodyRelationshipEditor } from './ChildCustodyRelationshipEditor';
import { ConcernsEditor } from './ConcernsEditor';
import { DateOfBirth } from './DateOfBirth';
import { DeletePersonDialog } from './DeletePersonDialog';
import { EmailAddressEditor } from './EmailAddressEditor';
import { EthnicityEditor } from './EthnicityEditor';
import { FamilyMemberCustomFields } from './FamilyMemberCustomFields';
import type { FamilyMemberRowV2 } from './familyMemberViewModel';
import { GenderEditor } from './GenderEditor';
import { NameEditor } from './NameEditor';
import { NotesEditor } from './NotesEditor';
import { PersonEditorProps } from './PersonEditorProps';
import { personNameString } from './PersonName';
import { PhoneNumberEditor } from './PhoneNumberEditor';
import { ManageUserDrawer } from './ManageUserDrawer';
import { combineCustomFieldPolicies } from './familyMemberCustomFieldPolicies';
import {
  FamilyMemberDrawerDetailFieldV2,
  FamilyMemberDrawerEmptyStateV2,
  FamilyMemberDrawerSectionV2,
} from './FamilyMemberDrawerPresentationV2';

type FamilyMemberDrawerV2Props = {
  family: CombinedFamilyInfo;
  row: FamilyMemberRowV2 | null;
  open: boolean;
  onClose: () => void;
};

const DrawerSection = FamilyMemberDrawerSectionV2;
const EmptyState = FamilyMemberDrawerEmptyStateV2;
const DetailField = FamilyMemberDrawerDetailFieldV2;

function isExactAge(age: unknown): age is ExactAge {
  return age instanceof ExactAge && age.dateOfBirth !== undefined;
}

function isAdultAge(row: FamilyMemberRowV2) {
  return (
    isExactAge(row.person.age) &&
    differenceInYears(new Date(), row.person.age.dateOfBirth) >= 18
  );
}

function genderLabel(gender: Gender | undefined) {
  if (gender === Gender.Male) return 'Male';
  if (gender === Gender.Female) return 'Female';
  if (gender === Gender.SeeNotes) return '(see notes)';
  return undefined;
}

function custodyLabel(relationship?: CustodialRelationship) {
  if (relationship?.type === CustodialRelationshipType.LegalGuardian) {
    return 'legal guardian';
  }

  if (relationship?.type === CustodialRelationshipType.ParentWithCustody) {
    return 'parent with custody';
  }

  if (
    relationship?.type ===
    CustodialRelationshipType.ParentWithCourtAppointedCustody
  ) {
    return 'parent with court-appointed sole custody';
  }

  return 'none';
}

function personLabel(person: Person) {
  return [person.firstName, person.lastName].filter(Boolean).join(' ');
}

function customFieldPoliciesForMember(
  family: CombinedFamilyInfo,
  policy: EffectiveLocationPolicy,
  row: FamilyMemberRowV2
) {
  if (row.personType === 'Adult') {
    return combineCustomFieldPolicies(
      family.partneringFamilyInfo != null
        ? (policy.customFields?.partneringFamily?.adult ?? [])
        : [],
      family.volunteerFamilyInfo != null
        ? (policy.customFields?.volunteerFamily?.adult ?? [])
        : []
    );
  }

  return combineCustomFieldPolicies(
    family.partneringFamilyInfo != null
      ? (policy.customFields?.partneringFamily?.child ?? [])
      : [],
    family.volunteerFamilyInfo != null
      ? (policy.customFields?.volunteerFamily?.child ?? [])
      : []
  );
}

export function FamilyMemberDrawerV2({
  family,
  row,
  open,
  onClose,
}: FamilyMemberDrawerV2Props) {
  const familyId = family.family!.id!;
  const permissions = useFamilyPermissions(family);
  const policy = useRecoilValue(policyData);
  const featureFlags = useFeatureFlags();
  const directoryModel = useDirectoryModel();
  const withBackdrop = useBackdrop();
  const deleteDialogHandle = useDialogHandle();
  const manageUserDrawer = useDrawer();
  const [manageUserRequested, setManageUserRequested] = useState(false);
  const customFieldsEnabled = useFeatureFlagEnabled(
    FAMILY_MEMBER_CUSTOM_FIELDS_FEATURE_FLAG
  );

  if (!row) {
    return (
      <Drawer anchor="right" open={open} onClose={onClose}>
        <Box />
      </Drawer>
    );
  }

  const personEditorProps = { familyId, person: row.person } as PersonEditorProps;
  const adultSource = 'adult' in row.source ? row.source : undefined;
  const childSource = 'child' in row.source ? row.source : undefined;
  const familyAdults =
    family.family?.adults?.flatMap((adult) =>
      adult.item1?.id && adult.item1.active ? [adult.item1] : []
    ) ?? [];
  const customFieldPolicies = customFieldPoliciesForMember(family, policy, row);
  const showCustomFields =
    customFieldsEnabled &&
    row.permissionFlags.canViewCustomFields &&
    customFieldPolicies.length > 0;
  const canManageUser =
    !!adultSource &&
    ((featureFlags?.inviteUser && permissions(Permission.InvitePersonUser)) ||
      permissions(Permission.EditPersonUserStandardRoles) ||
      permissions(Permission.EditPersonUserProtectedRoles));
  const childIsAdult = !!childSource && isAdultAge(row);
  const canConvertToAdult =
    childIsAdult && row.permissionFlags.canConvertChildToAdult;
  const hasManagementActions =
    canManageUser || canConvertToAdult || row.permissionFlags.canDelete;

  async function handleConvertToAdult() {
    if (!childSource) return;

    const confirmConversion = window.confirm(
      `Are you sure you want to convert ${personNameString(childSource.child)} to an adult?`
    );
    if (!confirmConversion) return;

    await withBackdrop(async () => {
      onClose();
      const newFamilyAdultRelationshipInfo = new FamilyAdultRelationshipInfo();
      newFamilyAdultRelationshipInfo.isInHousehold = true;
      newFamilyAdultRelationshipInfo.relationshipToFamily = 'Adult Child';
      await directoryModel.convertChildToAdult(
        familyId,
        childSource.child.id!,
        newFamilyAdultRelationshipInfo
      );
    });
  }

  function openManageUser() {
    setManageUserRequested(true);
    manageUserDrawer.openDrawer();
  }

  function closeManageUser() {
    setManageUserRequested(false);
    manageUserDrawer.closeDrawer();
  }

  return (
    <>
      <Drawer
        anchor="right"
        aria-labelledby="family-member-drawer-title"
        open={open}
        onClose={onClose}
        slotProps={{
          paper: {
            sx: {
              width: { xs: '100%', sm: 560, md: 680 },
              p: 2,
              pt: { xs: 7, sm: 8, md: 6 },
            },
          },
        }}
      >
        <Stack spacing={2}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 1,
            }}
          >
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Box
                sx={{
                  alignItems: 'flex-start',
                  display: 'flex',
                  gap: 1,
                  justifyContent: 'flex-start',
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    color="text.secondary"
                    sx={{ textTransform: 'uppercase' }}
                    variant="caption"
                  >
                    Family Member
                  </Typography>
                  <Typography
                    className="ph-unmask"
                    id="family-member-drawer-title"
                    variant="h5"
                  >
                    {row.displayName}
                  </Typography>
                  <Box
                    sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}
                  >
                    <Chip label={row.personType} size="small" />
                    {childIsAdult && (
                      <Chip
                        color="error"
                        label="No longer under 18!"
                        size="small"
                      />
                    )}
                    {row.householdStatusLabel && (
                      <Chip label={row.householdStatusLabel} size="small" />
                    )}
                    {row.userIndicator && (
                      <Chip
                        color="info"
                        label={row.userIndicator}
                        size="small"
                      />
                    )}
                  </Box>
                </Box>
              </Box>
            </Box>
            <IconButton aria-label="Close family member drawer" onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            }}
          >
            <Stack spacing={2}>
              <DrawerSection title="Basic Information">
                {row.permissionFlags.canEdit ? (
                  <>
                    <NameEditor {...personEditorProps} />
                    <GenderEditor {...personEditorProps} />
                    <AgeEditor {...personEditorProps} />
                    <EthnicityEditor {...personEditorProps} />
                  </>
                ) : (
                  <Stack spacing={1}>
                    <DetailField label="Name">{row.displayName}</DetailField>
                    <DetailField label="Age">
                      <AgeText age={row.person.age} />
                    </DetailField>
                    <DateOfBirth age={row.person.age} permissions={permissions} />
                    <DetailField label="Gender">
                      {genderLabel(row.person.gender)}
                    </DetailField>
                    <DetailField label="Ethnicity">
                      {row.person.ethnicity}
                    </DetailField>
                  </Stack>
                )}
              </DrawerSection>

              {adultSource && (
                <DrawerSection title="Relationship">
                  {row.permissionFlags.canEdit ? (
                    <AdultFamilyRelationshipEditor
                      relationship={adultSource.adult.item2!}
                      {...personEditorProps}
                    />
                  ) : (
                    <Stack spacing={1}>
                      <DetailField label="Relationship">
                        {adultSource.adult.item2?.relationshipToFamily}
                      </DetailField>
                      <DetailField label="Household">
                        {adultSource.adult.item2?.isInHousehold
                          ? 'In Household'
                          : 'Not in household'}
                      </DetailField>
                    </Stack>
                  )}
                </DrawerSection>
              )}

              {childSource && (
                <DrawerSection
                  title="Custody"
                  description="Family adults and their custodial relationship to this child."
                >
                  {familyAdults.length === 0 ? (
                    <EmptyState>No active adults in this family.</EmptyState>
                  ) : row.permissionFlags.canEdit ? (
                    familyAdults.map((adult) => (
                      <ChildCustodyRelationshipEditor
                        key={adult.id!}
                        adult={adult}
                        relationship={childSource.custodialRelationships.find(
                          (relationship) => relationship.personId === adult.id
                        )}
                        {...personEditorProps}
                      />
                    ))
                  ) : (
                    <Stack spacing={1}>
                      {familyAdults.map((adult) => (
                        <DetailField key={adult.id!} label={personLabel(adult)}>
                          {custodyLabel(
                            childSource.custodialRelationships.find(
                              (relationship) =>
                                relationship.personId === adult.id
                            )
                          )}
                        </DetailField>
                      ))}
                    </Stack>
                  )}
                </DrawerSection>
              )}
            </Stack>

            <Stack spacing={2}>
              {row.permissionFlags.canViewContactInfo && (
                <DrawerSection title="Contact Information">
                  <Stack spacing={1.25}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Phone Numbers
                      </Typography>
                      <Stack spacing={1} sx={{ mt: 0.5 }}>
                        {row.person.phoneNumbers?.map((phoneNumber) => (
                          <PhoneNumberEditor
                            key={phoneNumber.id!}
                            phoneNumber={phoneNumber}
                            {...personEditorProps}
                          />
                        ))}
                        {row.permissionFlags.canEditContactInfo ? (
                          <PhoneNumberEditor add {...personEditorProps} />
                        ) : (
                          (row.person.phoneNumbers?.length ?? 0) === 0 && (
                            <EmptyState>No phone numbers.</EmptyState>
                          )
                        )}
                      </Stack>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Email Addresses
                      </Typography>
                      <Stack spacing={1} sx={{ mt: 0.5 }}>
                        {row.person.emailAddresses?.map((emailAddress) => (
                          <EmailAddressEditor
                            key={emailAddress.id!}
                            emailAddress={emailAddress}
                            {...personEditorProps}
                          />
                        ))}
                        {row.permissionFlags.canEditContactInfo ? (
                          <EmailAddressEditor add {...personEditorProps} />
                        ) : (
                          (row.person.emailAddresses?.length ?? 0) === 0 && (
                            <EmptyState>No email addresses.</EmptyState>
                          )
                        )}
                      </Stack>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Addresses
                      </Typography>
                      <Stack spacing={1} sx={{ mt: 0.5 }}>
                        {row.person.addresses?.map((address) => (
                          <AddressEditor
                            key={address.id!}
                            address={address}
                            {...personEditorProps}
                          />
                        ))}
                        {row.permissionFlags.canEditContactInfo ? (
                          <AddressEditor add {...personEditorProps} />
                        ) : (
                          (row.person.addresses?.length ?? 0) === 0 && (
                            <EmptyState>No addresses.</EmptyState>
                          )
                        )}
                      </Stack>
                    </Box>
                  </Stack>
                </DrawerSection>
              )}
            </Stack>
          </Box>

          {row.permissionFlags.canViewNotes && (
            <DrawerSection title="Comments">
              <NotesEditor label="Comments" {...personEditorProps} />
            </DrawerSection>
          )}

          {row.permissionFlags.canViewConcerns && (
            <DrawerSection title="Concerns">
              <ConcernsEditor {...personEditorProps} />
            </DrawerSection>
          )}

          {showCustomFields && (
            <DrawerSection title="Custom Fields">
              <FamilyMemberCustomFields
                familyId={familyId}
                personId={row.person.id!}
                customFieldPolicies={customFieldPolicies}
                completedCustomFields={row.person.completedCustomFields}
              />
            </DrawerSection>
          )}

          {hasManagementActions && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {canManageUser && (
                <Button
                  startIcon={<ManageAccountsIcon />}
                  variant="contained"
                  onClick={openManageUser}
                >
                  Manage User
                </Button>
              )}
              {canConvertToAdult && (
                <Button
                  startIcon={<EmojiPeople />}
                  variant="contained"
                  onClick={() => void handleConvertToAdult()}
                >
                  Convert to Adult
                </Button>
              )}
              {row.permissionFlags.canDelete && (
                <Button
                  color="error"
                  startIcon={<DeleteForeverIcon />}
                  variant="contained"
                  onClick={deleteDialogHandle.openDialog}
                >
                  Delete Person
                </Button>
              )}
            </Box>
          )}
        </Stack>
      </Drawer>

      {deleteDialogHandle.open && (
        <DeletePersonDialog
          key={deleteDialogHandle.key}
          handle={deleteDialogHandle}
          familyId={familyId}
          person={row.person}
        />
      )}

      {adultSource &&
        manageUserRequested &&
        manageUserDrawer.drawerFor(
          <Box sx={{ width: { xs: '100vw', sm: 560, md: 680 }, maxWidth: '100%' }}>
            <ManageUserDrawer
              familyId={familyId}
              adult={adultSource.adult.item1!}
              user={adultSource.user}
              onClose={closeManageUser}
              fullWidth
            />
          </Box>
        )}
    </>
  );
}
