import { ComponentProps } from 'react';
import {
  CombinedFamilyInfo,
  Note,
  RoleRemovalReason,
  V1Case,
  V1Referral,
} from '../GeneratedClient';
import { AddEditV1ReferralNoteDialog } from '../V1Referrals/AddEditV1ReferralNoteDialog';
import { ApproveV1ReferralNoteDialog } from '../V1Referrals/ApproveV1ReferralNoteDialog';
import { DiscardV1ReferralNoteDialog } from '../V1Referrals/DiscardV1ReferralNoteDialog';
import { CloseV1CaseDrawer } from '../V1Cases/CloseV1CaseDrawer';
import { OpenNewV1CaseDialog } from '../V1Cases/OpenNewV1CaseDialog';
import { ArrangementDetailsDrawerV2 } from '../V1Cases/Arrangements/ArrangementDetailsDrawerV2';
import { FamilyCompleteOtherController } from '../Requirements/FamilyCompleteOtherController';
import { RemoveFamilyRoleDialog } from '../Volunteers/RemoveFamilyRoleDialog';
import { ResetFamilyRoleDialog } from '../Volunteers/ResetFamilyRoleDialog';
import { AddEditNoteDialog } from '../Notes/AddEditNoteDialog';
import { ApproveNoteDialog } from '../Notes/ApproveNoteDialog';
import { DiscardNoteDialog } from '../Notes/DiscardNoteDialog';
import { AddAdultDrawer } from './AddAdultDrawer';
import { AddChildDrawer } from './AddChildDrawer';
import { DeleteFamilyDialog } from './DeleteFamilyDialog';
import { FamilyMemberDrawerV2 } from './FamilyMemberDrawerV2';
import { RoleDetailsDrawerV2 } from './RoleDetailsDrawerV2';
import { UploadFamilyDocumentsDialog } from './UploadFamilyDocumentsDialog';
import { ArrangementRowV2 } from '../V1Cases/Arrangements/arrangementViewModel';
import { FamilyMemberRowV2 } from './familyMemberViewModel';

type ReferralNoteEntry = NonNullable<V1Referral['notes']>[number];
type RecentNoteAction = 'edit' | 'approve' | 'delete';
type RecentFamilyNoteAction = {
  action: RecentNoteAction;
  note: Note;
};
type RecentReferralNoteAction = {
  action: RecentNoteAction;
  referralId: string;
  note: ReferralNoteEntry;
};
type RemoveRoleParameter = {
  volunteerFamilyId: string;
  role: string;
};
type ResetRoleParameter = {
  volunteerFamilyId: string;
  role: string;
  removalReason: RoleRemovalReason;
  removalAdditionalComments: string;
};

type FamilyScreenWorkflowCoordinatorV2Props = {
  addAdultDialogOpen: boolean;
  addChildDialogOpen: boolean;
  addNoteDialogOpen: boolean;
  closeCaseDrawerOpen: boolean;
  deleteFamilyDialogHandle: ComponentProps<typeof DeleteFamilyDialog>['handle'];
  family: CombinedFamilyInfo;
  familyCompleteOtherOpen: boolean;
  familyId: string;
  openNewV1CaseDialogOpen: boolean;
  openReferralId?: string;
  recentFamilyNoteAction: RecentFamilyNoteAction | null;
  recentReferralNoteAction: RecentReferralNoteAction | null;
  removeRoleParameter: RemoveRoleParameter | null;
  resetRoleParameter: ResetRoleParameter | null;
  selectedArrangementRow: ArrangementRowV2 | null;
  selectedFamilyMemberRow: FamilyMemberRowV2 | null;
  selectedRemovedRole: ComponentProps<typeof RoleDetailsDrawerV2>['removedRole'];
  selectedRoleSummaryCard: ComponentProps<typeof RoleDetailsDrawerV2>['card'];
  selectedV1Case?: V1Case;
  uploadDocumentDialogOpen: boolean;
  onAddAdultClose: ComponentProps<typeof AddAdultDrawer>['onClose'];
  onAddChildClose: ComponentProps<typeof AddChildDrawer>['onClose'];
  onAddNoteClose: () => void;
  onArrangementClose: () => void;
  onCloseCaseDrawerClose: () => void;
  onFamilyCompleteOtherClose: () => void;
  onFamilyMemberClose: () => void;
  onOpenNewV1CaseDialogClose: () => void;
  onRecentFamilyNoteActionClose: () => void;
  onRecentReferralNoteActionClose: () => void;
  onRemoveRoleClose: () => void;
  onResetRoleClose: () => void;
  onRoleDetailsClose: () => void;
  onUploadDocumentClose: () => void;
};

export function FamilyScreenWorkflowCoordinatorV2({
  addAdultDialogOpen,
  addChildDialogOpen,
  addNoteDialogOpen,
  closeCaseDrawerOpen,
  deleteFamilyDialogHandle,
  family,
  familyCompleteOtherOpen,
  familyId,
  openNewV1CaseDialogOpen,
  openReferralId,
  recentFamilyNoteAction,
  recentReferralNoteAction,
  removeRoleParameter,
  resetRoleParameter,
  selectedArrangementRow,
  selectedFamilyMemberRow,
  selectedRemovedRole,
  selectedRoleSummaryCard,
  selectedV1Case,
  uploadDocumentDialogOpen,
  onAddAdultClose,
  onAddChildClose,
  onAddNoteClose,
  onArrangementClose,
  onCloseCaseDrawerClose,
  onFamilyCompleteOtherClose,
  onFamilyMemberClose,
  onOpenNewV1CaseDialogClose,
  onRecentFamilyNoteActionClose,
  onRecentReferralNoteActionClose,
  onRemoveRoleClose,
  onResetRoleClose,
  onRoleDetailsClose,
  onUploadDocumentClose,
}: FamilyScreenWorkflowCoordinatorV2Props) {
  return (
    <>
      <FamilyCompleteOtherController
        familyId={familyId}
        open={familyCompleteOtherOpen}
        onClose={onFamilyCompleteOtherClose}
      />
      {uploadDocumentDialogOpen && (
        <UploadFamilyDocumentsDialog
          family={family}
          onClose={onUploadDocumentClose}
        />
      )}
      {addAdultDialogOpen && <AddAdultDrawer onClose={onAddAdultClose} />}
      {addChildDialogOpen && <AddChildDrawer onClose={onAddChildClose} />}
      <FamilyMemberDrawerV2
        family={family}
        row={selectedFamilyMemberRow}
        open={selectedFamilyMemberRow !== null}
        onClose={onFamilyMemberClose}
      />
      {addNoteDialogOpen && (
        <AddEditNoteDialog familyId={family.family!.id!} onClose={onAddNoteClose} />
      )}
      {recentFamilyNoteAction?.action === 'edit' && (
        <AddEditNoteDialog
          familyId={family.family!.id!}
          note={recentFamilyNoteAction.note}
          onClose={onRecentFamilyNoteActionClose}
        />
      )}
      {recentFamilyNoteAction?.action === 'approve' && (
        <ApproveNoteDialog
          familyId={family.family!.id!}
          note={recentFamilyNoteAction.note}
          onClose={onRecentFamilyNoteActionClose}
        />
      )}
      {recentFamilyNoteAction?.action === 'delete' && (
        <DiscardNoteDialog
          familyId={family.family!.id!}
          note={recentFamilyNoteAction.note}
          onClose={onRecentFamilyNoteActionClose}
        />
      )}
      {recentReferralNoteAction?.action === 'edit' && (
        <AddEditV1ReferralNoteDialog
          referralId={recentReferralNoteAction.referralId}
          note={recentReferralNoteAction.note}
          onClose={onRecentReferralNoteActionClose}
        />
      )}
      {recentReferralNoteAction?.action === 'approve' && (
        <ApproveV1ReferralNoteDialog
          referralId={recentReferralNoteAction.referralId}
          note={recentReferralNoteAction.note}
          onClose={onRecentReferralNoteActionClose}
        />
      )}
      {recentReferralNoteAction?.action === 'delete' && (
        <DiscardV1ReferralNoteDialog
          referralId={recentReferralNoteAction.referralId}
          note={recentReferralNoteAction.note}
          onClose={onRecentReferralNoteActionClose}
        />
      )}
      {removeRoleParameter && (
        <RemoveFamilyRoleDialog
          volunteerFamilyId={familyId}
          role={removeRoleParameter.role}
          onClose={onRemoveRoleClose}
        />
      )}
      {resetRoleParameter && (
        <ResetFamilyRoleDialog
          volunteerFamilyId={familyId}
          role={resetRoleParameter.role}
          removalReason={resetRoleParameter.removalReason}
          removalAdditionalComments={
            resetRoleParameter.removalAdditionalComments
          }
          onClose={onResetRoleClose}
        />
      )}
      {deleteFamilyDialogHandle.open && (
        <DeleteFamilyDialog
          key={deleteFamilyDialogHandle.key}
          handle={deleteFamilyDialogHandle}
          familyId={familyId}
        />
      )}
      <RoleDetailsDrawerV2
        card={selectedRoleSummaryCard}
        removedRole={selectedRemovedRole}
        open={selectedRoleSummaryCard !== null || selectedRemovedRole !== null}
        onClose={onRoleDetailsClose}
      />
      <ArrangementDetailsDrawerV2
        row={selectedArrangementRow}
        open={selectedArrangementRow !== null}
        onClose={onArrangementClose}
      />
      {closeCaseDrawerOpen && selectedV1Case?.id && (
        <CloseV1CaseDrawer
          partneringFamilyId={familyId}
          v1CaseId={selectedV1Case.id}
          onClose={onCloseCaseDrawerClose}
        />
      )}
      {openNewV1CaseDialogOpen && (
        <OpenNewV1CaseDialog
          partneringFamilyId={family.family!.id!}
          referralId={openReferralId}
          onClose={onOpenNewV1CaseDialogClose}
        />
      )}
    </>
  );
}
