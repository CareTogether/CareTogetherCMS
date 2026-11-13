import {
  Alert,
  Button,
  MenuItem,
  Paper,
  Popper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useRef, useState } from 'react';
import type { GridRenderEditCellParams } from '@mui/x-data-grid-premium';
import {
  matrixPhases,
  type MatrixEdit,
  type MatrixRequirement,
} from './casePolicyMatrix';
import { defaultMatrixSchedule, scheduleValidation } from './matrixSchedule';
import { MatrixScheduleFields } from './MatrixScheduleFields';
import { variantScheduleSummary } from './arrangementVariantRequirements';

export function CasePolicyMatrixCellEditor({
  params,
  requirements,
  shared,
  scopeLabel,
  onFinished,
}: {
  params: GridRenderEditCellParams;
  requirements: MatrixRequirement[];
  shared: MatrixRequirement[];
  scopeLabel: string;
  onFinished: () => void;
}) {
  const initial = requirements
    .filter((item) => !item.readOnlyReason)
    .map(({ id, phase, isRequired, recurrence }) => ({
      id,
      phase,
      isRequired,
      recurrence,
    }));
  const [values, setValues] = useState<MatrixEdit[]>(initial);
  const [error, setError] = useState<string>();
  const nextId = useRef(0);
  const protectedRows = requirements.filter((item) => item.readOnlyReason);
  const occupied = new Set(
    [...protectedRows, ...values].map((item) => item.phase)
  );
  const available = matrixPhases.filter((phase) => !occupied.has(phase));
  const invalid = values
    .map((item) =>
      item.phase === 'Monitoring'
        ? scheduleValidation(item.schedule ?? item.recurrence?.toJSON())
        : undefined
    )
    .find(Boolean);
  function update(index: number, value: Partial<MatrixEdit>) {
    setValues((current) =>
      current.map((item, i) => (i === index ? { ...item, ...value } : item))
    );
  }
  function cancel() {
    params.api.stopCellEditMode({
      id: params.id,
      field: params.field,
      ignoreModifications: true,
    });
    onFinished();
    params.api.setCellFocus(params.id, params.field);
  }
  async function apply() {
    try {
      const valid = await params.api.setEditCellValue({
        id: params.id,
        field: params.field,
        value: values,
      });
      if (valid === false) return;
      params.api.stopCellEditMode({ id: params.id, field: params.field });
      params.api.setCellFocus(params.id, params.field);
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : 'The cell could not be applied.'
      );
    }
  }
  return (
    <Popper
      open
      anchorEl={params.api.getCellElement(params.id, params.field)}
      placement="bottom-start"
      modifiers={[
        { name: 'flip', enabled: false },
        {
          name: 'preventOverflow',
          options: {
            mainAxis: true,
            altAxis: true,
            tether: false,
            padding: 12,
            rootBoundary: 'viewport',
          },
        },
      ]}
      sx={{ zIndex: 1299 }}
    >
      <Paper
        role="dialog"
        aria-label={`Edit ${String(params.id)} — ${scopeLabel}`}
        elevation={8}
        sx={{
          p: 2,
          width: 'min(600px, calc(100vw - 24px))',
          maxHeight: '70vh',
          overflow: 'auto',
          boxSizing: 'border-box',
        }}
        onKeyDown={(event) => {
          event.stopPropagation();
          if (event.key === 'Escape') {
            event.preventDefault();
            cancel();
          }
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <Stack spacing={2}>
          <Typography variant="subtitle1">
            {String(params.id)} — {scopeLabel}
          </Typography>
          <Typography variant="caption">
            Shared requirements apply to every variant. Additional variant
            requirements never override Shared. Use the Shared column to change
            shared requirements.
          </Typography>
          {shared.map((item) => (
            <Typography key={item.id} variant="body2" color="primary">
              Shared · {item.phase} ·{' '}
              {item.isRequired ? 'Required' : 'Optional'} (edit in the Shared
              column)
            </Typography>
          ))}
          {protectedRows.map((item) => (
            <Alert severity="info" key={item.id}>
              {item.phase} · {item.isRequired ? 'Required' : 'Optional'} ·{' '}
              {item.readOnlyReason}
              {item.phase === 'Monitoring' &&
                variantScheduleSummary(item.recurrence).map((line, index) => (
                  <Typography
                    variant="caption"
                    sx={{ display: 'block' }}
                    key={index}
                  >
                    {line}
                  </Typography>
                ))}
            </Alert>
          ))}
          {values.length === 0 && (
            <Typography variant="body2">
              Not used in this scope
              {protectedRows.length
                ? ' except for the protected contributions above'
                : ''}
              .
            </Typography>
          )}
          {values.map((item, index) => (
            <Stack
              key={item.id}
              spacing={1}
              sx={{ p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}
            >
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label={`Requirement ${index + 1} phase`}
                  value={item.phase}
                  onChange={(event) => {
                    const phase = event.target.value as MatrixEdit['phase'];
                    if (
                      item.phase === 'Monitoring' &&
                      phase !== 'Monitoring' &&
                      !window.confirm(
                        'Changing phase removes this monitoring schedule. Continue?'
                      )
                    )
                      return;
                    update(index, {
                      phase,
                      recurrence:
                        phase === 'Monitoring' ? item.recurrence : undefined,
                      schedule:
                        phase === 'Monitoring'
                          ? (item.schedule ?? defaultMatrixSchedule())
                          : undefined,
                    });
                  }}
                >
                  {matrixPhases.map((phase) => (
                    <MenuItem
                      key={phase}
                      value={phase}
                      disabled={phase !== item.phase && occupied.has(phase)}
                    >
                      {phase}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label={`Requirement ${index + 1} applicability`}
                  value={item.isRequired ? 'Required' : 'Optional'}
                  onChange={(event) =>
                    update(index, {
                      isRequired: event.target.value === 'Required',
                    })
                  }
                >
                  <MenuItem value="Required">Required</MenuItem>
                  <MenuItem value="Optional">Optional</MenuItem>
                </TextField>
              </Stack>
              {item.phase === 'Monitoring' && (
                <MatrixScheduleFields
                  value={item.schedule ?? item.recurrence!.toJSON()}
                  onChange={(schedule) => update(index, { schedule })}
                />
              )}
              <Button
                color="error"
                onClick={() =>
                  setValues((current) => current.filter((_, i) => i !== index))
                }
              >
                Not used — remove requirement {index + 1}
              </Button>
            </Stack>
          ))}
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            {available.map((phase) => (
              <Button
                key={phase}
                onClick={() =>
                  setValues((current) => [
                    ...current,
                    {
                      id: 'new-' + nextId.current++,
                      phase,
                      isRequired: true,
                      schedule:
                        phase === 'Monitoring'
                          ? defaultMatrixSchedule()
                          : undefined,
                    },
                  ])
                }
              >
                Add {phase}
              </Button>
            ))}
          </Stack>
          {(invalid || error) && (
            <Alert severity="error">{invalid || error}</Alert>
          )}
          <Stack direction="row" spacing={1}>
            <Button onClick={cancel}>Cancel cell</Button>
            <Button
              variant="contained"
              disabled={
                !!invalid || JSON.stringify(values) === JSON.stringify(initial)
              }
              onClick={() => void apply()}
            >
              Apply to draft
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Popper>
  );
}
