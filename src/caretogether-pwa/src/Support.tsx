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
import { useScreenTitle } from './Shell/ShellScreenTitle';

// Extend the Window interface to include Featurebase
declare global {
  interface Window {
    Featurebase: {
      (...args: unknown[]): void;
      q?: unknown[];
    };
  }
}

export function Support() {
  useScreenTitle('Support');

  return (
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

              <Typography variant="body1" color="text.secondary" paragraph>
                <strong>Our typical response time is 2-3 business days.</strong>
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
  );
}
