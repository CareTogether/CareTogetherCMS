import {
  Grid,
  Table,
  TableContainer,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Fab,
  useMediaQuery,
  useTheme,
  Button,
  ButtonGroup,
  Checkbox,
  IconButton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Box,
} from '@mui/material';
import {
  CombinedFamilyInfo,
  CustomFieldType,
  EmailAddress,
  Permission,
  VolunteerInfo,
} from '../../GeneratedClient';
import { useRecoilState, useRecoilValue } from 'recoil';
import { volunteerFamiliesData } from '../../Model/VolunteersModel';
import {
  organizationConfigurationQuery,
  policyData,
} from '../../Model/ConfigurationModel';
import React, { useEffect, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import SmsIcon from '@mui/icons-material/Sms';
import EmailIcon from '@mui/icons-material/Email';
import { CreateVolunteerFamilyDialog } from '../CreateVolunteerFamilyDialog';
import { Link, useLocation } from 'react-router-dom';
import { SearchBar } from '../../Shell/SearchBar';
import { useLocalStorage } from '../../Hooks/useLocalStorage';
import { useScrollMemory } from '../../Hooks/useScrollMemory';
import { useAllVolunteerFamiliesPermissions } from '../../Model/SessionModel';
import { BulkSmsSideSheet } from '../BulkSmsSideSheet';
import { useWindowSize } from '../../Hooks/useWindowSize';
import useScreenTitle from '../../Shell/ShellScreenTitle';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import { useLoadable } from '../../Hooks/useLoadable';
import { ProgressBackdrop } from '../../Shell/ProgressBackdrop';
import { selectedLocationContextState } from '../../Model/Data';
import { useAppNavigate } from '../../Hooks/useAppNavigate';
import { VolunteerRoleApprovalStatusChip } from '../VolunteerRoleApprovalStatusChip';
import { useGlobalSnackBar } from '../../Hooks/useGlobalSnackBar';
import { statusFiltersState } from './statusFiltersState';
import { checkStatusEquivalence } from './checkStatusEquivalence';
import { familyLastName } from './familyLastName';
import { simplify } from './simplify';
import { filterType } from './filterType';
import { roleFiltersState } from './roleFiltersState';
import { VolunteerFilter } from './VolunteerFilter';
import { catchAllLabel } from './catchAllLabel';
import { getOptionValueFromSelection } from './getOptionValueFromSelection';
import { getUpdatedFilters } from './getUpdatedFilters';
import { CustomFieldsFilter } from './CustomFieldsFilter';

function VolunteerApproval(props: { onOpen: () => void }) {
  const { onOpen } = props;
  useEffect(onOpen);
  const appNavigate = useAppNavigate();
  const [uncheckedFamilies, setUncheckedFamilies] = useState<string[]>([]);

  const policy = useRecoilValue(policyData);

  const customFieldNames =
    policy.customFamilyFields?.map((field) => field.name) || [];

  const [customFieldFilters, setCustomFieldFilters] = useState<
    Record<string, string[]>
  >({});

  console.log('customFieldFilters', customFieldFilters);

  //#region Role/Status Selection Code
  const [roleFilters, setRoleFilters] = useRecoilState(roleFiltersState);
  const [statusFilters, setStatusFilters] = useRecoilState(statusFiltersState);

  function changeRoleFilterSelection(selection: string | string[]) {
    setUncheckedFamilies([]);
    const filterOptionToUpdate = roleFilters.find(
      (filter) => filter.value === getOptionValueFromSelection(selection)
    );
    setRoleFilters(getUpdatedFilters(roleFilters, filterOptionToUpdate!));
  }

  function changeStatusFilterSelection(selection: string | string[]) {
    setUncheckedFamilies([]);
    const filterOptionToUpdate = statusFilters.find(
      (filter) => filter.value === getOptionValueFromSelection(selection)
    );
    setStatusFilters(getUpdatedFilters(statusFilters, filterOptionToUpdate!));
  }

  function changeCustomFieldFilter(fieldName: string, value: string[]) {
    setUncheckedFamilies([]);

    setCustomFieldFilters((prevFilters) => {
      const newValue = prevFilters[fieldName] === value ? [] : value;

      return {
        ...prevFilters,
        [fieldName]: newValue,
      };
    });
  }
  //#endregion

  // The array object returned by Recoil is read-only. We need to copy it before we can do an in-place sort.
  const volunteerFamiliesLoadable = useLoadable(volunteerFamiliesData);
  const volunteerFamilies = (volunteerFamiliesLoadable || [])
    .map((x) => x)
    .sort((a, b) =>
      familyLastName(a) < familyLastName(b)
        ? -1
        : familyLastName(a) > familyLastName(b)
          ? 1
          : 0
    );
  const [filterText, setFilterText] = useState('');

  //#region Family/Individual Filtering Code
  const selectedFamilyRoleKeys = roleFilters
    .filter(
      (filterOption) =>
        filterOption.selected && filterOption.type !== filterType.Individual
    )
    .map((filterOption) => filterOption.key);
  const selectedIndividualRoleKeys = roleFilters
    .filter(
      (filterOption) =>
        filterOption.selected && filterOption.type !== filterType.Family
    )
    .map((filterOption) => filterOption.key);
  const selectedStatusKeys = statusFilters
    .filter((filterOption) => filterOption.selected)
    .map((filterOption) => filterOption.value);

  //#region Family-Specific Methods
  function familyHasNoValidRoles(family: CombinedFamilyInfo) {
    return roleFilters.every(
      (filterOption) =>
        !familyHasSpecificRoleInValidStatus(family, filterOption.key)
    );
  }

  function familyHasNoValidStatuses(family: CombinedFamilyInfo) {
    return statusFilters.every(
      (filterOption) =>
        family.volunteerFamilyInfo?.familyRoleApprovals?.[filterOption.key] ===
        undefined
    );
  }

  function familyHasSpecificRoleInValidStatus(
    family: CombinedFamilyInfo,
    roleName: string
  ) {
    return statusFilters
      .filter((filterOption) => filterOption.key !== catchAllLabel)
      .some((status) =>
        checkStatusEquivalence(
          status.value,
          family.volunteerFamilyInfo?.familyRoleApprovals?.[roleName]
            ?.currentStatus
        )
      );
  }

  function familyMeetsFilterCriteria(family: CombinedFamilyInfo) {
    if (!selectedFamilyRoleKeys.length) {
      if (!selectedStatusKeys.length) {
        return selectedIndividualRoleKeys.length === 0;
      }
      return selectedStatusKeys.some((status) =>
        status === catchAllLabel
          ? familyHasNoValidStatuses(family)
          : roleFilters.some((roleFilter) =>
              checkStatusEquivalence(
                status,
                family.volunteerFamilyInfo?.familyRoleApprovals?.[
                  roleFilter.key
                ]?.currentStatus
              )
            )
      );
    }
    return selectedFamilyRoleKeys.some((roleName) => {
      const noValidRoles = familyHasNoValidRoles(family);
      const familyHasRole =
        roleName !== catchAllLabel
          ? family.volunteerFamilyInfo?.familyRoleApprovals?.[roleName] !==
            undefined
          : noValidRoles;
      if (!familyHasRole || (roleName === catchAllLabel && noValidRoles)) {
        return familyHasRole;
      }
      if (selectedStatusKeys.length === 0) {
        return (
          familyHasSpecificRoleInValidStatus(family, roleName) ||
          (roleName === catchAllLabel && familyHasRole)
        );
      }
      return selectedStatusKeys.some((status) =>
        checkStatusEquivalence(
          status,
          family.volunteerFamilyInfo?.familyRoleApprovals?.[roleName]
            ?.currentStatus
        )
      );
    });
  }
  //#endregion

  //#region Family Member-Specific Methods
  function getFamilyMembers(family: CombinedFamilyInfo) {
    return (
      (family.volunteerFamilyInfo?.individualVolunteers &&
        Object.entries(family.volunteerFamilyInfo?.individualVolunteers)) ||
      []
    );
  }

  function familyMemberHasNoValidRoles(family: CombinedFamilyInfo) {
    return (
      getFamilyMembers(family).filter(([, volunteer]) =>
        roleFilters.every((filterOption) => {
          return !familyMemberHasSpecificRoleInValidStatus(
            volunteer,
            filterOption.key
          );
        })
      ).length > 0
    );
  }

  function familyMemberHasNoValidStatuses(volunteer: VolunteerInfo) {
    return statusFilters.every((filterOption) =>
      checkStatusEquivalence(
        volunteer.approvalStatusByRole?.[filterOption.key].currentStatus,
        null
      )
    );
  }

  function familyMemberHasSpecificRoleInValidStatus(
    volunteer: VolunteerInfo,
    roleName: string
  ) {
    return statusFilters
      .filter((filterOption) => filterOption.key !== catchAllLabel)
      .some((status) =>
        checkStatusEquivalence(
          status.value,
          volunteer.approvalStatusByRole?.[roleName]?.currentStatus
        )
      );
  }

  function familyMemberHasARoleInSelectedStatus(
    volunteer: VolunteerInfo,
    status: string
  ) {
    return status === catchAllLabel
      ? familyMemberHasNoValidStatuses(volunteer)
      : roleFilters.some((roleFilter) =>
          checkStatusEquivalence(
            volunteer.approvalStatusByRole?.[roleFilter.key]?.currentStatus,
            status
          )
        );
  }

  function familyMembersMeetFilterCriteria(family: CombinedFamilyInfo) {
    const familyMembers = getFamilyMembers(family);
    if (!selectedIndividualRoleKeys.length) {
      if (!selectedStatusKeys.length) {
        return !selectedFamilyRoleKeys.length;
      }
      return selectedStatusKeys.some(
        (status) =>
          familyMembers.filter(([, volunteer]) =>
            familyMemberHasARoleInSelectedStatus(
              volunteer,
              status ? status : catchAllLabel
            )
          ).length > 0
      );
    }
    return selectedIndividualRoleKeys.some((roleName) => {
      return familyMembers.some(([, volunteer]) => {
        const noValidRoles = familyMemberHasNoValidRoles(family);
        const familyMembersHaveRole =
          roleName !== catchAllLabel
            ? familyMemberHasSpecificRoleInValidStatus(volunteer, roleName)
            : noValidRoles;
        if (roleName === catchAllLabel && noValidRoles) {
          return familyMembersHaveRole;
        }
        if (!selectedStatusKeys.length) {
          return familyMemberHasSpecificRoleInValidStatus(volunteer, roleName);
        }
        return selectedStatusKeys.some((status) =>
          checkStatusEquivalence(
            status,
            volunteer.approvalStatusByRole?.[roleName]?.currentStatus
          )
        );
      });
    });
  }
  //#endregion

  function familyOrFamilyMembersMeetFilterCriteria(family: CombinedFamilyInfo) {
    const familyMeetsRoleCriteria = familyMeetsFilterCriteria(family);
    const familyMembersMeetRoleCriteria =
      familyMembersMeetFilterCriteria(family);
    const familyRolesSelected = selectedFamilyRoleKeys.length > 0;
    const individualRolesSelected = selectedIndividualRoleKeys.length > 0;
    const statusesSelected = selectedStatusKeys.length > 0;
    let result = true;
    if (familyRolesSelected && individualRolesSelected) {
      result = familyMeetsRoleCriteria || familyMembersMeetRoleCriteria;
    } else if (familyRolesSelected) {
      result = familyMeetsRoleCriteria;
    } else if (individualRolesSelected) {
      result = familyMembersMeetRoleCriteria;
    } else if (statusesSelected) {
      result = familyMeetsRoleCriteria || familyMembersMeetRoleCriteria;
    }
    return result;
  }
  //#endregion

  function familyMatchesCustomFieldFilters(family: CombinedFamilyInfo) {
    return Object.entries(customFieldFilters).every(
      ([fieldName, selectedValue]) => {
        if (!selectedValue || selectedValue.length === 0) {
          return true;
        }

        const field = family.family?.completedCustomFields?.find(
          (customField) => customField.customFieldName === fieldName
        );

        if (!field) {
          return selectedValue.includes('(blank)');
        }

        if (field.customFieldType === CustomFieldType.Boolean) {
          const fieldValueAsString = field.value === true ? 'Yes' : 'No';
          return selectedValue.includes(fieldValueAsString);
        }

        if (selectedValue.includes(field.value?.toString())) {
          return true;
        }

        return false;
      }
    );
  }

  const filteredVolunteerFamilies = volunteerFamilies.filter(
    (family) =>
      /* Filter by name */ (filterText.length === 0 ||
        family.family?.adults?.some((adult) =>
          simplify(
            `${adult.item1?.firstName} ${adult.item1?.lastName}`
          ).includes(filterText.toLowerCase())
        ) ||
        family.family?.children?.some((child) =>
          simplify(`${child?.firstName} ${child?.lastName}`).includes(
            filterText.toLowerCase()
          )
        )) &&
      familyOrFamilyMembersMeetFilterCriteria(family) &&
      familyMatchesCustomFieldFilters(family)
  );

  const selectedFamilies = filteredVolunteerFamilies.filter(
    (family) => !uncheckedFamilies.some((f) => f === family.family!.id!)
  );

  useScrollMemory();

  function openFamily(familyId: string) {
    appNavigate.family(familyId);
  }
  const [createVolunteerFamilyDialogOpen, setCreateVolunteerFamilyDialogOpen] =
    useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();

  const [expandedView, setExpandedView] = useLocalStorage(
    'volunteer-approval-expanded',
    true
  );
  const handleExpandCollapse = (
    _event: React.MouseEvent<HTMLElement>,
    newExpandedView: boolean | null
  ) => {
    if (newExpandedView !== null) {
      setExpandedView(newExpandedView);
    }
  };

  const { locationId } = useRecoilValue(selectedLocationContextState);
  const organizationConfiguration = useRecoilValue(
    organizationConfigurationQuery
  );
  const smsSourcePhoneNumbers = organizationConfiguration?.locations?.find(
    (loc) => loc.id === locationId
  )?.smsSourcePhoneNumbers;
  const [smsMode, setSmsMode] = useState(false);

  function getSelectedFamiliesContactEmails() {
    return selectedFamilies
      .map((family) => {
        const primaryContactPerson = family.family?.adults?.find(
          (adult) =>
            adult.item1?.id === family.family?.primaryFamilyContactPersonId
        );
        const preferredEmailAddress =
          primaryContactPerson?.item1?.emailAddresses?.find(
            (email) =>
              email.id === primaryContactPerson.item1?.preferredEmailAddressId
          );
        return preferredEmailAddress;
      })
      .filter((email) => typeof email !== 'undefined') as EmailAddress[];
  }

  const { setAndShowGlobalSnackBar } = useGlobalSnackBar();

  function copyEmailAddresses() {
    const emailAddresses = getSelectedFamiliesContactEmails();
    navigator.clipboard.writeText(
      emailAddresses.map((email) => email.address).join('; ')
    );
    setAndShowGlobalSnackBar(
      `Found and copied ${getSelectedFamiliesContactEmails().length} email addresses for ${selectedFamilies.length} selected families to clipboard`
    );
  }

  const windowSize = useWindowSize();

  const permissions = useAllVolunteerFamiliesPermissions();

  useScreenTitle('Volunteers');

  return !volunteerFamiliesLoadable ? (
    <ProgressBackdrop>
      <p>Loading families...</p>
    </ProgressBackdrop>
  ) : (
    <>
      <Grid
        container
        sx={{
          paddingRight: smsMode && !isMobile ? '400px' : null,
          height:
            smsMode && isMobile ? `${windowSize.height - 500 - 24}px` : null,
          overflow: smsMode && isMobile ? 'scroll' : null,
        }}
      >
        <Grid item xs={12}>
          <Stack direction="row-reverse" sx={{ marginTop: 1 }}>
            <ToggleButtonGroup
              value={expandedView}
              exclusive
              onChange={handleExpandCollapse}
              size={isMobile ? 'medium' : 'small'}
              aria-label="row expansion"
            >
              <ToggleButton value={true} aria-label="expanded">
                <UnfoldMoreIcon />
              </ToggleButton>
              <ToggleButton value={false} aria-label="collapsed">
                <UnfoldLessIcon />
              </ToggleButton>
            </ToggleButtonGroup>
            <SearchBar
              value={filterText}
              onChange={(value) => {
                setUncheckedFamilies([]);
                setFilterText(value);
              }}
            />
            {permissions(Permission.SendBulkSms) && (
              <IconButton
                color="inherit"
                aria-label="copy email addresses"
                onClick={() => copyEmailAddresses()}
                sx={{}}
              >
                <EmailIcon />
              </IconButton>
            )}
            {permissions(Permission.SendBulkSms) &&
              smsSourcePhoneNumbers &&
              smsSourcePhoneNumbers.length > 0 && (
                <IconButton
                  color={smsMode ? 'secondary' : 'inherit'}
                  aria-label="send bulk sms"
                  onClick={() => setSmsMode(!smsMode)}
                  sx={{ marginRight: 2 }}
                >
                  <SmsIcon sx={{ position: 'relative', top: 1 }} />
                </IconButton>
              )}

            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                gap: '.75rem',
                marginRight: '.75rem',
                alignItems: 'center',
              }}
            >
              <VolunteerFilter
                label="Roles"
                options={roleFilters}
                setSelected={changeRoleFilterSelection}
              />
              <VolunteerFilter
                label="Statuses"
                options={statusFilters}
                setSelected={changeStatusFilterSelection}
              />
              <CustomFieldsFilter
                customFamilyFields={policy.customFamilyFields || []}
                volunteerFamilies={volunteerFamilies}
                customFieldFilters={customFieldFilters}
                changeCustomFieldFilter={changeCustomFieldFilter}
              />
            </Box>
            <ButtonGroup
              variant="text"
              color="inherit"
              aria-label="text inherit button group"
              style={{ flexGrow: 1 }}
            >
              <Button
                color={
                  location.pathname.endsWith('/volunteers/approval')
                    ? 'secondary'
                    : 'inherit'
                }
                component={Link}
                to={'../approval'}
              >
                Approvals
              </Button>
              <Button
                color={
                  location.pathname.endsWith('/volunteers/progress')
                    ? 'secondary'
                    : 'inherit'
                }
                component={Link}
                to={'../progress'}
              >
                Progress
              </Button>
            </ButtonGroup>
          </Stack>
        </Grid>
        <Grid item xs={12}>
          <TableContainer>
            <Table sx={{ minWidth: '700px' }} size="small">
              <TableHead>
                <TableRow sx={{ height: '40px' }}>
                  {smsMode && (
                    <TableCell sx={{ padding: 0, width: '36px' }}>
                      <Checkbox
                        size="small"
                        checked={uncheckedFamilies.length === 0}
                        onChange={(e) =>
                          e.target.checked
                            ? setUncheckedFamilies([])
                            : setUncheckedFamilies(
                                filteredVolunteerFamilies.map(
                                  (f) => f.family!.id!
                                )
                              )
                        }
                      />
                    </TableCell>
                  )}
                  {expandedView ? (
                    <TableCell>Last Name, First Name</TableCell>
                  ) : (
                    <TableCell>Family</TableCell>
                  )}
                  <TableCell>Roles</TableCell>

                  {customFieldNames.map((fieldName) => (
                    <TableCell key={fieldName}>{fieldName}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredVolunteerFamilies.map((volunteerFamily) => {
                  return (
                    <React.Fragment key={volunteerFamily.family?.id}>
                      <TableRow
                        sx={{ backgroundColor: '#eef', height: '39px' }}
                        onClick={() => openFamily(volunteerFamily.family!.id!)}
                      >
                        {smsMode && (
                          <TableCell key="-" sx={{ padding: 0, width: '36px' }}>
                            <Checkbox
                              size="small"
                              checked={
                                !uncheckedFamilies.some(
                                  (x) => x === volunteerFamily.family!.id!
                                )
                              }
                              onChange={(e) =>
                                e.target.checked
                                  ? setUncheckedFamilies(
                                      uncheckedFamilies.filter(
                                        (x) => x !== volunteerFamily.family!.id!
                                      )
                                    )
                                  : setUncheckedFamilies(
                                      uncheckedFamilies.concat(
                                        volunteerFamily.family!.id!
                                      )
                                    )
                              }
                              onClick={(e) => e.stopPropagation()}
                            />
                          </TableCell>
                        )}
                        <TableCell key="1" colSpan={expandedView ? 1 : 1}>
                          <Typography sx={{ fontWeight: 600 }}>
                            {familyLastName(volunteerFamily) + ' Family'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {expandedView ? (
                            roleFilters.map((roleFilter, index) => (
                              <VolunteerRoleApprovalStatusChip
                                key={index}
                                sx={{ margin: '.125rem .25rem .125rem 0' }}
                                roleName={roleFilter.key}
                                status={
                                  volunteerFamily.volunteerFamilyInfo
                                    ?.familyRoleApprovals?.[roleFilter.key]
                                    ?.effectiveRoleApprovalStatus
                                }
                              />
                            ))
                          ) : (
                            <>
                              <Grid
                                container
                                spacing={2}
                                sx={{
                                  height: '50%',
                                  margin: 0,
                                  flexGrow: 1,
                                  justifyContent: 'flex-start',
                                }}
                              >
                                <Grid
                                  item
                                  xs={1}
                                  sx={{
                                    minWidth: '100px',
                                    marginLeft: '-1rem',
                                    marginTop: '-.5rem',
                                  }}
                                >
                                  <Typography
                                    sx={{
                                      margin: 0,
                                      padding: 0,
                                      minWidth: 'max-content',
                                    }}
                                  >
                                    Family:
                                  </Typography>
                                </Grid>
                                <Grid
                                  item
                                  xs={11}
                                  sx={{
                                    justifyContent: 'flex-start',
                                    marginLeft: '-1rem',
                                    marginTop: '-.5rem',
                                  }}
                                >
                                  {roleFilters.map((roleFilter, index) => (
                                    <VolunteerRoleApprovalStatusChip
                                      key={index}
                                      sx={{
                                        margin: '.125rem .25rem .125rem 0',
                                      }}
                                      roleName={roleFilter.key}
                                      status={
                                        volunteerFamily.volunteerFamilyInfo
                                          ?.familyRoleApprovals?.[
                                          roleFilter.key
                                        ]?.effectiveRoleApprovalStatus
                                      }
                                    />
                                  ))}
                                </Grid>
                              </Grid>
                              <Grid
                                container
                                spacing={2}
                                sx={{
                                  height: '50%',
                                  margin: 0,
                                  flexGrow: 1,
                                  justifyContent: 'flex-start',
                                }}
                              >
                                <Grid
                                  item
                                  xs={1}
                                  sx={{
                                    minWidth: '100px',
                                    marginLeft: '-1rem',
                                    marginTop: '-.5rem',
                                  }}
                                >
                                  <Typography sx={{ margin: 0, padding: 0 }}>
                                    Individual:
                                  </Typography>
                                </Grid>
                                <Grid
                                  item
                                  xs={11}
                                  sx={{
                                    justifyContent: 'flex-start',
                                    marginLeft: '-1rem',
                                    marginTop: '-.5rem',
                                  }}
                                >
                                  {volunteerFamily.family?.adults
                                    ?.map((adult) => {
                                      return Object.entries(
                                        volunteerFamily.volunteerFamilyInfo
                                          ?.individualVolunteers?.[
                                          adult.item1!.id!
                                        ].approvalStatusByRole || {}
                                      ).map(([role, roleApprovalStatus]) => (
                                        <VolunteerRoleApprovalStatusChip
                                          key={role}
                                          sx={{
                                            margin: '.125rem .25rem .125rem 0',
                                          }}
                                          roleName={role}
                                          status={
                                            roleApprovalStatus.effectiveRoleApprovalStatus
                                          }
                                        />
                                      ));
                                    })
                                    .reduce((prev, curr) => {
                                      if (
                                        prev.some((x) => x.key === curr[0].key)
                                      ) {
                                        return prev;
                                      }
                                      return prev.concat(curr);
                                    }, [] as JSX.Element[])}
                                </Grid>
                              </Grid>
                            </>
                          )}
                        </TableCell>
                        {customFieldNames.map((customFieldName) => {
                          const familyCustomField =
                            volunteerFamily.family?.completedCustomFields?.find(
                              (familyCustomField) =>
                                familyCustomField?.customFieldName ===
                                customFieldName
                            );
                          const familyCustomFieldValue =
                            familyCustomField?.value;
                          if (familyCustomFieldValue === null) {
                            return (
                              <TableCell key={customFieldName}></TableCell>
                            );
                          }
                          if (familyCustomFieldValue === true) {
                            return (
                              <TableCell key={customFieldName}>Yes</TableCell>
                            );
                          }
                          if (familyCustomFieldValue === false) {
                            return (
                              <TableCell key={customFieldName}>No</TableCell>
                            );
                          }
                          return (
                            <TableCell key={customFieldName}>
                              {familyCustomFieldValue}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                      {expandedView &&
                        volunteerFamily.family?.adults?.map(
                          (adult) =>
                            adult.item1 &&
                            adult.item1.active && (
                              <TableRow
                                key={
                                  volunteerFamily.family?.id +
                                  ':' +
                                  adult.item1.id
                                }
                                onClick={() =>
                                  openFamily(volunteerFamily.family!.id!)
                                }
                              >
                                {smsMode && <TableCell />}
                                <TableCell>
                                  {adult.item1.lastName},{' '}
                                  {adult.item1.firstName}
                                </TableCell>
                                <TableCell>
                                  {Object.entries(
                                    volunteerFamily.volunteerFamilyInfo
                                      ?.individualVolunteers?.[adult.item1!.id!]
                                      .approvalStatusByRole || {}
                                  ).map(([role, roleApprovalStatus]) => (
                                    <VolunteerRoleApprovalStatusChip
                                      key={role}
                                      roleName={role}
                                      status={
                                        roleApprovalStatus.effectiveRoleApprovalStatus
                                      }
                                      sx={{
                                        margin: '.125rem .25rem .125rem 0',
                                      }}
                                    />
                                  ))}
                                </TableCell>
                                {customFieldNames.map((fieldName) => (
                                  <TableCell key={fieldName}></TableCell>
                                ))}
                              </TableRow>
                            )
                        )}
                      {expandedView &&
                        volunteerFamily.family?.children?.map(
                          (child) =>
                            child &&
                            child.active && (
                              <TableRow
                                key={
                                  volunteerFamily.family?.id + ':' + child.id
                                }
                                onClick={() =>
                                  openFamily(volunteerFamily.family!.id!)
                                }
                                sx={{ color: 'ddd', fontStyle: 'italic' }}
                              >
                                {smsMode && <TableCell />}
                                <TableCell>
                                  {child.lastName}, {child.firstName}
                                </TableCell>
                                <TableCell></TableCell>
                                {customFieldNames.map((fieldName) => (
                                  <TableCell key={fieldName}></TableCell>
                                ))}
                              </TableRow>
                            )
                        )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          {permissions(Permission.EditFamilyInfo) &&
            permissions(Permission.ActivateVolunteerFamily) && (
              <Fab
                color="primary"
                aria-label="add"
                sx={{ position: 'fixed', right: '30px', bottom: '70px' }}
                onClick={() => setCreateVolunteerFamilyDialogOpen(true)}
              >
                <AddIcon />
              </Fab>
            )}
          {createVolunteerFamilyDialogOpen && (
            <CreateVolunteerFamilyDialog
              onClose={(volunteerFamilyId) => {
                setCreateVolunteerFamilyDialogOpen(false);
                volunteerFamilyId && openFamily(volunteerFamilyId);
              }}
            />
          )}
        </Grid>
      </Grid>
      {smsMode && (
        <BulkSmsSideSheet
          selectedFamilies={selectedFamilies}
          onClose={() => setSmsMode(false)}
        />
      )}
    </>
  );
}

export { VolunteerApproval };
