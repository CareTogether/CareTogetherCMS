import {
  createContext,
  useContext,
  type ComponentProps,
  type ReactNode,
} from 'react';
import { Badge, Tooltip } from '@mui/material';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import {
  ColumnsPanelTrigger,
  FilterPanelTrigger,
  ToolbarButton,
  ExportExcel,
  useGridRootProps,
} from '@mui/x-data-grid-premium';
import {
  GridToolbar,
  GridToolbarDivider,
} from '@mui/x-data-grid-pro/internals';

const MatrixHistoryContext = createContext({
  canUndo: false,
  canRedo: false,
  undo: () => {},
  redo: () => {},
});

export function CasePolicyMatrixHistory({
  value,
  children,
}: {
  value: {
    canUndo: boolean;
    canRedo: boolean;
    undo: () => void;
    redo: () => void;
  };
  children: ReactNode;
}) {
  return (
    <MatrixHistoryContext.Provider value={value}>
      {children}
    </MatrixHistoryContext.Provider>
  );
}

export function CasePolicyMatrixToolbar(
  props: ComponentProps<typeof GridToolbar>
) {
  const history = useContext(MatrixHistoryContext);
  const root = useGridRootProps();
  return (
    <GridToolbar
      {...props}
      mainControls={
        <>
          <Tooltip title="Undo">
            <span>
              <ToolbarButton
                aria-label="Undo"
                disabled={!history.canUndo}
                onClick={history.undo}
              >
                <UndoIcon fontSize="small" />
              </ToolbarButton>
            </span>
          </Tooltip>
          <Tooltip title="Redo">
            <span>
              <ToolbarButton
                aria-label="Redo"
                disabled={!history.canRedo}
                onClick={history.redo}
              >
                <RedoIcon fontSize="small" />
              </ToolbarButton>
            </span>
          </Tooltip>
          <GridToolbarDivider />
          {!root.disableColumnSelector && (
            <Tooltip title="Manage columns">
              <ColumnsPanelTrigger render={<ToolbarButton />}>
                <root.slots.columnSelectorIcon fontSize="small" />
              </ColumnsPanelTrigger>
            </Tooltip>
          )}
          {!root.disableColumnFilter && (
            <Tooltip title="Filters">
              <FilterPanelTrigger
                render={(triggerProps, state) => (
                  <ToolbarButton
                    {...triggerProps}
                    color={state.filterCount > 0 ? 'primary' : 'default'}
                  >
                    <Badge
                      badgeContent={state.filterCount}
                      color="primary"
                      variant="dot"
                    >
                      <root.slots.openFilterButtonIcon fontSize="small" />
                    </Badge>
                  </ToolbarButton>
                )}
              />
            </Tooltip>
          )}
        </>
      }
      additionalExportMenuItems={
        props.excelOptions?.disableToolbarButton
          ? undefined
          : (onMenuItemClick) => (
              <ExportExcel
                render={
                  <root.slots.baseMenuItem {...root.slotProps?.baseMenuItem} />
                }
                options={props.excelOptions}
                onClick={onMenuItemClick}
              >
                Export Excel
              </ExportExcel>
            )
      }
    />
  );
}
