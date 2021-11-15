import React from 'react';
import { CombinedFamilyInfo } from '../../GeneratedClient';

type FamilyNameProps = {
  family?: CombinedFamilyInfo
}

export function FamilyName({ family }: FamilyNameProps) {
  const primaryContactPerson = family?.family?.adults?.find(adult =>
    family.family!.primaryFamilyContactPersonId === adult.item1?.id)?.item1;
  
  return (
    <span className='ct-family-name'>{primaryContactPerson?.lastName} Family</span>
  );
}
