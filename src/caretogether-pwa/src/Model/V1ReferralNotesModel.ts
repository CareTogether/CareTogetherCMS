import {
  V1ReferralNoteRecordsCommand,
  V1ReferralNoteCommand,
  CreateV1ReferralDraftNote,
  EditV1ReferralDraftNote,
  DiscardV1ReferralDraftNote,
  ApproveV1ReferralNote,
  UpdateV1ReferralNoteAccessLevel,
} from '../GeneratedClient';
import { commandFactory } from './CommandFactory';
import { useAtomicRecordsCommandCallback } from './Data';

function useV1ReferralNoteCommandCallback<T extends unknown[]>(
  callback: (
    referralId: string,
    ...args: T
  ) => Promise<V1ReferralNoteCommand>
) {
  return useAtomicRecordsCommandCallback(async (referralId, ...args: T) => {
    const wrapper = new V1ReferralNoteRecordsCommand();
    wrapper.command = await callback(referralId, ...args);
    return wrapper;
  });
}

export function useV1ReferralNotesModel() {
  const createDraftReferralNote = useV1ReferralNoteCommandCallback(
    async (
      referralId: string,
      noteId: string,
      draftNoteContents: string,
      backdatedTimestampUtc?: Date,
      accessLevel?: string
    ) =>
      commandFactory(CreateV1ReferralDraftNote, {
        referralId,
        noteId,
        draftNoteContents,
        backdatedTimestampUtc: backdatedTimestampUtc ?? undefined,
        accessLevel: accessLevel ?? undefined,
      })
  );

  const editDraftReferralNote = useV1ReferralNoteCommandCallback(
    async (
      referralId: string,
      noteId: string,
      draftNoteContents: string,
      backdatedTimestampUtc?: Date,
      accessLevel?: string
    ) =>
      commandFactory(EditV1ReferralDraftNote, {
        referralId,
        noteId,
        draftNoteContents,
        backdatedTimestampUtc: backdatedTimestampUtc ?? undefined,
        accessLevel: accessLevel ?? undefined,
      })
  );

  const discardDraftReferralNote = useV1ReferralNoteCommandCallback(
    async (referralId: string, noteId: string) =>
      commandFactory(DiscardV1ReferralDraftNote, {
        referralId,
        noteId,
      })
  );

  const approveReferralNote = useV1ReferralNoteCommandCallback(
    async (
      referralId: string,
      noteId: string,
      finalizedNoteContents: string,
      backdatedTimestampUtc?: Date,
      accessLevel?: string
    ) =>
      commandFactory(ApproveV1ReferralNote, {
        referralId,
        noteId,
        finalizedNoteContents,
        backdatedTimestampUtc: backdatedTimestampUtc ?? undefined,
        accessLevel: accessLevel ?? undefined,
      })
  );

  const updateReferralNoteAccessLevel = useV1ReferralNoteCommandCallback(
    async (referralId: string, noteId: string, accessLevel?: string) =>
      commandFactory(UpdateV1ReferralNoteAccessLevel, {
        referralId,
        noteId,
        accessLevel: accessLevel ?? undefined,
      })
  );

  return {
    createDraftReferralNote,
    editDraftReferralNote,
    discardDraftReferralNote,
    approveReferralNote,
    updateReferralNoteAccessLevel,
  };
}
