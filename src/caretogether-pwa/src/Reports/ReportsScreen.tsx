import useScreenTitle from '../Shell/ShellScreenTitle';
import { models } from 'powerbi-client';
import { PowerBIEmbed } from 'powerbi-client-react';
import { useEffect, useState } from 'react';
import { api } from '../Api/Api';
import { useRecoilValue } from 'recoil';
import { selectedLocationContextState, useDataLoaded } from '../Model/Data';
import styles from './styles.module.css';
import { Typography } from '@mui/material';
import { useGlobalPermissions } from '../Model/SessionModel';
import { Permission } from '../GeneratedClient';
import { useNavigate } from 'react-router-dom';
import { ProgressBackdrop } from '../Shell/ProgressBackdrop';

export function ReportsScreen() {
  useScreenTitle('Reports');

  const [embedConfig, setEmbedConfig] = useState<{
    reportId: string;
    embedUrl: string;
    accessToken: string;
  } | null>(null);

  const [loading, setLoading] = useState<boolean | null>(true);
  const [error, setError] = useState<boolean | null>(null);

  const { organizationId, locationId } = useRecoilValue(
    selectedLocationContextState
  );

  useEffect(() => {
    api.records
      .getEmbedInfo(organizationId, locationId)
      .then((embedParams) => {
        const [report] = embedParams.embedReport || [];

        const reportId = report?.reportId;
        const embedUrl = report?.embedUrl;
        const accessToken = embedParams.embedToken?.token;

        if (!reportId || !embedUrl || !accessToken) {
          console.error('Missing reportId, embedUrl, or accessToken');
          return;
        }

        setEmbedConfig({
          reportId,
          embedUrl,
          accessToken,
        });
      })
      .catch((error) => {
        console.error('Error fetching embed info:', error);
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [locationId, organizationId]);

  const dataLoaded = useDataLoaded();

  const navigate = useNavigate();

  const permissions = useGlobalPermissions();

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
        cssClassName={styles.report}
      />
    )
  );
}
