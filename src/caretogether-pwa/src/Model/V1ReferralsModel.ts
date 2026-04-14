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
} from '../GeneratedClient';
import { useAtomicRecordsCommandCallback } from './DirectoryModel';
import { commandFactory } from './CommandFactory';
import { api } from '../Api/Api';
import {
  selectedLocationContextState,
  visibleAggregatesState,
} from '../Model/Data';
import { useRecoilValue, useSetRecoilState } from 'recoil';

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
  const setVisibleAggregates = useSetRecoilState(visibleAggregatesState);
  const { organizationId, locationId } = useRecoilValue(
    selectedLocationContextState
  );

  async function refreshVisibleAggregates() {
    const updatedAggregates = await api.records.listVisibleAggregates(
      organizationId,
      locationId
    );

    setVisibleAggregates(updatedAggregates);
  }

  const createReferralCommand = useAtomicRecordsCommandCallback(
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

  const createReferral = async (
    referralId: string,
    payload: CreateReferralPayload
  ) => {
    await createReferralCommand(referralId, payload);
    await refreshVisibleAggregates();
  };

  const updateCustomReferralFieldCommand = useAtomicRecordsCommandCallback(
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

  const updateCustomReferralField = async (
    referralId: string,
    customField: CustomField,
    value: boolean | string | null
  ) => {
    await updateCustomReferralFieldCommand(referralId, customField, value);
    await refreshVisibleAggregates();
  };

  const updateReferralFamilyCommand = useAtomicRecordsCommandCallback(
    async (referralId: string, familyId: string) => {
      const command = new V1ReferralRecordsCommand();

      command.command = commandFactory(UpdateV1ReferralFamily, {
        referralId,
        familyId,
      });

      return command;
    }
  );

  const updateReferralFamily = async (referralId: string, familyId: string) => {
    await updateReferralFamilyCommand(referralId, familyId);
    await refreshVisibleAggregates();
  };

  const updateReferralDetailsCommand = useAtomicRecordsCommandCallback(
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

  const updateReferralDetails = async (
    referralId: string,
    payload: UpdateReferralDetailsPayload
  ) => {
    await updateReferralDetailsCommand(referralId, payload);
    await refreshVisibleAggregates();
  };

  const closeReferralCommand = useV1ReferralCommandCallback(
    async (referralId: string, reason: string, closedAtLocal: Date) =>
      commandFactory(CloseV1Referral, {
        referralId,
        closeReason: reason,
        closedAtUtc: new Date(closedAtLocal.toISOString()),
      })
  );

  const closeReferral = async (
    referralId: string,
    reason: string,
    closedAtLocal: Date
  ) => {
    await closeReferralCommand(referralId, reason, closedAtLocal);
    await refreshVisibleAggregates();
  };

  const reopenReferralCommand = useV1ReferralCommandCallback(
    async (referralId: string) =>
      commandFactory(ReopenV1Referral, {
        referralId,
        reopenedAtUtc: new Date(),
      })
  );

  const reopenReferral = async (referralId: string) => {
    await reopenReferralCommand(referralId);
    await refreshVisibleAggregates();
  };

  const acceptReferralCommand = useV1ReferralCommandCallback(
    async (referralId: string, acceptedAtLocal?: Date) =>
      commandFactory(AcceptV1Referral, {
        referralId,
        acceptedAtUtc: acceptedAtLocal ?? new Date(),
      })
  );

  const acceptReferral = async (referralId: string, acceptedAtLocal?: Date) => {
    await acceptReferralCommand(referralId, acceptedAtLocal);
    await refreshVisibleAggregates();
  };

  const completeReferralRequirementCommand = useV1ReferralCommandCallback(
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

  const completeReferralRequirement = async (
    referralId: string,
    requirementName: string,
    requirement: ActionRequirement,
    completedAtLocal: Date,
    documentId: string | null,
    noteId: string | null
  ) => {
    await completeReferralRequirementCommand(
      referralId,
      requirementName,
      requirement,
      completedAtLocal,
      documentId,
      noteId
    );
    await refreshVisibleAggregates();
  };

  const markReferralRequirementIncompleteCommand = useV1ReferralCommandCallback(
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

  const markReferralRequirementIncomplete = async (
    referralId: string,
    completedRequirement: CompletedRequirementInfo
  ) => {
    await markReferralRequirementIncompleteCommand(
      referralId,
      completedRequirement
    );
    await refreshVisibleAggregates();
  };

  const exemptReferralRequirementCommand = useV1ReferralCommandCallback(
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

  const exemptReferralRequirement = async (
    referralId: string,
    requirementName: string,
    additionalComments: string,
    exemptionExpiresAtLocal: Date | null
  ) => {
    await exemptReferralRequirementCommand(
      referralId,
      requirementName,
      additionalComments,
      exemptionExpiresAtLocal
    );
    await refreshVisibleAggregates();
  };

  const unexemptReferralRequirementCommand = useV1ReferralCommandCallback(
    async (referralId: string, exemptedRequirement: ExemptedRequirementInfo) =>
      commandFactory(UnexemptReferralRequirement2, {
        referralId,
        requirementName: exemptedRequirement.requirementName,
      })
  );

  const unexemptReferralRequirement = async (
    referralId: string,
    exemptedRequirement: ExemptedRequirementInfo
  ) => {
    await unexemptReferralRequirementCommand(referralId, exemptedRequirement);
    await refreshVisibleAggregates();
  };

  const uploadReferralDocumentMetadataCommand = useAtomicRecordsCommandCallback(
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

  const uploadReferralDocumentMetadata = async (
    referralId: string,
    documentId: string,
    uploadedFileName: string
  ) => {
    await uploadReferralDocumentMetadataCommand(
      referralId,
      documentId,
      uploadedFileName
    );
    await refreshVisibleAggregates();
  };

  return {
    createReferral,
    updateCustomReferralField,
    updateReferralDetails,
    updateReferralFamily,
    closeReferral,
    reopenReferral,
    acceptReferral,
    completeReferralRequirement,
    markReferralRequirementIncomplete,
    exemptReferralRequirement,
    unexemptReferralRequirement,
    uploadReferralDocumentMetadata,
  };
}
