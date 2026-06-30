import CloseIcon from '@mui/icons-material/Close';
import { Box, Drawer, IconButton, Stack, Typography } from '@mui/material';
import {
  CombinedFamilyInfo,
  Permission,
  Person,
  ValueTupleOfPersonAndFamilyAdultRelationshipInfo,
} from '../GeneratedClient';
import type { ReactNode } from 'react';
import { useFamilyIdPermissions } from '../Model/SessionModel';
import { AddressEditor } from './AddressEditor';
import { AdultFamilyRelationshipEditor } from './AdultFamilyRelationshipEditor';
import { AgeEditor } from './AgeEditor';
import { ChildCustodyRelationshipEditor } from './ChildCustodyRelationshipEditor';
import { ConcernsEditor } from './ConcernsEditor';
import { EmailAddressEditor } from './EmailAddressEditor';
import { EthnicityEditor } from './EthnicityEditor';
import { GenderEditor } from './GenderEditor';
import { NameEditor } from './NameEditor';
import { NotesEditor } from './NotesEditor';
import { PersonEditorProps } from './PersonEditorProps';
import { PhoneNumberEditor } from './PhoneNumberEditor';
import type { FamilyMemberRowV2 } from './familyMemberViewModel';

type FamilyMemberDrawerV2Props = {
  familyId: string;
  family: CombinedFamilyInfo;
  row: FamilyMemberRowV2 | null;
  open: boolean;
  onClose: () => void;
};

function Section({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <Stack spacing={1}>
      <Typography color="text.secondary" variant="caption">
        {title}
      </Typography>
      <Stack spacing={1.25}>{children}</Stack>
    </Stack>
  );
}

function adultInfoFor(
  family: CombinedFamilyInfo,
  personId: string
): ValueTupleOfPersonAndFamilyAdultRelationshipInfo | undefined {
  return family.family?.adults?.find((adult) => adult.item1?.id === personId);
}

function familyAdults(family: CombinedFamilyInfo): Person[] {
  return (
    family.family?.adults?.flatMap((adult) =>
      adult.item1?.id ? [adult.item1] : []
    ) ?? []
  );
}

function ContactEditors({
  canEditContact,
  editorProps,
}: {
  canEditContact: boolean;
  editorProps: PersonEditorProps;
}) {
  const { person } = editorProps;

  return (
    <>
      {person.phoneNumbers?.map((phoneNumber) => (
        <PhoneNumberEditor
          key={phoneNumber.id}
          phoneNumber={phoneNumber}
          {...editorProps}
        />
      ))}
      {canEditContact && <PhoneNumberEditor add {...editorProps} />}
      {person.emailAddresses?.map((emailAddress) => (
        <EmailAddressEditor
          key={emailAddress.id}
          emailAddress={emailAddress}
          {...editorProps}
        />
      ))}
      {canEditContact && <EmailAddressEditor add {...editorProps} />}
      {person.addresses?.map((address) => (
        <AddressEditor key={address.id} address={address} {...editorProps} />
      ))}
      {canEditContact && <AddressEditor add {...editorProps} />}
    </>
  );
}

function FamilyMemberDrawerContent({
  family,
  familyId,
  row,
}: {
  family: CombinedFamilyInfo;
  familyId: string;
  row: FamilyMemberRowV2;
}) {
  const permissions = useFamilyIdPermissions(familyId);
  const canEditContact = permissions(Permission.EditPersonContactInfo);
  const editorProps = { familyId, person: row.source } as PersonEditorProps;
  const adultInfo = row.kind === 'adult' ? adultInfoFor(family, row.id) : null;

  return (
    <Stack spacing={2.5}>
      <Section title="Basic Information">
        <NameEditor {...editorProps} />
        <GenderEditor {...editorProps} />
        <AgeEditor {...editorProps} />
        <EthnicityEditor {...editorProps} />
      </Section>

      <Section title="Relationship">
        {adultInfo?.item2 && (
          <AdultFamilyRelationshipEditor
            relationship={adultInfo.item2}
            {...editorProps}
          />
        )}
        {row.kind === 'child' &&
          familyAdults(family).map((adult) => (
            <ChildCustodyRelationshipEditor
              key={adult.id}
              adult={adult}
              relationship={family.family?.custodialRelationships?.find(
                (relationship) =>
                  relationship.childId === row.id &&
                  relationship.personId === adult.id
              )}
              {...editorProps}
            />
          ))}
      </Section>

      {permissions(Permission.ViewPersonContactInfo) && (
        <Section title="Contact">
          <ContactEditors
            canEditContact={canEditContact}
            editorProps={editorProps}
          />
        </Section>
      )}

      <Section title="Additional Information">
        {permissions(Permission.ViewPersonNotes) && (
          <NotesEditor {...editorProps} />
        )}
        {permissions(Permission.ViewPersonConcerns) && (
          <ConcernsEditor {...editorProps} />
        )}
      </Section>
    </Stack>
  );
}

export function FamilyMemberDrawerV2({
  familyId,
  family,
  row,
  open,
  onClose,
}: FamilyMemberDrawerV2Props) {
  return (
    <Drawer
      anchor="right"
      aria-labelledby="family-member-title"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: 500, md: 560 },
            p: 2,
            pt: { xs: 7, sm: 8, md: 6 },
          },
        },
      }}
    >
      {row && (
        <Stack spacing={2.5}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 1,
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography
                color="text.secondary"
                sx={{ textTransform: 'uppercase' }}
                variant="caption"
              >
                Member
              </Typography>
              <Typography
                id="family-member-title"
                className="ph-unmask"
                variant="h5"
              >
                {row.name}
              </Typography>
              <Typography color="text.secondary" variant="body2">
                {row.kind === 'adult' ? 'Adult' : 'Child'}
              </Typography>
            </Box>
            <IconButton aria-label="close family member" onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>

          <FamilyMemberDrawerContent
            family={family}
            familyId={familyId}
            row={row}
          />
        </Stack>
      )}
    </Drawer>
  );
}
