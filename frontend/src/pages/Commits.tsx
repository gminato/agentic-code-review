import { useEffect, useState } from 'react';
import { useRepositoryStore } from '../store/repositoryStore';
import { useReviewStore } from '../store/reviewStore';
import { Activity, RefreshCcw, ShieldCheck, Play, ClipboardList } from 'lucide-react';
import { cn } from '../utils/cn';
import { toast } from 'sonner';

const Commits = () => {
  const { selectedRepositoryId, repositories } = useRepositoryStore();
  const { reviews, fetchReviews, isLoading, runReview } = useReviewStore();
  const selectedRepo = repositories.find(r => r.id === selectedRepositoryId);

  const [commitSha, setCommitSha] = useState('');
  const [baseSha, setBaseSha] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (selectedRepositoryId) {
      fetchReviews(selectedRepositoryId);
    }
  }, [selectedRepositoryId, fetchReviews]);

  const handleManualReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRepositoryId) return;
    if (!commitSha || !baseSha) {
      toast.error('Please fill in both Commit SHA and Base SHA');
      return;
    }

    setIsSubmitting(true);
    try {
      await runReview({
        repository_id: selectedRepositoryId,
        commit_sha: commitSha,
        base_sha: baseSha
      });
      toast.success('AI review successfully triggered!');
      setCommitSha('');
      setBaseSha('');
    } catch (err) {
      toast.error('Failed to trigger manual review');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!selectedRepositoryId) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center">
        <Activity size={48} className="text-border-primary mb-4" />
        <h3 className="text-headline">No repository selected</h3>
        <p className="text-body-sm text-on-surface-variant mt-1">Please select a repository from the top-right menu to view reviewed commits.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-display">Commit AI Reviews</h1>
          <p className="text-body-sm text-on-surface-variant mt-1 font-mono tracking-tight uppercase">
            Repository: <span className="text-primary font-bold">{selectedRepo?.full_name}</span>
          </p>
        </div>
        <button 
          onClick={() => fetchReviews(selectedRepositoryId)}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-1.5 bg-charcoal border border-border-primary hover:border-vercel-blue text-on-surface-variant hover:text-on-surface rounded-sm text-label-caps transition-all disabled:opacity-50 self-start"
        >
          <RefreshCcw size={12} className={cn(isLoading && "animate-spin")} />
          <span>Refresh Timeline</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter items-start">
        {/* Left Side: Commit Timeline */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-label-caps text-on-surface-variant tracking-wider">Review History</h3>
          
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="h-28 bg-charcoal/50 border border-border-primary rounded-sm animate-pulse" />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-charcoal/30 border border-dashed border-border-primary rounded-sm text-center">
              <ClipboardList size={40} className="text-border-primary mb-3" />
              <p className="text-body-md font-semibold">No commits reviewed yet</p>
              <p className="text-body-sm text-on-surface-variant mt-1 max-w-sm">Trigger your first review using the manual panel on the right or via your GitHub pull requests.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map(review => (
                <div key={review.id} className="bg-charcoal border border-border-primary rounded-sm p-4 hover:border-border-primary/80 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-semibold text-primary bg-obsidian border border-border-primary px-2 py-0.5 rounded-sm">
                        {review.commit_sha.substring(0, 7)}
                      </span>
                      {review.pr_number && (
                        <span className="text-[10px] text-linear-purple bg-linear-purple/10 border border-linear-purple/20 px-1.5 py-0.5 rounded-full font-semibold">
                          PR #{review.pr_number}
                        </span>
                      )}
                      <span className={cn(
                        "text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full border",
                        review.status === 'completed' && "bg-emerald/10 border-emerald/20 text-emerald",
                        review.status === 'pending' && "bg-amber/10 border-amber/20 text-amber animate-pulse",
                        review.status === 'failed' && "bg-rose/10 border-rose/20 text-rose"
                      )}>
                        {review.status}
                      </span>
                    </div>
                    <p className="text-body-sm font-sans font-medium text-on-surface line-clamp-2 mt-1">
                      {review.summary || "Pending security analysis and risk assessment..."}
                    </p>
                    <div className="text-[10px] text-on-surface-variant font-mono">
                      Reviewed on: {new Date(review.created_at).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 border-l border-border-primary pl-4">
                    <div className="text-right">
                      <p className="text-[9px] font-mono uppercase tracking-wider text-on-surface-variant">Risk Score</p>
                      <h4 className={cn(
                        "text-xl font-bold font-mono",
                        review.risk_score && review.risk_score > 7 ? "text-rose" : review.risk_score && review.risk_score > 4 ? "text-amber" : "text-emerald"
                      )}>
                        {review.risk_score !== undefined && review.risk_score !== null ? `${review.risk_score.toFixed(1)}/10` : "-"}
                      </h4>
                    </div>
                    <div className="text-center bg-obsidian border border-border-primary rounded-sm p-2">
                      <ShieldCheck size={18} className={cn(
                        review.comments.length > 0 ? "text-amber" : "text-emerald"
                      )} />
                      <span className="text-[9px] font-mono block mt-1">{review.comments.length} Findings</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Manual Review Trigger */}
        <div className="bg-charcoal border border-border-primary rounded-sm p-4 space-y-4">
          <div>
            <h3 className="text-headline">Trigger AI Review</h3>
            <p className="text-body-sm text-on-surface-variant mt-1">Manually run an AI code analysis on a specific commit range.</p>
          </div>

          <form onSubmit={handleManualReview} className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant block">Base SHA / Ref</label>
              <input 
                type="text" 
                placeholder="e.g. main" 
                value={baseSha}
                onChange={e => setBaseSha(e.target.value)}
                className="w-full bg-obsidian border border-border-primary focus:border-vercel-blue focus:outline-none rounded-sm p-2 font-mono text-xs transition-colors"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant block">Target Commit SHA</label>
              <input 
                type="text" 
                placeholder="e.g. a5f20c1..." 
                value={commitSha}
                onChange={e => setCommitSha(e.target.value)}
                className="w-full bg-obsidian border border-border-primary focus:border-vercel-blue focus:outline-none rounded-sm p-2 font-mono text-xs transition-colors"
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2 bg-vercel-blue text-white rounded-sm text-label-caps font-bold hover:bg-vercel-blue/90 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Play size={10} fill="currentColor" />
              <span>{isSubmitting ? 'Analyzing...' : 'Analyze Commit'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Commits;