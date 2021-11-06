import { selector, useRecoilCallback } from "recoil";
import { ActionRequirement, AddAdultToFamilyCommand, AddChildToFamilyCommand, AddPersonAddress, AddPersonEmailAddress, AddPersonPhoneNumber, Address, Age, DirectoryCommand, CompleteVolunteerFamilyRequirement, CompleteVolunteerRequirement, CreateVolunteerFamilyWithNewAdultCommand, CustodialRelationship, EmailAddress, EmailAddressType, FamilyAdultRelationshipInfo, Gender, PersonCommand, PhoneNumber, PhoneNumberType, UpdatePersonAddress, UpdatePersonConcerns, UpdatePersonEmailAddress, UpdatePersonName, UpdatePersonNotes, UpdatePersonPhoneNumber, UploadVolunteerFamilyDocument, VolunteerCommand, VolunteersClient, VolunteerFamilyCommand, DirectoryClient, RoleRemovalReason, RemoveVolunteerRole, ResetVolunteerRole, RemoveVolunteerFamilyRole, ResetVolunteerFamilyRole } from "../GeneratedClient";
import { authenticatingFetch } from "../Auth";
import { currentOrganizationState, currentLocationState } from "./SessionModel";
import { visibleFamiliesData } from "./ModelLoader";

export const volunteerFamiliesData = selector({
  key: 'volunteerFamiliesData',
  get: ({get}) => {
    const visibleFamilies = get(visibleFamiliesData);
    return visibleFamilies.filter(f => f.volunteerFamilyInfo);
  }});

function useVolunteerFamilyCommandCallbackWithLocation<T extends unknown[]>(
  callback: (organizationId: string, locationId: string, volunteerFamilyId: string, ...args: T) => Promise<VolunteerFamilyCommand>) {
  return useRecoilCallback(({snapshot, set}) => {
    const asyncCallback = async (volunteerFamilyId: string, ...args: T) => {
      const organizationId = await snapshot.getPromise(currentOrganizationState);
      const locationId = await snapshot.getPromise(currentLocationState);

      const command = await callback(organizationId, locationId, volunteerFamilyId, ...args);

      const client = new VolunteersClient(process.env.REACT_APP_API_HOST, authenticatingFetch);
      const updatedFamily = await client.submitVolunteerFamilyCommand(organizationId, locationId, command);

      set(visibleFamiliesData, current => {
        return current.map(currentEntry => currentEntry.family?.id === volunteerFamilyId
          ? updatedFamily
          : currentEntry);
      });
    };
    return asyncCallback;
  })
}

// function useVolunteerFamilyCommandCallback<T extends unknown[]>(
//   callback: (volunteerFamilyId: string, ...args: T) => Promise<VolunteerFamilyCommand>) {
//   return useVolunteerFamilyCommandCallbackWithLocation<T>(
//     (_organizationId, _locationId, volunteerFamilyId, ...args) => callback(volunteerFamilyId, ...args));
// }

function useVolunteerCommandCallbackWithLocation<T extends unknown[]>(
  callback: (organizationId: string, locationId: string, volunteerFamilyId: string, personId: string, ...args: T) => Promise<VolunteerCommand>) {
  return useRecoilCallback(({snapshot, set}) => {
    const asyncCallback = async (volunteerFamilyId: string, personId: string, ...args: T) => {
      const organizationId = await snapshot.getPromise(currentOrganizationState);
      const locationId = await snapshot.getPromise(currentLocationState);

      const command = await callback(organizationId, locationId, volunteerFamilyId, personId, ...args);

      const client = new VolunteersClient(process.env.REACT_APP_API_HOST, authenticatingFetch);
      const updatedFamily = await client.submitVolunteerCommand(organizationId, locationId, command);

      set(visibleFamiliesData, current => {
        return current.map(currentEntry => currentEntry.family?.id === volunteerFamilyId
          ? updatedFamily
          : currentEntry);
      });
    };
    return asyncCallback;
  })
}

// function useVolunteerCommandCallback<T extends unknown[]>(
//   callback: (volunteerFamilyId: string, personId: string, ...args: T) => Promise<VolunteerCommand>) {
//   return useVolunteerCommandCallbackWithLocation<T>(
//     (_organizationId, _locationId, volunteerFamilyId, personId, ...args) => callback(volunteerFamilyId, personId, ...args));
// }

function usePersonCommandCallback<T extends unknown[]>(
  callback: (volunteerFamilyId: string, personId: string, ...args: T) => Promise<PersonCommand>) {
  return useRecoilCallback(({snapshot, set}) => {
    const asyncCallback = async (volunteerFamilyId: string, personId: string, ...args: T) => {
      const organizationId = await snapshot.getPromise(currentOrganizationState);
      const locationId = await snapshot.getPromise(currentLocationState);

      const command = await callback(volunteerFamilyId, personId, ...args);

      const client = new DirectoryClient(process.env.REACT_APP_API_HOST, authenticatingFetch);
      const updatedFamily = await client.submitPersonCommand(organizationId, locationId, volunteerFamilyId, command);

      set(visibleFamiliesData, current =>
        current.some(currentEntry => currentEntry.family?.id === volunteerFamilyId)
        ? current.map(currentEntry => currentEntry.family?.id === volunteerFamilyId
          ? updatedFamily
          : currentEntry)
        : current.concat(updatedFamily));
      
      return updatedFamily;
    };
    return asyncCallback;
  })
}

function useDirectoryCommandCallback<T extends unknown[]>(
  callback: (volunteerFamilyId: string, personId: string, ...args: T) => Promise<DirectoryCommand>) {
  return useRecoilCallback(({snapshot, set}) => {
    const asyncCallback = async (volunteerFamilyId: string, personId: string, ...args: T) => {
      const organizationId = await snapshot.getPromise(currentOrganizationState);
      const locationId = await snapshot.getPromise(currentLocationState);

      const command = await callback(volunteerFamilyId, personId, ...args);

      const client = new DirectoryClient(process.env.REACT_APP_API_HOST, authenticatingFetch);
      const updatedFamily = await client.submitDirectoryCommand(organizationId, locationId, command);

      set(visibleFamiliesData, current =>
        current.some(currentEntry => currentEntry.family?.id === volunteerFamilyId)
        ? current.map(currentEntry => currentEntry.family?.id === volunteerFamilyId
          ? updatedFamily
          : currentEntry)
        : current.concat(updatedFamily));
      
      return updatedFamily;
    };
    return asyncCallback;
  })
}

export function useVolunteersModel() {
  const uploadDocument = useVolunteerFamilyCommandCallbackWithLocation(
    async (organizationId, locationId, volunteerFamilyId, uploadedDocumentId: string, uploadedFileName: string) => {
      const command = new UploadVolunteerFamilyDocument({
        familyId: volunteerFamilyId
      });
      command.uploadedDocumentId = uploadedDocumentId;
      command.uploadedFileName = uploadedFileName;
      return command;
    });
  const completeFamilyRequirement = useVolunteerFamilyCommandCallbackWithLocation(
    async (organizationId, locationId, volunteerFamilyId, requirementName: string, requirement: ActionRequirement,
      completedAtLocal: Date, documentId: string | null) => {
      const command = new CompleteVolunteerFamilyRequirement({
        familyId: volunteerFamilyId
      });
      command.requirementName = requirementName;
      command.completedAtUtc = completedAtLocal;
      if (documentId != null)
        command.uploadedDocumentId = documentId;
      return command;
    });
  const removeFamilyRole = useVolunteerFamilyCommandCallbackWithLocation(
    async (organizationId, locationId, volunteerFamilyId,
      role: string, reason: RoleRemovalReason, additionalComments: string) =>
    {
      const command = new RemoveVolunteerFamilyRole({
        familyId: volunteerFamilyId
      });
      command.roleName = role;
      command.reason = reason;
      command.additionalComments = additionalComments;
      return command;
    });
  const resetFamilyRole = useVolunteerFamilyCommandCallbackWithLocation(
    async (organizationId, locationId, volunteerFamilyId,
      role: string) =>
    {
      const command = new ResetVolunteerFamilyRole({
        familyId: volunteerFamilyId
      });
      command.roleName = role;
      return command;
    });
  const completeIndividualRequirement = useVolunteerCommandCallbackWithLocation(
    async (organizationId, locationId, volunteerFamilyId, personId, requirementName: string, requirement: ActionRequirement,
      completedAtLocal: Date, documentId: string | null) => {
      const command = new CompleteVolunteerRequirement({
        familyId: volunteerFamilyId,
        personId: personId
      });
      command.requirementName = requirementName;
      command.completedAtUtc = completedAtLocal;
      if (documentId != null)
        command.uploadedDocumentId = documentId;
      return command;
    });
  const removeIndividualRole = useVolunteerCommandCallbackWithLocation(
    async (organizationId, locationId, volunteerFamilyId, personId,
      role: string, reason: RoleRemovalReason, additionalComments: string) =>
    {
      const command = new RemoveVolunteerRole({
        familyId: volunteerFamilyId,
        personId: personId
      });
      command.roleName = role;
      command.reason = reason;
      command.additionalComments = additionalComments;
      return command;
    });
  const resetIndividualRole = useVolunteerCommandCallbackWithLocation(
    async (organizationId, locationId, volunteerFamilyId, personId,
      role: string) =>
    {
      const command = new ResetVolunteerRole({
        familyId: volunteerFamilyId,
        personId: personId
      });
      command.roleName = role;
      return command;
    });
  const updatePersonName = usePersonCommandCallback(
    async (volunteerFamilyId, personId, firstName: string, lastName: string) => {
      const command = new UpdatePersonName({
        personId: personId
      });
      command.firstName = firstName;
      command.lastName = lastName;
      return command;
    });
  const updatePersonConcerns = usePersonCommandCallback(
    async (volunteerFamilyId, personId, concerns: string | null) => {
      const command = new UpdatePersonConcerns({
        personId: personId
      });
      command.concerns = concerns || undefined;
      return command;
    });
  const updatePersonNotes = usePersonCommandCallback(
    async (volunteerFamilyId, personId, notes: string | null) => {
      const command = new UpdatePersonNotes({
        personId: personId
      });
      command.notes = notes || undefined;
      return command;
    });
  const addPersonPhoneNumber = usePersonCommandCallback(
    async (volunteerFamilyId, personId, phoneNumber: string, phoneType: PhoneNumberType) => {
      const command = new AddPersonPhoneNumber({
        personId: personId
      });
      command.phoneNumber = new PhoneNumber({ number: phoneNumber, type: phoneType })
      command.isPreferredPhoneNumber = true;
      return command;
    });
  const updatePersonPhoneNumber = usePersonCommandCallback(
    async (volunteerFamilyId, personId, phoneId: string, phoneNumber: string, phoneType: PhoneNumberType) => {
      const command = new UpdatePersonPhoneNumber({
        personId: personId
      });
      command.phoneNumber = new PhoneNumber({ id: phoneId, number: phoneNumber, type: phoneType })
      command.isPreferredPhoneNumber = true;
      return command;
    });
  const addPersonEmailAddress = usePersonCommandCallback(
    async (volunteerFamilyId, personId, emailAddress: string, phoneType: EmailAddressType) => {
      const command = new AddPersonEmailAddress({
        personId: personId
      });
      command.emailAddress = new EmailAddress({ address: emailAddress, type: phoneType })
      command.isPreferredEmailAddress = true;
      return command;
    });
  const updatePersonEmailAddress = usePersonCommandCallback(
    async (volunteerFamilyId, personId, phoneId: string, emailAddress: string, phoneType: EmailAddressType) => {
      const command = new UpdatePersonEmailAddress({
        personId: personId
      });
      command.emailAddress = new EmailAddress({ id: phoneId, address: emailAddress, type: phoneType })
      command.isPreferredEmailAddress = true;
      return command;
    });
  const addPersonAddress = usePersonCommandCallback(
    async (volunteerFamilyId, personId, line1: string, line2: string, city: string, state: string, postalCode: string) => {
      const command = new AddPersonAddress({
        personId: personId
      });
      command.address = new Address({ line1: line1, line2: line2, city: city, state: state, postalCode: postalCode })
      command.isCurrentAddress = true;
      return command;
    });
  const updatePersonAddress = usePersonCommandCallback(
    async (volunteerFamilyId, personId, addressId: string,
      line1: string, line2: string, city: string, state: string, postalCode: string) => {
      const command = new UpdatePersonAddress({
        personId: personId
      });
      command.address = new Address({ id: addressId, line1: line1, line2: line2, city: city, state: state, postalCode: postalCode })
      command.isCurrentAddress = true;
      return command;
    });
  const addAdult = useDirectoryCommandCallback(
    async (volunteerFamilyId, firstName: string, lastName: string, gender: Gender, age: Age, ethnicity: string,
        isInHousehold: boolean, relationshipToFamily: string,
        addressLine1: string | null, addressLine2: string | null, city: string | null, state: string | null, postalCode: string | null, country: string | null,
        phoneNumber: string | null, phoneType: PhoneNumberType | null, emailAddress: string | null, emailType: EmailAddressType | null,
        notes?: string, concerns?: string) => {
      const command = new AddAdultToFamilyCommand();
      command.familyId = volunteerFamilyId;
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
    async (volunteerFamilyId, firstName: string, lastName: string, gender: Gender, age: Age, ethnicity: string,
        custodialRelationships: CustodialRelationship[],
        notes?: string, concerns?: string) => {
      const command = new AddChildToFamilyCommand();
      command.familyId = volunteerFamilyId;
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
    async (firstName: string, lastName: string, gender: Gender, age: Age, ethnicity: string,
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
  
  return {
    uploadDocument,
    completeFamilyRequirement,
    removeFamilyRole,
    resetFamilyRole,
    completeIndividualRequirement,
    removeIndividualRole,
    resetIndividualRole,
    updatePersonName,
    updatePersonConcerns,
    updatePersonNotes,
    addPersonPhoneNumber,
    updatePersonPhoneNumber,
    addPersonEmailAddress,
    updatePersonEmailAddress,
    addPersonAddress,
    updatePersonAddress,
    addAdult,
    addChild,
    createVolunteerFamilyWithNewAdult
  };
}
