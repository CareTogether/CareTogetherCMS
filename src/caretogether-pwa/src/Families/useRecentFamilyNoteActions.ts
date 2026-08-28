import { useCallback } from 'react';
import {
  Note,
  NoteStatus,
  Permission,
  V1Referral,
  V1ReferralNoteStatus,
} from '../GeneratedClient';

type PermissionCheck = (permission: Permission) => boolean;
export type RecentNoteActionKind = 'delete' | 'edit' | 'approve';
type ReferralNoteEntry = NonNullable<V1Referral['notes']>[number];

export type RecentNoteActionAvailability = {
  availableActions: RecentNoteActionKind[];
  canApprove: boolean;
  canDelete: boolean;
  canEdit: boolean;
  hasActions: boolean;
};

type UseRecentFamilyNoteActionsParameters = {
  currentUserId?: string;
  familyPermissions: PermissionCheck;
  globalPermissions: PermissionCheck;
};

function availability({
  canApprove,
  canDelete,
  canEdit,
}: Pick<
  RecentNoteActionAvailability,
  'canApprove' | 'canDelete' | 'canEdit'
>): RecentNoteActionAvailability {
  const availableActions: RecentNoteActionKind[] = [
    ...(canDelete ? (['delete'] as const) : []),
    ...(canEdit ? (['edit'] as const) : []),
    ...(canApprove ? (['approve'] as const) : []),
  ];

  return {
    availableActions,
    canApprove,
    canDelete,
    canEdit,
    hasActions: availableActions.length > 0,
  };
}

export function familyNoteActionAvailability(
  note: Note,
  currentUserId: string | undefined,
  permissions: PermissionCheck
): RecentNoteActionAvailability {
  const isOwnNote = note.authorUserId === currentUserId;
  const isDraft = note.status === NoteStatus.Draft;

  return availability({
    canEdit:
      isDraft &&
      ((isOwnNote && permissions(Permission.AddEditOwnDraftNotes)) ||
        permissions(Permission.AddEditDraftNotes)),
    canDelete:
      isDraft &&
      ((isOwnNote && permissions(Permission.DiscardOwnDraftNotes)) ||
        permissions(Permission.DiscardDraftNotes)),
    canApprove: isDraft && permissions(Permission.ApproveNotes),
  });
}

export function referralNoteActionAvailability(
  referralId: string | undefined,
  note: ReferralNoteEntry | undefined,
  permissions: PermissionCheck
): RecentNoteActionAvailability {
  const canManageReferralNote =
    note?.status === V1ReferralNoteStatus.Draft &&
    !!referralId &&
    permissions(Permission.EditV1Referral);

  return availability({
    canApprove: canManageReferralNote,
    canDelete: canManageReferralNote,
    canEdit: canManageReferralNote,
  });
}

export function useRecentFamilyNoteActions({
  currentUserId,
  familyPermissions,
  globalPermissions,
}: UseRecentFamilyNoteActionsParameters) {
  const getFamilyNoteActions = useCallback(
    (note: Note) =>
      familyNoteActionAvailability(note, currentUserId, familyPermissions),
    [currentUserId, familyPermissions]
  );
  const getReferralNoteActions = useCallback(
    (referralId: string | undefined, note: ReferralNoteEntry | undefined) =>
      referralNoteActionAvailability(referralId, note, globalPermissions),
    [globalPermissions]
  );

  return {
    getFamilyNoteActions,
    getReferralNoteActions,
  };
}
