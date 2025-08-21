import { useRecoilCallback, useRecoilValue } from 'recoil';
import {
  AddAdultToFamilyCommand,
  AddChildToFamilyCommand,
  AddPersonAddress,
  AddPersonEmailAddress,
  AddPersonPhoneNumber,
  Address,
  Age,
  CompositeRecordsCommand,
  CreateVolunteerFamilyWithNewAdultCommand,
  CustodialRelationship,
  EmailAddress,
  EmailAddressType,
  FamilyAdultRelationshipInfo,
  Gender,
  PersonCommand,
  PhoneNumber,
  PhoneNumberType,
  UpdatePersonAddress,
  UpdatePersonConcerns,
  UpdatePersonEmailAddress,
  UpdatePersonName,
  UpdatePersonNotes,
  UpdatePersonPhoneNumber,
  NoteCommand,
  CreateDraftNote,
  EditDraftNote,
  ApproveNote,
  DiscardDraftNote,
  CreatePartneringFamilyWithNewAdultCommand,
  FamilyCommand,
  UploadFamilyDocument,
  UndoCreatePerson,
  DeleteUploadedFamilyDocument,
  UpdatePersonGender,
  UpdatePersonAge,
  UpdatePersonEthnicity,
  UpdateAdultRelationshipToFamily,
  CustodialRelationshipType,
  UpdateCustodialRelationshipType,
  RemoveCustodialRelationship,
  ChangePrimaryFamilyContact,
  FamilyRecordsCommand,
  PersonRecordsCommand,
  NoteRecordsCommand,
  AtomicRecordsCommand,
  CustomField,
  UpdateCustomFamilyField,
  CommunityCommand,
  CommunityRecordsCommand,
  ConvertChildToAdult,
  UndoCreateFamily,
} from '../GeneratedClient';
import { api } from '../Api/Api';
import {
  selectedLocationContextState,
  visibleAggregatesState,
  visibleCommunitiesQuery,
  visibleFamiliesQuery,
} from './Data';

export function usePersonLookup() {
  const visibleFamilies = useRecoilValue(visibleFamiliesQuery);

  return (familyId?: string, personId?: string) => {
    const family = visibleFamilies.find(
      (family) => family.family!.id === familyId
    );
    const adult = family?.family?.adults?.find(
      (adult) => adult.item1!.id === personId
    );
    const person =
      adult?.item1 ||
      family?.family?.children?.find((child) => child.id === personId);
    return person;
  };
}

export function usePersonAndFamilyLookup() {
  const visibleFamilies = useRecoilValue(visibleFamiliesQuery);

  return (personId?: string) => {
    const family = visibleFamilies.find(
      (family) =>
        family.family!.adults!.some((adult) => adult.item1!.id === personId) ||
        family.family!.children!.some((child) => child.id === personId)
    );
    const adult = family?.family?.adults?.find(
      (adult) => adult.item1!.id === personId
    );
    const person =
      adult?.item1 ||
      family?.family?.children?.find((child) => child.id === personId);
    return { family: family?.family, person: person };
  };
}

export function useUserLookup() {
  const visibleFamilies = useRecoilValue(visibleFamiliesQuery);

  return (userId?: string) => {
    const userFamily = visibleFamilies.filter((family) =>
      family.users?.find((user) => user.userId === userId)
    );
    if (userFamily.length > 0) {
      const userPersonInfo = userFamily[0].users?.find(
        (user) => user.userId === userId
      );
      if (userPersonInfo) {
        return userFamily[0].family?.adults?.find(
          (adult) => adult.item1?.id === userPersonInfo.personId
        )?.item1;
      }
    } else {
      return undefined;
    }
  };
}

export function useFamilyLookup() {
  const visibleFamilies = useRecoilValue(visibleFamiliesQuery);

  return (familyId?: string) => {
    const family = visibleFamilies.find(
      (family) => family.family!.id === familyId
    );
    return family;
  };
}

export function useCommunityLookup() {
  const visibleCommunities = useRecoilValue(visibleCommunitiesQuery);

  return (communityId?: string) => {
    const community = visibleCommunities.find(
      (community) => community.community?.id === communityId
    );
    return community;
  };
}

export function useAtomicRecordsCommandCallback<
  T extends unknown[],
  U extends AtomicRecordsCommand,
>(callback: (aggregateId: string, ...args: T) => Promise<U>) {
  return useRecoilCallback(({ snapshot, set }) => {
    const asyncCallback = async (aggregateId: string, ...args: T) => {
      const { organizationId, locationId } = await snapshot.getPromise(
        selectedLocationContextState
      );

      const command = await callback(aggregateId, ...args);

      const updatedAggregates = await api.records.submitAtomicRecordsCommand(
        organizationId,
        locationId,
        command
      );

      for (const updatedAggregate of updatedAggregates) {
        set(visibleAggregatesState, (current) =>
          updatedAggregate == null
            ? current.filter((currentEntry) => currentEntry.id !== aggregateId)
            : current.some(
                  (currentEntry) =>
                    currentEntry.id === updatedAggregate.id &&
                    currentEntry.constructor === updatedAggregate.constructor
                )
              ? current.map((currentEntry) =>
                  currentEntry.id === updatedAggregate.id &&
                  currentEntry.constructor === updatedAggregate.constructor
                    ? updatedAggregate
                    : currentEntry
                )
              : current.concat(updatedAggregate)
        );
      }
    };
    return asyncCallback;
  });
}

function useCompositeRecordsCommandCallback<T extends unknown[]>(
  callback: (
    aggregateId: string,
    ...args: T
  ) => Promise<CompositeRecordsCommand>
) {
  return useRecoilCallback(({ snapshot, set }) => {
    const asyncCallback = async (aggregateId: string, ...args: T) => {
      const { organizationId, locationId } = await snapshot.getPromise(
        selectedLocationContextState
      );

      const command = await callback(aggregateId, ...args);

      const updatedAggregate = await api.records.submitCompositeRecordsCommand(
        organizationId,
        locationId,
        command
      );

      set(visibleAggregatesState, (current) =>
        updatedAggregate == null
          ? current.filter((currentEntry) => currentEntry.id !== aggregateId)
          : current.some((currentEntry) => currentEntry.id === aggregateId)
            ? current.map((currentEntry) =>
                currentEntry.id === aggregateId
                  ? updatedAggregate
                  : currentEntry
              )
            : current.concat(updatedAggregate)
      );
    };
    return asyncCallback;
  });
}

function useFamilyCommandCallback<T extends unknown[]>(
  callback: (familyId: string, ...args: T) => Promise<FamilyCommand>
) {
  return useAtomicRecordsCommandCallback(async (familyId, ...args: T) => {
    const command = new FamilyRecordsCommand();
    command.command = await callback(familyId, ...args);
    return command;
  });
}

function usePersonCommandCallback<T extends unknown[]>(
  callback: (familyId: string, ...args: T) => Promise<PersonCommand>
) {
  return useAtomicRecordsCommandCallback(async (familyId, ...args: T) => {
    const command = new PersonRecordsCommand();
    command.command = await callback(familyId, ...args);
    command.familyId = familyId;
    return command;
  });
}

function useNoteCommandCallback<T extends unknown[]>(
  callback: (familyId: string, ...args: T) => Promise<NoteCommand>
) {
  return useAtomicRecordsCommandCallback(async (familyId, ...args: T) => {
    const command = new NoteRecordsCommand();
    command.command = await callback(familyId, ...args);
    return command;
  });
}

export function useCommunityCommand<
  TCommand extends CommunityCommand,
  TArgs extends unknown[],
>(callback: (communityId: string, ...args: TArgs) => TCommand) {
  return useAtomicRecordsCommandCallback(
    async (communityId, ...args: TArgs) => {
      const command = new CommunityRecordsCommand();
      command.command = callback(communityId, ...args);
      return command;
    }
  );
}

export function useDirectoryModel() {
  const undoCreateFamily = useFamilyCommandCallback(async (familyId) => {
    const command = new UndoCreateFamily({
      familyId: familyId,
    });
    return command;
  });
  const uploadFamilyDocument = useFamilyCommandCallback(
    async (familyId, uploadedDocumentId: string, uploadedFileName: string) => {
      const command = UploadFamilyDocument.fromJS({
        familyId: familyId,
      });
      command.uploadedDocumentId = uploadedDocumentId;
      command.uploadedFileName = uploadedFileName;
      return command;
    }
  );
  const deleteUploadedFamilyDocument = useFamilyCommandCallback(
    async (familyId, uploadedDocumentId: string) => {
      const command = DeleteUploadedFamilyDocument.fromJS({
        familyId: familyId,
      });
      command.uploadedDocumentId = uploadedDocumentId;
      return command;
    }
  );
  const convertChildToAdult = useFamilyCommandCallback(
    async (
      familyId,
      personId: string,
      newRelationship: FamilyAdultRelationshipInfo
    ) => {
      const command = ConvertChildToAdult.fromJS({
        familyId: familyId,
      });
      command.personId = personId;
      command.newRelationshipToFamily = newRelationship;
      return command;
    }
  );
  const updateAdultRelationshipToFamily = useFamilyCommandCallback(
    async (
      familyId,
      adultPersonId: string,
      relationship: FamilyAdultRelationshipInfo
    ) => {
      const command = UpdateAdultRelationshipToFamily.fromJS({
        familyId: familyId,
      });
      command.adultPersonId = adultPersonId;
      command.relationshipToFamily = relationship;
      return command;
    }
  );
  const upsertCustodialRelationship = useFamilyCommandCallback(
    async (
      familyId,
      childId: string,
      adultId: string,
      type: CustodialRelationshipType
    ) => {
      const command = UpdateCustodialRelationshipType.fromJS({
        familyId: familyId,
      });
      command.childPersonId = childId;
      command.adultPersonId = adultId;
      command.type = type;
      return command;
    }
  );
  const removeCustodialRelationship = useFamilyCommandCallback(
    async (familyId, childId: string, adultId: string) => {
      const command = RemoveCustodialRelationship.fromJS({
        familyId: familyId,
      });
      command.childPersonId = childId;
      command.adultPersonId = adultId;
      return command;
    }
  );
  const updatePrimaryFamilyContact = useFamilyCommandCallback(
    async (familyId, adultId: string) => {
      const command = ChangePrimaryFamilyContact.fromJS({
        familyId: familyId,
      });
      command.adultId = adultId;
      return command;
    }
  );
  const updateCustomFamilyField = useFamilyCommandCallback(
    async (
      familyId: string,
      customField: CustomField,
      value: boolean | string | null
    ) => {
      const command = UpdateCustomFamilyField.fromJS({
        familyId: familyId,
      });
      command.completedCustomFieldId = crypto.randomUUID();
      command.customFieldName = customField.name;
      command.customFieldType = customField.type;
      command.value = value;
      return command;
    }
  );
  const updatePersonName = usePersonCommandCallback(
    async (
      _familyId,
      personId: string,
      firstName: string,
      lastName: string
    ) => {
      const command = UpdatePersonName.fromJS({
        personId: personId,
      });
      command.firstName = firstName;
      command.lastName = lastName;
      return command;
    }
  );
  const updatePersonGender = usePersonCommandCallback(
    async (_familyId, personId: string, gender: Gender) => {
      const command = UpdatePersonGender.fromJS({
        personId: personId,
      });
      command.gender = gender;
      return command;
    }
  );
  const updatePersonAge = usePersonCommandCallback(
    async (_familyId, personId: string, age: Age) => {
      const command = UpdatePersonAge.fromJS({
        personId: personId,
      });
      command.age = age;
      return command;
    }
  );
  const updatePersonEthnicity = usePersonCommandCallback(
    async (_familyId, personId: string, ethnicity: string) => {
      const command = UpdatePersonEthnicity.fromJS({
        personId: personId,
      });
      command.ethnicity = ethnicity;
      return command;
    }
  );
  const updatePersonConcerns = usePersonCommandCallback(
    async (_familyId, personId: string, concerns: string | null) => {
      const command = UpdatePersonConcerns.fromJS({
        personId: personId,
      });
      command.concerns = concerns || undefined;
      return command;
    }
  );
  const updatePersonNotes = usePersonCommandCallback(
    async (_familyId, personId: string, notes: string | null) => {
      const command = UpdatePersonNotes.fromJS({
        personId: personId,
      });
      command.notes = notes || undefined;
      return command;
    }
  );
  const undoCreatePerson = usePersonCommandCallback(
    async (_familyId, personId: string) => {
      const command = UndoCreatePerson.fromJS({
        personId: personId,
      });
      return command;
    }
  );
  const addPersonPhoneNumber = usePersonCommandCallback(
    async (
      _familyId,
      personId: string,
      phoneNumber: string,
      phoneType: PhoneNumberType,
      isPreferred: boolean
    ) => {
      const command = AddPersonPhoneNumber.fromJS({
        personId: personId,
      });
      command.phoneNumber = PhoneNumber.fromJS({
        id: crypto.randomUUID(),
        number: phoneNumber,
        type: phoneType,
      });
      command.isPreferredPhoneNumber = isPreferred;
      return command;
    }
  );
  const updatePersonPhoneNumber = usePersonCommandCallback(
    async (
      _familyId,
      personId: string,
      phoneId: string,
      phoneNumber: string,
      phoneType: PhoneNumberType,
      isPreferred: boolean
    ) => {
      const command = UpdatePersonPhoneNumber.fromJS({
        personId: personId,
      });
      command.phoneNumber = PhoneNumber.fromJS({
        id: phoneId,
        number: phoneNumber,
        type: phoneType,
      });
      command.isPreferredPhoneNumber = isPreferred;
      return command;
    }
  );
  const addPersonEmailAddress = usePersonCommandCallback(
    async (
      _familyId,
      personId: string,
      emailAddress: string,
      phoneType: EmailAddressType,
      isPreferred: boolean
    ) => {
      const command = AddPersonEmailAddress.fromJS({
        personId: personId,
      });
      command.emailAddress = EmailAddress.fromJS({
        id: crypto.randomUUID(),
        address: emailAddress,
        type: phoneType,
      });
      command.isPreferredEmailAddress = isPreferred;
      return command;
    }
  );
  const updatePersonEmailAddress = usePersonCommandCallback(
    async (
      _familyId,
      personId: string,
      phoneId: string,
      emailAddress: string,
      phoneType: EmailAddressType,
      isPreferred: boolean
    ) => {
      const command = UpdatePersonEmailAddress.fromJS({
        personId: personId,
      });
      command.emailAddress = EmailAddress.fromJS({
        id: phoneId,
        address: emailAddress,
        type: phoneType,
      });
      command.isPreferredEmailAddress = isPreferred;
      return command;
    }
  );
  const addPersonAddress = usePersonCommandCallback(
    async (
      _familyId,
      personId: string,
      address: Address,
      isCurrent: boolean
    ) => {
      const command = AddPersonAddress.fromJS({
        personId: personId,
      });
      command.address = address;
      command.isCurrentAddress = isCurrent;
      return command;
    }
  );
  const updatePersonAddress = usePersonCommandCallback(
    async (
      _familyId,
      personId: string,
      address: Address,
      isCurrent: boolean
    ) => {
      const command = UpdatePersonAddress.fromJS({
        personId: personId,
      });
      command.address = address;
      command.isCurrentAddress = isCurrent;
      return command;
    }
  );
  const addAdult = useCompositeRecordsCommandCallback(
    async (
      familyId,
      firstName: string,
      lastName: string,
      gender: Gender | null,
      age: Age | null,
      ethnicity: string | null,
      isInHousehold: boolean,
      relationshipToFamily: string,
      address: Address | null,
      phoneNumber: string | null,
      phoneType: PhoneNumberType | null,
      emailAddress: string | null,
      emailType: EmailAddressType | null,
      notes?: string,
      concerns?: string
    ) => {
      const command = AddAdultToFamilyCommand.fromJS({
        familyId: familyId,
        personId: crypto.randomUUID(),
        firstName: firstName,
        lastName: lastName,
        gender: gender ?? undefined,
        age: age ?? undefined,
        ethnicity: ethnicity ?? undefined,
        concerns: concerns,
        notes: notes,
        familyAdultRelationshipInfo: FamilyAdultRelationshipInfo.fromJS({
          isInHousehold: isInHousehold,
          relationshipToFamily: relationshipToFamily,
        }),
        address: address ?? undefined,
        phoneNumber: phoneNumber
          ? PhoneNumber.fromJS({
              id: crypto.randomUUID(),
              number: phoneNumber,
              type: phoneType ?? undefined,
            })
          : undefined,
        emailAddress: emailAddress
          ? EmailAddress.fromJS({
              id: crypto.randomUUID(),
              address: emailAddress,
              type: emailType ?? undefined,
            })
          : undefined,
      });

      return command;
    }
  );
  const addChild = useCompositeRecordsCommandCallback(
    async (
      familyId,
      firstName: string,
      lastName: string,
      gender: Gender | null,
      age: Age | null,
      ethnicity: string | null,
      custodialRelationships: CustodialRelationship[],
      notes?: string,
      concerns?: string
    ) => {
      const command = new AddChildToFamilyCommand();
      command.familyId = familyId;
      command.personId = crypto.randomUUID();
      command.firstName = firstName;
      command.lastName = lastName;
      command.gender = gender == null ? undefined : gender;
      command.age = age == null ? undefined : age;
      command.ethnicity = ethnicity || undefined;
      command.custodialRelationships = custodialRelationships.map((cr) => {
        cr.childId = command.personId;
        return cr;
      });
      command.concerns = concerns;
      command.notes = notes;
      return command;
    }
  );
  const createVolunteerFamilyWithNewAdult = useCompositeRecordsCommandCallback(
    async (
      familyId: string,
      firstName: string,
      lastName: string,
      gender: Gender | null,
      age: Age | null,
      ethnicity: string | null,
      isInHousehold: boolean,
      relationshipToFamily: string,
      address: Address | null,
      phoneNumber: string | null,
      phoneType: PhoneNumberType | null,
      emailAddress: string | null,
      emailType: EmailAddressType | null,
      notes?: string,
      concerns?: string
    ) => {
      const command = new CreateVolunteerFamilyWithNewAdultCommand();
      command.familyId = familyId;
      command.personId = crypto.randomUUID();
      command.firstName = firstName;
      command.lastName = lastName;
      command.gender = gender == null ? undefined : gender;
      command.age = age == null ? undefined : age;
      command.ethnicity = ethnicity || undefined;
      command.concerns = concerns;
      command.notes = notes;
      command.familyAdultRelationshipInfo = new FamilyAdultRelationshipInfo({
        isInHousehold: isInHousehold,
        relationshipToFamily: relationshipToFamily,
      });
      command.address = address == null ? undefined : address;
      if (phoneNumber != null) {
        command.phoneNumber = new PhoneNumber();
        command.phoneNumber.id = crypto.randomUUID();
        command.phoneNumber.number = phoneNumber;
        command.phoneNumber.type = phoneType == null ? undefined : phoneType;
      }
      if (emailAddress != null) {
        command.emailAddress = new EmailAddress();
        command.emailAddress.id = crypto.randomUUID();
        command.emailAddress.address = emailAddress;
        command.emailAddress.type = emailType == null ? undefined : emailType;
      }
      return command;
    }
  );
  const createPartneringFamilyWithNewAdult = useCompositeRecordsCommandCallback(
    async (
      familyId: string,
      referralOpenedAtUtc: Date,
      firstName: string,
      lastName: string,
      gender: Gender | null,
      age: Age | null,
      ethnicity: string | null,
      isInHousehold: boolean,
      relationshipToFamily: string,
      address: Address | null,
      phoneNumber: string | null,
      phoneType: PhoneNumberType | null,
      emailAddress: string | null,
      emailType: EmailAddressType | null,
      notes?: string,
      concerns?: string
    ) => {
      const command = new CreatePartneringFamilyWithNewAdultCommand();
      command.familyId = familyId;
      command.personId = crypto.randomUUID();
      command.referralId = crypto.randomUUID();
      command.referralOpenedAtUtc = referralOpenedAtUtc;
      command.firstName = firstName;
      command.lastName = lastName;
      command.gender = gender == null ? undefined : gender;
      command.age = age == null ? undefined : age;
      command.ethnicity = ethnicity || undefined;
      command.concerns = concerns;
      command.notes = notes;
      command.familyAdultRelationshipInfo = new FamilyAdultRelationshipInfo({
        isInHousehold: isInHousehold,
        relationshipToFamily: relationshipToFamily,
      });
      command.address = address == null ? undefined : address;
      if (phoneNumber != null) {
        command.phoneNumber = new PhoneNumber();
        command.phoneNumber.id = crypto.randomUUID();
        command.phoneNumber.number = phoneNumber;
        command.phoneNumber.type = phoneType == null ? undefined : phoneType;
      }
      if (emailAddress != null) {
        command.emailAddress = new EmailAddress();
        command.emailAddress.id = crypto.randomUUID();
        command.emailAddress.address = emailAddress;
        command.emailAddress.type = emailType == null ? undefined : emailType;
      }
      return command;
    }
  );
  const createDraftNote = useNoteCommandCallback(
    async (
      familyId,
      noteId: string,
      draftNoteContents: string,
      backdatedTimestampLocal?: Date,
      accessLevel?: string
    ) => {
      const command = new CreateDraftNote({
        familyId: familyId,
        noteId: noteId,
      });
      command.draftNoteContents = draftNoteContents;
      command.noteId = noteId;
      command.backdatedTimestampUtc = backdatedTimestampLocal;
      command.accessLevel = accessLevel;
      return command;
    }
  );
  const editDraftNote = useNoteCommandCallback(
    async (
      familyId,
      noteId: string,
      draftNoteContents: string,
      backdatedTimestampLocal?: Date,
      accessLevel?: string
    ) => {
      const command = new EditDraftNote({
        familyId: familyId,
        noteId: noteId,
      });
      command.draftNoteContents = draftNoteContents;
      command.backdatedTimestampUtc = backdatedTimestampLocal;
      command.accessLevel = accessLevel;
      return command;
    }
  );
  const discardDraftNote = useNoteCommandCallback(
    async (familyId, noteId: string) => {
      const command = new DiscardDraftNote({
        familyId: familyId,
        noteId: noteId,
      });
      return command;
    }
  );
  const approveNote = useNoteCommandCallback(
    async (
      familyId,
      noteId: string,
      finalizedNoteContents: string,
      backdatedTimestampLocal?: Date,
      accessLevel?: string
    ) => {
      const command = new ApproveNote({
        familyId: familyId,
        noteId: noteId,
      });
      command.finalizedNoteContents = finalizedNoteContents;
      command.backdatedTimestampUtc = backdatedTimestampLocal;
      command.accessLevel = accessLevel;
      return command;
    }
  );

  return {
    undoCreateFamily,
    uploadFamilyDocument,
    deleteUploadedFamilyDocument,
    convertChildToAdult,
    updateAdultRelationshipToFamily,
    upsertCustodialRelationship,
    removeCustodialRelationship,
    updatePrimaryFamilyContact,
    updateCustomFamilyField,
    updatePersonName,
    updatePersonGender,
    updatePersonAge,
    updatePersonEthnicity,
    updatePersonConcerns,
    updatePersonNotes,
    undoCreatePerson,
    addPersonPhoneNumber,
    updatePersonPhoneNumber,
    addPersonEmailAddress,
    updatePersonEmailAddress,
    addPersonAddress,
    updatePersonAddress,
    addAdult,
    addChild,
    createVolunteerFamilyWithNewAdult,
    createPartneringFamilyWithNewAdult,
    createDraftNote,
    editDraftNote,
    discardDraftNote,
    approveNote,
  };
}
