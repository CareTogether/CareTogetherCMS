import { makeStyles } from '@material-ui/core/styles';
import { Grid, Paper, Table, TableContainer, TableBody, TableCell, TableHead, TableRow, Drawer } from '@material-ui/core';
import { FormUploadRequirement, ActivityRequirement } from '../GeneratedClient';
import { useRecoilValue } from 'recoil';
import { volunteerFamiliesData } from '../Model/VolunteerFamiliesModel';
import { policyData } from '../Model/ConfigurationModel';
import { VolunteerFamilyRequirementScope } from '../GeneratedClient';
import { format } from 'date-fns';
import React, { useState } from 'react';

const useStyles = makeStyles((theme) => ({
  paper: {
    padding: theme.spacing(2),
    display: 'flex',
    overflow: 'auto',
    flexDirection: 'column',
  },
  fixedHeight: {
    height: 240,
  },
  table: {
    minWidth: 700,
  },
  familyRow: {
    backgroundColor: '#eef'
  },
  adultRow: {
  },
  childRow: {
    color: 'ddd',
    fontStyle: 'italic'
  }
}));

function VolunteerProgress() {
  const classes = useStyles();
  const volunteerFamilies = useRecoilValue(volunteerFamiliesData);
  const policy = useRecoilValue(policyData);

  /* What we are modeling here:
  
  For each (non-application) requirement:
    What roles is it applicable to? Track those along with each requirement.
    For family role requirements, also track whether they are applicable to families or to individuals.
  For each family/individual:
    We know what roles they are prospective or approved for.
    For each requirement (applicable to a family/individual):
      Is the family/individual either prospective or approved for any roles that the requirement applies to?
        If so, has the family/individual met that requirement?
        If not, leave blank as not-applicable.
  */

  enum RequirementType { Document, Activity };
  enum RequirementScope { Family, Individual };
  const allFamilyRequirementRoles: { Type: RequirementType, Name: string, Role: string }[] = [];
  const allIndividualRequirementRoles: { Type: RequirementType, Name: string, Role: string }[] = [];
  function append(type: RequirementType, name: string, roleName: string, scope: RequirementScope) {
    if (scope === RequirementScope.Family)
      allFamilyRequirementRoles.push({Type: type, Name: name, Role: roleName});
    else
      allIndividualRequirementRoles.push({Type: type, Name: name, Role: roleName});
  }

  policy.volunteerPolicy?.volunteerFamilyRoles &&
    Object.entries(policy.volunteerPolicy.volunteerFamilyRoles)
    .forEach(([roleName, rolePolicy]) => {
      rolePolicy.approvalRequirements?.forEach(requirement => {
        if (requirement.requiredToBeProspective) return;
        if (requirement.actionRequirement instanceof FormUploadRequirement && requirement.actionRequirement.formName) {
          append(RequirementType.Document, requirement.actionRequirement.formName, roleName,
            requirement.scope === VolunteerFamilyRequirementScope.OncePerFamily
            ? RequirementScope.Family : RequirementScope.Individual);
        } else if (requirement.actionRequirement instanceof ActivityRequirement && requirement.actionRequirement.activityName) {
          append(RequirementType.Activity, requirement.actionRequirement.activityName, roleName,
            requirement.scope === VolunteerFamilyRequirementScope.OncePerFamily
            ? RequirementScope.Family : RequirementScope.Individual);
        }
      });
    });
    
  policy.volunteerPolicy?.volunteerRoles &&
    Object.entries(policy.volunteerPolicy.volunteerRoles)
    .forEach(([roleName, rolePolicy]) => {
      rolePolicy.approvalRequirements?.forEach(requirement => {
        if (requirement.requiredToBeProspective) return;
        if (requirement.actionRequirement instanceof FormUploadRequirement && requirement.actionRequirement.formName) {
          append(RequirementType.Document, requirement.actionRequirement.formName, roleName,
            RequirementScope.Individual);
        } else if (requirement.actionRequirement instanceof ActivityRequirement && requirement.actionRequirement.activityName) {
          append(RequirementType.Activity, requirement.actionRequirement.activityName, roleName,
            RequirementScope.Individual);
        }
      });
    });

  // Credit: https://stackoverflow.com/a/62765924/287610
  const groupBy = <T, K extends keyof any, V>(list: T[],
    getKey: (item: T) => K, getValue: (item: T) => V) =>
    list.reduce((previous, currentItem) => {
      const group = getKey(currentItem);
      if (!previous[group]) previous[group] = [] as V[];
      previous[group].push(getValue(currentItem));
      return previous;
    }, {} as Record<K, V[]>);

  const groupedFamilyRequirementRoles = groupBy(allFamilyRequirementRoles,
    x => x.Type.toString()+'|'+x.Name, x => x.Role);
  const groupedIndividualRequirementRoles = groupBy(allIndividualRequirementRoles,
    x => x.Type.toString()+'|'+x.Name, x => x.Role);
  
  const volunteerFamilyProgress = volunteerFamilies.map(volunteerFamily => {
    const familyProgress: Array<string | 'needed' | null> = [];
    Object.entries(groupedFamilyRequirementRoles).forEach(([requirement, roleNames]) => {
      const [Type, Name] = requirement.split('|');
      // If the family is in progress or approved for any role that a requirement applies to,
      // then record whether the family has met that requirement or still needs to.
      if (roleNames.filter(roleForRequirement =>
        volunteerFamily?.familyRoleApprovals?.[roleForRequirement] !== undefined).length > 0) {
        if (Type === RequirementType.Document.toString()) {
          const submissions = volunteerFamily.approvalFormUploads?.filter(x => x.formName === Name);
          familyProgress.push(submissions && submissions.length > 0
            ? format(submissions[0].timestampUtc as Date, 'M/d/yy')
            : 'needed');
            return;
        } else if (Type === RequirementType.Activity.toString()) {
          const submissions = volunteerFamily.approvalActivitiesPerformed?.filter(x => x.activityName === Name);
          familyProgress.push(submissions && submissions.length > 0
            ? format(submissions[0].timestampUtc as Date, 'M/d/yy')
            : 'needed');
            return;
        }
      }
      familyProgress.push(null);
    });
    const adults = volunteerFamily.family?.adults?.map(adult => {
      const individualProgress: Array<string | 'needed' | null> = [];
      Object.entries(groupedIndividualRequirementRoles).forEach(([requirement, roleNames]) => {
        const [Type, Name] = requirement.split('|');
        const individualVolunteer = volunteerFamily.individualVolunteers?.[adult.item1!.id as string];
        // If the individual is in progress or approved for any role that a requirement applies to,
        // then record whether the individual has met that requirement or still needs to.
        if (individualVolunteer && roleNames.filter(roleForRequirement =>
          individualVolunteer.individualRoleApprovals?.[roleForRequirement] !== undefined).length > 0) {
          if (Type === RequirementType.Document.toString()) {
            const submissions = individualVolunteer.approvalFormUploads?.filter(x => x.formName === Name);
            individualProgress.push(submissions && submissions.length > 0
              ? format(submissions[0].timestampUtc as Date, 'M/d/yy')
              : 'needed');
              return;
          } else if (Type === RequirementType.Activity.toString()) {
            const submissions = individualVolunteer.approvalActivitiesPerformed?.filter(x => x.activityName === Name);
            individualProgress.push(submissions && submissions.length > 0
              ? format(submissions[0].timestampUtc as Date, 'M/d/yy')
              : 'needed');
              return;
          }
        }
        individualProgress.push(null);
      });
      return {
        adult: adult,
        progress: individualProgress
      };
    }) || [];
    return {
      family: volunteerFamily,
      progress: familyProgress,
      adults: adults
    };
  });

  const familyRequirementColumns = [] as { Type: string, Name: string }[];
  Object.entries(groupedFamilyRequirementRoles).forEach(([TypeAndName, roles]) => {
    const [Type, Name] = TypeAndName.split('|');
    familyRequirementColumns.push({Type: Type, Name: Name});
  })

  const individualRequirementColumns = [] as { Type: string, Name: string }[];
  Object.entries(groupedIndividualRequirementRoles).forEach(([TypeAndName, roles]) => {
    const [Type, Name] = TypeAndName.split('|');
    individualRequirementColumns.push({Type: Type, Name: Name});
  });

  const [drawerOpen, setDrawerOpen] = useState(false);

  // const allFamilyRequirements =
  //   policy.volunteerPolicy?.volunteerFamilyRoles
  //   ? Object.entries(policy.volunteerPolicy.volunteerFamilyRoles)
  //     .reduce((previous, [, value]) =>
  //       previous.concat(value.approvalRequirements || []),
  //       [] as VolunteerFamilyApprovalRequirement[])
  //       : ([] as VolunteerFamilyApprovalRequirement[]);

  // const allFamilyJointRequirements =
  //   allFamilyRequirements.filter(requirement =>
  //     requirement.scope === VolunteerFamilyRequirementScope.OncePerFamily &&
  //     !requirement.requiredToBeProspective);
  
/*
  const familyJointDocumentRequirements = allFamilyJointRequirements
    .reduce((previous, requirement) =>
      requirement.actionRequirement instanceof FormUploadRequirement
      ? previous.concat(requirement.actionRequirement)
      : previous, [] as FormUploadRequirement[])
    .reduce((previous, requirement) =>
      previous.filter(x => x.formName === requirement.formName).length === 0
      ? previous.concat(requirement)
      : previous, [] as FormUploadRequirement[]);
  const familyJointActivityRequirements = allFamilyJointRequirements
    .reduce((previous, requirement) =>
      requirement.actionRequirement instanceof ActivityRequirement
      ? previous.concat(requirement.actionRequirement)
      : previous, [] as ActivityRequirement[])
    .reduce((previous, requirement) =>
      previous.filter(x => x.activityName === requirement.activityName).length === 0
      ? previous.concat(requirement)
      : previous, [] as ActivityRequirement[]);
*/
  // const allFamilyPerAdultRequirements =
  //   allFamilyRequirements.filter(requirement =>
  //     requirement.scope === VolunteerFamilyRequirementScope.AllAdultsInTheFamily &&
  //     !requirement.requiredToBeProspective);

  /*
  const allFamilyPerAdultDocumentRequirements = allFamilyPerAdultRequirements
    .reduce((previous, requirement) =>
      requirement.actionRequirement instanceof FormUploadRequirement
      ? previous.concat(requirement.actionRequirement)
      : previous, [] as FormUploadRequirement[]);
  const allFamilyPerAdultActivityRequirements = allFamilyPerAdultRequirements
    .reduce((previous, requirement) =>
      requirement.actionRequirement instanceof ActivityRequirement
      ? previous.concat(requirement.actionRequirement)
      : previous, [] as ActivityRequirement[]);
*/

  // const allIndividualRequirements =
  //   policy.volunteerPolicy?.volunteerRoles
  //   ? Object.entries(policy.volunteerPolicy.volunteerRoles)
  //     .reduce((previous, [, value]) =>
  //       previous.concat(value.approvalRequirements || []),
  //       [] as VolunteerApprovalRequirement[])
  //       : ([] as VolunteerApprovalRequirement[]);
  
  /*
  const allIndividualDocumentRequirements = allIndividualRequirements
    .reduce((previous, requirement) =>
      requirement.actionRequirement instanceof FormUploadRequirement &&
      !requirement.requiredToBeProspective
      ? previous.concat(requirement.actionRequirement)
      : previous, [] as FormUploadRequirement[]);
  const allIndividualActivityRequirements = allIndividualRequirements
    .reduce((previous, requirement) =>
      requirement.actionRequirement instanceof ActivityRequirement &&
      !requirement.requiredToBeProspective
      ? previous.concat(requirement.actionRequirement)
      : previous, [] as ActivityRequirement[]);

  const individualDocumentRequirements =
    allFamilyPerAdultDocumentRequirements.concat(allIndividualDocumentRequirements)
    .reduce((previous, requirement) =>
      previous.filter(x => x.formName === requirement.formName).length === 0
      ? previous.concat(requirement)
      : previous, [] as FormUploadRequirement[]);
  const individualActivityRequirements =
    allFamilyPerAdultActivityRequirements.concat(allIndividualActivityRequirements)
    .reduce((previous, requirement) =>
      previous.filter(x => x.activityName === requirement.activityName).length === 0
      ? previous.concat(requirement)
      : previous, [] as ActivityRequirement[]);
*/
  
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <TableContainer component={Paper}>
          <Table className={classes.table} size="small">
            <TableHead>
              <TableRow>
                <TableCell>First Name</TableCell>
                <TableCell>Last Name</TableCell>
                {familyRequirementColumns.map(({ Type, Name }) =>
                  (<TableCell key={Type.toString() + Name}>{Name}</TableCell>))}
                {individualRequirementColumns.map(({ Type, Name }) =>
                  (<TableCell key={Type.toString() + Name}>{Name}</TableCell>))}
              </TableRow>
            </TableHead>
            <TableBody>
              {volunteerFamilyProgress.map((volunteerFamilyProgress) => (
                <React.Fragment key={volunteerFamilyProgress.family.family?.id}>
                  <TableRow className={classes.familyRow} onClick={() => setDrawerOpen(true)}>
                    <TableCell key="1" colSpan={2}>{
                      volunteerFamilyProgress.family.family?.adults
                        ?.filter(adult => adult.item1?.id === volunteerFamilyProgress.family.family?.primaryFamilyContactPersonId)
                        [0]?.item1?.lastName + " Family"
                    }</TableCell>
                    {volunteerFamilyProgress.progress.map((value, i) =>
                      (<TableCell key={i}>{value}</TableCell>))}
                    <TableCell colSpan={individualRequirementColumns.length} />
                  </TableRow>
                  {volunteerFamilyProgress.adults.map(adult => adult.adult.item1 && (
                    <TableRow key={adult.adult.item1.id}
                      className={classes.adultRow}>
                      <TableCell>{adult.adult.item1.firstName}</TableCell>
                      <TableCell>{adult.adult.item1.lastName}</TableCell>
                      <TableCell colSpan={familyRequirementColumns.length} />
                      {adult.progress.map((value, i) =>
                        (<TableCell key={i}>{value}</TableCell>))}
                    </TableRow>
                  ))}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Drawer anchor={'right'} open={drawerOpen} onClose={() => setDrawerOpen(false)}>
          Volunteer Family &amp; Individual Records
        </Drawer>
      </Grid>
    </Grid>
  );
}

export { VolunteerProgress };
