import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSetRecoilState } from 'recoil';
import { useLoadable } from '../Hooks/useLoadable';
import { inviteReviewInfoQuery, redemptionSessionIdState } from '../Model/SessionModel';
import { ProgressBackdrop } from '../Shell/ProgressBackdrop';
import useScreenTitle from '../Shell/ShellScreenTitle';

function RedeemPersonInvite() {
  // Start by configuring the current redemption session, if there is one.
  const [searchParams, ] = useSearchParams();
  const redemptionSessionId = searchParams.get("state");
  const setRedemptionSessionId = useSetRecoilState(redemptionSessionIdState);
  useEffect(() => {
    if (redemptionSessionId) {
      setRedemptionSessionId(redemptionSessionId);
    }
  }, [redemptionSessionId, setRedemptionSessionId]);

  // Attempt to retrieve the invite review info for the redemption session.
  // If it can be retrieved, then render the invite review to allow the user the
  // option to confirm accepting the invite.
  const inviteReviewInfo = useLoadable(inviteReviewInfoQuery);

  //TODO: Provide a 'confirm' button

  useScreenTitle("Invitation");

  return (!redemptionSessionId
    ? <p>
        It appears that you did not use a valid CareTogether invite link to get here.
        If you have a link, try clicking it again.
      </p>
    : !inviteReviewInfo
    ? <ProgressBackdrop>
        <p>Loading invitation...</p>
      </ProgressBackdrop>
    : <>
        <h1>You're Invited!</h1>
        <pre>{redemptionSessionId}</pre>
        <pre>{JSON.stringify(inviteReviewInfo)}</pre>
      </>
  );
}

export { RedeemPersonInvite };
