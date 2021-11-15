import { Backdrop } from "@material-ui/core";
import { useEffect } from "react";
import { atom, useRecoilState } from "recoil";

const errorInfoData = atom<Error | null | undefined>({
  key: 'errorInfoData',
  default: undefined
});

export default function ErrorBackdrop() {
  const [errorInfo, setErrorInfo] = useRecoilState(errorInfoData);

  useEffect(() => {
    window.onunhandledrejection = (e: PromiseRejectionEvent) => {
      setErrorInfo(e.reason);
    };
    window.onerror = (_event, _source, _lineno, _colno, error) => {
      setErrorInfo(error);
    };
  }, [setErrorInfo]);

  return (
    <Backdrop
      style={{zIndex: 10001}}
      open={Boolean(errorInfo)}
      onClick={() => setErrorInfo(null)}>
      <div style={{backgroundColor: '#fff', padding: 20, borderStyle: 'solid', borderRadius: 20, borderColor: '#500', borderWidth: 3, maxWidth: 400 }}>
        <h2>🤓 Ooops! Time to email tech support... 📧</h2>
        <p>
          Looks like something went wrong! When you reach out for help,
          please include a screenshot and a description (as precise as
          possible) of the steps you took to get here.</p>
        <pre style={{whiteSpace: 'pre-wrap', wordBreak: 'break-all'}}>URL: {window.location.toString()}</pre>
        <pre style={{whiteSpace: 'pre-wrap', wordBreak: 'break-all'}}>Message: {errorInfo?.message}</pre>
        <pre style={{whiteSpace: 'pre-wrap', wordBreak: 'break-all'}}>Error: {errorInfo?.name}</pre>
        <pre style={{whiteSpace: 'pre-wrap', wordBreak: 'break-all'}}>Stack: {errorInfo?.stack}</pre>
      </div>
    </Backdrop>
  );
};
