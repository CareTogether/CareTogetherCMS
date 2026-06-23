import Grid, { GridProps } from '@mui/material/Grid';
import { SxProps, Theme } from '@mui/material/styles';
import React from 'react';

type LegacyGridProps = Omit<GridProps, 'size'> & {
  item?: boolean;
  xs?: number | 'auto' | boolean;
  sm?: number | 'auto' | boolean;
  md?: number | 'auto' | boolean;
  lg?: number | 'auto' | boolean;
  xl?: number | 'auto' | boolean;
  p?: number;
  mt?: number;
  mb?: number;
  mx?: number;
  my?: number;
  maxWidth?: number | string;
};

function mergeSx(
  sx: SxProps<Theme> | undefined,
  mappedSx: SxProps<Theme>
): SxProps<Theme> {
  if (!sx) return mappedSx;
  return Array.isArray(sx)
    ? ([mappedSx, ...sx] as SxProps<Theme>)
    : ([mappedSx, sx] as SxProps<Theme>);
}

const GridLegacyCompat = React.forwardRef<HTMLDivElement, LegacyGridProps>(
  function GridLegacyCompat(
    { item, xs, sm, md, lg, xl, p, mt, mb, mx, my, maxWidth, sx, ...props },
    ref
  ) {
    const size =
      item || xs || sm || md || lg || xl ? { xs, sm, md, lg, xl } : undefined;
    const mappedSx = { p, mt, mb, mx, my, maxWidth };

    return (
      <Grid
        ref={ref}
        size={size as GridProps['size']}
        sx={mergeSx(sx, mappedSx)}
        {...props}
      />
    );
  }
);

export default GridLegacyCompat;
