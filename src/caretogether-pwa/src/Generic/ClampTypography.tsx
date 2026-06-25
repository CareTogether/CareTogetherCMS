import * as React from 'react';
import {
  Box,
  Collapse,
  Typography,
  TypographyProps,
} from '@mui/material';

export type ClampTypographyProps = TypographyProps & {
  lines?: number;
  fadeHeight?: number;
  defaultExpanded?: boolean;
};

export function ClampTypography({
  children,
  lines = 3,
  fadeHeight = 28,
  defaultExpanded = false,
  sx,
  ...props
}: ClampTypographyProps) {
  const [expanded, setExpanded] = React.useState(defaultExpanded);
  const [collapsedSize, setCollapsedSize] = React.useState(0);
  const [canExpand, setCanExpand] = React.useState(false);

  const ref = React.useRef<HTMLElement | null>(null);

  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      const style = getComputedStyle(el);

      const fontSize = parseFloat(style.fontSize || '16');
      const rawLineHeight = parseFloat(style.lineHeight || '');
      const lineHeight = Number.isFinite(rawLineHeight)
        ? rawLineHeight
        : fontSize * 1.5;

      const collapsed = Math.round(lineHeight * lines);

      setCollapsedSize(collapsed);

      // Detect overflow
      setCanExpand(el.scrollHeight > collapsed + 1);
    };

    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [lines, children]);

  return (
    <Box
      onClick={canExpand ? () => setExpanded((x) => !x) : undefined}
      sx={{
        cursor: canExpand ? 'pointer' : 'default',
        position: 'relative',

        ...(canExpand &&
          !expanded && {
            '&::after': {
              content: '""',
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: fadeHeight,
              pointerEvents: 'none',
              background: (theme) =>
                `linear-gradient(to bottom, rgba(0,0,0,0), ${theme.palette.background.paper})`,
            },
          }),
      }}
    >
    <Collapse
      in={canExpand ? expanded : true}
      collapsedSize={canExpand ? collapsedSize : 'auto'}
      timeout="auto"
      >
        <Typography
          {...props}
          ref={ref}
          sx={[
            {
              whiteSpace: 'pre-line',
              overflowWrap: 'anywhere',
            },
            ...(Array.isArray(sx) ? sx : sx ? [sx] : [])
          ]}
        >
          {children}
        </Typography>
      </Collapse>
    </Box>
  );
}