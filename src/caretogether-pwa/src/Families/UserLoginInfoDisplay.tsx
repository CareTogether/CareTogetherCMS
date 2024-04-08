import { Skeleton } from "@mui/material";
import { UserLoginInfo } from "../GeneratedClient";
import { useRecoilValue } from "recoil";
import { useEffect, useState } from "react";
import { api } from "../Api/Api";
import { selectedLocationContextState } from "../Model/Data";
import { formatRelative } from "date-fns";

export function UserLoginInfoDisplay({ personId }: { personId: string; }) {
  const { organizationId, locationId } = useRecoilValue(selectedLocationContextState);

  const [userLoginInfo, setUserLoginInfo] = useState<UserLoginInfo | undefined>(undefined);
  useEffect(() => {
    setUserLoginInfo(undefined);
    async function loadUserLoginInfo() {
      const loginInfo = await api.users.getPersonLoginInfo(organizationId, locationId, personId);
      setUserLoginInfo(loginInfo);
    }
    void loadUserLoginInfo();
  }, [organizationId, locationId, personId]);

  const emailAddress = userLoginInfo?.identities?.find(i => i.signInType === "emailAddress")?.issuerAssignedId;

  return (
    <>
      <br />
      {userLoginInfo
        ? <>
          <br />
          Username: <strong>{emailAddress}</strong>
          <br />
          Last sign-in: <strong>{userLoginInfo.lastSignIn ? formatRelative(userLoginInfo.lastSignIn, new Date()) : 'never'}</strong>
          {/* <br />
              User ID (for contacting CareTogether tech support):
              <br />
              <pre>{userLoginInfo.userId}</pre> */}
        </>
        : <Skeleton variant='text' width={200} />}
    </>
  );
}
