import { useEffect, useState } from 'react';
import { useAgentStore } from '../store/agentStore';
import { useRepositoryStore } from '../store/repositoryStore';
import { Bot, Plus, Trash2, Edit2, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { settingsApi } from '../api/settings';

const PRESETS = [
  {
    name: 'Security Auditor',
    model: 'anthropic/claude-3.5-sonnet',
    prompt: 'You are a Senior Security Engineer. Analyze the incoming diffs for common vulnerabilities, including injection flaws, authentication bypasses, cryptographic missteps, credential leaks, and OWASP Top 10 vulnerabilities. Rate severity as High, Medium, or Low and suggest clean, remediated code snippets.',
    config_json: { severity_threshold: 'Medium', auto_reject_pr: false }
  },
  {
    name: 'Performance Profiler',
    model: 'openai/gpt-4o',
    prompt: 'You are a Lead Systems Architect. Inspect these code changes for runtime bottlenecks, memory leaks, high time-complexity algorithms, unindexed database queries, redundant network requests, or excessive asset sizes. Suggest optimal, optimized implementations.',
    config_json: { max_loop_depth: 3, flag_nested_loops: true }
  },
  {
    name: 'Clean Code Stylist',
    model: 'google/gemini-flash-1.5',
    prompt: 'You are a meticulous Code Quality Lead. Review these files to ensure they conform to enterprise coding guidelines, standard naming conventions, proper architectural design patterns, modular code structures, comprehensive JSDoc/docstring documentation, and high testability.',
    config_json: { check_naming_conventions: true, enforce_strict_typescript: true }
  }
];

export default function Agents() {
  const { selectedRepositoryId, repositories } = useRepositoryStore();
  const { agents, isLoading, error, fetchAgents, createAgent, updateAgent, deleteAgent } = useAgentStore();
  
  const [showModal, setShowModal] = useState(false);
  const [editingAgentId, setEditingAgentId] = useState<number | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [model, setModel] = useState('use-global-default');
  const [customModel, setCustomModel] = useState('');
  const [isCustomModel, setIsCustomModel] = useState(false);
  const [promptText, setPromptText] = useState('');
  const [configStr, setConfigStr] = useState('{}');
  const [enabled, setEnabled] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedRepo = repositories.find(r => r.id === selectedRepositoryId);
  const [globalModel, setGlobalModel] = useState<string | null>(null);

  useEffect(() => {
    const fetchGlobalConfig = async () => {
      try {
        const response = await settingsApi.getLLMConfig();
        if (response.data && response.data.model) {
          setGlobalModel(response.data.model);
        }
      } catch (e) {
        console.error('Failed to load global LLM config:', e);
      }
    };
    fetchGlobalConfig();
  }, []);

  useEffect(() => {
    if (selectedRepositoryId) {
      fetchAgents(selectedRepositoryId);
    }
  }, [selectedRepositoryId, fetchAgents]);

  const resetForm = () => {
    setName('');
    setModel('use-global-default');
    setCustomModel('');
    setIsCustomModel(false);
    setPromptText('');
    setConfigStr('{}');
    setEnabled(true);
    setEditingAgentId(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEdit = (agent: any) => {
    setName(agent.name);
    const predefined = ['use-global-default', 'anthropic/claude-3.5-sonnet', 'openai/gpt-4o', 'openai/gpt-4o-mini', 'google/gemini-flash-1.5', 'meta-llama/llama-3-70b-instruct'].includes(agent.model);
    if (predefined) {
      setModel(agent.model);
      setIsCustomModel(false);
      setCustomModel('');
    } else {
      setModel('custom');
      setIsCustomModel(true);
      setCustomModel(agent.model);
    }
    setPromptText(agent.prompt);
    setConfigStr(JSON.stringify(agent.config_json || {}, null, 2));
    setEnabled(agent.enabled);
    setEditingAgentId(agent.id);
    setShowModal(true);
  };

  const handleLoadPreset = (preset: typeof PRESETS[0]) => {
    setName(preset.name);
    
    const predefined = ['use-global-default', 'anthropic/claude-3.5-sonnet', 'openai/gpt-4o', 'openai/gpt-4o-mini', 'google/gemini-flash-1.5', 'meta-llama/llama-3-70b-instruct'].includes(preset.model);
    if (predefined) {
      setModel(preset.model);
      setIsCustomModel(false);
      setCustomModel('');
    } else {
      setModel('custom');
      setIsCustomModel(true);
      setCustomModel(preset.model);
    }

    setPromptText(preset.prompt);
    setConfigStr(JSON.stringify(preset.config_json, null, 2));
    toast.success(`Loaded preset: ${preset.name}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRepositoryId) {
      toast.error('No repository selected');
      return;
    }

    const finalModel = isCustomModel ? customModel.trim() : model;
    if (isCustomModel && !finalModel) {
      toast.error('Please specify a custom OpenRouter model identifier');
      return;
    }

    let parsedConfig = {};
    try {
      parsedConfig = JSON.parse(configStr);
    } catch (err) {
      toast.error('Invalid configuration JSON');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingAgentId !== null) {
        await updateAgent(editingAgentId, {
          name,
          model: finalModel,
          prompt: promptText,
          config_json: parsedConfig,
          enabled
        });
        toast.success('Agent updated successfully');
      } else {
        await createAgent({
          repository_id: selectedRepositoryId,
          name: name,
          model: finalModel,
          prompt: promptText,
          config_json: parsedConfig,
          enabled: enabled
        });
        toast.success('Agent created successfully');
      }
      setShowModal(false);
      resetForm();
    } catch (err) {
      toast.error('Failed to save agent');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this agent? This cannot be undone.')) {
      return;
    }

    try {
      await deleteAgent(id);
      toast.success('Agent deleted successfully');
    } catch (err) {
      toast.error('Failed to delete agent');
    }
  };

  const handleToggleEnabled = async (agent: any) => {
    try {
      await updateAgent(agent.id, { enabled: !agent.enabled });
      toast.success(`Agent ${!agent.enabled ? 'enabled' : 'disabled'}`);
    } catch (err) {
      toast.error('Failed to toggle agent state');
    }
  };

  if (!selectedRepositoryId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
        <Bot size={48} className="text-on-surface-variant animate-pulse" />
        <h2 className="text-headline">No Repository Selected</h2>
        <p className="text-body-sm text-on-surface-variant max-w-sm">
          Please select a repository from the header dropdown to manage review agents.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-on-surface flex items-center gap-2">
            <Bot size={24} className="text-vercel-blue" />
            Autonomous Review Agents
          </h1>
          <p className="text-body-sm text-on-surface-variant">
            Configure custom specialized AI persona nodes to monitor and audit files inside{' '}
            <span className="font-mono text-primary font-semibold">{selectedRepo?.full_name}</span>.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-vercel-blue hover:bg-vercel-blue/90 text-white rounded-sm text-label-caps transition-colors cursor-pointer text-[10px] font-bold"
        >
          <Plus size={14} />
          Create Agent
        </button>
      </div>

      {error && (
        <div className="p-4 border border-rose/30 bg-rose/5 rounded-sm flex items-start gap-3">
          <AlertCircle className="text-rose shrink-0 mt-0.5" size={16} />
          <p className="text-body-sm text-rose font-medium">{error}</p>
        </div>
      )}

      {isLoading && agents.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-on-surface-variant">
          <Loader2 className="animate-spin text-vercel-blue mb-3" size={24} />
          <span className="text-code-sm">Fetching repository agents...</span>
        </div>
      ) : agents.length === 0 ? (
        <div className="p-8 border border-dashed border-border-primary rounded-sm text-center max-w-xl mx-auto space-y-6">
          <div className="space-y-2">
            <h3 className="text-headline text-on-surface font-semibold">No Review Agents Added</h3>
            <p className="text-body-sm text-on-surface-variant">
              Add specialized AI modules to analyze, inspect, and optimize code changes in this repo.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={async () => {
                  try {
                    await createAgent({
                      repository_id: selectedRepositoryId,
                      name: preset.name,
                      model: preset.model,
                      prompt: preset.prompt,
                      config_json: preset.config_json,
                      enabled: true
                    });
                    toast.success(`Initialized preset: ${preset.name}`);
                  } catch (e) {
                    toast.error('Failed to create preset');
                  }
                }}
                className="p-3 bg-obsidian border border-border-primary hover:border-vercel-blue hover:bg-floating/30 transition-all text-left space-y-1.5 group cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-vercel-blue">
                  <Sparkles size={11} className="group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">{preset.name}</span>
                </div>
                <p className="text-[9px] text-on-surface-variant line-clamp-3 leading-relaxed">
                  {preset.prompt}
                </p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className={`bg-charcoal border rounded-sm flex flex-col justify-between overflow-hidden transition-all duration-200 ${
                agent.enabled ? 'border-border-primary hover:border-vercel-blue/40' : 'border-border-primary/40 opacity-75'
              }`}
            >
              <div className="p-4 space-y-4">
                {/* Header */}
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1 min-w-0">
                    <h3 className="font-semibold text-body-sm text-on-surface truncate flex items-center gap-2">
                      <Bot size={14} className={agent.enabled ? 'text-vercel-blue' : 'text-on-surface-variant'} />
                      {agent.name}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[9px] px-2 py-0.5 rounded border border-border-primary bg-obsidian text-on-surface-variant">
                        {agent.model}
                      </span>
                      {!agent.enabled && (
                        <span className="font-mono text-[9px] text-rose font-bold uppercase">Disabled</span>
                      )}
                    </div>
                  </div>

                  {/* Switch button style toggle */}
                  <button
                    onClick={() => handleToggleEnabled(agent)}
                    className={`px-2.5 py-1 rounded-sm text-[9px] font-mono uppercase font-bold border transition-colors cursor-pointer ${
                      agent.enabled
                        ? 'bg-emerald/10 border-emerald/30 text-emerald hover:bg-emerald/25'
                        : 'bg-rose/10 border-rose/30 text-rose hover:bg-rose/25'
                    }`}
                  >
                    {agent.enabled ? 'Active' : 'Paused'}
                  </button>
                </div>

                {/* System Instructions */}
                <div className="space-y-1">
                  <h4 className="text-[9px] text-on-surface-variant font-mono uppercase tracking-wider">System Role</h4>
                  <p className="text-[11px] text-on-surface leading-relaxed line-clamp-3 bg-obsidian/40 border border-border-primary/20 p-2.5 rounded-sm">
                    {agent.prompt}
                  </p>
                </div>

                {/* Configuration JSON */}
                {agent.config_json && Object.keys(agent.config_json).length > 0 && (
                  <div className="space-y-1">
                    <h4 className="text-[9px] text-on-surface-variant font-mono uppercase tracking-wider">Parameters</h4>
                    <pre className="text-[9px] text-primary font-mono p-2 bg-obsidian rounded-sm overflow-x-auto border border-border-primary/20">
                      {JSON.stringify(agent.config_json, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="px-4 py-2.5 border-t border-border-primary/60 bg-obsidian/30 flex justify-between items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(agent)}
                  className="flex items-center gap-1.5 text-on-surface-variant hover:text-on-surface transition-colors text-[10px] font-mono uppercase cursor-pointer"
                >
                  <Edit2 size={10} />
                  Configure
                </button>
                <button
                  onClick={() => handleDelete(agent.id)}
                  className="flex items-center gap-1.5 text-on-surface-variant hover:text-rose transition-colors text-[10px] font-mono uppercase cursor-pointer"
                >
                  <Trash2 size={10} />
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Save / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-charcoal border border-border-primary rounded-sm w-full max-w-lg overflow-hidden flex flex-col shadow-2xl animate-in fade-in duration-200">
            <div className="p-4 border-b border-border-primary flex items-center justify-between bg-obsidian/40">
              <h2 className="text-headline flex items-center gap-2">
                <Bot size={16} className="text-vercel-blue" />
                {editingAgentId ? 'Configure Agent Persona' : 'Create Autonomous Agent'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-on-surface-variant hover:text-on-surface cursor-pointer font-semibold text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Presets load bar if creating new */}
              {!editingAgentId && (
                <div className="space-y-1.5 p-3 bg-obsidian border border-border-primary rounded-sm">
                  <span className="text-[9px] font-mono text-on-surface-variant uppercase tracking-wider block">
                    Quick Preset Setup
                  </span>
                  <div className="flex gap-2 flex-wrap">
                    {PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => handleLoadPreset(preset)}
                        className="px-2 py-1 bg-charcoal hover:bg-floating border border-border-primary rounded-sm text-[9px] font-medium text-on-surface transition-colors cursor-pointer"
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[9px] font-mono text-on-surface-variant uppercase tracking-wider block">
                  Agent Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Code Optimizer Node"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-obsidian border border-border-primary rounded-sm py-1.5 px-3 text-code-sm focus:outline-none focus:border-vercel-blue text-on-surface"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-mono text-on-surface-variant uppercase tracking-wider block">
                  LLM Intelligence Engine
                </label>
                <select
                  value={model}
                  onChange={(e) => {
                    const val = e.target.value;
                    setModel(val);
                    if (val === 'custom') {
                      setIsCustomModel(true);
                    } else {
                      setIsCustomModel(false);
                    }
                  }}
                  className="w-full bg-obsidian border border-border-primary rounded-sm py-1.5 px-3 text-code-sm focus:outline-none focus:border-vercel-blue text-on-surface font-mono"
                >
                  <option value="use-global-default">Use Global Default {globalModel ? `(${globalModel})` : '(from LLM Config)'}</option>
                  <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet (Recommended)</option>
                  <option value="openai/gpt-4o">GPT-4o (High Speed)</option>
                  <option value="openai/gpt-4o-mini">GPT-4o Mini (Cost-Effective)</option>
                  <option value="google/gemini-flash-1.5">Gemini 1.5 Flash (Large Context)</option>
                  <option value="meta-llama/llama-3-70b-instruct">Llama 3 70B (Open Engine)</option>
                  <option value="custom">Custom OpenRouter Model ID...</option>
                </select>
                {isCustomModel && (
                  <div className="space-y-1 mt-2 p-2 bg-obsidian border border-border-primary rounded-sm animate-in fade-in slide-in-from-top-1 duration-200">
                    <label className="text-[8px] font-mono text-vercel-blue uppercase tracking-wider block">
                      Custom OpenRouter Model ID
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. deepseek/deepseek-chat"
                      value={customModel}
                      onChange={(e) => setCustomModel(e.target.value)}
                      className="w-full bg-charcoal border border-border-primary rounded-sm py-1 px-2.5 text-code-sm focus:outline-none focus:border-vercel-blue text-on-surface font-mono"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-mono text-on-surface-variant uppercase tracking-wider block">
                  System Prompt Instructions
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Tell the AI what role it plays, what parameters to check, and the tone it should use in code reviews..."
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  className="w-full bg-obsidian border border-border-primary rounded-sm py-1.5 px-3 text-code-sm focus:outline-none focus:border-vercel-blue text-on-surface resize-none leading-relaxed"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-mono text-on-surface-variant uppercase tracking-wider block">
                  Configuration JSON Arguments
                </label>
                <textarea
                  rows={3}
                  value={configStr}
                  onChange={(e) => setConfigStr(e.target.value)}
                  className="w-full bg-obsidian border border-border-primary rounded-sm py-1.5 px-3 text-code-sm focus:outline-none focus:border-vercel-blue text-on-surface font-mono resize-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="enabledCheckbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="rounded-sm bg-obsidian border-border-primary text-vercel-blue accent-vercel-blue cursor-pointer"
                />
                <label htmlFor="enabledCheckbox" className="text-body-sm font-medium text-on-surface cursor-pointer select-none">
                  Enable agent immediately upon save
                </label>
              </div>

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
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-vercel-blue hover:bg-vercel-blue/90 text-white text-[10px] uppercase font-bold tracking-wider rounded-sm flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={10} />
                      Saving...
                    </>
                  ) : (
                    'Save Agent'
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