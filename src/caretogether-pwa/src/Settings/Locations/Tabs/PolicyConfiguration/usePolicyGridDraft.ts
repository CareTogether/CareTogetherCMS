import { useUnsavedPolicyNavigation } from '../../../../Hooks/useUnsavedPolicyNavigation';
import { useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  createPolicyGridDraft,
  countPolicyGridChanges,
  policyGridHasChanges,
  resolvePolicyGridDraft,
  savePolicyGridDraft,
  samePolicyGridValue,
  stagePolicyGridDraft,
  movePolicyGridHistory,
  cancelPolicyGridDraft,
} from './policyGridDraft';

export function usePolicyGridDraft<T>(
  loaded: T,
  save: (value: T) => Promise<boolean>,
  key = '',
  historyEnabled = false
) {
  const location = useLocation();
  const scope = `${location.pathname}/${key}`;
  const [state, setState] = useState(() =>
    createPolicyGridDraft(loaded, scope)
  );
  const current = resolvePolicyGridDraft(state, loaded, scope);
  const ref = useRef(current);
  ref.current = current;
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [error, setError] = useState<string>();
  const [saveNotice, setSaveNotice] = useState<{
    scope: string;
    value: T;
    id: number;
  }>();
  const saveSequence = useRef(0);
  const dirty = policyGridHasChanges(current);

  useUnsavedPolicyNavigation(dirty, saving);

  function stage(value: T | ((current: T) => T)) {
    if (savingRef.current) return;
    setSaveNotice(undefined);
    const next = stagePolicyGridDraft(
      ref.current,
      typeof value === 'function'
        ? (value as (current: T) => T)(ref.current.value)
        : value,
      historyEnabled
    );
    ref.current = next;
    setState(next);
    setError(undefined);
  }

  async function persist() {
    if (savingRef.current || !policyGridHasChanges(ref.current)) return;
    if (document.querySelector('.MuiDataGrid-cell--editing')) {
      setError('Finish the current cell with Enter or Tab before saving.');
      return;
    }
    savingRef.current = true;
    setSaveNotice(undefined);
    setSaving(true);
    setError(undefined);
    const captured = ref.current;
    try {
      const next = await savePolicyGridDraft(captured, loaded, save);
      if (ref.current.scope === captured.scope) {
        ref.current = next;
        setState(next);
        setSaveNotice({
          scope: captured.scope,
          value: next.value,
          id: ++saveSequence.current,
        });
      }
    } catch (error) {
      if (ref.current.scope === captured.scope)
        setError(
          error instanceof Error
            ? error.message
            : 'Changes could not be saved. Your draft is retained.'
        );
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  function cancel() {
    if (savingRef.current) return;
    setSaveNotice(undefined);
    const next = cancelPolicyGridDraft(ref.current, loaded);
    ref.current = next;
    setState(next);
    setError(undefined);
  }
  function moveHistory(direction: 'undo' | 'redo') {
    if (
      !historyEnabled ||
      savingRef.current ||
      document.querySelector('.MuiDataGrid-cell--editing')
    )
      return;
    const next = movePolicyGridHistory(ref.current, direction);
    if (next === ref.current) return;
    ref.current = next;
    setState(next);
    setSaveNotice(undefined);
    setError(undefined);
  }
  return {
    canUndo: historyEnabled && !saving && current.past.length > 0,
    canRedo: historyEnabled && !saving && current.future.length > 0,
    undo: () => moveHistory('undo'),
    redo: () => moveHistory('redo'),
    base: current.base,
    value: current.value,
    dirty,
    changeCount: countPolicyGridChanges(current.base, current.value),
    saving,
    error,
    saveSuccessId:
      saveNotice?.scope === scope &&
      samePolicyGridValue(saveNotice.value, current.value)
        ? saveNotice.id
        : undefined,
    setError,
    stage,
    save: persist,
    cancel,
  };
}
