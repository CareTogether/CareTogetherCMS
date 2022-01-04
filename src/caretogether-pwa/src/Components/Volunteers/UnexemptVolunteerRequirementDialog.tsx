import { ExemptedRequirementInfo } from '../../GeneratedClient';
import { useVolunteersModel } from '../../Model/VolunteersModel';
import { UpdateDialog } from '../UpdateDialog';

interface UnexemptVolunteerRequirementDialogProps {
  volunteerFamilyId: string,
  personId: string,
  exemptedRequirement: ExemptedRequirementInfo,
  onClose: () => void
}

export function UnexemptVolunteerRequirementDialog({volunteerFamilyId, personId, exemptedRequirement, onClose}: UnexemptVolunteerRequirementDialogProps) {
  const volunteerFamiliesModel = useVolunteersModel();

  async function save() {
    await volunteerFamiliesModel.unexemptVolunteerRequirement(volunteerFamilyId, personId,
      exemptedRequirement.requirementName!);
  }

  return (
    <UpdateDialog title={`Reinstate the ${exemptedRequirement.requirementName} requirement for this person`} onClose={onClose}
      onSave={save}>
      <p>Are you sure you want to remove the exemption for this requirement?</p>
    </UpdateDialog>
  );
}
