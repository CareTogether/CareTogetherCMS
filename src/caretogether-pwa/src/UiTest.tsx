import { Skeleton } from "@mui/material";
import { userOrganizationAccessQuery } from "./Model/SessionModel";
import { useLoadable } from "./Hooks/useLoadable";

export function UiTest() {
  const data = useLoadable(userOrganizationAccessQuery);
  
  return (
    <>
      <p>UI Test</p>
      {data !== null
        ? <pre>{JSON.stringify(data)}</pre>
        : <Skeleton variant="rectangular" width={400} height={24} />}
    </>
  );
}