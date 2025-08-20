import { Tooltip } from '@mui/material';
import { CompletedRequirementInfo, Permission } from '../GeneratedClient';
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
import { CompletedRequirementDialog } from './CompletedRequirementDialog';
import { RequirementContext } from './RequirementContext';
import { formatUtcDateOnly } from '../Utilities/dateUtils';

type CompletedRequirementRowProps = {
  requirement: CompletedRequirementInfo;
  context: RequirementContext;
};

export function CompletedRequirementRow({
  requirement,
  context,
}: CompletedRequirementRowProps) {
  const userLookup = useUserLookup();
  const permissions = useFamilyIdPermissions(
    context.kind === 'Referral' ||
      context.kind === 'Arrangement' ||
      context.kind === 'Family Volunteer Assignment' ||
      context.kind === 'Individual Volunteer Assignment'
      ? context.partneringFamilyId
      : context.volunteerFamilyId
  );

  const dialogHandle = useDialogHandle();

  const canMarkIncomplete =
    context.kind === 'Referral'
      ? permissions(Permission.EditReferralRequirementCompletion)
      : context.kind === 'Arrangement' ||
          context.kind === 'Family Volunteer Assignment' ||
          context.kind === 'Individual Volunteer Assignment'
        ? permissions(Permission.EditArrangementRequirementCompletion)
        : permissions(Permission.EditApprovalRequirementCompletion);

  const familyLookup = useFamilyLookup();
  const personLookup = usePersonLookup();

  return (
    <>
      <IconRow
        icon="✅"
        onClick={canMarkIncomplete ? dialogHandle.openDialog : undefined}
      >
        <Tooltip
          title={
            <>
              Completed by{' '}
              <PersonName person={userLookup(requirement.userId)} />
            </>
          }
        >
          <>
            <span className="ph-unmask">
              {requirement.requirementName}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              {requirement.completedAtUtc && (
                <span style={{ float: 'right' }}>
                  {formatUtcDateOnly(requirement.completedAtUtc)}
                </span>
              )}
            </span>
            {requirement.expiresAtUtc && (
              <>
                <br />
                <span style={{ paddingLeft: '30px' }}>
                  {requirement.expiresAtUtc > new Date() ? (
                    `⏰ Expires ${formatUtcDateOnly(requirement.expiresAtUtc)}`
                  ) : (
                    <span style={{ fontWeight: 'bold' }}>
                      ⚠ Expired {formatUtcDateOnly(requirement.expiresAtUtc)}
                    </span>
                  )}
                </span>
              </>
            )}
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
          </>
        </Tooltip>
      </IconRow>
      {dialogHandle.open && (
        <CompletedRequirementDialog
          handle={dialogHandle}
          requirement={requirement}
          context={context}
        />
      )}
    </>
  );
}
