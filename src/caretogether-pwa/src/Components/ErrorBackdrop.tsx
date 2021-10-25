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
        <h2>Ooops! Something went wrong.</h2>
        <p>Please tell us about it! There might be some useful info below.</p>
        <p>When sending an error report, please include as precise as possible a description of what you were doing,
          along with a screenshot - and make sure to include your browser's address bar in the screenshot.</p>
        <pre>{JSON.stringify(errorInfo)}</pre>
      </div>
    </Backdrop>
  );
};
