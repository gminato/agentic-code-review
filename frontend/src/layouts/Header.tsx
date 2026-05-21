import { useState, useEffect, useRef } from 'react';
import { Search, Bell, Command, ChevronDown, GitBranch, Plus, ExternalLink, Loader2, GitCommit, Folder } from 'lucide-react';
import { useRepositoryStore } from '../store/repositoryStore';
import { cn } from '../utils/cn';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';

export const Header = () => {
  const { 
    repositories, 
    selectedRepositoryId, 
    setSelectedRepositoryId, 
    fetchRepositories,
    fetchAvailableRepositories,
    availableRepositories,
    importRepository,
    isAvailableLoading
  } = useRepositoryStore();
  
  const [isRepoOpen, setIsRepoOpen] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Search State and Refs
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ repositories: any[]; reviews: any[] }>({ repositories: [], reviews: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRepositories();
  }, [fetchRepositories]);

  // Handle outside clicks for both repo dropdown and search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsRepoOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut listener for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Debounced Search API callback
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ repositories: [], reviews: [] });
      setIsSearchOpen(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      setIsSearchOpen(true);
      try {
        const response = await apiClient.get('/search/', {
          params: { q: searchQuery }
        });
        setSearchResults(response.data);
      } catch (err) {
        console.error('Error searching:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const selectedRepo = repositories.find(r => r.id === selectedRepositoryId);

  const handleImportClick = () => {
    setIsRepoOpen(false);
    setShowImportModal(true);
    fetchAvailableRepositories();
  };

  return (
    <header className="h-14 border-b border-border-primary bg-charcoal flex items-center justify-between px-6 shrink-0 z-10">
      <div className="flex items-center flex-1 max-w-xl relative" ref={searchContainerRef}>
        <div className="relative w-full group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-vercel-blue transition-colors" size={14} />
          <input 
            type="text" 
            ref={searchInputRef}
            placeholder="Search repositories, commits..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => { if (searchQuery.trim()) setIsSearchOpen(true); }}
            className="w-full bg-obsidian border border-border-primary rounded-sm py-1.5 pl-9 pr-12 text-code-sm focus:outline-none focus:border-vercel-blue transition-all text-on-surface"
          />
          {searchQuery && (
            <button 
              onClick={() => { setSearchQuery(''); setIsSearchOpen(false); }}
              className="absolute right-10 top-1/2 -translate-y-1/2 text-[10px] text-on-surface-variant hover:text-on-surface cursor-pointer font-sans"
            >
              Clear
            </button>
          )}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 rounded border border-border-primary bg-charcoal text-[9px] text-on-surface-variant font-mono pointer-events-none">
            <Command size={9} />
            <span>K</span>
          </div>
        </div>

        {/* Search Results Dropdown */}
        {isSearchOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 w-full bg-charcoal border border-border-primary rounded-sm shadow-xl z-50 overflow-hidden">
            {isSearching ? (
              <div className="p-4 flex items-center justify-center gap-2 text-code-sm text-on-surface-variant">
                <Loader2 className="animate-spin text-vercel-blue" size={14} />
                <span>Searching codebase...</span>
              </div>
            ) : searchResults.repositories.length === 0 && searchResults.reviews.length === 0 ? (
              <div className="p-4 text-center text-body-sm text-on-surface-variant italic">
                No matching repositories or commit reviews found for &quot;{searchQuery}&quot;
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {/* Repositories Section */}
                {searchResults.repositories.length > 0 && (
                  <div>
                    <div className="p-2 border-b border-border-primary bg-obsidian/50 text-label-caps text-[9px] text-on-surface-variant font-mono">
                      Matching Repositories
                    </div>
                    {searchResults.repositories.map((repo: any) => (
                      <button
                        key={repo.id}
                        onClick={() => {
                          setSelectedRepositoryId(repo.id);
                          setIsSearchOpen(false);
                          setSearchQuery('');
                          navigate('/dashboard');
                        }}
                        className="w-full flex items-start gap-2.5 px-3 py-2 text-left hover:bg-floating transition-colors border-b border-border-primary/30 last:border-b-0 group"
                      >
                        <Folder size={14} className="text-vercel-blue mt-0.5 group-hover:scale-105 transition-transform" />
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-code-sm block text-on-surface truncate group-hover:text-vercel-blue transition-colors">
                            {repo.full_name}
                          </span>
                          {repo.description && (
                            <span className="text-[10px] text-on-surface-variant block truncate">
                              {repo.description}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Reviews Section */}
                {searchResults.reviews.length > 0 && (
                  <div>
                    <div className="p-2 border-b border-border-primary bg-obsidian/50 text-label-caps text-[9px] text-on-surface-variant font-mono border-t border-border-primary/50">
                      Commit AI Reviews
                    </div>
                    {searchResults.reviews.map((review: any) => (
                      <button
                        key={review.id}
                        onClick={() => {
                          setSelectedRepositoryId(review.repository_id);
                          setIsSearchOpen(false);
                          setSearchQuery('');
                          navigate('/commits');
                        }}
                        className="w-full flex items-start gap-2.5 px-3 py-2 text-left hover:bg-floating transition-colors border-b border-border-primary/30 last:border-b-0 group"
                      >
                        <GitCommit size={14} className="text-linear-purple mt-0.5 group-hover:scale-105 transition-transform" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-[9px] font-semibold text-primary bg-obsidian border border-border-primary px-1.5 py-0.5 rounded-sm">
                              {review.commit_sha.substring(0, 7)}
                            </span>
                            {review.pr_number && (
                              <span className="text-[9px] text-linear-purple font-semibold">PR #{review.pr_number}</span>
                            )}
                            {review.risk_score !== undefined && review.risk_score !== null && (
                              <span className={cn(
                                "text-[9px] font-mono ml-auto font-bold",
                                review.risk_score > 7 ? "text-rose" : review.risk_score > 4 ? "text-amber" : "text-emerald"
                              )}>
                                Risk: {review.risk_score.toFixed(1)}/10
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-on-surface-variant mt-1 block truncate group-hover:text-on-surface transition-colors">
                            {review.summary || "Pending security analysis and risk assessment..."}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Repository Selector */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsRepoOpen(!isRepoOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded border border-border-primary bg-obsidian hover:bg-floating transition-colors min-w-[180px] text-left"
          >
            <GitBranch size={14} className="text-vercel-blue" />
            <span className="flex-1 text-code-sm truncate">
              {selectedRepo ? selectedRepo.full_name : 'Select Repository'}
            </span>
            <ChevronDown size={14} className={cn("text-on-surface-variant transition-transform", isRepoOpen && "rotate-180")} />
          </button>

          {isRepoOpen && (
            <div className="absolute top-full mt-1 right-0 w-64 bg-charcoal border border-border-primary rounded-sm shadow-xl z-50 overflow-hidden">
              <div className="p-2 border-b border-border-primary bg-obsidian/50 text-label-caps text-[9px] text-on-surface-variant">
                Active Repositories
              </div>
              <div className="max-h-60 overflow-y-auto">
                {repositories.length === 0 ? (
                  <div className="p-4 text-center text-body-sm text-on-surface-variant italic">
                    No repositories imported
                  </div>
                ) : (
                  repositories.map(repo => (
                    <button
                      key={repo.id}
                      onClick={() => {
                        setSelectedRepositoryId(repo.id);
                        setIsRepoOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 text-left text-body-sm hover:bg-floating transition-colors",
                        selectedRepositoryId === repo.id && "bg-vercel-blue/10 text-vercel-blue border-l-2 border-vercel-blue"
                      )}
                    >
                      <GitBranch size={12} />
                      <span className="truncate">{repo.full_name}</span>
                    </button>
                  ))
                )}
              </div>
              <button 
                onClick={handleImportClick}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-label-caps text-vercel-blue hover:bg-floating border-t border-border-primary transition-colors text-[9px] font-bold"
              >
                <Plus size={12} />
                Import Repository
              </button>
            </div>
          )}
        </div>

        <button className="p-2 rounded hover:bg-floating text-on-surface-variant hover:text-on-surface transition-colors relative">
          <Bell size={16} />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-vercel-blue rounded-full border border-charcoal"></span>
        </button>
      </div>

      {/* Simple Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-charcoal border border-border-primary rounded-sm w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-border-primary flex items-center justify-between">
              <h2 className="text-headline">Import Repository</h2>
              <button onClick={() => setShowImportModal(false)} className="text-on-surface-variant hover:text-on-surface">
                <Plus size={20} className="rotate-45" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isAvailableLoading ? (
                <div className="text-center py-8 animate-pulse text-on-surface-variant">
                  Loading available repositories...
                </div>
              ) : availableRepositories.length === 0 ? (
                <div className="p-8 border border-dashed border-border-primary rounded-sm text-center space-y-4">
                  <div className="space-y-2">
                    <p className="text-body-sm text-on-surface">No available repositories found.</p>
                    <p className="text-[11px] text-on-surface-variant">
                      You need to install the GitHub App on your repositories before they can be imported.
                    </p>
                  </div>
                  <a 
                    href="https://github.com/settings/installations"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-obsidian border border-border-primary rounded-sm text-label-caps text-vercel-blue hover:bg-floating transition-colors"
                  >
                    Configure GitHub App
                    <ExternalLink size={12} />
                  </a>
                </div>
              ) : (
                availableRepositories.map(repo => (
                  <div key={repo.github_repo_id} className="p-3 border border-border-primary rounded-sm flex items-center justify-between hover:bg-floating/30 transition-colors">
                    <div className="flex-1">
                      <h4 className="text-body-sm font-medium">{repo.full_name}</h4>
                      {repo.description && <p className="text-[10px] text-on-surface-variant truncate max-w-[250px]">{repo.description}</p>}
                    </div>
                    <button 
                      onClick={async () => {
                        await importRepository(repo);
                        setShowImportModal(false);
                      }}
                      className="px-3 py-1 bg-vercel-blue text-white rounded-sm text-[10px] font-bold uppercase"
                    >
                      Import
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
