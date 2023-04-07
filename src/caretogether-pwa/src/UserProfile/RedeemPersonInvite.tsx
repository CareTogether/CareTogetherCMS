import { Button } from '@mui/material';
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRecoilRefresher_UNSTABLE, useSetRecoilState } from 'recoil';
import { useBackdrop } from '../Hooks/useBackdrop';
import { useLoadable } from '../Hooks/useLoadable';
import { inviteReviewInfoQuery, redemptionSessionIdState, userOrganizationAccessQuery } from '../Model/SessionModel';
import { ProgressBackdrop } from '../Shell/ProgressBackdrop';
import useScreenTitle from '../Shell/ShellScreenTitle';
import { api } from '../Api/Api';

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
  
  const withBackdrop = useBackdrop();
  const navigate = useNavigate();

  const refreshUserOrganizationAccess = useRecoilRefresher_UNSTABLE(userOrganizationAccessQuery);
  async function redeem() {
    await withBackdrop(async () => {
      const result = await api.users.completePersonInviteRedemptionSession(
        redemptionSessionId);
      console.log("Invite redemption result:");
      console.log(result);
      refreshUserOrganizationAccess();
      navigate('/');
    });
  }

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
        <p>
          The link you clicked is an invitation to link your CareTogether account to
          <strong> {inviteReviewInfo.organizationName}</strong> at the
          <strong> {inviteReviewInfo.locationName}</strong> location.
        </p>
        <p>
          You are being invited as
          <strong> {inviteReviewInfo.firstName}</strong>
          <strong> {inviteReviewInfo.lastName}</strong>.
        </p>
        <p>
          Your assigned permissions:
          {inviteReviewInfo.roles && inviteReviewInfo.roles.length > 0
            ? <ul>
                {inviteReviewInfo.roles?.map(role =>
                  <li>{role}</li>
                )}
              </ul>
            : <span><i> (none at this time)</i></span>}
        </p>
        <p>
          <small>
            Redemption session ID:
            <span style={{fontFamily: 'monospace'}}> {redemptionSessionId}</span>
          </small>
        </p>
        <Button onClick={redeem} variant='contained'>
          Confirm & Accept Invite
        </Button>
      </>
  );
}

export { RedeemPersonInvite };
