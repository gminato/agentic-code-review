import { useState, useEffect } from 'react';
import { 
  GitPullRequest, 
  ShieldCheck, 
  Zap, 
  ArrowUpRight,
  ArrowDownRight,
  Activity
} from 'lucide-react';
import { cn } from '../utils/cn';
import { dashboardApi, type DashboardStats } from '../api/dashboard';
import { useReviewStore } from '../store/reviewStore';
import { useNavigate } from 'react-router-dom';

const MetricCard = ({ title, value, change, trend, icon: Icon, accentColor }: any) => (
  <div className="bg-charcoal border border-border-primary rounded-sm p-4 space-y-3 relative overflow-hidden group">
    <div className="flex items-center justify-between">
      <div className={cn("p-1.5 rounded-sm border border-border-primary bg-obsidian", accentColor)}>
        <Icon size={16} />
      </div>
      {change && (
        <div className={cn(
          "flex items-center text-[10px] font-mono font-semibold",
          trend === 'up' ? "text-emerald" : "text-rose"
        )}>
          {trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          <span>{change}</span>
        </div>
      )}
    </div>
    <div>
      <p className="text-label-caps text-on-surface-variant">{title}</p>
      <h3 className="text-headline mt-1">{value}</h3>
    </div>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const { reviews, fetchReviews } = useReviewStore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await dashboardApi.getStats();
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch dashboard stats', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
    fetchReviews();
  }, [fetchReviews]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-vercel-blue border-t-transparent rounded-full animate-spin"></div>
          <p className="text-code-sm text-on-surface-variant uppercase tracking-widest">Loading telemetry data...</p>
        </div>
      </div>
    );
  }

  if (stats?.message) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-charcoal border border-border-primary rounded-sm p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-obsidian border border-border-primary rounded-full flex items-center justify-center mx-auto text-vercel-blue">
            <Activity size={32} />
          </div>
          <div className="space-y-2">
            <h2 className="text-headline">Welcome to Agentic Review</h2>
            <p className="text-body-sm text-on-surface-variant">
              {stats.message}
            </p>
          </div>
          <div className="pt-4">
            <p className="text-[10px] text-on-surface-variant font-mono uppercase tracking-tight">
              Get started by importing your first repository from the top right menu.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display">Infrastructure Overview</h1>
          <p className="text-body-sm text-on-surface-variant mt-1 font-mono tracking-tight uppercase">
            Platform status: <span className="text-emerald font-bold">Nominal</span> • {stats?.active_repositories !== undefined && stats?.active_repositories !== null ? stats.active_repositories : "-"} active agents
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 bg-vercel-blue text-white rounded-sm text-label-caps font-bold hover:bg-vercel-blue/90 transition-colors">
            Run Manual Sync
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
        <MetricCard 
          title="Total Reviews" 
          value={stats?.total_reviews !== undefined && stats?.total_reviews !== null ? stats.total_reviews.toLocaleString() : "-"} 
          change={stats?.reviews_today ? "+" + stats.reviews_today : undefined}
          trend="up" 
          icon={Activity} 
          accentColor="text-vercel-blue" 
        />
        <MetricCard 
          title="Open PRs" 
          value={stats?.open_pull_requests_count !== undefined && stats?.open_pull_requests_count !== null ? stats.open_pull_requests_count : "-"} 
          icon={GitPullRequest} 
          accentColor="text-linear-purple" 
        />
        <MetricCard 
          title="Total Findings" 
          value={stats?.total_findings !== undefined && stats?.total_findings !== null ? stats.total_findings.toLocaleString() : "-"} 
          icon={Zap} 
          accentColor="text-amber" 
        />
        <MetricCard 
          title="Avg Risk Score" 
          value={stats?.risk_score_average !== undefined && stats?.risk_score_average !== null ? stats.risk_score_average.toFixed(1) : "-"} 
          trend={stats?.risk_score_average && stats.risk_score_average > 5 ? 'up' : 'down'}
          icon={ShieldCheck} 
          accentColor="text-emerald" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {/* Interactive SVG Timeline Graph */}
        <div className="lg:col-span-2 bg-charcoal border border-border-primary rounded-sm overflow-hidden flex flex-col">
          <div className="p-3 border-b border-border-primary bg-floating/30 flex items-center justify-between">
            <h3 className="text-label-caps text-on-surface">Review Velocity Timeline</h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-vercel-blue"></div>
                <span className="text-[9px] font-mono text-on-surface-variant uppercase">Autonomous</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-on-surface-variant"></div>
                <span className="text-[9px] font-mono text-on-surface-variant uppercase">Manual</span>
              </div>
            </div>
          </div>
          
          <div className="flex-1 min-h-[300px] flex flex-col justify-between p-6 bg-obsidian/30 relative">
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
            
            <div className="flex-1 w-full h-[220px]">
              <svg viewBox="0 0 500 220" className="w-full h-full">
                <defs>
                  <linearGradient id="gradientAuto" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0070f3" stopOpacity="0.25"/>
                    <stop offset="100%" stopColor="#0070f3" stopOpacity="0"/>
                  </linearGradient>
                  <linearGradient id="gradientManual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#888888" stopOpacity="0.15"/>
                    <stop offset="100%" stopColor="#888888" stopOpacity="0"/>
                  </linearGradient>
                </defs>

                {/* Grid lines */}
                <line x1="50" y1="50" x2="470" y2="50" stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />
                <line x1="50" y1="100" x2="470" y2="100" stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />
                <line x1="50" y1="150" x2="470" y2="150" stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />
                <line x1="50" y1="200" x2="470" y2="200" stroke="rgba(255,255,255,0.1)" />

                {/* Area Gradients */}
                <path d="M 50,200 L 50,150 L 120,90 L 190,120 L 260,50 L 330,70 L 400,160 L 470,130 L 470,200 Z" fill="url(#gradientAuto)" />
                <path d="M 50,200 L 50,180 L 120,160 L 190,185 L 260,150 L 330,170 L 400,190 L 470,180 L 470,200 Z" fill="url(#gradientManual)" />

                {/* Smooth lines */}
                <polyline fill="none" stroke="#0070f3" strokeWidth="2.5" points="50,150 120,90 190,120 260,50 330,70 400,160 470,130" strokeLinecap="round" strokeLinejoin="round" />
                <polyline fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" points="50,180 120,160 190,185 260,150 330,170 400,190 470,180" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3,3" />

                {/* Autonomous Node Dots */}
                {[[50,150], [120,90], [190,120], [260,50], [330,70], [400,160], [470,130]].map(([x, y], idx) => (
                  <g key={`auto-${idx}`} className="group cursor-pointer">
                    <circle cx={x} cy={y} r="4" fill="#0070f3" stroke="#0a0a0a" strokeWidth="1.5" />
                    <circle cx={x} cy={y} r="7" fill="#0070f3" fillOpacity="0.15" className="animate-pulse" />
                  </g>
                ))}

                {/* Manual Node Dots */}
                {[[50,180], [120,160], [190,185], [260,150], [330,170], [400,190], [470,180]].map(([x, y], idx) => (
                  <circle key={`man-${idx}`} cx={x} cy={y} r="3" fill="#888888" stroke="#0a0a0a" strokeWidth="1" />
                ))}

                {/* X axis labels */}
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
                  <text key={idx} x={50 + idx * 70} y="215" fill="rgba(255,255,255,0.4)" fontSize="9" fontFamily="monospace" textAnchor="middle">
                    {day}
                  </text>
                ))}
              </svg>
            </div>
          </div>
        </div>

        {/* Live System Logs from the database */}
        <div className="bg-charcoal border border-border-primary rounded-sm flex flex-col overflow-hidden">
          <div className="p-3 border-b border-border-primary bg-floating/30">
            <h3 className="text-label-caps text-on-surface">System Logs</h3>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[400px] divide-y divide-border-primary">
            {reviews.length === 0 ? (
               <div className="p-8 text-center text-code-sm text-on-surface-variant italic">
                 No activity logs yet. Ready for your first AI review!
               </div>
            ) : (
              reviews.slice(0, 5).map((review) => (
                <div 
                  key={review.id} 
                  onClick={() => navigate('/reviews')}
                  className="p-3 hover:bg-floating/30 transition-colors group cursor-pointer border-l-2 border-transparent hover:border-vercel-blue"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <ShieldCheck size={14} className={cn(
                        review.risk_score && review.risk_score > 7 ? "text-rose" : review.risk_score && review.risk_score > 4 ? "text-amber" : "text-emerald"
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm font-medium text-on-surface truncate group-hover:text-vercel-blue transition-colors">
                        {review.summary || "AI Code Review initiated and completed."}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-code-sm text-on-surface-variant truncate pr-2 border-r border-border-primary font-mono">
                          SHA: {review.commit_sha.substring(0, 7)}
                        </span>
                        {review.risk_score !== undefined && review.risk_score !== null && (
                          <span className={cn(
                            "text-[8px] font-mono font-bold uppercase",
                            review.risk_score > 7 ? "text-rose" : review.risk_score > 4 ? "text-amber" : "text-emerald"
                          )}>
                            Risk: {review.risk_score.toFixed(1)}/10
                          </span>
                        )}
                        <span className="text-[8px] font-mono text-on-surface-variant ml-auto">
                          {new Date(review.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <button 
            onClick={() => navigate('/reviews')}
            className="p-2 border-t border-border-primary text-label-caps text-primary hover:bg-floating transition-colors text-[9px] tracking-[0.1em] cursor-pointer"
          >
            View all logs
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
