import makeStyles from '@mui/styles/makeStyles';
// import { Grid, Paper, Table, TableContainer, TableBody, TableCell, TableHead, TableRow, Drawer } from '@mui/material';
// import { VolunteerApprovalRequirement, VolunteerFamilyApprovalRequirement, RequirementStage } from '../GeneratedClient';
// import { useRecoilValue } from 'recoil';
// import { volunteerFamiliesData } from '../Model/VolunteerFamiliesModel';
// import { policyData } from '../Model/ConfigurationModel';
// import { VolunteerFamilyRequirementScope } from '../GeneratedClient';
// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';

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

// function VolunteerApplications() {
//   const classes = useStyles();
//   const navigate = useNavigate();
//   const volunteerFamilies = useRecoilValue(volunteerFamiliesData);
//   const policy = useRecoilValue(policyData);

//   const allFamilyRequirements =
//     policy.volunteerPolicy?.volunteerFamilyRoles
//     ? Object.entries(policy.volunteerPolicy.volunteerFamilyRoles)
//       .reduce((previous, [, value]) =>
//         previous.concat((value.policyVersions?.map(policyVersion => policyVersion.requirements || []).flat()) || []),
//         [] as VolunteerFamilyApprovalRequirement[])
//         : ([] as VolunteerFamilyApprovalRequirement[]);

//   const allFamilyJointRequirements =
//     allFamilyRequirements.filter(requirement =>
//       requirement.scope === VolunteerFamilyRequirementScope.OncePerFamily &&
//       requirement.stage === RequirementStage.Application);
//   const familyJointDocumentRequirements = allFamilyJointRequirements
//     .reduce((previous, requirement) =>
//     policy.actionDefinitions![requirement.actionName!] instanceof FormUploadRequirement
//       ? previous.concat(policy.actionDefinitions![requirement.actionName!])
//       : previous, [] as FormUploadRequirement[])
//     .reduce((previous, requirement) =>
//       previous.filter(x => x.formName === requirement.formName).length === 0
//       ? previous.concat(requirement)
//       : previous, [] as FormUploadRequirement[]);
//   const familyJointActivityRequirements = allFamilyJointRequirements
//     .reduce((previous, requirement) =>
//     policy.actionDefinitions![requirement.actionName!] instanceof ActivityRequirement
//       ? previous.concat(policy.actionDefinitions![requirement.actionName!])
//       : previous, [] as ActivityRequirement[])
//     .reduce((previous, requirement) =>
//       previous.filter(x => x.activityName === requirement.activityName).length === 0
//       ? previous.concat(requirement)
//       : previous, [] as ActivityRequirement[]);

//   const allFamilyPerAdultRequirements =
//     allFamilyRequirements.filter(requirement =>
//       requirement.scope === VolunteerFamilyRequirementScope.AllAdultsInTheFamily &&
//       requirement.stage === RequirementStage.Application);
//   const allFamilyPerAdultDocumentRequirements = allFamilyPerAdultRequirements
//     .reduce((previous, requirement) =>
//     policy.actionDefinitions![requirement.actionName!] instanceof FormUploadRequirement
//       ? previous.concat(policy.actionDefinitions![requirement.actionName!])
//       : previous, [] as FormUploadRequirement[]);
//   const allFamilyPerAdultActivityRequirements = allFamilyPerAdultRequirements
//     .reduce((previous, requirement) =>
//     policy.actionDefinitions![requirement.actionName!] instanceof ActivityRequirement
//       ? previous.concat(policy.actionDefinitions![requirement.actionName!])
//       : previous, [] as ActivityRequirement[]);

//   const allIndividualRequirements =
//     policy.volunteerPolicy?.volunteerRoles
//     ? Object.entries(policy.volunteerPolicy.volunteerRoles)
//       .reduce((previous, [, value]) =>
//         previous.concat((value.policyVersions?.map(policyVersion => policyVersion.requirements || []).flat()) || []),
//         [] as VolunteerApprovalRequirement[])
//         : ([] as VolunteerApprovalRequirement[]);
//   const allIndividualDocumentRequirements = allIndividualRequirements
//     .reduce((previous, requirement) =>
//     policy.actionDefinitions![requirement.actionName!] instanceof FormUploadRequirement &&
//       requirement.stage === RequirementStage.Application
//       ? previous.concat(policy.actionDefinitions![requirement.actionName!])
//       : previous, [] as FormUploadRequirement[]);
//   const allIndividualActivityRequirements = allIndividualRequirements
//     .reduce((previous, requirement) =>
//     policy.actionDefinitions![requirement.actionName!] instanceof ActivityRequirement &&
//       requirement.stage === RequirementStage.Application
//       ? previous.concat(policy.actionDefinitions![requirement.actionName!])
//       : previous, [] as ActivityRequirement[]);

//   const individualDocumentRequirements =
//     allFamilyPerAdultDocumentRequirements.concat(allIndividualDocumentRequirements)
//     .reduce((previous, requirement) =>
//       previous.filter(x => x.formName === requirement.formName).length === 0
//       ? previous.concat(requirement)
//       : previous, [] as FormUploadRequirement[]);
//   const individualActivityRequirements =
//     allFamilyPerAdultActivityRequirements.concat(allIndividualActivityRequirements)
//     .reduce((previous, requirement) =>
//       previous.filter(x => x.activityName === requirement.activityName).length === 0
//       ? previous.concat(requirement)
//       : previous, [] as ActivityRequirement[]);

//   function openVolunteerFamily(volunteerFamilyId: string) {
//     navigate(`/volunteers/family/${volunteerFamilyId}`);
//   }
  
//   const [drawerOpen, setDrawerOpen] = useState(false);
  
//   return (
//     <Grid container spacing={3}>
//       <Grid item xs={12}>
//         <TableContainer>
//           <Table className={classes.table} size="small">
//             <TableHead>
//               <TableRow>
//                 <TableCell>First Name</TableCell>
//                 <TableCell>Last Name</TableCell>
//                 {familyJointDocumentRequirements.map(requirement =>
//                   (<TableCell key={requirement.formName}>{requirement.formName}</TableCell>))}
//                 {familyJointActivityRequirements.map(requirement =>
//                   (<TableCell key={requirement.activityName}>{requirement.activityName}</TableCell>))}
//                 {individualDocumentRequirements.map(requirement =>
//                   (<TableCell key={requirement.formName}>{requirement.formName}</TableCell>))}
//                 {individualActivityRequirements.map(requirement =>
//                   (<TableCell key={requirement.activityName}>{requirement.activityName}</TableCell>))}
//               </TableRow>
//             </TableHead>
//             <TableBody>
//               {volunteerFamilies.map((volunteerFamily) => (
//                 <React.Fragment key={volunteerFamily.family?.id}>
//                   <TableRow className={classes.familyRow} onClick={() => openVolunteerFamily(volunteerFamily.family!.id!)}>
//                     <TableCell key="1" colSpan={2}>{
//                       volunteerFamily.family?.adults
//                         ?.filter(adult => adult.item1?.id === volunteerFamily.family?.primaryFamilyContactPersonId)
//                         [0]?.item1?.lastName + " Family"
//                     }</TableCell>
//                     {familyJointDocumentRequirements.map(requirement =>
//                       (<TableCell key={requirement.formName}>{
//                         'TODO'
//                         /* TODO: Is this met? If not, is it missing for a role this family has? */
//                       }</TableCell>))}
//                     {familyJointActivityRequirements.map(requirement =>
//                       (<TableCell key={requirement.activityName}>***</TableCell>))}
//                     <TableCell colSpan={
//                       individualDocumentRequirements.length +
//                       individualActivityRequirements.length
//                     } />
//                   </TableRow>
//                   {volunteerFamily.family?.adults?.map(adult => adult.item1 && (
//                     <TableRow key={volunteerFamily.family?.id + ":" + adult.item1.id}
//                       className={classes.adultRow}>
//                       <TableCell>{adult.item1.firstName}</TableCell>
//                       <TableCell>{adult.item1.lastName}</TableCell>
//                       <TableCell colSpan={
//                         familyJointDocumentRequirements.length +
//                         familyJointActivityRequirements.length
//                       } />
//                       {individualDocumentRequirements.map(requirement =>
//                         (<TableCell key={requirement.formName}>...</TableCell>))}
//                       {individualActivityRequirements.map(requirement =>
//                         (<TableCell key={requirement.activityName}>***</TableCell>))}
//                     </TableRow>
//                   ))}
//                 </React.Fragment>
//               ))}
//             </TableBody>
//           </Table>
//         </TableContainer>
//         <Drawer anchor={'right'} open={drawerOpen} onClose={() => setDrawerOpen(false)}>
//           Volunteer Family &amp; Individual Records
//         </Drawer>
//       </Grid>
//     </Grid>
//   );
// }

// export { VolunteerApplications };
