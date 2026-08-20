import { Button } from '@mui/material';
import { useAtomValue } from 'jotai';
import { loadable } from 'jotai/utils';
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useBackdrop } from '../Hooks/useBackdrop';
import { inviteReviewInfoQuery } from '../Model/SessionModel';
import { ProgressBackdrop } from '../Shell/ProgressBackdrop';
import { useScreenTitle } from '../Shell/ShellScreenTitle';
import { api } from '../Api/Api';
import { useRefreshUserOrganizationAccess } from '../Model/Data';

function RedeemPersonInvite() {
  const [searchParams] = useSearchParams();
  const redemptionSessionId = searchParams.get('state');

  // Attempt to retrieve the invite review info for the redemption session.
  // If it can be retrieved, then render the invite review to allow the user the
  // option to confirm accepting the invite.
  const inviteReviewInfo = useAtomValue(
    loadable(inviteReviewInfoQuery(redemptionSessionId))
  );

  const withBackdrop = useBackdrop();
  const navigate = useNavigate();

  const refreshUserOrganizationAccess = useRefreshUserOrganizationAccess();
  async function redeem() {
    if (inviteReviewInfo.state === 'hasData') {
      await withBackdrop(async () => {
        const result = await api.users.completePersonInviteRedemptionSession(
          redemptionSessionId ?? undefined
        );
        console.log('Invite redemption result:');
        console.log(result);
        refreshUserOrganizationAccess();
        navigate(
          `/org/${inviteReviewInfo.data!.organizationId}/${inviteReviewInfo.data!.locationId}/`
        );
      });
    }
  }

  useScreenTitle('Invitation');

  useEffect(() => {
    if (
      inviteReviewInfo.state === 'hasError' ||
      (inviteReviewInfo.state === 'hasData' && inviteReviewInfo.data == null)
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
  ) : inviteReviewInfo.state === 'hasError' || inviteReviewInfo.data == null ? (
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
        <strong> {inviteReviewInfo.data.organizationName}</strong> at the
        <strong> {inviteReviewInfo.data.locationName}</strong> location.
      </p>
      <p>
        You are being invited as
        <strong> {inviteReviewInfo.data.firstName}</strong>
        <strong> {inviteReviewInfo.data.lastName}</strong>.
      </p>
      <p>Your assigned permissions:</p>
      {inviteReviewInfo.data.roles && inviteReviewInfo.data.roles.length > 0 ? (
        <ul>
          {inviteReviewInfo.data.roles?.map((role) => (
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
