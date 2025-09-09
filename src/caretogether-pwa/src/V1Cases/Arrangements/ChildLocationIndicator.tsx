import { useState } from 'react';
import { Typography, Button } from '@mui/material';
import PersonPinCircleIcon from '@mui/icons-material/PersonPinCircle';
import EventIcon from '@mui/icons-material/Event';
import {
  CombinedFamilyInfo,
  Arrangement,
  ArrangementPolicy,
} from '../../GeneratedClient';
import { useFamilyLookup } from '../../Model/DirectoryModel';
import { TrackChildLocationDialog } from './TrackChildLocationDialog';
import { FamilyName } from '../../Families/FamilyName';
import { format } from 'date-fns';

interface ChildLocationIndicatorProps {
  partneringFamily: CombinedFamilyInfo;
  v1CaseId: string;
  arrangement: Arrangement;
  arrangementPolicy: ArrangementPolicy;
  summaryOnly?: boolean;
}

export function ChildLocationIndicator({
  partneringFamily,
  v1CaseId,
  arrangement,
  summaryOnly,
}: ChildLocationIndicatorProps) {
  const familyLookup = useFamilyLookup();
  const [showTrackChildLocationDialog, setShowTrackChildLocationDialog] =
    useState(false);

  const currentLocation =
    arrangement.childLocationHistory &&
    arrangement.childLocationHistory.length > 0
      ? arrangement.childLocationHistory[
          arrangement.childLocationHistory.length - 1
        ]
      : null;

  // The planned location that is of interest is always the next one after the stay with the current family.
  // This means that, whether the current location change happened before, on, or after the corresponding planned change,
  // the next planned location to display will always be whatever other family the child is set to go to next.
  // The only times when this would not return a result would be when there are no further plans (result is null),
  // or when the only remaining planned change is already past-due. In that case, we need to instead find the
  // most recently missed planned change.

  const nextPlannedLocation =
    arrangement.childLocationPlan && arrangement.childLocationPlan.length > 0
      ? arrangement.childLocationPlan.find(
          (entry) =>
            currentLocation == null ||
            (entry.timestampUtc! > currentLocation.timestampUtc! &&
              entry.childLocationFamilyId !==
                currentLocation.childLocationFamilyId)
        ) ||
        arrangement.childLocationPlan
          .slice()
          .reverse()
          .find(
            (entry) =>
              entry.childLocationFamilyId !==
              currentLocation?.childLocationFamilyId
          ) ||
        null
      : null;

  const nextPlanIsPastDue =
    nextPlannedLocation && nextPlannedLocation.timestampUtc! < new Date();

  return (
    <>
      {summaryOnly ? (
        <>
          <PersonPinCircleIcon
            color="disabled"
            style={{ float: 'right', marginLeft: 2, marginTop: 2 }}
          />
          <span style={{ float: 'right', paddingTop: 4 }}>
            {currentLocation ? (
              <FamilyName
                family={familyLookup(currentLocation.childLocationFamilyId)}
              />
            ) : (
              <strong>Location unspecified</strong>
            )}
          </span>
        </>
      ) : (
        <>
          <Button
            size="large"
            variant="text"
            style={{
              float: 'right',
              marginTop: -10,
              marginRight: -10,
              textTransform: 'initial',
            }}
            endIcon={<PersonPinCircleIcon />}
            onClick={() => setShowTrackChildLocationDialog(true)}
          >
            {currentLocation ? (
              <FamilyName
                family={familyLookup(currentLocation.childLocationFamilyId)}
              />
            ) : (
              <strong>Location unspecified</strong>
            )}
          </Button>
          {showTrackChildLocationDialog && (
            <TrackChildLocationDialog
              partneringFamily={partneringFamily}
              v1CaseId={v1CaseId}
              arrangement={arrangement}
              onClose={() => setShowTrackChildLocationDialog(false)}
            />
          )}
        </>
      )}
      <Typography
        variant={summaryOnly ? 'body2' : 'body1'}
        style={{ float: 'right', clear: 'right' }}
      >
        {nextPlannedLocation == null ? (
          <span>No upcoming plans</span>
        ) : (
          <span
            style={
              nextPlanIsPastDue ? { fontWeight: 'bold', color: 'red' } : {}
            }
          >
            {nextPlanIsPastDue && 'PAST DUE - '}
            <FamilyName
              family={familyLookup(nextPlannedLocation.childLocationFamilyId)}
            />
            &nbsp;on {format(nextPlannedLocation.timestampUtc!, 'M/d/yyyy')}
          </span>
        )}
        <EventIcon
          sx={{
            position: 'relative',
            top: 7,
            marginTop: summaryOnly ? -0.5 : -1,
            marginRight: summaryOnly ? 0 : -0.5,
            marginLeft: summaryOnly ? 0.25 : 1,
            color: nextPlanIsPastDue ? 'red' : summaryOnly ? '#00000042' : null,
          }}
        />
      </Typography>
    </>
  );
}
