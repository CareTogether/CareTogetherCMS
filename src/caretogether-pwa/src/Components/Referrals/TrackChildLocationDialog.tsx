import { useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, FormControl, Grid, InputLabel, MenuItem, Select } from '@material-ui/core';
import { CombinedFamilyInfo, Arrangement, Person, ChildLocationPlan } from '../../GeneratedClient';
import { KeyboardDateTimePicker } from '@material-ui/pickers';
import { useRecoilValue } from 'recoil';
import { useBackdrop } from '../RequestBackdrop';
import { useFamilyLookup, usePersonLookup } from '../../Model/DirectoryModel';
import { useReferralsModel } from '../../Model/ReferralsModel';
import { policyData } from '../../Model/ConfigurationModel';
import { FamilyName } from '../Families/FamilyName';
import { PersonName } from '../Families/PersonName';

interface TrackChildLocationDialogProps {
  partneringFamily: CombinedFamilyInfo,
  referralId: string,
  arrangement: Arrangement,
  onClose: () => void
}

export function TrackChildLocationDialog({partneringFamily, referralId, arrangement, onClose}: TrackChildLocationDialogProps) {
  const policy = useRecoilValue(policyData);
  const arrangementPolicy = policy.referralPolicy!.arrangementPolicies!.find(x => x.arrangementType === arrangement.arrangementType);
  console.log(arrangementPolicy?.childInvolvement);
  
  const familyLookup = useFamilyLookup();
  const personLookup = usePersonLookup();
  
  const child = personLookup(partneringFamily.family!.id, arrangement.partneringFamilyPersonId);

  const lastTrackedLocationFamily = familyLookup(arrangement.childrenLocationHistory?.[arrangement.childrenLocationHistory.length - 1]?.childLocationFamilyId);
  
  const [selectedAssigneeKey, setSelectedAssigneeKey] = useState('');
  const [changedAtLocal, setChangedAtLocal] = useState(new Date());

  function candidateItem(candidate: {familyId: string, adult: Person}) {
    return {
      familyId: candidate.familyId,
      personId: candidate.adult.id!,
      key: `${candidate.familyId}|${candidate.adult.id!}`,
      displayName: `${candidate.adult.firstName} ${candidate.adult.lastName}`
    };
  }
  
  const candidatePartneringFamilyAssignees = (partneringFamily.family?.adults?.map(adultInfo => ({ familyId: partneringFamily.family!.id!, adult: adultInfo.item1! })) || [])
    .map(candidateItem);
  const candidateFamilyAssignees = arrangement.familyVolunteerAssignments?.flatMap(familyAssignment =>
    familyLookup(familyAssignment.familyId)?.family?.adults?.map(adultInfo => ({ familyId: familyAssignment.familyId!, adult: adultInfo.item1! })) || []) || [];
  const candidateIndividualAssignees = arrangement.individualVolunteerAssignments?.map(individualAssignment =>
    ({ familyId: individualAssignment.familyId!, adult: personLookup(individualAssignment.familyId, individualAssignment.personId)! })) || [];
  const allCandidateVolunteerAssignees = candidateFamilyAssignees.concat(candidateIndividualAssignees)
    .map(candidateItem);

  const referralsModel = useReferralsModel();
  
  const withBackdrop = useBackdrop();
  
  async function trackChildLocation() {
    await withBackdrop(async () => {
      if (selectedAssigneeKey === '') {
        alert("No family was selected. Please try again.");
      } else {
        const assigneeInfo = candidatePartneringFamilyAssignees.concat(allCandidateVolunteerAssignees).find(ca => ca.key === selectedAssigneeKey);
        const childLocationPlan = ChildLocationPlan.DaytimeChildCare; //TODO!!
        const additionalExplanation = ''; //TODO:!!
        await referralsModel.trackChildLocation(partneringFamily.family?.id as string, referralId, arrangement.id!,
          assigneeInfo!.familyId, assigneeInfo!.personId, changedAtLocal, childLocationPlan,
          additionalExplanation);
        //TODO: Error handling (start with a basic error dialog w/ request to share a screenshot, and App Insights logging)
        onClose();
      }
    });
  }

  return (
    <Dialog open={true} onClose={onClose} aria-labelledby="track-child-location-title">
      <DialogTitle id="track-child-location-title">Track Location Change for <PersonName person={child} /></DialogTitle>
      <DialogContent>
        {lastTrackedLocationFamily &&
          <>
            <DialogContentText>The last recorded location for this child is: <FamilyName family={lastTrackedLocationFamily} /></DialogContentText>
            <br />
          </>}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormControl required fullWidth size="small">
              <InputLabel id="assignee-label">Receiving Adult</InputLabel>
              <Select
                labelId="assignee-label" id="assignee"
                value={selectedAssigneeKey}
                onChange={e => setSelectedAssigneeKey(e.target.value as string)}>
                  <MenuItem key="placeholder" value="" disabled>
                    Select the adult who received the child
                  </MenuItem>
                  {candidatePartneringFamilyAssignees.map(candidate =>
                    <MenuItem key={candidate.key} value={candidate.key}>{candidate.displayName}</MenuItem>)}
                  <Divider />
                  {allCandidateVolunteerAssignees.map(candidate =>
                    <MenuItem key={candidate.key} value={candidate.key}>{candidate.displayName}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <KeyboardDateTimePicker
              label="What time did this person receive the child?"
              value={changedAtLocal} fullWidth required
              disableFuture format="MM/dd/yyyy hh:mm a"
              onChange={(date) => date && setChangedAtLocal(date)}
              showTodayButton />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button onClick={trackChildLocation} variant="contained" color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
