import { Person, RoleRemovalReason } from '../../GeneratedClient';
import { useVolunteersModel } from '../../Model/VolunteersModel';
import { UpdateDialog } from '../UpdateDialog';

interface ResetIndividualRoleDialogProps {
  volunteerFamilyId: string,
  person: Person,
  role: string,
  removalReason: RoleRemovalReason,
  removalAdditionalComments: string,
  onClose: () => void
}

export function ResetIndividualRoleDialog({volunteerFamilyId, person, role, removalReason, removalAdditionalComments, onClose}: ResetIndividualRoleDialogProps) {
  const volunteerFamiliesModel = useVolunteersModel();

  async function save() {
    await volunteerFamiliesModel.resetIndividualRole(volunteerFamilyId, person.id as string,
      role);
  }

  return (
    <UpdateDialog title={`Do you want to reset the ${role} role for ${person.firstName} ${person.lastName}?`} onClose={onClose}
      onSave={save}>
      <p>
        The current status of this role is {RoleRemovalReason[removalReason]}. Additional comments were:
        <br />
        <i>{removalAdditionalComments}</i>
      </p>
    </UpdateDialog>
  );
}
