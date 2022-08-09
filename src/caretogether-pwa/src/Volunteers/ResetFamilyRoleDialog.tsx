import { RoleRemovalReason } from '../../GeneratedClient';
import { useVolunteersModel } from '../../Model/VolunteersModel';
import { UpdateDialog } from '../UpdateDialog';

interface ResetFamilyRoleDialogProps {
  volunteerFamilyId: string,
  role: string,
  removalReason: RoleRemovalReason,
  removalAdditionalComments: string,
  onClose: () => void
}

export function ResetFamilyRoleDialog({volunteerFamilyId, role, removalReason, removalAdditionalComments, onClose}: ResetFamilyRoleDialogProps) {
  const volunteerFamiliesModel = useVolunteersModel();

  async function save() {
    await volunteerFamiliesModel.resetFamilyRole(volunteerFamilyId,
      role);
  }

  return (
    <UpdateDialog title={`Do you want to reset the ${role} role for this family?`} onClose={onClose}
      onSave={save}>
      <p>
        The current status of this role is {RoleRemovalReason[removalReason]}. Additional comments were:
        <br />
        <i>{removalAdditionalComments}</i>
      </p>
    </UpdateDialog>
  );
}
