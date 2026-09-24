import type { Arrangement } from '../GeneratedClient';

export function clientPersonArrangements(
  arrangements: Arrangement[],
  personId: string
) {
  return arrangements.filter(
    (arrangement) => arrangement.partneringFamilyPersonId === personId
  );
}
