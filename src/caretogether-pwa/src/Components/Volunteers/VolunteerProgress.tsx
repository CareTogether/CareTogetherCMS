import { Grid, Table, TableContainer, TableBody, TableCell, TableHead, TableRow, Fab, Button, ButtonGroup, useMediaQuery, useTheme, FormControlLabel, Switch } from '@mui/material';
import { useRecoilValue } from 'recoil';
import { volunteerFamiliesData } from '../../Model/VolunteersModel';
import { allApprovalAndOnboardingRequirementsData } from '../../Model/ConfigurationModel';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import { CreateVolunteerFamilyDialog } from './CreateVolunteerFamilyDialog';
import { HeaderContent, HeaderTitle } from '../Header';
import { SearchBar } from '../SearchBar';
import { useLocalStorage } from '../../useLocalStorage';
import { useScrollMemory } from '../../useScrollMemory';
import { filterFamiliesByText, familyLastName, sortFamiliesByLastNameDesc } from '../Families/FamilyUtils';
import { usePermissions } from '../../Model/SessionModel';
import { Permission } from '../../GeneratedClient';

function VolunteerProgress(props: { onOpen: () => void }) {
  const { onOpen } = props;
  useEffect(onOpen);

  const navigate = useNavigate();

  // The array object returned by Recoil is read-only. We need to copy it before we can do an in-place sort.
  const volunteerFamilies = sortFamiliesByLastNameDesc(useRecoilValue(volunteerFamiliesData));
  const allApprovalAndOnboardingRequirements = useRecoilValue(allApprovalAndOnboardingRequirementsData);

  const [filterText, setFilterText] = useState("");
  const filteredVolunteerFamilies = filterFamiliesByText(volunteerFamilies, filterText);

  useScrollMemory();

  function openVolunteerFamily(volunteerFamilyId: string) {
    navigate(`/volunteers/family/${volunteerFamilyId}`);
  }
  const [createVolunteerFamilyDialogOpen, setCreateVolunteerFamilyDialogOpen] = useState(false);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  
  const [expandedView, setExpandedView] = useLocalStorage('volunteer-progress-expanded', true);

  const permissions = usePermissions();

  return (
    <Grid container spacing={3}>
      <HeaderContent>
        {!isMobile && <HeaderTitle>Volunteers</HeaderTitle>}
        <ButtonGroup variant="text" color="inherit" aria-label="text inherit button group" style={{flexGrow: 1}}>
          <Button color={location.pathname === "/volunteers/approval" ? 'secondary' : 'inherit'} component={Link} to={"/volunteers/approval"}>Approvals</Button>
          <Button color={location.pathname === "/volunteers/progress" ? 'secondary' : 'inherit'} component={Link} to={"/volunteers/progress"}>Progress</Button>
        </ButtonGroup>
        <FormControlLabel
          control={<Switch checked={expandedView} onChange={(e) => setExpandedView(e.target.checked)} name="expandedView" />}
          label={isMobile ? "" : "Expand"}
        />
        <SearchBar value={filterText} onChange={setFilterText} />
      </HeaderContent>
      <Grid item xs={12}>
        <TableContainer>
          <Table sx={{minWidth: '700px'}} size="small">
            <TableHead>
              <TableRow>
                {expandedView
                ? <>
                    <TableCell>First Name</TableCell>
                    <TableCell>Last Name</TableCell>
                  </>
                : <TableCell>Family</TableCell>}
                {allApprovalAndOnboardingRequirements.map(actionName =>
                  (<TableCell key={actionName}>{actionName}</TableCell>))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredVolunteerFamilies.map(volunteerFamily => (
                <React.Fragment key={volunteerFamily.family!.id!}>
                  <TableRow sx={{backgroundColor: '#eef'}} onClick={() => openVolunteerFamily(volunteerFamily.family!.id!)}>
                    <TableCell key="1" colSpan={expandedView ? 2 : 1}>{familyLastName(volunteerFamily) + " Family"
                    }</TableCell>
                    {allApprovalAndOnboardingRequirements.map(actionName =>
                      (<TableCell key={actionName}>{
                        expandedView
                        ? (volunteerFamily.volunteerFamilyInfo?.missingRequirements?.some(x => x === actionName)
                          ? "❌"
                          : volunteerFamily.volunteerFamilyInfo?.completedRequirements?.some(x => x.requirementName === actionName)
                          ? "✅"
                          : "")
                        : (
                          (volunteerFamily.volunteerFamilyInfo?.missingRequirements?.some(x => x === actionName) ||
                            (volunteerFamily.volunteerFamilyInfo?.individualVolunteers &&
                            Object.entries(volunteerFamily.volunteerFamilyInfo?.individualVolunteers).map(y => y[1]).some(y =>
                              y.missingRequirements?.some(x => x === actionName))))
                          ? "❌"
                          : (volunteerFamily.volunteerFamilyInfo?.completedRequirements?.some(x => x.requirementName === actionName) ||
                              (volunteerFamily.volunteerFamilyInfo?.individualVolunteers &&
                              Object.entries(volunteerFamily.volunteerFamilyInfo?.individualVolunteers).map(y => y[1]).some(y =>
                                y.completedRequirements?.some(x => x.requirementName === actionName))))
                          ? "✅"
                          : "")
                        }</TableCell>))}
                  </TableRow>
                  {expandedView && volunteerFamily.family!.adults!.map(adult => adult.item1 && adult.item1.active && (
                    <TableRow key={adult.item1.id}
                      onClick={() => openVolunteerFamily(volunteerFamily.family!.id!)}>
                      <TableCell>{adult.item1.firstName}</TableCell>
                      <TableCell>{adult.item1.lastName}</TableCell>
                      {allApprovalAndOnboardingRequirements.map(actionName =>
                        (<TableCell key={actionName}>{
                          volunteerFamily.volunteerFamilyInfo?.individualVolunteers![adult.item1!.id!]!.missingRequirements?.some(x => x === actionName)
                          ? "❌"
                          : volunteerFamily.volunteerFamilyInfo?.individualVolunteers![adult.item1!.id!]!.completedRequirements?.some(x => x.requirementName === actionName)
                          ? "✅"
                          : ""}</TableCell>))}
                    </TableRow>
                  ))}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {permissions(Permission.EditFamilyInfo) && <Fab color="primary" aria-label="add"
          sx={{position: 'fixed', right: '30px', bottom: '70px'}}
          onClick={() => setCreateVolunteerFamilyDialogOpen(true)}>
          <AddIcon />
        </Fab>}
        {createVolunteerFamilyDialogOpen && <CreateVolunteerFamilyDialog onClose={(volunteerFamilyId) => {
          setCreateVolunteerFamilyDialogOpen(false);
          volunteerFamilyId && openVolunteerFamily(volunteerFamilyId);
        }} />}
      </Grid>
    </Grid>
  );
}

export { VolunteerProgress };
