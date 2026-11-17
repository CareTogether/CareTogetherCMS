import {
  Alert,
  Button,
  FormControl,
  FormControlLabel,
  FormLabel,
  Paper,
  Popper,
  Radio,
  RadioGroup,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import { useId, useRef, useState } from 'react';
import type { GridRenderEditCellParams } from '@mui/x-data-grid-premium';
import {
  matrixPhases,
  type MatrixEdit,
  type MatrixRequirement,
} from './casePolicyMatrix';
import { defaultMatrixSchedule, scheduleValidation } from './matrixSchedule';
import { MatrixScheduleFields } from './MatrixScheduleFields';
import { variantScheduleSummary } from './arrangementVariantRequirements';

export function MatrixRequirementFields({
  value,
  index = 0,
  occupied,
  onChange,
}: {
  value: Omit<MatrixEdit, 'phase'> & { phase: MatrixEdit['phase'] | '' };
  index?: number;
  occupied: ReadonlySet<MatrixEdit['phase']>;
  onChange: (changes: Partial<MatrixEdit>) => void;
}) {
  const editorId = useId();
  return (
    <>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
        <FormControl component="fieldset" sx={{ flex: 1, minWidth: 0 }}>
          <FormLabel component="legend" id={`${editorId}-${index}-phase`}>
            {`Requirement ${index + 1} phase`}
          </FormLabel>
          <RadioGroup
            row
            aria-labelledby={`${editorId}-${index}-phase`}
            name={`${editorId}-${index}-phase`}
            value={value.phase}
            onChange={(event) => {
              const phase = event.target.value as MatrixEdit['phase'];
              if (
                value.phase === 'Monitoring' &&
                phase !== 'Monitoring' &&
                !window.confirm(
                  'Changing phase removes this monitoring schedule. Continue?'
                )
              )
                return;
              onChange({
                phase,
                recurrence:
                  phase === 'Monitoring' ? value.recurrence : undefined,
                schedule:
                  phase === 'Monitoring'
                    ? (value.schedule ?? defaultMatrixSchedule())
                    : undefined,
              });
            }}
          >
            {matrixPhases.map((phase) => (
              <FormControlLabel
                key={phase}
                value={phase}
                control={<Radio size="small" />}
                label={phase}
                disabled={phase !== value.phase && occupied.has(phase)}
              />
            ))}
          </RadioGroup>
        </FormControl>
        <Stack sx={{ minWidth: 140 }}>
          <FormControlLabel
            label="Required"
            control={
              <Switch
                checked={value.isRequired}
                onChange={(_event, checked) =>
                  onChange({ isRequired: checked })
                }
                slotProps={{
                  input: {
                    role: 'switch',
                    'aria-label': `Requirement ${index + 1} Required`,
                    'aria-describedby': `${editorId}-${index}-applicability`,
                  },
                }}
              />
            }
          />
          <Typography
            id={`${editorId}-${index}-applicability`}
            variant="caption"
            color="text.secondary"
          >
            {value.isRequired ? 'Required' : 'Optional'}
          </Typography>
        </Stack>
      </Stack>
      {value.phase === 'Monitoring' && (
        <MatrixScheduleFields
          value={value.schedule ?? value.recurrence!.toJSON()}
          onChange={(schedule) => onChange({ schedule })}
        />
      )}
    </>
  );
}

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
            Base requirements apply to every variant. Additional variant
            requirements never override Base. Use the Base column to change base
            requirements.
          </Typography>
          {shared.map((item) => (
            <Typography key={item.id} variant="body2" color="primary">
              Base · {item.phase} · {item.isRequired ? 'Required' : 'Optional'}{' '}
              (edit in the Base column)
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
              <MatrixRequirementFields
                value={item}
                index={index}
                occupied={occupied}
                onChange={(changes) => update(index, changes)}
              />
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
