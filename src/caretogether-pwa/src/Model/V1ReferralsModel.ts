import {
  V1ReferralRecordsCommand,
  CreateV1Referral,
  CloseV1Referral,
  ReopenV1Referral,
  UpdateV1ReferralFamily,
} from '../GeneratedClient';
import { useAtomicRecordsCommandCallback } from './DirectoryModel';
import { commandFactory } from './CommandFactory';

interface CreateReferralPayload {
  familyId: string | null;
  openedAtUtc: Date;
  title: string;
  comment?: string;
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

  const closeReferral = useAtomicRecordsCommandCallback(
    async (referralId: string) => {
      const command = new V1ReferralRecordsCommand();

      command.command = commandFactory(CloseV1Referral, {
        referralId,
        closedAtUtc: new Date(),
        closeReason: 'Closed by user',
      });

      return command;
    }
  );

  const reopenReferral = useAtomicRecordsCommandCallback(
    async (referralId: string) => {
      const command = new V1ReferralRecordsCommand();

      command.command = commandFactory(ReopenV1Referral, {
        referralId,
        reopenedAtUtc: new Date(),
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

  return {
    createReferral,
    closeReferral,
    reopenReferral,
    updateReferralFamily,
  };
}
