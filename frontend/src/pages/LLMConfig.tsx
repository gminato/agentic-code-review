import React, { useEffect, useState } from 'react';
import { settingsApi } from '../api/settings';
import { Cpu, Key, Eye, EyeOff, Save, Loader2, Info, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const POPULAR_MODELS = [
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini (Fast & Cost-Effective)', description: 'Perfect for quick syntactical review and lighter diffs.' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet (Recommended)', description: 'Industry leader for complex architectural and logical code reviews.' },
  { id: 'google/gemini-flash-1.5', name: 'Gemini 1.5 Flash (Large Context)', description: 'Great for extremely large pull requests and multi-file context.' },
  { id: 'meta-llama/llama-3-70b-instruct', name: 'Llama 3 70B (Solid Open Model)', description: 'Excellent high-quality open intelligence alternative.' },
];

export default function LLMConfigPage() {
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('anthropic/claude-3.5-sonnet');
  const [customModel, setCustomModel] = useState('');
  const [isCustomModel, setIsCustomModel] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(4096);
  
  const [showKey, setShowKey] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await settingsApi.getLLMConfig();
        const data = response.data;
        if (data) {
          setApiKey(data.api_key || '');
          const isPop = POPULAR_MODELS.some(m => m.id === data.model);
          if (isPop || !data.model) {
            setSelectedModel(data.model || 'anthropic/claude-3.5-sonnet');
            setIsCustomModel(false);
          } else {
            setSelectedModel('custom');
            setCustomModel(data.model);
            setIsCustomModel(true);
          }
          setTemperature(data.temperature ?? 0.7);
          setMaxTokens(data.max_tokens ?? 4096);
        }
      } catch (err) {
        console.error('Failed to load LLM configuration:', err);
        toast.error('Failed to load LLM configuration');
      } finally {
        setIsLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedModel(val);
    if (val === 'custom') {
      setIsCustomModel(true);
    } else {
      setIsCustomModel(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey) {
      toast.error('OpenRouter API Key is required');
      return;
    }

    const finalModel = isCustomModel ? customModel.trim() : selectedModel;
    if (isCustomModel && !finalModel) {
      toast.error('Please specify a custom OpenRouter model identifier');
      return;
    }

    setIsSaving(true);
    try {
      await settingsApi.updateLLMConfig({
        provider: 'openrouter',
        api_key: apiKey,
        model: finalModel,
        temperature,
        max_tokens: maxTokens,
      });
      toast.success('LLM configuration saved successfully');
    } catch (err) {
      console.error('Failed to save LLM configuration:', err);
      toast.error('Failed to save LLM configuration');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-on-surface-variant">
        <Loader2 className="animate-spin text-vercel-blue mb-4" size={32} />
        <span className="text-body-sm font-mono">Fetching LLM settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-on-surface flex items-center gap-2">
          <Cpu size={24} className="text-vercel-blue" />
          LLM Engine Settings
        </h1>
        <p className="text-body-sm text-on-surface-variant">
          Configure your personal AI inference engine. Hook up your OpenRouter account to enable custom models for reviews and agents.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Model Selection Assistant */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-charcoal border border-border-primary rounded-sm p-4 space-y-4">
            <h3 className="text-label-caps text-[9px] text-on-surface-variant font-mono uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={11} className="text-vercel-blue" />
              Intelligence Engine Info
            </h3>
            <p className="text-[11px] leading-relaxed text-on-surface-variant">
              We route code review tasks through <strong>OpenRouter</strong>, giving you access to the world's best open-source and proprietary models without vendor lock-in.
            </p>
            <div className="space-y-2 pt-2 border-t border-border-primary/40">
              <span className="text-[10px] font-bold text-on-surface block">Supported Parameters:</span>
              <ul className="list-disc pl-4 space-y-1 text-[10px] text-on-surface-variant">
                <li><strong>Temperature</strong>: Controls creativity/precision. A lower temperature (e.g. 0.2 - 0.4) is ideal for strict syntax checking.</li>
                <li><strong>Max Tokens</strong>: Maximum length of review commentary output.</li>
              </ul>
            </div>
            <div className="bg-obsidian border border-border-primary/60 p-3 rounded-sm space-y-1">
              <span className="text-[9px] font-mono text-vercel-blue font-bold uppercase tracking-wider block">Get a Key</span>
              <p className="text-[10px] text-on-surface-variant leading-relaxed">
                Create an OpenRouter account, top up with credits, and generate an API key at{' '}
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-vercel-blue underline hover:text-vercel-blue/80"
                >
                  openrouter.ai
                </a>.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Configuration Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSave} className="bg-charcoal border border-border-primary rounded-sm overflow-hidden flex flex-col justify-between">
            <div className="p-4 space-y-6">
              
              <h3 className="text-label-caps text-[9px] text-on-surface-variant font-mono uppercase tracking-wider border-b border-border-primary/60 pb-2 flex items-center gap-1.5">
                <Key size={12} className="text-vercel-blue" />
                OpenRouter Provider Configuration
              </h3>

              {/* OpenRouter API Key */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-on-surface-variant uppercase tracking-wider block">
                  OpenRouter API Key
                </label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    required
                    placeholder="sk-or-v1-..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full bg-obsidian border border-border-primary rounded-sm py-2 pl-3 pr-10 text-code-sm focus:outline-none focus:border-vercel-blue text-on-surface font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-2.5 text-on-surface-variant hover:text-on-surface cursor-pointer"
                  >
                    {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <span className="text-[9px] text-on-surface-variant block">
                  Your key is securely saved in your database and is never exposed to external clients once configured.
                </span>
              </div>

              {/* Model Choice */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-on-surface-variant uppercase tracking-wider block">
                  Default Inference Model
                </label>
                <select
                  value={selectedModel}
                  onChange={handleModelChange}
                  className="w-full bg-obsidian border border-border-primary rounded-sm py-2 px-3 text-code-sm focus:outline-none focus:border-vercel-blue text-on-surface"
                >
                  {POPULAR_MODELS.map(model => (
                    <option key={model.id} value={model.id}>{model.name}</option>
                  ))}
                  <option value="custom">Custom OpenRouter Model Identifier...</option>
                </select>
              </div>

              {/* Custom Model String Field */}
              {isCustomModel && (
                <div className="space-y-1.5 p-3 bg-obsidian border border-border-primary rounded-sm animate-in fade-in slide-in-from-top-1 duration-200">
                  <label className="text-[9px] font-mono text-vercel-blue uppercase tracking-wider block">
                    Custom Model String ID
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. anthropic/claude-3-opus or deepseek/deepseek-chat"
                    value={customModel}
                    onChange={(e) => setCustomModel(e.target.value)}
                    className="w-full bg-charcoal border border-border-primary rounded-sm py-1.5 px-3 text-code-sm focus:outline-none focus:border-vercel-blue text-on-surface font-mono"
                  />
                  <span className="text-[8px] text-on-surface-variant block mt-1 leading-relaxed">
                    Refer to OpenRouter's model catalog for the exact model identifiers (e.g. <code>mistralai/mixtral-8x7b-instruct</code>).
                  </span>
                </div>
              )}

              {/* Temperature Slider */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center text-[10px] font-mono text-on-surface-variant uppercase tracking-wider">
                  <span>Temperature (Creativity/Control)</span>
                  <span className="text-vercel-blue font-bold font-mono text-xs">{temperature.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.5"
                  step="0.05"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full h-1 bg-obsidian border border-border-primary rounded-sm cursor-pointer accent-vercel-blue"
                />
                <div className="flex justify-between text-[8px] text-on-surface-variant font-mono">
                  <span>0.0 (Strict / Precision)</span>
                  <span>0.7 (Balanced / Code Review Default)</span>
                  <span>1.5 (High Creativity)</span>
                </div>
              </div>

              {/* Max Tokens Input */}
              <div className="space-y-1.5 pt-2">
                <label className="text-[10px] font-mono text-on-surface-variant uppercase tracking-wider block">
                  Max Response Tokens
                </label>
                <input
                  type="number"
                  min="512"
                  max="32768"
                  step="256"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value) || 4096)}
                  className="w-full bg-obsidian border border-border-primary rounded-sm py-2 px-3 text-code-sm focus:outline-none focus:border-vercel-blue text-on-surface font-mono"
                />
                <span className="text-[9px] text-on-surface-variant block">
                  Upper ceiling for the tokens generated by the model during review commentary.
                </span>
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
                    Saving changes...
                  </>
                ) : (
                  <>
                    <Save size={11} />
                    Save Configuration
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
