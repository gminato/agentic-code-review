import { GitFork } from 'lucide-react';

import { toast } from 'sonner';

const Login = () => {
  const handleGithubLogin = async () => {
    try {
      // In a real app, the backend handles the redirect
      // But we can also get the URL from the backend if it's dynamic
      window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'}/auth/github/login`;
    } catch (error) {
      toast.error('Failed to initiate GitHub login');
    }
  };

  return (
    <div className="min-h-screen bg-obsidian flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-charcoal border border-border-primary mb-6 shadow-2xl">
            <span className="text-2xl font-bold text-primary tracking-tighter italic">A</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-on-surface">Agentic Code Review</h1>
          <p className="text-on-surface-variant mt-2 text-sm">Autonomous intelligence for high-velocity engineering.</p>
        </div>

        <div className="bg-charcoal border border-border-primary rounded-xl p-8 space-y-6 shadow-xl">
          <button 
            onClick={handleGithubLogin}
            className="w-full flex items-center justify-center gap-3 bg-white text-obsidian hover:bg-on-surface transition-colors py-2.5 rounded-md font-semibold text-sm"
          >
            <GitFork size={18} />
            <span>Continue with GitHub</span>
          </button>
          
          <p className="text-[10px] text-center text-on-surface-variant uppercase tracking-widest font-mono">
            Infrastructure-grade review
          </p>
        </div>

        <div className="text-center">
          <p className="text-xs text-on-surface-variant">
            By continuing, you agree to our <a href="#" className="underline hover:text-primary">Terms of Service</a> and <a href="#" className="underline hover:text-primary">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
