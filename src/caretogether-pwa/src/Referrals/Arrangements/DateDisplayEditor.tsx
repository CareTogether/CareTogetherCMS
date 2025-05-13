import { DatePicker } from '@mui/x-date-pickers';
import { useInlineEditor } from '../../Hooks/useInlineEditor';
import { format } from 'date-fns';

interface DateDisplayEditorProps {
  initialValue: Date | undefined;
  label: string;
  canEdit: boolean;
  onChange: (value: Date) => void;
}

export function DateDisplayEditor({
  initialValue,
  label,
  canEdit,
  onChange,
}: DateDisplayEditorProps) {
  const editor = useInlineEditor<Date, void>(async (value) => {
    await onChange(value);
  }, initialValue);

  return (
    <>
      {label}:&nbsp;
      {editor.editing ? (
        <>
          <DatePicker
            label={label}
            value={editor.value}
            onChange={(value) => value && editor.setValue(value)}
            slotProps={{ textField: { size: 'small', margin: 'none' } }}
          />
          {editor.cancelButton}
          {editor.saveButton}
        </>
      ) : (
        <>
          {editor.value ? format(editor.value, 'M/d/yyyy') : '-'}
          {canEdit && editor.editButton}
        </>
      )}
    </>
  );
}
