import { selector, atom } from 'recoil';
import {
  V1ReferralRecordsCommand,
  CreateV1Referral,
  CloseV1Referral,
  ReopenV1Referral,
} from '../GeneratedClient';
import { api } from '../Api/Api';
import { currentLocationQuery, currentOrganizationQuery } from './Data';
import { useAtomicRecordsCommandCallback } from './DirectoryModel';
import { commandFactory } from './CommandFactory';

export const referralsRefreshTrigger = atom<number>({
  key: 'referralsRefreshTrigger',
  default: 0,
});

export const referralsQuery = selector({
  key: 'referralsQuery',
  get: async ({ get }) => {
    get(referralsRefreshTrigger);

    const location = get(currentLocationQuery);
    const organization = get(currentOrganizationQuery);

    if (!location || !organization) return [];

    return api.v1Referrals.listReferrals(
      organization.organizationId,
      location.locationId
    );
  },
});

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

  return {
    createReferral,
    closeReferral,
    reopenReferral,
  };
}
