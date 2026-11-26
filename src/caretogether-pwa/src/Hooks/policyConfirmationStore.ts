export type PolicyConfirmationKind = 'discard' | 'saving';

export function createPolicyConfirmation() {
  let current: PolicyConfirmationKind | null = null;
  let finish: ((result: boolean) => void) | undefined;
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((listener) => listener());
  return {
    getSnapshot: () => current,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    request(kind: PolicyConfirmationKind) {
      if (current !== null) return Promise.resolve(false);
      current = kind;
      const result = new Promise<boolean>((resolve) => {
        finish = resolve;
      });
      notify();
      return result;
    },
    resolve(leave: boolean) {
      const resolve = finish;
      const allowed = leave && current === 'discard';
      finish = undefined;
      current = null;
      notify();
      resolve?.(allowed);
    },
  };
}

const confirmations = new WeakMap<
  object,
  ReturnType<typeof createPolicyConfirmation>
>();
export function policyConfirmationFor(owner: object) {
  let confirmation = confirmations.get(owner);
  if (!confirmation) {
    confirmation = createPolicyConfirmation();
    confirmations.set(owner, confirmation);
  }
  return confirmation;
}
