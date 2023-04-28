import { useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControl, FormControlLabel, FormLabel, Grid, IconButton, InputLabel, MenuItem, Radio, RadioGroup, Select, Stack, Tab, Tabs, TextField } from '@mui/material';
import { CombinedFamilyInfo, Arrangement, Person, ChildLocationPlan, ChildInvolvement, ChildLocationHistoryEntry } from '../../GeneratedClient';
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

import PersonPinCircleIcon from '@mui/icons-material/PersonPinCircle';
import EventIcon from '@mui/icons-material/Event';
import DeleteIcon from '@mui/icons-material/Delete'
import InputIcon from '@mui/icons-material/Input';
import { useBackdrop } from '../../Hooks/useBackdrop';
import { useDirectoryModel, useFamilyLookup, usePersonLookup } from '../../Model/DirectoryModel';
import { useReferralsModel } from '../../Model/ReferralsModel';
import { PersonName } from '../../Families/PersonName';
import { useRecoilValue } from 'recoil';
import { policyData } from '../../Model/ConfigurationModel';
import { format } from 'date-fns';
import { a11yProps, TabPanel } from '../../TabPanel';

interface ChildLocationTimelineProps {
  partneringFamily: CombinedFamilyInfo,
  referralId: string
  arrangement: Arrangement
  recordChildLocationPlan: (entry: ChildLocationHistoryEntry) => void
}
function ChildLocationTimeline({ partneringFamily, referralId, arrangement, recordChildLocationPlan }: ChildLocationTimelineProps) {
  const personLookup = usePersonLookup();
  const referralsModel = useReferralsModel();
  const withBackdrop = useBackdrop();
  
  async function deleteChildLocationEntry(historyEntry: ChildLocationHistoryEntry) {
    await withBackdrop(async () => {
      await referralsModel.deleteChildLocationEntry(partneringFamily.family?.id as string, referralId, arrangement.id!,
        historyEntry.childLocationFamilyId!, historyEntry.childLocationReceivingAdultId!, historyEntry.timestampUtc!, null);
    });
  }
  
  async function deleteChildLocationPlan(planEntry: ChildLocationHistoryEntry) {
    await withBackdrop(async () => {
      await referralsModel.deleteChildLocationPlan(partneringFamily.family?.id as string, referralId, arrangement.id!,
        planEntry.childLocationFamilyId!, planEntry.childLocationReceivingAdultId!, planEntry.timestampUtc!);
    });
  }

  // Planned entries will have null noteId values; actual history entries will have non-null noteId values.
  const allEntries = (arrangement.childLocationHistory || []).concat(arrangement.childLocationPlan || []).sort((a, b) =>
    a.timestampUtc! < b.timestampUtc! ? 1 : a.timestampUtc! > b.timestampUtc! ? -1 : 0);
  
  const currentLocationEntryIndex = allEntries.findIndex(entry => entry.noteId);
  const currentLocationEntry = allEntries[currentLocationEntryIndex];
  const nextPlannedChange = allEntries.slice(0, currentLocationEntryIndex).reverse().find(entry =>
    !entry.noteId && entry.childLocationFamilyId !== currentLocationEntry.childLocationFamilyId);
  
  const now = new Date();
  
  return (
    <Timeline position="right">
      {allEntries.map((entry, i) =>
        <TimelineItem key={i}>
          <TimelineOppositeContent>
            <span style={{ fontWeight: entry === currentLocationEntry ? 'bold' : 'normal' }}>
              {format(entry.timestampUtc!, "M/d/yy h:mm a")}
            </span>
            {!entry.noteId &&
              <IconButton
                onClick={() => recordChildLocationPlan(entry)}
                size="small"
                color="primary">
                <InputIcon />
              </IconButton>
            }
            <IconButton
              onClick={() => entry.noteId ? deleteChildLocationEntry(entry) : deleteChildLocationPlan(entry)}
              size="small"
              color="primary">
              <DeleteIcon />
            </IconButton>
          </TimelineOppositeContent>
          <TimelineSeparator>
            <TimelineDot color={entry === currentLocationEntry ? "primary" : entry.noteId ? "info" : entry === nextPlannedChange && entry.timestampUtc! < now ? "error" : "grey"}
              variant={entry.timestampUtc! < now ? 'filled' : 'outlined'}>
              {entry.noteId
                ? <PersonPinCircleIcon />
                : <EventIcon fontSize='small' />}
            </TimelineDot>
            <TimelineConnector sx={{ opacity: entry.noteId ? 1.0 : 0.5 }} />
          </TimelineSeparator>
          <TimelineContent>
            <span style={{ fontWeight: entry === currentLocationEntry ? 'bold' : 'normal' }}>
              <PersonName person={personLookup(entry.childLocationFamilyId, entry.childLocationReceivingAdultId)} />
            </span>
            <br />
            <span style={{ fontStyle: "italic", color: 'grey' }}>
              {entry.plan === ChildLocationPlan.DaytimeChildCare ? "daytime child care"
                : entry.plan === ChildLocationPlan.OvernightHousing ? "overnight housing"
                  : "with parent"}
            </span>
          </TimelineContent>
        </TimelineItem>)}
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

  function recordChildLocationPlan(entry: ChildLocationHistoryEntry) {
    setTabValue(0);
    setSelectedAssigneeKey(`${entry.childLocationFamilyId!}|${entry.childLocationReceivingAdultId!}`);
    setChangeAtLocal(entry.timestampUtc!);
    setPlan(entry.plan!);
  }

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
        let noteId: string | undefined = undefined;
        if (notes !== "") {
          noteId = crypto.randomUUID();
          await directoryModel.createDraftNote(partneringFamily.family?.id as string, noteId, notes, changeAtLocal);
        }
        await referralsModel.trackChildLocation(partneringFamily.family?.id as string, referralId, arrangement.id!,
          assigneeInfo!.familyId, assigneeInfo!.personId, changeAtLocal, plan, noteId || null);
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
            <ChildLocationTimeline partneringFamily={partneringFamily} referralId={referralId} arrangement={arrangement}
              recordChildLocationPlan={recordChildLocationPlan} />
          </Grid>
          <Grid item spacing={2} xs={12} md={6}>
            <Stack direction='column'>
              <Tabs value={tabValue}
                onChange={(_, newValue) => setTabValue(newValue)}
                indicatorColor="secondary"
                variant="fullWidth">
                <Tab label="Record a Location Change" {...a11yProps(0)} />
                <Tab label="Plan a Future Change" {...a11yProps(1)} />
              </Tabs>
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
                      disableFuture format="M/d/yyyy h:mma"
                      onChange={(date: any) => date && setChangeAtLocal(date)}
                      slotProps={{ textField: { fullWidth: true, required: true }}} />
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
                      format="M/d/yyyy h:mma"
                      onChange={(date: any) => date && setChangeAtLocal(date)}
                      slotProps={{ textField: { fullWidth: true, required: true}}} />
                  </Grid>
                </Grid>
              </TabPanel>
            </Stack>
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
