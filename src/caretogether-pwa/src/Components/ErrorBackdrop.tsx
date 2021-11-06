import { Backdrop } from "@material-ui/core";
import { useEffect } from "react";
import { atom, useRecoilState } from "recoil";

const errorInfoData = atom<PromiseRejectionEvent | null>({
  key: 'errorInfoData',
  default: null
});

export default function ErrorBackdrop() {
  const [errorInfo, setErrorInfo] = useRecoilState(errorInfoData);

  useEffect(() => {
    window.onunhandledrejection = (e: PromiseRejectionEvent) => {
      setErrorInfo(e);
    };
  }, [setErrorInfo]);

  return (
    <Backdrop
      style={{zIndex: 10001}}
      open={Boolean(errorInfo)}
      onClick={() => setErrorInfo(null)}>
      <div style={{backgroundColor: '#fff', padding: 20, borderStyle: 'solid', borderRadius: 20, borderColor: '#500', borderWidth: 3, maxWidth: 500 }}>
        <h2>🤓 Ooops! Time to email tech support. 📧</h2>
        <p>Looks like something went wrong! When you reach out for help, please include a screenshot and a description (as precise as possible) of the steps you took to get here.</p>
        <pre>Error: {JSON.stringify(errorInfo)}</pre>
        <pre>URL: {window.location.toString()}</pre>
      </div>
    </Backdrop>
  );
};
