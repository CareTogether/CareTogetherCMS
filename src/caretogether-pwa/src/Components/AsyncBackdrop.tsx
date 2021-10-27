import { makeStyles, Backdrop, CircularProgress } from "@material-ui/core";
import { atom, useRecoilState } from 'recoil';

const useStyles = makeStyles((theme) => ({
    backdrop: {
        color: '#fff',
        zIndex: theme.zIndex.drawer +1
      },
    }));
    
export const backdropState = atom({
  key: 'backdropState',
  default: false,
});

function AsyncBackdrop() {
    const classes = useStyles();
    const [backdropOpen, setBackdropOpen] = useRecoilState(backdropState);

    return (
        <Backdrop
          className={classes.backdrop}
          open={backdropOpen}
          onClick={() => setBackdropOpen(false)}
        >
          <CircularProgress color="inherit" />
        </Backdrop>
        );
}

export default AsyncBackdrop;