import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRepositoryStore } from '../store/repositoryStore';
import { useReviewStore } from '../store/reviewStore';
import { GitPullRequest, RefreshCcw, ExternalLink, Play, Eye } from 'lucide-react';
import { cn } from '../utils/cn';
import { toast } from 'sonner';

const PullRequests = () => {
  const navigate = useNavigate();
  const { selectedRepositoryId, pullRequests, isPullRequestsLoading, fetchPullRequests, repositories } = useRepositoryStore();
  const { runReview, isLoading: isReviewStarting } = useReviewStore();

  const selectedRepo = repositories.find(r => r.id === selectedRepositoryId);

  useEffect(() => {
    if (selectedRepositoryId) {
      fetchPullRequests(selectedRepositoryId);
    }
  }, [selectedRepositoryId, fetchPullRequests]);

  const handleRunReview = async (pr: any) => {
    if (!selectedRepositoryId) return;
    try {
      await runReview({
        repository_id: selectedRepositoryId,
        commit_sha: pr.head.sha,
        base_sha: pr.base.sha,
        pr_number: pr.number
      });
      toast.success(`AI review triggered for PR #${pr.number}`);
    } catch (err) {
      toast.error('Failed to trigger AI review');
    }
  };

  if (!selectedRepositoryId) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center">
        <GitPullRequest size={48} className="text-border-primary mb-4" />
        <h3 className="text-headline">No repository selected</h3>
        <p className="text-body-sm text-on-surface-variant mt-1">Please select a repository from the top-right menu to view pull requests.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display">Pull Requests</h1>
          <p className="text-body-sm text-on-surface-variant mt-1 font-mono tracking-tight uppercase">
            Repository: <span className="text-primary font-bold">{selectedRepo?.full_name}</span>
          </p>
        </div>
        <button 
          onClick={() => fetchPullRequests(selectedRepositoryId)}
          disabled={isPullRequestsLoading}
          className="flex items-center gap-2 px-3 py-1.5 bg-charcoal border border-border-primary hover:border-vercel-blue text-on-surface-variant hover:text-on-surface rounded-sm text-label-caps transition-all disabled:opacity-50"
        >
          <RefreshCcw size={12} className={cn(isPullRequestsLoading && "animate-spin")} />
          <span>Refresh</span>
        </button>
      </div>

      {isPullRequestsLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-charcoal/50 border border-border-primary rounded-sm animate-pulse" />
          ))}
        </div>
      ) : pullRequests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-charcoal/30 border border-dashed border-border-primary rounded-sm text-center">
          <GitPullRequest size={48} className="text-border-primary mb-4" />
          <h3 className="text-headline">No open Pull Requests</h3>
          <p className="text-body-sm text-on-surface-variant mt-1">There are no open pull requests for this repository on GitHub.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pullRequests.map(pr => (
            <div key={pr.id} className="bg-charcoal border border-border-primary rounded-sm p-4 hover:border-border-primary/80 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="mt-1 shrink-0 p-1.5 bg-obsidian border border-border-primary text-linear-purple rounded-sm">
                  <GitPullRequest size={16} />
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <a 
                      href={pr.html_url} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-body-md font-semibold text-on-surface hover:text-primary transition-colors flex items-center gap-1 min-w-0 truncate font-sans"
                    >
                      <span className="truncate">{pr.title}</span>
                      <ExternalLink size={12} className="shrink-0 text-on-surface-variant" />
                    </a>
                    <span className="text-code-sm text-on-surface-variant font-mono">#{pr.number}</span>
                  </div>
                  <div className="flex items-center gap-2 text-code-sm text-on-surface-variant flex-wrap">
                    <span>by {pr.user?.login}</span>
                    <span className="w-1 h-1 bg-border-primary rounded-full"></span>
                    <span className="font-mono text-[10px] bg-obsidian px-1.5 py-0.5 rounded border border-border-primary text-emerald">{pr.head?.ref}</span>
                    <span>into</span>
                    <span className="font-mono text-[10px] bg-obsidian px-1.5 py-0.5 rounded border border-border-primary text-primary">{pr.base?.ref}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex -space-x-1 shrink-0">
                  {pr.user?.avatar_url && (
                    <img 
                      src={pr.user.avatar_url} 
                      alt={pr.user.login} 
                      className="w-6 h-6 rounded-full border border-border-primary bg-obsidian"
                    />
                  )}
                </div>
                <button 
                  onClick={() => navigate('/diff', { state: { prNumber: pr.number } })}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-charcoal border border-border-primary hover:border-vercel-blue text-on-surface-variant hover:text-on-surface rounded-sm text-[10px] font-bold uppercase transition-all cursor-pointer select-none"
                >
                  <Eye size={11} />
                  <span>View Diff</span>
                </button>
                <button 
                  onClick={() => handleRunReview(pr)}
                  disabled={isReviewStarting}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-vercel-blue text-white rounded-sm text-[10px] font-bold uppercase hover:bg-vercel-blue/90 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Play size={10} fill="currentColor" />
                  <span>Run AI Review</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PullRequests;