import type {
  ArrangementPolicy,
  ArrangementFunctionVariant,
  EffectiveLocationPolicy,
  MonitoringRequirement,
  RequirementDefinition,
  RecurrencePolicy,
} from '../../../../GeneratedClient.ts';
import { scheduleValidation } from './matrixSchedule.ts';

export const matrixPhases = ['Setup', 'Monitoring', 'Closeout'] as const;
export type MatrixPhase = (typeof matrixPhases)[number];
export type MatrixOwner = ArrangementPolicy | ArrangementFunctionVariant;
export type MatrixScope = {
  field: string;
  arrangement: string;
  functionName?: string;
  variant?: string;
  label: string;
  readOnlyReason?: string;
};
export type MatrixRequirement = {
  id: string;
  phase: MatrixPhase;
  source: 'Current' | 'Legacy' | 'Compatibility';
  index: number;
  actionName: string;
  isRequired: boolean;
  recurrence?: RecurrencePolicy;
  readOnlyReason?: string;
};
export type MatrixEdit = {
  id: string;
  phase: MatrixPhase;
  isRequired: boolean;
  recurrence?: RecurrencePolicy;
  schedule?: Record<string, unknown>;
};

function copy<T extends object>(value: T, changes: Partial<T>): T {
  return Object.assign(
    Object.create(Object.getPrototypeOf(value)),
    value,
    changes
  );
}

export function matrixScopes(policy: EffectiveLocationPolicy) {
  const scopes: MatrixScope[] = [];
  const issues: string[] = [];
  const arrangements = policy.referralPolicy.arrangementPolicies ?? [];
  const unique = (name: string, names: string[]) =>
    !!name?.trim() &&
    names.filter((item) => item?.toLowerCase() === name.toLowerCase())
      .length === 1;
  for (const arrangement of arrangements) {
    if (
      !unique(
        arrangement.arrangementType,
        arrangements.map((item) => item.arrangementType)
      )
    ) {
      issues.push(
        'Ambiguous arrangement identity: ' + arrangement.arrangementType
      );
      continue;
    }
    const base = {
      arrangement: arrangement.arrangementType,
      readOnlyReason: arrangement.supersededAtUtc
        ? 'Superseded arrangement; read-only.'
        : undefined,
    };
    scopes.push({
      ...base,
      field: JSON.stringify([base.arrangement, null, null]),
      label: 'Shared',
    });
    for (const fn of arrangement.arrangementFunctions ?? []) {
      if (
        !unique(
          fn.functionName,
          arrangement.arrangementFunctions.map((item) => item.functionName)
        )
      ) {
        issues.push(
          'Ambiguous function identity: ' +
            base.arrangement +
            ' / ' +
            fn.functionName
        );
        continue;
      }
      for (const variant of fn.variants ?? []) {
        if (
          !unique(
            variant.variantName,
            fn.variants.map((item) => item.variantName)
          )
        ) {
          issues.push(
            'Ambiguous variant identity: ' +
              base.arrangement +
              ' / ' +
              fn.functionName +
              ' / ' +
              variant.variantName
          );
          continue;
        }
        scopes.push({
          ...base,
          field: JSON.stringify([
            base.arrangement,
            fn.functionName,
            variant.variantName,
          ]),
          functionName: fn.functionName,
          variant: variant.variantName,
          label: variant.variantName,
        });
      }
    }
  }
  return { scopes, issues: [...new Set(issues)] };
}

export function matrixOwner(
  policy: EffectiveLocationPolicy,
  scope: MatrixScope
): MatrixOwner {
  const arrangement = policy.referralPolicy.arrangementPolicies.find(
    (item) => item.arrangementType === scope.arrangement
  )!;
  if (!scope.functionName) return arrangement;
  return arrangement.arrangementFunctions
    .find((item) => item.functionName === scope.functionName)!
    .variants.find((item) => item.variantName === scope.variant)!;
}

export function matrixCellHasChanges(
  base: MatrixOwner,
  value: MatrixOwner,
  actionName: string
) {
  if (base === value) return false;
  const sources = (owner: MatrixOwner) => [
    (owner.requiredSetupActionNames ?? []).filter(
      (name) => name === actionName
    ),
    (owner.requiredSetupActions ?? []).filter(
      (item) => item.actionName === actionName
    ),
    (owner.requiredMonitoringActions ?? []).filter(
      (item) => item.actionName === actionName
    ),
    (owner.requiredMonitoringActionsNew ?? []).filter(
      (item) => item.action?.actionName === actionName
    ),
    (owner.requiredCloseoutActionNames ?? []).filter(
      (name) => name === actionName
    ),
    (owner.requiredCloseoutActions ?? []).filter(
      (item) => item.actionName === actionName
    ),
  ];
  return JSON.stringify(sources(base)) !== JSON.stringify(sources(value));
}

function contributions(
  owner: MatrixOwner,
  phase: MatrixPhase
): MatrixRequirement[] {
  const current =
    phase === 'Setup'
      ? (owner.requiredSetupActions ?? [])
      : phase === 'Closeout'
        ? (owner.requiredCloseoutActions ?? [])
        : (owner.requiredMonitoringActionsNew ?? []).map((item) => ({
            ...item.action,
            recurrence: item.recurrence,
          }));
  const legacy =
    phase === 'Setup'
      ? (owner.requiredSetupActionNames ?? []).map((actionName) => ({
          actionName,
          isRequired: true,
        }))
      : phase === 'Closeout'
        ? (owner.requiredCloseoutActionNames ?? []).map((actionName) => ({
            actionName,
            isRequired: true,
          }))
        : (owner.requiredMonitoringActions ?? []).map((item) => ({
            actionName: item.actionName,
            isRequired: true,
            recurrence: item.recurrence,
          }));
  const compatibility =
    phase === 'Monitoring'
      ? (owner.requiredMonitoringActions_PRE_MIGRATION ?? []).map((item) => ({
          ...item.action,
          recurrence: item.recurrence,
        }))
      : phase === 'Closeout'
        ? (owner.requiredCloseoutActionNames_PRE_MIGRATION ?? [])
        : 'requiredSetupActions_PRE_MIGRATION' in owner
          ? (owner.requiredSetupActions_PRE_MIGRATION ?? [])
          : (owner.requiredSetupActionNames_PRE_MIGRATION ?? []);
  const signature = (item: {
    actionName: string;
    isRequired: boolean;
    recurrence?: RecurrencePolicy;
  }) => JSON.stringify([item.actionName, item.isRequired, item.recurrence]);
  const remaining = [...legacy, ...current].map(signature);
  const extra = compatibility.filter((item) => {
    const index = remaining.indexOf(signature(item));
    if (index < 0) return true;
    remaining.splice(index, 1);
    return false;
  });
  return (
    [
      ['Legacy', legacy],
      ['Current', current],
      ['Compatibility', extra],
    ] as const
  ).flatMap(([source, items]) =>
    items.map((item, index) => ({
      ...item,
      id: JSON.stringify([phase, source, index]),
      phase,
      source,
      index,
    }))
  );
}

export function matrixRequirements(
  owner: MatrixOwner,
  baseline: MatrixOwner = owner
): MatrixRequirement[] {
  return matrixPhases.flatMap((phase) => {
    const rows = [
      ...contributions(owner, phase).filter(
        (item) => item.source !== 'Compatibility'
      ),
      ...contributions(baseline, phase).filter(
        (item) => item.source === 'Compatibility'
      ),
    ];
    return rows.map((row) => ({
      ...row,
      readOnlyReason:
        row.source !== 'Current'
          ? 'Legacy or compatibility-only contribution; read-only.'
          : rows.filter((item) => item.actionName === row.actionName).length > 1
            ? 'Duplicate or mixed-source contribution; read-only.'
            : typeof row.isRequired !== 'boolean'
              ? 'Missing Required/Optional value; read-only.'
              : row.phase === 'Monitoring'
                ? scheduleValidation(row.recurrence?.toJSON())
                : undefined,
    }));
  });
}

export function matrixActions(policy: EffectiveLocationPolicy) {
  const names = new Set(Object.keys(policy.actionDefinitions ?? {}));
  for (const arrangement of policy.referralPolicy.arrangementPolicies ?? []) {
    for (const row of matrixRequirements(arrangement))
      names.add(row.actionName);
    for (const fn of arrangement.arrangementFunctions ?? [])
      for (const variant of fn.variants ?? [])
        for (const row of matrixRequirements(variant))
          names.add(row.actionName);
  }
  return [...names];
}

export function applyMatrixEdits(
  policy: EffectiveLocationPolicy,
  baseline: EffectiveLocationPolicy,
  scope: MatrixScope,
  actionName: string,
  edits: MatrixEdit[],
  create: (
    edit: MatrixEdit,
    original?: MatrixRequirement
  ) => RequirementDefinition | MonitoringRequirement
) {
  const validated = matrixScopes(policy).scopes.find(
    (item) => item.field === scope.field
  );
  if (!validated || validated.readOnlyReason)
    throw new Error(validated?.readOnlyReason ?? 'The policy scope changed.');
  if (
    !actionName.trim() ||
    !Object.hasOwn(policy.actionDefinitions, actionName) ||
    matrixActions(policy).filter(
      (name) => name.trim().toLowerCase() === actionName.trim().toLowerCase()
    ).length !== 1 ||
    Object.keys(policy.actionDefinitions).filter(
      (name) => name.toLowerCase() === actionName.toLowerCase()
    ).length !== 1
  )
    throw new Error('Unknown or ambiguous Action Definition; read-only.');
  if (
    !matrixScopes(baseline).scopes.some(
      (item) => item.field === validated.field
    )
  )
    throw new Error(
      'The policy scope changed. Reload and review before editing.'
    );
  const owner = matrixOwner(policy, validated);
  const original = matrixRequirements(
    owner,
    matrixOwner(baseline, validated)
  ).filter((item) => item.actionName === actionName);
  const editable = original.filter((item) => !item.readOnlyReason);
  if (new Set(edits.map((item) => item.phase)).size !== edits.length)
    throw new Error(
      'Only one current contribution per action and phase is supported.'
    );
  for (const edit of edits) {
    if (
      !matrixPhases.includes(edit.phase) ||
      typeof edit.isRequired !== 'boolean'
    )
      throw new Error('Invalid requirement.');
    if (
      original.some((item) => item.phase === edit.phase && item.readOnlyReason)
    )
      throw new Error('This phase contains a protected contribution.');
    if (edit.phase === 'Monitoring') {
      const error = scheduleValidation(
        edit.schedule ?? edit.recurrence?.toJSON()
      );
      if (error) throw new Error(error);
    }
    if (
      edit.recurrence &&
      !edit.schedule &&
      !editable.some(
        (item) => item.id === edit.id && item.recurrence === edit.recurrence
      )
    )
      throw new Error('The schedule changed. Review the current requirement.');
  }
  const changes: Partial<MatrixOwner> = {};
  for (const phase of matrixPhases) {
    const key =
      phase === 'Setup'
        ? 'requiredSetupActions'
        : phase === 'Monitoring'
          ? 'requiredMonitoringActionsNew'
          : 'requiredCloseoutActions';
    const source = owner[key] ?? [];
    const pending = edits.filter((item) => item.phase === phase);
    const values: (RequirementDefinition | MonitoringRequirement)[] = [];
    for (let index = 0; index < source.length; index++) {
      const entry = source[index];
      const name =
        'action' in entry ? entry.action.actionName : entry.actionName;
      const row = editable.find(
        (item) => item.phase === phase && item.index === index
      );
      if (name !== actionName || !row) {
        values.push(entry);
        continue;
      }
      const edit = pending.find((item) => item.id === row.id);
      if (edit) {
        values.push(create(edit, row));
        pending.splice(pending.indexOf(edit), 1);
      }
    }
    for (const edit of pending)
      values.push(
        create(
          edit,
          editable.find((item) => item.id === edit.id)
        )
      );
    if (JSON.stringify(values) !== JSON.stringify(source))
      Object.assign(changes, { [key]: values });
  }
  if (Object.keys(changes).length === 0) return policy;
  const updated = copy(owner, changes);
  return copy(policy, {
    referralPolicy: copy(policy.referralPolicy, {
      arrangementPolicies: policy.referralPolicy.arrangementPolicies.map(
        (arrangement) =>
          arrangement.arrangementType !== scope.arrangement
            ? arrangement
            : !scope.functionName
              ? (updated as ArrangementPolicy)
              : copy(arrangement, {
                  arrangementFunctions: arrangement.arrangementFunctions.map(
                    (fn) =>
                      fn.functionName !== scope.functionName
                        ? fn
                        : copy(fn, {
                            variants: fn.variants.map((variant) =>
                              variant.variantName === scope.variant
                                ? (updated as ArrangementFunctionVariant)
                                : variant
                            ),
                          })
                  ),
                })
      ),
    }),
  });
}
