import { ExemptedRequirementInfo } from '../../GeneratedClient';
import { useVolunteersModel } from '../../Model/VolunteersModel';
import { UpdateDialog } from '../UpdateDialog';

interface UnexemptVolunteerFamilyRequirementDialogProps {
  volunteerFamilyId: string,
  exemptedRequirement: ExemptedRequirementInfo,
  onClose: () => void
}

export function UnexemptVolunteerFamilyRequirementDialog({volunteerFamilyId, exemptedRequirement, onClose}: UnexemptVolunteerFamilyRequirementDialogProps) {
  const volunteerFamiliesModel = useVolunteersModel();

  async function save() {
    await volunteerFamiliesModel.unexemptVolunteerFamilyRequirement(volunteerFamilyId,
      exemptedRequirement.requirementName!);
  }

  return (
    <UpdateDialog title={`Reinstate the ${exemptedRequirement.requirementName} requirement for this family`} onClose={onClose}
      onSave={save}>
      <p>Are you sure you want to remove the exemption for this requirement?</p>
    </UpdateDialog>
  );
}
