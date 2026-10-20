import { useEffect, useRef, useState } from 'react';
import { api } from '../../Api/Api';
import {
  EffectiveLocationPolicy,
  PolicyValidationResult,
} from '../../GeneratedClient';

type ValidationState =
  | { status: 'loading' }
  | { status: 'success'; result: PolicyValidationResult }
  | { status: 'failure'; retry: () => void };

export function usePolicyValidation(
  organizationId: string,
  locationId: string,
  policy: EffectiveLocationPolicy,
  enabled: boolean
) {
  // Bumped by retry so the same policy can be validated again after a failure.
  const [attempt, setAttempt] = useState(0);
  const requestRef = useRef<{
    organizationId: string;
    locationId: string;
    policy: EffectiveLocationPolicy;
    attempt: number;
    promise: Promise<PolicyValidationResult>;
  } | null>(null);
  const [state, setState] = useState<{
    request: NonNullable<typeof requestRef.current>;
    validation: ValidationState;
  } | null>(null);

  useEffect(() => {
    if (!enabled || !organizationId || !locationId || !policy) return;

    // Reuse the request when StrictMode replays this effect for the same policy.
    let request = requestRef.current;
    if (
      !request ||
      request.organizationId !== organizationId ||
      request.locationId !== locationId ||
      request.policy !== policy ||
      request.attempt !== attempt
    ) {
      request = {
        organizationId,
        locationId,
        policy,
        attempt,
        promise: api.configuration.validateEffectiveLocationPolicy(
          organizationId,
          locationId,
          policy
        ),
      };
      requestRef.current = request;
    }

    const currentRequest = request;
    let active = true;
    setState({ request: currentRequest, validation: { status: 'loading' } });
    currentRequest.promise.then(
      (result) => {
        if (active)
          setState({
            request: currentRequest,
            validation: { status: 'success', result },
          });
      },
      () => {
        if (active)
          setState({
            request: currentRequest,
            validation: {
              status: 'failure',
              retry: () => setAttempt((current) => current + 1),
            },
          });
      }
    );
    return () => {
      active = false;
    };
  }, [enabled, organizationId, locationId, policy, attempt]);

  if (!enabled || !organizationId || !locationId || !policy) return null;
  if (
    state?.request.organizationId !== organizationId ||
    state.request.locationId !== locationId ||
    state.request.policy !== policy ||
    state.request.attempt !== attempt
  )
    return { status: 'loading' } as const;
  return state.validation;
}
