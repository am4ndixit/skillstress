import React, { useState } from 'react';
import {
  Settings as SettingsIcon, Cpu, RotateCcw, Save,
  Wifi, WifiOff, Activity, ExternalLink, CheckCircle2, AlertCircle
} from 'lucide-react';
import { useWorkbench } from '../context/WorkbenchContext';
import { Button } from '../components/common/Button';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, testProviderConnection, resetToSampleData } = useWorkbench();
  const [endpoint, setEndpoint] = useState(settings.provider.endpoint);
  const [model, setModel]       = useState(settings.provider.model);
  const [provider, setProvider] = useState(settings.provider.provider);
  const [hasChanges, setHasChanges] = useState(false);

  const handleEndpointChange = (v: string) => { setEndpoint(v); setHasChanges(true); };
  const handleModelChange    = (v: string) => { setModel(v);    setHasChanges(true); };
  const handleProviderChange = (v: 'openai' | 'ollama') => { setProvider(v); setHasChanges(true); };

  const handleSave = () => {
    updateSettings({ provider: { ...settings.provider, provider, endpoint, model } });
    setHasChanges(false);
  };

  const { status } = settings.provider;
  const statusColor = status === 'connected' ? 'var(--status-pass)' : status === 'checking' ? 'var(--status-warn)' : 'var(--status-fail)';
  const statusBg    = status === 'connected' ? 'var(--status-pass-bg)' : status === 'checking' ? 'var(--status-warn-bg)' : 'var(--status-fail-bg)';
  const statusBorder = status === 'connected' ? 'var(--status-pass-border)' : status === 'checking' ? 'var(--status-warn-border)' : 'var(--status-fail-border)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '720px' }} className="animate-fade-up">
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <SettingsIcon size={22} style={{ color: 'var(--cyan-400)' }} />
          Settings
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
          Choose OpenAI or Ollama. OpenAI keys stay on the backend.
        </p>
      </div>

      {/* Provider card */}
      <div className="glass-raised" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px', height: '44px',
              background: 'var(--bg-surface)',
              border: '2px solid var(--border-edge)',
              borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Cpu size={20} style={{ color: 'var(--cyan-400)' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                {provider === 'ollama' ? 'Ollama Inference' : 'OpenAI API'}
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {provider === 'ollama' ? 'Run an installed local model without sending prompts to a hosted provider.' : 'Hosted inference using the backend-only OPENAI_API_KEY.'}
              </p>
            </div>
          </div>

          {/* Connection status pill */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 14px',
            borderRadius: '10px',
            background: statusBg,
            border: `1px solid ${statusBorder}`
          }}>
            {status === 'connected' ? <Wifi size={15} style={{ color: statusColor }} />
              : status === 'checking' ? <Activity size={15} style={{ color: statusColor }} />
              : <WifiOff size={15} style={{ color: statusColor }} />}
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: statusColor, textTransform: 'capitalize' }}>
                {status}
              </div>
              {settings.provider.latencyMs && status === 'connected' && (
                <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
                  {settings.provider.latencyMs}ms ping
                </div>
              )}
              {settings.provider.errorMessage && (
                <div style={{ fontSize: '10px', color: statusColor, maxWidth: '200px' }}>
                  {settings.provider.errorMessage}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Current model info */}
        {status === 'connected' && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 14px',
            background: 'var(--status-pass-bg)',
            border: '1px solid var(--status-pass-border)',
            borderRadius: '8px'
          }}>
            <CheckCircle2 size={14} style={{ color: 'var(--status-pass)', flexShrink: 0 }} />
            <span style={{ fontSize: '12px', color: 'var(--status-pass)', fontWeight: 500 }}>
              Connected to model: <strong>{settings.provider.model}</strong>
            </span>
          </div>
        )}
        {status === 'disconnected' && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 14px',
            background: '#f2eee6',
            border: '1px solid var(--border-edge)',
            borderRadius: '8px'
          }}>
            <AlertCircle size={14} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {provider === 'ollama' ? <>Ollama is unavailable. Start <code style={{ color: 'var(--cyan-400)', fontFamily: 'var(--font-mono)' }}>ollama serve</code> and select a model that is already installed.</> : <>OpenAI is unavailable. Set <code style={{ color: 'var(--cyan-400)', fontFamily: 'var(--font-mono)' }}>OPENAI_API_KEY</code> in the backend environment.</>}
            </span>
          </div>
        )}

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label htmlFor="provider-select" style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
              Provider
            </label>
            <select id="provider-select" value={provider} onChange={e => handleProviderChange(e.target.value as 'openai' | 'ollama')} className="select">
              <option value="ollama">Ollama (local)</option>
              <option value="openai">OpenAI</option>
            </select>
          </div>
          {provider === 'ollama' && <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
              Ollama Endpoint
            </label>
            <input
              type="url"
              value={endpoint}
              onChange={e => handleEndpointChange(e.target.value)}
              className="input"
              placeholder="http://localhost:11434"
            />
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>
              Default: http://localhost:11434
            </div>
          </div>}
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
              Model
            </label>
            {provider === 'ollama' && settings.provider.models?.length ? (
              <select value={model} onChange={e => handleModelChange(e.target.value)} className="select">
                {settings.provider.models.map(item => <option key={item} value={item}>{item}</option>)}
              </select>
            ) : <>
              <input
                type="text"
                value={model}
                onChange={e => handleModelChange(e.target.value)}
                className="input"
                list={provider === 'openai' ? 'openai-model-options' : undefined}
                placeholder={provider === 'ollama' ? 'e.g. qwen2.5-coder:7b' : 'e.g. gpt-4.1-mini'}
              />
              {provider === 'openai' && <datalist id="openai-model-options">
                {(settings.provider.models || []).map(item => <option key={item} value={item} />)}
              </datalist>}
            </>}
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>
              {provider === 'ollama' ? 'Test Connection lists installed models; SkillStress will not download them.' : 'Use a model available to your OpenAI API account.'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
            <Button
              variant="secondary"
              onClick={() => testProviderConnection({ provider, endpoint, model })}
              loading={status === 'checking'}
              icon={<Wifi size={13} />}
            >
              Test Connection
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={!hasChanges}
              icon={<Save size={13} />}
            >
              {hasChanges ? 'Save Changes' : 'Saved'}
            </Button>
          </div>
        </div>
      </div>

      {/* Provider setup guide */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ExternalLink size={14} style={{ color: 'var(--cyan-400)' }} />
          {provider === 'ollama' ? 'Ollama Setup Guide' : 'OpenAI Setup Guide'}
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {(provider === 'ollama' ? [
            { step: '1', cmd: 'brew install ollama', desc: 'Install Ollama (macOS)' },
            { step: '2', cmd: 'ollama serve', desc: 'Start the Ollama server' },
            { step: '3', cmd: 'ollama list', desc: 'Choose a model already installed on this machine' },
          ] : [
            { step: '1', cmd: 'export OPENAI_API_KEY=…', desc: 'Set the key in the backend environment only' },
            { step: '2', cmd: 'Restart the FastAPI backend', desc: 'The browser never receives the key' },
            { step: '3', cmd: 'Test Connection', desc: 'Validate the key and list available models' },
          ]).map(item => (
            <div key={item.step} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '22px', height: '22px', borderRadius: '6px', flexShrink: 0,
                background: 'var(--bg-surface)', border: '2px solid var(--border-edge)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '10px', fontWeight: 800, color: 'var(--cyan-400)'
              }}>
                {item.step}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <code style={{ fontSize: '12px', color: 'var(--cyan-300)', fontFamily: 'var(--font-mono)' }}>
                  {item.cmd}
                </code>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '1px' }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div className="glass-panel" style={{
        padding: '20px',
        borderColor: 'var(--border-edge)',
        background: 'var(--bg-surface)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--status-fail)', marginBottom: '3px' }}>
              Reset Workbench Data
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
          Restore the starter skills and provider preferences. This clears saved run history saved in the current workbench.
            </p>
          </div>
          <Button variant="danger" size="sm" onClick={resetToSampleData} icon={<RotateCcw size={13} />}>
            Reset All Data
          </Button>
        </div>
      </div>
    </div>
  );
};
