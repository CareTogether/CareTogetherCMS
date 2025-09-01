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
  UpdateNoteAccessLevel,
} from '../GeneratedClient';
import { api } from '../Api/Api';
import {
  selectedLocationContextState,
  visibleAggregatesState,
  visibleCommunitiesQuery,
  visibleFamiliesQuery,
} from './Data';
import { commandFactory } from './CommandFactory';

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
    const command = commandFactory(UndoCreateFamily, {
      familyId: familyId,
    });
    return command;
  });
  const uploadFamilyDocument = useFamilyCommandCallback(
    async (familyId, uploadedDocumentId: string, uploadedFileName: string) => {
      const command = commandFactory(UploadFamilyDocument, {
        familyId: familyId,
        uploadedDocumentId: uploadedDocumentId,
        uploadedFileName: uploadedFileName,
      });

      return command;
    }
  );
  const deleteUploadedFamilyDocument = useFamilyCommandCallback(
    async (familyId, uploadedDocumentId: string) => {
      const command = commandFactory(DeleteUploadedFamilyDocument, {
        familyId: familyId,
        uploadedDocumentId: uploadedDocumentId,
      });
      return command;
    }
  );
  const convertChildToAdult = useFamilyCommandCallback(
    async (
      familyId,
      personId: string,
      newRelationship: FamilyAdultRelationshipInfo
    ) => {
      const command = commandFactory(ConvertChildToAdult, {
        familyId: familyId,
        personId: personId,
        newRelationshipToFamily: newRelationship,
      });
      return command;
    }
  );
  const updateAdultRelationshipToFamily = useFamilyCommandCallback(
    async (
      familyId,
      adultPersonId: string,
      relationship: FamilyAdultRelationshipInfo
    ) => {
      const command = commandFactory(UpdateAdultRelationshipToFamily, {
        familyId: familyId,
        adultPersonId: adultPersonId,
        relationshipToFamily: relationship,
      });
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
      const command = commandFactory(UpdateCustodialRelationshipType, {
        familyId: familyId,
        childPersonId: childId,
        adultPersonId: adultId,
        type: type,
      });
      return command;
    }
  );
  const removeCustodialRelationship = useFamilyCommandCallback(
    async (familyId, childId: string, adultId: string) => {
      const command = commandFactory(RemoveCustodialRelationship, {
        familyId: familyId,
        childPersonId: childId,
        adultPersonId: adultId,
      });
      return command;
    }
  );
  const updatePrimaryFamilyContact = useFamilyCommandCallback(
    async (familyId, adultId: string) => {
      const command = commandFactory(ChangePrimaryFamilyContact, {
        familyId: familyId,
        adultId: adultId,
      });
      return command;
    }
  );
  const updateCustomFamilyField = useFamilyCommandCallback(
    async (
      familyId: string,
      customField: CustomField,
      value: boolean | string | null
    ) => {
      const command = commandFactory(UpdateCustomFamilyField, {
        familyId: familyId,
        completedCustomFieldId: crypto.randomUUID(),
        customFieldName: customField.name,
        customFieldType: customField.type,
        value: value,
      });
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
      const command = commandFactory(UpdatePersonName, {
        personId: personId,
        firstName: firstName,
        lastName: lastName,
      });
      return command;
    }
  );
  const updatePersonGender = usePersonCommandCallback(
    async (_familyId, personId: string, gender: Gender) => {
      const command = commandFactory(UpdatePersonGender, {
        personId: personId,
        gender: gender,
      });
      return command;
    }
  );
  const updatePersonAge = usePersonCommandCallback(
    async (_familyId, personId: string, age: Age) => {
      const command = commandFactory(UpdatePersonAge, {
        personId: personId,
        age: age,
      });
      return command;
    }
  );
  const updatePersonEthnicity = usePersonCommandCallback(
    async (_familyId, personId: string, ethnicity: string) => {
      const command = commandFactory(UpdatePersonEthnicity, {
        personId: personId,
        ethnicity: ethnicity,
      });
      return command;
    }
  );
  const updatePersonConcerns = usePersonCommandCallback(
    async (_familyId, personId: string, concerns: string | null) => {
      const command = commandFactory(UpdatePersonConcerns, {
        personId: personId,
        concerns: concerns || undefined,
      });
      return command;
    }
  );
  const updatePersonNotes = usePersonCommandCallback(
    async (_familyId, personId: string, notes: string | null) => {
      const command = commandFactory(UpdatePersonNotes, {
        personId: personId,
        notes: notes || undefined,
      });
      return command;
    }
  );
  const undoCreatePerson = usePersonCommandCallback(
    async (_familyId, personId: string) => {
      const command = commandFactory(UndoCreatePerson, {
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
      const command = commandFactory(AddPersonPhoneNumber, {
        personId: personId,
        phoneNumber: commandFactory(PhoneNumber, {
          id: crypto.randomUUID(),
          number: phoneNumber,
          type: phoneType,
        }),
        isPreferredPhoneNumber: isPreferred,
      });
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
      const command = commandFactory(UpdatePersonPhoneNumber, {
        personId: personId,
        phoneNumber: commandFactory(PhoneNumber, {
          id: phoneId,
          number: phoneNumber,
          type: phoneType,
        }),
        isPreferredPhoneNumber: isPreferred,
      });
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
      const command = commandFactory(AddPersonEmailAddress, {
        personId: personId,
        emailAddress: commandFactory(EmailAddress, {
          id: crypto.randomUUID(),
          address: emailAddress,
          type: phoneType,
        }),
        isPreferredEmailAddress: isPreferred,
      });
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
      const command = commandFactory(UpdatePersonEmailAddress, {
        personId: personId,
        emailAddress: commandFactory(EmailAddress, {
          id: phoneId,
          address: emailAddress,
          type: phoneType,
        }),
        isPreferredEmailAddress: isPreferred,
      });
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
      const command = commandFactory(AddPersonAddress, {
        personId: personId,
        address: address,
        isCurrentAddress: isCurrent,
      });
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
      const command = commandFactory(UpdatePersonAddress, {
        personId: personId,
        address: address,
        isCurrentAddress: isCurrent,
      });
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
      phoneType: PhoneNumberType,
      emailAddress: string | null,
      emailType: EmailAddressType,
      notes?: string,
      concerns?: string
    ) => {
      const command = commandFactory(AddAdultToFamilyCommand, {
        familyId: familyId,
        personId: crypto.randomUUID(),
        firstName: firstName,
        lastName: lastName,
        gender: gender ?? undefined,
        age: age ?? undefined,
        ethnicity: ethnicity ?? undefined,
        concerns: concerns,
        notes: notes,
        familyAdultRelationshipInfo: commandFactory(
          FamilyAdultRelationshipInfo,
          {
            isInHousehold: isInHousehold,
            relationshipToFamily: relationshipToFamily,
          }
        ),
        address: address ?? undefined,
        phoneNumber: phoneNumber
          ? commandFactory(PhoneNumber, {
              id: crypto.randomUUID(),
              number: phoneNumber,
              type: phoneType,
            })
          : undefined,
        emailAddress: emailAddress
          ? commandFactory(EmailAddress, {
              id: crypto.randomUUID(),
              address: emailAddress,
              type: emailType,
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
      const personId = crypto.randomUUID();

      const command = commandFactory(AddChildToFamilyCommand, {
        familyId: familyId,
        personId: personId,
        firstName: firstName,
        lastName: lastName,
        gender: gender ?? undefined,
        age: age ?? undefined,
        ethnicity: ethnicity ?? undefined,
        custodialRelationships: custodialRelationships.map((cr) => {
          cr.childId = personId;
          return cr;
        }),
        concerns: concerns,
        notes: notes,
      });
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
      phoneType: PhoneNumberType,
      emailAddress: string | null,
      emailType: EmailAddressType,
      notes?: string,
      concerns?: string
    ) => {
      const command = commandFactory(CreateVolunteerFamilyWithNewAdultCommand, {
        familyId: familyId,
        personId: crypto.randomUUID(),
        firstName: firstName,
        lastName: lastName,
        gender: gender == null ? undefined : gender,
        age: age == null ? undefined : age,
        ethnicity: ethnicity || undefined,
        concerns: concerns,
        notes: notes,
        familyAdultRelationshipInfo: commandFactory(
          FamilyAdultRelationshipInfo,
          {
            isInHousehold: isInHousehold,
            relationshipToFamily: relationshipToFamily,
          }
        ),
        address: address == null ? undefined : address,
        phoneNumber: phoneNumber
          ? commandFactory(PhoneNumber, {
              id: crypto.randomUUID(),
              number: phoneNumber,
              type: phoneType,
            })
          : undefined,
        emailAddress: emailAddress
          ? commandFactory(EmailAddress, {
              id: crypto.randomUUID(),
              address: emailAddress,
              type: emailType,
            })
          : undefined,
      });
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
      phoneType: PhoneNumberType,
      emailAddress: string | null,
      emailType: EmailAddressType,
      notes?: string,
      concerns?: string
    ) => {
      const command = commandFactory(
        CreatePartneringFamilyWithNewAdultCommand,
        {
          familyId: familyId,
          personId: crypto.randomUUID(),
          referralId: crypto.randomUUID(),
          referralOpenedAtUtc: referralOpenedAtUtc,
          firstName: firstName,
          lastName: lastName,
          gender: gender == null ? undefined : gender,
          age: age == null ? undefined : age,
          ethnicity: ethnicity || undefined,
          concerns: concerns,
          notes: notes,
          familyAdultRelationshipInfo: commandFactory(
            FamilyAdultRelationshipInfo,
            {
              isInHousehold: isInHousehold,
              relationshipToFamily: relationshipToFamily,
            }
          ),
          address: address == null ? undefined : address,
          phoneNumber: phoneNumber
            ? commandFactory(PhoneNumber, {
                id: crypto.randomUUID(),
                number: phoneNumber,
                type: phoneType,
              })
            : undefined,
          emailAddress: emailAddress
            ? commandFactory(EmailAddress, {
                id: crypto.randomUUID(),
                address: emailAddress,
                type: emailType,
              })
            : undefined,
        }
      );
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
      const command = commandFactory(CreateDraftNote, {
        familyId: familyId,
        noteId: noteId,
        draftNoteContents: draftNoteContents,
        backdatedTimestampUtc: backdatedTimestampLocal,
        accessLevel: accessLevel,
      });
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
      const command = commandFactory(EditDraftNote, {
        familyId: familyId,
        noteId: noteId,
        draftNoteContents: draftNoteContents,
        backdatedTimestampUtc: backdatedTimestampLocal,
        accessLevel: accessLevel,
      });
      return command;
    }
  );
  const discardDraftNote = useNoteCommandCallback(
    async (familyId, noteId: string) => {
      const command = commandFactory(DiscardDraftNote, {
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
      const command = commandFactory(ApproveNote, {
        familyId: familyId,
        noteId: noteId,
        finalizedNoteContents: finalizedNoteContents,
        backdatedTimestampUtc: backdatedTimestampLocal,
        accessLevel: accessLevel,
      });
      return command;
    }
  );
  const sendUpdateNoteAccessLevel = useNoteCommandCallback(
    async (familyId: string, noteId: string, accessLevel?: string | null) => {
      const command = new UpdateNoteAccessLevel({ familyId, noteId });
      command.accessLevel = accessLevel ?? undefined;
      return command;
    }
  );

  const updateNoteAccessLevel = async (
    familyId: string,
    noteId: string,
    accessLevelName: string | undefined
  ) => {
    const normalized =
      accessLevelName === 'Everyone' ? undefined : accessLevelName;
    await sendUpdateNoteAccessLevel(familyId, noteId, normalized);
  };

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
    updateNoteAccessLevel,
  };
}
