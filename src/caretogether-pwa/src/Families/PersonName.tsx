import React from 'react';
import { Person } from '../GeneratedClient';

type PersonNameProps = {
  person?: Person
};

export function personNameString(person?: Person) {
  return person && `${person.firstName} ${person.lastName}`;
}

export function PersonName({ person }: PersonNameProps) {
  return (
    <span className='ct-person-name'>{person && personNameString(person)}</span>
  );
}
