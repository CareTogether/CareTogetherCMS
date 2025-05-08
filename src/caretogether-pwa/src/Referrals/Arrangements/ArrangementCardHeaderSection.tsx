import { Typography } from '@mui/material';
import { PersonName } from '../../Families/PersonName';
import { Arrangement } from '../../GeneratedClient';
import { CombinedFamilyInfo } from '../../GeneratedClient';
import { usePersonLookup } from '../../Model/DirectoryModel';
import { ChildLocationIndicator } from './ChildLocationIndicator';
import { ArrangementPolicy, ChildInvolvement } from '../../GeneratedClient';
import { ArrangementPlannedDuration } from './ArrangementPlannedDuration';

interface ArrangementCardHeaderSectionProps {
  partneringFamily: CombinedFamilyInfo;
  referralId: string;
  arrangement: Arrangement;
  summaryOnly?: boolean;
  arrangementPolicy?: ArrangementPolicy;
  cancelButton?: React.ReactNode;
  startButton?: React.ReactNode;
  endButton?: React.ReactNode;
  startedAtLabel?: React.ReactNode;
  endedAtLabel?: React.ReactNode;
}

export function ArrangementCardHeaderSection({
  partneringFamily,
  referralId,
  arrangement,
  summaryOnly,
  arrangementPolicy,
  cancelButton,
  startButton,
  endButton,
  startedAtLabel,
  endedAtLabel,
}: ArrangementCardHeaderSectionProps) {
  const personLookup = usePersonLookup();

  return (
    <>
      <Typography variant="body2" component="div" sx={{ mb: 1 }}>
        <strong>
          <PersonName
            person={personLookup(
              partneringFamily.family!.id,
              arrangement.partneringFamilyPersonId
            )}
          />
        </strong>
        {(arrangementPolicy?.childInvolvement ===
          ChildInvolvement.ChildHousing ||
          arrangementPolicy?.childInvolvement ===
            ChildInvolvement.DaytimeChildCareOnly) && (
          <ChildLocationIndicator
            partneringFamily={partneringFamily}
            referralId={referralId}
            arrangement={arrangement}
            arrangementPolicy={arrangementPolicy}
            summaryOnly={summaryOnly}
          />
        )}
      </Typography>

      <ArrangementPlannedDuration
        partneringFamily={partneringFamily}
        referralId={referralId}
        arrangement={arrangement}
        summaryOnly={summaryOnly}
        cancelButton={cancelButton}
        startButton={startButton}
        endButton={endButton}
        startedAtLabel={startedAtLabel}
        endedAtLabel={endedAtLabel}
      />
    </>
  );
}
