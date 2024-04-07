import { Person } from '../GeneratedClient';

type PersonNameProps = {
  person?: Person
};

// eslint-disable-next-line react-refresh/only-export-components
export function personNameString(person?: Person) {
  return person
    ? `${person.firstName} ${person.lastName}`
    : '⚠ DELETED PERSON';
}

export function PersonName({ person }: PersonNameProps) {
  return (
    <span className='ct-person-name'>{personNameString(person)}</span>
  );
}
