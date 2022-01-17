import { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, Grid, InputLabel, MenuItem, Select } from '@material-ui/core';
import { ArrangementPolicy, Arrangement, VolunteerFunction, RoleApprovalStatus, Person } from '../../GeneratedClient';
import { visibleFamiliesData } from '../../Model/ModelLoader';
import { useRecoilValue } from 'recoil';
import { useParams } from 'react-router-dom';
import { useBackdrop } from '../RequestBackdrop';
import { useReferralsModel } from '../../Model/ReferralsModel';

const useStyles = makeStyles((theme) => ({
  form: {
    '& .MuiFormControl-root': {
    }
  },
  ageYears: {
    width: '20ch'
  }
}));

interface AssignVolunteerFunctionDialogProps {
  referralId: string,
  arrangement: Arrangement,
  arrangementPolicy: ArrangementPolicy,
  volunteerFunction: VolunteerFunction
  onClose: () => void
}

export function AssignVolunteerFunctionDialog({referralId, arrangement, arrangementPolicy, volunteerFunction, onClose}: AssignVolunteerFunctionDialogProps) {
  const classes = useStyles();
  
  const familyIdMaybe = useParams<{ familyId: string }>();
  const familyId = familyIdMaybe.familyId as string;
  
  const visibleFamilies = useRecoilValue(visibleFamiliesData);

  const candidateIndividualAssignees = volunteerFunction.eligibleIndividualVolunteerRoles
    ? visibleFamilies.flatMap(f => f.volunteerFamilyInfo?.individualVolunteers
      ? Object.entries(f.volunteerFamilyInfo?.individualVolunteers).filter(([volunteerId, _]) =>
        f.family!.adults!.find(a => a.item1!.id === volunteerId)!.item1!.active).flatMap(([volunteerId, volunteerInfo]) => volunteerInfo.individualRoleApprovals
        ? Object.entries(volunteerInfo.individualRoleApprovals).flatMap(([roleName, roleVersionApproval]) =>
          volunteerFunction.eligibleIndividualVolunteerRoles!.find(x => x === roleName) &&
          roleVersionApproval.find(rva => rva.approvalStatus === RoleApprovalStatus.Approved || rva.approvalStatus === RoleApprovalStatus.Onboarded) &&
          !arrangement.individualVolunteerAssignments?.find(iva =>
            iva.arrangementFunction === volunteerFunction.arrangementFunction && iva.familyId === f.family!.id && iva.personId === volunteerId)
          ? [{ family: f.family!, person: f.family!.adults!.find(a => a.item1!.id === volunteerId)!.item1 || null }]
          : [])
        : [])
      : [])
    : [];
  const candidateFamilyAssignees = volunteerFunction.eligibleVolunteerFamilyRoles
    ? visibleFamilies.flatMap(f => f.volunteerFamilyInfo?.familyRoleApprovals
      ? Object.entries(f.volunteerFamilyInfo.familyRoleApprovals).flatMap(([roleName, roleVersionApproval]) =>
        volunteerFunction.eligibleVolunteerFamilyRoles!.find(x => x === roleName) &&
        roleVersionApproval.find(rva => rva.approvalStatus === RoleApprovalStatus.Approved || rva.approvalStatus === RoleApprovalStatus.Onboarded) &&
        !arrangement.familyVolunteerAssignments?.find(fva =>
          fva.arrangementFunction === volunteerFunction.arrangementFunction && fva.familyId === f.family!.id)
        ? [{ family: f.family!, person: null as Person | null }]
        : [])
      : [])
    : [];
  const allCandidateAssignees = candidateFamilyAssignees.concat(candidateIndividualAssignees);
  const deduplicatedCandidateAssignees = allCandidateAssignees.filter((item, i) => allCandidateAssignees.indexOf(item) === i);
  const candidateAssignees = deduplicatedCandidateAssignees.map(candidate => {
    if (candidate.person == null) {
      return {
        familyId: candidate.family.id!,
        personId: null as string | null,
        key: candidate.family.id!,
        displayName: `${candidate.family.adults!.find(adult => candidate.family.primaryFamilyContactPersonId === adult.item1?.id)?.item1!.lastName} Family`
      };
    } else {
      return {
        familyId: candidate.family.id!,
        personId: candidate.person.id! as string | null,
        key: `${candidate.family.id!}|${candidate.person.id || ''}`,
        displayName: `${candidate.person.firstName} ${candidate.person.lastName}`
      };
    }
  });
  
  const [fields, setFields] = useState({
    assigneeKey: ''
  });
  const { assigneeKey } = fields;
  
  const referralsModel = useReferralsModel();
  
  const withBackdrop = useBackdrop();

  async function save() {
    await withBackdrop(async () => {
      const assigneeInfo = candidateAssignees.find(ca => ca.key === assigneeKey);
      if (assigneeInfo?.personId == null) {
        await referralsModel.assignVolunteerFamily(familyId, referralId, arrangement.id!,
          assigneeInfo!.familyId, volunteerFunction.arrangementFunction!);
      } else {
        await referralsModel.assignIndividualVolunteer(familyId, referralId, arrangement.id!,
          assigneeInfo!.familyId, assigneeInfo!.personId, volunteerFunction.arrangementFunction!);
      }
      //TODO: Error handling (start with a basic error dialog w/ request to share a screenshot, and App Insights logging)
      onClose();
    });
  }

  return (
    <Dialog open={true} onClose={onClose} scroll='body' aria-labelledby="assign-volunteer-title">
      <DialogTitle id="assign-volunteer-title">
        Assign {volunteerFunction.arrangementFunction}
      </DialogTitle>
      <DialogContent>
        <form className={classes.form} noValidate autoComplete="off">
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl required fullWidth size="small">
                <InputLabel id="assignee-label">Assignee</InputLabel>
                <Select
                  labelId="assignee-label" id="assignee"
                  value={assigneeKey}
                  onChange={e => setFields({...fields, assigneeKey: e.target.value as string})}>
                    <MenuItem key="placeholder" value="" disabled>
                      Select a family or individual to assign
                    </MenuItem>
                    {candidateAssignees.map(candidate =>
                      <MenuItem key={candidate.key} value={candidate.key}>{candidate.displayName}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button onClick={save} variant="contained" color="primary"
          disabled={assigneeKey?.length === 0}>
          Assign
        </Button>
      </DialogActions>
    </Dialog>
  );
}
