import {
  Card,
  CardHeader,
  IconButton,
  CardContent,
  Typography,
  Chip,
} from '@mui/material';
import {
  CustodialRelationshipType,
  ExactAge,
  Gender,
  Permission,
} from '../GeneratedClient';
import { useRecoilValue } from 'recoil';
import { AgeText } from './AgeText';
import { Edit as EditIcon } from '@mui/icons-material';
import { useDialogHandle } from '../Hooks/useDialogHandle';
import { EditChildDialog } from './EditChildDialog';
import { useFamilyPermissions } from '../Model/SessionModel';
import { useFamilyLookup } from '../Model/DirectoryModel';
import { policyData } from '../Model/ConfigurationModel';
import { differenceInYears } from 'date-fns';
import { DateOfBirth } from './DateOfBirth';
import { WithComma } from '../Utilities/WithComma';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { FAMILY_MEMBER_CUSTOM_FIELDS_FEATURE_FLAG } from '../featureFlags';
import { FamilyMemberCustomFields } from './FamilyMemberCustomFields';
import { combineCustomFieldPolicies } from './familyMemberCustomFieldPolicies';

type ChildCardProps = {
  familyId: string;
  personId: string;
  showCustomFields?: boolean;
};

export function ChildCard({
  familyId,
  personId,
  showCustomFields = false,
}: ChildCardProps) {
  const familyLookup = useFamilyLookup();
  const family = familyLookup(familyId)!;

  const child = family.family?.children?.find((x) => x.id === personId);

  const isAdult =
    child?.age &&
    differenceInYears(new Date(), (child.age as ExactAge).dateOfBirth!) >= 18;

  const editDialogHandle = useDialogHandle();

  const permissions = useFamilyPermissions(family);
  const policy = useRecoilValue(policyData);
  const familyMemberCustomFieldsEnabled = useFeatureFlagEnabled(
    FAMILY_MEMBER_CUSTOM_FIELDS_FEATURE_FLAG
  );
  const customFieldPolicies = combineCustomFieldPolicies(
    family.partneringFamilyInfo != null
      ? (policy.customFields?.partneringFamily?.child ?? [])
      : [],
    family.volunteerFamilyInfo != null
      ? (policy.customFields?.volunteerFamily?.child ?? [])
      : []
  );

  return (
    <>
      {child && (
        <Card variant="outlined" sx={{ minWidth: '275px' }}>
          <CardHeader
            sx={{ paddingBottom: 0 }}
            title={child.firstName + ' ' + child.lastName}
            subheader={
              <WithComma
                items={[
                  'Child',
                  <AgeText age={child.age} />,
                  child.gender && Gender[child.gender],
                  child.ethnicity && child.ethnicity,
                ].filter(Boolean)}
              />
            }
            action={
              permissions(Permission.EditFamilyInfo) && (
                <IconButton onClick={editDialogHandle.openDialog} size="medium">
                  <EditIcon color="primary" />
                </IconButton>
              )
            }
          />
          <CardContent
            sx={{ paddingTop: 1, paddingBottom: 1, maxWidth: '500px' }}
          >
            {isAdult && (
              <Chip size="small" label={'No longer under 18!'} color="error" />
            )}

            <DateOfBirth age={child.age} permissions={permissions} />

            <Typography variant="body2" component="div">
              {child.concerns && (
                <>
                  <strong>⚠&nbsp;&nbsp;&nbsp;{child.concerns}</strong>
                </>
              )}
              {child.concerns && child.notes && <br />}
              {child.notes && <>📝&nbsp;{child.notes}</>}
            </Typography>
            <Typography variant="body2" component="div">
              <ul
                style={{
                  padding: 0,
                  margin: 0,
                  marginTop: 8,
                  listStyle: 'none',
                }}
              >
                {family.family?.custodialRelationships
                  ?.filter((relationship) => relationship.childId === child.id)
                  ?.map((relationship) => {
                    const adult =
                      family.family?.adults?.filter(
                        (x) => x.item1?.id === relationship.personId
                      )[0]?.item1?.firstName ?? '(adult not found)';
                    const relationshipLabel =
                      relationship.type ===
                      CustodialRelationshipType.LegalGuardian
                        ? 'legal guardian'
                        : relationship.type ===
                            CustodialRelationshipType.ParentWithCustody
                          ? 'parent with custody'
                          : relationship.type ===
                              CustodialRelationshipType.ParentWithCourtAppointedCustody
                            ? 'parent with court-appointed sole custody'
                            : null;

                    return (
                      <li
                        key={relationship.personId}
                        style={{
                          display: 'flex',
                          gap: 8,
                          justifyContent: 'space-between',
                          marginTop: 4,
                        }}
                      >
                        <span>{adult}:</span>
                        <span style={{ textAlign: 'right' }}>
                          {relationshipLabel}
                        </span>
                      </li>
                    );
                })}
              </ul>
            </Typography>
            {showCustomFields &&
              familyMemberCustomFieldsEnabled &&
              permissions(Permission.ViewFamilyCustomFields) && (
                <FamilyMemberCustomFields
                  familyId={familyId}
                  personId={personId}
                  customFieldPolicies={customFieldPolicies}
                  completedCustomFields={child.completedCustomFields}
                />
              )}
          </CardContent>
          {editDialogHandle.open && (
            <EditChildDialog
              handle={editDialogHandle}
              key={editDialogHandle.key}
              child={child}
              familyAdults={family.family!.adults!.map((a) => a.item1!)}
              custodialRelationships={family.family!.custodialRelationships}
            />
          )}
        </Card>
      )}
    </>
  );
}
