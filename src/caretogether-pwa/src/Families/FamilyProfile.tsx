import { Card, CardContent, Grid, Typography, Badge } from '@mui/material';
import { PrimaryContactEditor } from './PrimaryContactEditor';
import { useParams } from 'react-router';
import { useFamilyLookup } from '../Model/DirectoryModel';
import {
  CompletedCustomFieldInfo,
  Permission,
  Arrangement,
  CombinedFamilyInfo,
  FunctionRequirement,
  ArrangementPolicy,
} from '../GeneratedClient';
import { useFamilyPermissions } from '../Model/SessionModel';
import { CompletedRequirementRow } from '../Requirements/CompletedRequirementRow';

import { FamilyCustomField } from './FamilyCustomField';

// interface ChildLocationIndicatorProps {
//   partneringFamily: CombinedFamilyInfo;
//   referralId: string;
//   arrangement: Arrangement;
//   arrangementPolicy: ArrangementPolicy;
//   summaryOnly?: boolean;
// }

const FamilyProfile = () => {
  const familyIdMaybe = useParams<{ familyId: string }>();
  const familyId = familyIdMaybe.familyId as string;

  const familyLookup = useFamilyLookup();
  const family = familyLookup(familyId)!;

  const permissions = useFamilyPermissions(family);

  const openReferral = family.partneringFamilyInfo.openReferral;

  // let referralRequirementContext: ReferralContext | undefined;
  // if (selectedReferral) {
  //   referralRequirementContext = {
  //     kind: 'Referral',
  //     partneringFamilyId: familyId,
  //     referralId: selectedReferral.id!,
  //   };
  // }

  return (
    <>
      <Grid>
        <Typography variant="h3">Family Profile</Typography>
        <Card
          sx={{
            maxWidth: 500,
            margin: '0',
            textAlign: 'center',
            borderRadius: '15px',
            border: '2px solid #005B64',
          }}
        >
          <CardContent>
            <Typography variant="h4"> John and Jane Doe </Typography>
            <Typography variant="h5">
              <PrimaryContactEditor family={family} />
            </Typography>
            <Grid>
              {permissions(Permission.ViewFamilyCustomFields) &&
                (
                  family.family!.completedCustomFields ||
                  ([] as Array<CompletedCustomFieldInfo | string>)
                )
                  .concat(family.missingCustomFields || [])
                  .sort((a, b) =>
                    (a instanceof CompletedCustomFieldInfo
                      ? a.customFieldName!
                      : a) <
                    (b instanceof CompletedCustomFieldInfo
                      ? b.customFieldName!
                      : b)
                      ? -1
                      : (a instanceof CompletedCustomFieldInfo
                            ? a.customFieldName!
                            : a) >
                          (b instanceof CompletedCustomFieldInfo
                            ? b.customFieldName!
                            : b)
                        ? 1
                        : 0
                  )
                  .map((customField) => (
                    <FamilyCustomField
                      key={
                        typeof customField === 'string'
                          ? customField
                          : customField.customFieldName
                      }
                      familyId={familyId}
                      customField={customField}
                    />
                  ))}
            </Grid>
            {/* <Grid container>
              <Grid item xs={3}>
                <Badge color="success" badgeContent={3}>
                  ✅
                </Badge>
              </Grid>
              <Grid item xs={3}>
                <Badge color="warning" badgeContent={1}>
                  🚫
                </Badge>
              </Grid>
              <Grid item xs={3}>
                <Badge color="error" badgeContent={0}>
                  ❌
                </Badge>
              </Grid>
              <Grid item xs={3}>
                <Badge color="info" badgeContent={2}>
                  📅
                </Badge>
              </Grid>
            </Grid> */}

            {/* <Grid container>
              <Grid item xs={3}>
                <Badge
                  color="success"
                  badgeContent={completedRequirementsWithContext.length}
                >
                  ✅
                </Badge>
              </Grid>
              <Grid item xs={3}>
                <Badge
                  color="warning"
                  badgeContent={exemptedRequirementsWithContext.length}
                >
                  🚫
                </Badge>
              </Grid>
              <Grid item xs={3}>
                <Badge
                  color="error"
                  badgeContent={
                    missingAssignmentFunctions +
                    assignmentsMissingVariants +
                    missingRequirementsWithContext.length -
                    upcomingRequirementsCount
                  }
                >
                  ❌
                </Badge>
              </Grid>
              <Grid item xs={3}>
                <Badge color="info" badgeContent={upcomingRequirementsCount}>
                  📅
                </Badge>
              </Grid>
            </Grid> */}
            {/* <Typography variant="body2" component="div">
              {[{ completedRequirementId: 1 }].map((completed, i) => (
                <CompletedRequirementRow
                  key={`${completed.completedRequirementId}:${i}`}
                  requirement={completed as CompletedRequirementInfo}
                  context={requirementContext}
                />
              ))}
            </Typography> */}
          </CardContent>
        </Card>
      </Grid>
    </>
  );
};

export default FamilyProfile;
