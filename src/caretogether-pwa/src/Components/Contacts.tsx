import clsx from 'clsx';
import { makeStyles } from '@material-ui/core/styles';
import { Grid, Paper } from '@material-ui/core';
import { useEffect, useState } from 'react';
import { ExactAge, AgeInYears, PeopleClient, Person } from '../GeneratedClient';
import { useAccount, useMsal } from '@azure/msal-react';
import { AccountInfo } from '@azure/msal-browser';
import { differenceInYears } from 'date-fns';

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

class AuthenticatedHttp {
  constructor(private accessToken: string) {}

  fetch(url: RequestInfo, init?: RequestInit): Promise<Response> {
    init && (init.headers = {
      ...init.headers,
      Authorization: `Bearer ${this.accessToken}`
    });
    return window.fetch(url, init);
  }
}

function Contacts() {
  const classes = useStyles();
  const [people, setPeople] = useState<Person[]>([]);
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0]) as AccountInfo;

  useEffect(() => {
    (async () => {
      const authResponse = await instance.acquireTokenSilent({
        scopes: ["https://caretogetherb2cdev.onmicrosoft.com/cms/v1/Access"],
        account: account
      });
      const peopleClient = new PeopleClient("https://localhost:44359", new AuthenticatedHttp(authResponse.accessToken));
      const dataResponse = await peopleClient.get("11111111-1111-1111-1111-111111111111", "22222222-2222-2222-2222-222222222222");
      setPeople(dataResponse);
    })();
  }, []);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Paper className={clsx(classes.paper, classes.fixedHeight)}>
          Area 1
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
