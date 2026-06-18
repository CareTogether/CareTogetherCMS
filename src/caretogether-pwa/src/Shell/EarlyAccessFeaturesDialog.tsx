import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import type { EarlyAccessFeature } from 'posthog-js';
import { usePostHog } from 'posthog-js/react';
import {
  FAMILY_SCREEN_V2_EARLY_ACCESS_FEATURE_NAME,
  FAMILY_SCREEN_V2_ENROLLMENT_CHANGED_EVENT,
  POSTHOG_STORED_PERSON_PROPERTIES_KEY,
} from '../featureFlags';

type EarlyAccessFeaturesDialogProps = {
  open: boolean;
  onClose: () => void;
};

type EnrollmentByFlagKey = Record<string, boolean>;

function earlyAccessEnrollmentProperty(flagKey: string) {
  return `$feature_enrollment/${flagKey}`;
}

function getEarlyAccessEnrollment(
  posthog: ReturnType<typeof usePostHog>,
  flagKey: string
) {
  const personProperties = posthog.get_property(
    POSTHOG_STORED_PERSON_PROPERTIES_KEY
  ) as Record<string, unknown> | undefined;

  return personProperties?.[earlyAccessEnrollmentProperty(flagKey)] === true;
}

function featureEnrollmentKey(feature: EarlyAccessFeature) {
  return feature.flagKey ?? feature.name;
}

export function EarlyAccessFeaturesDialog({
  open,
  onClose,
}: EarlyAccessFeaturesDialogProps) {
  const posthog = usePostHog();
  const [features, setFeatures] = useState<EarlyAccessFeature[]>([]);
  const [enrollmentByFlagKey, setEnrollmentByFlagKey] =
    useState<EnrollmentByFlagKey>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingFlagKey, setUpdatingFlagKey] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    let isCurrentLoad = true;
    setLoading(true);
    setError(null);
    setFeatures([]);

    try {
      posthog.getEarlyAccessFeatures((earlyAccessFeatures) => {
        if (!isCurrentLoad) {
          return;
        }

        setFeatures(earlyAccessFeatures);
        setEnrollmentByFlagKey(
          Object.fromEntries(
            earlyAccessFeatures.flatMap((feature) => {
              if (!feature.flagKey) {
                return [];
              }

              return [
                [
                  feature.flagKey,
                  getEarlyAccessEnrollment(posthog, feature.flagKey),
                ],
              ];
            })
          )
        );
        setLoading(false);
      }, true);
    } catch (loadError) {
      setError(`Unable to load beta features. ${loadError}`);
      setLoading(false);
    }

    return () => {
      isCurrentLoad = false;
    };
  }, [open, posthog]);

  function updateEnrollment(feature: EarlyAccessFeature, checked: boolean) {
    if (!feature.flagKey) {
      return;
    }

    setError(null);
    setUpdatingFlagKey(feature.flagKey);

    try {
      posthog.updateEarlyAccessFeatureEnrollment(
        feature.flagKey,
        checked,
        feature.stage
      );
      if (feature.name === FAMILY_SCREEN_V2_EARLY_ACCESS_FEATURE_NAME) {
        window.dispatchEvent(
          new CustomEvent(FAMILY_SCREEN_V2_ENROLLMENT_CHANGED_EVENT, {
            detail: {
              flagKey: feature.flagKey,
              isEnrolled: checked,
            },
          })
        );
      }
      setEnrollmentByFlagKey((current) => ({
        ...current,
        [feature.flagKey!]: checked,
      }));
    } catch (updateError) {
      setError(`Unable to update beta feature enrollment. ${updateError}`);
    } finally {
      setUpdatingFlagKey(null);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Beta Features</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Typography>Loading beta features...</Typography>
        ) : features.length === 0 ? (
          <Typography>No beta features available.</Typography>
        ) : (
          <Stack divider={<Divider flexItem />} spacing={2}>
            {features.map((feature) => (
              <Box key={featureEnrollmentKey(feature)}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="flex-start"
                  gap={2}
                >
                  <Box>
                    <Typography variant="subtitle1">{feature.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description || 'No description available.'}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ textTransform: 'capitalize' }}
                    >
                      {feature.stage}
                    </Typography>
                  </Box>
                  <FormControlLabel
                    label="Enrolled"
                    labelPlacement="start"
                    control={
                      <Switch
                        checked={
                          feature.flagKey
                            ? enrollmentByFlagKey[feature.flagKey] === true
                            : false
                        }
                        disabled={
                          !feature.flagKey ||
                          updatingFlagKey === feature.flagKey
                        }
                        onChange={(event) =>
                          updateEnrollment(feature, event.target.checked)
                        }
                      />
                    }
                  />
                </Stack>
              </Box>
            ))}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
