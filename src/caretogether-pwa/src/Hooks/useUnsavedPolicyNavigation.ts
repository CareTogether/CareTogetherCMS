import { useContext, useLayoutEffect, useRef } from 'react';
import { UNSAFE_NavigationContext } from 'react-router-dom';
import { policyConfirmationFor } from './policyConfirmationStore';

type State = { dirty: boolean; saving: boolean };
type Guard = {
  states: Set<() => State>;
  refresh: () => void;
  release: () => void;
};
const guards = new WeakMap<object, Guard>();
let activePop: ((event: PopStateEvent) => void) | undefined;
const interceptPop = (event: PopStateEvent) => activePop?.(event);
if (typeof window !== 'undefined')
  window.addEventListener('popstate', interceptPop, true);
if (import.meta.hot)
  import.meta.hot.dispose(() =>
    window.removeEventListener('popstate', interceptPop, true)
  );

function currentState(navigator: object): State {
  const states = [...(guards.get(navigator)?.states ?? [])].map((read) =>
    read()
  );
  return {
    dirty: states.some((state) => state.dirty),
    saving: states.some((state) => state.saving),
  };
}

async function canLeave(navigator: object, scoped?: () => State) {
  const global = currentState(navigator);
  const state = scoped?.() ?? global;
  if (!state.dirty && !state.saving && !global.saving) return true;
  const confirmation = policyConfirmationFor(navigator);
  const result = await confirmation.request(
    state.saving || global.saving ? 'saving' : 'discard'
  );
  return result && !currentState(navigator).saving && !scoped?.().saving;
}

export function usePolicyTransitionGuard(state?: State) {
  const { navigator } = useContext(UNSAFE_NavigationContext);
  const ref = useRef(state);
  ref.current = state;
  return () =>
    canLeave(navigator, ref.current ? () => ref.current! : undefined);
}

export function useUnsavedPolicyNavigation(dirty: boolean, saving = false) {
  const { navigator } = useContext(UNSAFE_NavigationContext);
  const ref = useRef({ dirty, saving });
  ref.current = { dirty, saving };
  const enabled = dirty || saving;
  useLayoutEffect(() => {
    if (!enabled) return;
    const read = () => ref.current;
    let guard = guards.get(navigator);
    if (!guard) {
      const confirmation = policyConfirmationFor(navigator);
      const push = navigator.push;
      const replace = navigator.replace;
      let index: number = window.history.state?.idx ?? 0;
      let restoring = false;
      let resume: (() => void) | undefined;
      let allowedPop = false;
      const leaving = (to: Parameters<typeof push>[0]) => {
        const path =
          typeof to === 'string'
            ? new URL(to, window.location.href).pathname
            : to.pathname;
        return path !== undefined && path !== window.location.pathname;
      };
      navigator.push = (...args) => {
        if (!leaving(args[0])) {
          push.apply(navigator, args);
          index = window.history.state?.idx ?? index;
          return;
        }
        const origin = window.location.href;
        void canLeave(navigator).then((leave) => {
          if (!leave || window.location.href !== origin) return;
          push.apply(navigator, args);
          index = window.history.state?.idx ?? index;
        });
      };
      navigator.replace = (...args) => {
        if (!leaving(args[0])) {
          replace.apply(navigator, args);
          index = window.history.state?.idx ?? index;
          return;
        }
        const origin = window.location.href;
        void canLeave(navigator).then((leave) => {
          if (!leave || window.location.href !== origin) return;
          replace.apply(navigator, args);
          index = window.history.state?.idx ?? index;
        });
      };
      const pop = (event: PopStateEvent) => {
        const next: number | undefined = event.state?.idx;
        if (next === undefined) return;
        if (allowedPop) {
          allowedPop = false;
          index = next;
          return;
        }
        if (restoring && next === index) {
          restoring = false;
          event.stopImmediatePropagation();
          const ready = resume;
          resume = undefined;
          ready?.();
          return;
        }
        if (next === index) return;
        event.stopImmediatePropagation();
        const from = index;
        if (!restoring && confirmation.getSnapshot() === null) {
          resume = () => {
            const origin = window.location.href;
            void canLeave(navigator).then((leave) => {
              if (!leave || window.location.href !== origin) return;
              allowedPop = true;
              navigator.go(next - from);
            });
          };
        }
        restoring = true;
        navigator.go(from - next);
      };
      const unload = (event: BeforeUnloadEvent) => {
        if (!currentState(navigator).dirty) return;
        event.preventDefault();
        event.returnValue = '';
      };
      let protectingUnload = false;
      activePop = pop;
      guard = {
        states: new Set(),
        refresh() {
          const state = currentState(navigator);
          if (state.dirty !== protectingUnload) {
            protectingUnload = state.dirty;
            if (protectingUnload)
              window.addEventListener('beforeunload', unload);
            else window.removeEventListener('beforeunload', unload);
          }
          if (
            (!state.dirty && !state.saving) ||
            (confirmation.getSnapshot() === 'saving' && !state.saving)
          )
            confirmation.resolve(false);
        },
        release() {
          navigator.push = push;
          navigator.replace = replace;
          if (activePop === pop) activePop = undefined;
          window.removeEventListener('beforeunload', unload);
          confirmation.resolve(false);
        },
      };
      guards.set(navigator, guard);
    }
    guard.states.add(read);
    guard.refresh();
    return () => {
      guard.states.delete(read);
      if (guard.states.size) guard.refresh();
      else {
        guard.release();
        guards.delete(navigator);
      }
    };
  }, [enabled, navigator]);
  useLayoutEffect(() => {
    guards.get(navigator)?.refresh();
  });
}
