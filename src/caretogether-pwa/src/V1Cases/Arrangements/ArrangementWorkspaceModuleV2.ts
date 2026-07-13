import { type ComponentType } from 'react';
import { ChildInvolvement } from '../../GeneratedClient';
import { ArrangementRowV2 } from './arrangementViewModel';
import { ChildCareWorkspaceModuleV2 } from './ChildCareWorkspaceModuleV2';

export type ArrangementWorkspaceModuleV2 = {
  key: string;
  title: string;
  Component: ComponentType<{ row: ArrangementRowV2 }>;
};

const childCareWorkspaceModule: ArrangementWorkspaceModuleV2 = {
  key: 'child-care',
  title: 'Child Care',
  Component: ChildCareWorkspaceModuleV2,
};

function usesChildLocation(row: ArrangementRowV2) {
  return (
    row.arrangementPolicy?.childInvolvement ===
      ChildInvolvement.ChildHousing ||
    row.arrangementPolicy?.childInvolvement ===
      ChildInvolvement.DaytimeChildCareOnly
  );
}

export function resolveArrangementWorkspaceModuleV2(
  row: ArrangementRowV2
): ArrangementWorkspaceModuleV2 | null {
  if (usesChildLocation(row)) {
    return childCareWorkspaceModule;
  }

  return null;
}
