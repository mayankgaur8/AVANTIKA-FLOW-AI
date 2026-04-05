import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NameYourTeamModal } from '../components/NameYourTeamModal';
import { useAuth } from '../context/AuthContext';

export const ApprovalSuccessPage = () => {
  const navigate = useNavigate();
  const { state, token, user, refresh } = useAuth();

  useEffect(() => {
    if (state === 'email_verified_with_team') navigate('/dashboard', { replace: true });
    if (state === 'email_verification_pending' || state === 'authenticated_unverified') navigate('/verify-email-pending', { replace: true });
    if (state === 'rejected_or_blocked') navigate('/rejected-access', { replace: true });
    if (state === 'anonymous') navigate('/signin', { replace: true });
  }, [state, navigate]);

  return (
    <div className="min-h-screen bg-[#050c18]">
      {token ? (
        <NameYourTeamModal
          isOpen={state === 'email_verified_no_team'}
          token={token}
          initialValue={user?.team_name || ''}
          onComplete={async () => {
            await refresh();
            navigate('/dashboard', { replace: true });
          }}
        />
      ) : null}
    </div>
  );
};
