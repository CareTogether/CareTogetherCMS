import { DatePicker } from '@mui/x-date-pickers';
import { useInlineEditor } from '../../Hooks/useInlineEditor';
import { formatRelative } from 'date-fns';

interface DateDisplayEditorRelativeProps {
  initialValue: Date;
  label: string;
  onChange: (value: Date) => void;
}

export function DateDisplayEditorRelative({
  initialValue,
  label,
  onChange,
}: DateDisplayEditorRelativeProps) {
  const now = new Date();

  const editor = useInlineEditor<Date, void>(async (value) => {
    await onChange(value);
  }, initialValue);

  return editor.editing ? (
    <>
      <DatePicker
        label={`${label} at`}
        value={editor.value}
        onChange={(value) => value && editor.setValue(value)}
        slotProps={{ textField: { size: 'small', margin: 'none' } }}
      />
      {editor.cancelButton}
      {editor.saveButton}
    </>
  ) : (
    <>
      {editor.value ? `${label} ${formatRelative(editor.value, now)}` : '-'}
      {editor.editButton}
    </>
  );
}
