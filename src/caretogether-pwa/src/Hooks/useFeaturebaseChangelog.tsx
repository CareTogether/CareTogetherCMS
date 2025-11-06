import { useEffect, useState } from 'react';

export const useFeaturebaseChangelog = () => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let initialized = false;

    const loadFeaturebaseScript = () => {
      if (!document.getElementById('featurebase-sdk')) {
        const script = document.createElement('script');
        script.src = 'https://do.featurebase.app/js/sdk.js';
        script.id = 'featurebase-sdk';
        script.async = true;
        document.head.appendChild(script);
      }
    };

    const initChangelog = () => {
      if (initialized) return;
      if (!window.Featurebase) {
        setTimeout(initChangelog, 500);
        return;
      }

      initialized = true;

      window.Featurebase(
        'init_changelog_widget',
        {
          organization: 'caretogether',
          theme: 'light',
          locale: 'en',
          dropdown: {
            enabled: true,
            placement: 'left',
          },
          popup: {
            enabled: false,
            autoOpenForNewUpdates: false,
          },
        },
        (
          error: unknown,
          data: { action?: string; unreadCount?: number } | null
        ) => {
          if (error) return;

          if (data?.action === 'unreadChangelogsCountChanged') {
            setUnreadCount(data.unreadCount ?? 0);
          }
        }
      );
    };

    loadFeaturebaseScript();
    initChangelog();
  }, []);

  return unreadCount;
};
