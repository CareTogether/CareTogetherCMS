import { makeStyles } from '@material-ui/core/styles';
import { BottomNavigation, BottomNavigationAction } from '@material-ui/core';
import { Link, withRouter } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';

import EmojiPeopleIcon from '@material-ui/icons/EmojiPeople';
import AssignmentIcon from '@material-ui/icons/Assignment';
import AssignmentTurnedInIcon from '@material-ui/icons/AssignmentTurnedIn';

const useStyles = makeStyles((theme) => ({
    stickToBottom: {
        width: '100%',
        position: 'fixed',
        bottom: 0,
    },
}));

function Footer(props: any) {
    const { location } = props;

    const classes = useStyles();
    const [selectedBottomNavAction, setSelectedBottomNavAction] = useState(0);

    const memoizedPathMap = useMemo(() => {
        return ['/volunteers', '/volunteerApplications', '/volunteerProgress'];
    }, []);

    useEffect(() => {
        const newValue = memoizedPathMap.indexOf(location.pathname);
        setSelectedBottomNavAction(newValue);
    }, [memoizedPathMap, location.pathname]);

    return (
        <BottomNavigation
            value={selectedBottomNavAction}
            onChange={(_, newValue) => {
                setSelectedBottomNavAction(newValue);
            }}
            showLabels
            className={classes.stickToBottom}
        >
            <BottomNavigationAction component={Link} to={memoizedPathMap[0]} label="Volunteers" icon={<EmojiPeopleIcon />} />
            <BottomNavigationAction component={Link} to={memoizedPathMap[1]} label="Applications" icon={<AssignmentIcon />} />
            <BottomNavigationAction component={Link} to={memoizedPathMap[2]} label="Progress" icon={<AssignmentTurnedInIcon />} />
        </BottomNavigation>
    );
}

export default withRouter(Footer);
