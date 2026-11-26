import {
  NoteStatus,
  Permission,
  V1ReferralNoteStatus,
  type AccessLevel,
  type CombinedFamilyInfo,
  type Note,
  type V1ReferralInfo,
  type V1ReferralNoteEntry,
} from '../GeneratedClient.ts';
import {
  familyNoteActionAvailability,
  referralNoteActionAvailability,
} from '../Families/useRecentFamilyNoteActions.ts';

export type NoteReviewSource = 'family' | 'referral';

type NoteReviewItem = {
  id: string;
  recordId: string;
  familyId?: string;
  name: string;
  preview: string;
  createdAt?: Date;
  canEdit: boolean;
} & (
  | { source: 'family'; note: Note }
  | { source: 'referral'; note: V1ReferralNoteEntry }
);

function preview(contents?: string) {
  const text = contents?.trim().replace(/\s+/g, ' ') ?? '';
  return text.length > 140 ? `${text.slice(0, 140)}…` : text;
}

export function buildDashboardNoteReview(
  families: readonly CombinedFamilyInfo[],
  referrals: readonly V1ReferralInfo[],
  familyName: (familyId: string) => string | undefined,
  reviewer?: {
    userId?: string;
    roles?: readonly string[];
    accessLevels?: readonly AccessLevel[];
  }
) {
  const items = new Map<string, NoteReviewItem>();

  for (const family of families) {
    const id = family.family?.id;
    if (!id || !family.userPermissions?.includes(Permission.ApproveNotes))
      continue;
    for (const note of family.notes ?? []) {
      if (!note.id || note.status !== NoteStatus.Draft) continue;
      const restrictedRoles = reviewer?.accessLevels?.find(
        (level) => level.name === note.accessLevel
      )?.organizationRoles;
      const canEditAtAccessLevel =
        !note.accessLevel ||
        (!!reviewer?.accessLevels &&
          (!restrictedRoles?.length ||
            restrictedRoles.some((role) => reviewer.roles?.includes(role))));
      const { canEdit } = familyNoteActionAvailability(
        note,
        reviewer?.userId,
        (permission) =>
          (permission !== Permission.AddEditDraftNotes ||
            canEditAtAccessLevel) &&
          family.userPermissions.includes(permission)
      );
      items.set(JSON.stringify(['family', id, note.id]), {
        id: note.id,
        recordId: id,
        familyId: id,
        source: 'family',
        name: familyName(id) ?? 'Family',
        note,
        canEdit,
        preview: preview(note.contents),
        createdAt: note.createdTimestampUtc,
      });
    }
  }

  for (const { referral, userPermissions } of referrals) {
    if (
      !referral?.referralId ||
      !userPermissions?.includes(Permission.ViewV1Referral) ||
      !userPermissions.includes(Permission.EditV1Referral)
    )
      continue;
    const associatedFamily = referral.familyId && familyName(referral.familyId);
    const name = [referral.title?.trim() || 'Referral', associatedFamily]
      .filter(Boolean)
      .join(' · ');
    for (const note of referral.notes ?? []) {
      if (!note.id || note.status !== V1ReferralNoteStatus.Draft) continue;
      const { canEdit } = referralNoteActionAvailability(
        referral.referralId,
        note,
        (permission) => userPermissions.includes(permission)
      );
      items.set(JSON.stringify(['referral', referral.referralId, note.id]), {
        id: note.id,
        recordId: referral.referralId,
        familyId: referral.familyId,
        source: 'referral',
        name,
        note,
        canEdit,
        preview: preview(note.contents),
        createdAt: note.createdTimestampUtc,
      });
    }
  }

  return [...items.values()];
}

export function filterDashboardNoteReview(
  items: NoteReviewItem[],
  source: NoteReviewSource | 'all'
) {
  return source === 'all'
    ? items
    : items.filter((item) => item.source === source);
}
