const FEATUREBASE_CHAT_WIDGET_SAFE_HEIGHT = 96;
const MOBILE_BOTTOM_NAVIGATION_HEIGHT = 56;
const MOBILE_BOTTOM_SAFE_HEIGHT =
  FEATUREBASE_CHAT_WIDGET_SAFE_HEIGHT + MOBILE_BOTTOM_NAVIGATION_HEIGHT;

function wideTablePageSx(hasFeaturebaseChat: boolean) {
  const bottomOffset = hasFeaturebaseChat
    ? {
        xs: `${MOBILE_BOTTOM_SAFE_HEIGHT}px`,
        sm: `${MOBILE_BOTTOM_SAFE_HEIGHT}px`,
        md: `${FEATUREBASE_CHAT_WIDGET_SAFE_HEIGHT}px`,
      }
    : {
        xs: `${MOBILE_BOTTOM_NAVIGATION_HEIGHT}px`,
        sm: `${MOBILE_BOTTOM_NAVIGATION_HEIGHT}px`,
        md: '0px',
      };

  const sx = {
    display: 'flex',
    flexDirection: 'column',
    flexWrap: 'nowrap',
    height: {
      xs: `calc(100dvh - 56px - ${bottomOffset.xs})`,
      sm: `calc(100dvh - 64px - ${bottomOffset.sm})`,
      md: `calc(100dvh - 48px - ${bottomOffset.md})`,
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
    marginBottom: `-${FEATUREBASE_CHAT_WIDGET_SAFE_HEIGHT}px`,
  } as const;
}

export { wideTablePageSx };
