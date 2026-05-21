import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { settingsApi, type GitHubInstallation } from '../api/settings';
import { Settings as SettingsIcon, User, ExternalLink, RefreshCw, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const { user } = useAuthStore();
  const [installations, setInstallations] = useState<GitHubInstallation[]>([]);
  const [isLoadingInstallations, setIsLoadingInstallations] = useState(false);

  // Platform Preferences Form State (saved to local storage to make it persistent)
  const [severityThreshold, setSeverityThreshold] = useState(() => 
    localStorage.getItem('settings_severity') || 'Medium'
  );
  const [minRiskScore, setMinRiskScore] = useState(() => 
    parseFloat(localStorage.getItem('settings_min_risk') || '4.0')
  );
  const [verbosity, setVerbosity] = useState(() => 
    localStorage.getItem('settings_verbosity') || 'Detailed'
  );
  const [autoSubmit, setAutoSubmit] = useState(() => 
    localStorage.getItem('settings_autosubmit') === 'true'
  );

  const [isSaving, setIsSaving] = useState(false);

  const fetchInstallations = async () => {
    setIsLoadingInstallations(true);
    try {
      const response = await settingsApi.getInstallations();
      setInstallations(response.data || []);
    } catch (err) {
      console.error('Failed to fetch app installations:', err);
    } finally {
      setIsLoadingInstallations(false);
    }
  };

  useEffect(() => {
    fetchInstallations();
  }, []);

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Save to localStorage
    localStorage.setItem('settings_severity', severityThreshold);
    localStorage.setItem('settings_min_risk', minRiskScore.toString());
    localStorage.setItem('settings_verbosity', verbosity);
    localStorage.setItem('settings_autosubmit', autoSubmit.toString());

    setTimeout(() => {
      setIsSaving(false);
      toast.success('Global platform preferences updated successfully');
    }, 450);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-on-surface flex items-center gap-2">
          <SettingsIcon size={24} className="text-vercel-blue" />
          Platform Settings
        </h1>
        <p className="text-body-sm text-on-surface-variant">
          Manage your GitHub App integrations, administrator profile, and autonomous review behaviors.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Profile & Integration Details */}
        <div className="md:col-span-1 space-y-6">
          
          {/* User Profile Card */}
          <div className="bg-charcoal border border-border-primary rounded-sm p-4 space-y-4">
            <h3 className="text-label-caps text-[9px] text-on-surface-variant font-mono uppercase tracking-wider">
              Admin Profile
            </h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-sm bg-obsidian flex items-center justify-center border border-border-primary overflow-hidden shrink-0">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                ) : (
                  <User size={18} className="text-on-surface-variant" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-body-sm text-on-surface truncate">
                  {user?.username || 'Administrator'}
                </h4>
                <p className="text-[10px] text-on-surface-variant truncate font-mono">
                  {user?.email || 'admin@agentic.review'}
                </p>
              </div>
            </div>
            <div className="pt-2 border-t border-border-primary/40 text-[10px] text-on-surface-variant">
              <span>Auth Type: </span>
              <span className="text-primary font-mono bg-obsidian px-1.5 py-0.5 rounded-sm border border-border-primary/50">
                GitHub OAuth
              </span>
            </div>
          </div>

          {/* Integration Status Card */}
          <div className="bg-charcoal border border-border-primary rounded-sm p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-label-caps text-[9px] text-on-surface-variant font-mono uppercase tracking-wider">
                GitHub App Status
              </h3>
              <button
                onClick={fetchInstallations}
                disabled={isLoadingInstallations}
                className="text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                <RefreshCw size={11} className={isLoadingInstallations ? 'animate-spin text-vercel-blue' : ''} />
              </button>
            </div>

            {isLoadingInstallations ? (
              <div className="py-6 flex items-center justify-center text-[10px] text-on-surface-variant gap-2">
                <Loader2 className="animate-spin text-vercel-blue" size={12} />
                <span>Loading active installations...</span>
              </div>
            ) : installations.length === 0 ? (
              <div className="p-3 border border-dashed border-border-primary rounded-sm text-center space-y-2">
                <p className="text-[10px] text-on-surface-variant">
                  No active GitHub App installations discovered on this account.
                </p>
                <a
                  href="https://github.com/settings/installations"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-vercel-blue hover:underline"
                >
                  Configure Installation
                  <ExternalLink size={10} />
                </a>
              </div>
            ) : (
              <div className="space-y-3">
                {installations.map((inst) => (
                  <div
                    key={inst.id}
                    className="p-2.5 bg-obsidian border border-border-primary rounded-sm flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={inst.account.avatar_url}
                        alt={inst.account.login}
                        className="w-6 h-6 rounded-full border border-border-primary bg-charcoal"
                      />
                      <div className="min-w-0">
                        <span className="text-[11px] font-semibold text-on-surface block truncate">
                          {inst.account.login}
                        </span>
                        <span className="text-[8px] text-on-surface-variant font-mono block uppercase">
                          {inst.account.type}
                        </span>
                      </div>
                    </div>
                    <span className="px-1.5 py-0.5 rounded-sm bg-emerald/10 border border-emerald/20 text-[8px] text-emerald font-bold font-mono">
                      CONNECTED
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Platform Configuration Preferences Form */}
        <div className="md:col-span-2">
          <form
            onSubmit={handleSavePreferences}
            className="bg-charcoal border border-border-primary rounded-sm overflow-hidden flex flex-col justify-between"
          >
            <div className="p-4 space-y-5">
              <h3 className="text-label-caps text-[9px] text-on-surface-variant font-mono uppercase tracking-wider border-b border-border-primary/60 pb-2">
                Autonomous Review Rules & Preferences
              </h3>

              {/* Severity Threshold Selector */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-on-surface-variant uppercase tracking-wider block">
                  Minimum Commentary Severity
                </label>
                <select
                  value={severityThreshold}
                  onChange={(e) => setSeverityThreshold(e.target.value)}
                  className="w-full bg-obsidian border border-border-primary rounded-sm py-1.5 px-3 text-code-sm focus:outline-none focus:border-vercel-blue text-on-surface"
                >
                  <option value="Low">Low - Report all linting and minor code style conventions</option>
                  <option value="Medium">Medium - Highlight code bottlenecks, duplicate functions, and warnings</option>
                  <option value="High">High - Notify only critical architectural and security concerns</option>
                </select>
                <span className="text-[9px] text-on-surface-variant block mt-1">
                  Limits the severity scores written back to GitHub comments to keep discussions clean.
                </span>
              </div>

              {/* Minimum Risk Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-mono text-on-surface-variant uppercase tracking-wider">
                  <span>Minimum Risk Score Trigger Alert</span>
                  <span className="text-vercel-blue font-bold font-mono text-xs">{minRiskScore.toFixed(1)} / 10</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="10.0"
                  step="0.5"
                  value={minRiskScore}
                  onChange={(e) => setMinRiskScore(parseFloat(e.target.value))}
                  className="w-full h-1 bg-obsidian border border-border-primary rounded-sm cursor-pointer accent-vercel-blue"
                />
                <span className="text-[9px] text-on-surface-variant block">
                  Any pull request or commit exceeding this risk score will generate high-priority system alerts.
                </span>
              </div>

              {/* Review Comment Verbosity */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-on-surface-variant uppercase tracking-wider block">
                  Review Commentary Verbosity
                </label>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  {[
                    { label: 'Detailed Line-by-Line', value: 'Detailed', desc: 'Full step-by-step corrections with embedded code templates.' },
                    { label: 'Concise Bulletpoints', value: 'Concise', desc: 'Short lists outlining required changes and performance summaries.' }
                  ].map((pref) => (
                    <button
                      key={pref.value}
                      type="button"
                      onClick={() => setVerbosity(pref.value)}
                      className={`p-3 text-left border rounded-sm transition-colors cursor-pointer ${
                        verbosity === pref.value
                          ? 'bg-vercel-blue/10 border-vercel-blue text-on-surface'
                          : 'bg-obsidian/45 border-border-primary hover:bg-floating/30 text-on-surface-variant'
                      }`}
                    >
                      <span className="text-body-sm font-semibold block">{pref.label}</span>
                      <span className="text-[9px] leading-relaxed block mt-1">{pref.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Autosubmit Checkbox */}
              <div className="flex items-start gap-3 pt-3 border-t border-border-primary/40">
                <input
                  type="checkbox"
                  id="autoSubmitOption"
                  checked={autoSubmit}
                  onChange={(e) => setAutoSubmit(e.target.checked)}
                  className="mt-1 rounded-sm bg-obsidian border-border-primary text-vercel-blue accent-vercel-blue cursor-pointer shrink-0"
                />
                <div className="space-y-0.5">
                  <label
                    htmlFor="autoSubmitOption"
                    className="text-body-sm font-medium text-on-surface cursor-pointer select-none"
                  >
                    Auto-submit Review comments to GitHub
                  </label>
                  <p className="text-[9px] text-on-surface-variant leading-relaxed">
                    When enabled, review findings are automatically submitted directly to the pull request as line reviews.
                    If disabled, reviews will remain saved in this dashboard until you manually approve and push them.
                  </p>
                </div>
              </div>
            </div>

            {/* Save Preferences Footer */}
            <div className="px-4 py-3 bg-obsidian/30 border-t border-border-primary flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-vercel-blue hover:bg-vercel-blue/90 text-white text-[10px] uppercase font-bold tracking-wider rounded-sm flex items-center gap-2 cursor-pointer transition-colors"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="animate-spin" size={11} />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save size={11} />
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}