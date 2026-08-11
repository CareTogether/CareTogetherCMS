import {
  DESKTOP_BOTTOM_SAFE_AREA,
  MOBILE_BOTTOM_NAV_HEIGHT,
  MOBILE_BOTTOM_SAFE_AREA,
  SHELL_APP_BAR_HEIGHT,
} from '../Shell/shellLayoutConstants';

function wideTablePageSx(hasFeaturebaseChat: boolean) {
  const bottomOffset = hasFeaturebaseChat
    ? {
        xs: `${MOBILE_BOTTOM_SAFE_AREA}px`,
        sm: `${MOBILE_BOTTOM_SAFE_AREA}px`,
        md: `${DESKTOP_BOTTOM_SAFE_AREA}px`,
      }
    : {
        xs: `${MOBILE_BOTTOM_NAV_HEIGHT}px`,
        sm: `${MOBILE_BOTTOM_NAV_HEIGHT}px`,
        md: '0px',
      };

  const sx = {
    display: 'flex',
    flexDirection: 'column',
    flexWrap: 'nowrap',
    height: {
      xs: `calc(100dvh - ${SHELL_APP_BAR_HEIGHT.xs} - ${bottomOffset.xs})`,
      sm: `calc(100dvh - ${SHELL_APP_BAR_HEIGHT.sm} - ${bottomOffset.sm})`,
      md: `calc(100dvh - ${SHELL_APP_BAR_HEIGHT.md} - ${bottomOffset.md})`,
    },
    // ShellRootLayout always reserves Featurebase space; reclaim it when chat is hidden.
    minHeight: 0,
    overflow: 'hidden',
  } as const;

  if (hasFeaturebaseChat) {
    return sx;
  }

  return {
    ...sx,
    marginBottom: `-${DESKTOP_BOTTOM_SAFE_AREA}px`,
  } as const;
}

export { wideTablePageSx };
