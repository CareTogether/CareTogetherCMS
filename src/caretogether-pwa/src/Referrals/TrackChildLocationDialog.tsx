import { useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControl, FormControlLabel, FormLabel, Grid, IconButton, InputLabel, MenuItem, Radio, RadioGroup, Select, Tab, Tabs, TextField } from '@mui/material';
import { CombinedFamilyInfo, Arrangement, Person, ChildLocationPlan, ChildInvolvement, Note, ChildLocationHistoryEntry } from '../GeneratedClient';
import { DateTimePicker } from '@mui/x-date-pickers';

import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  TimelineOppositeContent,
  TimelineSeparator,
} from '@mui/lab';

import DeleteIcon from '@mui/icons-material/Delete'
import { useBackdrop } from '../Hooks/useBackdrop';
import { useDirectoryModel, useFamilyLookup, usePersonLookup } from '../Model/DirectoryModel';
import { useReferralsModel } from '../Model/ReferralsModel';
import { FamilyName } from '../Families/FamilyName';
import { PersonName } from '../Families/PersonName';
import { useRecoilValue } from 'recoil';
import { policyData } from '../Model/ConfigurationModel';
import { format } from 'date-fns';
import { a11yProps, TabPanel } from "../TabPanel";

interface ChildLocationTimelineProps {
  partneringFamily: CombinedFamilyInfo,
  referralId: string
  arrangement: Arrangement
}
function ChildLocationTimeline({ partneringFamily, referralId, arrangement }: ChildLocationTimelineProps) {
  const familyLookup = useFamilyLookup();
  const referralsModel = useReferralsModel();
  const withBackdrop = useBackdrop();
  
  async function deleteChildLocationEntry(historyEntry: ChildLocationHistoryEntry) {
    await withBackdrop(async () => {
      await referralsModel.deleteChildLocationEntry(partneringFamily.family?.id as string, referralId, arrangement.id!,
        historyEntry.childLocationFamilyId!, historyEntry.childLocationReceivingAdultId!, historyEntry.timestampUtc!, null);
    });
  }

  return (
    <Timeline position="right">
      {arrangement.childLocationHistory?.slice().reverse().map((historyEntry, i) => <TimelineItem key={i}>
        <TimelineOppositeContent>
          {format(historyEntry.timestampUtc!, "M/d/yy h:mm a")}
          <IconButton
            onClick={() => deleteChildLocationEntry(historyEntry)}
            size="small"
            color="primary">
            <DeleteIcon />
          </IconButton>
        </TimelineOppositeContent>
        <TimelineSeparator>
          <TimelineDot color={i === 0 ? "primary" : "grey"} />
          <TimelineConnector />
        </TimelineSeparator>
        <TimelineContent>
          <FamilyName family={familyLookup(historyEntry.childLocationFamilyId)} />
          <br />
          <span style={{ fontStyle: "italic" }}>
            {historyEntry.plan === ChildLocationPlan.DaytimeChildCare ? "daytime child care"
              : historyEntry.plan === ChildLocationPlan.OvernightHousing ? "overnight housing"
                : "with parent"}
          </span>
        </TimelineContent>
      </TimelineItem>
      )}
    </Timeline>
  );
}

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

  const [tabValue, setTabValue] = useState(0);
  const [selectedAssigneeKey, setSelectedAssigneeKey] = useState('');
  const [changeAtLocal, setChangeAtLocal] = useState(null as Date | null);
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
  const deduplicatedCandidateVolunteerAssignees = allCandidateVolunteerAssignees.filter((candidateItem, i) =>
    allCandidateVolunteerAssignees.filter((x, j) => x.key === candidateItem.key && j < i).length === 0);
  
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

  function canSave() {
    if (tabValue === 0) {
      return selectedAssigneeKey !== '' &&
        plan != null &&
        notes !== "" &&
        changeAtLocal != null;
    } else {
      return selectedAssigneeKey !== '' &&
        plan != null &&
        changeAtLocal != null;
    }
  }
  
  async function onSave() {
    if (tabValue === 0) {
      return trackChildLocation();
    } else {
      return planChildLocationChange();
    }
  }

  async function trackChildLocation() {
    await withBackdrop(async () => {
      if (selectedAssigneeKey === '') {
        alert("No family was selected. Please try again.");
      } else if (plan == null) {
        alert("No plan was selected. Please try again.");
      } else if (notes === "") {
        alert("You must enter a note for this child location change.");
      } else if (changeAtLocal == null) {
        alert("No date was entered. Please try again.");
      } else {
        const assigneeInfo = candidatePartneringFamilyAssignees.concat(deduplicatedCandidateVolunteerAssignees).find(ca => ca.key === selectedAssigneeKey);
        let note: Note | undefined = undefined;
        if (notes !== "")
          note = (await directoryModel.createDraftNote(partneringFamily.family?.id as string, notes)).note;
        await referralsModel.trackChildLocation(partneringFamily.family?.id as string, referralId, arrangement.id!,
          assigneeInfo!.familyId, assigneeInfo!.personId, changeAtLocal, plan, note?.id || null);
        //TODO: Error handling (start with a basic error dialog w/ request to share a screenshot, and App Insights logging)
        onClose();
      }
    });
  }

  async function planChildLocationChange() {
    await withBackdrop(async () => {
      if (selectedAssigneeKey === '') {
        alert("No family was selected. Please try again.");
      } else if (plan == null) {
        alert("No plan was selected. Please try again.");
      } else if (changeAtLocal == null) {
        alert("No date was entered. Please try again.");
      } else {
        const assigneeInfo = candidatePartneringFamilyAssignees.concat(deduplicatedCandidateVolunteerAssignees).find(ca => ca.key === selectedAssigneeKey);
        await referralsModel.planChildLocation(partneringFamily.family?.id as string, referralId, arrangement.id!,
          assigneeInfo!.familyId, assigneeInfo!.personId, changeAtLocal, plan);
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
            <ChildLocationTimeline partneringFamily={partneringFamily} referralId={referralId} arrangement={arrangement} />
          </Grid>
          <Grid item container spacing={2} xs={12} md={6}>
            <Grid item xs={12}>
              <Tabs value={tabValue}
                onChange={(_, newValue) => setTabValue(newValue)}
                indicatorColor="secondary"
                variant="fullWidth">
                <Tab label="Record a Location Change" {...a11yProps(0)} />
                <Tab label="Plan a Future Change" {...a11yProps(1)} />
              </Tabs>
            </Grid>
            <Grid item xs={12}>
              <TabPanel value={tabValue} index={0}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
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
                          {deduplicatedCandidateVolunteerAssignees.map(candidate =>
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
                      value={changeAtLocal}
                      disableFuture inputFormat="M/d/yyyy h:mma"
                      onChange={(date: any) => date && setChangeAtLocal(date)}
                      renderInput={(params: any) => <TextField fullWidth required {...params} />} />
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
              </TabPanel>
              <TabPanel value={tabValue} index={1}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl required fullWidth size="small">
                      <InputLabel id="assignee-label">Planned Receiving Adult</InputLabel>
                      <Select
                        labelId="assignee-label" id="assignee"
                        value={selectedAssigneeKey}
                        onChange={e => updateAssignee(e.target.value as string)}>
                          <MenuItem key="placeholder" value="" disabled>
                            Select the adult who will receive the child
                          </MenuItem>
                          {candidatePartneringFamilyAssignees.map(candidate =>
                            <MenuItem key={candidate.key} value={candidate.key}>{candidate.displayName}</MenuItem>)}
                          <Divider />
                          {deduplicatedCandidateVolunteerAssignees.map(candidate =>
                            <MenuItem key={candidate.key} value={candidate.key}>{candidate.displayName}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl component="fieldset" required>
                      <FormLabel component="legend">Plan for the future location change:</FormLabel>
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
                      label="What time will this person receive the child?"
                      value={changeAtLocal}
                      disableFuture inputFormat="M/d/yyyy h:mma"
                      onChange={(date: any) => date && setChangeAtLocal(date)}
                      renderInput={(params: any) => <TextField fullWidth required {...params} />} />
                  </Grid>
                </Grid>
              </TabPanel>
            </Grid>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button onClick={onSave} disabled={!canSave()} variant="contained" color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
