import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Box, Chip, Tooltip, Typography, useTheme } from '@mui/material';
import {
  DataGridPremium,
  GridColDef,
  GridFilterInputSingleSelect,
  GridFilterOperator,
  GridToolbar,
} from '@mui/x-data-grid-premium';
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useUserLookup } from '../Model/DirectoryModel';
import { PersonName } from '../Families/PersonName';
import type { ApprovalLedgerRow } from './approvalLedgerViewModel';
import {
  ApprovalLedgerDataGridRowV2,
  approvalLedgerSearchText,
  approvalLedgerStatusColor,
  approvalLedgerStatusLabels,
  countLabel,
  formatApprovalLedgerDate,
  subjectKey,
} from './approvalLedgerDataGridViewModel';
import { v2DataGridStyles } from '../Families/v2DataGridStyles';
import { v2Typography } from '../Families/v2Typography';

type ApprovalsDataGridV2Props = {
  onRowClick: (row: ApprovalLedgerRow) => void;
  rows: ApprovalLedgerRow[];
};

type NeededForRoleValueOption = {
  label: string;
  value: string;
};

function OverflowRoleChipList({ labels }: { labels: string[] }) {
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

function AppliesToChips({ row }: { row: ApprovalLedgerRow }) {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
      {row.appliesTo.map((subject) => (
        <Chip
          key={subjectKey(subject.scope, subject.id)}
          label={
            <Typography {...v2Typography.browserCell}>
              {subject.label}
            </Typography>
          }
          size="small"
          variant="outlined"
        />
      ))}
    </Box>
  );
}

function neededForRoleValueOptions(
  rows: ApprovalLedgerRow[]
): NeededForRoleValueOption[] {
  const roleLabelsByValue = new Map<string, string>();

  rows.forEach((row) => {
    row.neededForRoles.forEach((role, index) => {
      if (roleLabelsByValue.has(role)) {
        return;
      }

      roleLabelsByValue.set(role, row.neededForRoleLabels[index] ?? role);
    });
  });

  return Array.from(roleLabelsByValue.entries())
    .map(([value, label]) => ({ label, value }))
    .sort((firstOption, secondOption) =>
      firstOption.label.localeCompare(secondOption.label)
    );
}

const neededForRoleFilterOperators: GridFilterOperator<
  ApprovalLedgerDataGridRowV2,
  string
>[] = [
  {
    label: 'is',
    value: 'is',
    getApplyFilterFn: (filterItem) => {
      if (filterItem.value == null || filterItem.value === '') {
        return null;
      }

      const role = String(filterItem.value);

      return (_value, row) => row.neededForRoles.includes(role);
    },
    InputComponent: GridFilterInputSingleSelect,
  },
];

function buildColumns(
  userLookup: ReturnType<typeof useUserLookup>,
  neededForRoleOptions: NeededForRoleValueOption[]
): GridColDef<ApprovalLedgerDataGridRowV2>[] {
  return [
    {
      field: 'status',
      headerName: 'Status',
      width: 140,
      valueGetter: (_value, row) => approvalLedgerStatusLabels[row.status],
      renderCell: ({ row }) => (
        <Chip
          color={approvalLedgerStatusColor(row.status)}
          label={approvalLedgerStatusLabels[row.status]}
          size="small"
        />
      ),
    },
    {
      field: 'requirementName',
      headerName: 'Requirement',
      minWidth: 220,
      flex: 1,
      renderCell: ({ row }) => (
        <Typography className="ph-unmask" {...v2Typography.browserCell} noWrap>
          {row.requirementName}
        </Typography>
      ),
    },
    {
      field: 'appliesTo',
      headerName: 'Applies To',
      minWidth: 220,
      flex: 0.9,
      valueGetter: (_value, row) =>
        row.appliesTo.map((subject) => subject.label).join(', '),
      renderCell: ({ row }) => <AppliesToChips row={row} />,
    },
    {
      field: 'completedOrExemptedOn',
      headerName: 'Completed / Exempted On',
      minWidth: 190,
      valueGetter: (_value, row) =>
        row.completedOrExemptedOn?.getTime() ?? null,
      renderCell: ({ row }) => (
        <Typography {...v2Typography.browserSecondary}>
          {formatApprovalLedgerDate(row.completedOrExemptedOn)}
        </Typography>
      ),
    },
    {
      field: 'validUntil',
      headerName: 'Valid Until',
      minWidth: 140,
      valueGetter: (_value, row) => row.validUntil?.getTime() ?? null,
      renderCell: ({ row }) => (
        <Typography {...v2Typography.browserSecondary}>
          {formatApprovalLedgerDate(row.validUntil)}
        </Typography>
      ),
    },
    {
      field: 'neededForRoles',
      headerName: 'Needed For Roles',
      minWidth: 220,
      flex: 0.9,
      type: 'singleSelect',
      valueGetter: (_value, row) => row.neededForRoleLabels.join(', '),
      valueOptions: neededForRoleOptions,
      filterOperators: neededForRoleFilterOperators,
      renderCell: ({ row }) => (
        <OverflowRoleChipList labels={row.neededForRoleLabels} />
      ),
    },
    {
      field: 'documents',
      headerName: 'Documents',
      width: 130,
      valueGetter: (_value, row) => row.linkedDocumentIds.length,
      renderCell: ({ row }) => (
        <Typography {...v2Typography.browserSecondary}>
          {countLabel(row.linkedDocumentIds.length, 'document', 'documents')}
        </Typography>
      ),
    },
    {
      field: 'notes',
      headerName: 'Notes',
      width: 110,
      valueGetter: (_value, row) => row.noteIds.length + row.notes.length,
      renderCell: ({ row }) => (
        <Typography {...v2Typography.browserSecondary}>
          {countLabel(row.noteIds.length + row.notes.length, 'note', 'notes')}
        </Typography>
      ),
    },
    {
      field: 'completedOrExemptedByUserId',
      headerName: 'Completed / Exempted By',
      minWidth: 200,
      flex: 0.8,
      valueGetter: (_value, row) => row.completedOrExemptedByUserId ?? '',
      renderCell: ({ row }) =>
        row.completedOrExemptedByUserId ? (
          <Typography {...v2Typography.browserCell} noWrap>
            <PersonName person={userLookup(row.completedOrExemptedByUserId)} />
          </Typography>
        ) : (
          <Typography {...v2Typography.browserSecondary}>-</Typography>
        ),
    },
    {
      field: 'searchText',
      headerName: 'Search',
      valueGetter: (_value, row) => approvalLedgerSearchText(row),
      hideable: false,
      filterable: true,
      sortable: false,
      disableColumnMenu: true,
      width: 0,
      renderCell: () => null,
    },
    {
      field: 'openDetails',
      headerName: '',
      width: 44,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: () => (
        <ChevronRightIcon
          fontSize="small"
          sx={{
            color: 'text.secondary',
            opacity: 0,
            transition: 'opacity 120ms ease-in-out',
          }}
        />
      ),
    },
  ];
}

export function ApprovalsDataGridV2({
  onRowClick,
  rows,
}: ApprovalsDataGridV2Props) {
  const theme = useTheme();
  const userLookup = useUserLookup();
  const gridContainerRef = useRef<HTMLDivElement | null>(null);
  const neededForRoleOptions = useMemo(
    () => neededForRoleValueOptions(rows),
    [rows]
  );
  const columns = useMemo(
    () => buildColumns(userLookup, neededForRoleOptions),
    [neededForRoleOptions, userLookup]
  );

  const clearGridFocus = () => {
    const activeElement = document.activeElement;

    if (
      activeElement instanceof HTMLElement &&
      gridContainerRef.current?.contains(activeElement)
    ) {
      activeElement.blur();
    }
  };

  return (
    <Box
      ref={gridContainerRef}
      sx={[
        v2DataGridStyles(theme),
        {
          '& .MuiDataGrid-cell': {
            pointerEvents: 'none',
          },
          '& .MuiDataGrid-cell:hover, & .MuiDataGrid-cell.Mui-selected, & .MuiDataGrid-cell--editing':
            {
              backgroundColor: 'transparent',
            },
          '& .MuiDataGrid-root .MuiDataGrid-cell:focus, & .MuiDataGrid-root .MuiDataGrid-cell:focus-visible, & .MuiDataGrid-root .MuiDataGrid-cell:focus-within, & .MuiDataGrid-cell.Mui-selected':
            {
              backgroundColor: 'transparent',
              boxShadow: 'none',
              outline: 'none',
            },
          '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within':
            {
              backgroundColor: 'transparent',
              boxShadow: 'none',
              outline: 'none',
            },
          '& .MuiDataGrid-columnHeader:focus-visible': {
            backgroundColor: 'transparent',
            boxShadow: 'none',
            outline: 'none',
          },
        },
      ]}
    >
      <DataGridPremium
        autoHeight
        rows={rows}
        columns={columns}
        rowHeight={56}
        columnHeaderHeight={42}
        disableRowSelectionOnClick
        hideFooter
        initialState={{
          columns: {
            columnVisibilityModel: {
              searchText: false,
            },
          },
        }}
        onRowClick={({ row }) => {
          clearGridFocus();
          onRowClick(row);
        }}
        onCellKeyDown={({ row }, event) => {
          if (event.key !== 'Enter' && event.key !== ' ') {
            return;
          }

          event.preventDefault();
          clearGridFocus();
          onRowClick(row);
        }}
        slots={{ toolbar: GridToolbar }}
        slotProps={{
          toolbar: {
            showQuickFilter: true,
          },
        }}
      />
    </Box>
  );
}
