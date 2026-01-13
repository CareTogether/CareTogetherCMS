import { Typography } from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { Permission, Age, ExactAge } from '../GeneratedClient';

type Props = {
  age?: Age | null;
  permissions: (permission: Permission) => boolean;
};

function isExactAge(age: Age | null | undefined): age is ExactAge {
  return !!age && (age as ExactAge).dateOfBirth !== undefined;
}

export function DateOfBirth({ age, permissions }: Props) {
  const dateOfBirth = isExactAge(age)
    ? (age as ExactAge).dateOfBirth
    : undefined;

  if (!permissions(Permission.ViewPersonDateOfBirth) || !dateOfBirth)
    return null;

  // `ExactAge.dateOfBirth` is stored as midnight UTC. Formatting with `date-fns`
  // uses the browser's local time zone and can shift the calendar day.
  const formattedDob = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(dateOfBirth));

  return (
    <Typography
      variant="body2"
      sx={{ marginBottom: 1, display: 'flex', alignItems: 'center', gap: 1 }}
    >
      <CalendarTodayIcon fontSize="small" sx={{ color: '#00616F' }} />
      {formattedDob}
    </Typography>
  );
}
