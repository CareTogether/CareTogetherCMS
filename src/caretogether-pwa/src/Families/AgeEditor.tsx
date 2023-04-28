import { Grid, TextField } from '@mui/material';
import { useDirectoryModel } from '../Model/DirectoryModel';
import { useInlineEditor } from '../Hooks/useInlineEditor';
import { PersonEditorProps } from "./PersonEditorProps";
import { AgeInYears, ExactAge } from '../GeneratedClient';
import { AgeText } from '../AgeText';
import { format } from 'date-fns';
import { DatePicker } from '@mui/x-date-pickers';

export function AgeEditor({ familyId, person }: PersonEditorProps) {
  const directoryModel = useDirectoryModel();

  const dateOfBirth = person.age instanceof ExactAge ? person.age.dateOfBirth : null;
  const ageInYears = person.age instanceof AgeInYears ? person.age.years : null;
  const ageAsOf = person.age instanceof AgeInYears ? person.age.asOf : null;

  const editor = useInlineEditor(async value => {
    const age = new ExactAge();
    age.dateOfBirth = value!;
    await directoryModel.updatePersonAge(familyId!, person.id!, age);
  }, dateOfBirth, value => value != null);

  return (
    <Grid container spacing={2}>
      {editor.editing
        ? <>
            <Grid item xs={12}>
              Saved age: <AgeText age={person.age} />
              {person.age
                ? person.age instanceof ExactAge
                  ? ` (date of birth: ${format(dateOfBirth!, " (M/d/yyyy)")}`
                  : ` (${ageInYears} as of ${format(ageAsOf!, "M/d/yy")})`
                : ``}
            </Grid>
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Date of birth"
                value={editor.value} openTo="year"
                format="MM/dd/yyyy"
                onChange={(date: any) => date && editor.setValue(date)}
                renderInput={(params: any) => <TextField size="small" required {...params} />} />
            </Grid>
            <Grid item xs={6}>
              {editor.cancelButton}
              {editor.saveButton}
            </Grid>
          </>
        : <Grid item xs={12}>
            Age: <AgeText age={person.age} />
            {person.age
              ? person.age instanceof ExactAge
                ? ` (date of birth: ${format(dateOfBirth!, " (M/d/yyyy)")}`
                : ` (${ageInYears} as of ${format(ageAsOf!, "M/d/yy")})`
              : ``}
            {editor.editButton}
        </Grid>}
    </Grid>
  );
}
