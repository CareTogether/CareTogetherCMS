import { Card, CardContent, Grid, Typography } from '@mui/material';
import { PrimaryContactEditor } from '../PrimaryContactEditor';
import { useParams } from 'react-router';
import { useFamilyLookup } from '../../Model/DirectoryModel';
import { CompletedCustomFieldInfo, Permission } from '../../GeneratedClient';
import { useFamilyPermissions } from '../../Model/SessionModel';

import { FamilyCustomField } from '../FamilyCustomField';
import RequirementsList from './RequirementsList';

const FamilyProfile = () => {
  const familyIdMaybe = useParams<{ familyId: string }>();
  const familyId = familyIdMaybe.familyId as string;

  const familyLookup = useFamilyLookup();
  const family = familyLookup(familyId)!;

  const permissions = useFamilyPermissions(family);

  const openReferral = family.partneringFamilyInfo?.openReferral;

  const adults = family.family?.adults || [];

  const [adult1, adult2] = adults;

  const firstName1 = adult1.item1?.firstName;
  const firstName2 = adult2.item1?.firstName;

  const lastName = adult1.item1?.lastName;

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
            <Typography variant="h4">
              {firstName1} and {firstName2} {lastName}
            </Typography>
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

            {openReferral && <RequirementsList referral={openReferral} />}
          </CardContent>
        </Card>
      </Grid>
    </>
  );
};

export default FamilyProfile;
