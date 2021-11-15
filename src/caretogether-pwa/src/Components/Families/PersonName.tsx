import React from 'react';
import { Person } from '../../GeneratedClient';

type PersonNameProps = {
  person?: Person
};

export function PersonName({ person }: PersonNameProps) {
  return (
    <span className='ct-person-name'>{person && `${person.firstName} ${person.lastName}`}</span>
  );
}
