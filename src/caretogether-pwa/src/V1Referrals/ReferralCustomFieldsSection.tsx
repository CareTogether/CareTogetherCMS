import { Grid, Typography } from '@mui/material';
import { Controller, Control, FieldValues, Path } from 'react-hook-form';
import { CustomField } from '../GeneratedClient';
import { CustomFieldInput } from '../Generic/CustomFieldInput';

type Props<T extends FieldValues> = {
  customFields: CustomField[];
  control: Control<T>;
  namePrefix: Path<T>;
};

export function ReferralCustomFieldsSection<T extends FieldValues>({
  customFields,
  control,
  namePrefix,
}: Props<T>) {
  if (!customFields.length) return null;

  return (
    <Grid item xs={12}>
      <Typography sx={{ fontWeight: 600, mb: 1 }}>
        Referral Custom Fields
      </Typography>

      <Grid container spacing={2}>
        {customFields.map((field) => {
          const fieldName = `${namePrefix}.${field.name}` as Path<T>;

          return (
            <Grid item xs={12} key={field.name}>
              <Typography
                variant="body2"
                sx={{ mb: 0.5 }}
                className="ph-unmask"
              >
                {field.name}
              </Typography>

              <Controller
                name={fieldName}
                control={control}
                render={({ field: rhfField }) => (
                  <CustomFieldInput
                    customFieldPolicy={field}
                    value={rhfField.value}
                    onChange={rhfField.onChange}
                  />
                )}
              />
            </Grid>
          );
        })}
      </Grid>
    </Grid>
  );
}
