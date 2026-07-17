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
import {
  useActiveFeatureFlags,
  useFeatureFlagEnabled,
  usePostHog,
} from 'posthog-js/react';
import {
  FAMILY_SCREEN_V2_EARLY_ACCESS_FEATURE_FLAG,
  FAMILY_SCREEN_V2_FEATURE_FLAG,
} from '../featureFlags';
import { getEarlyAccessEnrollment } from '../Utilities/Instrumentation/earlyAccessEnrollment';

type EarlyAccessFeaturesDialogProps = {
  open: boolean;
  onClose: () => void;
};

function featureEnrollmentKey(feature: EarlyAccessFeature) {
  return feature.flagKey ?? feature.name;
}

export function EarlyAccessFeaturesDialog({
  open,
  onClose,
}: EarlyAccessFeaturesDialogProps) {
  const posthog = usePostHog();
  const activeFeatureFlags = useActiveFeatureFlags();
  const familyScreenV2RolloutEnabled = useFeatureFlagEnabled(
    FAMILY_SCREEN_V2_FEATURE_FLAG
  );
  const [features, setFeatures] = useState<EarlyAccessFeature[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingFlagKey, setUpdatingFlagKey] = useState<string | null>(null);
  const [familyScreenV2Enrollment, setFamilyScreenV2Enrollment] = useState<
    boolean | undefined
  >(() =>
    getEarlyAccessEnrollment(posthog, FAMILY_SCREEN_V2_EARLY_ACCESS_FEATURE_FLAG)
  );

  useEffect(() => {
    function updateFamilyScreenV2Enrollment() {
      setFamilyScreenV2Enrollment(
        getEarlyAccessEnrollment(
          posthog,
          FAMILY_SCREEN_V2_EARLY_ACCESS_FEATURE_FLAG
        )
      );
    }

    updateFamilyScreenV2Enrollment();

    return posthog.onFeatureFlags(updateFamilyScreenV2Enrollment);
  }, [posthog]);

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
      if (feature.flagKey === FAMILY_SCREEN_V2_EARLY_ACCESS_FEATURE_FLAG) {
        setFamilyScreenV2Enrollment(checked);
      }
    } catch (updateError) {
      setError(`Unable to update beta feature enrollment. ${updateError}`);
    } finally {
      setUpdatingFlagKey(null);
    }
  }

  function featureIsEnabled(feature: EarlyAccessFeature) {
    if (!feature.flagKey) {
      return false;
    }

    if (feature.flagKey !== FAMILY_SCREEN_V2_EARLY_ACCESS_FEATURE_FLAG) {
      return activeFeatureFlags.includes(feature.flagKey);
    }

    return (
      familyScreenV2Enrollment ??
      (familyScreenV2RolloutEnabled === true ||
        activeFeatureFlags.includes(feature.flagKey))
    );
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
                  sx={{
                    alignItems: 'flex-start',
                    gap: 2,
                    justifyContent: 'space-between',
                  }}
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
                        checked={featureIsEnabled(feature)}
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
