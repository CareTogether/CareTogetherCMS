import { Button } from '@mui/material';
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  useRecoilRefresher_UNSTABLE,
  useRecoilValueLoadable,
  useSetRecoilState,
} from 'recoil';
import { useBackdrop } from '../Hooks/useBackdrop';
import {
  inviteReviewInfoQuery,
  redemptionSessionIdState,
} from '../Model/SessionModel';
import { ProgressBackdrop } from '../Shell/ProgressBackdrop';
import useScreenTitle from '../Shell/ShellScreenTitle';
import { api } from '../Api/Api';
import { userOrganizationAccessQuery } from '../Model/Data';

function RedeemPersonInvite() {
  // Start by configuring the current redemption session, if there is one.
  const [searchParams] = useSearchParams();
  const redemptionSessionId = searchParams.get('state');
  const setRedemptionSessionId = useSetRecoilState(redemptionSessionIdState);
  useEffect(() => {
    if (redemptionSessionId) {
      setRedemptionSessionId(redemptionSessionId);
    }
  }, [redemptionSessionId, setRedemptionSessionId]);

  // Attempt to retrieve the invite review info for the redemption session.
  // If it can be retrieved, then render the invite review to allow the user the
  // option to confirm accepting the invite.
  const inviteReviewInfo = useRecoilValueLoadable(inviteReviewInfoQuery);

  const withBackdrop = useBackdrop();
  const navigate = useNavigate();

  const refreshUserOrganizationAccess = useRecoilRefresher_UNSTABLE(
    userOrganizationAccessQuery
  );
  async function redeem() {
    if (inviteReviewInfo.state === 'hasValue') {
      await withBackdrop(async () => {
        const result = await api.users.completePersonInviteRedemptionSession(
          redemptionSessionId ?? undefined
        );
        console.log('Invite redemption result:');
        console.log(result);
        refreshUserOrganizationAccess();
        navigate(
          `/org/${inviteReviewInfo.contents!.organizationId}/${inviteReviewInfo.contents!.locationId}/`
        );
      });
    }
  }

  useScreenTitle('Invitation');

  useEffect(() => {
    if (
      inviteReviewInfo.state === 'hasError' ||
      ('hasValue' && inviteReviewInfo.contents == null)
    ) {
      // If the invite review info is available but the contents are null, then the invite
      // has already been redeemed.
      console.log(
        'Invite not found (it may already have been redeemed). Redirecting to root...'
      );
      navigate('/');
    }
  }, [inviteReviewInfo, navigate]);

  return !redemptionSessionId ? (
    <p>
      It appears that you did not use a valid CareTogether invite link to get
      here. If you have a link, try clicking it again.
    </p>
  ) : inviteReviewInfo.state === 'loading' ? (
    <ProgressBackdrop>
      <p>Loading invitation...</p>
    </ProgressBackdrop>
  ) : inviteReviewInfo.state === 'hasError' ||
    inviteReviewInfo.contents == null ? (
    <p>
      An error occurred while trying to retrieve the invitation information.
      Please try clicking the invite link you were provided again. If the
      problem persists, please contact support.
    </p>
  ) : (
    <>
      <h1>You're Invited!</h1>
      <p>
        The link you clicked is an invitation to link your CareTogether account
        to
        <strong> {inviteReviewInfo.contents.organizationName}</strong> at the
        <strong> {inviteReviewInfo.contents.locationName}</strong> location.
      </p>
      <p>
        You are being invited as
        <strong> {inviteReviewInfo.contents.firstName}</strong>
        <strong> {inviteReviewInfo.contents.lastName}</strong>.
      </p>
      <p>Your assigned permissions:</p>
      {inviteReviewInfo.contents.roles &&
      inviteReviewInfo.contents.roles.length > 0 ? (
        <ul>
          {inviteReviewInfo.contents.roles?.map((role) => (
            <li key={role}>{role}</li>
          ))}
        </ul>
      ) : (
        <p>
          <i> (none at this time)</i>
        </p>
      )}
      <p>
        <small>
          Redemption session ID:
          <span style={{ fontFamily: 'monospace' }}>
            {' '}
            {redemptionSessionId}
          </span>
        </small>
      </p>
      <Button onClick={redeem} variant="contained">
        Confirm & Accept Invite
      </Button>
    </>
  );
}

export { RedeemPersonInvite };
