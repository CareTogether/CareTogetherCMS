import { Redirect, Route, Switch, useRouteMatch } from 'react-router-dom';
import { PartneringFamilies } from './PartneringFamilies';
import { PartneringFamilyScreen } from './PartneringFamilyScreen';

function Referrals() {
  const match = useRouteMatch();

  return (
    <>
      <Switch>
        <Route path={`${match.path}/family/:partneringFamilyId`}>
          <PartneringFamilyScreen />
        </Route>
        <Route path={`${match.path}`}>
          <PartneringFamilies />
        </Route>
        <Route>
          <Redirect to={`${match.path}`} />
        </Route>
      </Switch>
    </>
  );
}

export { Referrals };
