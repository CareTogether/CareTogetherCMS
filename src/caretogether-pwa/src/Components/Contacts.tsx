import clsx from 'clsx';
import { makeStyles } from '@material-ui/core/styles';
import { Grid, Paper } from '@material-ui/core';
import { ExactAge, AgeInYears } from '../GeneratedClient';
import { differenceInYears } from 'date-fns';
import { useRecoilValue } from 'recoil';
import { peopleData, useRefreshPeople } from '../Model/PeopleModel';

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
}));

function Contacts() {
  const classes = useStyles();
  const people = useRecoilValue(peopleData);
  const refreshContacts = useRefreshPeople();

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Paper className={clsx(classes.paper, classes.fixedHeight)}>
          <button onClick={refreshContacts}>🔃 Refresh People</button>
          <br />
          <table>
            <thead>
              <tr>
                <th>First Name</th>
                <th>Last Name</th>
                <th>User ID</th>
                <th>Age</th>
              </tr>
            </thead>
            <tbody>
              {people.map(person => (
                <tr key={person.id}>
                  <td>{person.firstName}</td>
                  <td>{person.lastName}</td>
                  <td>{person.userId}</td>
                  <td>
                    { person.age instanceof ExactAge
                      ? person.age.dateOfBirth && differenceInYears(new Date(), person.age.dateOfBirth)
                      : person.age instanceof AgeInYears
                      ? person.age.years && person.age.asOf && (person.age.years + differenceInYears(new Date(), person.age.asOf))
                      : "⚠" }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Paper>
      </Grid>
    </Grid>
  );
}

export { Contacts };
