import { useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Container,
  Grid,
  Typography,
} from '@mui/material';
import {
  Chat as ChatIcon,
  VideoCall as VideoCallIcon,
} from '@mui/icons-material';
import { useLoadable } from './Hooks/useLoadable';
import { accountInfoState } from './Authentication/Auth';
import { selectedLocationContextState } from './Model/Data';
import {
  organizationConfigurationQuery,
  locationConfigurationQuery,
} from './Model/ConfigurationModel';
import { api } from './Api/Api';
import useScreenTitle from './Shell/ShellScreenTitle';

// Extend the Window interface to include Featurebase
declare global {
  interface Window {
    Featurebase: {
      (...args: unknown[]): void;
      q?: unknown[];
    };
  }
}

const FeaturebaseMessenger = () => {
  // Get user data from Recoil state
  const accountInfo = useLoadable(accountInfoState);
  const organizationConfiguration = useLoadable(organizationConfigurationQuery);
  const locationConfiguration = useLoadable(locationConfigurationQuery);
  const locationContext = useLoadable(selectedLocationContextState);

  useEffect(() => {
    const win = window;

    // Initialize Featurebase if it doesn't exist
    if (typeof win.Featurebase !== 'function') {
      win.Featurebase = function (...args: unknown[]) {
        (win.Featurebase.q = win.Featurebase.q || []).push(args);
      };
    }

    // Only boot Featurebase if we have user data
    if (accountInfo?.userId) {
      // Fetch the userHash from the backend for identity verification
      api.users.getFeaturebaseIdentityHash().then((userHash) => {
        // Boot Featurebase messenger with configuration including user attributes
        win.Featurebase('boot', {
          appId: '6890e41acb9e844a4374a7a8', // required
          email: accountInfo.email,
          userId: accountInfo.userId,
          name: accountInfo.name,
          userHash: userHash, // Add the generated userHash for identity verification
          theme: 'light',
          language: 'en',
          companies: [
            {
              id: locationContext?.organizationId,
              name: organizationConfiguration?.organizationName,
              customFields: {
                locationId: locationContext?.locationId,
                locationName: locationConfiguration?.name,
              },
            },
          ],
        });
      });
    }
  }, [
    accountInfo,
    organizationConfiguration,
    locationConfiguration,
    locationContext,
  ]);

  useEffect(() => {
    // Load the Featurebase SDK script (React equivalent of Next.js Script component)
    const existingScript = document.getElementById('featurebase-sdk');
    if (existingScript) {
      return; // Script already loaded
    }

    const script = document.createElement('script');
    script.src = 'https://do.featurebase.app/js/sdk.js';
    script.id = 'featurebase-sdk';
    script.async = true;

    document.head.appendChild(script);

    // Cleanup function
    return () => {
      const scriptElement = document.getElementById('featurebase-sdk');
      if (scriptElement) {
        scriptElement.remove();
      }
    };
  }, []);

  return null; // This component doesn't render anything visible
};

export function Support() {
  useScreenTitle('Support');

  return (
    <>
      <FeaturebaseMessenger />
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Box textAlign="center" mb={6}>
          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            sx={{ fontWeight: 600 }}
          >
            Get Support
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ maxWidth: '600px', mx: 'auto' }}
          >
            Need help with CareTogether? We're here to support you every step of
            the way.
          </Typography>
        </Box>

        <Grid container spacing={4} sx={{ mb: 6 }}>
          <Grid item xs={12} md={6}>
            <Card
              variant="outlined"
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center', p: 4 }}>
                <ChatIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h5" component="h2" gutterBottom>
                  Chat Support
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  Get asynchronous help through our chat support. Perfect for
                  quick questions, troubleshooting, and general support.
                </Typography>
              </CardContent>
              <CardActions sx={{ p: 3, pt: 0 }}>
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  onClick={() => {
                    if (window.Featurebase) {
                      window.Featurebase('showNewMessage');
                    }
                  }}
                  startIcon={<ChatIcon />}
                >
                  Send a Message
                </Button>
              </CardActions>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card
              variant="outlined"
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center', p: 4 }}>
                <VideoCallIcon
                  sx={{ fontSize: 48, color: 'primary.main', mb: 2 }}
                />
                <Typography variant="h5" component="h2" gutterBottom>
                  Schedule a Call
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  Book a one-on-one call with our support team for in-depth
                  assistance and personalized guidance.
                </Typography>
              </CardContent>
              <CardActions sx={{ p: 3, pt: 0 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  size="large"
                  href="https://support.caretogether.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  startIcon={<VideoCallIcon />}
                >
                  Schedule a Call
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </>
  );
}
