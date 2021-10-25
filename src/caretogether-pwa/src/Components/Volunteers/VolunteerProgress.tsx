import { makeStyles } from '@material-ui/core/styles';
import { Grid, Paper, Table, TableContainer, TableBody, TableCell, TableHead, TableRow, Fab } from '@material-ui/core';
import { useRecoilValue } from 'recoil';
import { volunteerFamiliesData } from '../../Model/VolunteersModel';
import { allApprovalAndOnboardingRequirementsData } from '../../Model/ConfigurationModel';
import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import AddIcon from '@material-ui/icons/Add';
import { CreateVolunteerFamilyDialog } from './CreateVolunteerFamilyDialog';
import { VolunteerFamily } from '../../GeneratedClient';

const useStyles = makeStyles((theme) => ({
  paper: {
    padding: theme.spacing(2),
    display: 'flex',
    overflow: 'auto',
    flexDirection: 'column',
  },
  fixedHeight: {
    height: 240,
  },
  table: {
    minWidth: 700,
  },
  familyRow: {
    backgroundColor: '#eef'
  },
  adultRow: {
  },
  childRow: {
    color: 'ddd',
    fontStyle: 'italic'
  },
  fabAdd: {
    position: 'fixed',
    right: '30px',
    bottom: '70px'
  }
}));

function familyLastName(family: VolunteerFamily) {
  return family.family!.adults?.filter(adult => family.family!.primaryFamilyContactPersonId === adult.item1?.id)[0]?.item1?.lastName || "";
}

function VolunteerProgress() {
  const classes = useStyles();
  const history = useHistory();

  // The array object returned by Recoil is read-only. We need to copy it before we can do an in-place sort.
  const volunteerFamilies = useRecoilValue(volunteerFamiliesData).map(x => x).sort((a, b) =>
    familyLastName(a) < familyLastName(b) ? -1 : familyLastName(a) > familyLastName(b) ? 1 : 0);
  const allApprovalAndOnboardingRequirements = useRecoilValue(allApprovalAndOnboardingRequirementsData);

  function openVolunteerFamily(volunteerFamilyId: string) {
    history.push(`/volunteers/family/${volunteerFamilyId}`);
  }
  const [createVolunteerFamilyDialogOpen, setCreateVolunteerFamilyDialogOpen] = useState(false);
  
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <TableContainer component={Paper}>
          <Table className={classes.table} size="small">
            <TableHead>
              <TableRow>
                <TableCell>First Name</TableCell>
                <TableCell>Last Name</TableCell>
                {allApprovalAndOnboardingRequirements.map(actionName =>
                  (<TableCell key={actionName}>{actionName}</TableCell>))}
              </TableRow>
            </TableHead>
            <TableBody>
              {volunteerFamilies.map(volunteerFamily => (
                <React.Fragment key={volunteerFamily.family!.id!}>
                  <TableRow className={classes.familyRow} onClick={() => openVolunteerFamily(volunteerFamily.family!.id!)}>
                    <TableCell key="1" colSpan={2}>{familyLastName(volunteerFamily) + " Family"
                    }</TableCell>
                    {allApprovalAndOnboardingRequirements.map(actionName =>
                      (<TableCell key={actionName}>{
                        volunteerFamily.completedRequirements?.some(x => x.requirementName === actionName)
                        ? "✅"
                        : volunteerFamily.missingRequirements?.some(x => x === actionName)
                        ? "❌"
                        : ""}</TableCell>))}
                  </TableRow>
                  {volunteerFamily.family!.adults!.map(adult => adult.item1 && (
                    <TableRow key={adult.item1.id}
                      onClick={() => openVolunteerFamily(volunteerFamily.family!.id!)}
                      className={classes.adultRow}>
                      <TableCell>{adult.item1.firstName}</TableCell>
                      <TableCell>{adult.item1.lastName}</TableCell>
                      {allApprovalAndOnboardingRequirements.map(actionName =>
                        (<TableCell key={actionName}>{
                          volunteerFamily.individualVolunteers![adult.item1!.id!]!.completedRequirements?.some(x => x.requirementName === actionName)
                          ? "✅"
                          : volunteerFamily.individualVolunteers![adult.item1!.id!]!.missingRequirements?.some(x => x === actionName)
                          ? "❌"
                          : ""}</TableCell>))}
                    </TableRow>
                  ))}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Fab color="primary" aria-label="add" className={classes.fabAdd}
          onClick={() => setCreateVolunteerFamilyDialogOpen(true)}>
          <AddIcon />
        </Fab>
        {createVolunteerFamilyDialogOpen && <CreateVolunteerFamilyDialog onClose={(volunteerFamilyId) => {
          setCreateVolunteerFamilyDialogOpen(false);
          volunteerFamilyId && history.push(`/volunteers/family/${volunteerFamilyId}`);
        }} />}
      </Grid>
    </Grid>
  );
}

export { VolunteerProgress };
