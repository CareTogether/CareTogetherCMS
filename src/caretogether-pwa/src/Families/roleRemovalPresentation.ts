import { RoleRemovalReason, type RoleRemoval } from '../GeneratedClient';

export function roleRemovalReasonLabel(reason: RoleRemovalReason) {
  return RoleRemovalReason[reason];
}

export function roleRemovalComment(roleRemoval: RoleRemoval) {
  return roleRemoval.additionalComments?.trim() || 'No comment provided.';
}
