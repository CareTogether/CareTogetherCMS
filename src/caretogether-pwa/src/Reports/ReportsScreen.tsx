import useScreenTitle from '../Shell/ShellScreenTitle';
import { models, Report } from 'powerbi-client';
import { PowerBIEmbed } from 'powerbi-client-react';
import { useDataLoaded } from '../Model/Data';
import styles from './styles.module.css';
import { Typography } from '@mui/material';
import { useGlobalPermissions } from '../Model/SessionModel';
import { Permission } from '../GeneratedClient';
import { useNavigate } from 'react-router-dom';
import { ProgressBackdrop } from '../Shell/ProgressBackdrop';
import { useUpdateSideNavigation } from './useUpdateSideNavigation';
import { useEmbedConfig } from './useEmbedConfig';

export function ReportsScreen() {
  useScreenTitle('Reports');

  const { embedConfig, loading, error } = useEmbedConfig();

  const dataLoaded = useDataLoaded();

  const navigate = useNavigate();

  const permissions = useGlobalPermissions();

  const updateSideNavigation = useUpdateSideNavigation();

  if (!dataLoaded || loading) {
    return <ProgressBackdrop>Loading reports...</ProgressBackdrop>;
  }

  if (!permissions(Permission.AccessReportsScreen)) {
    return navigate('/');
  }

  if (error) {
    return (
      <Typography align="center" mt={10}>
        Error loading report. Please try again later.
      </Typography>
    );
  }

  return (
    embedConfig && (
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
        cssClassName={styles.report}
      />
    )
  );
}
