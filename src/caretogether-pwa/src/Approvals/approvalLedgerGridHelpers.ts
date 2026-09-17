import {
  gridFilteredSortedRowIdsSelector,
  type GridGetRowsToExportParams,
} from '@mui/x-data-grid-premium';
import { isApprovalLedgerLeafRowNode } from './approvalLedgerDataGridViewModel';

export function formatApprovalLedgerLeafValue<Row>(
  row: Row,
  isGeneratedRow: boolean,
  formatLeafValue: (leafRow: Row) => string
) {
  if (isGeneratedRow) return '';
  return formatLeafValue(row);
}

export function approvalLedgerLeafRowIdsForExport({
  apiRef,
}: GridGetRowsToExportParams) {
  return gridFilteredSortedRowIdsSelector(apiRef).filter((rowId) =>
    isApprovalLedgerLeafRowNode(apiRef.current.getRowNode(rowId))
  );
}
