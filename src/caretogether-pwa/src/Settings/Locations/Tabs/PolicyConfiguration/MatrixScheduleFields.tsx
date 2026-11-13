import {
  Button,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import {
  defaultMatrixSchedule,
  matrixScheduleKinds,
  wholeScheduleDays,
} from './matrixSchedule';

export function MatrixScheduleFields({
  value,
  onChange,
}: {
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
}) {
  const staged =
    value.discriminator === 'DurationStagesRecurrencePolicy' ||
    value.discriminator === 'DurationStagesPerChildLocationRecurrencePolicy';
  const stages = (value.stages ?? []) as {
    delay: string;
    maxOccurrences?: number | null | string;
  }[];
  function stageChange(
    index: number,
    update: Partial<(typeof stages)[number]>
  ) {
    onChange({
      ...value,
      stages: stages.map((stage, i) =>
        i === index ? { ...stage, ...update } : stage
      ),
    });
  }
  function move(index: number, offset: number) {
    const next = [...stages];
    [next[index], next[index + offset]] = [next[index + offset], next[index]];
    onChange({ ...value, stages: next });
  }
  return (
    <Stack spacing={1}>
      <TextField
        select
        size="small"
        label="Schedule type"
        value={value.discriminator}
        onChange={(event) => {
          if (
            event.target.value === value.discriminator ||
            !window.confirm(
              'Changing schedule type replaces this schedule. Continue?'
            )
          )
            return;
          onChange(defaultMatrixSchedule(event.target.value));
        }}
      >
        {matrixScheduleKinds.map((kind) => (
          <MenuItem key={kind.value} value={kind.value}>
            {kind.label}
          </MenuItem>
        ))}
      </TextField>
      {staged ? (
        <>
          <Typography variant="caption">
            Stages run in order. Each delay is the stage interval; only the
            final stage may repeat without a limit.
          </Typography>
          {stages.map((stage, index) => (
            <Stack
              key={index}
              spacing={1}
              sx={{ border: 1, borderColor: 'divider', p: 1, borderRadius: 1 }}
            >
              <Typography variant="subtitle2">Stage {index + 1}</Typography>
              <TextField
                label={`Stage ${index + 1} interval (days)`}
                type="number"
                size="small"
                value={wholeScheduleDays(stage.delay) ?? ''}
                onChange={(event) =>
                  stageChange(index, {
                    delay: `${event.target.value}.00:00:00`,
                  })
                }
                slotProps={{ htmlInput: { min: 1, step: 1 } }}
              />
              <FormControlLabel
                label="Unlimited occurrences"
                control={
                  <Switch
                    checked={stage.maxOccurrences == null}
                    onChange={(_, checked) =>
                      stageChange(index, { maxOccurrences: checked ? null : 1 })
                    }
                  />
                }
              />
              {stage.maxOccurrences != null && (
                <TextField
                  label={`Stage ${index + 1} occurrence limit`}
                  type="number"
                  size="small"
                  value={stage.maxOccurrences}
                  onChange={(event) =>
                    stageChange(index, {
                      maxOccurrences:
                        event.target.value === ''
                          ? ''
                          : Number(event.target.value),
                    })
                  }
                  slotProps={{ htmlInput: { min: 0, step: 1 } }}
                />
              )}
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                <Button
                  size="small"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  Move stage {index + 1} up
                </Button>
                <Button
                  size="small"
                  disabled={index === stages.length - 1}
                  onClick={() => move(index, 1)}
                >
                  Move stage {index + 1} down
                </Button>
                <Button
                  size="small"
                  onClick={() =>
                    onChange({
                      ...value,
                      stages: stages.filter((_, i) => i !== index),
                    })
                  }
                >
                  Remove stage {index + 1}
                </Button>
              </Stack>
            </Stack>
          ))}
          <Button
            onClick={() => {
              const next = [...stages];
              const index =
                next.length && next[next.length - 1].maxOccurrences == null
                  ? next.length - 1
                  : next.length;
              next.splice(index, 0, { delay: '1.00:00:00', maxOccurrences: 1 });
              onChange({ ...value, stages: next });
            }}
          >
            Add stage
          </Button>
        </>
      ) : (
        <>
          {value.discriminator === 'OneTimeRecurrencePolicy' && (
            <FormControlLabel
              label="No delay"
              control={
                <Switch
                  checked={value.delay == null}
                  onChange={(_, checked) =>
                    onChange({
                      ...value,
                      delay: checked ? undefined : '0.00:00:00',
                    })
                  }
                />
              }
            />
          )}
          {value.delay != null && (
            <TextField
              size="small"
              type="number"
              label="Delay (days)"
              value={wholeScheduleDays(value.delay) ?? ''}
              onChange={(event) =>
                onChange({ ...value, delay: `${event.target.value}.00:00:00` })
              }
              slotProps={{ htmlInput: { min: 0, step: 1 } }}
            />
          )}
          {value.discriminator ===
            'ChildCareOccurrenceBasedRecurrencePolicy' && (
            <>
              <TextField
                size="small"
                type="number"
                label="Occurrence frequency"
                value={value.frequency ?? ''}
                onChange={(event) =>
                  onChange({
                    ...value,
                    frequency:
                      event.target.value === ''
                        ? ''
                        : Number(event.target.value),
                  })
                }
              />
              <TextField
                size="small"
                type="number"
                label="Initial occurrence skip"
                value={value.initialSkipCount ?? ''}
                onChange={(event) =>
                  onChange({
                    ...value,
                    initialSkipCount:
                      event.target.value === ''
                        ? ''
                        : Number(event.target.value),
                  })
                }
              />
              <TextField
                select
                size="small"
                label="Occurrence selection"
                value={value.positive === true ? 'matching' : 'non-matching'}
                onChange={(event) =>
                  onChange({
                    ...value,
                    positive: event.target.value === 'matching',
                  })
                }
              >
                <MenuItem value="matching">Matching occurrences</MenuItem>
                <MenuItem value="non-matching">
                  Non-matching occurrences
                </MenuItem>
              </TextField>
            </>
          )}
        </>
      )}
    </Stack>
  );
}
