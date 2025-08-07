import { Tooltip } from '@mui/material';
import { format } from 'date-fns';
import { ExemptedRequirementInfo, Permission } from '../GeneratedClient';
import {
  useFamilyLookup,
  usePersonLookup,
  useUserLookup,
} from '../Model/DirectoryModel';
import { useFamilyIdPermissions } from '../Model/SessionModel';
import { useDialogHandle } from '../Hooks/useDialogHandle';
import { FamilyName } from '../Families/FamilyName';
import { PersonName } from '../Families/PersonName';
import { IconRow } from '../Generic/IconRow';
import { ExemptedRequirementDialog } from './ExemptedRequirementDialog';
import { RequirementContext } from './RequirementContext';
import { useRecoilValue } from 'recoil';
import { policyData } from '../Model/ConfigurationModel';
import { formatUtcDateOnly } from '../Utilities/dateUtils';

type ExemptedRequirementRowProps = {
  requirement: ExemptedRequirementInfo;
  context: RequirementContext;
};

export function ExemptedRequirementRow({
  requirement,
  context,
}: ExemptedRequirementRowProps) {
  const userLookup = useUserLookup();
  const permissions = useFamilyIdPermissions(
    context.kind === 'V1Case' ||
      context.kind === 'Arrangement' ||
      context.kind === 'Family Volunteer Assignment' ||
      context.kind === 'Individual Volunteer Assignment'
      ? context.partneringFamilyId
      : context.volunteerFamilyId
  );

  const dialogHandle = useDialogHandle();

  const canExempt =
    context.kind === 'V1Case'
      ? permissions(Permission.EditReferralRequirementExemption)
      : context.kind === 'Arrangement' ||
          context.kind === 'Family Volunteer Assignment' ||
          context.kind === 'Individual Volunteer Assignment'
        ? permissions(Permission.EditArrangementRequirementExemption)
        : permissions(Permission.EditApprovalRequirementExemption);

  const familyLookup = useFamilyLookup();
  const personLookup = usePersonLookup();

  const policy = useRecoilValue(policyData);

  const [partneringFamilyId, v1CaseId, arrangementId] =
    context.kind === 'Arrangement' ||
    context.kind === 'Family Volunteer Assignment' ||
    context.kind === 'Individual Volunteer Assignment'
      ? [context.partneringFamilyId, context.v1CaseId, context.arrangementId]
      : [undefined, undefined, undefined];
  const partneringFamilyInfo =
    familyLookup(partneringFamilyId)?.partneringFamilyInfo;
  const v1Case = partneringFamilyInfo?.closedReferrals
    ?.concat(partneringFamilyInfo.openReferral || [])
    .find((r) => r.id === v1CaseId);
  const arrangement = v1Case?.arrangements?.find((a) => a.id === arrangementId);
  const arrangementPolicy = policy.referralPolicy?.arrangementPolicies?.find(
    (a) => a.arrangementType === arrangement?.arrangementType
  );
  const allMonitoringRequirements =
    arrangementPolicy?.requiredMonitoringActions?.concat(
      arrangementPolicy.arrangementFunctions?.flatMap(
        (f) =>
          f.variants?.flatMap((v) => v.requiredMonitoringActions || []) || []
      ) || []
    );
  const isArrangementMonitoringRequirement = allMonitoringRequirements?.some(
    (r) => r.actionName === requirement.requirementName
  );

  return (
    <>
      <IconRow
        icon="🚫"
        onClick={canExempt ? dialogHandle.openDialog : undefined}
      >
        <Tooltip
          title={
            <>
              Granted by <PersonName person={userLookup(requirement.userId)} />{' '}
              {format(requirement.timestampUtc!, 'M/d/yy h:mm a')}
            </>
          }
        >
          <>
            <span>
              {isArrangementMonitoringRequirement && !requirement.dueDate && (
                <span style={{ fontWeight: 'bold' }}>All&nbsp;</span>
              )}
              {requirement.requirementName}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              {requirement.dueDate && (
                <span style={{ float: 'right' }}>
                  {formatUtcDateOnly(requirement.dueDate)}
                </span>
              )}
              {requirement.exemptionExpiresAtUtc && (
                <span style={{ float: 'right' }}>
                  until {format(requirement.exemptionExpiresAtUtc, 'M/d/yy')}
                </span>
              )}
            </span>
            {context.kind === 'Family Volunteer Assignment' && (
              <>
                <br />
                <span style={{ paddingLeft: '30px' }}>
                  <FamilyName
                    family={familyLookup(context.assignment.familyId)}
                  />
                </span>
              </>
            )}
            {context.kind === 'Individual Volunteer Assignment' && (
              <>
                <br />
                <span style={{ paddingLeft: '30px' }}>
                  <PersonName
                    person={personLookup(
                      context.assignment.familyId,
                      context.assignment.personId
                    )}
                  />
                </span>
              </>
            )}
            <br />
            <span
              style={{
                lineHeight: '1.5em',
                paddingLeft: 30,
                fontStyle: 'italic',
                display: 'inline-block',
              }}
            >
              {requirement.additionalComments}
            </span>
          </>
        </Tooltip>
      </IconRow>
      {dialogHandle.open && (
        <ExemptedRequirementDialog
          handle={dialogHandle}
          requirement={requirement}
          context={context}
        />
      )}
    </>
  );
}
