import {
  V1ReferralRecordsCommand,
  CreateV1Referral,
  CloseV1Referral,
  ReopenV1Referral,
  UpdateV1ReferralDetails,
  UpdateV1ReferralFamily,
  UpdateCustomV1ReferralField,
  CustomField,
  V1ReferralCloseReason,
  V1ReferralCommand,
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
    async (
      referralId: string,
      reason: V1ReferralCloseReason,
      closedAtLocal: Date
    ) =>
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

  return {
    createReferral,
    updateCustomReferralField,
    updateReferralDetails,
    updateReferralFamily,
    closeReferral,
    reopenReferral,
  };
}
