import { Arrangement, ArrangementPhase, PartneringFamilyInfo } from '../../GeneratedClient';
import { ArrangementsFilter } from './types';

function allArrangements(partneringFamilyInfo: PartneringFamilyInfo) {
  const closed = (partneringFamilyInfo.closedV1Cases ?? []).flatMap((v1Case) =>
    (v1Case.arrangements ?? []).map((arrangement) => ({
      v1CaseId: v1Case.id!,
      arrangement,
    }))
  );

  const openV1Case = partneringFamilyInfo.openV1Case;
  const open = (openV1Case?.arrangements ?? []).map((arrangement) => ({
    v1CaseId: openV1Case!.id!,
    arrangement,
  }));

  return [...closed, ...open];
}

function matchingArrangements(
  partneringFamilyInfo: PartneringFamilyInfo,
  arrangementsFilter: ArrangementsFilter
) {
  if (arrangementsFilter === 'Intake') {
    return [];
  }

  if (arrangementsFilter === 'All') {
    return allArrangements(partneringFamilyInfo);
  }

  const openV1Case = partneringFamilyInfo.openV1Case;
  const openArrangements = openV1Case?.arrangements ?? [];

  const matchesPhase = (arrangement: Arrangement) => {
    if (arrangementsFilter === 'Active') {
      return arrangement.phase === ArrangementPhase.Started;
    }

    if (arrangementsFilter === 'Setup') {
      return (
        arrangement.phase === ArrangementPhase.SettingUp ||
        arrangement.phase === ArrangementPhase.ReadyToStart
      );
    }

    return (
      arrangement.phase === ArrangementPhase.Started ||
      arrangement.phase === ArrangementPhase.SettingUp ||
      arrangement.phase === ArrangementPhase.ReadyToStart
    );
  };

  return openArrangements.filter(matchesPhase).map((arrangement) => ({
    v1CaseId: openV1Case!.id!,
    arrangement,
  }));
}

export { allArrangements, matchingArrangements };
