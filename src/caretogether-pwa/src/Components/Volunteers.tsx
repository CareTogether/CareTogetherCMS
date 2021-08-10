import clsx from 'clsx';
import { makeStyles } from '@material-ui/core/styles';
import { Grid, Paper, Table, TableContainer, TableBody, TableCell, TableHead, TableRow } from '@material-ui/core';
import { ExactAge, AgeInYears } from '../GeneratedClient';
import { differenceInYears } from 'date-fns';
import { useRecoilValue } from 'recoil';
import { volunteerFamiliesData, useRefreshVolunteerFamilies } from '../Model/VolunteerFamiliesModel';
import React from 'react';

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
    backgroundColor: '#eee',
  },
  adultRow: {

  },
  childRow: {

  }
}));

function Volunteers() {
  const classes = useStyles();
  const volunteerFamilies = useRecoilValue(volunteerFamiliesData);
  //const refreshVolunteerFamilies = useRefreshVolunteerFamilies();

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <TableContainer component={Paper}>
          <Table className={classes.table} size="small">
            <TableHead>
              <TableRow>
                <TableCell align="center" colSpan={3}>
                  Volunteer Families ({volunteerFamilies.length})
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>First Name</TableCell>
                <TableCell>Last Name</TableCell>
                <TableCell>Age</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {volunteerFamilies.map((volunteerFamily) => (
                <React.Fragment key={volunteerFamily.family?.id}>
                  <TableRow className={classes.familyRow}>
                    <TableCell key="1" colSpan={3}>{
                      volunteerFamily.family?.adults
                        ?.filter(adult => adult.item2?.isPrimaryFamilyContact)
                        [0]?.item1?.lastName + " Family"
                    }</TableCell>
                  </TableRow>
                  {volunteerFamily.family?.adults?.map(adult => (
                    <TableRow key={volunteerFamily.family?.id + ":" + adult.item1?.id}
                      className={classes.adultRow}>
                      <TableCell>{adult.item1?.firstName}</TableCell>
                      <TableCell>{adult.item1?.lastName}</TableCell>
                      <TableCell align="right">
                        { adult.item1?.age instanceof ExactAge
                          ? adult.item1?.age.dateOfBirth && differenceInYears(new Date(), adult.item1?.age.dateOfBirth)
                          : adult.item1?.age instanceof AgeInYears
                          ? adult.item1?.age.years && adult.item1?.age.asOf && (adult.item1?.age.years + differenceInYears(new Date(), adult.item1?.age.asOf))
                          : "⚠" }
                      </TableCell>
                    </TableRow>
                  ))}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>
    </Grid>
  );
}

export { Volunteers };
