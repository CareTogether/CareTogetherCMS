import {
  FamilyVolunteerAssignment,
  IndividualVolunteerAssignment,
} from '../../GeneratedClient';
import { FamilyName } from '../../Families/FamilyName';
import { PersonName } from '../../Families/PersonName';
import {
  useFamilyLookup,
  usePersonLookup,
} from '../../Model/DirectoryModel';

export function AssignmentLabel({
  assignment,
}: {
  assignment: FamilyVolunteerAssignment | IndividualVolunteerAssignment;
}) {
  const familyLookup = useFamilyLookup();
  const personLookup = usePersonLookup();

  if (assignment instanceof IndividualVolunteerAssignment) {
    return (
      <PersonName
        person={personLookup(assignment.familyId, assignment.personId)}
      />
    );
  }

  return <FamilyName family={familyLookup(assignment.familyId)} />;
}
