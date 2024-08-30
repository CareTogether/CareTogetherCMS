import FormGroup, { FormGroupProps } from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';

export default function PageVersionSwitch({
  checked,
  onChange,
  label,
  ...props
}: Omit<FormGroupProps, 'onChange'> & {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.checked);
  };

  return (
    <FormGroup {...props}>
      <FormControlLabel
        labelPlacement="start"
        control={<Switch checked={checked} onChange={handleChange} />}
        label={label}
      />
    </FormGroup>
  );
}
