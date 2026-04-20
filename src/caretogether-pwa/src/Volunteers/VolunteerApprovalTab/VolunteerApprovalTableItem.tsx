import {
  Box,
  Checkbox,
  Grid,
  TableCell,
  TableRow,
  Typography,
} from '@mui/material';
import { CombinedFamilyInfo } from '../../GeneratedClient';
import React, { useState } from 'react';
import LazyLoad from 'react-lazyload';
import { AgeText } from '../../Families/AgeText';
import { TestFamilyBadge } from '../../Families/TestFamilyBadge';
import { VolunteerRoleApprovalStatusChip } from '../VolunteerRoleApprovalStatusChip';
import { familyLastName } from './familyLastName';
import { LazyLoadMountTrigger } from '../../Utilities/LazyLoadMountTrigger';

type VolunteerApprovalTableItemProps = {
  volunteerFamily: CombinedFamilyInfo;
  customFieldNames: string[];
  expandedView: boolean;
  smsMode: boolean;
  uncheckedFamilies: string[];
  setUncheckedFamilies: React.Dispatch<React.SetStateAction<string[]>>;
  openFamily: (familyId: string) => void;
  roleFilters: { key: string }[];
  updateTestFamilyFlagEnabled?: boolean;
};

function getRowGroupHeight(
  expandedView: boolean,
  activeAdultsCount: number,
  activeChildrenCount: number
) {
  if (!expandedView) {
    return 39;
  }

  return 39 + (activeAdultsCount + activeChildrenCount) * 33;
}

function VolunteerApprovalPlaceholderRow(
  props: Pick<
    VolunteerApprovalTableItemProps,
    'customFieldNames' | 'expandedView' | 'smsMode' | 'volunteerFamily'
  > & {
    onVisible: () => void;
  }
) {
  const {
    customFieldNames,
    expandedView,
    smsMode,
    volunteerFamily,
    onVisible,
  } = props;
  const activeAdultsCount =
    volunteerFamily.family?.adults?.filter(
      (adult) => adult.item1 && adult.item1.active
    ).length ?? 0;
  const activeChildrenCount =
    volunteerFamily.family?.children?.filter((child) => child && child.active)
      .length ?? 0;
  const columnCount = customFieldNames.length + 2 + (smsMode ? 1 : 0);
  const height = getRowGroupHeight(
    expandedView,
    activeAdultsCount,
    activeChildrenCount
  );

  return (
    <TableRow sx={{ height: `${height}px` }}>
      {/* Keep a valid table row/cell in the DOM until the row group is near the viewport. */}
      <TableCell
        colSpan={columnCount}
        sx={{ padding: 0, borderBottom: 0, backgroundColor: '#eef' }}
      >
        <LazyLoad
          once
          height={height}
          offset={300}
          placeholder={<Box sx={{ minHeight: `${height}px` }} />}
        >
          <LazyLoadMountTrigger height={height} onVisible={onVisible} />
        </LazyLoad>
      </TableCell>
    </TableRow>
  );
}

function VolunteerApprovalTableRows(props: VolunteerApprovalTableItemProps) {
  const {
    volunteerFamily,
    customFieldNames,
    expandedView,
    smsMode,
    uncheckedFamilies,
    setUncheckedFamilies,
    openFamily,
    roleFilters,
    updateTestFamilyFlagEnabled,
  } = props;
  if (!volunteerFamily.family?.id) {
    return null;
  }

  const familyId = volunteerFamily.family.id;
  const activeAdults =
    volunteerFamily.family?.adults?.filter(
      (adult) => adult.item1 && adult.item1.active
    ) ?? [];
  const activeChildren =
    volunteerFamily.family?.children?.filter(
      (child) => child && child.active
    ) ?? [];

  return (
    <>
      <TableRow
        sx={{ backgroundColor: '#eef', height: '39px' }}
        onClick={() => openFamily(familyId)}
      >
        {smsMode && (
          <TableCell key="-" sx={{ padding: 0, width: '36px' }}>
            <Checkbox
              size="small"
              checked={!uncheckedFamilies.some((x) => x === familyId)}
              onChange={(e) =>
                e.target.checked
                  ? setUncheckedFamilies(
                      uncheckedFamilies.filter((x) => x !== familyId)
                    )
                  : setUncheckedFamilies(uncheckedFamilies.concat(familyId))
              }
              onClick={(e) => e.stopPropagation()}
            />
          </TableCell>
        )}
        <TableCell key="1" colSpan={1} sx={{ whiteSpace: 'nowrap' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Typography sx={{ fontWeight: 600 }}>
              {familyLastName(volunteerFamily) + ' Family'}
            </Typography>
            {updateTestFamilyFlagEnabled && (
              <TestFamilyBadge family={volunteerFamily} />
            )}
          </span>
        </TableCell>
        <TableCell>
          {expandedView ? (
            roleFilters.map((roleFilter, index) => (
              <VolunteerRoleApprovalStatusChip
                key={index}
                sx={{ margin: '.125rem .25rem .125rem 0' }}
                roleName={roleFilter.key}
                status={
                  volunteerFamily.volunteerFamilyInfo?.familyRoleApprovals?.[
                    roleFilter.key
                  ]?.effectiveRoleApprovalStatus
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
                      sx={{ margin: '.125rem .25rem .125rem 0' }}
                      roleName={roleFilter.key}
                      status={
                        volunteerFamily.volunteerFamilyInfo
                          ?.familyRoleApprovals?.[roleFilter.key]
                          ?.effectiveRoleApprovalStatus
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
                          ?.individualVolunteers?.[adult.item1!.id!]
                          .approvalStatusByRole || {}
                      ).map(([role, roleApprovalStatus]) => (
                        <VolunteerRoleApprovalStatusChip
                          key={role}
                          sx={{ margin: '.125rem .25rem .125rem 0' }}
                          roleName={role}
                          status={
                            roleApprovalStatus.effectiveRoleApprovalStatus
                          }
                        />
                      ));
                    })
                    .reduce((prev, curr) => {
                      if (prev.some((x) => x.key === curr[0].key)) {
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
              (value) => value?.customFieldName === customFieldName
            );
          const familyCustomFieldValue = familyCustomField?.value;
          if (familyCustomFieldValue === null) {
            return <TableCell key={customFieldName}></TableCell>;
          }
          if (familyCustomFieldValue === true) {
            return <TableCell key={customFieldName}>Yes</TableCell>;
          }
          if (familyCustomFieldValue === false) {
            return <TableCell key={customFieldName}>No</TableCell>;
          }
          return (
            <TableCell key={customFieldName}>
              {familyCustomFieldValue}
            </TableCell>
          );
        })}
      </TableRow>
      {expandedView &&
        activeAdults.map((adult) => (
          <TableRow
            key={`${familyId}:${adult.item1!.id}`}
            onClick={() => openFamily(familyId)}
          >
            {smsMode && <TableCell />}
            <TableCell>
              {adult.item1!.lastName}, {adult.item1!.firstName}
            </TableCell>
            <TableCell>
              {Object.entries(
                volunteerFamily.volunteerFamilyInfo?.individualVolunteers?.[
                  adult.item1!.id!
                ].approvalStatusByRole || {}
              ).map(([role, roleApprovalStatus]) => (
                <VolunteerRoleApprovalStatusChip
                  key={role}
                  roleName={role}
                  status={roleApprovalStatus.effectiveRoleApprovalStatus}
                  sx={{ margin: '.125rem .25rem .125rem 0' }}
                />
              ))}
            </TableCell>
            {customFieldNames.map((fieldName) => (
              <TableCell key={fieldName}></TableCell>
            ))}
          </TableRow>
        ))}
      {expandedView &&
        activeChildren.map((child) => (
          <TableRow
            key={`${familyId}:${child.id}`}
            onClick={() => openFamily(familyId)}
            sx={{ color: 'ddd', fontStyle: 'italic' }}
          >
            {smsMode && <TableCell />}
            <TableCell>
              {child.lastName}, {child.firstName} (age{' '}
              <AgeText age={child.age} />)
            </TableCell>
            <TableCell></TableCell>
            {customFieldNames.map((fieldName) => (
              <TableCell key={fieldName}></TableCell>
            ))}
          </TableRow>
        ))}
    </>
  );
}

function VolunteerApprovalTableItem(props: VolunteerApprovalTableItemProps) {
  // We swap a placeholder row for the real row group once LazyLoad says it is close enough to render.
  const [isVisible, setIsVisible] = useState(false);

  if (isVisible) {
    return <VolunteerApprovalTableRows {...props} />;
  }

  return (
    <VolunteerApprovalPlaceholderRow
      {...props}
      onVisible={() => setIsVisible(true)}
    />
  );
}

export { VolunteerApprovalTableItem };
