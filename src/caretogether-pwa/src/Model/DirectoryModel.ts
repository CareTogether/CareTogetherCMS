import { atom, selector, useRecoilCallback, useRecoilValue } from "recoil";
import { AddAdultToFamilyCommand, AddChildToFamilyCommand, AddPersonAddress, AddPersonEmailAddress, AddPersonPhoneNumber, Address, Age, CompositeRecordsCommand, CreateVolunteerFamilyWithNewAdultCommand, CustodialRelationship, EmailAddress, EmailAddressType, FamilyAdultRelationshipInfo, Gender, PersonCommand, PhoneNumber, PhoneNumberType, UpdatePersonAddress, UpdatePersonConcerns, UpdatePersonEmailAddress, UpdatePersonName, UpdatePersonNotes, UpdatePersonPhoneNumber, RecordsClient, NoteCommand, CreateDraftNote, EditDraftNote, ApproveNote, DiscardDraftNote, CreatePartneringFamilyWithNewAdultCommand, FamilyCommand, UploadFamilyDocument, UndoCreatePerson, DeleteUploadedFamilyDocument, UpdatePersonGender, UpdatePersonAge, UpdatePersonEthnicity, UpdateAdultRelationshipToFamily, CustodialRelationshipType, UpdateCustodialRelationshipType, RemoveCustodialRelationship, ChangePrimaryFamilyContact, FamilyRecordsCommand, PersonRecordsCommand, NoteRecordsCommand, AtomicRecordsCommand, CustomField, UpdateCustomFamilyField, FamilyRecordsAggregate, RecordsAggregate, CommunityRecordsAggregate, CommunityCommand, CommunityRecordsCommand } from "../GeneratedClient";
import { accessTokenFetchQuery, authenticatingFetch } from "../Authentication/AuthenticatedHttp";
import { currentOrganizationState, currentLocationState } from "./SessionModel";
import { currentOrganizationAndLocationIdsQuery, organizationConfigurationData, organizationConfigurationQuery } from "./ConfigurationModel";
import { useLoadable } from "../Hooks/useLoadable";

export const recordsClientQuery = selector({
  key: 'directoryClientQuery',
  get: ({get}) => {
    const accessTokenFetch = get(accessTokenFetchQuery);
    return new RecordsClient(process.env.REACT_APP_API_HOST, accessTokenFetch);
  }
});

export const visibleAggregatesInitializationQuery = selector({
  key: 'visibleAggregatesInitializationQuery',
  get: async ({get}) => {
    get(organizationConfigurationQuery);
    const {organizationId, locationId} = get(currentOrganizationAndLocationIdsQuery);
    const recordsClient = get(recordsClientQuery);
    const visibleAggregates = await recordsClient.listVisibleAggregates(organizationId, locationId);
    return visibleAggregates;
  }
});

export function useDataInitialized() {
  return useLoadable(visibleAggregatesInitializationQuery) != null;
}

export const visibleAggregatesData = atom<RecordsAggregate[]>({
  key: 'visibleAggregatesData',
  default: []
});

export const visibleFamiliesQuery = selector({
  key: 'visibleFamiliesQuery',
  get: ({get}) => {
    const visibleAggregates = get(visibleAggregatesData);
    return visibleAggregates.filter(aggregate => aggregate instanceof FamilyRecordsAggregate).map(aggregate =>
      (aggregate as FamilyRecordsAggregate).family!);
  }
});

export const visibleCommunitiesQuery = selector({
  key: 'visibleCommunitiesQuery',
  get: ({get}) => {
    const visibleAggregates = get(visibleAggregatesData);
    return visibleAggregates.filter(aggregate => aggregate instanceof CommunityRecordsAggregate).map(aggregate =>
      (aggregate as CommunityRecordsAggregate).community!);
  }
});

export function usePersonLookup() {
  const visibleFamilies = useRecoilValue(visibleFamiliesQuery);

  return (familyId?: string, personId?: string) => {
    const family = visibleFamilies.find(family => family.family!.id === familyId);
    const adult = family?.family?.adults?.find(adult => adult.item1!.id === personId);
    const person = adult?.item1 || family?.family?.children?.find(child => child.id === personId);
    return person;
  }
}

export function usePersonAndFamilyLookup() {
  const visibleFamilies = useRecoilValue(visibleFamiliesQuery);

  return (personId?: string) => {
    const family = visibleFamilies.find(family =>
      family.family!.adults!.some(adult => adult.item1!.id === personId) ||
      family.family!.children!.some(child => child.id === personId));
    const adult = family?.family?.adults?.find(adult => adult.item1!.id === personId);
    const person = adult?.item1 || family?.family?.children?.find(child => child.id === personId);
    return { family: family?.family, person: person };
  }
}

export function useUserLookup() {
  const visibleFamilies = useRecoilValue(visibleFamiliesQuery);
  const organizationConfig = useRecoilValue(organizationConfigurationData);

  return (userId?: string) => {
    const staticUserAssignment = organizationConfig.users![userId!];
    const staticPersonId = staticUserAssignment?.personId;

    const person = visibleFamilies.flatMap(family => family.family?.adults).find(adult =>
      adult?.item1?.id === staticPersonId)?.item1;
    return person;
  }
}

export function useFamilyLookup() {
  const visibleFamilies = useRecoilValue(visibleFamiliesQuery);

  return (familyId?: string) => {
    const family = visibleFamilies.find(family => family.family!.id === familyId);
    return family;
  }
}

export function useCommunityLookup() {
  const visibleCommunities = useRecoilValue(visibleCommunitiesQuery);

  return (communityId?: string) => {
    const community = visibleCommunities.find(community => community.community?.id === communityId);
    return community;
  }
}

export function useAtomicRecordsCommandCallback<T extends unknown[], U extends AtomicRecordsCommand>(
  callback: (aggregateId: string, ...args: T) => Promise<U>) {
  return useRecoilCallback(({snapshot, set}) => {
    const asyncCallback = async (aggregateId: string, ...args: T) => {
      const organizationId = await snapshot.getPromise(currentOrganizationState);
      const locationId = await snapshot.getPromise(currentLocationState);

      const command = await callback(aggregateId, ...args);

      const client = new RecordsClient(process.env.REACT_APP_API_HOST, authenticatingFetch);
      const updatedAggregate = await client.submitAtomicRecordsCommand(organizationId, locationId, command);

      set(visibleAggregatesData, current => 
        current.some(currentEntry => currentEntry.id === updatedAggregate.id && currentEntry.constructor === updatedAggregate.constructor)
        ? current.map(currentEntry => currentEntry.id === updatedAggregate.id && currentEntry.constructor === updatedAggregate.constructor
          ? updatedAggregate
          : currentEntry)
        : current.concat(updatedAggregate));
    };
    return asyncCallback;
  })
}

function useCompositeRecordsCommandCallback<T extends unknown[]>(
  callback: (aggregateId: string, ...args: T) => Promise<CompositeRecordsCommand>) {
  return useRecoilCallback(({snapshot, set}) => {
    const asyncCallback = async (aggregateId: string, ...args: T) => {
      const organizationId = await snapshot.getPromise(currentOrganizationState);
      const locationId = await snapshot.getPromise(currentLocationState);

      const command = await callback(aggregateId, ...args);

      const client = new RecordsClient(process.env.REACT_APP_API_HOST, authenticatingFetch);
      const updatedAggregate = await client.submitCompositeRecordsCommand(organizationId, locationId, command);
      
      set(visibleAggregatesData, current =>
        current.some(currentEntry => currentEntry.id === updatedAggregate.id)
        ? current.map(currentEntry => currentEntry.id === updatedAggregate.id
          ? updatedAggregate
          : currentEntry)
        : current.concat(updatedAggregate));
    };
    return asyncCallback;
  })
}

function useFamilyCommandCallback<T extends unknown[]>(
  callback: (familyId: string, ...args: T) => Promise<FamilyCommand>) {
  return useAtomicRecordsCommandCallback(async (familyId, ...args: T) => {
    var command = new FamilyRecordsCommand();
    command.command = await callback(familyId, ...args);
    return command;
  });
}

function usePersonCommandCallback<T extends unknown[]>(
  callback: (familyId: string, ...args: T) => Promise<PersonCommand>) {
  return useAtomicRecordsCommandCallback(async (familyId, ...args: T) => {
    var command = new PersonRecordsCommand();
    command.command = await callback(familyId, ...args);
    command.familyId = familyId;
    return command;
  });
}

function useNoteCommandCallback<T extends unknown[]>(
  callback: (familyId: string, ...args: T) => Promise<NoteCommand>) {
  return useAtomicRecordsCommandCallback(async (familyId, ...args: T) => {
    var command = new NoteRecordsCommand();
    command.command = await callback(familyId, ...args);
    return command;
  });
}

export function useCommunityCommand<TCommand extends CommunityCommand, TArgs extends unknown[]>(
  callback: (communityId: string, ...args: TArgs) => TCommand) {
  return useAtomicRecordsCommandCallback(async (communityId, ...args: TArgs) => {
    var command = new CommunityRecordsCommand();
    command.command = callback(communityId, ...args);
    return command;
  });
}

export function useDirectoryModel() {
  const uploadFamilyDocument = useFamilyCommandCallback(
    async (familyId, uploadedDocumentId: string, uploadedFileName: string) => {
      const command = new UploadFamilyDocument({
        familyId: familyId
      });
      command.uploadedDocumentId = uploadedDocumentId;
      command.uploadedFileName = uploadedFileName;
      return command;
    });
  const deleteUploadedFamilyDocument = useFamilyCommandCallback(
    async (familyId, uploadedDocumentId: string) => {
      const command = new DeleteUploadedFamilyDocument({
        familyId: familyId
      });
      command.uploadedDocumentId = uploadedDocumentId;
      return command;
    });
  const updateAdultRelationshipToFamily = useFamilyCommandCallback(
    async (familyId, adultPersonId: string, relationship: FamilyAdultRelationshipInfo) => {
      const command = new UpdateAdultRelationshipToFamily({
        familyId: familyId
      });
      command.adultPersonId = adultPersonId;
      command.relationshipToFamily = relationship;
      return command;
    });
  const upsertCustodialRelationship = useFamilyCommandCallback(
    async (familyId, childId: string, adultId: string, type: CustodialRelationshipType) => {
      const command = new UpdateCustodialRelationshipType({
        familyId: familyId
      });
      command.childPersonId = childId;
      command.adultPersonId = adultId;
      command.type = type;
      return command;
    });
  const removeCustodialRelationship = useFamilyCommandCallback(
    async (familyId, childId: string, adultId: string) => {
      const command = new RemoveCustodialRelationship({
        familyId: familyId
      });
      command.childPersonId = childId;
      command.adultPersonId = adultId;
      return command;
    });
  const updatePrimaryFamilyContact = useFamilyCommandCallback(
    async (familyId, adultId: string) => {
      const command = new ChangePrimaryFamilyContact({
        familyId: familyId
      });
      command.adultId = adultId;
      return command;
    });
  const updateCustomFamilyField = useFamilyCommandCallback(
    async (familyId: string, customField: CustomField,
      value: boolean | string | null) => {
      const command = new UpdateCustomFamilyField({
        familyId: familyId
      });
      command.completedCustomFieldId = crypto.randomUUID();
      command.customFieldName = customField.name;
      command.customFieldType = customField.type;
      command.value = value;
      return command;
    });
  const updatePersonName = usePersonCommandCallback(
    async (familyId, personId: string, firstName: string, lastName: string) => {
      const command = new UpdatePersonName({
        personId: personId
      });
      command.firstName = firstName;
      command.lastName = lastName;
      return command;
    });
  const updatePersonGender = usePersonCommandCallback(
    async (familyId, personId: string, gender: Gender) => {
      const command = new UpdatePersonGender({
        personId: personId
      });
      command.gender = gender;
      return command;
    });
  const updatePersonAge = usePersonCommandCallback(
    async (familyId, personId: string, age: Age) => {
      const command = new UpdatePersonAge({
        personId: personId
      });
      command.age = age;
      return command;
    });
  const updatePersonEthnicity = usePersonCommandCallback(
    async (familyId, personId: string, ethnicity: string) => {
      const command = new UpdatePersonEthnicity({
        personId: personId
      });
      command.ethnicity = ethnicity;
      return command;
    });
  const updatePersonConcerns = usePersonCommandCallback(
    async (familyId, personId: string, concerns: string | null) => {
      const command = new UpdatePersonConcerns({
        personId: personId
      });
      command.concerns = concerns || undefined;
      return command;
    });
  const updatePersonNotes = usePersonCommandCallback(
    async (familyId, personId: string, notes: string | null) => {
      const command = new UpdatePersonNotes({
        personId: personId
      });
      command.notes = notes || undefined;
      return command;
    });
  const undoCreatePerson = usePersonCommandCallback(
    async (familyId, personId: string) => {
      const command = new UndoCreatePerson({
        personId: personId
      });
      return command;
    });
  const addPersonPhoneNumber = usePersonCommandCallback(
    async (familyId, personId: string, phoneNumber: string, phoneType: PhoneNumberType, isPreferred: boolean) => {
      const command = new AddPersonPhoneNumber({
        personId: personId
      });
      command.phoneNumber = new PhoneNumber({ id: crypto.randomUUID(), number: phoneNumber, type: phoneType })
      command.isPreferredPhoneNumber = isPreferred;
      return command;
    });
  const updatePersonPhoneNumber = usePersonCommandCallback(
    async (familyId, personId: string, phoneId: string, phoneNumber: string, phoneType: PhoneNumberType, isPreferred: boolean) => {
      const command = new UpdatePersonPhoneNumber({
        personId: personId
      });
      command.phoneNumber = new PhoneNumber({ id: phoneId, number: phoneNumber, type: phoneType })
      command.isPreferredPhoneNumber = isPreferred;
      return command;
    });
  const addPersonEmailAddress = usePersonCommandCallback(
    async (familyId, personId: string, emailAddress: string, phoneType: EmailAddressType, isPreferred: boolean) => {
      const command = new AddPersonEmailAddress({
        personId: personId
      });
      command.emailAddress = new EmailAddress({ id: crypto.randomUUID(), address: emailAddress, type: phoneType })
      command.isPreferredEmailAddress = isPreferred;
      return command;
    });
  const updatePersonEmailAddress = usePersonCommandCallback(
    async (familyId, personId: string, phoneId: string, emailAddress: string, phoneType: EmailAddressType, isPreferred: boolean) => {
      const command = new UpdatePersonEmailAddress({
        personId: personId
      });
      command.emailAddress = new EmailAddress({ id: phoneId, address: emailAddress, type: phoneType })
      command.isPreferredEmailAddress = isPreferred;
      return command;
    });
  const addPersonAddress = usePersonCommandCallback(
    async (familyId, personId: string, line1: string, line2: string | null, city: string, state: string, postalCode: string, isCurrent: boolean) => {
      const command = new AddPersonAddress({
        personId: personId
      });
      command.address = new Address({ id: crypto.randomUUID(), line1: line1, line2: line2 == null ? undefined : line2, city: city, state: state, postalCode: postalCode })
      command.isCurrentAddress = isCurrent;
      return command;
    });
  const updatePersonAddress = usePersonCommandCallback(
    async (familyId, personId: string, addressId: string,
      line1: string, line2: string | null, city: string, state: string, postalCode: string, isCurrent: boolean) => {
      const command = new UpdatePersonAddress({
        personId: personId
      });
      command.address = new Address({ id: addressId, line1: line1, line2: line2 == null ? undefined : line2, city: city, state: state, postalCode: postalCode })
      command.isCurrentAddress = isCurrent;
      return command;
    });
  const addAdult = useCompositeRecordsCommandCallback(
    async (familyId, firstName: string, lastName: string, gender: Gender | null, age: Age | null, ethnicity: string | null,
        isInHousehold: boolean, relationshipToFamily: string,
        addressLine1: string | null, addressLine2: string | null, city: string | null, state: string | null, postalCode: string | null, country: string | null,
        phoneNumber: string | null, phoneType: PhoneNumberType | null, emailAddress: string | null, emailType: EmailAddressType | null,
        notes?: string, concerns?: string) => {
      const command = new AddAdultToFamilyCommand();
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
        relationshipToFamily: relationshipToFamily
      });
      if (addressLine1 != null) {
        command.address = new Address();
        command.address.id = crypto.randomUUID();
        command.address.line1 = addressLine1;
        command.address.line2 = addressLine2 || undefined;
        command.address.city = city || undefined;
        command.address.state = state || undefined;
        command.address.postalCode = postalCode || undefined;
      }
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
    });
  const addChild = useCompositeRecordsCommandCallback(
    async (familyId, firstName: string, lastName: string, gender: Gender | null, age: Age | null, ethnicity: string | null,
        custodialRelationships: CustodialRelationship[],
        notes?: string, concerns?: string) => {
      const command = new AddChildToFamilyCommand();
      command.familyId = familyId;
      command.personId = crypto.randomUUID();
      command.firstName = firstName;
      command.lastName = lastName;
      command.gender = gender == null ? undefined : gender;
      command.age = age == null ? undefined : age;
      command.ethnicity = ethnicity || undefined;
      command.custodialRelationships = custodialRelationships.map(cr => {
        cr.childId = command.personId;
        return cr;
      });
      command.concerns = concerns;
      command.notes = notes;
      return command;
    });
  const createVolunteerFamilyWithNewAdult = useCompositeRecordsCommandCallback(
    async (familyId: string, firstName: string, lastName: string, gender: Gender | null, age: Age | null, ethnicity: string | null,
      isInHousehold: boolean, relationshipToFamily: string,
      addressLine1: string | null, addressLine2: string | null, city: string | null, state: string | null, postalCode: string | null, country: string | null,
      phoneNumber: string | null, phoneType: PhoneNumberType | null, emailAddress: string | null, emailType: EmailAddressType | null,
      notes?: string, concerns?: string) => {
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
        relationshipToFamily: relationshipToFamily
      });
      if (addressLine1 != null) {
        command.address = new Address();
        command.address.id = crypto.randomUUID();
        command.address.line1 = addressLine1;
        command.address.line2 = addressLine2 || undefined;
        command.address.city = city || undefined;
        command.address.state = state || undefined;
        command.address.postalCode = postalCode || undefined;
      }
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
    });
  const createPartneringFamilyWithNewAdult = useCompositeRecordsCommandCallback(
    async (familyId: string, referralOpenedAtUtc: Date, firstName: string, lastName: string, gender: Gender | null, age: Age | null, ethnicity: string | null,
      isInHousehold: boolean, relationshipToFamily: string,
      addressLine1: string | null, addressLine2: string | null, city: string | null, state: string | null, postalCode: string | null, country: string | null,
      phoneNumber: string | null, phoneType: PhoneNumberType | null, emailAddress: string | null, emailType: EmailAddressType | null,
      notes?: string, concerns?: string) => {
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
        relationshipToFamily: relationshipToFamily
      });
      if (addressLine1 != null) {
        command.address = new Address();
        command.address.id = crypto.randomUUID();
        command.address.line1 = addressLine1;
        command.address.line2 = addressLine2 || undefined;
        command.address.city = city || undefined;
        command.address.state = state || undefined;
        command.address.postalCode = postalCode || undefined;
      }
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
    });
  const createDraftNote = useNoteCommandCallback(
    async (familyId, noteId: string, draftNoteContents: string) => {
      const command = new CreateDraftNote({
        familyId: familyId,
        noteId: noteId
      });
      command.draftNoteContents = draftNoteContents;
      command.noteId = noteId;
      return command;
    });
  const editDraftNote = useNoteCommandCallback(
    async (familyId, noteId: string, draftNoteContents: string) => {
      const command = new EditDraftNote({
        familyId: familyId,
        noteId: noteId
      });
      command.draftNoteContents = draftNoteContents;
      return command;
    });
  const discardDraftNote = useNoteCommandCallback(
    async (familyId, noteId: string) => {
      const command = new DiscardDraftNote({
        familyId: familyId,
        noteId: noteId
      });
      return command;
    });
  const approveNote = useNoteCommandCallback(
    async (familyId, noteId: string, finalizedNoteContents: string) => {
      const command = new ApproveNote({
        familyId: familyId,
        noteId: noteId
      });
      command.finalizedNoteContents = finalizedNoteContents;
      return command;
    });
  
  return {
    uploadFamilyDocument,
    deleteUploadedFamilyDocument,
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
    approveNote
  };
}
