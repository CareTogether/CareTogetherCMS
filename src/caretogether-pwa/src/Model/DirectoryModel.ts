import { useRecoilCallback, useRecoilValue } from "recoil";
import { AddAdultToFamilyCommand, AddChildToFamilyCommand, AddPersonAddress, AddPersonEmailAddress, AddPersonPhoneNumber, Address, Age, DirectoryCommand, CreateVolunteerFamilyWithNewAdultCommand, CustodialRelationship, EmailAddress, EmailAddressType, FamilyAdultRelationshipInfo, Gender, PersonCommand, PhoneNumber, PhoneNumberType, UpdatePersonAddress, UpdatePersonConcerns, UpdatePersonEmailAddress, UpdatePersonName, UpdatePersonNotes, UpdatePersonPhoneNumber, DirectoryClient, NoteCommand, CreateDraftNote, EditDraftNote, ApproveNote, DiscardDraftNote, CreatePartneringFamilyWithNewAdultCommand, FamilyCommand, UploadFamilyDocument, UndoCreatePerson, DeleteUploadedFamilyDocument } from "../GeneratedClient";
import { authenticatingFetch } from "../Auth";
import { currentOrganizationState, currentLocationState } from "./SessionModel";
import { visibleFamiliesData } from "./ModelLoader";

export function usePersonLookup() {
  const visibleFamilies = useRecoilValue(visibleFamiliesData);

  return (familyId?: string, personId?: string) => {
    const family = visibleFamilies.find(family => family.family!.id === familyId);
    const adult = family?.family?.adults?.find(adult => adult.item1!.id === personId);
    const person = adult?.item1 || family?.family?.children?.find(child => child.id === personId);
    return person;
  }
}

export function useUserLookup() {
  const visibleFamilies = useRecoilValue(visibleFamiliesData);

  return (userId?: string) => {
    const person = visibleFamilies.flatMap(family => family.family?.adults).find(adult => adult?.item1?.userId === userId)?.item1;
    return person;
  }
}

export function useFamilyLookup() {
  const visibleFamilies = useRecoilValue(visibleFamiliesData);

  return (familyId?: string) => {
    const family = visibleFamilies.find(family => family.family!.id === familyId);
    return family;
  }
}

function useFamilyCommandCallback<T extends unknown[]>(
  callback: (familyId: string, ...args: T) => Promise<FamilyCommand>) {
  return useRecoilCallback(({snapshot, set}) => {
    const asyncCallback = async (familyId: string, ...args: T) => {
      const organizationId = await snapshot.getPromise(currentOrganizationState);
      const locationId = await snapshot.getPromise(currentLocationState);

      const command = await callback(familyId, ...args);

      const client = new DirectoryClient(process.env.REACT_APP_API_HOST, authenticatingFetch);
      const updatedFamily = await client.submitFamilyCommand(organizationId, locationId, familyId, command);

      set(visibleFamiliesData, current =>
        current.some(currentEntry => currentEntry.family?.id === familyId)
        ? current.map(currentEntry => currentEntry.family?.id === familyId
          ? updatedFamily
          : currentEntry)
        : current.concat(updatedFamily));
      
      return updatedFamily;
    };
    return asyncCallback;
  })
}

function usePersonCommandCallback<T extends unknown[]>(
  callback: (familyId: string, personId: string, ...args: T) => Promise<PersonCommand>) {
  return useRecoilCallback(({snapshot, set}) => {
    const asyncCallback = async (familyId: string, personId: string, ...args: T) => {
      const organizationId = await snapshot.getPromise(currentOrganizationState);
      const locationId = await snapshot.getPromise(currentLocationState);

      const command = await callback(familyId, personId, ...args);

      const client = new DirectoryClient(process.env.REACT_APP_API_HOST, authenticatingFetch);
      const updatedFamily = await client.submitPersonCommand(organizationId, locationId, familyId, command);

      set(visibleFamiliesData, current =>
        current.some(currentEntry => currentEntry.family?.id === familyId)
        ? current.map(currentEntry => currentEntry.family?.id === familyId
          ? updatedFamily
          : currentEntry)
        : current.concat(updatedFamily));
      
      return updatedFamily;
    };
    return asyncCallback;
  })
}

function useDirectoryCommandCallback<T extends unknown[]>(
  callback: (familyId: string, ...args: T) => Promise<DirectoryCommand>) {
  return useRecoilCallback(({snapshot, set}) => {
    const asyncCallback = async (familyId: string, ...args: T) => {
      const organizationId = await snapshot.getPromise(currentOrganizationState);
      const locationId = await snapshot.getPromise(currentLocationState);

      const command = await callback(familyId, ...args);

      const client = new DirectoryClient(process.env.REACT_APP_API_HOST, authenticatingFetch);
      const updatedFamily = await client.submitDirectoryCommand(organizationId, locationId, command);

      set(visibleFamiliesData, current =>
        current.some(currentEntry => currentEntry.family?.id === familyId)
        ? current.map(currentEntry => currentEntry.family?.id === familyId
          ? updatedFamily
          : currentEntry)
        : current.concat(updatedFamily));
      
      return updatedFamily;
    };
    return asyncCallback;
  })
}

function useNoteCommandCallback<T extends unknown[]>(
  callback: (familyId: string, ...args: T) => Promise<NoteCommand>) {
  return useRecoilCallback(({snapshot, set}) => {
    const asyncCallback = async (familyId: string, ...args: T) => {
      const organizationId = await snapshot.getPromise(currentOrganizationState);
      const locationId = await snapshot.getPromise(currentLocationState);

      const command = await callback(familyId, ...args);

      const client = new DirectoryClient(process.env.REACT_APP_API_HOST, authenticatingFetch);
      const updatedFamily = await client.submitNoteCommand(organizationId, locationId, command);

      set(visibleFamiliesData, current =>
        current.some(currentEntry => currentEntry.family?.id === familyId)
        ? current.map(currentEntry => currentEntry.family?.id === familyId
          ? updatedFamily
          : currentEntry)
        : current.concat(updatedFamily));
      
      return updatedFamily;
    };
    return asyncCallback;
  })
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
  const updatePersonName = usePersonCommandCallback(
    async (familyId, personId, firstName: string, lastName: string) => {
      const command = new UpdatePersonName({
        personId: personId
      });
      command.firstName = firstName;
      command.lastName = lastName;
      return command;
    });
  const updatePersonConcerns = usePersonCommandCallback(
    async (familyId, personId, concerns: string | null) => {
      const command = new UpdatePersonConcerns({
        personId: personId
      });
      command.concerns = concerns || undefined;
      return command;
    });
  const updatePersonNotes = usePersonCommandCallback(
    async (familyId, personId, notes: string | null) => {
      const command = new UpdatePersonNotes({
        personId: personId
      });
      command.notes = notes || undefined;
      return command;
    });
  const undoCreatePerson = usePersonCommandCallback(
    async (familyId, personId) => {
      const command = new UndoCreatePerson({
        personId: personId
      });
      return command;
    });
  const addPersonPhoneNumber = usePersonCommandCallback(
    async (familyId, personId, phoneNumber: string, phoneType: PhoneNumberType) => {
      const command = new AddPersonPhoneNumber({
        personId: personId
      });
      command.phoneNumber = new PhoneNumber({ number: phoneNumber, type: phoneType })
      command.isPreferredPhoneNumber = true;
      return command;
    });
  const updatePersonPhoneNumber = usePersonCommandCallback(
    async (familyId, personId, phoneId: string, phoneNumber: string, phoneType: PhoneNumberType) => {
      const command = new UpdatePersonPhoneNumber({
        personId: personId
      });
      command.phoneNumber = new PhoneNumber({ id: phoneId, number: phoneNumber, type: phoneType })
      command.isPreferredPhoneNumber = true;
      return command;
    });
  const addPersonEmailAddress = usePersonCommandCallback(
    async (familyId, personId, emailAddress: string, phoneType: EmailAddressType) => {
      const command = new AddPersonEmailAddress({
        personId: personId
      });
      command.emailAddress = new EmailAddress({ address: emailAddress, type: phoneType })
      command.isPreferredEmailAddress = true;
      return command;
    });
  const updatePersonEmailAddress = usePersonCommandCallback(
    async (familyId, personId, phoneId: string, emailAddress: string, phoneType: EmailAddressType) => {
      const command = new UpdatePersonEmailAddress({
        personId: personId
      });
      command.emailAddress = new EmailAddress({ id: phoneId, address: emailAddress, type: phoneType })
      command.isPreferredEmailAddress = true;
      return command;
    });
  const addPersonAddress = usePersonCommandCallback(
    async (familyId, personId, line1: string, line2: string, city: string, state: string, postalCode: string) => {
      const command = new AddPersonAddress({
        personId: personId
      });
      command.address = new Address({ line1: line1, line2: line2, city: city, state: state, postalCode: postalCode })
      command.isCurrentAddress = true;
      return command;
    });
  const updatePersonAddress = usePersonCommandCallback(
    async (familyId, personId, addressId: string,
      line1: string, line2: string, city: string, state: string, postalCode: string) => {
      const command = new UpdatePersonAddress({
        personId: personId
      });
      command.address = new Address({ id: addressId, line1: line1, line2: line2, city: city, state: state, postalCode: postalCode })
      command.isCurrentAddress = true;
      return command;
    });
  const addAdult = useDirectoryCommandCallback(
    async (familyId, firstName: string, lastName: string, gender: Gender, age: Age, ethnicity: string,
        isInHousehold: boolean, relationshipToFamily: string,
        addressLine1: string | null, addressLine2: string | null, city: string | null, state: string | null, postalCode: string | null, country: string | null,
        phoneNumber: string | null, phoneType: PhoneNumberType | null, emailAddress: string | null, emailType: EmailAddressType | null,
        notes?: string, concerns?: string) => {
      const command = new AddAdultToFamilyCommand();
      command.familyId = familyId;
      command.firstName = firstName;
      command.lastName = lastName;
      command.gender = gender;
      command.age = age;
      command.ethnicity = ethnicity;
      command.concerns = concerns;
      command.notes = notes;
      command.familyAdultRelationshipInfo = new FamilyAdultRelationshipInfo({
        isInHousehold: isInHousehold,
        relationshipToFamily: relationshipToFamily
      });
      if (addressLine1 != null) {
        command.address = new Address();
        command.address.line1 = addressLine1;
        command.address.line2 = addressLine2 || undefined;
        command.address.city = city || undefined;
        command.address.state = state || undefined;
        command.address.postalCode = postalCode || undefined;
      }
      if (phoneNumber != null) {
        command.phoneNumber = new PhoneNumber();
        command.phoneNumber.number = phoneNumber;
        command.phoneNumber.type = phoneType || undefined;
      }
      if (emailAddress != null) {
        command.emailAddress = new EmailAddress();
        command.emailAddress.address = emailAddress;
        command.emailAddress.type = emailType || undefined;
      }
      return command;
    });
  const addChild = useDirectoryCommandCallback(
    async (familyId, firstName: string, lastName: string, gender: Gender, age: Age, ethnicity: string,
        custodialRelationships: CustodialRelationship[],
        notes?: string, concerns?: string) => {
      const command = new AddChildToFamilyCommand();
      command.familyId = familyId;
      command.firstName = firstName;
      command.lastName = lastName;
      command.gender = gender;
      command.age = age;
      command.ethnicity = ethnicity;
      command.custodialRelationships = custodialRelationships;
      command.concerns = concerns;
      command.notes = notes;
      return command;
    });
  const createVolunteerFamilyWithNewAdult = useDirectoryCommandCallback(
    async (familyId: string, firstName: string, lastName: string, gender: Gender, age: Age, ethnicity: string,
      isInHousehold: boolean, relationshipToFamily: string,
      addressLine1: string, addressLine2: string | null, city: string, state: string, postalCode: string, country: string,
      phoneNumber: string, phoneType: PhoneNumberType, emailAddress?: string, emailType?: EmailAddressType,
      notes?: string, concerns?: string) => {
      const command = new CreateVolunteerFamilyWithNewAdultCommand();
      command.firstName = firstName;
      command.lastName = lastName;
      command.gender = gender
      command.age = age;
      command.ethnicity = ethnicity;
      command.concerns = concerns;
      command.notes = notes;
      command.familyAdultRelationshipInfo = new FamilyAdultRelationshipInfo({
        isInHousehold: isInHousehold,
        relationshipToFamily: relationshipToFamily
      });
      command.address = new Address();
      command.address.line1 = addressLine1;
      command.address.line2 = addressLine2 === null ? undefined : addressLine2;
      command.address.city = city;
      command.address.state = state;
      command.address.postalCode = postalCode;
      command.phoneNumber = new PhoneNumber();
      command.phoneNumber.number = phoneNumber;
      command.phoneNumber.type = phoneType;
      command.emailAddress = new EmailAddress();
      command.emailAddress.address = emailAddress;
      command.emailAddress.type = emailType;
      return command;
    });
  const createPartneringFamilyWithNewAdult = useDirectoryCommandCallback(
    async (familyId: string, referralOpenedAtUtc: Date, firstName: string, lastName: string, gender: Gender, age: Age, ethnicity: string,
      isInHousehold: boolean, relationshipToFamily: string,
      addressLine1: string, addressLine2: string | null, city: string, state: string, postalCode: string, country: string,
      phoneNumber: string, phoneType: PhoneNumberType, emailAddress?: string, emailType?: EmailAddressType,
      notes?: string, concerns?: string) => {
      const command = new CreatePartneringFamilyWithNewAdultCommand();
      command.referralOpenedAtUtc = referralOpenedAtUtc;
      command.firstName = firstName;
      command.lastName = lastName;
      command.gender = gender
      command.age = age;
      command.ethnicity = ethnicity;
      command.concerns = concerns;
      command.notes = notes;
      command.familyAdultRelationshipInfo = new FamilyAdultRelationshipInfo({
        isInHousehold: isInHousehold,
        relationshipToFamily: relationshipToFamily
      });
      command.address = new Address();
      command.address.line1 = addressLine1;
      command.address.line2 = addressLine2 === null ? undefined : addressLine2;
      command.address.city = city;
      command.address.state = state;
      command.address.postalCode = postalCode;
      command.phoneNumber = new PhoneNumber();
      command.phoneNumber.number = phoneNumber;
      command.phoneNumber.type = phoneType;
      command.emailAddress = new EmailAddress();
      command.emailAddress.address = emailAddress;
      command.emailAddress.type = emailType;
      return command;
    });
  const createDraftNote = useNoteCommandCallback(
    async (familyId, draftNoteContents: string) => {
      const command = new CreateDraftNote({
        familyId: familyId
      });
      command.draftNoteContents = draftNoteContents;
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
    updatePersonName,
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
