import { makeStyles } from '@material-ui/core/styles';
import { Grid, Paper, Table, TableContainer, TableBody, TableCell, TableHead, TableRow, Fab, Button, ButtonGroup, useMediaQuery, useTheme } from '@material-ui/core';
import { useRecoilValue } from 'recoil';
import { volunteerFamiliesData } from '../../Model/VolunteersModel';
import { allApprovalAndOnboardingRequirementsData } from '../../Model/ConfigurationModel';
import React, { useState } from 'react';
import { Link, useHistory, useLocation } from 'react-router-dom';
import AddIcon from '@material-ui/icons/Add';
import { CreateVolunteerFamilyDialog } from './CreateVolunteerFamilyDialog';
import { CombinedFamilyInfo } from '../../GeneratedClient';
import { HeaderContent, HeaderTitle } from '../Header';
import { SearchBar } from '../SearchBar';

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

function familyLastName(family: CombinedFamilyInfo) {
  return family.family!.adults?.filter(adult => family.family!.primaryFamilyContactPersonId === adult.item1?.id)[0]?.item1?.lastName || "";
}

function VolunteerProgress() {
  const classes = useStyles();
  const history = useHistory();

  // The array object returned by Recoil is read-only. We need to copy it before we can do an in-place sort.
  const volunteerFamilies = useRecoilValue(volunteerFamiliesData).map(x => x).sort((a, b) =>
    familyLastName(a) < familyLastName(b) ? -1 : familyLastName(a) > familyLastName(b) ? 1 : 0);
  const allApprovalAndOnboardingRequirements = useRecoilValue(allApprovalAndOnboardingRequirementsData);

  const [filterText, setFilterText] = useState("");
  const filteredVolunteerFamilies = volunteerFamilies.filter(family => filterText.length === 0 ||
    family.family?.adults?.some(adult => `${adult.item1?.firstName} ${adult.item1?.lastName}`.toLowerCase().includes(filterText)) ||
    family.family?.children?.some(child => `${child?.firstName} ${child?.lastName}`.toLowerCase().includes(filterText)));

  function openVolunteerFamily(volunteerFamilyId: string) {
    history.push(`/volunteers/family/${volunteerFamilyId}`);
  }
  const [createVolunteerFamilyDialogOpen, setCreateVolunteerFamilyDialogOpen] = useState(false);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const location = useLocation();
  
  return (
    <Grid container spacing={3}>
      <HeaderContent>
        {!isMobile && <HeaderTitle>Volunteers</HeaderTitle>}
        <ButtonGroup variant="text" color="inherit" aria-label="text inherit button group" style={{flexGrow: 1}}>
          <Button color={location.pathname === "/volunteers/approval" ? 'default' : 'inherit'} component={Link} to={"/volunteers/approval"}>Approvals</Button>
          <Button color={location.pathname === "/volunteers/progress" ? 'default' : 'inherit'} component={Link} to={"/volunteers/progress"}>Progress</Button>
        </ButtonGroup>
        <SearchBar value={filterText} onChange={setFilterText} />
      </HeaderContent>
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
              {filteredVolunteerFamilies.map(volunteerFamily => (
                <React.Fragment key={volunteerFamily.family!.id!}>
                  <TableRow className={classes.familyRow} onClick={() => openVolunteerFamily(volunteerFamily.family!.id!)}>
                    <TableCell key="1" colSpan={2}>{familyLastName(volunteerFamily) + " Family"
                    }</TableCell>
                    {allApprovalAndOnboardingRequirements.map(actionName =>
                      (<TableCell key={actionName}>{
                        volunteerFamily.volunteerFamilyInfo?.completedRequirements?.some(x => x.requirementName === actionName)
                        ? "✅"
                        : volunteerFamily.volunteerFamilyInfo?.missingRequirements?.some(x => x === actionName)
                        ? "❌"
                        : ""}</TableCell>))}
                  </TableRow>
                  {volunteerFamily.family!.adults!.map(adult => adult.item1 && adult.item1.active && (
                    <TableRow key={adult.item1.id}
                      onClick={() => openVolunteerFamily(volunteerFamily.family!.id!)}
                      className={classes.adultRow}>
                      <TableCell>{adult.item1.firstName}</TableCell>
                      <TableCell>{adult.item1.lastName}</TableCell>
                      {allApprovalAndOnboardingRequirements.map(actionName =>
                        (<TableCell key={actionName}>{
                          volunteerFamily.volunteerFamilyInfo?.individualVolunteers![adult.item1!.id!]!.completedRequirements?.some(x => x.requirementName === actionName)
                          ? "✅"
                          : volunteerFamily.volunteerFamilyInfo?.individualVolunteers![adult.item1!.id!]!.missingRequirements?.some(x => x === actionName)
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
