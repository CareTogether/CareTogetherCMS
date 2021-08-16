import { makeStyles } from '@material-ui/core/styles';
import { Grid, Paper, Table, TableContainer, TableBody, TableCell, TableHead, TableRow } from '@material-ui/core';
import { useRecoilValue } from 'recoil';
import { peopleData } from '../Model/PeopleModel';
import { AgeText } from './AgeText';

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
}));

function Contacts() {
  const classes = useStyles();
  const people = useRecoilValue(peopleData);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <TableContainer component={Paper}>
          <Table className={classes.table} size="small">
            <TableHead>
              <TableRow>
                <TableCell align="center" colSpan={3}>
                  Person
                </TableCell>
                <TableCell align="right">Age</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>First Name</TableCell>
                <TableCell>Last Name</TableCell>
                <TableCell align="right">User ID</TableCell>
                <TableCell align="right">(years)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {people.map((person) => (
                <TableRow key={person.id}>
                  <TableCell>{person.firstName}</TableCell>
                  <TableCell>{person.lastName}</TableCell>
                  <TableCell align="right">{person.userId}</TableCell>
                  <TableCell align="right">
                    <AgeText age={person.age} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>
    </Grid>
  );
}

export { Contacts };
