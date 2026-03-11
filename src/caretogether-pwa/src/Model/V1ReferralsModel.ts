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
} from '../GeneratedClient';
import { useAtomicRecordsCommandCallback } from './DirectoryModel';
import { commandFactory } from './CommandFactory';

interface CreateReferralPayload {
  familyId: string | null;
  openedAtUtc: Date;
  title: string;
  comment?: string;
}

interface UpdateReferralDetailsPayload {
  familyId?: string | null;
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
      value: boolean | string | null
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
        familyId: payload.familyId ?? undefined,
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
        requirementName: requirementName,
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
        requirementName: requirementName,
        additionalComments: additionalComments,
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

  return {
    createReferral,
    updateCustomReferralField,
    updateReferralDetails,
    updateReferralFamily,
    closeReferral,
    reopenReferral,
    completeReferralRequirement,
    markReferralRequirementIncomplete,
    exemptReferralRequirement,
    unexemptReferralRequirement,
    uploadReferralDocumentMetadata,
  };
}
