import { useEffect, useState } from 'react';
import { useCronStore } from '../store/cronStore';
import { useAgentStore } from '../store/agentStore';
import { useRepositoryStore } from '../store/repositoryStore';
import { Clock, Plus, Trash2, Edit2, Loader2, AlertCircle, Calendar } from 'lucide-react';
import { toast } from 'sonner';

function getCronDescription(cron: string): string {
  const c = cron.trim();
  if (c === '0 * * * *') return 'Hourly (at minute 0)';
  if (c === '0 0 * * *') return 'Daily (at midnight)';
  if (c === '0 0 * * 0') return 'Weekly (Sundays at midnight)';
  if (c === '*/30 * * * *') return 'Every 30 minutes';
  if (c === '*/15 * * * *') return 'Every 15 minutes';
  if (c === '0 12 * * *') return 'Daily at noon (12:00 PM)';
  return `Custom Cron: "${c}"`;
}

export default function Cron() {
  const { selectedRepositoryId, repositories } = useRepositoryStore();
  const { cronJobs, isLoading: isCronLoading, error: cronError, fetchCronJobs, createCronJob, updateCronJob, deleteCronJob } = useCronStore();
  const { agents, fetchAgents } = useAgentStore();

  const [showModal, setShowModal] = useState(false);
  const [editingJobId, setEditingJobId] = useState<number | null>(null);
  
  // Form State
  const [agentId, setAgentId] = useState<string>('');
  const [cronExpr, setCronExpr] = useState('0 0 * * *');
  const [enabled, setEnabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedRepo = repositories.find(r => r.id === selectedRepositoryId);

  useEffect(() => {
    if (selectedRepositoryId) {
      fetchCronJobs(selectedRepositoryId);
      fetchAgents(selectedRepositoryId);
    }
  }, [selectedRepositoryId, fetchCronJobs, fetchAgents]);

  // Set default agent when agents load
  useEffect(() => {
    if (agents.length > 0 && !agentId) {
      setAgentId(agents[0].id.toString());
    }
  }, [agents, agentId]);

  const resetForm = () => {
    setAgentId(agents.length > 0 ? agents[0].id.toString() : '');
    setCronExpr('0 0 * * *');
    setEnabled(true);
    setEditingJobId(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEdit = (job: any) => {
    setAgentId(job.agent_id.toString());
    setCronExpr(job.cron_expression);
    setEnabled(job.enabled);
    setEditingJobId(job.id);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRepositoryId) {
      toast.error('No repository selected');
      return;
    }
    if (!agentId) {
      toast.error('Please configure and select an AI Agent first');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingJobId !== null) {
        await updateCronJob(editingJobId, {
          agent_id: parseInt(agentId),
          cron_expression: cronExpr,
          enabled
        });
        toast.success('Scheduled review task updated');
      } else {
        await createCronJob({
          repository_id: selectedRepositoryId,
          agent_id: parseInt(agentId),
          cron_expression: cronExpr,
          enabled
        });
        toast.success('Scheduled review task created');
      }
      setShowModal(false);
      resetForm();
    } catch (err) {
      toast.error('Failed to save scheduled task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to remove this scheduled sync?')) {
      return;
    }

    try {
      await deleteCronJob(id);
      toast.success('Scheduled task deleted successfully');
    } catch (err) {
      toast.error('Failed to delete scheduled task');
    }
  };

  const handleToggleEnabled = async (job: any) => {
    try {
      await updateCronJob(job.id, { enabled: !job.enabled });
      toast.success(`Scheduled task ${!job.enabled ? 'enabled' : 'disabled'}`);
    } catch (err) {
      toast.error('Failed to update scheduled status');
    }
  };

  if (!selectedRepositoryId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
        <Clock size={48} className="text-on-surface-variant animate-pulse" />
        <h2 className="text-headline">No Repository Selected</h2>
        <p className="text-body-sm text-on-surface-variant max-w-sm">
          Please select a repository from the header dropdown to manage scheduled review syncs.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-on-surface flex items-center gap-2">
            <Clock size={24} className="text-vercel-blue" />
            Scheduled Review Tasks
          </h1>
          <p className="text-body-sm text-on-surface-variant">
            Set periodic cron operations to review recent commits automatically for{' '}
            <span className="font-mono text-primary font-semibold">{selectedRepo?.full_name}</span>.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-vercel-blue hover:bg-vercel-blue/90 text-white rounded-sm text-label-caps transition-colors cursor-pointer text-[10px] font-bold"
        >
          <Plus size={14} />
          Add Cron Job
        </button>
      </div>

      {cronError && (
        <div className="p-4 border border-rose/30 bg-rose/5 rounded-sm flex items-start gap-3">
          <AlertCircle className="text-rose shrink-0 mt-0.5" size={16} />
          <p className="text-body-sm text-rose font-medium">{cronError}</p>
        </div>
      )}

      {isCronLoading && cronJobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-on-surface-variant">
          <Loader2 className="animate-spin text-vercel-blue mb-3" size={24} />
          <span className="text-code-sm">Fetching scheduled review tasks...</span>
        </div>
      ) : cronJobs.length === 0 ? (
        <div className="p-12 border border-dashed border-border-primary rounded-sm text-center max-w-xl mx-auto space-y-4">
          <Calendar className="text-on-surface-variant mx-auto animate-bounce" size={32} />
          <div className="space-y-2">
            <h3 className="text-headline text-on-surface font-semibold">No Scheduled Review Tasks</h3>
            <p className="text-body-sm text-on-surface-variant">
              Establish a periodic timer to perform automatic security and style audits of your master branches.
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-obsidian border border-border-primary hover:border-vercel-blue hover:bg-floating/30 text-vercel-blue rounded-sm text-label-caps transition-all text-[9px] font-bold tracking-wider cursor-pointer"
          >
            Create Your First Cron Sync
          </button>
        </div>
      ) : (
        <div className="bg-charcoal border border-border-primary rounded-sm overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-primary bg-obsidian/40 text-label-caps text-[9px] text-on-surface-variant font-mono">
                  <th className="p-4">Assigned AI Agent</th>
                  <th className="p-4">Cron Expression</th>
                  <th className="p-4">Description Frequency</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-primary/60">
                {cronJobs.map((job) => {
                  const matchedAgent = agents.find((a) => a.id === job.agent_id);
                  return (
                    <tr
                      key={job.id}
                      className={`hover:bg-floating/10 transition-colors ${
                        !job.enabled && 'opacity-65'
                      }`}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-vercel-blue animate-pulse"></div>
                          <span className="font-medium text-body-sm text-on-surface">
                            {matchedAgent ? matchedAgent.name : `Agent #${job.agent_id}`}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-mono text-code-sm text-primary bg-obsidian border border-border-primary px-2 py-0.5 rounded-sm">
                          {job.cron_expression}
                        </span>
                      </td>
                      <td className="p-4 text-body-sm text-on-surface-variant font-mono">
                        {getCronDescription(job.cron_expression)}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleToggleEnabled(job)}
                          className={`px-2.5 py-0.5 rounded-sm text-[9px] font-mono uppercase font-bold border transition-colors cursor-pointer ${
                            job.enabled
                              ? 'bg-emerald/10 border-emerald/30 text-emerald hover:bg-emerald/20'
                              : 'bg-rose/10 border-rose/30 text-rose hover:bg-rose/20'
                          }`}
                        >
                          {job.enabled ? 'Enabled' : 'Paused'}
                        </button>
                      </td>
                      <td className="p-4 text-right space-x-3">
                        <button
                          onClick={() => handleOpenEdit(job)}
                          className="text-on-surface-variant hover:text-on-surface inline-flex items-center gap-1 text-[10px] font-mono uppercase transition-colors cursor-pointer"
                        >
                          <Edit2 size={11} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(job.id)}
                          className="text-on-surface-variant hover:text-rose inline-flex items-center gap-1 text-[10px] font-mono uppercase transition-colors cursor-pointer"
                        >
                          <Trash2 size={11} />
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Scheduler Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-charcoal border border-border-primary rounded-sm w-full max-w-md overflow-hidden flex flex-col shadow-2xl animate-in fade-in duration-200">
            <div className="p-4 border-b border-border-primary flex items-center justify-between bg-obsidian/40">
              <h2 className="text-headline flex items-center gap-2">
                <Clock size={16} className="text-vercel-blue" />
                {editingJobId ? 'Configure Schedule Task' : 'Schedule Review Task'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-on-surface-variant hover:text-on-surface cursor-pointer text-lg font-semibold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {agents.length === 0 ? (
                <div className="p-4 border border-dashed border-border-primary rounded-sm text-center space-y-3">
                  <p className="text-body-sm text-on-surface-variant">
                    You do not have any active AI review agents configured for this repository.
                  </p>
                  <p className="text-[11px] text-vercel-blue">
                    Please create an agent in the &quot;Agents&quot; page first.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-on-surface-variant uppercase tracking-wider block">
                      Target AI Agent Node
                    </label>
                    <select
                      value={agentId}
                      required
                      onChange={(e) => setAgentId(e.target.value)}
                      className="w-full bg-obsidian border border-border-primary rounded-sm py-1.5 px-3 text-code-sm focus:outline-none focus:border-vercel-blue text-on-surface"
                    >
                      {agents.map((agent) => (
                        <option key={agent.id} value={agent.id}>
                          {agent.name} ({agent.model})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-on-surface-variant uppercase tracking-wider block">
                      Quick Frequency Selector
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Every 30 Mins', value: '*/30 * * * *' },
                        { label: 'Hourly Sync', value: '0 * * * *' },
                        { label: 'Daily Midnight', value: '0 0 * * *' },
                        { label: 'Weekly Sunday', value: '0 0 * * 0' }
                      ].map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => setCronExpr(item.value)}
                          className={`py-1.5 px-2.5 rounded border text-[9px] font-mono tracking-wider text-center cursor-pointer transition-colors ${
                            cronExpr === item.value
                              ? 'bg-vercel-blue/15 border-vercel-blue text-vercel-blue font-bold'
                              : 'bg-obsidian border-border-primary text-on-surface hover:bg-floating'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-on-surface-variant uppercase tracking-wider block">
                      Cron Timing Expression (5-Fields)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 0 * * * *"
                      value={cronExpr}
                      onChange={(e) => setCronExpr(e.target.value)}
                      className="w-full bg-obsidian border border-border-primary rounded-sm py-1.5 px-3 text-code-sm focus:outline-none focus:border-vercel-blue text-on-surface font-mono"
                    />
                    <span className="text-[9px] font-mono text-on-surface-variant mt-1 block">
                      Resolved Frequency:{' '}
                      <span className="text-primary font-bold">{getCronDescription(cronExpr)}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <input
                      type="checkbox"
                      id="cronEnabled"
                      checked={enabled}
                      onChange={(e) => setEnabled(e.target.checked)}
                      className="rounded-sm bg-obsidian border-border-primary text-vercel-blue accent-vercel-blue cursor-pointer"
                    />
                    <label htmlFor="cronEnabled" className="text-body-sm font-medium text-on-surface cursor-pointer select-none">
                      Enable schedule immediately
                    </label>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-border-primary bg-obsidian/-10">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-obsidian hover:bg-floating border border-border-primary text-on-surface text-[10px] uppercase font-bold tracking-wider rounded-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || agents.length === 0}
                  className="px-4 py-2 bg-vercel-blue hover:bg-vercel-blue/90 text-white text-[10px] uppercase font-bold tracking-wider rounded-sm flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={10} />
                      Scheduling...
                    </>
                  ) : (
                    'Set Schedule'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}