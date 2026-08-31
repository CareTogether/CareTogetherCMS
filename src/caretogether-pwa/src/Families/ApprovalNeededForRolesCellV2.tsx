import { Box, Chip, Tooltip, Typography } from '@mui/material';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { v2Typography } from './v2Typography';

export function ApprovalNeededForRolesCellV2({ labels }: { labels: string[] }) {
  const chipListRef = useRef<HTMLDivElement | null>(null);
  const chipStripRef = useRef<HTMLDivElement | null>(null);
  const moreIndicatorMeasurementsRef = useRef<HTMLDivElement | null>(null);
  const moreIndicatorRef = useRef<HTMLDivElement | null>(null);
  const [widthHiddenLabelCount, setWidthHiddenLabelCount] = useState(0);

  const measureWidthOverflow = useCallback(() => {
    const chipList = chipListRef.current;
    const chipStrip = chipStripRef.current;
    const moreIndicatorMeasurements = moreIndicatorMeasurementsRef.current;

    if (!chipList || !chipStrip || !moreIndicatorMeasurements) {
      return;
    }

    const chipListWidth = chipList.clientWidth;
    const chipWidths = Array.from(chipStrip.children).flatMap((child) =>
      child instanceof HTMLElement ? [child.offsetWidth] : []
    );
    const gap = parseFloat(window.getComputedStyle(chipList).columnGap) || 0;
    const totalChipWidth =
      chipWidths.reduce((total, width) => total + width, 0) +
      Math.max(0, chipWidths.length - 1) * gap;

    if (totalChipWidth <= Math.ceil(chipListWidth)) {
      setWidthHiddenLabelCount(0);
      return;
    }

    const moreIndicatorWidth = (hiddenLabelCount: number) => {
      const measurement = moreIndicatorMeasurements.querySelector(
        `[data-hidden-label-count="${hiddenLabelCount}"]`
      );

      if (!(measurement instanceof HTMLElement)) {
        return 0;
      }

      return measurement.offsetWidth;
    };
    const chipWidthSums = chipWidths.reduce(
      (widthSums, chipWidth) => [
        ...widthSums,
        widthSums[widthSums.length - 1] + chipWidth,
      ],
      [0]
    );

    for (
      let visibleChipCount = labels.length - 1;
      visibleChipCount >= 0;
      visibleChipCount -= 1
    ) {
      const hiddenLabelCount = labels.length - visibleChipCount;
      const visibleChipGapCount = Math.max(0, visibleChipCount - 1);
      const indicatorGapCount = visibleChipCount > 0 ? 1 : 0;
      const requiredWidth =
        chipWidthSums[visibleChipCount] +
        visibleChipGapCount * gap +
        indicatorGapCount * gap +
        moreIndicatorWidth(hiddenLabelCount);

      if (requiredWidth <= Math.ceil(chipListWidth)) {
        setWidthHiddenLabelCount(hiddenLabelCount);
        return;
      }
    }

    setWidthHiddenLabelCount(labels.length);
  }, [labels.length]);

  useLayoutEffect(() => {
    measureWidthOverflow();

    const chipList = chipListRef.current;
    const chipStrip = chipStripRef.current;

    if (!chipList || !chipStrip) {
      return;
    }

    const animationFrame = window.requestAnimationFrame(measureWidthOverflow);

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measureWidthOverflow);

      return () => {
        window.cancelAnimationFrame(animationFrame);
        window.removeEventListener('resize', measureWidthOverflow);
      };
    }

    const resizeObserver = new ResizeObserver(measureWidthOverflow);
    resizeObserver.observe(chipList);
    resizeObserver.observe(chipStrip);

    if (moreIndicatorRef.current) {
      resizeObserver.observe(moreIndicatorRef.current);
    }

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
    };
  }, [labels, measureWidthOverflow]);

  if (labels.length === 0) {
    return <Typography {...v2Typography.browserSecondary}>-</Typography>;
  }

  const hasRoleTooltip = labels.length > 1;
  const hiddenLabelCount = widthHiddenLabelCount;
  const hasMoreIndicator = hiddenLabelCount > 0;
  const roleTooltipTitle = (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      {labels.map((label) => (
        <Typography
          key={label}
          className="ph-unmask"
          {...v2Typography.browserCell}
        >
          {label}
        </Typography>
      ))}
    </Box>
  );

  const chipList = (
    <Box
      ref={chipListRef}
      aria-label={
        hasRoleTooltip ? `Needed for roles: ${labels.join(', ')}` : undefined
      }
      sx={{
        alignItems: 'center',
        display: 'flex',
        gap: 0.5,
        minWidth: 0,
        pointerEvents: 'auto',
        width: '100%',
      }}
    >
      <Box
        ref={moreIndicatorMeasurementsRef}
        sx={{
          height: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
          position: 'absolute',
          visibility: 'hidden',
          width: 'max-content',
        }}
      >
        {labels.map((_label, index) => {
          const hiddenLabelCount = index + 1;

          return (
            <Chip
              key={hiddenLabelCount}
              data-hidden-label-count={hiddenLabelCount}
              label={`+${hiddenLabelCount}`}
              size="small"
              sx={{ flex: '0 0 auto' }}
              variant="outlined"
            />
          );
        })}
      </Box>
      <Box
        ref={chipStripRef}
        sx={{
          alignItems: 'center',
          display: 'flex',
          flex: '0 1 auto',
          flexWrap: 'nowrap',
          gap: 0.5,
          minWidth: 0,
          overflow: 'hidden',
        }}
      >
        {labels.map((label) => (
          <Chip
            key={label}
            className="ph-unmask"
            label={
              <Typography {...v2Typography.browserCell}>{label}</Typography>
            }
            size="small"
            sx={{ flex: '0 0 auto' }}
            variant="outlined"
          />
        ))}
      </Box>
      {hasMoreIndicator && (
        <Chip
          ref={moreIndicatorRef}
          aria-label={`${hiddenLabelCount} more needed roles`}
          label={`+${hiddenLabelCount}`}
          size="small"
          sx={{ flex: '0 0 auto', pointerEvents: 'auto' }}
          tabIndex={0}
          variant="outlined"
        />
      )}
    </Box>
  );

  if (!hasRoleTooltip) {
    return chipList;
  }

  return (
    <Tooltip arrow title={roleTooltipTitle}>
      {chipList}
    </Tooltip>
  );
}
