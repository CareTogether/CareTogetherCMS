import {
  Alert,
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useRef, useState } from 'react';
import type { EffectiveLocationPolicy } from '../../../../GeneratedClient';
import { usePolicyTransitionGuard } from '../../../../Hooks/useUnsavedPolicyNavigation';
import { MatrixRequirementFields } from './CasePolicyMatrixCellEditor';
import {
  matrixActionChoices,
  matrixScopes,
  type MatrixEdit,
  type MatrixScope,
} from './casePolicyMatrix';
import { scheduleValidation } from './matrixSchedule';

export function MatrixAddActionDialog({
  policy,
  visibleActions,
  onClose,
  onFind,
  onApply,
}: {
  policy: EffectiveLocationPolicy;
  visibleActions: string[];
  onClose: () => void;
  onFind: (actionName: string) => void;
  onApply: (actionName: string, scope: MatrixScope, edit: MatrixEdit) => void;
}) {
  const openedPolicy = useRef(policy);
  const [actionName, setActionName] = useState<string | null>(null);
  const [actionInput, setActionInput] = useState('');
  const [scopeInput, setScopeInput] = useState('');
  const [field, setField] = useState<string>();
  const [value, setValue] = useState<
    Omit<MatrixEdit, 'phase'> & { phase: MatrixEdit['phase'] | '' }
  >({ id: 'new-action', phase: '', isRequired: true });
  const [error, setError] = useState<string>();
  const choices = matrixActionChoices(policy);
  const scopes = matrixScopes(policy).scopes.filter(
    (scope) => !scope.readOnlyReason
  );
  const scope = scopes.find((item) => item.field === field);
  const stale = policy !== openedPolicy.current;
  const existing = !!actionName && visibleActions.includes(actionName);
  const invalid =
    value.phase === 'Monitoring'
      ? scheduleValidation(value.schedule)
      : undefined;
  const canLeave = usePolicyTransitionGuard({
    dirty: !!actionName || !!field || !!value.phase || !value.isRequired,
    saving: false,
  });
  async function close() {
    if (await canLeave()) onClose();
  }
  function apply() {
    if (
      stale ||
      !actionName ||
      !choices.includes(actionName) ||
      !scope ||
      !value.phase ||
      invalid
    )
      return;
    try {
      onApply(actionName, scope, { ...value, phase: value.phase });
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'The action could not be added. Review the selection.'
      );
    }
  }
  return (
    <Dialog
      open
      fullWidth
      maxWidth="sm"
      aria-labelledby="matrix-add-action-title"
      onClose={() => void close()}
    >
      <DialogTitle id="matrix-add-action-title">Add Action</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          {stale && (
            <Alert severity="warning">
              The policy changed. Cancel and reopen Add Action to review the
              latest values.
            </Alert>
          )}
          {!choices.length && (
            <Alert severity="info">
              No unambiguous Action Definitions are available. Review Action
              Definitions.
            </Alert>
          )}
          {!scopes.length && (
            <Alert severity="info">
              No editable arrangement scopes are available.
            </Alert>
          )}
          <Autocomplete
            options={choices}
            value={actionName}
            inputValue={actionInput}
            onInputChange={(_event, input, reason) => {
              if (reason === 'reset' && !actionName) return;
              setActionInput(input);
              if (reason === 'input') setActionName(null);
            }}
            onChange={(_event, name) => {
              setActionName(name);
              setError(undefined);
            }}
            disabled={stale}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Existing Action Definition"
                autoFocus
              />
            )}
          />
          {existing ? (
            <Alert severity="info">
              This action already has a matrix row. Find it to configure another
              available scope in the cell editor.
            </Alert>
          ) : (
            <>
              <Autocomplete
                options={scopes}
                value={scope ?? null}
                inputValue={scopeInput}
                onInputChange={(_event, input, reason) => {
                  if (reason === 'reset' && !field) return;
                  setScopeInput(input);
                  if (reason === 'input') setField(undefined);
                }}
                isOptionEqualToValue={(left, right) =>
                  left.field === right.field
                }
                getOptionLabel={(item) =>
                  item.functionName
                    ? `${item.arrangement} / ${item.functionName} / ${item.variant} (additional)`
                    : `${item.arrangement} / Base`
                }
                onChange={(_event, item) => {
                  setField(item?.field);
                  setError(undefined);
                }}
                disabled={stale}
                renderInput={(params) => (
                  <TextField {...params} label="Target scope" />
                )}
              />
              <Typography variant="body2">
                Base requirements apply to every variant. Variant requirements
                are additional, not overrides.
              </Typography>
              <MatrixRequirementFields
                value={value}
                occupied={new Set()}
                onChange={(changes) => {
                  setValue((current) => ({ ...current, ...changes }));
                  setError(undefined);
                }}
              />
            </>
          )}
          {(invalid || error) && (
            <Alert severity="error">{invalid || error}</Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ flexWrap: 'wrap' }}>
        <Button onClick={onClose}>Cancel</Button>
        {existing ? (
          <Button
            variant="contained"
            disabled={stale}
            onClick={() => {
              if (actionName) onFind(actionName);
            }}
          >
            Find in matrix
          </Button>
        ) : (
          <Button
            variant="contained"
            disabled={
              stale ||
              !actionName ||
              !choices.includes(actionName) ||
              !scope ||
              !value.phase ||
              !!invalid
            }
            onClick={apply}
          >
            Apply to draft
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
