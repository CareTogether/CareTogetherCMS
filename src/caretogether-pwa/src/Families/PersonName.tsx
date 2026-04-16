import { Person } from '../GeneratedClient';
import { SYSTEM_USER_ID } from '../constants';

type PersonNameProps = {
  person?: Person;
};

// eslint-disable-next-line react-refresh/only-export-components
export function personNameString(person?: Person) {
  return person
    ? `${person.firstName} ${person.lastName}`.trim()
    : '⚠ DELETED PERSON';
}

export function PersonName({ person }: PersonNameProps) {
  const isDeleted = !person;
  const isSystem = person?.id?.toLowerCase() === SYSTEM_USER_ID;
  const className = ['ct-person-name', (isDeleted || isSystem) && 'ph-unmask']
    .filter(Boolean)
    .join(' ');

  return <span className={className}>{personNameString(person)}</span>;
}
