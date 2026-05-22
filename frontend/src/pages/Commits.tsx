import { useEffect, useState, useRef } from 'react';
import { useRepositoryStore } from '../store/repositoryStore';
import { useReviewStore } from '../store/reviewStore';
import { useAuthStore } from '../store/authStore';
import { 
  Activity, 
  RefreshCcw, 
  ShieldCheck, 
  Play, 
  ClipboardList,
  ShieldAlert, 
  Zap, 
  GitFork, 
  Sparkles, 
  Cpu, 
  CheckSquare, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle
} from 'lucide-react';
import { cn } from '../utils/cn';
import { toast } from 'sonner';
import type { ThinkingStep } from '../api/reviews';

const Commits = () => {
  const { selectedRepositoryId, repositories } = useRepositoryStore();
  const { reviews, fetchReviews, isLoading, runReview } = useReviewStore();
  const selectedRepo = repositories.find(r => r.id === selectedRepositoryId);
  const token = useAuthStore(state => state.token);

  const [commitSha, setCommitSha] = useState('');
  const [baseSha, setBaseSha] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // SSE Real-time streaming states
  const [activeReviewId, setActiveReviewId] = useState<number | null>(null);
  const [thinkingLog, setThinkingLog] = useState<ThinkingStep[]>([]);
  const [streamStatus, setStreamStatus] = useState<string>('idle');
  const [streamSummary, setStreamSummary] = useState<string>('');
  const [streamRiskScore, setStreamRiskScore] = useState<number | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedRepositoryId) {
      fetchReviews(selectedRepositoryId);
    }
  }, [selectedRepositoryId, fetchReviews]);

  // Auto-resume live visualization if there's an active/pending review
  useEffect(() => {
    if (reviews.length > 0 && !activeReviewId) {
      const runningOrPendingReview = reviews.find(r => r.status === 'running' || r.status === 'pending');
      if (runningOrPendingReview) {
        setActiveReviewId(runningOrPendingReview.id);
        setStreamStatus(runningOrPendingReview.status);
        setThinkingLog(runningOrPendingReview.thinking_log || []);
      }
    }
  }, [reviews, activeReviewId]);

  // Handle SSE streaming connection
  useEffect(() => {
    if (!activeReviewId) return;

    setStreamStatus('connecting');
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
    const streamURL = `${baseURL}/reviews/${activeReviewId}/stream${token ? `?token=${token}` : ''}`;
    
    const eventSource = new EventSource(streamURL);
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.error) {
          toast.error(`Stream error: ${data.error}`);
          setStreamStatus('failed');
          eventSource.close();
          return;
        }
        
        setThinkingLog(data.thinking_log || []);
        setStreamStatus(data.status);
        setStreamSummary(data.summary || '');
        setStreamRiskScore(data.risk_score !== undefined ? data.risk_score : null);
        
        if (data.status === 'completed' || data.status === 'failed') {
          eventSource.close();
          // Reload history after a delay so they can appreciate the completion state
          setTimeout(() => {
            setActiveReviewId(null);
            if (selectedRepositoryId) {
              fetchReviews(selectedRepositoryId);
            }
          }, 3500);
        }
      } catch (err) {
        console.error('Failed to parse event data:', err);
      }
    };
    
    eventSource.onerror = (err) => {
      console.error('EventSource connection error:', err);
      setStreamStatus('failed');
      eventSource.close();
    };
    
    return () => {
      eventSource.close();
    };
  }, [activeReviewId, token, fetchReviews, selectedRepositoryId]);

  // Auto-scroll logs to bottom
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thinkingLog]);

  const handleManualReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRepositoryId) return;
    if (!commitSha || !baseSha) {
      toast.error('Please fill in both Commit SHA and Base SHA');
      return;
    }

    setIsSubmitting(true);
    try {
      const reviewObj = await runReview({
        repository_id: selectedRepositoryId,
        commit_sha: commitSha,
        base_sha: baseSha
      });
      toast.success('AI review successfully triggered!');
      setActiveReviewId(reviewObj.id);
      setCommitSha('');
      setBaseSha('');
    } catch (err) {
      toast.error('Failed to trigger manual review');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dynamic progress calculation based on unique agents processed
  const completedAgents = Array.from(new Set(
    thinkingLog
      .filter(item => item.status === 'completed' || item.status === 'complete')
      .map(item => item.agent)
  ));
  const totalSteps = 7; // Fetch Diff + 5 Agents + Summary
  const progressPercent = Math.min(100, Math.round((completedAgents.length / totalSteps) * 100));

  const getAgentIcon = (agent: string, status: string) => {
    const isRunning = status === 'running';
    const iconClass = cn("w-4 h-4 shrink-0", isRunning && "animate-pulse");
    
    switch (agent.toLowerCase()) {
      case 'security':
        return <ShieldAlert className={cn(iconClass, "text-rose")} />;
      case 'performance':
        return <Zap className={cn(iconClass, "text-amber")} />;
      case 'architecture':
        return <GitFork className={cn(iconClass, "text-vercel-blue")} />;
      case 'testing':
        return <CheckSquare className={cn(iconClass, "text-purple")} />;
      case 'clean code':
      case 'cleancode':
        return <Sparkles className={cn(iconClass, "text-emerald")} />;
      case 'summary':
        return <Cpu className={cn(iconClass, "text-teal")} />;
      case 'system':
        return <Cpu className={cn(iconClass, "text-on-surface-variant")} />;
      default:
        return <Cpu className={cn(iconClass, "text-on-surface-variant")} />;
    }
  };

  const getAgentColor = (agent: string) => {
    switch (agent.toLowerCase()) {
      case 'security': return 'border-rose/20 bg-rose/10 text-rose';
      case 'performance': return 'border-amber/20 bg-amber/10 text-amber';
      case 'architecture': return 'border-vercel-blue/20 bg-vercel-blue/10 text-vercel-blue';
      case 'testing': return 'border-purple/20 bg-purple/10 text-purple';
      case 'clean code': return 'border-emerald/20 bg-emerald/10 text-emerald';
      case 'summary': return 'border-teal/20 bg-teal/10 text-teal';
      default: return 'border-border-primary bg-charcoal text-on-surface-variant';
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
            <div className="space-y-6 animate-fadeIn">
              {/* Queue 1: Pending Queue */}
              {reviews.filter(r => r.status === 'pending' || r.status === 'running').length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 border-b border-border-primary pb-2">
                    <span className="w-2 h-2 bg-amber rounded-full animate-ping" />
                    <h4 className="text-xs font-mono uppercase tracking-wider text-amber font-semibold">
                      Pending & Active Queue ({reviews.filter(r => r.status === 'pending' || r.status === 'running').length})
                    </h4>
                  </div>
                  <div className="space-y-3">
                    {reviews
                      .filter(r => r.status === 'pending' || r.status === 'running')
                      .map(review => (
                        <div key={review.id} className="bg-charcoal/60 border border-amber/20 hover:border-amber/40 rounded-sm p-4 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
                          <div className="absolute top-0 left-0 h-full w-1 bg-gradient-to-b from-amber to-amber/30 animate-pulse" />
                          <div className="space-y-1 min-w-0 pl-1">
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-xs font-semibold text-amber bg-obsidian border border-amber/20 px-2 py-0.5 rounded-sm">
                                {review.commit_sha.substring(0, 7)}
                              </span>
                              {review.pr_number && (
                                <span className="text-[10px] text-amber bg-amber/10 border border-amber/20 px-1.5 py-0.5 rounded-full font-semibold">
                                  PR #{review.pr_number}
                                </span>
                              )}
                              <span className="text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full border bg-amber/10 border-amber/20 text-amber animate-pulse">
                                {review.status}
                              </span>
                            </div>
                            <p className="text-body-sm font-sans font-medium text-on-surface line-clamp-2 mt-1 italic text-on-surface-variant">
                              {review.status === 'running' ? "Running active AI assessments and generating real-time logs..." : "Queued. Waiting for available agent worker processes..."}
                            </p>
                            <div className="text-[10px] text-on-surface-variant font-mono">
                              Triggered: {new Date(review.created_at).toLocaleString()}
                            </div>
                          </div>

                          <div className="flex items-center gap-4 shrink-0 border-l border-border-primary pl-4">
                            <div className="text-center">
                              <Loader2 size={16} className="text-amber animate-spin mx-auto" />
                              <span className="text-[9px] font-mono block mt-1.5 text-on-surface-variant uppercase tracking-wider">Processing</span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Queue 2: Completed Queue */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-border-primary pb-2">
                  <span className="w-2 h-2 bg-emerald rounded-full" />
                  <h4 className="text-xs font-mono uppercase tracking-wider text-emerald font-semibold">
                    Completed Queue ({reviews.filter(r => r.status === 'completed' || r.status === 'failed').length})
                  </h4>
                </div>
                {reviews.filter(r => r.status === 'completed' || r.status === 'failed').length === 0 ? (
                  <p className="text-xs text-on-surface-variant italic">No reviews completed yet.</p>
                ) : (
                  <div className="space-y-3">
                    {reviews
                      .filter(r => r.status === 'completed' || r.status === 'failed')
                      .map(review => (
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
                                review.status === 'failed' && "bg-rose/10 border-rose/20 text-rose"
                              )}>
                                {review.status}
                              </span>
                            </div>
                            <p className="text-body-sm font-sans font-medium text-on-surface line-clamp-2 mt-1">
                              {review.summary || (review.status === 'failed' ? "AI review session aborted due to analysis failure." : "AI analysis successfully complete.")}
                            </p>
                            <div className="text-[10px] text-on-surface-variant font-mono">
                              Reviewed: {new Date(review.created_at).toLocaleString()}
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
                                review.comments && review.comments.length > 0 ? "text-amber" : "text-emerald"
                              )} />
                              <span className="text-[9px] font-mono block mt-1">{(review.comments || []).length} Findings</span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Manual Review Trigger OR Live Thinking Panel */}
        <div className="shrink-0">
          {activeReviewId ? (
            <div className="bg-obsidian border border-linear-purple/35 rounded-sm p-5 space-y-4 shadow-2xl relative overflow-hidden backdrop-blur-xl">
              {/* Decorative subtle glows */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-linear-purple/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-vercel-blue/5 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center justify-between border-b border-border-primary pb-3">
                <div className="space-y-0.5">
                  <h3 className="text-headline flex items-center gap-2">
                    {streamStatus === 'completed' ? (
                      <CheckCircle2 size={16} className="text-emerald animate-bounce" />
                    ) : streamStatus === 'failed' ? (
                      <AlertTriangle size={16} className="text-rose" />
                    ) : (
                      <Loader2 size={16} className="text-linear-purple animate-spin" />
                    )}
                    <span>AI Review Pipeline</span>
                  </h3>
                  <p className="text-[10px] text-on-surface-variant font-mono tracking-tight">
                    REVIEW ID: #{activeReviewId}
                  </p>
                </div>
                <span className={cn(
                  "text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full border",
                  streamStatus === 'completed' && "bg-emerald/10 border-emerald/20 text-emerald",
                  streamStatus === 'failed' && "bg-rose/10 border-rose/20 text-rose",
                  streamStatus !== 'completed' && streamStatus !== 'failed' && "bg-linear-purple/10 border-linear-purple/20 text-linear-purple animate-pulse"
                )}>
                  {streamStatus}
                </span>
              </div>

              {/* Dynamic Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-mono uppercase text-on-surface-variant">
                  <span>Pipeline Progress</span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="h-1.5 bg-charcoal rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-vercel-blue via-linear-purple to-pink-500 transition-all duration-500 rounded-full" 
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Real-time Agent Thinking Logs Feed */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant">
                  Live Agent Reasonings
                </h4>
                <div className="h-[280px] overflow-y-auto bg-charcoal/30 border border-border-primary/60 rounded-sm p-3 font-mono text-[11px] leading-relaxed space-y-3 custom-scrollbar">
                  {thinkingLog.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-on-surface-variant space-y-2">
                      <Loader2 className="animate-spin text-vercel-blue" size={20} />
                      <p>Waking up AI agents...</p>
                    </div>
                  ) : (
                    thinkingLog.map((step, idx) => (
                      <div key={idx} className="space-y-1 animate-fadeIn">
                        <div className="flex items-center gap-2">
                          {getAgentIcon(step.agent, step.status)}
                          <span className={cn(
                            "px-1.5 py-0.5 rounded-sm border text-[9px] font-semibold uppercase tracking-wider",
                            getAgentColor(step.agent)
                          )}>
                            {step.agent}
                          </span>
                          <span className="text-[9px] text-on-surface-variant ml-auto">
                            {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                        <div className="pl-6 text-on-surface relative">
                          {step.status === 'running' && (
                            <span className="absolute -left-1 top-1.5 w-1 h-1 bg-primary rounded-full animate-ping" />
                          )}
                          <p className={cn(
                            step.status === 'running' ? "text-on-surface/95 italic font-sans" : "text-on-surface/80 font-sans"
                          )}>
                            {step.message}
                          </p>
                          {step.findings_count !== undefined && step.findings_count !== null && (
                            <span className="inline-block mt-1 text-[10px] bg-charcoal px-2 py-0.5 border border-border-primary rounded-sm text-amber font-mono font-bold">
                              ⚠️ {step.findings_count} findings detected
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={logEndRef} />
                </div>
              </div>

              {/* Celebrate Final Summary State */}
              {streamStatus === 'completed' && (
                <div className="bg-emerald/5 border border-emerald/20 rounded-sm p-3.5 space-y-2.5 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-emerald">Analysis Complete!</h4>
                      <p className="text-[10px] text-on-surface-variant">Review summary successfully generated.</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-mono uppercase tracking-wider text-on-surface-variant block">Risk Score</span>
                      <span className={cn(
                        "text-lg font-bold font-mono",
                        streamRiskScore !== null && streamRiskScore > 7 ? "text-rose" : streamRiskScore !== null && streamRiskScore > 4 ? "text-amber" : "text-emerald"
                      )}>
                        {streamRiskScore !== null ? `${streamRiskScore.toFixed(1)}/10` : '-'}
                      </span>
                    </div>
                  </div>
                  {streamSummary && (
                    <p className="text-[10.5px] font-sans text-on-surface/90 line-clamp-3 italic leading-relaxed border-l-2 border-emerald pl-2 py-0.5">
                      "{streamSummary}"
                    </p>
                  )}
                  <div className="flex items-center gap-1 text-[9px] font-mono text-on-surface-variant pt-1">
                    <span>Reloading timeline</span>
                    <span className="animate-pulse">...</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
};

export default Commits;