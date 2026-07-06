import {
  V1ReferralRecordsCommand,
  CreateV1Referral,
  CloseV1Referral,
  ReopenV1Referral,
  UpdateV1ReferralDetails,
  UpdateV1ReferralFamily,
  UpdateCustomV1ReferralField,
  CustomField,
  V1ReferralCommand,
  CompleteReferralRequirement2,
  MarkReferralRequirementIncomplete2,
  ExemptReferralRequirement2,
  UnexemptReferralRequirement2,
  CompletedRequirementInfo,
  ExemptedRequirementInfo,
  ActionRequirement,
  UploadV1ReferralDocument,
  AcceptV1Referral,
  LinkReferralToCaseAndAcceptCommand,
  OpenCaseForReferralAndAcceptCommand,
  AssignIndividualVolunteer3 as AssignIndividualVolunteer,
  UnassignIndividualVolunteer3 as UnassignIndividualVolunteer,
} from '../GeneratedClient';
import { commandFactory } from './CommandFactory';
import {
  useAtomicRecordsCommandCallback,
  useCompositeRecordsCommandCallback,
} from '../Model/Data';

interface CreateReferralPayload {
  familyId: string | null;
  openedAtUtc: Date;
  title: string;
  comment?: string;
}

interface UpdateReferralDetailsPayload {
  title: string;
  comment?: string;
  openedAtUtc: Date;
}

function useV1ReferralCommandCallback<T extends unknown[]>(
  callback: (referralId: string, ...args: T) => Promise<V1ReferralCommand>
) {
  return useAtomicRecordsCommandCallback(
    async (referralId: string, ...args: T) => {
      const command = new V1ReferralRecordsCommand();
      command.command = await callback(referralId, ...args);
      return command;
    }
  );
}

export function useV1ReferralsModel() {
  const createReferral = useAtomicRecordsCommandCallback(
    async (referralId: string, payload: CreateReferralPayload) => {
      const command = new V1ReferralRecordsCommand();

      command.command = commandFactory(CreateV1Referral, {
        referralId,
        familyId: payload.familyId ?? undefined,
        createdAtUtc: payload.openedAtUtc,
        title: payload.title,
        comment: payload.comment,
      });

      return command;
    }
  );

  const updateCustomReferralField = useAtomicRecordsCommandCallback(
    async (
      referralId: string,
      customField: CustomField,
      value: boolean | string | string[] | null
    ) => {
      const command = new V1ReferralRecordsCommand();

      command.command = commandFactory(UpdateCustomV1ReferralField, {
        referralId,
        completedCustomFieldId: crypto.randomUUID(),
        customFieldName: customField.name,
        customFieldType: customField.type,
        value,
      });

      return command;
    }
  );

  const updateReferralFamily = useAtomicRecordsCommandCallback(
    async (referralId: string, familyId: string) => {
      const command = new V1ReferralRecordsCommand();

      command.command = commandFactory(UpdateV1ReferralFamily, {
        referralId,
        familyId,
      });

      return command;
    }
  );

  const updateReferralDetails = useAtomicRecordsCommandCallback(
    async (referralId: string, payload: UpdateReferralDetailsPayload) => {
      const command = new V1ReferralRecordsCommand();

      command.command = commandFactory(UpdateV1ReferralDetails, {
        referralId,
        title: payload.title,
        comment: payload.comment,
        createdAtUtc: payload.openedAtUtc,
      });

      return command;
    }
  );

  const closeReferral = useV1ReferralCommandCallback(
    async (referralId: string, reason: string, closedAtLocal: Date) =>
      commandFactory(CloseV1Referral, {
        referralId,
        closeReason: reason,
        closedAtUtc: new Date(closedAtLocal.toISOString()),
      })
  );

  const reopenReferral = useV1ReferralCommandCallback(
    async (referralId: string) =>
      commandFactory(ReopenV1Referral, {
        referralId,
        reopenedAtUtc: new Date(),
      })
  );

  const acceptReferral = useV1ReferralCommandCallback(
    async (referralId: string, acceptedAtLocal?: Date) =>
      commandFactory(AcceptV1Referral, {
        referralId,
        acceptedAtUtc: acceptedAtLocal ?? new Date(),
      })
  );

  const linkReferralToCaseAndAcceptCommand = useCompositeRecordsCommandCallback(
    async (
      familyId: string,
      v1CaseId: string,
      referralId: string,
      acceptedAtLocal: Date
    ) =>
      commandFactory(LinkReferralToCaseAndAcceptCommand, {
        familyId,
        caseId: v1CaseId,
        referralId,
        acceptedAtUtc: acceptedAtLocal,
      })
  );

  const linkReferralToCaseAndAccept = async (
    familyId: string,
    v1CaseId: string,
    referralId: string,
    acceptedAtLocal: Date
  ) => {
    await linkReferralToCaseAndAcceptCommand(
      familyId,
      v1CaseId,
      referralId,
      acceptedAtLocal
    );
  };

  const openCaseForReferralAndAcceptCommand =
    useCompositeRecordsCommandCallback(
      async (familyId: string, referralId: string, openedAtLocal: Date) =>
        commandFactory(OpenCaseForReferralAndAcceptCommand, {
          familyId,
          caseId: crypto.randomUUID(),
          referralId,
          openedAtUtc: openedAtLocal,
        })
    );

  const openCaseForReferralAndAccept = async (
    familyId: string,
    referralId: string,
    openedAtLocal: Date
  ) => {
    await openCaseForReferralAndAcceptCommand(
      familyId,
      referralId,
      openedAtLocal
    );
  };

  const completeReferralRequirement = useV1ReferralCommandCallback(
    async (
      referralId: string,
      requirementName: string,
      _requirement: ActionRequirement,
      completedAtLocal: Date,
      documentId: string | null,
      noteId: string | null
    ) =>
      commandFactory(CompleteReferralRequirement2, {
        referralId,
        completedRequirementId: crypto.randomUUID(),
        requirementName,
        completedAtUtc: completedAtLocal,
        uploadedDocumentId: documentId ?? undefined,
        noteId: noteId ?? undefined,
      })
  );

  const markReferralRequirementIncomplete = useV1ReferralCommandCallback(
    async (
      referralId: string,
      completedRequirement: CompletedRequirementInfo
    ) =>
      commandFactory(MarkReferralRequirementIncomplete2, {
        referralId,
        requirementName: completedRequirement.requirementName,
        completedRequirementId: completedRequirement.completedRequirementId,
      })
  );

  const exemptReferralRequirement = useV1ReferralCommandCallback(
    async (
      referralId: string,
      requirementName: string,
      additionalComments: string,
      exemptionExpiresAtLocal: Date | null
    ) =>
      commandFactory(ExemptReferralRequirement2, {
        referralId,
        requirementName,
        additionalComments,
        exemptionExpiresAtUtc: exemptionExpiresAtLocal ?? undefined,
      })
  );

  const unexemptReferralRequirement = useV1ReferralCommandCallback(
    async (referralId: string, exemptedRequirement: ExemptedRequirementInfo) =>
      commandFactory(UnexemptReferralRequirement2, {
        referralId,
        requirementName: exemptedRequirement.requirementName,
      })
  );

  const uploadReferralDocumentMetadata = useAtomicRecordsCommandCallback(
    async (
      referralId: string,
      documentId: string,
      uploadedFileName: string
    ) => {
      const command = new V1ReferralRecordsCommand();

      command.command = commandFactory(UploadV1ReferralDocument, {
        referralId,
        uploadedDocumentId: documentId,
        uploadedFileName,
      });

      return command;
    }
  );

  const assignIndividualVolunteerToReferral = useV1ReferralCommandCallback(
    async (referralId: string, personId: string, assignmentRole: string) =>
      commandFactory(AssignIndividualVolunteer, {
        referralId,
        personId,
        assignmentRole,
      })
  );

  const unassignIndividualVolunteerFromReferral = useV1ReferralCommandCallback(
    async (referralId: string, personId: string, assignmentRole: string) =>
      commandFactory(UnassignIndividualVolunteer, {
        referralId,
        personId,
        assignmentRole,
      })
  );

  return {
    createReferral,
    updateCustomReferralField,
    updateReferralDetails,
    updateReferralFamily,
    closeReferral,
    reopenReferral,
    acceptReferral,
    linkReferralToCaseAndAccept,
    openCaseForReferralAndAccept,
    completeReferralRequirement,
    markReferralRequirementIncomplete,
    exemptReferralRequirement,
    unexemptReferralRequirement,
    uploadReferralDocumentMetadata,
    assignIndividualVolunteerToReferral,
    unassignIndividualVolunteerFromReferral,
  };
}
