import React from 'react';
import clsx from 'clsx';
import { AppBar, Toolbar, IconButton, Typography, useMediaQuery, useTheme, fade, Button, ButtonGroup } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import MenuIcon from '@material-ui/icons/Menu';
import { Link, useLocation, useRouteMatch } from 'react-router-dom';

const drawerWidth = 200;

const useStyles = makeStyles((theme) => ({
    appBar: {
        zIndex: theme.zIndex.drawer + 1,
        transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
    },
    appBarShift: {
        marginLeft: drawerWidth,
        width: `calc(100% - ${drawerWidth}px)`,
        transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
        }),
    },
    appBarSpacer: {
        height: 48,
    },
    toolbar: {
        paddingRight: 24, // keep right padding when drawer closed
    },
    menuButton: {
        marginRight: 36,
    },
    menuButtonHidden: {
        display: 'none',
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
}));

interface HeaderProps {
    open: boolean,
    handleDrawerOpen: () => void;
}

function Header(props: HeaderProps) {
    const { open, handleDrawerOpen } = props;

    const classes = useStyles();

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const dashboardMatch = useRouteMatch({
        path: '/dashboard',
    })
    const referralsMatch = useRouteMatch({
        path: '/referrals',
    })
    const volunteerMatch = useRouteMatch({
        path: '/volunteers/:slug',
        strict: true,
        sensitive: true
    });
    const location = useLocation();

    return (
        <AppBar position="absolute" className={clsx(classes.appBar, (open && !isMobile) && classes.appBarShift)}>
            <Toolbar className={classes.toolbar} variant="dense">
                <IconButton
                    edge="start"
                    color="inherit"
                    aria-label="open drawer"
                    onClick={handleDrawerOpen}
                    className={clsx(classes.menuButton, open && classes.menuButtonHidden)}
                >
                    <MenuIcon />
                </IconButton>
                {!isMobile && <Typography component="h1" variant="h6" color="inherit" noWrap className={classes.title}>
                    {dashboardMatch && "Dashboard"}
                    {referralsMatch && "Referrals"}
                    {volunteerMatch && "Volunteers"}
                </Typography>}
                {volunteerMatch && <ButtonGroup variant="text" color="inherit" aria-label="text inherit button group">
                    <Button color={location.pathname === "/volunteers/approval" ? 'default' : 'inherit'} component={Link} to={"/volunteers/approval"}>Approvals</Button>
                    <Button color={location.pathname === "/volunteers/applications" ? 'default' : 'inherit'} component={Link} to={"/volunteers/applications"}>Applications</Button>
                    <Button color={location.pathname === "/volunteers/progress" ? 'default' : 'inherit'} component={Link} to={"/volunteers/progress"}>Progress</Button>
                </ButtonGroup>}
            </Toolbar>
        </AppBar>
    );
}

export default Header;
