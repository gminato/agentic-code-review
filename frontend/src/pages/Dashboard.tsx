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
  }, []);

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
          <div className="flex-1 min-h-[300px] flex flex-col items-center justify-center bg-obsidian/30 relative p-8">
             <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
             <Activity size={48} className="text-border-primary mb-4" />
             <p className="text-code-sm text-on-surface-variant uppercase tracking-widest text-center">
               Timeline visualization will appear here once more reviews are processed.
             </p>
          </div>
        </div>

        <div className="bg-charcoal border border-border-primary rounded-sm flex flex-col overflow-hidden">
          <div className="p-3 border-b border-border-primary bg-floating/30">
            <h3 className="text-label-caps text-on-surface">System Logs</h3>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[400px] divide-y divide-border-primary">
            {(!stats || stats.total_reviews === 0) ? (
               <div className="p-8 text-center text-code-sm text-on-surface-variant italic">
                 No activity logs yet.
               </div>
            ) : (
              [1, 2, 3].map((i) => (
                <div key={i} className="p-3 hover:bg-floating/30 transition-colors group cursor-pointer border-l-2 border-transparent hover:border-vercel-blue">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <ShieldCheck size={14} className="text-vercel-blue" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm font-medium text-on-surface truncate">Security scan completed</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-code-sm text-on-surface-variant truncate pr-2 border-r border-border-primary">Scan ID: {i}</span>
                        <span className="text-label-caps text-on-surface-variant text-[8px]">Status: Success</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <button className="p-2 border-t border-border-primary text-label-caps text-primary hover:bg-floating transition-colors text-[9px] tracking-[0.1em]">
            View all logs
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
