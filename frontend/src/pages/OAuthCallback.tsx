import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';

let oauthCalled = false;

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuthStore();

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (code && state) {
      if (oauthCalled) return;
      oauthCalled = true;

      const handleCallback = async () => {
        try {
          const response = await authApi.callback(code, state);
          const { access_token } = response.data;
          await login(access_token);
          toast.success('Successfully authenticated with GitHub');
          navigate('/dashboard');
        } catch (error) {
          console.error('OAuth callback failed:', error);
          toast.error('Authentication failed. Please try again.');
          navigate('/login');
        } finally {
          oauthCalled = false;
        }
      };

      handleCallback();
    } else {
      navigate('/login');
    }
  }, [searchParams, navigate, login]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-obsidian">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-vercel-blue border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-on-surface-variant animate-pulse font-mono uppercase tracking-widest text-xs">
          Authenticating with GitHub...
        </p>
      </div>
    </div>
  );
};

export default OAuthCallback;
