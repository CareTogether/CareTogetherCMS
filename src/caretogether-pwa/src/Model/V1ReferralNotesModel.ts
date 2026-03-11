import { useRecoilCallback } from 'recoil';
import {
  V1ReferralNoteEntry,
  V1ReferralNoteRecordsCommand,
  V1ReferralNoteCommand,
  CreateV1ReferralDraftNote,
  EditV1ReferralDraftNote,
  DiscardV1ReferralDraftNote,
  ApproveV1ReferralNote,
  UpdateV1ReferralNoteAccessLevel,
} from '../GeneratedClient';
import { api } from '../Api/Api';
import { selectedLocationContextState } from './Data';
import { commandFactory } from './CommandFactory';

export function useV1ReferralNotesModel() {
  const listReferralNotes = useRecoilCallback(
    ({ snapshot }) =>
      async (referralId: string): Promise<V1ReferralNoteEntry[]> => {
        const { organizationId, locationId } = await snapshot.getPromise(
          selectedLocationContextState
        );

        return api.v1ReferralNotes.listReferralNotes(
          organizationId,
          locationId,
          referralId
        );
      },
    []
  );

  const submitReferralNoteCommand = useRecoilCallback(
    ({ snapshot }) =>
      async (command: V1ReferralNoteCommand): Promise<void> => {
        const { organizationId, locationId } = await snapshot.getPromise(
          selectedLocationContextState
        );

        const wrapper = new V1ReferralNoteRecordsCommand();
        wrapper.command = command;

        await api.records.submitAtomicRecordsCommand(
          organizationId,
          locationId,
          wrapper
        );
      },
    []
  );

  const createDraftReferralNote = useRecoilCallback(
    () =>
      async (
        referralId: string,
        noteId: string,
        draftNoteContents: string,
        backdatedTimestampUtc?: Date,
        accessLevel?: string
      ) => {
        const command = commandFactory(CreateV1ReferralDraftNote, {
          referralId,
          noteId,
          draftNoteContents,
          backdatedTimestampUtc: backdatedTimestampUtc ?? undefined,
          accessLevel: accessLevel ?? undefined,
        });

        await submitReferralNoteCommand(command);
      },
    [submitReferralNoteCommand]
  );

  const editDraftReferralNote = useRecoilCallback(
    () =>
      async (
        referralId: string,
        noteId: string,
        draftNoteContents: string,
        backdatedTimestampUtc?: Date,
        accessLevel?: string
      ) => {
        const command = commandFactory(EditV1ReferralDraftNote, {
          referralId,
          noteId,
          draftNoteContents,
          backdatedTimestampUtc: backdatedTimestampUtc ?? undefined,
          accessLevel: accessLevel ?? undefined,
        });

        await submitReferralNoteCommand(command);
      },
    [submitReferralNoteCommand]
  );

  const discardDraftReferralNote = useRecoilCallback(
    () => async (referralId: string, noteId: string) => {
      const command = commandFactory(DiscardV1ReferralDraftNote, {
        referralId,
        noteId,
      });

      await submitReferralNoteCommand(command);
    },
    [submitReferralNoteCommand]
  );

  const approveReferralNote = useRecoilCallback(
    () =>
      async (
        referralId: string,
        noteId: string,
        finalizedNoteContents: string,
        backdatedTimestampUtc?: Date,
        accessLevel?: string
      ) => {
        const command = commandFactory(ApproveV1ReferralNote, {
          referralId,
          noteId,
          finalizedNoteContents,
          backdatedTimestampUtc: backdatedTimestampUtc ?? undefined,
          accessLevel: accessLevel ?? undefined,
        });

        await submitReferralNoteCommand(command);
      },
    [submitReferralNoteCommand]
  );

  const updateReferralNoteAccessLevel = useRecoilCallback(
    () => async (referralId: string, noteId: string, accessLevel?: string) => {
      const command = commandFactory(UpdateV1ReferralNoteAccessLevel, {
        referralId,
        noteId,
        accessLevel: accessLevel ?? undefined,
      });

      await submitReferralNoteCommand(command);
    },
    [submitReferralNoteCommand]
  );

  return {
    listReferralNotes,
    createDraftReferralNote,
    editDraftReferralNote,
    discardDraftReferralNote,
    approveReferralNote,
    updateReferralNoteAccessLevel,
  };
}
