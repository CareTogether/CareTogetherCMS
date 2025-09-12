import { Route, Routes } from 'react-router-dom';
import { useEffect } from 'react';
import { OpenTicketForm } from './OpenTicketForm';
import { ScheduleCall } from './ScheduleCall';
import { Box, Grid } from '@mui/material';

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
  useEffect(() => {
    const win = window;

    // Initialize Featurebase if it doesn't exist
    if (typeof win.Featurebase !== 'function') {
      win.Featurebase = function (...args: unknown[]) {
        (win.Featurebase.q = win.Featurebase.q || []).push(args);
      };
    }

    // Boot Featurebase messenger with configuration
    win.Featurebase('boot', {
      appId: '6890e41acb9e844a4374a7a8', // required
      // email: "user@example.com",         // optional
      // userId: "12345",                   // optional (will be stringified)
      // createdAt: "2025-05-06T12:00:00Z", // optional
      // theme: "light",                    // "light" or "dark"
      // language: "en",                    // short code (e.g. "en", "de", etc.)
      // userHash: generatedToken         // Check the docs for additional details below
      // + feel free to add any more custom values about the user here
    });
  }, []);

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
  return (
    <>
      <FeaturebaseMessenger />
      <Routes>
        <Route
          path="*"
          element={
            <Box px={2} py={4}>
              <Grid container spacing={4}>
                <Grid item xs={12} lg={4}>
                  <ScheduleCall />
                </Grid>
                <Grid item xs={12} lg={8}>
                  <OpenTicketForm />
                </Grid>
              </Grid>
            </Box>
          }
        />
      </Routes>
    </>
  );
}
