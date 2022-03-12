import { useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, FormControl, FormControlLabel, FormLabel, Grid, InputLabel, MenuItem, Radio, RadioGroup, Select, TextField, Typography } from '@mui/material';
import { CombinedFamilyInfo, Arrangement, Person, ChildLocationPlan, ChildInvolvement } from '../../GeneratedClient';
import { DateTimePicker, Timeline, TimelineConnector, TimelineContent, TimelineDot, TimelineItem, TimelineOppositeContent, TimelineSeparator } from '@mui/lab';
import { useBackdrop } from '../RequestBackdrop';
import { useDirectoryModel, useFamilyLookup, usePersonLookup } from '../../Model/DirectoryModel';
import { useReferralsModel } from '../../Model/ReferralsModel';
import { FamilyName } from '../Families/FamilyName';
import { PersonName } from '../Families/PersonName';
import { useRecoilValue } from 'recoil';
import { policyData } from '../../Model/ConfigurationModel';
import { format } from 'date-fns';

interface TrackChildLocationDialogProps {
  partneringFamily: CombinedFamilyInfo,
  referralId: string,
  arrangement: Arrangement,
  onClose: () => void
}

export function TrackChildLocationDialog({partneringFamily, referralId, arrangement, onClose}: TrackChildLocationDialogProps) {
  const policy = useRecoilValue(policyData);
  const arrangementPolicy = policy.referralPolicy!.arrangementPolicies!.find(x => x.arrangementType === arrangement.arrangementType);

  const familyLookup = useFamilyLookup();
  const personLookup = usePersonLookup();
  
  const child = personLookup(partneringFamily.family!.id, arrangement.partneringFamilyPersonId);

  const lastTrackedLocationFamily = familyLookup(arrangement.childrenLocationHistory?.[arrangement.childrenLocationHistory.length - 1]?.childLocationFamilyId);
  
  const [selectedAssigneeKey, setSelectedAssigneeKey] = useState('');
  const [changedAtLocal, setChangedAtLocal] = useState(new Date());
  const [plan, setPlan] = useState<ChildLocationPlan | null>(null);
  const [notes, setNotes] = useState("");

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
  
  function updateAssignee(assigneeKey: string) {
    setSelectedAssigneeKey(assigneeKey);
    const assigneeIsFromPartneringFamily = candidatePartneringFamilyAssignees.some(ca => ca.key === assigneeKey);
    if (assigneeIsFromPartneringFamily) {
      setPlan(ChildLocationPlan.WithParent);
    } else {
      if (plan === ChildLocationPlan.WithParent) {
        setPlan(arrangementPolicy?.childInvolvement === ChildInvolvement.DaytimeChildCareOnly ? ChildLocationPlan.DaytimeChildCare : null);
      } else if (arrangementPolicy?.childInvolvement === ChildInvolvement.DaytimeChildCareOnly) {
        setPlan(ChildLocationPlan.DaytimeChildCare);
      }
    }
  }
  const assigneeIsFromPartneringFamily = candidatePartneringFamilyAssignees.some(ca => ca.key === selectedAssigneeKey);

  const referralsModel = useReferralsModel();
  const directoryModel = useDirectoryModel();
  
  const withBackdrop = useBackdrop();
  
  async function trackChildLocation() {
    await withBackdrop(async () => {
      if (selectedAssigneeKey === '') {
        alert("No family was selected. Please try again.");
      } else if (plan == null) {
        alert("No plan was selected. Please try again.");
      } else if (notes === "") {
        alert("You must enter a note for this requirement.");
      } else {
        const assigneeInfo = candidatePartneringFamilyAssignees.concat(allCandidateVolunteerAssignees).find(ca => ca.key === selectedAssigneeKey);
        if (notes !== "")
          await directoryModel.createDraftNote(partneringFamily.family?.id as string, notes);
        await referralsModel.trackChildLocation(partneringFamily.family?.id as string, referralId, arrangement.id!,
          assigneeInfo!.familyId, assigneeInfo!.personId, changedAtLocal, plan);
        //TODO: Error handling (start with a basic error dialog w/ request to share a screenshot, and App Insights logging)
        onClose();
      }
    });
  }

  return (
    <Dialog open={true} onClose={onClose} fullWidth maxWidth="md" aria-labelledby="track-child-location-title">
      <DialogTitle id="track-child-location-title">Location History for <PersonName person={child} /></DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Timeline position="right">
              {arrangement.childrenLocationHistory?.slice().reverse().map((historyEntry, i) =>
                <TimelineItem key={i}>
                  <TimelineOppositeContent>
                    {format(historyEntry.timestampUtc!, "M/d/yy h:mm a")}
                  </TimelineOppositeContent>
                  <TimelineSeparator>
                    <TimelineDot color={i == 0 ? "secondary" : "primary"} />
                    <TimelineConnector />
                  </TimelineSeparator>
                  <TimelineContent>
                    <FamilyName family={familyLookup(historyEntry.childLocationFamilyId)} />
                    <br />
                    <span style={{fontStyle: "italic"}}>
                      {historyEntry.plan === ChildLocationPlan.DaytimeChildCare ? "daytime child care"
                      : historyEntry.plan === ChildLocationPlan.OvernightHousing ? "overnight housing"
                      : "with parent"}
                    </span>
                  </TimelineContent>
                </TimelineItem>
              )}
            </Timeline>
          </Grid>
          <Grid item container spacing={2} xs={12} md={6}>
            <Grid item xs={12}>
              <p style={{fontSize: 16, fontWeight: 'bold'}}>Track a new location change</p>
              <FormControl required fullWidth size="small">
                <InputLabel id="assignee-label">Receiving Adult</InputLabel>
                <Select
                  labelId="assignee-label" id="assignee"
                  value={selectedAssigneeKey}
                  onChange={e => updateAssignee(e.target.value as string)}>
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
              <FormControl component="fieldset" required>
                <FormLabel component="legend">Plan for the location change:</FormLabel>
                <RadioGroup aria-label="plan" name="plan" row
                  value={plan == null ? '' : ChildLocationPlan[plan]}
                  onChange={e => setPlan(ChildLocationPlan[e.target.value as keyof typeof ChildLocationPlan])}>
                  <FormControlLabel value={ChildLocationPlan[ChildLocationPlan.DaytimeChildCare]} control={<Radio size="small" />} label="Daytime Child Care"
                    disabled={assigneeIsFromPartneringFamily} />
                  <FormControlLabel value={ChildLocationPlan[ChildLocationPlan.OvernightHousing]} control={<Radio size="small" />} label="Overnight Housing"
                    disabled={assigneeIsFromPartneringFamily || arrangementPolicy?.childInvolvement === ChildInvolvement.DaytimeChildCareOnly} />
                  <FormControlLabel value={ChildLocationPlan[ChildLocationPlan.WithParent]} control={<Radio size="small" />} label="With Parent"
                    disabled={!assigneeIsFromPartneringFamily} />
                </RadioGroup>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <DateTimePicker
                label="What time did this person receive the child?"
                value={changedAtLocal}
                disableFuture inputFormat="MM/dd/yyyy hh:mm a"
                onChange={(date) => date && setChangedAtLocal(date)}
                showTodayButton
                renderInput={(params) => <TextField fullWidth required {...params} />} />
            </Grid>
            <Grid item xs={12}>
              <TextField
                id="notes" required
                label="Notes" placeholder="Space for any general notes"
                multiline fullWidth variant="outlined" minRows={6} size="medium"
                value={notes} onChange={e => setNotes(e.target.value)}
              />
            </Grid>
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
