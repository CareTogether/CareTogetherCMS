import { Box, TableCell, TableRow, Typography } from '@mui/material';
import { CombinedFamilyInfo } from '../../GeneratedClient';
import { useState } from 'react';
import LazyLoad from 'react-lazyload';
import { familyLastName } from '../../Families/FamilyUtils';
import { TestFamilyBadge } from '../../Families/TestFamilyBadge';
import { LazyLoadMountTrigger } from '../../Utilities/LazyLoadMountTrigger';

type VolunteerProgressTableItemProps = {
  volunteerFamily: CombinedFamilyInfo;
  allApprovalAndOnboardingRequirements: string[];
  expandedView: boolean;
  openFamily: (familyId: string) => void;
  updateTestFamilyFlagEnabled?: boolean;
};

function getRowGroupHeight(expandedView: boolean, activeAdultsCount: number) {
  if (!expandedView) {
    return 39;
  }

  return 39 + activeAdultsCount * 33;
}

function VolunteerProgressPlaceholderRow(
  props: Pick<
    VolunteerProgressTableItemProps,
    'allApprovalAndOnboardingRequirements' | 'expandedView' | 'volunteerFamily'
  > & {
    onVisible: () => void;
  }
) {
  const {
    allApprovalAndOnboardingRequirements,
    expandedView,
    volunteerFamily,
    onVisible,
  } = props;
  const activeAdultsCount =
    volunteerFamily.family?.adults?.filter(
      (adult) => adult.item1 && adult.item1.active
    ).length ?? 0;
  const height = getRowGroupHeight(expandedView, activeAdultsCount);
  const columnCount = 1 + allApprovalAndOnboardingRequirements.length;

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

function VolunteerProgressTableRows(props: VolunteerProgressTableItemProps) {
  const {
    volunteerFamily,
    allApprovalAndOnboardingRequirements,
    expandedView,
    openFamily,
    updateTestFamilyFlagEnabled,
  } = props;
  const familyId = volunteerFamily.family!.id!;
  const activeAdults =
    volunteerFamily.family?.adults?.filter(
      (adult) => adult.item1 && adult.item1.active
    ) ?? [];

  return (
    <>
      <TableRow
        sx={{ backgroundColor: '#eef' }}
        onClick={() => openFamily(familyId)}
      >
        <TableCell key="1" sx={{ whiteSpace: 'nowrap' }}>
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
        {allApprovalAndOnboardingRequirements.map((actionName) => (
          <TableCell key={actionName}>
            {expandedView
              ? volunteerFamily.volunteerFamilyInfo?.missingRequirements?.some(
                  (x) => x.item1 === actionName
                )
                ? '❌'
                : volunteerFamily.volunteerFamilyInfo?.completedRequirements?.some(
                      (x) => x.requirementName === actionName
                    )
                  ? '✅'
                  : ''
              : volunteerFamily.volunteerFamilyInfo?.missingRequirements?.some(
                    (x) => x.item1 === actionName
                  ) ||
                  (volunteerFamily.volunteerFamilyInfo?.individualVolunteers &&
                    Object.entries(
                      volunteerFamily.volunteerFamilyInfo?.individualVolunteers
                    )
                      .map((y) => y[1])
                      .some((y) =>
                        y.missingRequirements?.some(
                          (x) => x.item1 === actionName
                        )
                      ))
                ? '❌'
                : volunteerFamily.volunteerFamilyInfo?.completedRequirements?.some(
                      (x) => x.requirementName === actionName
                    ) ||
                    (volunteerFamily.volunteerFamilyInfo
                      ?.individualVolunteers &&
                      Object.entries(
                        volunteerFamily.volunteerFamilyInfo
                          ?.individualVolunteers
                      )
                        .map((y) => y[1])
                        .some((y) =>
                          y.completedRequirements?.some(
                            (x) => x.requirementName === actionName
                          )
                        ))
                  ? '✅'
                  : ''}
          </TableCell>
        ))}
      </TableRow>
      {expandedView &&
        activeAdults.map((adult) => {
          const adultInfo = adult.item1;

          if (!adultInfo) {
            return null;
          }

          return (
            <TableRow key={adultInfo.id} onClick={() => openFamily(familyId)}>
              <TableCell>
                {adultInfo.lastName}, {adultInfo.firstName}
              </TableCell>
              {allApprovalAndOnboardingRequirements.map((actionName) => (
                <TableCell key={actionName}>
                  {volunteerFamily.volunteerFamilyInfo?.individualVolunteers?.[
                    adultInfo.id!
                  ]?.missingRequirements?.some((x) => x.item1 === actionName)
                    ? '❌'
                    : volunteerFamily.volunteerFamilyInfo?.individualVolunteers?.[
                          adultInfo.id!
                        ]?.completedRequirements?.some(
                          (x) => x.requirementName === actionName
                        )
                      ? '✅'
                      : ''}
                </TableCell>
              ))}
            </TableRow>
          );
        })}
    </>
  );
}

function VolunteerProgressTableItem(props: VolunteerProgressTableItemProps) {
  // We swap a placeholder row for the real row group once LazyLoad says it is close enough to render.
  const [isVisible, setIsVisible] = useState(false);

  if (isVisible) {
    return <VolunteerProgressTableRows {...props} />;
  }

  return (
    <VolunteerProgressPlaceholderRow
      {...props}
      onVisible={() => setIsVisible(true)}
    />
  );
}

export { VolunteerProgressTableItem };
