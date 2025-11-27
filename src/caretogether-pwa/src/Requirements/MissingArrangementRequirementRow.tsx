import { useRecoilValue } from 'recoil';
import { MissingArrangementRequirement, Permission } from '../GeneratedClient';
import { policyData } from '../Model/ConfigurationModel';
import { useFamilyLookup, usePersonLookup } from '../Model/DirectoryModel';
import { useFamilyIdPermissions } from '../Model/SessionModel';
import { useDialogHandle } from '../Hooks/useDialogHandle';
import { FamilyName } from '../Families/FamilyName';
import { PersonName } from '../Families/PersonName';
import { IconRow } from '../Generic/IconRow';
import { MissingRequirementDialog } from './MissingRequirementDialog';
import { RequirementContext } from './RequirementContext';
import { formatUtcDateOnly } from '../Utilities/dateUtils';

type MissingArrangementRequirementRowProps = {
  requirement: MissingArrangementRequirement;
  context: RequirementContext;
};

export function MissingArrangementRequirementRow({
  requirement,
  context,
}: MissingArrangementRequirementRowProps) {
  const policy = useRecoilValue(policyData);
  const permissions = useFamilyIdPermissions(
    context.kind === 'V1Case' ||
      context.kind === 'Arrangement' ||
      context.kind === 'Family Volunteer Assignment' ||
      context.kind === 'Individual Volunteer Assignment'
      ? context.partneringFamilyId
      : context.volunteerFamilyId
  );

  const dialogHandle = useDialogHandle();

  const actionName = requirement.action.actionName;

  const requirementPolicy =
    policy.actionDefinitions[actionName] ||
    Object.entries(policy.actionDefinitions).find(([, value]) =>
      value.alternateNames?.includes(actionName)
    );

  if (
    context.kind === 'V1Case' ||
    context.kind === 'Individual Volunteer' ||
    context.kind === 'Volunteer Family'
  )
    throw new Error(`Invalid missing requirement context '${context.kind}'`);

  const canComplete = permissions(
    Permission.EditArrangementRequirementCompletion
  );
  const canExempt = permissions(Permission.EditArrangementRequirementExemption);

  const familyLookup = useFamilyLookup();
  const personLookup = usePersonLookup();

  return (
    <>
      {requirement.dueBy ? (
        <IconRow
          icon="📅"
          onClick={
            canComplete || canExempt ? dialogHandle.openDialog : undefined
          }
        >
          {requirement.action?.actionName}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          <span style={{ float: 'right' }}>
            {formatUtcDateOnly(requirement.dueBy)}
          </span>
          {requirement.volunteerFamilyId && !requirement.personId && (
            <>
              <br />
              <span style={{ paddingLeft: '30px' }}>
                <FamilyName
                  family={familyLookup(requirement.volunteerFamilyId)}
                />
              </span>
            </>
          )}
          {requirement.volunteerFamilyId && requirement.personId && (
            <>
              <br />
              <span style={{ paddingLeft: '30px' }}>
                <PersonName
                  person={personLookup(
                    requirement.volunteerFamilyId,
                    requirement.personId
                  )}
                />
              </span>
            </>
          )}
        </IconRow>
      ) : (
        <IconRow
          icon={requirement.action?.isRequired ? '❌' : '🔲'}
          onClick={
            canComplete || canExempt ? dialogHandle.openDialog : undefined
          }
        >
          {requirement.action?.actionName}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          {requirement.pastDueSince && (
            <span style={{ float: 'right' }}>
              {formatUtcDateOnly(requirement.pastDueSince)}
            </span>
          )}
          {requirement.volunteerFamilyId && !requirement.personId && (
            <>
              <br />
              <span style={{ paddingLeft: '30px' }}>
                <FamilyName
                  family={familyLookup(requirement.volunteerFamilyId)}
                />
              </span>
            </>
          )}
          {requirement.volunteerFamilyId && requirement.personId && (
            <>
              <br />
              <span style={{ paddingLeft: '30px' }}>
                <PersonName
                  person={personLookup(
                    requirement.volunteerFamilyId,
                    requirement.personId
                  )}
                />
              </span>
            </>
          )}
        </IconRow>
      )}
      {dialogHandle.open && (
        <MissingRequirementDialog
          handle={dialogHandle}
          requirement={requirement}
          context={context}
          policy={requirementPolicy}
          v1CaseId={context.v1CaseId}
          canExempt={canExempt}
        />
      )}
    </>
  );
}
