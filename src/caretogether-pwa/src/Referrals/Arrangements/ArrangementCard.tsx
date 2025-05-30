import { Card, CardContent, CardHeader } from '@mui/material';
import { Arrangement, CombinedFamilyInfo } from '../../GeneratedClient';
import { useRecoilValue } from 'recoil';
import { policyData } from '../../Model/ConfigurationModel';
import { ArrangementPhaseSummary } from './ArrangementPhaseSummary';
import { ArrangementCardTitle } from './ArrangementCardTitle';
import { ArrangementCardHeaderSection } from './ArrangementCardHeaderSection';
import { ArrangementCardDetailsSection } from './ArrangementCardDetailsSection';
import { useRequirementContextData } from './useRequirementContextData';

export type ArrangementCardProps = {
  partneringFamily: CombinedFamilyInfo;
  referralId: string;
  arrangement: Arrangement;
  summaryOnly?: boolean;
};

export function ArrangementCard({
  partneringFamily,
  referralId,
  arrangement,
  summaryOnly,
}: ArrangementCardProps) {
  const policy = useRecoilValue(policyData);

  const arrangementPolicy = policy.referralPolicy?.arrangementPolicies?.find(
    (a) => a.arrangementType === arrangement.arrangementType
  );

  const requirementsData = useRequirementContextData(
    arrangement,
    arrangementPolicy,
    partneringFamily,
    referralId
  );

  return (
    <Card variant="outlined">
      <ArrangementPhaseSummary
        phase={arrangement.phase!}
        requestedAtUtc={arrangement.requestedAtUtc!}
        startedAtUtc={arrangement.startedAtUtc}
        endedAtUtc={arrangement.endedAtUtc}
      />

      <CardHeader
        sx={{
          paddingTop: 0.5,
          paddingBottom: 0,
          '& .MuiCardHeader-title': {
            fontSize: '16px',
          },
        }}
        title={
          <ArrangementCardTitle
            summaryOnly={summaryOnly}
            partneringFamilyId={partneringFamily.family!.id!}
            referralId={referralId}
            arrangement={arrangement}
          />
        }
      />

      <CardContent
        sx={{
          paddingTop: 1,
          paddingBottom: 1,
          '&:last-child': {
            paddingBottom: 0,
          },
        }}
      >
        <ArrangementCardHeaderSection
          partneringFamily={partneringFamily}
          referralId={referralId}
          arrangement={arrangement}
          summaryOnly={summaryOnly}
          arrangementPolicy={arrangementPolicy}
        />

        {!summaryOnly && (
          <ArrangementCardDetailsSection
            partneringFamily={partneringFamily}
            referralId={referralId}
            arrangement={arrangement}
            arrangementPolicy={arrangementPolicy}
            requirementsData={requirementsData}
          />
        )}
      </CardContent>
    </Card>
  );
}
