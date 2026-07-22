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
import { useActiveFeatureFlags, usePostHog } from 'posthog-js/react';

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
  const [features, setFeatures] = useState<EarlyAccessFeature[]>([]);
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

    return activeFeatureFlags.includes(feature.flagKey);
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
                    label="Enabled"
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
