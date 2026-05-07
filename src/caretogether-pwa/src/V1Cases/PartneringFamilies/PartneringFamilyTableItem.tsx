import { Box, Grid, TableCell, TableRow } from '@mui/material';
import { format } from 'date-fns';
import { useState } from 'react';
import { Phone as PhoneIcon } from '@mui/icons-material';
import {
  ArrangementPhase,
  CompletedCustomFieldInfo,
  V1CaseCloseReason,
} from '../../GeneratedClient';
import { FamilyName } from '../../Families/FamilyName';
import { TestFamilyBadge } from '../../Families/TestFamilyBadge';
import { LazyLoadMountTrigger } from '../../Utilities/LazyLoadMountTrigger';
import { LazyLoad } from '../../Utilities/reactLazyLoadInterop';
import { ArrangementCard } from '../Arrangements/ArrangementCard';
import { matchingArrangements } from './arrangementHelpers';
import { PartneringFamilyTableItemProps } from './types';
import { getFamilyCounty } from '../../Utilities/getFamilyCounty';

function getPartneringFamilyRowGroupHeight(
  expandedView: boolean,
  matchingArrangementCount: number
) {
  if (!expandedView) {
    return 52;
  }

  return 140 + Math.ceil(matchingArrangementCount / 3) * 120;
}

function PartneringFamilyPlaceholderRow(
  props: Pick<
    PartneringFamilyTableItemProps,
    | 'arrangementTypes'
    | 'arrangementsFilter'
    | 'expandedView'
    | 'partneringFamily'
    | 'referralCustomFields'
  > & {
    onVisible: () => void;
  }
) {
  const {
    arrangementTypes,
    arrangementsFilter,
    expandedView,
    partneringFamily,
    referralCustomFields,
    onVisible,
  } = props;
  const arrangementCount = matchingArrangements(
    partneringFamily.partneringFamilyInfo!,
    arrangementsFilter
  ).length;
  const height = getPartneringFamilyRowGroupHeight(
    expandedView,
    arrangementCount
  );
  const columnCount =
    2 +
    referralCustomFields.length +
    (expandedView ? 0 : arrangementTypes.length);

  return (
    <TableRow sx={{ height: `${height}px` }}>
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

function PartneringFamilyTableRows(props: PartneringFamilyTableItemProps) {
  const {
    partneringFamily,
    arrangementTypes,
    arrangementsFilter,
    expandedView,
    openArrangement,
    openFamily,
    referralCustomFields,
    arrangementStatusSummary,
    updateTestFamilyFlagEnabled,
  } = props;
  const primaryFamilyContactPersonId =
    partneringFamily.family?.primaryFamilyContactPersonId;
  const primaryContactPerson = partneringFamily.family?.adults?.find(
    (adult) => adult.item1?.id === primaryFamilyContactPersonId
  )?.item1;
  const phoneNumber = primaryContactPerson?.phoneNumbers?.[0]?.number;
  const comments =
    partneringFamily.partneringFamilyInfo?.openV1Case?.comments ?? '';
  const preview =
    comments.length > 500 ? comments.slice(0, 500) + '...' : comments;
  const familyId = partneringFamily.family!.id!;
  const arrangementEntries = matchingArrangements(
    partneringFamily.partneringFamilyInfo!,
    arrangementsFilter
  );
  const openV1Case = partneringFamily.partneringFamilyInfo?.openV1Case;
  const closedV1Cases =
    partneringFamily.partneringFamilyInfo?.closedV1Cases ?? [];
  const latestClosedV1Case =
    closedV1Cases.length > 0 ? closedV1Cases[closedV1Cases.length - 1] : null;
  const caseStatusText = openV1Case
    ? 'Open since ' + format(openV1Case.openedAtUtc!, 'MM/dd/yyyy')
    : latestClosedV1Case?.closeReason != null
      ? 'Closed - ' + V1CaseCloseReason[latestClosedV1Case.closeReason]
      : 'No case';

  return (
    <>
      <TableRow
        sx={{ backgroundColor: '#eef', cursor: 'pointer' }}
        onClick={() => openFamily(familyId)}
      >
        <TableCell>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <FamilyName family={partneringFamily} />
            {phoneNumber && (
              <>
                <PhoneIcon
                  sx={{
                    color: '#8B0000',
                    fontSize: 16,
                    marginLeft: '5px',
                  }}
                />
                <span style={{ color: 'black' }}>{phoneNumber}</span>
              </>
            )}
            {updateTestFamilyFlagEnabled && (
              <TestFamilyBadge family={partneringFamily} />
            )}
          </span>
        </TableCell>
        <TableCell>{caseStatusText}</TableCell>
        <TableCell>{getFamilyCounty(partneringFamily)}</TableCell>
        {!expandedView ? (
          arrangementTypes.map((arrangementType) => (
            <TableCell key={arrangementType}>
              <div
                style={{
                  display: 'flex',
                  rowGap: '5px',
                  columnGap: '8px',
                  flexWrap: 'wrap',
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                }}
              >
                {arrangementStatusSummary(
                  partneringFamily.partneringFamilyInfo!,
                  ArrangementPhase.SettingUp,
                  arrangementType
                )}
                <div>
                  {arrangementStatusSummary(
                    partneringFamily.partneringFamilyInfo!,
                    ArrangementPhase.ReadyToStart,
                    arrangementType
                  )}
                </div>
                <div>
                  {arrangementStatusSummary(
                    partneringFamily.partneringFamilyInfo!,
                    ArrangementPhase.Started,
                    arrangementType
                  )}
                </div>
                <div>
                  {arrangementStatusSummary(
                    partneringFamily.partneringFamilyInfo!,
                    ArrangementPhase.Ended,
                    arrangementType
                  )}
                </div>
              </div>
            </TableCell>
          ))
        ) : (
          <></>
        )}
        {referralCustomFields.map((field) => {
          const completedFields =
            partneringFamily.partneringFamilyInfo?.openV1Case
              ?.completedCustomFields ?? [];

          const matchingField = completedFields.find(
            (customField: CompletedCustomFieldInfo) =>
              customField.customFieldName === field.name
          );

          const fieldValue = matchingField?.value;
          const displayValue =
            fieldValue === true
              ? 'Yes'
              : fieldValue === false
                ? 'No'
                : fieldValue === undefined || fieldValue === null
                  ? ''
                  : fieldValue.toString();

          return (
            <TableCell key={field.name} sx={{ textAlign: 'center' }}>
              {displayValue}
            </TableCell>
          );
        })}
      </TableRow>
      {expandedView ? (
        <TableRow onClick={() => openFamily(familyId)}>
          <TableCell sx={{ maxWidth: '400px', paddingLeft: 3 }}>
            <Box
              sx={{
                whiteSpace: 'pre-wrap',
                overflowWrap: 'break-word',
              }}
            >
              {preview}
            </Box>
          </TableCell>

          <TableCell>
            <Grid container spacing={2}>
              {arrangementEntries.map((arrangementEntry) => (
                <Grid item key={arrangementEntry.arrangement.id}>
                  <div
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      openArrangement(
                        familyId,
                        arrangementEntry.v1CaseId,
                        arrangementEntry.arrangement.id!
                      );
                    }}
                  >
                    <ArrangementCard
                      summaryOnly
                      partneringFamily={partneringFamily}
                      v1CaseId={arrangementEntry.v1CaseId}
                      arrangement={arrangementEntry.arrangement}
                    />
                  </div>
                </Grid>
              ))}
            </Grid>
          </TableCell>
        </TableRow>
      ) : (
        <></>
      )}
    </>
  );
}

function PartneringFamilyTableItem(props: PartneringFamilyTableItemProps) {
  const [isVisible, setIsVisible] = useState(false);

  if (isVisible) {
    return <PartneringFamilyTableRows {...props} />;
  }

  return (
    <PartneringFamilyPlaceholderRow
      {...props}
      onVisible={() => setIsVisible(true)}
    />
  );
}

export { PartneringFamilyTableItem };
