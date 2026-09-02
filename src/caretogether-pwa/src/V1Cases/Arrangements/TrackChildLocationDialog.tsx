import Grid from '../../Generic/GridLegacyCompat';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import {
  CombinedFamilyInfo,
  Arrangement,
  ChildLocationPlan,
  ChildInvolvement,
  ChildLocationHistoryEntry,
} from '../../GeneratedClient';
import {
  AppTimeline,
  AppTimelineConnector,
  AppTimelineContent,
  AppTimelineDot,
  AppTimelineItem,
  AppTimelineOppositeContent,
  AppTimelineSeparator,
} from '../../Generic/AppTimeline';
import {
  Delete as DeleteIcon,
  Event as EventIcon,
  Input as InputIcon,
  PersonPinCircle as PersonPinCircleIcon,
} from '@mui/icons-material';
import { useBackdrop } from '../../Hooks/useBackdrop';
import { usePersonLookup } from '../../Model/DirectoryModel';
import { PersonName } from '../../Families/PersonName';
import { format } from 'date-fns';
import { a11yProps, TabPanel } from '../../Generic/TabPanel';
import { isBackdropClick } from '../../Utilities/handleBackdropClick';
import { ValidateDatePicker } from '../../Generic/Forms/ValidateDatePicker';
import { useChildLocationTimelineViewModel } from './useChildLocationTimelineViewModel';
import { useTrackChildLocationCommands } from './useTrackChildLocationCommands';
import { useTrackChildLocationViewModel } from './useTrackChildLocationViewModel';

interface ChildLocationTimelineProps {
  partneringFamily: CombinedFamilyInfo;
  v1CaseId: string;
  arrangement: Arrangement;
  recordChildLocationPlan: (entry: ChildLocationHistoryEntry) => void;
  presentation?: 'dialog' | 'drawer';
}
export function ChildLocationTimeline({
  partneringFamily,
  v1CaseId,
  arrangement,
  recordChildLocationPlan,
  presentation = 'dialog',
}: ChildLocationTimelineProps) {
  const personLookup = usePersonLookup();
  const withBackdrop = useBackdrop();
  const { timelineItems } = useChildLocationTimelineViewModel({ arrangement });
  const childLocationCommands = useTrackChildLocationCommands({
    arrangementId: arrangement.id!,
    partneringFamilyId: partneringFamily.family?.id as string,
    v1CaseId,
  });

  async function deleteChildLocationEntry(
    historyEntry: ChildLocationHistoryEntry
  ) {
    await withBackdrop(async () => {
      await childLocationCommands.deleteChildLocationEntry(historyEntry);
    });
  }

  async function deleteChildLocationPlan(planEntry: ChildLocationHistoryEntry) {
    await withBackdrop(async () => {
      await childLocationCommands.deleteChildLocationPlan(planEntry);
    });
  }

  const drawerPresentation = presentation === 'drawer';

  return (
    <AppTimeline
      position="right"
      sx={drawerPresentation ? { m: 0, p: 0 } : undefined}
    >
      {timelineItems.map(
        (
          {
            entry,
            isCurrentLocation,
            isHistoryEntry,
            isNextPlannedChangePastDue,
            isPast,
            planDescription,
          },
          i
        ) => (
          <AppTimelineItem
            key={i}
            sx={drawerPresentation ? { minHeight: 72 } : undefined}
          >
            <AppTimelineOppositeContent
              sx={
                drawerPresentation
                  ? { flex: 0.42, pr: 1.25, py: 1, textAlign: 'right' }
                  : undefined
              }
            >
              <Typography
                component="span"
                variant={drawerPresentation ? 'caption' : 'body2'}
                sx={{
                  fontWeight: isCurrentLocation ? 'bold' : 'normal',
                }}
              >
                {format(entry.timestampUtc!, 'M/d/yy h:mm a')}
              </Typography>
              {!isHistoryEntry && (
                <IconButton
                  onClick={() => recordChildLocationPlan(entry)}
                  size="small"
                  color="primary"
                >
                  <InputIcon />
                </IconButton>
              )}
              <IconButton
                onClick={() =>
                  isHistoryEntry
                    ? deleteChildLocationEntry(entry)
                    : deleteChildLocationPlan(entry)
                }
                size="small"
                color="primary"
              >
                <DeleteIcon />
              </IconButton>
            </AppTimelineOppositeContent>
            <AppTimelineSeparator>
              <AppTimelineDot
                color={
                  isCurrentLocation
                    ? 'primary'
                    : isHistoryEntry
                      ? 'info'
                      : isNextPlannedChangePastDue
                        ? 'error'
                        : 'grey'
                }
                variant={isPast ? 'filled' : 'outlined'}
              >
                {isHistoryEntry ? (
                  <PersonPinCircleIcon />
                ) : (
                  <EventIcon fontSize="small" />
                )}
              </AppTimelineDot>
              <AppTimelineConnector
                sx={{ opacity: isHistoryEntry ? 1.0 : 0.5 }}
              />
            </AppTimelineSeparator>
            <AppTimelineContent
              sx={drawerPresentation ? { py: 1 } : undefined}
            >
              <Typography
                component="div"
                variant={drawerPresentation ? 'body2' : 'body1'}
                sx={{
                  fontWeight: isCurrentLocation ? 'bold' : 'normal',
                }}
              >
                <PersonName
                  person={personLookup(
                    entry.childLocationFamilyId,
                    entry.childLocationReceivingAdultId
                  )}
                />
              </Typography>
              <Typography
                color="text.secondary"
                component="div"
                variant="caption"
                sx={{ fontStyle: 'italic' }}
              >
                {planDescription}
              </Typography>
            </AppTimelineContent>
          </AppTimelineItem>
        )
      )}
    </AppTimeline>
  );
}

interface TrackChildLocationDialogProps {
  partneringFamily: CombinedFamilyInfo;
  v1CaseId: string;
  arrangement: Arrangement;
  onClose: () => void;
  initialMode?: 'record' | 'plan';
  initialPlannedEntry?: ChildLocationHistoryEntry;
}

export function TrackChildLocationDialog({
  partneringFamily,
  v1CaseId,
  arrangement,
  onClose,
  initialMode,
  initialPlannedEntry,
}: TrackChildLocationDialogProps) {
  const {
    arrangementHasNotStartedYet,
    arrangementPolicy,
    assigneeIsFromPartneringFamily,
    canSave,
    candidatePartneringFamilyAssignees,
    changeAtLocal,
    child,
    deduplicatedCandidateVolunteerAssignees,
    notes,
    plan,
    recordChildLocationPlan,
    selectedAssignee,
    selectedAssigneeKey,
    setChangeAtLocal,
    setNotes,
    setPlan,
    setTabValue,
    tabValue,
    updateAssignee,
  } = useTrackChildLocationViewModel({
    arrangement,
    initialMode,
    initialPlannedEntry,
    partneringFamily,
  });

  const withBackdrop = useBackdrop();
  const childLocationCommands = useTrackChildLocationCommands({
    arrangementId: arrangement.id!,
    partneringFamilyId: partneringFamily.family?.id as string,
    v1CaseId,
  });

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
        alert('No family was selected. Please try again.');
      } else if (plan == null) {
        alert('No plan was selected. Please try again.');
      } else if (notes === '') {
        alert('You must enter a note for this child location change.');
      } else if (changeAtLocal == null) {
        alert('No date was entered. Please try again.');
      } else {
        await childLocationCommands.trackChildLocation({
          assigneeFamilyId: selectedAssignee!.familyId,
          assigneePersonId: selectedAssignee!.personId,
          changeAtLocal,
          notes,
          plan,
        });
        onClose();
      }
    });
  }

  async function planChildLocationChange() {
    await withBackdrop(async () => {
      if (selectedAssigneeKey === '') {
        alert('No family was selected. Please try again.');
      } else if (plan == null) {
        alert('No plan was selected. Please try again.');
      } else if (changeAtLocal == null) {
        alert('No date was entered. Please try again.');
      } else {
        await childLocationCommands.planChildLocationChange({
          assigneeFamilyId: selectedAssignee!.familyId,
          assigneePersonId: selectedAssignee!.personId,
          changeAtLocal,
          plan,
        });
        onClose();
      }
    });
  }

  return (
    <Dialog
      open={true}
      onClose={(_, reason: string) => (!isBackdropClick(reason) ? onClose : {})}
      fullWidth
      maxWidth="md"
      aria-labelledby="track-child-location-title"
    >
      <DialogTitle id="track-child-location-title">
        Location History for <PersonName person={child} />
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <ChildLocationTimeline
              partneringFamily={partneringFamily}
              v1CaseId={v1CaseId}
              arrangement={arrangement}
              recordChildLocationPlan={recordChildLocationPlan}
            />
          </Grid>
          <Grid item spacing={2} xs={12} md={6}>
            <Stack direction="column">
              <Tabs
                value={tabValue}
                onChange={(_, newValue) => setTabValue(newValue)}
                indicatorColor="secondary"
                variant="fullWidth"
              >
                <Tab
                  label="Record a Location Change"
                  {...a11yProps(0)}
                  disabled={arrangementHasNotStartedYet}
                />
                <Tab label="Plan a Future Change" {...a11yProps(1)} />
              </Tabs>
              <TabPanel value={tabValue} index={0}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl required fullWidth size="small">
                      <InputLabel id="assignee-label">
                        Receiving Adult
                      </InputLabel>
                      <Select
                        labelId="assignee-label"
                        label="Receiving Adult"
                        id="assignee"
                        value={selectedAssigneeKey}
                        onChange={(e) =>
                          updateAssignee(e.target.value as string)
                        }
                      >
                        <MenuItem key="placeholder" value="" disabled>
                          Select the adult who received the child
                        </MenuItem>
                        {candidatePartneringFamilyAssignees.map((candidate) => (
                          <MenuItem key={candidate.key} value={candidate.key}>
                            {candidate.displayName}
                          </MenuItem>
                        ))}
                        <Divider />
                        {deduplicatedCandidateVolunteerAssignees.map(
                          (candidate) => (
                            <MenuItem key={candidate.key} value={candidate.key}>
                              {candidate.displayName}
                            </MenuItem>
                          )
                        )}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl component="fieldset" required>
                      <FormLabel component="legend">
                        Plan for the location change:
                      </FormLabel>
                      <RadioGroup
                        aria-label="plan"
                        name="plan"
                        row
                        value={plan == null ? '' : ChildLocationPlan[plan]}
                        onChange={(e) =>
                          setPlan(
                            ChildLocationPlan[
                              e.target.value as keyof typeof ChildLocationPlan
                            ]
                          )
                        }
                      >
                        <FormControlLabel
                          value={
                            ChildLocationPlan[
                              ChildLocationPlan.DaytimeChildCare
                            ]
                          }
                          control={<Radio size="small" />}
                          label="Daytime Child Care"
                          disabled={assigneeIsFromPartneringFamily}
                        />
                        <FormControlLabel
                          value={
                            ChildLocationPlan[
                              ChildLocationPlan.OvernightHousing
                            ]
                          }
                          control={<Radio size="small" />}
                          label="Overnight Housing"
                          disabled={
                            assigneeIsFromPartneringFamily ||
                            arrangementPolicy?.childInvolvement ===
                              ChildInvolvement.DaytimeChildCareOnly
                          }
                        />
                        <FormControlLabel
                          value={
                            ChildLocationPlan[ChildLocationPlan.WithParent]
                          }
                          control={<Radio size="small" />}
                          label="With Parent"
                          disabled={!assigneeIsFromPartneringFamily}
                        />
                      </RadioGroup>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <ValidateDatePicker
                      label="What time did this person receive the child?"
                      value={changeAtLocal}
                      onChange={(date) => setChangeAtLocal(date)}
                      includeTime
                      disableFuture
                      textFieldProps={{ required: true }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      id="notes"
                      required
                      label="Notes"
                      placeholder="Space for any general notes"
                      multiline
                      fullWidth
                      variant="outlined"
                      minRows={6}
                      size="medium"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </Grid>
                </Grid>
              </TabPanel>
              <TabPanel value={tabValue} index={1}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl required fullWidth size="small">
                      <InputLabel id="assignee-label">
                        Planned Receiving Adult
                      </InputLabel>
                      <Select
                        labelId="assignee-label"
                        label="Planned Receiving Adult"
                        id="assignee"
                        value={selectedAssigneeKey}
                        onChange={(e) =>
                          updateAssignee(e.target.value as string)
                        }
                      >
                        <MenuItem key="placeholder" value="" disabled>
                          Select the adult who will receive the child
                        </MenuItem>
                        {candidatePartneringFamilyAssignees.map((candidate) => (
                          <MenuItem key={candidate.key} value={candidate.key}>
                            {candidate.displayName}
                          </MenuItem>
                        ))}
                        <Divider />
                        {deduplicatedCandidateVolunteerAssignees.map(
                          (candidate) => (
                            <MenuItem key={candidate.key} value={candidate.key}>
                              {candidate.displayName}
                            </MenuItem>
                          )
                        )}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl component="fieldset" required>
                      <FormLabel component="legend">
                        Plan for the future location change:
                      </FormLabel>
                      <RadioGroup
                        aria-label="plan"
                        name="plan"
                        row
                        value={plan == null ? '' : ChildLocationPlan[plan]}
                        onChange={(e) =>
                          setPlan(
                            ChildLocationPlan[
                              e.target.value as keyof typeof ChildLocationPlan
                            ]
                          )
                        }
                      >
                        <FormControlLabel
                          value={
                            ChildLocationPlan[
                              ChildLocationPlan.DaytimeChildCare
                            ]
                          }
                          control={<Radio size="small" />}
                          label="Daytime Child Care"
                          disabled={assigneeIsFromPartneringFamily}
                        />
                        <FormControlLabel
                          value={
                            ChildLocationPlan[
                              ChildLocationPlan.OvernightHousing
                            ]
                          }
                          control={<Radio size="small" />}
                          label="Overnight Housing"
                          disabled={
                            assigneeIsFromPartneringFamily ||
                            arrangementPolicy?.childInvolvement ===
                              ChildInvolvement.DaytimeChildCareOnly
                          }
                        />
                        <FormControlLabel
                          value={
                            ChildLocationPlan[ChildLocationPlan.WithParent]
                          }
                          control={<Radio size="small" />}
                          label="With Parent"
                          disabled={!assigneeIsFromPartneringFamily}
                        />
                      </RadioGroup>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <ValidateDatePicker
                      label="What time will this person receive the child?"
                      value={changeAtLocal}
                      onChange={(date) => setChangeAtLocal(date)}
                      includeTime
                      textFieldProps={{
                        fullWidth: true,
                        required: true,
                      }}
                    />
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
        <Button
          onClick={onSave}
          disabled={!canSave}
          variant="contained"
          color="primary"
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
