import { Alert, Button, Stack, Typography } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useFeatureFlagEnabled, usePostHog } from 'posthog-js/react';
import { useOrganizationConfiguration } from '../Model/ConfigurationModel';
import { useRequiredSelectedLocationContext } from '../Model/Data';
import {
  useGlobalPermissions,
  useUserIsOrganizationAdministrator,
} from '../Model/SessionModel';
import {
  usePolicyForLocation,
  useRefreshPolicyForLocation,
} from '../Model/PolicyModel';
import {
  ApiException,
  EffectiveLocationPolicy,
  Permission,
} from '../GeneratedClient';
import { api } from '../Api/Api';
import { useBackdrop } from '../Hooks/useBackdrop';
import { useUnsavedPolicyNavigation } from '../Hooks/useUnsavedPolicyNavigation';
import { useScreenTitle } from '../Shell/ShellScreenTitle';
import { ProgressBackdrop } from '../Shell/ProgressBackdrop';
import { Breadcrumbs } from '../Generic/Breadcrumbs';
import { SELF_SERVICE_POLICY_FEATURE_FLAG } from '../featureFlags';
import { PolicyConfiguration } from './Locations/Tabs/PolicyConfiguration';
import AccessLevels from './Locations/Tabs/AccessLevels/AccessLevels';
import { clonePolicyWithActionDefinitionOrder } from './Locations/Tabs/PolicyConfiguration/policyUtils';
import { usePolicyValidation } from './Locations/usePolicyValidation';
import {
  settingsSections,
  settingsCategoryBreadcrumb,
  type SettingsSection,
} from './settingsSections';
import { StandalonePolicyContent } from './Locations/Tabs/PolicyConfiguration/sharedUi';

export function SettingsConfigurationScreen({
  section,
}: {
  section: SettingsSection;
}) {
  const context = useRequiredSelectedLocationContext();
  const configuration = useOrganizationConfiguration();
  const permissions = useGlobalPermissions();
  const administrator = useUserIsOrganizationAdministrator() === true;
  const enabled = useFeatureFlagEnabled(SELF_SERVICE_POLICY_FEATURE_FLAG);
  const posthog = usePostHog();
  const location = configuration?.locations.find(
    (item) => item.id === context.locationId
  );
  const definition = settingsSections.find((item) => item.id === section)!;
  useScreenTitle(definition.label);
  if (!permissions(Permission.AccessSettingsScreen) || !location)
    return (
      <Alert severity="error">
        This location is restricted or unavailable.
      </Alert>
    );
  if (section !== 'accessLevels' && !posthog.featureFlags.hasLoadedFlags)
    return (
      <ProgressBackdrop>
        <p>Loading configuration...</p>
      </ProgressBackdrop>
    );
  if (section !== 'accessLevels' && enabled !== true)
    return <Navigate to="../" replace />;
  return (
    <Stack spacing={2} sx={{ minWidth: 0, width: '100%', py: 2 }}>
      <Breadcrumbs
        items={[
          {
            label: 'Settings',
            to:
              '/org/' +
              context.organizationId +
              '/' +
              context.locationId +
              '/settings',
          },
          settingsCategoryBreadcrumb(
            context.organizationId,
            context.locationId,
            section
          ),
        ]}
        currentPageLabel={definition.label}
      />
      <StandalonePolicyContent title={definition.label}>
        {section === 'accessLevels' ? (
          <AccessLevels
            key={context.organizationId + '/' + context.locationId}
            locationConfiguration={location}
            canEdit={administrator}
            showHeading={false}
          />
        ) : (
          <LocationPolicyEditor
            key={context.organizationId + '/' + context.locationId}
            section={section}
          />
        )}
      </StandalonePolicyContent>
    </Stack>
  );
}

function LocationPolicyEditor({
  section,
}: {
  section: Exclude<SettingsSection, 'accessLevels'>;
}) {
  const configuration = useOrganizationConfiguration();
  const { organizationId, locationId: targetLocationId } =
    useRequiredSelectedLocationContext();
  const targetLocationContext = {
    organizationId,
    locationId: targetLocationId,
  };
  const policy = usePolicyForLocation(targetLocationContext);
  const [policyDraft, setPolicyDraft] = useState(policy);
  const [policySaveErrors, setPolicySaveErrors] = useState<string[]>([]);
  const policyDraftLocationIdRef = useRef(targetLocationId);
  const actionDefinitionOrderRef = useRef(
    Object.keys(policy.actionDefinitions ?? {})
  );

  useEffect(() => {
    if (policyDraftLocationIdRef.current !== targetLocationId) {
      policyDraftLocationIdRef.current = targetLocationId;
      actionDefinitionOrderRef.current = Object.keys(
        policy.actionDefinitions ?? {}
      );
    }

    const orderedPolicy = clonePolicyWithActionDefinitionOrder(
      policy,
      actionDefinitionOrderRef.current
    );
    actionDefinitionOrderRef.current = Object.keys(
      orderedPolicy.actionDefinitions ?? {}
    );
    setPolicyDraft(orderedPolicy);
  }, [policy, targetLocationId]);

  const validation = usePolicyValidation(
    organizationId,
    targetLocationId,
    policy,
    true
  );
  const withBackdrop = useBackdrop();
  const refreshPolicy = useRefreshPolicyForLocation(targetLocationContext);
  const mounted = useRef(true);
  const saving = useRef(false);
  const [savePending, setSavePending] = useState(false);
  useUnsavedPolicyNavigation(false, savePending);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  async function savePolicy(
    nextPolicy: EffectiveLocationPolicy
  ): Promise<boolean> {
    if (saving.current) {
      setPolicySaveErrors([
        'Another policy change is still being saved. Try again when it finishes.',
      ]);
      return false;
    }
    saving.current = true;
    setSavePending(true);
    let persisted = false;
    const previousOrder = actionDefinitionOrderRef.current;
    const nextOrder = Object.keys(nextPolicy.actionDefinitions ?? {});
    actionDefinitionOrderRef.current = nextOrder;
    try {
      await withBackdrop(async () => {
        try {
          setPolicySaveErrors([]);
          const saved = await api.configuration.putEffectiveLocationPolicy(
            organizationId,
            targetLocationId,
            nextPolicy
          );
          persisted = true;
          refreshPolicy();
          if (!mounted.current) return;
          setPolicyDraft(
            clonePolicyWithActionDefinitionOrder(saved, nextOrder)
          );
        } catch (error) {
          if (!mounted.current) return;
          actionDefinitionOrderRef.current = previousOrder;
          setPolicySaveErrors(getPolicySaveErrors(error));
        }
      });
      return persisted;
    } finally {
      saving.current = false;
      if (mounted.current) setSavePending(false);
    }
  }

  const locationRoles =
    configuration?.roles?.map((role) => role.roleName) ?? [];
  return (
    <Stack spacing={2} sx={{ minWidth: 0 }}>
      {validation?.status === 'loading' && (
        <Typography role="status" sx={{ mb: 2 }}>
          Checking policy configuration...
        </Typography>
      )}
      {validation?.status === 'failure' && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={validation.retry}>
              Try again
            </Button>
          }
        >
          Policy validation could not be loaded.
        </Alert>
      )}
      {validation?.status === 'success' && (
        <>
          {validation.result.errors.length > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {validation.result.errors.map((message, index) => (
                <Typography key={index} variant="body2">
                  {message}
                </Typography>
              ))}
            </Alert>
          )}
          {validation.result.warnings.length > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {validation.result.warnings.map((message, index) => (
                <Typography key={index} variant="body2">
                  {message}
                </Typography>
              ))}
            </Alert>
          )}
        </>
      )}
      {policySaveErrors.length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }} data-testid="policy-save-errors">
          <Stack spacing={0.5}>
            {policySaveErrors.map((error) => (
              <Typography key={error} variant="body2">
                {error}
              </Typography>
            ))}
          </Stack>
        </Alert>
      )}

      <PolicyConfiguration
        key={section}
        policy={policyDraft}
        locationRoles={locationRoles}
        onPolicyChange={savePolicy}
        section={section}
      />
    </Stack>
  );
}
function getPolicySaveErrors(error: unknown) {
  if (!(error instanceof ApiException)) {
    return [
      error instanceof Error
        ? error.message
        : 'Policy changes could not be saved.',
    ];
  }

  if (error.status === 403) {
    return ['You do not have permission to save policy changes.'];
  }

  const parsedErrors = parseValidationErrors(error.response);
  if (parsedErrors.length > 0) return parsedErrors;

  return [
    error.response || error.message || 'Policy changes could not be saved.',
  ];
}

function parseValidationErrors(response: string) {
  try {
    const parsed = JSON.parse(response) as { errors?: unknown };
    return Array.isArray(parsed.errors)
      ? parsed.errors.filter(
          (error): error is string => typeof error === 'string'
        )
      : [];
  } catch {
    return [];
  }
}
