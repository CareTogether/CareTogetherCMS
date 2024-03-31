import { Grid, Table, TableContainer, TableBody, TableCell, TableHead, TableRow, Fab, useMediaQuery, useTheme, Button, ButtonGroup, MenuItem, Select, ListItemText, Checkbox, FormControl, InputBase, SelectChangeEvent, IconButton, Snackbar, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { CombinedFamilyInfo, EmailAddress, Permission } from '../GeneratedClient';
import { atom, selector, useRecoilState, useRecoilValue } from 'recoil';
import { volunteerFamiliesData } from '../Model/VolunteersModel';
import { organizationConfigurationQuery, policyData } from '../Model/ConfigurationModel';
import { RoleApprovalStatus } from '../GeneratedClient';
import React, { useEffect, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import SmsIcon from '@mui/icons-material/Sms';
import EmailIcon from '@mui/icons-material/Email';
import FilterListIcon from '@mui/icons-material/FilterList';
import { CreateVolunteerFamilyDialog } from './CreateVolunteerFamilyDialog';
import { Link, useLocation } from 'react-router-dom';
import { SearchBar } from '../Shell/SearchBar';
import { useLocalStorage } from '../Hooks/useLocalStorage';
import { useScrollMemory } from '../Hooks/useScrollMemory';
import { useAllVolunteerFamiliesPermissions } from '../Model/SessionModel';
import { BulkSmsSideSheet } from './BulkSmsSideSheet';
import { useWindowSize } from '../Hooks/useWindowSize';
import useScreenTitle from '../Shell/ShellScreenTitle';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import { useLoadable } from '../Hooks/useLoadable';
import { ProgressBackdrop } from '../Shell/ProgressBackdrop';
import { selectedLocationContextState } from '../Model/Data';
import { useAppNavigate } from '../Hooks/useAppNavigate';
import { VolunteerRoleApprovalStatusChip } from './VolunteerRoleApprovalStatusChip';

//#region Old Role/Status Selection code
type RoleFilter = {
  roleName: string
  selected: (RoleApprovalStatus | null)[]
}

const volunteerFamilyRoleFiltersState = atom({
  key: 'volunteerFamilyRoleFiltersState',
  default: selector({
    key: 'volunteerFamilyRoleFiltersState/Default',
    get: ({ get }) => {
      const policy = get(policyData);
      const roleFilters =
        ((policy.volunteerPolicy?.volunteerFamilyRoles &&
          Object.entries(policy.volunteerPolicy?.volunteerFamilyRoles)) || []).map(([key]) => ({
            roleName: key,
            selected: [
              RoleApprovalStatus.Prospective,
              RoleApprovalStatus.Approved,
              RoleApprovalStatus.Onboarded,
              RoleApprovalStatus.Expired,
              RoleApprovalStatus.Inactive,
              RoleApprovalStatus.Denied,
              null
            ]
          }));
      return roleFilters;
    }
  })
});

const volunteerRoleFiltersState = atom({
  key: 'volunteerRoleFiltersState',
  default: selector({
    key: 'volunteerRoleFiltersState/Default',
    get: ({ get }) => {
      const policy = get(policyData);
      const roleFilters =
        ((policy.volunteerPolicy?.volunteerRoles &&
          Object.entries(policy.volunteerPolicy?.volunteerRoles)) || []).map(([key]) => ({
            roleName: key,
            selected: [
              RoleApprovalStatus.Prospective,
              RoleApprovalStatus.Approved,
              RoleApprovalStatus.Onboarded,
              RoleApprovalStatus.Expired,
              RoleApprovalStatus.Inactive,
              RoleApprovalStatus.Denied,
              null
            ]
          }));
      return roleFilters;
    }
  })
});

type RoleHeaderCellProps = {
  roleFilter: RoleFilter
  setSelected: (selected: string | string[]) => void
}

function RoleHeaderCell({ roleFilter, setSelected }: RoleHeaderCellProps) {
  const choices = [
    { key: "Not Applied", value: null },
    { key: RoleApprovalStatus[RoleApprovalStatus.Prospective], value: RoleApprovalStatus.Prospective },
    { key: RoleApprovalStatus[RoleApprovalStatus.Approved], value: RoleApprovalStatus.Approved },
    { key: RoleApprovalStatus[RoleApprovalStatus.Onboarded], value: RoleApprovalStatus.Onboarded },
    { key: RoleApprovalStatus[RoleApprovalStatus.Expired], value: RoleApprovalStatus.Expired },
    { key: RoleApprovalStatus[RoleApprovalStatus.Inactive], value: RoleApprovalStatus.Inactive },
    { key: RoleApprovalStatus[RoleApprovalStatus.Denied], value: RoleApprovalStatus.Denied }
  ];

  const handleChange = (event: SelectChangeEvent<string[]>) => {
    setSelected(event.target.value);
  };

  return (
    <TableCell sx={{ position: 'relative' }}>
      {roleFilter.roleName}
      <FormControl sx={{ position: 'absolute', right: 0 }} size="small">
        <Select
          sx={{
            color: roleFilter.selected.length === choices.length ? '#bdbdbd' : null,
            '& .MuiSelect-iconOpen': { transform: 'none' }
          }}
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

interface CombinedApprovalStatusProps {
  summary: { Prospective: number, Approved: number, Onboarded: number, Expired: number, Inactive: number, Denied: number }
}
function CombinedApprovalStatus(props: CombinedApprovalStatusProps) {
  const { summary } = props;
  const outputs = [];
  summary.Onboarded && outputs.push(`${summary.Onboarded} onboarded`);
  summary.Approved && outputs.push(`${summary.Approved} approved`);
  summary.Prospective && outputs.push(`${summary.Prospective} prospective`);
  summary.Expired && outputs.push(`${summary.Expired} expired`);
  summary.Inactive && outputs.push(`${summary.Inactive} inactive`);
  summary.Denied && outputs.push(`${summary.Denied} denied`);
  return (
    <span>{outputs.join(", ")}</span>
  );
}
//#endregion
//#region new Role/Status Selection code
enum filterType {
	Family = 1,
	Individual = 2
}
type filterOption = {
	key: string;
	value: string | undefined;
	type?: filterType | undefined;
	selected: boolean;
}
const roleFiltersState = atom({
	key: 'newRoleFiltersState',
	default: selector({
		key: 'newRoleFiltersState/Default',
		get: ({ get }) => {
			const policy = get(policyData);
			const roleFilters: filterOption[] = [{ 
				key: "Not Applied", 
				value: undefined,
				selected: false				
			}];
			const familyRoles = [...Object.keys(policy.volunteerPolicy?.volunteerFamilyRoles || {})];
			const individualRoles = [...Object.keys(policy.volunteerPolicy?.volunteerRoles || {})];
			const combinedRoles = [...familyRoles, ...individualRoles];
			for (let i = 0; i < combinedRoles.length; i++) {
				const isIndividualRole = i >= familyRoles.length;
				const roleType = isIndividualRole ? filterType.Individual : filterType.Family;
				roleFilters.push({
					key: combinedRoles[i],
					value: i.toString(),
					selected: false,
					type: roleType
				});
			}
			return roleFilters;
		}
	})
});
const statusFiltersState = atom({
	key: 'statusFiltersState',
	default: selector({
		key: 'statusFiltersState/Default',
		get: () => {
			const options = [
				{ key: "Not Applied", value: undefined },
				{ key: RoleApprovalStatus[RoleApprovalStatus.Prospective], value: RoleApprovalStatus.Prospective },
				{ key: RoleApprovalStatus[RoleApprovalStatus.Approved], value: RoleApprovalStatus.Approved },
				{ key: RoleApprovalStatus[RoleApprovalStatus.Onboarded], value: RoleApprovalStatus.Onboarded },
				{ key: RoleApprovalStatus[RoleApprovalStatus.Expired], value: RoleApprovalStatus.Expired },
				{ key: RoleApprovalStatus[RoleApprovalStatus.Inactive], value: RoleApprovalStatus.Inactive },
				{ key: RoleApprovalStatus[RoleApprovalStatus.Denied], value: RoleApprovalStatus.Denied }
			];
			const statusFilters: filterOption[] = options.map((option) => ({
				key: option.key,
				value: option.value ? option.value.toString() : undefined,
				selected: false
			}));
			return statusFilters;
		}
	})
});
type VolunteerFilterProps = {
	label: string;
	options: filterOption[];
	setSelected: (selected: string | string[]) => void;
}
function VolunteerFilter({ label, options, setSelected }: VolunteerFilterProps) {
	const handleChange = (event: SelectChangeEvent<string[]>) => {
		const allOptionKeysPlusSelectedOptionValue = event.target.value;
		setSelected(allOptionKeysPlusSelectedOptionValue);
	};

	return (
		<FormControl sx={{ position: 'relative' }}>
			<Select
				labelId={`volunteer${label}Filter`}
				sx={{
					color: options.filter(o => o.selected).length === options.length ? '#bdbdbd' : null,
					'& .MuiSelect-iconOpen': { transform: 'none' }
				}}
				multiple value={options.map(o => o.key)}
				variant="standard" 
				label={`${label} Filters`}
				onChange={handleChange}
				input={<InputBase />}
				IconComponent={FilterListIcon}
				renderValue={() => {
					const selectedOptions = options.filter(o => o.selected);
					return (selectedOptions.length === options.length) ? `${label}: all` : `${label}: ${selectedOptions.length} of ${options.length}`
				}}
			>
				{options.map((option) =>
					<MenuItem key={option.key} value={option.value ?? ''}>
						<Checkbox checked={option.selected} />
						<ListItemText primary={option.key} />
					</MenuItem>
				)}
			</Select>
		</FormControl>
	)
}
//#endregion
function approvalStatus(currentApprovalStatus?: RoleApprovalStatus | null) {
	if (typeof currentApprovalStatus === 'undefined' ||
		currentApprovalStatus == null) return "-";
	switch (currentApprovalStatus) {
		case RoleApprovalStatus.Prospective:
			return "Prospective";
		case RoleApprovalStatus.Approved:
			return "Approved";
		case RoleApprovalStatus.Onboarded:
			return "Onboarded";
		case RoleApprovalStatus.Expired:
			return "Expired";
		case RoleApprovalStatus.Inactive:
			return "Inactive";
		case RoleApprovalStatus.Denied:
			return "Denied";
		default:
			console.warn("Unknown approval status", currentApprovalStatus);
			return "??";
	}
}
function familyLastName(family: CombinedFamilyInfo) {
	return family.family!.adults?.filter(adult =>
		family.family!.primaryFamilyContactPersonId === adult.item1?.id)[0]?.item1?.lastName || "";
}

function simplify(input: string) {
  // Strip out common punctuation elements and excessive whitespace, and convert to lowercase
  return input
    .replace(/[.,/#!$%^&*;:{}=\-_`'"'‘’‚‛“”„‟′‵″‶`´~()]/g, "")
    .replace(/\s{2,}/g, " ")
    .toLowerCase();
}

function VolunteerApproval(props: { onOpen: () => void }) {
	const { onOpen } = props;
	useEffect(onOpen);
	const appNavigate = useAppNavigate();
	const [uncheckedFamilies, setUncheckedFamilies] = useState<string[]>([]);

	//#region Old Role/Status Selection Code
	const [volunteerFamilyRoleFilters, setVolunteerFamilyRoleFilters] = useRecoilState(volunteerFamilyRoleFiltersState);
	const [volunteerRoleFilters, setVolunteerRoleFilters] = useRecoilState(volunteerRoleFiltersState);
	function toValue(selection: 'Not Applied' | 'Prospective' | 'Approved' | 'Onboarded' | 'Expired' | 'Inactive' | 'Denied') {
		return selection === 'Not Applied' ? null : RoleApprovalStatus[selection];
	}
	function changeVolunteerFamilyRoleFilterSelection(roleFilter: RoleFilter, selected: string | string[]) {
		setUncheckedFamilies([]);
		const selectedValues = typeof selected === 'string'
		? [toValue(selected as 'Not Applied' | 'Prospective' | 'Approved' | 'Onboarded' | 'Expired' | 'Inactive' | 'Denied')]
		: selected.map(x => toValue(x as 'Not Applied' | 'Prospective' | 'Approved' | 'Onboarded' | 'Expired' | 'Inactive' | 'Denied'));
		const updatedFilters = volunteerFamilyRoleFilters.map(value =>
		value.roleName === roleFilter.roleName
			? { roleName: value.roleName, selected: selectedValues }
			: value);
		setVolunteerFamilyRoleFilters(updatedFilters);
	}
	function changeVolunteerRoleFilterSelection(roleFilter: RoleFilter, selected: string | string[]) {
		setUncheckedFamilies([]);
		const selectedValues = typeof selected === 'string'
		? [toValue(selected as 'Not Applied' | 'Prospective' | 'Approved' | 'Onboarded' | 'Expired' | 'Inactive' | 'Denied')]
		: selected.map(x => toValue(x as 'Not Applied' | 'Prospective' | 'Approved' | 'Onboarded' | 'Expired' | 'Inactive' | 'Denied'));
		const updatedFilters = volunteerRoleFilters.map(value =>
		value.roleName === roleFilter.roleName
			? { roleName: value.roleName, selected: selectedValues }
			: value);
		setVolunteerRoleFilters(updatedFilters);
	}
	//#endregion
	//#region new Role/Status Selection Code		
	const [roleFilters, setRoleFilters] = useRecoilState(roleFiltersState);
	const [statusFilters, setStatusFilters] = useRecoilState(statusFiltersState);
	function getOptionValueFromSelection(allOptionKeysPlusSelectedOptionValue: string | string[]) {
		const optionValue = [...allOptionKeysPlusSelectedOptionValue].filter((s: string) => !isNaN(Number(s)))[0];
		return optionValue ? optionValue : undefined;
	}
	function getUpdatedFilters(filters: filterOption[], optionToUpdate: filterOption) {
		return filters.map(filter => 
			filter.key === optionToUpdate.key
			? { ...filter, selected: !filter.selected }
			: filter);	
	}
	function changeRoleFilterSelection(selection: string | string[]) {
		setUncheckedFamilies([]);
		const filterOptionToUpdate = roleFilters.find(filter => 
			filter.value === getOptionValueFromSelection(selection));
			console.warn(`changing ${filterOptionToUpdate?.key} to ${!filterOptionToUpdate?.selected}`);
		setRoleFilters(getUpdatedFilters(roleFilters, filterOptionToUpdate!));
	}
	function changeStatusFilterSelection(selection: string | string[]) {
		setUncheckedFamilies([]);
		const filterOptionToUpdate = statusFilters.find(filter => 
			filter.value === getOptionValueFromSelection(selection));
			console.warn(`changing ${filterOptionToUpdate?.key} to ${!filterOptionToUpdate?.selected}`);
		setStatusFilters(getUpdatedFilters(statusFilters, filterOptionToUpdate!));
	}
	//#endregion
	
	// The array object returned by Recoil is read-only. We need to copy it before we can do an in-place sort.
	const volunteerFamiliesLoadable = useLoadable(volunteerFamiliesData);
	const volunteerFamilies = (volunteerFamiliesLoadable || []).map(x => x).sort((a, b) =>
		familyLastName(a) < familyLastName(b) ? -1 : familyLastName(a) > familyLastName(b) ? 1 : 0);

	const [filterText, setFilterText] = useState("");

	//#region Old Family/Individual Filtering Code
	// function familyMeetsOldFilterCriteria(family: CombinedFamilyInfo) {
	// 	return volunteerFamilyRoleFilters.every(roleFilter => roleFilter.selected.indexOf(null) > -1 ||
	// 		roleFilter.selected.indexOf(
	// 		family.volunteerFamilyInfo?.familyRoleApprovals?.[roleFilter.roleName]?.currentStatus || null) > -1)
	// }
	// function familyMembersMeetOldFilterCriteria(family: CombinedFamilyInfo) {
	// 	return volunteerRoleFilters.every(roleFilter =>
	// 		((family.volunteerFamilyInfo?.individualVolunteers && Object.entries(family.volunteerFamilyInfo?.individualVolunteers)) || []).some(([, volunteer]) =>
	// 		roleFilter.selected.indexOf(null) > -1 ||
	// 		roleFilter.selected.indexOf(volunteer.approvalStatusByRole?.[roleFilter.roleName]?.currentStatus || null) > -1))
	// }
	//#endregion
	//#region New Family/Individual Filtering Code
	const selectedFamilyRoleKeys = roleFilters.filter(filterOption => (filterOption.selected && filterOption.type === filterType.Family)).map(filterOption => filterOption.key);
	const selectedIndividualRoleKeys = roleFilters.filter(filterOption => (filterOption.selected && filterOption.type === filterType.Individual)).map(filterOption => filterOption.key);
	const selectedStatusKeys = statusFilters.filter(filterOption => filterOption.selected).map(filterOption => filterOption.value);

	function familyMeetsNewFilterCriteria(family: CombinedFamilyInfo) {
		console.group(`filtering ${familyLastName(family)} family`);
		console.log(JSON.stringify(selectedFamilyRoleKeys));
		if (selectedFamilyRoleKeys.length === 0) {
			console.groupEnd();
			return true;
		} 
		const result = selectedFamilyRoleKeys.some(roleName => {
			console.group(roleName);
			const familyHasRole = (roleName !== "Not Applied") 
				? (family.volunteerFamilyInfo?.familyRoleApprovals?.[roleName] !== undefined) 
				: family.volunteerFamilyInfo?.familyRoleApprovals?.[roleName] === undefined;
			console.log(`familyHasRole: ${familyHasRole}`);
			if (!familyHasRole) {
				console.groupEnd();
				return false;
			}
			if (selectedStatusKeys.length === 0) {
				const validStatuses = statusFilters.filter(filterOption => filterOption.value !== undefined);
				const currentFamilyStatus = family.volunteerFamilyInfo?.familyRoleApprovals?.[roleName]?.currentStatus;
				const hasRoleInValidStatus = validStatuses.some(status => Number(status.value) === currentFamilyStatus);
				console.log(`validStatuses: ${JSON.stringify(validStatuses)}`);
				console.log(`currentFamilyStatus: ${currentFamilyStatus}`);
				console.log(`hasRoleInValidStatus: ${hasRoleInValidStatus}`);
				console.groupEnd();
				return hasRoleInValidStatus;
			}
			const familyHasRoleInSelectedStatus = selectedStatusKeys.some(status => Number(status) === family.volunteerFamilyInfo?.familyRoleApprovals?.[roleName]?.currentStatus);
			console.log(`familyHasRoleInSelectedStatus: ${familyHasRoleInSelectedStatus}`);
			console.groupEnd();
			return familyHasRoleInSelectedStatus;
		});
		console.log(result);
		console.groupEnd();
		return result;
	}
	function familyMembersMeetNewFilterCriteria(family: CombinedFamilyInfo) {
		console.group(`filtering ${familyLastName(family)} family`);
		console.log(JSON.stringify(selectedIndividualRoleKeys));
		if (selectedIndividualRoleKeys.length === 0) {
			console.groupEnd();
			return true;
		} 
		const result = selectedIndividualRoleKeys.some(roleName => {
			console.group(roleName);
			const familyMembers = ((family.volunteerFamilyInfo?.individualVolunteers && Object.entries(family.volunteerFamilyInfo?.individualVolunteers)) || []);
			console.log(JSON.stringify(familyMembers));
			return familyMembers.some(([, volunteer]) => {
				const volunteerHasRole = (roleName !== "Not Applied") 
					? (volunteer.approvalStatusByRole?.[roleName] !== undefined)
					: volunteer.approvalStatusByRole?.[roleName] === undefined;
				console.log(`volunteerHasRole: ${volunteerHasRole}`);
				if (!volunteerHasRole) {
					console.groupEnd();
					return false;
				}
				console.log(JSON.stringify(selectedStatusKeys));
				if (selectedStatusKeys.length === 0) {
					const validStatuses = statusFilters.filter(filterOption => filterOption.value !== undefined);
					const currentFamilyMemberStatus = volunteer.approvalStatusByRole?.[roleName]?.currentStatus;
					const hasRoleInValidStatus = validStatuses.some(status => Number(status.value) === currentFamilyMemberStatus);
					console.log(`validStatuses: ${JSON.stringify(validStatuses)}`);
					console.log(`currentFamilyStatus: ${currentFamilyMemberStatus}`);
					console.log(`hasRoleInValidStatus: ${hasRoleInValidStatus}`);
					console.groupEnd();
					return hasRoleInValidStatus;
				}
				const matchingStatus = selectedStatusKeys.some(status => Number(status) === volunteer.approvalStatusByRole?.[roleName]?.currentStatus);
				console.log(`matchingStatus: ${matchingStatus}`);
				console.groupEnd();
				return matchingStatus;
			});
		});
		console.log(result);
		console.groupEnd();
		return result;
	}
	function familyMeetsFilterCriteria(family: CombinedFamilyInfo) {
		//const familyMeetsRoleCriteria = familyMeetsOldFilterCriteria(family);
		//const familyMembersMeetRoleCriteria = familyMembersMeetOldFilterCriteria(family);
		const familyMeetsRoleCriteria = familyMeetsNewFilterCriteria(family);
		const familyMembersMeetRoleCriteria = familyMembersMeetNewFilterCriteria(family);
		const familyRolesSelected = selectedFamilyRoleKeys.length > 0;
		const individualRolesSelected = selectedIndividualRoleKeys.length > 0;
		if (familyRolesSelected && individualRolesSelected) {
			return familyMeetsRoleCriteria || familyMembersMeetRoleCriteria;
		} else if (familyRolesSelected) {
			return familyMeetsRoleCriteria;
		} else if (individualRolesSelected) {
			return familyMembersMeetRoleCriteria;
		}
		return true;
	}
	//#endregion

	// Filter volunteer families by name and by applicable roles.
	const filteredVolunteerFamilies = volunteerFamilies.filter(family => /* Filter by name */(
		filterText.length === 0 ||
		family.family?.adults?.some(adult => simplify(`${adult.item1?.firstName} ${adult.item1?.lastName}`).includes(filterText.toLowerCase())) ||
		family.family?.children?.some(child => simplify(`${child?.firstName} ${child?.lastName}`).includes(filterText.toLowerCase()))) &&
		/* Filter by roles & approval status */ (
		familyMeetsFilterCriteria(family)
	));

	const selectedFamilies = filteredVolunteerFamilies.filter(family =>
		!uncheckedFamilies.some(f => f === family.family!.id!));
	
	
	useScrollMemory();

	function openFamily(familyId: string) {
		appNavigate.family(familyId);
	}
	const [createVolunteerFamilyDialogOpen, setCreateVolunteerFamilyDialogOpen] = useState(false);

	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('md'));
	const location = useLocation();

	const [expandedView, setExpandedView] = useLocalStorage('volunteer-approval-expanded', true);
	const handleExpandCollapse = (
		_event: React.MouseEvent<HTMLElement>,
		newExpandedView: boolean | null,
	) => {
		if (newExpandedView !== null) {
		setExpandedView(newExpandedView);
		}
	};

	const { locationId } = useRecoilValue(selectedLocationContextState);
	const organizationConfiguration = useRecoilValue(organizationConfigurationQuery);
	const smsSourcePhoneNumbers = organizationConfiguration?.locations?.find(loc =>
		loc.id === locationId)?.smsSourcePhoneNumbers;
	const [smsMode, setSmsMode] = useState(false);

	function getSelectedFamiliesContactEmails() {
		return selectedFamilies.map(family => {
		const primaryContactPerson = family.family?.adults?.find(adult =>
			adult.item1?.id === family.family?.primaryFamilyContactPersonId);
		const preferredEmailAddress = primaryContactPerson?.item1?.emailAddresses?.find(email =>
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

	const permissions = useAllVolunteerFamiliesPermissions();

	useScreenTitle("Volunteers");

	return (!volunteerFamiliesLoadable
		? <ProgressBackdrop>
		<p>Loading families...</p>
		</ProgressBackdrop>
		: <>
		<Grid container sx={{
			paddingRight: smsMode && !isMobile ? '400px' : null,
			height: smsMode && isMobile ? `${windowSize.height - 500 - 24}px` : null,
			overflow: smsMode && isMobile ? 'scroll' : null
		}}>
			<Grid item xs={12}>
			<Stack direction='row-reverse' sx={{ marginTop: 1 }}>
				<ToggleButtonGroup value={expandedView} exclusive onChange={handleExpandCollapse}
				size={isMobile ? 'medium' : 'small'} aria-label="row expansion">
				<ToggleButton value={true} aria-label="expanded"><UnfoldMoreIcon /></ToggleButton>
				<ToggleButton value={false} aria-label="collapsed"><UnfoldLessIcon /></ToggleButton>
				</ToggleButtonGroup>
				<SearchBar value={filterText} onChange={value => {
				setUncheckedFamilies([]);
				setFilterText(value);
				}} />
				{permissions(Permission.SendBulkSms) &&
				<IconButton color="inherit" aria-label="copy email addresses"
					onClick={() => copyEmailAddresses()} sx={{}}>
					<EmailIcon />
				</IconButton>}
				{permissions(Permission.SendBulkSms) && smsSourcePhoneNumbers && smsSourcePhoneNumbers.length > 0 &&
				<IconButton color={smsMode ? 'secondary' : 'inherit'} aria-label="send bulk sms"
					onClick={() => setSmsMode(!smsMode)} sx={{ marginRight: 2 }}>
					<SmsIcon sx={{ position: 'relative', top: 1 }} />
				</IconButton>}
				<Snackbar
				open={noticeOpen}
				autoHideDuration={5000} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
				onClose={() => setNoticeOpen(false)}
				message={`Found and copied ${getSelectedFamiliesContactEmails().length} email addresses for ${selectedFamilies.length} selected families to clipboard`} />
				{/* TODO: Test These */}
				<>
					<VolunteerFilter label="Statuses" options={statusFilters} setSelected={changeStatusFilterSelection} />
					<VolunteerFilter label="Roles" options={roleFilters} setSelected={changeRoleFilterSelection} />
					<ButtonGroup variant="text" color="inherit" aria-label="text inherit button group" style={{ flexGrow: 1 }}>
						<Button color={location.pathname.endsWith("/volunteers/approval") ? 'secondary' : 'inherit'} component={Link} to={"../approval"}>Approvals</Button>
						<Button color={location.pathname.endsWith("/volunteers/progress") ? 'secondary' : 'inherit'} component={Link} to={"../progress"}>Progress</Button>
					</ButtonGroup>
				</>
			</Stack>
			</Grid>
			<Grid item xs={12}>
			<TableContainer>
				<Table sx={{ minWidth: '700px' }} size="small">
				<TableHead>
					<TableRow sx={{ height: '40px' }}>
					{smsMode && <TableCell sx={{ padding: 0, width: '36px' }}>
						<Checkbox size='small' checked={uncheckedFamilies.length === 0}
						onChange={e => e.target.checked
							? setUncheckedFamilies([])
							: setUncheckedFamilies(filteredVolunteerFamilies.map(f => f.family!.id!))} />
					</TableCell>}
					{expandedView
						? <TableCell>Last Name, First Name</TableCell>
						: <TableCell>Family</TableCell>}
					<TableCell>Roles</TableCell>
					{/* TODO: Remove the Volunteer Family Roles column below */}
					{volunteerFamilyRoleFilters.map(roleFilter =>
					(<RoleHeaderCell key={roleFilter.roleName} roleFilter={roleFilter}
						setSelected={selected => changeVolunteerFamilyRoleFilterSelection(roleFilter, selected)} />))}

					{/* TODO: Remove the Individual Volunteer Roles column below */}
					{volunteerRoleFilters.map(roleFilter =>
					(<RoleHeaderCell key={roleFilter.roleName} roleFilter={roleFilter}
						setSelected={selected => changeVolunteerRoleFilterSelection(roleFilter, selected)} />))}
					</TableRow>
				</TableHead>
				<TableBody>
					{filteredVolunteerFamilies.map((volunteerFamily) => (
					<React.Fragment key={volunteerFamily.family?.id}>
						<TableRow sx={{ backgroundColor: '#eef', height: '39px' }}
						onClick={() => openFamily(volunteerFamily.family!.id!)}>
						{smsMode && <TableCell key="-" sx={{ padding: 0, width: '36px' }}>
							<Checkbox size='small' checked={!uncheckedFamilies.some(x => x === volunteerFamily.family!.id!)}
							onChange={e => e.target.checked
								? setUncheckedFamilies(uncheckedFamilies.filter(x => x !== volunteerFamily.family!.id!))
								: setUncheckedFamilies(uncheckedFamilies.concat(volunteerFamily.family!.id!))}
							onClick={e => e.stopPropagation()} />
						</TableCell>}
						<TableCell key="1" colSpan={expandedView ? 1 : 1}>
							<Typography sx={{ fontWeight: 600 }}>{familyLastName(volunteerFamily) + " Family"}</Typography>
						</TableCell>
						<TableCell>
							{volunteerFamilyRoleFilters.map((roleFilter, index) =>
							<VolunteerRoleApprovalStatusChip 
								key={index} 
								roleName={roleFilter.roleName} 
								status={volunteerFamily.volunteerFamilyInfo?.familyRoleApprovals?.[roleFilter.roleName]?.effectiveRoleApprovalStatus} 
							/>
							)}
						</TableCell>

						{/* TODO: Remove the Volunteer Family Roles column below */}
						{volunteerFamilyRoleFilters.map(roleFilter =>
						(<TableCell key={roleFilter.roleName}>{
							approvalStatus(volunteerFamily.volunteerFamilyInfo?.familyRoleApprovals?.[roleFilter.roleName]?.currentStatus)
						}</TableCell>))}

						{/* TODO: Remove the Individual Volunteer Roles column below */}
						{expandedView
							? <TableCell colSpan={volunteerRoleFilters.length} />
							: volunteerRoleFilters.map(roleFilter =>
							(<TableCell key={roleFilter.roleName}>
							<CombinedApprovalStatus summary={
								((volunteerFamily.volunteerFamilyInfo?.individualVolunteers &&
								Object.entries(volunteerFamily.volunteerFamilyInfo?.individualVolunteers).map(x => x[1]).flatMap(x =>
									(x.approvalStatusByRole && Object.entries(x.approvalStatusByRole).map(([role, approvals]) =>
									(roleFilter.roleName !== role ||
										typeof approvals.currentStatus === 'undefined')
										? { Prospective: 0, Approved: 0, Onboarded: 0, Expired: 0, Inactive: 0, Denied: 0 }
										: approvals.currentStatus === RoleApprovalStatus.Denied
										? { Prospective: 0, Approved: 0, Onboarded: 0, Expired: 0, Inactive: 0, Denied: 1 }
										: approvals.currentStatus === RoleApprovalStatus.Inactive
											? { Prospective: 0, Approved: 0, Onboarded: 0, Expired: 0, Inactive: 1, Denied: 0 }
											: approvals.currentStatus === RoleApprovalStatus.Expired
											? { Prospective: 0, Approved: 0, Onboarded: 0, Expired: 1, Inactive: 0, Denied: 0 }
											: approvals.currentStatus === RoleApprovalStatus.Onboarded
												? { Prospective: 0, Approved: 0, Onboarded: 1, Expired: 0, Inactive: 0, Denied: 0 }
												: approvals.currentStatus === RoleApprovalStatus.Approved
												? { Prospective: 0, Approved: 1, Onboarded: 0, Expired: 0, Inactive: 0, Denied: 0 }
												: approvals.currentStatus === RoleApprovalStatus.Prospective
													? { Prospective: 1, Approved: 0, Onboarded: 0, Expired: 0, Inactive: 0, Denied: 0 }
													: { Prospective: 0, Approved: 0, Onboarded: 0, Expired: 0, Inactive: 0, Denied: 0 })) || [])) || []).reduce((sum, x) =>
													({
													Prospective: sum!.Prospective + x!.Prospective,
													Approved: sum!.Approved + x!.Approved,
													Onboarded: sum!.Onboarded + x!.Onboarded,
													Expired: sum!.Expired + x!.Expired,
													Inactive: sum!.Inactive + x!.Inactive,
													Denied: sum!.Denied + x!.Denied
													}),
													{ Prospective: 0, Approved: 0, Onboarded: 0, Expired: 0, Inactive: 0, Denied: 0 })} />
							</TableCell>))}
						</TableRow>
						{expandedView && volunteerFamily.family?.adults?.map(adult => adult.item1 && adult.item1.active && (
						<TableRow key={volunteerFamily.family?.id + ":" + adult.item1.id}
							onClick={() => openFamily(volunteerFamily.family!.id!)}>
							{smsMode && <TableCell />}
							<TableCell>{adult.item1.lastName}, {adult.item1.firstName}</TableCell> 
						<TableCell>
							{Object.entries(volunteerFamily.volunteerFamilyInfo?.individualVolunteers?.[adult.item1!.id!].approvalStatusByRole || {}).map(([role, roleApprovalStatus]) =>
							<VolunteerRoleApprovalStatusChip key={role} roleName={role} status={roleApprovalStatus.effectiveRoleApprovalStatus} />)}                      
						</TableCell>    
						{/* TODO: Remove the Individual Volunteer Roles column below */}                  
							<TableCell colSpan={volunteerFamilyRoleFilters.length} />
							{volunteerRoleFilters.map(roleFilter =>
							(<TableCell key={roleFilter.roleName}>{
							approvalStatus(volunteerFamily.volunteerFamilyInfo?.individualVolunteers?.[adult.item1?.id || '']?.approvalStatusByRole?.[roleFilter.roleName]?.currentStatus)
							}</TableCell>))}
						</TableRow>
						))}
						{expandedView && volunteerFamily.family?.children?.map(child => child.active && (
						<TableRow key={volunteerFamily.family?.id + ":" + child.id}
							onClick={() => openFamily(volunteerFamily.family!.id!)}
							sx={{ color: 'ddd', fontStyle: 'italic' }}>
							{smsMode && <TableCell />}
							<TableCell>{child.lastName}, {child.firstName}</TableCell> 
						<TableCell />
						{/* TODO: Remove the Individual Volunteer Roles column below */}                  
							<TableCell colSpan={
							volunteerFamilyRoleFilters.length +
							volunteerRoleFilters.length} />
						</TableRow>
						))}
					</React.Fragment>
					))}
				</TableBody>
				</Table>
			</TableContainer>
			{permissions(Permission.EditFamilyInfo) && permissions(Permission.ActivateVolunteerFamily) && <Fab color="primary" aria-label="add"
				sx={{ position: 'fixed', right: '30px', bottom: '70px' }}
				onClick={() => setCreateVolunteerFamilyDialogOpen(true)}>
				<AddIcon />
			</Fab>}
			{createVolunteerFamilyDialogOpen && <CreateVolunteerFamilyDialog onClose={(volunteerFamilyId) => {
				setCreateVolunteerFamilyDialogOpen(false);
				volunteerFamilyId && openFamily(volunteerFamilyId);
			}} />}
			</Grid>
		</Grid>
		{smsMode && <BulkSmsSideSheet selectedFamilies={selectedFamilies}
			onClose={() => setSmsMode(false)} />}
		</>
	);
}

export { VolunteerApproval };
