import useScreenTitle from '../Shell/ShellScreenTitle';
import { models, Report } from 'powerbi-client';
import { PowerBIEmbed } from 'powerbi-client-react';
import { useEffect, useState } from 'react';
import { api } from '../Api/Api';
import { useRecoilValue } from 'recoil';
import { selectedLocationContextState } from '../Model/Data';
import styles from './styles.module.css';

export function ReportsScreen() {
  useScreenTitle('Reports');

  const [embedConfig, setEmbedConfig] = useState<{
    reportId: string;
    embedUrl: string;
    accessToken: string;
  } | null>(null);

  const { organizationId, locationId } = useRecoilValue(
    selectedLocationContextState
  );

  useEffect(() => {
    api.records.getEmbedInfo(organizationId, locationId).then((embedParams) => {
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
    });
  }, []);

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
              // pageNavigation: {
              //   position: models.PageNavigationPosition.Left,
              // },
            },

            background: models.BackgroundType.Transparent,
            zoomLevel: 1.5,
          },
        }}
        eventHandlers={
          new Map([
            [
              'loaded',
              function () {
                console.log('Report loaded');
              },
            ],
            [
              'rendered',
              function () {
                console.log('Report rendered');
              },
            ],
            [
              'error',
              function (event) {
                console.log(event?.detail);
              },
            ],
            ['visualClicked', () => console.log('visual clicked')],
            ['pageChanged', (event) => console.log(event)],
          ])
        }
        cssClassName={styles.report}
        // getEmbeddedComponent={(embeddedReport) => {
        //   this.report = embeddedReport as Report;
        // }}
      />
    )
  );
}
