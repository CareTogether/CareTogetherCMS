import { FAMILY_SCREEN_V2_EARLY_ACCESS_FEATURE_FLAG } from '../featureFlags';
import { v2Typography } from '../Families/v2Typography';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { useScreenTitle } from '../Shell/ShellScreenTitle';
import { models, Report } from 'powerbi-client';
import { PowerBIEmbed } from 'powerbi-client-react';
import styles from './styles.module.css';
import { Box, Typography } from '@mui/material';
import { useGlobalPermissions } from '../Model/SessionModel';
import { Permission } from '../GeneratedClient';
import { useNavigate } from 'react-router-dom';
import { ProgressBackdrop } from '../Shell/ProgressBackdrop';
import { useUpdateSideNavigation } from './useUpdateSideNavigation';
import { useEmbedConfig } from './useEmbedConfig';
import { wideTablePageSx } from '../Utilities/wideTablePageSx';

export function ReportsScreen() {
  const isV2 =
    useFeatureFlagEnabled(FAMILY_SCREEN_V2_EARLY_ACCESS_FEATURE_FLAG) === true;
  useScreenTitle('Reports');

  const { embedConfig, loading, error } = useEmbedConfig();

  const navigate = useNavigate();

  const permissions = useGlobalPermissions();

  const updateSideNavigation = useUpdateSideNavigation();

  if (loading) {
    return <ProgressBackdrop>Loading reports...</ProgressBackdrop>;
  }

  if (!permissions(Permission.AccessReportsScreen)) {
    navigate('/');
    return;
  }

  const reportError = error ? (
    <Typography align="center" sx={{ mt: 10 }}>
      Error loading report. Please try again later.
    </Typography>
  ) : null;

  const reportContent = !error && embedConfig && (
    <PowerBIEmbed
      embedConfig={{
        type: 'report',
        id: embedConfig.reportId,
        embedUrl: embedConfig.embedUrl,
        accessToken: embedConfig.accessToken,
        tokenType: models.TokenType.Embed,
        settings: {
          panes: {
            filters: {
              expanded: false,
            },
          },
          background: models.BackgroundType.Transparent,
          navContentPaneEnabled: false,
          bars: {
            statusBar: {
              visible: true,
            },
          },
          layoutType: models.LayoutType.Custom,
          customLayout: {
            displayOption: models.DisplayOption.FitToPage,
          },
        },
      }}
      eventHandlers={
        new Map([
          [
            'loaded',
            (_event, embed) => {
              if (embed && embed instanceof Report) {
                return updateSideNavigation(embed);
              }
            },
          ],
        ])
      }
      cssClassName={isV2 ? styles.reportV2 : styles.report}
    />
  );

  if (!isV2) return reportError ?? reportContent;

  return (
    <Box sx={wideTablePageSx(permissions(Permission.AccessSupportScreen))}>
      <Typography
        className="ph-unmask"
        {...v2Typography.pageTitle}
        component="h1"
        sx={{ my: 2, flexShrink: 0 }}
      >
        Reports
      </Typography>
      {reportError ?? reportContent}
    </Box>
  );
}
