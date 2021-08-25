import clsx from 'clsx';
import { makeStyles } from '@material-ui/core/styles';
import { AppBar, Badge, Button, ButtonGroup, fade, IconButton, InputBase, Toolbar, Typography } from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import NotificationsIcon from '@material-ui/icons/Notifications';
import React from 'react';
import { Redirect, Route, Switch, useRouteMatch } from 'react-router-dom';
import { VolunteerApproval } from './VolunteerApproval';
import { VolunteerApplications } from './VolunteerApplications';
import { VolunteerProgress } from './VolunteerProgress';
import { Link } from 'react-router-dom';

const useStyles = makeStyles((theme) => ({
    appBar: {
        zIndex: theme.zIndex.drawer + 1,
        transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
    },
    toolbar: {
        paddingRight: 24, // keep right padding when drawer closed
    },
    title: {
        flexGrow: 1,
    },
    search: {
        position: 'relative',
        borderRadius: theme.shape.borderRadius,
        backgroundColor: fade(theme.palette.common.white, 0.15),
        '&:hover': {
            backgroundColor: fade(theme.palette.common.white, 0.25),
        },
        marginLeft: 0,
        marginRight: theme.spacing(1),
        width: '100%',
        [theme.breakpoints.up('sm')]: {
            marginLeft: theme.spacing(1),
            width: 'auto',
        },
    },
    searchIcon: {
        padding: theme.spacing(0, 2),
        height: '100%',
        position: 'absolute',
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    inputRoot: {
        color: 'inherit',
    },
    inputInput: {
        padding: theme.spacing(1, 1, 1, 0),
        // vertical padding + font size from searchIcon
        paddingLeft: `calc(1em + ${theme.spacing(4)}px)`,
        transition: theme.transitions.create('width'),
        width: '100%',
        [theme.breakpoints.up('sm')]: {
            width: '12ch',
            '&:focus': {
                width: '20ch',
            },
        },
    },
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
    let match = useRouteMatch();

    return (
        <>
            <AppBar position="absolute" className={clsx(classes.appBar)}>
                <Toolbar className={classes.toolbar} variant="dense">
                    <Typography component="h1" variant="h6" color="inherit" noWrap className={classes.title}>
                        Volunteers
                    </Typography>
                    <ButtonGroup variant="text" color="inherit" aria-label="text inherit button group">
                        <Button component={Link} to={`${match.url}/approval`}>Approvals</Button>
                        <Button component={Link} to={`${match.url}/applications`}>Applications</Button>
                        <Button component={Link} to={`${match.url}/progress`}>Progress</Button>
                    </ButtonGroup>
                    <div className={classes.search}>
                        <div className={classes.searchIcon}>
                            <SearchIcon />
                        </div>
                        <InputBase
                            placeholder="Search…"
                            classes={{
                                root: classes.inputRoot,
                                input: classes.inputInput,
                            }}
                            inputProps={{ 'aria-label': 'search' }}
                        />
                    </div>
                    <IconButton color="inherit">
                        <Badge badgeContent={4} color="secondary">
                            <NotificationsIcon />
                        </Badge>
                    </IconButton>
                </Toolbar>
            </AppBar>
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
                            <Redirect to="/volunteers/approval" />
                        </Route>
                    </Switch>
                </React.Suspense>
                {/* </Container> */}
            </main>
        </>
    );
}

export { Volunteers };
