import { useState } from 'react';
import { Autocomplete, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormControlLabel, FormLabel, Grid, Radio, RadioGroup, TextField } from '@mui/material';
import { ArrangementPolicy, Arrangement, ArrangementFunction, RoleApprovalStatus, Person, Family, ValueTupleOfPersonAndFamilyAdultRelationshipInfo } from '../../GeneratedClient';
import { useRecoilValue } from 'recoil';
import { useParams } from 'react-router-dom';
import { useBackdrop } from '../../Hooks/useBackdrop';
import { DialogHandle } from '../../Hooks/useDialogHandle';
import { useReferralsModel } from '../../Model/ReferralsModel';
import { usePersonAndFamilyLookup } from '../../Model/DirectoryModel';
import { visibleFamiliesQuery } from '../../Model/Data';
import { isBackdropClick } from '../../Utilities/handleBackdropClick';

interface AssignArrangementFunctionDialogProps {
  handle: DialogHandle
  referralId: string
  arrangement: Arrangement
  arrangementPolicy: ArrangementPolicy
  arrangementFunction: ArrangementFunction
}

interface AssigneeOptionType {
  label: string;
  id: string;
  candidateType: string;
}

export function AssignArrangementFunctionDialog({
  handle, referralId, arrangement, arrangementFunction
}: AssignArrangementFunctionDialogProps) {
  const familyIdMaybe = useParams<{ familyId: string }>();
  const familyId = familyIdMaybe.familyId as string;

  const visibleFamilies = useRecoilValue(visibleFamiliesQuery);

  const familyAndPersonLookup = usePersonAndFamilyLookup();

  const candidateNamedPeopleAssignees = arrangementFunction.eligiblePeople
    ? arrangementFunction.eligiblePeople.map(personId =>
      familyAndPersonLookup(personId) as { family: Family, person: Person | null }).filter(person =>
        !arrangement.individualVolunteerAssignments?.find(iva =>
          iva.arrangementFunction === arrangementFunction.functionName && iva.familyId === person.family!.id && iva.personId === person.person?.id))
    : [];
  const candidateVolunteerIndividualAssignees = arrangementFunction.eligibleIndividualVolunteerRoles
    ? visibleFamilies.flatMap(f => f.volunteerFamilyInfo?.individualVolunteers
      ? Object.entries(f.volunteerFamilyInfo?.individualVolunteers).filter(([volunteerId,]) =>
        f.family!.adults!.find(a => a.item1!.id === volunteerId)!.item1!.active).flatMap(([volunteerId, volunteerInfo]) => volunteerInfo.approvalStatusByRole
          ? Object.entries(volunteerInfo.approvalStatusByRole).flatMap(([roleName, roleApprovalStatus]) =>
            arrangementFunction.eligibleIndividualVolunteerRoles!.find(x => x === roleName) &&
              (roleApprovalStatus.currentStatus === RoleApprovalStatus.Approved || roleApprovalStatus.currentStatus === RoleApprovalStatus.Onboarded) &&
              !arrangement.individualVolunteerAssignments?.find(iva =>
                iva.arrangementFunction === arrangementFunction.functionName && iva.familyId === f.family!.id && iva.personId === volunteerId)
              ? [{ family: f.family!, person: f.family!.adults!.find(a => a.item1!.id === volunteerId)!.item1 || null }]
              : [])
          : [])
      : [])
    : [];
  const candidateVolunteerFamilyAssignees = arrangementFunction.eligibleVolunteerFamilyRoles
    ? visibleFamilies.flatMap(f => f.volunteerFamilyInfo?.familyRoleApprovals
      ? Object.entries(f.volunteerFamilyInfo.familyRoleApprovals).flatMap(([roleName, roleApprovalStatus]) =>
        arrangementFunction.eligibleVolunteerFamilyRoles!.find(x => x === roleName) &&
          (roleApprovalStatus.currentStatus === RoleApprovalStatus.Approved || roleApprovalStatus.currentStatus === RoleApprovalStatus.Onboarded) &&
          !arrangement.familyVolunteerAssignments?.find(fva =>
            fva.arrangementFunction === arrangementFunction.functionName && fva.familyId === f.family!.id)
          ? [{ family: f.family!, person: null as Person | null }]
          : [])
      : [])
    : [];
  const allCandidateAssignees = candidateNamedPeopleAssignees.concat(candidateVolunteerFamilyAssignees).concat(candidateVolunteerIndividualAssignees);
  const deduplicatedCandidateAssignees = allCandidateAssignees.filter((item, i) =>
    allCandidateAssignees.indexOf(item) === i).sort((a, b) => {
      const aPrimaryContact = a.family!.adults!.find(adult =>
        a.family.primaryFamilyContactPersonId === adult.item1!.id)!.item1!;
      const bPrimaryContact = b.family!.adults!.find(adult =>
        b.family.primaryFamilyContactPersonId === adult.item1!.id)!.item1!;

      const aFirst = a.person ? a.person.firstName! : null;
      const aLast = a.person ? a.person.lastName! : aPrimaryContact.lastName!;
      const bFirst = b.person ? b.person.firstName! : null;
      const bLast = b.person ? b.person.lastName! : bPrimaryContact.lastName!;

      // Sort by last name, then by first name (if applicable)
      return aLast < bLast ? -1 : aLast > bLast ? 1 :
        aFirst == null || bFirst == null ? 0 : aFirst < bFirst ? -1 : aFirst > bFirst ? 1 : 0;
    });
  const candidateAssignees = deduplicatedCandidateAssignees.map(candidate => {
    if (candidate.person == null) {
      return {
        familyId: candidate.family.id!,
        personId: null as string | null,
        key: candidate.family.id!,
        displayName: getFamilyName(candidate.family.adults!.find(adult => candidate.family.primaryFamilyContactPersonId === adult.item1?.id))
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
    assigneeKey: '',
    variant: null as string | null
  });
  const { assigneeKey } = fields;

  const referralsModel = useReferralsModel();

  const withBackdrop = useBackdrop();

  function getFamilyName(person: ValueTupleOfPersonAndFamilyAdultRelationshipInfo | undefined) {
    return `${person!.item1!.firstName} ${person!.item1!.lastName} Family`
  }

  async function save() {
    await withBackdrop(async () => {
      handle.closeDialog(); // This is placed here so values are not recalculated unnecessarily (which otherwise results in errors).
      const assigneeInfo = candidateAssignees.find(ca => ca.key === assigneeKey);
      if (assigneeInfo?.personId == null) {
        await referralsModel.assignVolunteerFamily(familyId, referralId, arrangement.id!,
          assigneeInfo!.familyId, arrangementFunction.functionName!, fields.variant || undefined);
      } else {
        await referralsModel.assignIndividualVolunteer(familyId, referralId, arrangement.id!,
          assigneeInfo!.familyId, assigneeInfo!.personId, arrangementFunction.functionName!, fields.variant || undefined);
      }
      //TODO: Error handling (start with a basic error dialog w/ request to share a screenshot, and App Insights logging)
    });
  }

  return (
    <Dialog maxWidth={"xs"} fullWidth={true} open={handle.open} onClose={(event: object | undefined, reason: string) => isBackdropClick(reason) ? handle.closeDialog : ({})} key={handle.key}
      aria-labelledby="assign-volunteer-title" sx={{'& .MuiDialog-paperFullWidth': {overflowY: 'visible'}}} >
      <DialogTitle id="assign-volunteer-title" sx={{paddingBottom:"20px"}}>
        Assign {arrangementFunction.functionName}
      </DialogTitle>
      <DialogContent sx={{ '& .MuiDialogContent-root': { overflowY: 'visible' } }}>
        <form noValidate autoComplete="off">
          <Grid container spacing={2}>
            {arrangementFunction.variants && arrangementFunction.variants.length > 0 &&
              <Grid item xs={12}>
                <FormControl required>
                  <FormLabel id="variant">Variant</FormLabel>
                  <RadioGroup
                    aria-labelledby="variant"
                    value={fields.variant}
                    onChange={(event) => setFields({ ...fields, variant: (event.target as HTMLInputElement).value })}
                  >
                    {arrangementFunction.variants.map(variant =>
                      <FormControlLabel key={variant.variantName} value={variant.variantName}
                        control={<Radio />} label={variant.variantName!} />)}
                  </RadioGroup>
                </FormControl>
              </Grid>}
            <Grid item xs={12}>
              <FormControl required fullWidth size="small" sx={{ marginTop: 1 }}>
                <Autocomplete
                  id="assignee"
                  clearOnEscape
                  onChange={(_event, newValue: AssigneeOptionType | null) => {
                    setFields({ ...fields, assigneeKey: newValue?.id as string })
                  }}
                  options={candidateAssignees.map(candidate => {
                    return {
                      label: candidate.displayName,
                      id: candidate.key,
                      candidateType: candidate.personId ? 'Individuals' : 'Families',
                    }
                  }).sort((a, b) => -b.candidateType.localeCompare(a.candidateType))}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  groupBy={(option) => option.candidateType}
                  sx={{ width: 400 }}
                  renderInput={(params) => <TextField required {...params} label="Select a family or individual to assign" />}
                />
              </FormControl>
            </Grid>
          </Grid>
        </form>
      </DialogContent>
      <DialogActions sx={{ paddingRight: "20px", paddingBottom: "20px" }}>
        <Button onClick={handle.closeDialog} color="secondary">
          Cancel
        </Button>
        <Button onClick={save} variant="contained" color="primary"
          disabled={assigneeKey?.length === 0 ||
            (arrangementFunction.variants && arrangementFunction.variants.length > 0 && fields.variant == null)}>
          Assign
        </Button>
      </DialogActions>
    </Dialog>
  );
}
