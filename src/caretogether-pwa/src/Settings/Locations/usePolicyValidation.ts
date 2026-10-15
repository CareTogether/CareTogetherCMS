import { useEffect, useRef, useState } from 'react';
import { api } from '../../Api/Api';
import {
  EffectiveLocationPolicy,
  PolicyValidationResult,
} from '../../GeneratedClient';

type ValidationState =
  | { status: 'loading' }
  | { status: 'success'; result: PolicyValidationResult }
  | { status: 'failure' };

export function usePolicyValidation(
  organizationId: string,
  locationId: string,
  policy: EffectiveLocationPolicy,
  enabled: boolean
) {
  const requestRef = useRef<{
    organizationId: string;
    locationId: string;
    policy: EffectiveLocationPolicy;
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
      request.policy !== policy
    ) {
      request = {
        organizationId,
        locationId,
        policy,
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
            validation: { status: 'failure' },
          });
      }
    );
    return () => {
      active = false;
    };
  }, [enabled, organizationId, locationId, policy]);

  if (!enabled || !organizationId || !locationId || !policy) return null;
  if (
    state?.request.organizationId !== organizationId ||
    state.request.locationId !== locationId ||
    state.request.policy !== policy
  )
    return { status: 'loading' } as const;
  return state.validation;
}
