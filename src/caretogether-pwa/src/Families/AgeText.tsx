import {
  differenceInYears,
  intervalToDuration,
  formatDuration,
} from 'date-fns';
import { Age, AgeInYears, ExactAge } from '../GeneratedClient';

interface AgeTextProps {
  age?: Age;
}

export function AgeText({ age }: AgeTextProps) {
  if (!age) return <span className="age">⚠</span>;

  if (age instanceof ExactAge && age.dateOfBirth) {
    const dob = new Date(age.dateOfBirth);
    const duration = intervalToDuration({ start: dob, end: new Date() });

    const years = duration.years ?? 0;
    const months = duration.months ?? 0;

    if (years < 5) {
      const formatted = formatDuration(
        { years, months },
        { format: ['years', 'months'], zero: false }
      );
      return <span className="age">{formatted || '0 months'}</span>;
    }

    return <span className="age">{years}</span>;
  }

  if (age instanceof AgeInYears && age.years && age.asOf) {
    const years = age.years + differenceInYears(new Date(), age.asOf);
    return <span className="age">{years}</span>;
  }

  return <span className="age">⚠</span>;
}
