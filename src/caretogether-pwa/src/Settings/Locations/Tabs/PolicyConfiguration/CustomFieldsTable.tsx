import { Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { CustomField, CustomFieldType, CustomFieldValidation } from '../../../../GeneratedClient';
import { enumName } from './policyUtils';
import { DeleteRowAction, DuplicateRowAction, EmptyRow, ValuesText } from './sharedUi';

export function CustomFieldsTable({
  fields,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  fields?: CustomField[];
  onEdit?: (field: CustomField) => void;
  onDuplicate?: (field: CustomField) => void;
  onDelete?: (field: CustomField) => void;
}) {
  const rows = fields ?? [];
  const hasActions = Boolean(onDuplicate || onDelete);

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Validation</TableCell>
            <TableCell>Valid Values</TableCell>
            {hasActions && <TableCell align="right">Actions</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <EmptyRow
              colSpan={hasActions ? 5 : 4}
              label="No custom fields configured."
            />
          ) : (
            rows.map((field) => (
              <TableRow
                key={field.name}
                hover={Boolean(onEdit)}
                sx={onEdit ? { cursor: 'pointer' } : undefined}
                onClick={() => onEdit?.(field)}
              >
                <TableCell>{field.name}</TableCell>
                <TableCell>{enumName(CustomFieldType, field.type)}</TableCell>
                <TableCell>
                  {typeof field.validation === 'undefined'
                    ? '-'
                    : enumName(CustomFieldValidation, field.validation)}
                </TableCell>
                <TableCell>
                  <ValuesText values={field.validValues} />
                </TableCell>
                {hasActions && (
                  <TableCell align="right">
                    <Stack
                      direction="row"
                      justifyContent="flex-end"
                      spacing={0.5}
                    >
                      {onDuplicate && (
                        <DuplicateRowAction
                          label={field.name}
                          onClick={() => onDuplicate(field)}
                        />
                      )}
                      {onDelete && (
                        <DeleteRowAction
                          label={field.name}
                          onClick={() => onDelete(field)}
                        />
                      )}
                    </Stack>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

