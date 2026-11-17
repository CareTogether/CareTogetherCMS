import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Drawer,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
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
import { defaultMatrixSchedule, scheduleValidation } from './matrixSchedule';
import {
  matrixActionPhase,
  matrixOwner,
  matrixRequirements,
} from './casePolicyMatrix';

export function MatrixAddActionDialog({
  open,
  policy,
  baseline,
  visibleActions,
  onClose,
  onFind,
  onApply,
}: {
  open: boolean;
  policy: EffectiveLocationPolicy;
  baseline: EffectiveLocationPolicy;
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
  const phaseResolution = actionName
    ? matrixActionPhase(policy, baseline, actionName)
    : undefined;
  const blockedPhase =
    phaseResolution?.status === 'conflict' ||
    phaseResolution?.status === 'ambiguous';
  const occupied = new Set(
    scope && actionName
      ? matrixRequirements(
          matrixOwner(policy, scope),
          matrixOwner(baseline, scope)
        )
          .filter((item) => item.actionName === actionName)
          .map((item) => item.phase)
      : []
  );
  const occupiedScope = occupied.size > 0;
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
      blockedPhase ||
      occupiedScope ||
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
    <Drawer
      anchor="right"
      open={open}
      onClose={() => void close()}
      slotProps={{
        paper: {
          role: 'dialog',
          'aria-modal': true,
          'aria-labelledby': 'matrix-add-action-title',
          sx: {
            width: { xs: '100vw', sm: 600 },
            maxWidth: '100vw',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            overflowX: 'hidden',
          },
        },
      }}
    >
      <Stack
        direction="row"
        sx={{
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          p: 2,
          flexShrink: 0,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Typography
          id="matrix-add-action-title"
          variant="h6"
          component="h2"
          className="ph-unmask"
        >
          Add Action
        </Typography>
        <IconButton aria-label="Close Add Action" onClick={() => void close()}>
          <CloseIcon />
        </IconButton>
      </Stack>
      <Box
        component="section"
        aria-label="Add Action configuration"
        sx={{ flex: 1, minHeight: 0, overflowY: 'auto', p: 2 }}
      >
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
              const phase = name
                ? matrixActionPhase(policy, baseline, name).phase
                : undefined;
              setValue({
                id: 'new-action',
                phase: phase ?? '',
                isRequired: true,
                schedule:
                  phase === 'Monitoring' ? defaultMatrixSchedule() : undefined,
              });
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
          {phaseResolution?.message && (
            <Alert severity={blockedPhase ? 'warning' : 'info'}>
              {phaseResolution.message}
            </Alert>
          )}
          {existing && (
            <Alert severity="info">
              This action already has a matrix row. Find it to configure another
              available scope in the cell editor.
            </Alert>
          )}
          {occupiedScope && (
            <Alert severity="info">
              This scope already contains this action. Use Find in matrix to
              edit its requirements.
            </Alert>
          )}
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
              isOptionEqualToValue={(left, right) => left.field === right.field}
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
              Base requirements apply to every variant. Variant requirements are
              additional, not overrides.
            </Typography>
            <MatrixRequirementFields
              value={value}
              occupied={new Set()}
              phaseLocked={
                phaseResolution?.status !== 'unused' && !!phaseResolution
              }
              onChange={(changes) => {
                setValue((current) => ({ ...current, ...changes }));
                setError(undefined);
              }}
            />
          </>
          {(invalid || error) && (
            <Alert severity="error">{invalid || error}</Alert>
          )}
        </Stack>
      </Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          flexWrap: 'wrap',
          gap: 1,
          p: 2,
          flexShrink: 0,
          borderTop: 1,
          borderColor: 'divider',
        }}
      >
        <Button onClick={onClose}>Cancel</Button>
        {existing && (
          <Button
            variant="contained"
            disabled={stale}
            onClick={() => {
              if (actionName) onFind(actionName);
            }}
          >
            Find in matrix
          </Button>
        )}
        <Button
          variant="contained"
          disabled={
            stale ||
            !actionName ||
            !choices.includes(actionName) ||
            !scope ||
            !value.phase ||
            blockedPhase ||
            occupiedScope ||
            !!invalid
          }
          onClick={apply}
        >
          Apply to draft
        </Button>
      </Box>
    </Drawer>
  );
}
