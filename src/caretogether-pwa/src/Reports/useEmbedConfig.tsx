import { useState, useEffect } from 'react';
import { useRecoilValue } from 'recoil';
import { api } from '../Api/Api';
import { selectedLocationContextState } from '../Model/Data';

export function useEmbedConfig() {
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

  return { embedConfig, loading, error };
}
