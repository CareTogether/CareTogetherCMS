import makeStyles from '@mui/styles/makeStyles';
import { Grid, Table, TableContainer, TableBody, TableCell, TableHead, TableRow, Fab, useMediaQuery, useTheme, Button, ButtonGroup, FormControlLabel, Switch, MenuItem, Select, ListItemText, Checkbox, FormControl, InputBase, SelectChangeEvent, IconButton, Snackbar } from '@mui/material';
import { Gender, ExactAge, AgeInYears, RoleVersionApproval, CombinedFamilyInfo, RemovedRole, RoleRemovalReason, EmailAddress } from '../../GeneratedClient';
import { differenceInYears } from 'date-fns';
import { atom, selector, useRecoilState, useRecoilValue } from 'recoil';
import { volunteerFamiliesData } from '../../Model/VolunteersModel';
import { organizationConfigurationData, policyData } from '../../Model/ConfigurationModel';
import { RoleApprovalStatus } from '../../GeneratedClient';
import React, { useEffect, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import SmsIcon from '@mui/icons-material/Sms';
import EmailIcon from '@mui/icons-material/Email';
import FilterListIcon from '@mui/icons-material/FilterList';
import { CreateVolunteerFamilyDialog } from './CreateVolunteerFamilyDialog';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { HeaderContent, HeaderTitle } from '../Header';
import { SearchBar } from '../SearchBar';
import { useLocalStorage } from '../../useLocalStorage';
import { useScrollMemory } from '../../useScrollMemory';
import { currentLocationState } from '../../Model/SessionModel';
import { BulkSmsSideSheet } from './BulkSmsSideSheet';
import { useWindowSize } from '../../useWindowSize';

type RoleFilter = {
  roleName: string
  selected: (RoleApprovalStatus|null)[]
}

const volunteerFamilyRoleFiltersState = atom({
  key: 'volunteerFamilyRoleFiltersState',
  default: selector({
    key: 'volunteerFamilyRoleFiltersState/Default',
    get: ({get}) => {
      const policy = get(policyData);
      const roleFilters =
        ((policy.volunteerPolicy?.volunteerFamilyRoles &&
          Object.entries(policy.volunteerPolicy?.volunteerFamilyRoles)) || []).map(([key]) => ({
        roleName: key,
        selected: [RoleApprovalStatus.Prospective, RoleApprovalStatus.Approved, RoleApprovalStatus.Onboarded, null]
      }));
      return roleFilters;
    }
  })
});

const volunteerRoleFiltersState = atom({
  key: 'volunteerRoleFiltersState',
  default: selector({
    key: 'volunteerRoleFiltersState/Default',
    get: ({get}) => {
      const policy = get(policyData);
      const roleFilters =
        ((policy.volunteerPolicy?.volunteerRoles &&
          Object.entries(policy.volunteerPolicy?.volunteerRoles)) || []).map(([key]) => ({
        roleName: key,
        selected: [RoleApprovalStatus.Prospective, RoleApprovalStatus.Approved, RoleApprovalStatus.Onboarded, null]
      }));
      return roleFilters;
    }
  })
});

type RoleHeaderCellProps = {
  roleFilter: RoleFilter
  setSelected: (selected: string | string[]) => void
}

function RoleHeaderCell({roleFilter, setSelected}: RoleHeaderCellProps) {
  const choices = [
    { key: "Not Applied", value: null },
    { key: RoleApprovalStatus[RoleApprovalStatus.Prospective], value: RoleApprovalStatus.Prospective },
    { key: RoleApprovalStatus[RoleApprovalStatus.Approved], value: RoleApprovalStatus.Approved },
    { key: RoleApprovalStatus[RoleApprovalStatus.Onboarded], value: RoleApprovalStatus.Onboarded }
  ];

  const handleChange = (event: SelectChangeEvent<string[]>) => {
    setSelected(event.target.value);
  };

  return (
    <TableCell sx={{position: 'relative'}}>
      {roleFilter.roleName}
      <FormControl sx={{position: 'absolute', right: 0}} size="small">
        <Select
          sx={{color: roleFilter.selected.length === choices.length ? '#bdbdbd' : null,
            '& .MuiSelect-iconOpen': { transform: 'none' }}}
          multiple value={roleFilter.selected.map(x => x === null ? "Not Applied" : RoleApprovalStatus[x])}
          variant="standard" label="Filters"
          onChange={handleChange}
          input={<InputBase />}
          IconComponent={FilterListIcon}
          renderValue={(selected) => selected.length === choices.length ? 'all' : `${selected.length} of ${choices.length}`}
        >
          {choices.map(choice =>
            <MenuItem key={choice.key} value={choice.key}>
              <Checkbox checked={roleFilter.selected.indexOf(choice.value) > -1} />
              <ListItemText primary={choice.key} />
            </MenuItem>
          )}
        </Select>
      </FormControl>
    </TableCell>
  );
}

const useStyles = makeStyles((theme) => ({
  table: {
    minWidth: 700,
  },
  familyRow: {
    backgroundColor: '#eef',
    height: '39px'
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

interface CombinedApprovalStatusProps {
  summary: {Prospective:number,Approved:number,Onboarded:number}
}
function CombinedApprovalStatus(props: CombinedApprovalStatusProps) {
  const { summary } = props;
  const outputs = [];
  summary.Onboarded && outputs.push(`${summary.Onboarded} onboarded`);
  summary.Approved && outputs.push(`${summary.Approved} approved`);
  summary.Prospective && outputs.push(`${summary.Prospective} prospective`);
  return (
    <span>{outputs.join(", ")}</span>
  );
}

function approvalStatus(roleVersionApprovals: RoleVersionApproval[] | undefined, roleRemoval: RemovedRole | undefined) {
  return typeof roleRemoval !== 'undefined'
    ? RoleRemovalReason[roleRemoval.reason!]
    : !roleVersionApprovals
    ? "-"
    : roleVersionApprovals.some(x => x.approvalStatus === RoleApprovalStatus.Onboarded)
    ? "Onboarded"
    : roleVersionApprovals.some(x => x.approvalStatus === RoleApprovalStatus.Approved)
    ? "Approved"
    : roleVersionApprovals.some(x => x.approvalStatus === RoleApprovalStatus.Prospective)
    ? "Prospective"
    : "-";
}

function familyLastName(family: CombinedFamilyInfo) {
  return family.family!.adults?.filter(adult =>
    family.family!.primaryFamilyContactPersonId === adult.item1?.id)[0]?.item1?.lastName || "";
}

function simplify(input: string) {
  // Strip out common punctuation elements and excessive whitespace, and convert to lowercase
  return input
    .replace(/[.,/#!$%^&*;:{}=\-_`'"'‘’‚‛“”„‟′‵″‶`´~()]/g,"")
    .replace(/\s{2,}/g," ")
    .toLowerCase();
}

function VolunteerApproval(props: { onOpen: () => void }) {
  const { onOpen } = props;
  useEffect(onOpen);

  const classes = useStyles();
  const navigate = useNavigate();
  
  const [uncheckedFamilies, setUncheckedFamilies] = useState<string[]>([]);

  const [volunteerFamilyRoleFilters, setVolunteerFamilyRoleFilters] = useRecoilState(volunteerFamilyRoleFiltersState);
  const [volunteerRoleFilters, setVolunteerRoleFilters] = useRecoilState(volunteerRoleFiltersState);
  function toValue(selection: 'Not Applied'|'Prospective'|'Approved'|'Onboarded') {
    return selection === 'Not Applied' ? null : RoleApprovalStatus[selection];
  };
  function changeVolunteerFamilyRoleFilterSelection(roleFilter: RoleFilter, selected: string | string[]) {
    setUncheckedFamilies([]);
    const selectedValues = typeof selected === 'string'
    ? [toValue(selected as 'Not Applied'|'Prospective'|'Approved'|'Onboarded')]
    : selected.map(x => toValue(x as 'Not Applied'|'Prospective'|'Approved'|'Onboarded'));
    const updatedFilters = volunteerFamilyRoleFilters.map(value =>
      value.roleName === roleFilter.roleName
      ? { roleName: value.roleName, selected: selectedValues }
      : value);
    setVolunteerFamilyRoleFilters(updatedFilters);
  }
  function changeVolunteerRoleFilterSelection(roleFilter: RoleFilter, selected: string | string[]) {
    setUncheckedFamilies([]);
    const selectedValues = typeof selected === 'string'
    ? [toValue(selected as 'Not Applied'|'Prospective'|'Approved'|'Onboarded')]
    : selected.map(x => toValue(x as 'Not Applied'|'Prospective'|'Approved'|'Onboarded'));
    const updatedFilters = volunteerRoleFilters.map(value =>
      value.roleName === roleFilter.roleName
      ? { roleName: value.roleName, selected: selectedValues }
      : value);
      setVolunteerRoleFilters(updatedFilters);
  }
  
  // The array object returned by Recoil is read-only. We need to copy it before we can do an in-place sort.
  const volunteerFamilies = useRecoilValue(volunteerFamiliesData).map(x => x).sort((a, b) =>
    familyLastName(a) < familyLastName(b) ? -1 : familyLastName(a) > familyLastName(b) ? 1 : 0);
  
  const [filterText, setFilterText] = useState("");

  // Filter volunteer families by name and by applicable roles.
  const filteredVolunteerFamilies = volunteerFamilies.filter(family => (
      filterText.length === 0 ||
      family.family?.adults?.some(adult => simplify(`${adult.item1?.firstName} ${adult.item1?.lastName}`).includes(filterText.toLowerCase())) ||
      family.family?.children?.some(child => simplify(`${child?.firstName} ${child?.lastName}`).includes(filterText.toLowerCase()))) && (
      volunteerFamilyRoleFilters.every(roleFilter =>
        family.volunteerFamilyInfo?.familyRoleApprovals?.[roleFilter.roleName]?.some(approval =>
          roleFilter.selected.indexOf(approval.approvalStatus!) > -1) || roleFilter.selected.indexOf(null) > -1) &&
      volunteerRoleFilters.every(roleFilter => 
        ((family.volunteerFamilyInfo?.individualVolunteers && Object.entries(family.volunteerFamilyInfo?.individualVolunteers)) || []).some(([_, volunteer]) =>
          volunteer.individualRoleApprovals?.[roleFilter.roleName]?.some(approval =>
            roleFilter.selected.indexOf(approval.approvalStatus!) > -1) || roleFilter.selected.indexOf(null) > -1))
    ));
  
  const selectedFamilies = filteredVolunteerFamilies.filter(family =>
    !uncheckedFamilies.some(f => f === family.family!.id!));

  useScrollMemory();
  
  function openVolunteerFamily(volunteerFamilyId: string) {
    navigate(`../family/${volunteerFamilyId}`);
  }
  const [createVolunteerFamilyDialogOpen, setCreateVolunteerFamilyDialogOpen] = useState(false);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
    
  const [expandedView, setExpandedView] = useLocalStorage('volunteer-approval-expanded', true);

  const locationId = useRecoilValue(currentLocationState);
  const organizationConfiguration = useRecoilValue(organizationConfigurationData);
  const smsSourcePhoneNumber = organizationConfiguration.locations?.find(loc =>
    loc.id === locationId)?.smsSourcePhoneNumber;
  const [smsMode, setSmsMode] = useState(false);
  
  function getSelectedFamiliesContactEmails() {
    return selectedFamilies.map(family => {
      const primaryContactPerson = family.family?.adults?.find(adult =>
        adult.item1?.id === family.family?.primaryFamilyContactPersonId);
      const preferredEmailAddress =  primaryContactPerson?.item1?.emailAddresses?.find(email =>
        email.id === primaryContactPerson.item1?.preferredEmailAddressId);
      return preferredEmailAddress;
    }).filter(email => typeof email !== 'undefined') as EmailAddress[];
  }

  function copyEmailAddresses() {
    const emailAddresses = getSelectedFamiliesContactEmails();
    navigator.clipboard.writeText(emailAddresses.map(email => email.address).join("; "));
    setNoticeOpen(true);
  }
  const [noticeOpen, setNoticeOpen] = useState(false);

  const windowSize = useWindowSize();

  return (
    <>
      <Grid container spacing={3} sx={{
        paddingRight: smsMode && !isMobile ? '400px' : null,
        height: smsMode && isMobile ? `${windowSize.height - 500 - 24}px` : null,
        overflow: smsMode && isMobile ? 'scroll' : null }}>
        <HeaderContent>
          {!isMobile && <HeaderTitle>Volunteers</HeaderTitle>}
          <ButtonGroup variant="text" color="inherit" aria-label="text inherit button group" style={{flexGrow: 1}}>
            <Button color={location.pathname === "/volunteers/approval" ? 'secondary' : 'inherit'} component={Link} to={"/volunteers/approval"}>Approvals</Button>
            <Button color={location.pathname === "/volunteers/progress" ? 'secondary' : 'inherit'} component={Link} to={"/volunteers/progress"}>Progress</Button>
          </ButtonGroup>
          <IconButton color="inherit" aria-label="copy email addresses"
            onClick={() => copyEmailAddresses()} sx={{ }}>
            <EmailIcon />
          </IconButton>
          <Snackbar
            open={noticeOpen}
            autoHideDuration={4000}
            onClose={() => setNoticeOpen(false)}
            message={`Found and copied ${getSelectedFamiliesContactEmails().length} email addresses for ${selectedFamilies.length} selected families to clipboard`} />
          {smsSourcePhoneNumber &&
            <IconButton color={smsMode ? 'secondary' : 'inherit'} aria-label="send bulk sms"
              onClick={() => setSmsMode(!smsMode)} sx={{ marginRight: 2 }}>
              <SmsIcon />
            </IconButton>}
          <FormControlLabel
            control={<Switch checked={expandedView} onChange={(e) => setExpandedView(e.target.checked)}
              name="expandedView" sx={{ marginRight: 1 }} />}
            label={isMobile ? "" : "Expand"}
          />
          <SearchBar value={filterText} onChange={value => {
            setUncheckedFamilies([]);
            setFilterText(value);
          }} />
        </HeaderContent>
        <Grid item xs={12}>
          <TableContainer>
            <Table className={classes.table} size="small">
              <TableHead>
                <TableRow sx={{ height: '40px' }}>
                  {smsMode && <TableCell sx={{ padding: 0, width: '36px' }}>
                    <Checkbox size='small' checked={uncheckedFamilies.length === 0}
                      onChange={e => e.target.checked
                        ? setUncheckedFamilies([])
                        : setUncheckedFamilies(filteredVolunteerFamilies.map(f => f.family!.id!))} />
                  </TableCell>}
                  {expandedView
                  ? <>
                      <TableCell>First Name</TableCell>
                      <TableCell>Last Name</TableCell>
                      <TableCell>Gender</TableCell>
                      <TableCell>Age</TableCell>
                    </>
                  : <TableCell>Family</TableCell>}
                  { volunteerFamilyRoleFilters.map(roleFilter =>
                    (<RoleHeaderCell key={roleFilter.roleName} roleFilter={roleFilter}
                      setSelected={selected => changeVolunteerFamilyRoleFilterSelection(roleFilter, selected)} />))}
                  { volunteerRoleFilters.map(roleFilter =>
                    (<RoleHeaderCell key={roleFilter.roleName} roleFilter={roleFilter}
                      setSelected={selected => changeVolunteerRoleFilterSelection(roleFilter, selected)} />))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredVolunteerFamilies.map((volunteerFamily) => (
                  <React.Fragment key={volunteerFamily.family?.id}>
                    <TableRow className={classes.familyRow} onClick={() => openVolunteerFamily(volunteerFamily.family!.id!)}>
                      {smsMode && <TableCell key="-" sx={{ padding: 0, width: '36px' }}>
                        <Checkbox size='small' checked={!uncheckedFamilies.some(x => x === volunteerFamily.family!.id!)}
                          onChange={e => e.target.checked
                            ? setUncheckedFamilies(uncheckedFamilies.filter(x => x !== volunteerFamily.family!.id!))
                            : setUncheckedFamilies(uncheckedFamilies.concat(volunteerFamily.family!.id!))}
                          onClick={e => e.stopPropagation()} />
                      </TableCell>}
                      <TableCell key="1" colSpan={expandedView ? 4 : 1}>{familyLastName(volunteerFamily) + " Family"
                      }</TableCell>
                      { volunteerFamilyRoleFilters.map(roleFilter =>
                        (<TableCell key={roleFilter.roleName}>{
                          approvalStatus(volunteerFamily.volunteerFamilyInfo?.familyRoleApprovals?.[roleFilter.roleName], volunteerFamily.volunteerFamilyInfo?.removedRoles?.find(x => x.roleName === roleFilter.roleName))
                        }</TableCell>))}
                      { expandedView
                        ? <TableCell colSpan={volunteerRoleFilters.length} />
                        : volunteerRoleFilters.map(roleFilter =>
                          (<TableCell key={roleFilter.roleName}>
                            <CombinedApprovalStatus summary={
                              ((volunteerFamily.volunteerFamilyInfo?.individualVolunteers &&
                              Object.entries(volunteerFamily.volunteerFamilyInfo?.individualVolunteers).map(x => x[1]).flatMap(x =>
                                (x.individualRoleApprovals && Object.entries(x.individualRoleApprovals).map(([role, approvals]) =>
                                  x.removedRoles?.some(r => r.roleName === role)
                                  ? { Prospective: 0, Approved: 0, Onboarded: 0 }
                                  : approvals.some(x => role === roleFilter.roleName && x.approvalStatus === RoleApprovalStatus.Onboarded)
                                  ? { Prospective: 0, Approved: 0, Onboarded: 1 }
                                  : approvals.some(x => role === roleFilter.roleName && x.approvalStatus === RoleApprovalStatus.Approved)
                                  ? { Prospective: 0, Approved: 1, Onboarded: 0 }
                                  : approvals.some(x => role === roleFilter.roleName && x.approvalStatus === RoleApprovalStatus.Prospective)
                                  ? { Prospective: 1, Approved: 0, Onboarded: 0 }
                                  : { Prospective: 0, Approved: 0, Onboarded: 0 })) || [])) || []).reduce((sum, x) =>
                                    ({ Prospective: sum!.Prospective + x!.Prospective,
                                      Approved: sum!.Approved + x!.Approved,
                                      Onboarded: sum!.Onboarded + x!.Onboarded }),
                                    { Prospective: 0, Approved: 0, Onboarded: 0 })} />
                          </TableCell>))}
                    </TableRow>
                    {expandedView && volunteerFamily.family?.adults?.map(adult => adult.item1 && adult.item1.active && (
                      <TableRow key={volunteerFamily.family?.id + ":" + adult.item1.id}
                        onClick={() => openVolunteerFamily(volunteerFamily.family!.id!)}
                        className={classes.adultRow}>
                        {smsMode && <TableCell />}
                        <TableCell sx={{paddingLeft:3}}>{adult.item1.firstName}</TableCell>
                        <TableCell>{adult.item1.lastName}</TableCell>
                        <TableCell>{typeof(adult.item1.gender) === 'undefined' ? "" : Gender[adult.item1.gender]}</TableCell>
                        <TableCell align="right">
                          { adult.item1.age instanceof ExactAge
                            ? adult.item1.age.dateOfBirth && differenceInYears(new Date(), adult.item1.age.dateOfBirth)
                            : adult.item1.age instanceof AgeInYears
                            ? adult.item1.age.years && adult.item1?.age.asOf && (adult.item1.age.years + differenceInYears(new Date(), adult.item1.age.asOf))
                            : "⚠" }
                        </TableCell>
                        <TableCell colSpan={volunteerFamilyRoleFilters.length} />
                        { volunteerRoleFilters.map(roleFilter =>
                          (<TableCell key={roleFilter.roleName}>{
                            approvalStatus(volunteerFamily.volunteerFamilyInfo?.individualVolunteers?.[adult.item1?.id || '']?.individualRoleApprovals?.[roleFilter.roleName],
                              volunteerFamily.volunteerFamilyInfo?.individualVolunteers?.[adult.item1?.id || '']?.removedRoles?.find(x => x.roleName === roleFilter.roleName))
                          }</TableCell>))}
                      </TableRow>
                    ))}
                    {expandedView && volunteerFamily.family?.children?.map(child => child.active && (
                      <TableRow key={volunteerFamily.family?.id + ":" + child.id}
                        onClick={() => openVolunteerFamily(volunteerFamily.family!.id!)}
                        className={classes.childRow}>
                        {smsMode && <TableCell />}
                        <TableCell sx={{paddingLeft:3}}>{child.firstName}</TableCell>
                        <TableCell>{child.lastName}</TableCell>
                        <TableCell>{typeof(child.gender) === 'undefined' ? "" : Gender[child.gender]}</TableCell>
                        <TableCell align="right">
                          { child.age instanceof ExactAge
                            ? child.age.dateOfBirth && differenceInYears(new Date(), child.age.dateOfBirth)
                            : child.age instanceof AgeInYears
                            ? child.age.years && child.age.asOf && (child.age.years + differenceInYears(new Date(), child.age.asOf))
                            : "⚠" }
                        </TableCell>
                        <TableCell colSpan={
                          volunteerFamilyRoleFilters.length +
                          volunteerRoleFilters.length } />
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
            volunteerFamilyId && openVolunteerFamily(volunteerFamilyId);
          }} />}
        </Grid>
      </Grid>
      {smsMode && <BulkSmsSideSheet selectedFamilies={selectedFamilies}
      onClose={() => setSmsMode(false)} />}
    </>
  );
}

export { VolunteerApproval };
