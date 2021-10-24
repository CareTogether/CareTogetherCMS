import { Redirect, Route, Switch, useRouteMatch } from 'react-router-dom';
import { VolunteerApproval } from './VolunteerApproval';
//import { VolunteerApplications } from './VolunteerApplications';
import { VolunteerProgress } from './VolunteerProgress';
import { VolunteerFamilyScreen } from './VolunteerFamilyScreen';

function Volunteers() {
  const match = useRouteMatch();

  return (
    <>
      <Switch>
        <Route path={`${match.path}/approval`}>
          <VolunteerApproval />
        </Route>
        {/* <Route path={`${match.path}/applications`}>
          <VolunteerApplications />
        </Route> */}
        <Route path={`${match.path}/progress`}>
          <VolunteerProgress />
        </Route>
        <Route path={`${match.path}/family/:volunteerFamilyId`}>
          <VolunteerFamilyScreen />
        </Route>
        <Route>
          <Redirect to={`${match.path}/approval`} />
        </Route>
      </Switch>
    </>
  );
}

export { Volunteers };
