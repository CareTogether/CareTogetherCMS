import React from 'react';
import { CombinedFamilyInfo } from '../GeneratedClient';
import { personNameString } from './PersonName';

type FamilyNameProps = {
  family?: CombinedFamilyInfo
}

export function familyNameString(family?: CombinedFamilyInfo) {
  const primaryContactPerson = family?.family?.adults?.find(adult =>
    family.family!.primaryFamilyContactPersonId === adult.item1?.id)?.item1;
  
  return primaryContactPerson && `${personNameString(primaryContactPerson)} Family`;
}

export function FamilyName({ family }: FamilyNameProps) {
  return (
    <span className='ct-family-name'>{familyNameString(family)}</span>
  );
}
