import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useRepositoryStore } from '../store/repositoryStore';
import { repositoriesApi } from '../api/repositories';
import { 
  GitPullRequest, 
  RefreshCcw, 
  Eye, 
  FileCode, 
  Plus, 
  Minus, 
  FolderOpen,
  ArrowLeft
} from 'lucide-react';
import { cn } from '../utils/cn';
import { toast } from 'sonner';

interface PRFile {
  sha: string;
  filename: string;
  status: 'modified' | 'added' | 'removed' | 'renamed' | string;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
}

export const Diffs = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedRepositoryId, pullRequests, isPullRequestsLoading, fetchPullRequests, repositories } = useRepositoryStore();

  const [selectedPrNumber, setSelectedPrNumber] = useState<number | null>(null);
  const [files, setFiles] = useState<PRFile[]>([]);
  const [isFilesLoading, setIsFilesLoading] = useState(false);
  const [selectedFilename, setSelectedFilename] = useState<string>('');

  const selectedRepo = repositories.find(r => r.id === selectedRepositoryId);

  // Sync state from location or trigger initial fetches
  useEffect(() => {
    if (selectedRepositoryId) {
      fetchPullRequests(selectedRepositoryId);
    }
  }, [selectedRepositoryId, fetchPullRequests]);

  useEffect(() => {
    // If navigated from PR list with a specific PR number
    const state = location.state as { prNumber?: number } | null;
    if (state?.prNumber) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedPrNumber(state.prNumber);
    } else if (pullRequests.length > 0 && selectedPrNumber === null) {
      // Default to first open PR
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedPrNumber(pullRequests[0].number);
    }
  }, [pullRequests, location.state, selectedPrNumber]);

  // Fetch files when repo or PR changes
  useEffect(() => {
    const fetchPRFiles = async () => {
      if (!selectedRepositoryId || !selectedPrNumber) return;
      setIsFilesLoading(true);
      try {
        const response = await repositoriesApi.getPullRequestFiles(selectedRepositoryId, selectedPrNumber);
        setFiles(response.data || []);
        if (response.data && response.data.length > 0) {
          setSelectedFilename(response.data[0].filename);
        } else {
          setSelectedFilename('');
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load pull request files');
        setFiles([]);
        setSelectedFilename('');
      } finally {
        setIsFilesLoading(false);
      }
    };
    fetchPRFiles();
  }, [selectedRepositoryId, selectedPrNumber]);

  const selectedFile = files.find(f => f.filename === selectedFilename);

  const parsePatch = (patch?: string) => {
    if (!patch) return [];
    const lines = patch.split('\n');
    return lines.map((line, idx) => {
      let type = 'normal';
      if (line.startsWith('+')) type = 'add';
      else if (line.startsWith('-')) type = 'del';
      else if (line.startsWith('@@')) type = 'meta';
      return { content: line, type, key: idx };
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'added': return 'text-emerald bg-emerald/10 border-emerald/20';
      case 'removed': return 'text-rose bg-rose/10 border-rose/20';
      case 'renamed': return 'text-amber bg-amber/10 border-amber/20';
      default: return 'text-primary bg-primary/10 border-primary/20';
    }
  };

  if (!selectedRepositoryId) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center">
        <Eye size={48} className="text-border-primary mb-4" />
        <h3 className="text-headline">No repository selected</h3>
        <p className="text-body-sm text-on-surface-variant mt-1">Please select a repository from the top-right menu to view diffs.</p>
      </div>
    );
  }

  const selectedPr = pullRequests.find(pr => pr.number === selectedPrNumber);

  return (
    <div className="space-y-6">
      {/* Top Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigate('/pull-requests')}
              className="p-1 hover:bg-charcoal border border-border-primary hover:border-vercel-blue text-on-surface-variant hover:text-on-surface rounded-sm transition-colors cursor-pointer"
              title="Back to Pull Requests"
            >
              <ArrowLeft size={14} />
            </button>
            <h1 className="text-display">PR Diff Checker</h1>
          </div>
          <p className="text-body-sm text-on-surface-variant mt-1 font-mono tracking-tight uppercase">
            Repository: <span className="text-primary font-bold">{selectedRepo?.full_name}</span>
          </p>
        </div>

        <div className="flex items-center gap-3 self-start">
          <label className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant whitespace-nowrap">PR Number:</label>
          <select 
            value={selectedPrNumber || ''} 
            onChange={(e) => setSelectedPrNumber(Number(e.target.value))}
            className="bg-charcoal border border-border-primary focus:border-vercel-blue focus:outline-none rounded-sm px-3 py-1.5 font-sans text-xs text-on-surface transition-colors cursor-pointer min-w-[200px]"
            disabled={isPullRequestsLoading || pullRequests.length === 0}
          >
            {pullRequests.length === 0 && <option value="">No open PRs</option>}
            {pullRequests.map(pr => (
              <option key={pr.id} value={pr.number}>
                #{pr.number} - {pr.title.length > 35 ? `${pr.title.substring(0, 35)}...` : pr.title}
              </option>
            ))}
          </select>

          <button 
            onClick={() => selectedRepositoryId && fetchPullRequests(selectedRepositoryId)}
            disabled={isPullRequestsLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-charcoal border border-border-primary hover:border-vercel-blue text-on-surface-variant hover:text-on-surface rounded-sm text-label-caps transition-all disabled:opacity-50"
            title="Refresh Pull Requests List"
          >
            <RefreshCcw size={12} className={cn(isPullRequestsLoading && "animate-spin")} />
          </button>
        </div>
      </div>

      {pullRequests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-charcoal/30 border border-dashed border-border-primary rounded-sm text-center">
          <GitPullRequest size={48} className="text-border-primary mb-4" />
          <h3 className="text-headline">No open Pull Requests</h3>
          <p className="text-body-sm text-on-surface-variant mt-1">Select a repo with active pull requests to inspect code diffs.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-gutter items-start">
          
          {/* Left Panel: Files List */}
          <div className="lg:col-span-1 bg-charcoal border border-border-primary rounded-sm p-4 space-y-4 h-[70vh] flex flex-col">
            <div>
              <h3 className="text-label-caps text-on-surface-variant tracking-wider">Modified Files</h3>
              {selectedPr && (
                <div className="mt-1 text-[10px] font-mono text-linear-purple truncate max-w-full">
                  PR #{selectedPr.number}: {selectedPr.head?.ref}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
              {isFilesLoading ? (
                <div className="space-y-2.5">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-9 bg-obsidian border border-border-primary/50 rounded-sm animate-pulse" />
                  ))}
                </div>
              ) : files.length === 0 ? (
                <div className="text-center py-10 text-on-surface-variant/75 italic text-body-sm">
                  No files returned for this PR.
                </div>
              ) : (
                files.map(file => {
                  const isSelected = file.filename === selectedFilename;
                  return (
                    <div
                      key={file.filename}
                      onClick={() => setSelectedFilename(file.filename)}
                      className={cn(
                        "group border rounded-sm p-2 transition-all cursor-pointer flex flex-col gap-1 select-none",
                        isSelected 
                          ? "bg-linear-purple/10 border-linear-purple ring-1 ring-linear-purple/35" 
                          : "bg-obsidian/30 border-border-primary hover:border-border-primary/80 hover:bg-charcoal/80"
                      )}
                    >
                      <div className="flex items-center gap-2 justify-between">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <FileCode size={13} className={isSelected ? "text-linear-purple" : "text-on-surface-variant"} />
                          <span className="text-[10.5px] font-mono font-medium text-on-surface truncate" title={file.filename}>
                            {file.filename.split('/').pop()}
                          </span>
                        </div>
                        <span className={cn(
                          "text-[8px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-sm border shrink-0 select-none",
                          getStatusColor(file.status)
                        )}>
                          {file.status}
                        </span>
                      </div>
                      
                      {/* Path & Badge row */}
                      <div className="flex items-center justify-between text-[9px] text-on-surface-variant font-mono min-w-0">
                        <span className="truncate max-w-[70%] text-[8px]" title={file.filename}>
                          {file.filename.substring(0, file.filename.lastIndexOf('/')) || './'}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0 select-none">
                          <span className="text-emerald flex items-center">+{file.additions}</span>
                          <span className="text-rose flex items-center">-{file.deletions}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Panel: Code Diff Viewer */}
          <div className="lg:col-span-3 bg-obsidian border border-border-primary rounded-sm overflow-hidden flex flex-col h-[70vh]">
            
            {/* Diff Header */}
            <div className="bg-charcoal px-4 py-3 border-b border-border-primary flex items-center justify-between select-none">
              <div className="flex items-center gap-2.5 min-w-0">
                <FolderOpen size={16} className="text-primary" />
                <span className="text-xs font-mono font-bold text-on-surface truncate" title={selectedFilename}>
                  {selectedFilename || 'Select a file to view code changes'}
                </span>
              </div>

              {selectedFile && (
                <div className="flex items-center gap-3 shrink-0 text-[10px] font-mono select-none">
                  <div className="flex items-center gap-1 text-emerald bg-emerald/5 px-2 py-0.5 border border-emerald/20 rounded-sm">
                    <Plus size={10} />
                    <span>{selectedFile.additions} additions</span>
                  </div>
                  <div className="flex items-center gap-1 text-rose bg-rose/5 px-2 py-0.5 border border-rose/20 rounded-sm">
                    <Minus size={10} />
                    <span>{selectedFile.deletions} deletions</span>
                  </div>
                </div>
              )}
            </div>

            {/* Diff Body */}
            <div className="flex-1 overflow-auto custom-scrollbar p-0 bg-obsidian-dark select-text">
              {isFilesLoading ? (
                <div className="h-full flex flex-col items-center justify-center text-on-surface-variant">
                  <RefreshCcw className="animate-spin text-vercel-blue mb-2" size={20} />
                  <p className="text-xs">Loading diff details...</p>
                </div>
              ) : !selectedFilename ? (
                <div className="h-full flex flex-col items-center justify-center text-on-surface-variant/80 text-center py-10 select-none">
                  <Eye size={36} className="text-border-primary mb-3" />
                  <h4 className="text-body-md font-semibold">Code Changes Panel</h4>
                  <p className="text-[10px] max-w-xs mt-1">Select a file from the sidebar to inspect its line-by-line code alterations.</p>
                </div>
              ) : !selectedFile?.patch ? (
                <div className="h-full flex flex-col items-center justify-center text-on-surface-variant/85 text-center p-6 select-none">
                  <FileCode size={36} className="text-border-primary mb-3" />
                  <h4 className="text-body-md font-semibold">No Changes Displayed</h4>
                  <p className="text-[10px] max-w-xs mt-1">
                    {selectedFile?.status === 'renamed' 
                      ? 'This file was only renamed without code modifications.' 
                      : 'This file is either empty, binary, or its changes are too large to fetch.'}
                  </p>
                </div>
              ) : (
                <div className="font-mono text-[11px] leading-relaxed w-full min-w-[700px] py-2">
                  {parsePatch(selectedFile.patch).map((line) => (
                    <div 
                      key={line.key}
                      className={cn(
                        "flex items-start w-full border-l-2 select-text",
                        line.type === 'add' && "bg-emerald/5 text-emerald/90 border-emerald hover:bg-emerald/10/80 transition-colors",
                        line.type === 'del' && "bg-rose/5 text-rose/90 border-rose hover:bg-rose/10/80 transition-colors",
                        line.type === 'meta' && "bg-linear-purple/5 text-linear-purple border-linear-purple/40 py-1.5 font-bold my-1 border-y border-border-primary/20 select-none",
                        line.type === 'normal' && "bg-transparent text-on-surface-variant/85 border-transparent hover:bg-charcoal/10"
                      )}
                    >
                      {/* Line Indicators */}
                      <span className="w-12 shrink-0 select-none border-r border-border-primary/30 text-right pr-3 opacity-30 text-[9px]">
                        {line.type === 'meta' ? '@@' : line.key + 1}
                      </span>
                      {/* Code Content */}
                      <span className="pl-4 pr-3 whitespace-pre truncate font-mono select-text py-0.5">
                        {line.content}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Diffs;
