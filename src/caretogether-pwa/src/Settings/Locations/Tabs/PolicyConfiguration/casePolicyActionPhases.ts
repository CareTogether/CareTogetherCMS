import type {
  MatrixEdit,
  MatrixPhase,
  MatrixRequirement,
} from './casePolicyMatrix.ts';

export type ActionPhaseContribution = {
  scope: string;
  phase: MatrixPhase;
  source: MatrixRequirement['source'];
  ambiguous: boolean;
};

export type ActionPhaseResolution = {
  status: 'unused' | 'single' | 'conflict' | 'ambiguous';
  phase?: MatrixPhase;
  contributions: ActionPhaseContribution[];
  message?: string;
};

export function resolveActionPhases(
  resolved: boolean,
  contributions: ActionPhaseContribution[]
): ActionPhaseResolution {
  if (!resolved || contributions.some((item) => item.ambiguous))
    return {
      status: 'ambiguous',
      contributions,
      message:
        'The action identity or requirement source is ambiguous. Existing requirements are preserved; new assignments are unavailable.',
    };
  const phases = [...new Set(contributions.map((item) => item.phase))];
  if (!phases.length) return { status: 'unused', contributions };
  if (phases.length === 1)
    return {
      status: 'single',
      phase: phases[0],
      contributions,
      message: `${phases[0]} is the established arrangement phase for this action in this location.`,
    };
  return {
    status: 'conflict',
    contributions,
    message:
      'Conflicting arrangement phases: ' +
      phases
        .map(
          (phase) =>
            `${phase} (${[...new Set(contributions.filter((item) => item.phase === phase).map((item) => item.scope))].join('; ')})`
        )
        .join('; ') +
      '. Existing requirements are preserved. Only applicability and supported schedules may be edited.',
  };
}

export function validateActionPhaseEdits(
  resolution: ActionPhaseResolution,
  original: readonly MatrixRequirement[],
  edits: readonly MatrixEdit[]
) {
  if (resolution.status === 'ambiguous') throw new Error(resolution.message);
  if (resolution.status === 'single') {
    if (edits.some((item) => item.phase !== resolution.phase))
      throw new Error(resolution.message);
    return;
  }
  if (resolution.status === 'conflict') {
    if (
      edits.length !== original.length ||
      edits.some(
        (edit) =>
          !original.some(
            (item) => item.id === edit.id && item.phase === edit.phase
          )
      )
    )
      throw new Error(resolution.message);
    return;
  }
  if (new Set(edits.map((item) => item.phase)).size > 1)
    throw new Error('Choose one arrangement phase for this action.');
}
