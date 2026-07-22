import {
  ArrangementPhase,
  CombinedFamilyInfo,
  CustomField,
  PartneringFamilyInfo,
  Person,
} from '../../GeneratedClient';
import { ReactNode } from 'react';

type ArrangementsFilter =
  | 'All'
  | 'Intake'
  | 'Active'
  | 'Setup'
  | 'Active + Setup';

function normalizeArrangementsFilter(
  value: ArrangementsFilter | null | undefined
): ArrangementsFilter {
  switch (value) {
    case 'All':
    case 'Intake':
    case 'Active':
    case 'Setup':
    case 'Active + Setup':
      return value;

    default:
      return 'All';
  }
}

type PartneringFamilyTableItemProps = {
  partneringFamily: CombinedFamilyInfo;
  arrangementTypes: string[];
  arrangementsFilter: ArrangementsFilter;
  expandedView: boolean;
  openArrangement: (
    familyId: string,
    v1CaseId: string,
    arrangementId: string
  ) => void;
  openFamily: (familyId: string) => void;
  assignmentRoles: string[];
  assignmentPersonLookup: (personId: string) => Person | undefined;
  referralCustomFields: CustomField[];
  arrangementStatusSummary: (
    partneringFamilyInfo: PartneringFamilyInfo,
    phase: ArrangementPhase,
    type: string
  ) => ReactNode;
  updateTestFamilyFlagEnabled?: boolean;
};

export type { ArrangementsFilter, PartneringFamilyTableItemProps };
export { normalizeArrangementsFilter };
