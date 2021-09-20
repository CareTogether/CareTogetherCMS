import { differenceInYears } from "date-fns";
import { Age, AgeInYears, ExactAge } from "../GeneratedClient";

interface AgeTextProps {
  age?: Age
}

export function AgeText({age}: AgeTextProps) {
  return (
    <span className="age">{
      age && age instanceof ExactAge
        ? age.dateOfBirth && differenceInYears(new Date(), age.dateOfBirth)
        : age instanceof AgeInYears
        ? age.years && age.asOf && (age.years + differenceInYears(new Date(), age.asOf))
        : "⚠"
    }</span>
  );
}
