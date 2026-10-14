'use client';

import { useState, useEffect } from 'react';
import { Key, Copy, Check, Trash2, Plus, Loader2, Eye, EyeOff, Terminal, Zap, Shield, AlertTriangle, ExternalLink } from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import { MCP_URL } from '@/lib/siteUrl';

export default function ApiKeysPage() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedConfig, setCopiedConfig] = useState(false);
  const [copiedWebUrl, setCopiedWebUrl] = useState(false);
  const [copiedWebHeader, setCopiedWebHeader] = useState(false);
  const [instructionTab, setInstructionTab] = useState('web');
  const [deletingId, setDeletingId] = useState(null);
  const [revokeConfirmId, setRevokeConfirmId] = useState(null);
  const [showAlert, setShowAlert] = useState(null);

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      const res = await fetch('/api/auth/api-keys');
      const data = await res.json();
      setKeys(data.keys || []);
    } catch (err) {
      console.error('Failed to fetch API keys:', err);
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!newKeyName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/auth/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setNewlyCreatedKey(data.key);
        setNewKeyName('');
        setShowCreateForm(false);
        fetchKeys();
      } else {
        setShowAlert({ message: data.error || 'Failed to create key', type: 'error' });
      }
    } catch (err) {
      setShowAlert({ message: 'Failed to create API key', type: 'error' });
    }
    setCreating(false);
  };

  const handleDeleteClick = (keyId) => {
    setRevokeConfirmId(keyId);
  };

  const executeRevoke = async () => {
    if (!revokeConfirmId) return;
    const keyId = revokeConfirmId;
    setRevokeConfirmId(null);
    setDeletingId(keyId);
    try {
      const res = await fetch(`/api/auth/api-keys?id=${keyId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchKeys();
      } else {
        const data = await res.json();
        setShowAlert({ message: data.error || 'Failed to revoke key', type: 'error' });
      }
    } catch (err) {
      setShowAlert({ message: 'Failed to revoke key', type: 'error' });
    }
    setDeletingId(null);
  };

  const copyToClipboard = async (text, setter) => {
    await navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2500);
  };

  const claudeConfig = newlyCreatedKey ? JSON.stringify({
    mcpServers: {
      blogwrite: {
        command: 'node',
        args: [`${typeof window !== 'undefined' ? '' : '/path/to'}/mcp-server/index.js`],
        env: {
          BLOGWRITE_API_KEY: newlyCreatedKey,
          BLOGWRITE_URL: typeof window !== 'undefined' ? window.location.origin : 'https://your-blogwrite.example',
        },
      },
    },
  }, null, 2) : '';

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', padding: '40px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '36px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '10px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(245,158,11,0.3)',
          }}>
            <Key size={24} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
              API Keys
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: 0 }}>
              Connect BlogWrite to Claude Desktop and other MCP clients
            </p>
          </div>
        </div>
      </div>

      {/* Claude Desktop Integration Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(168,85,247,0.08), rgba(59,130,246,0.08))',
        border: '1px solid rgba(168,85,247,0.2)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '28px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <Zap size={18} style={{ color: '#a855f7' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
            Connect with Claude Desktop
          </h3>
        </div>
        <p style={{ fontSize: '14px', lineHeight: 1.7, color: 'var(--color-text-secondary)', margin: 0, marginBottom: '16px' }}>
          Create an API key below, then add BlogWrite as an MCP server in Claude Desktop.
          You&apos;ll be able to create posts, generate AI content, browse Pulse news, read research papers,
          and manage your entire blog — all from Claude&apos;s chat.
        </p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['Create Posts', 'AI Writing', 'Cover Images', 'Pulse News', 'Research Papers', 'Bookmarks', 'Profile'].map(feature => (
            <span key={feature} style={{
              fontSize: '11px', fontWeight: 600,
              padding: '4px 10px', borderRadius: '20px',
              background: 'rgba(168,85,247,0.1)', color: '#a855f7',
            }}>
              {feature}
            </span>
          ))}
        </div>
      </div>

      {/* Newly Created Key Alert */}
      {newlyCreatedKey && (
        <div style={{
          background: 'rgba(16,185,129,0.08)',
          border: '1px solid rgba(16,185,129,0.25)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '28px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Shield size={16} style={{ color: '#10b981' }} />
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#10b981', margin: 0 }}>
              API Key Created — Save it now!
            </h3>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '14px' }}>
            This key will only be shown <strong>once</strong>. Copy it now and store it safely.
          </p>

          {/* The key itself */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            background: 'var(--color-bg-primary)',
            border: '1px solid var(--color-border-primary)',
            borderRadius: '10px', padding: '12px 16px',
            marginBottom: '20px',
          }}>
            <code style={{
              flex: 1, fontSize: '13px', fontFamily: 'monospace',
              color: 'var(--color-text-primary)', wordBreak: 'break-all',
            }}>
              {newlyCreatedKey}
            </code>
            <button onClick={() => copyToClipboard(newlyCreatedKey, setCopiedKey)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: copiedKey ? '#10b981' : 'var(--color-text-muted)',
              padding: '6px', display: 'flex', flexShrink: 0,
            }}>
              {copiedKey ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '8px' }}>
            {/* Claude Desktop Config */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.02)',
              border: '1px solid var(--color-border-primary)',
              borderRadius: '12px', padding: '16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Terminal size={14} style={{ color: 'var(--color-text-muted)' }} />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    Claude Desktop Config
                  </span>
                </div>
                <button onClick={() => copyToClipboard(claudeConfig, setCopiedConfig)} style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  fontSize: '11px', fontWeight: 600,
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: copiedConfig ? '#10b981' : 'var(--color-brand)',
                }}>
                  {copiedConfig ? <><Check size={11} /> Copied!</> : <><Copy size={11} /> Copy JSON</>}
                </button>
              </div>
              <pre style={{
                background: 'var(--color-bg-primary)',
                border: '1px solid var(--color-border-primary)',
                borderRadius: '8px', padding: '12px',
                fontSize: '11.5px', lineHeight: 1.5,
                overflow: 'auto', maxHeight: '120px',
                color: 'var(--color-text-secondary)',
                margin: 0,
              }}>
                {claudeConfig}
              </pre>
              <p style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', marginTop: '8px', marginBottom: 0, lineHeight: 1.5 }}>
                Paste into your desktop JSON config and restart. Runs over Stdio.
              </p>
            </div>

            {/* Claude Web Custom Connector */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.02)',
              border: '1px solid var(--color-border-primary)',
              borderRadius: '12px', padding: '16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                <ExternalLink size={14} style={{ color: 'var(--color-text-muted)' }} />
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  Claude.ai Custom Connector
                </span>
              </div>
              
              {/* Server URL Row */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                    Connection URL (OAuth Authenticated)
                  </span>
                  <button onClick={() => copyToClipboard(MCP_URL, setCopiedWebUrl)} style={{
                    display: 'flex', alignItems: 'center', gap: '3px',
                    fontSize: '11px', fontWeight: 600,
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: copiedWebUrl ? '#10b981' : 'var(--color-brand)',
                  }}>
                    {copiedWebUrl ? <><Check size={11} /> Copied!</> : <><Copy size={11} /> Copy URL</>}
                  </button>
                </div>
                <pre style={{
                  background: 'var(--color-bg-primary)',
                  border: '1px solid var(--color-border-primary)',
                  borderRadius: '8px', padding: '8px 12px',
                  fontSize: '11.5px', color: 'var(--color-text-secondary)',
                  margin: 0, overflow: 'auto',
                  whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                }}>
                  {MCP_URL}
                </pre>
                <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '8px', marginBottom: 0, lineHeight: 1.4 }}>
                  No API key needed for the Web App connector! Once added, simply click <strong>Connect</strong> in Claude to authorize.
                </p>
              </div>
            </div>
          </div>

          <button onClick={() => setNewlyCreatedKey(null)} style={{
            fontSize: '12px', fontWeight: 600,
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--color-text-muted)', marginTop: '12px',
          }}>
            Dismiss
          </button>
        </div>
      )}

      {/* Create New Key */}
      <div style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border-primary)',
        borderRadius: '16px', padding: '24px',
        marginBottom: '24px',
      }}>
        {!showCreateForm ? (
          <button onClick={() => setShowCreateForm(true)} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            width: '100%', padding: '14px',
            borderRadius: '12px', border: '2px dashed var(--color-border-primary)',
            background: 'transparent', cursor: 'pointer',
            fontSize: '14px', fontWeight: 600,
            color: 'var(--color-text-secondary)',
            transition: 'all 0.2s',
          }}>
            <Plus size={18} />
            Create New API Key
          </button>
        ) : (
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '16px' }}>
              New API Key
            </h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                placeholder='Key name (e.g. "Claude Desktop", "My Mac")'
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                autoFocus
                style={{
                  flex: 1, padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--color-border-primary)',
                  background: 'var(--color-bg-primary)',
                  color: 'var(--color-text-primary)',
                  fontSize: '14px', outline: 'none',
                }}
              />
              <button onClick={handleCreate} disabled={creating || !newKeyName.trim()} style={{
                padding: '10px 20px', borderRadius: '10px',
                background: creating || !newKeyName.trim() ? 'var(--color-bg-tertiary)' : 'linear-gradient(135deg, #f59e0b, #ea580c)',
                color: 'white', fontSize: '14px', fontWeight: 600,
                border: 'none', cursor: creating || !newKeyName.trim() ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Create
              </button>
              <button onClick={() => { setShowCreateForm(false); setNewKeyName(''); }} style={{
                padding: '10px 14px', borderRadius: '10px',
                background: 'var(--color-bg-tertiary)',
                color: 'var(--color-text-secondary)',
                fontSize: '14px', fontWeight: 600,
                border: 'none', cursor: 'pointer',
              }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Existing Keys */}
      <div style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border-primary)',
        borderRadius: '16px',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--color-border-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
            Your API Keys
          </h3>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)' }}>
            {keys.length}/5 keys used
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-brand)', margin: '0 auto' }} />
          </div>
        ) : keys.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <Key size={32} style={{ color: 'var(--color-text-muted)', margin: '0 auto 12px', opacity: 0.4 }} />
            <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: 0 }}>
              No API keys yet. Create one to get started.
            </p>
          </div>
        ) : (
          <div>
            {keys.map((key, i) => (
              <div key={key._id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 24px',
                borderBottom: i < keys.length - 1 ? '1px solid var(--color-border-primary)' : 'none',
                transition: 'background 0.15s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    background: 'var(--color-bg-tertiary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Key size={16} style={{ color: 'var(--color-text-muted)' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {key.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                      <code style={{
                        fontSize: '12px', color: 'var(--color-text-muted)',
                        background: 'var(--color-bg-tertiary)',
                        padding: '1px 6px', borderRadius: '4px',
                      }}>
                        {key.prefix}••••••••
                      </code>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                        {key.lastUsedAt ? `Last used ${timeAgo(key.lastUsedAt)}` : 'Never used'}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteClick(key._id)}
                  disabled={deletingId === key._id}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--color-text-muted)',
                    padding: '8px', borderRadius: '8px',
                    display: 'flex', alignItems: 'center',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
                  title="Revoke key"
                >
                  {deletingId === key._id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Setup Instructions */}
      <div style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border-primary)',
        borderRadius: '16px', padding: '24px',
        marginTop: '24px',
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '18px' }}>
          MCP Setup Guide
        </h3>

        {/* Tab Headers */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--color-border-primary)',
          marginBottom: '20px',
          gap: '16px',
        }}>
          <button
            onClick={() => setInstructionTab('web')}
            style={{
              padding: '8px 12px 12px 12px',
              background: 'none',
              border: 'none',
              borderBottom: instructionTab === 'web' ? '2px solid var(--color-brand)' : '2px solid transparent',
              color: instructionTab === 'web' ? 'var(--color-brand)' : 'var(--color-text-muted)',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Claude.ai Web App (Beta)
          </button>
          <button
            onClick={() => setInstructionTab('desktop')}
            style={{
              padding: '8px 12px 12px 12px',
              background: 'none',
              border: 'none',
              borderBottom: instructionTab === 'desktop' ? '2px solid var(--color-brand)' : '2px solid transparent',
              color: instructionTab === 'desktop' ? 'var(--color-brand)' : 'var(--color-text-muted)',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Claude Desktop App
          </button>
        </div>

        {instructionTab === 'web' ? (
          <div>
            <p style={{ fontSize: '13.5px', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
              Claude.ai supports remote <strong>Custom Connectors</strong> on the web interface, which uses Server-Sent Events (SSE). 
              Connections are securely authenticated using OAuth (no API key required).
            </p>
            <ol style={{ paddingLeft: '20px', margin: 0 }}>
              {[
                <>Navigate to your <strong style={{ color: 'var(--color-text-primary)' }}>Claude.ai Settings</strong> &gt; <strong style={{ color: 'var(--color-text-primary)' }}>Custom Connectors</strong>.</>,
                'Click "Add Connector" (the "+" icon next to Connectors) and name it "BlogWrite".',
                <>Set the Remote MCP server URL to <code style={{ fontSize: '11px', background: 'var(--color-bg-tertiary)', padding: '2px 6px', borderRadius: '4px' }}>{MCP_URL}</code>.</>,
                <>Click <strong style={{ color: 'var(--color-text-primary)' }}>Add</strong> to save the connector.</>,
                <>Under the newly added connector, click <strong style={{ color: 'var(--color-text-primary)' }}>Connect</strong>. You will be redirected to approve the connection securely, and then you are ready to chat! Try asking:
                  <ul style={{ listStyleType: 'disc', paddingLeft: '20px', marginTop: '6px', fontSize: '12px' }}>
                    <li><strong>&quot;list my recent blog posts from blogwrite&quot;</strong></li>
                    <li><strong>&quot;write a blog post about future robotics and how it will take over the world&quot;</strong></li>
                  </ul>
                </>
              ].map((step, i) => (
                <li key={i} style={{
                  fontSize: '13.5px', lineHeight: 1.7,
                  color: 'var(--color-text-secondary)',
                  marginBottom: '8px',
                }}>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: '13.5px', color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
              Claude Desktop uses a local configuration file to start Model Context Protocol (MCP) servers locally using Stdio.
            </p>
            <ol style={{ paddingLeft: '20px', margin: 0 }}>
              {[
                'Create an API key above.',
                <>Copy the generated <strong>Claude Desktop Config JSON</strong> block.</>,
                <>Open your local Claude Desktop config file: <code style={{ fontSize: '11px', background: 'var(--color-bg-tertiary)', padding: '2px 6px', borderRadius: '4px' }}>~/Library/Application Support/Claude/claude_desktop_config.json</code></>,
                'Paste the JSON content inside the "mcpServers" block.',
                <>Ensure the command is set to <code style={{ fontSize: '11px', background: 'var(--color-bg-tertiary)', padding: '2px 6px', borderRadius: '4px' }}>node</code> and the absolute path to your BlogWrite mcp-server is correct.</>,
                'Restart the Claude Desktop App completely.',
                <>Look for the 🔨 hammer icon in Claude&apos;s chat message input box — BlogWrite is fully connected!</>,
              ].map((step, i) => (
                <li key={i} style={{
                  fontSize: '13.5px', lineHeight: 1.7,
                  color: 'var(--color-text-secondary)',
                  marginBottom: '8px',
                }}>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
      {/* Custom Dialog Overlay */}
      {(revokeConfirmId || showAlert) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-fade-in">
          {revokeConfirmId && (
            <div className="w-full max-w-md p-6 rounded-2xl shadow-2xl border border-[var(--color-border-primary)] transition-all animate-scale-up"
              style={{ background: 'var(--color-bg-card)', color: 'var(--color-text-primary)' }}>
              <h3 className="text-[17px] font-bold mb-2.5" style={{ fontFamily: 'var(--font-serif)' }}>
                Revoke API Key
              </h3>
              <p className="text-[14px] leading-relaxed mb-6" style={{ color: 'var(--color-text-secondary)' }}>
                Are you sure you want to revoke this API key? Any connections using it will stop working immediately.
              </p>
              <div className="flex justify-end gap-2.5">
                <button
                  onClick={() => setRevokeConfirmId(null)}
                  className="px-4 py-2 rounded-xl text-[13px] font-medium transition-all hover:bg-[var(--color-bg-hover)] cursor-pointer"
                  style={{ border: '1px solid var(--color-border-primary)', color: 'var(--color-text-secondary)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={executeRevoke}
                  className="px-4 py-2 rounded-xl text-[13px] font-bold text-white transition-all bg-red-500 hover:bg-red-600 shadow-md shadow-red-500/20 cursor-pointer"
                >
                  Revoke
                </button>
              </div>
            </div>
          )}

          {showAlert && (
            <div className="w-full max-w-md p-6 rounded-2xl shadow-2xl border border-[var(--color-border-primary)] transition-all animate-scale-up"
              style={{ background: 'var(--color-bg-card)', color: 'var(--color-text-primary)' }}>
              <h3 className="text-[17px] font-bold mb-2.5" style={{ fontFamily: 'var(--font-serif)' }}>
                {showAlert.type === 'error' ? 'Error' : 'Success'}
              </h3>
              <p className="text-[14px] leading-relaxed mb-6" style={{ color: 'var(--color-text-secondary)' }}>
                {showAlert.message}
              </p>
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setShowAlert(null);
                  }}
                  className="px-5 py-2 rounded-xl text-[13px] font-bold text-white transition-all bg-amber-500 hover:bg-amber-600 shadow-md cursor-pointer"
                >
                  OK
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
