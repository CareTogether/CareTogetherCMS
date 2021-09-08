import { makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { Redirect, Route, Switch, useRouteMatch } from 'react-router-dom';
import { VolunteerApproval } from './VolunteerApproval';
import { VolunteerApplications } from './VolunteerApplications';
import { VolunteerProgress } from './VolunteerProgress';

const useStyles = makeStyles((theme) => ({
    appBarSpacer: {
        height: 48,
    },
    content: {
        flexGrow: 1,
        height: '100vh',
        overflow: 'auto',
    },

}));

function Volunteers() {
    const classes = useStyles();
    const match = useRouteMatch();

    return (
        <>
            <main className={classes.content}>
                <div className={classes.appBarSpacer} />
                {/* <Container maxWidth="lg" className={classes.container}> */}
                <React.Suspense fallback={<div>Loading...</div>}>
                    <Switch>
                        <Route path={`${match.path}/approval`}>
                            <VolunteerApproval />
                        </Route>
                        <Route path={`${match.path}/applications`}>
                            <VolunteerApplications />
                        </Route>
                        <Route path={`${match.path}/progress`}>
                            <VolunteerProgress />
                        </Route>
                        <Route>
                            <Redirect to={`${match.path}/approval`} />
                        </Route>
                    </Switch>
                </React.Suspense>
                {/* </Container> */}
            </main>
        </>
    );
}

export { Volunteers };
