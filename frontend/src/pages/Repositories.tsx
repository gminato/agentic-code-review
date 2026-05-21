import { useEffect } from 'react';
import { GitFork, RefreshCcw, ExternalLink } from 'lucide-react';
import { useRepositoryStore } from '../store/repositoryStore';
import { cn } from '../utils/cn';

const Repositories = () => {
  const { repositories, isLoading, error, fetchRepositories } = useRepositoryStore();

  useEffect(() => {
    fetchRepositories();
  }, [fetchRepositories]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display">Repositories</h1>
          <p className="text-body-sm text-on-surface-variant mt-1">Manage and sync your connected repositories.</p>
        </div>
        <button 
          onClick={() => fetchRepositories()}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-1.5 bg-charcoal border border-border-primary hover:border-vercel-blue text-on-surface-variant hover:text-on-surface rounded-sm text-label-caps transition-all disabled:opacity-50"
        >
          <RefreshCcw size={12} className={cn(isLoading && "animate-spin")} />
          <span>Sync All</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose/10 border border-rose/20 rounded-sm text-rose text-sm font-mono">
          Error: {error}
        </div>
      )}

      {isLoading && repositories.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-charcoal/50 border border-border-primary rounded-sm animate-pulse" />
          ))}
        </div>
      ) : repositories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-charcoal/30 border border-dashed border-border-primary rounded-sm">
          <GitFork size={48} className="text-border-primary mb-4" />
          <h3 className="text-headline">No repositories connected</h3>
          <p className="text-body-sm text-on-surface-variant mt-1">Connect your GitHub organizations to get started.</p>
          <button className="mt-6 px-4 py-2 bg-vercel-blue text-white rounded-sm text-label-caps font-bold">
            Connect Repositories
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
          {repositories.map(repo => (
            <div key={repo.id} className="bg-charcoal border border-border-primary rounded-sm p-4 hover:border-vercel-blue transition-colors group cursor-pointer relative overflow-hidden">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-sm bg-obsidian flex items-center justify-center border border-border-primary">
                    <GitFork size={18} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="text-body-md font-bold text-on-surface group-hover:text-primary transition-colors">
                      {repo.full_name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-code-sm text-on-surface-variant">{repo.default_branch}</span>
                      <span className="w-1 h-1 rounded-full bg-border-primary"></span>
                      <span className="text-[10px] text-on-surface-variant font-mono uppercase tracking-wider">
                        ID: {repo.github_repo_id}
                      </span>
                    </div>
                  </div>
                </div>
                <div className={cn(
                  "flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[9px] font-mono uppercase tracking-widest",
                  repo.is_active 
                    ? "bg-emerald/10 border-emerald/20 text-emerald" 
                    : "bg-on-surface-variant/10 border-on-surface-variant/20 text-on-surface-variant"
                )}>
                  {repo.is_active ? 'Active' : 'Inactive'}
                </div>
              </div>
              <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ExternalLink size={14} className="text-on-surface-variant" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Repositories;
