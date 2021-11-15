import { Backdrop } from "@material-ui/core";
import { useEffect } from "react";
import { atom, selector, useRecoilState, useRecoilValue } from "recoil";
import StackTrace from "stacktrace-js";

const errorInfoData = atom<any>({
  key: 'errorInfoData',
  default: null
});

const errorStackTraceData = selector({
  key: 'errorStackTraceData',
  get: async ({get}) => {
    const errorInfo = get(errorInfoData);
    const stackTrace = await StackTrace.fromError(errorInfo);
    return stackTrace;
  }
})

export default function ErrorBackdrop() {
  const [errorInfo, setErrorInfo] = useRecoilState(errorInfoData);
  const errorStackTrace = useRecoilValue(errorStackTraceData);

  useEffect(() => {
    window.onunhandledrejection = (e: PromiseRejectionEvent) => {
      console.log("onunhandledrejection");
      setErrorInfo(e);
    };
    window.onerror = (event, source, lineno, colno, error) => {
      console.log("onerror");
      setErrorInfo(error);
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
        <pre style={{whiteSpace: 'pre-wrap'}}>Error: {errorStackTrace}</pre>
        <pre style={{whiteSpace: 'pre-wrap'}}>URL: {window.location.toString()}</pre>
      </div>
    </Backdrop>
  );
};
