'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bot, Zap, BookOpen, Play, Pause, RefreshCw, Clock, CheckCircle2,
  XCircle, AlertTriangle, ChevronDown, ChevronRight, Loader2,
  TrendingUp, Activity, FileText, Settings, Sparkles, SkipForward, GraduationCap, Power
} from 'lucide-react';
import { timeAgo, formatNumber } from '@/lib/utils';

const PIPELINE_ICONS = {
  'generate-posts': { icon: FileText, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'Blog Posts' },
  'fetch-news': { icon: Zap, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', label: 'Pulse News' },
  'fetch-research': { icon: BookOpen, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', label: 'Research Papers' },
  'generate-topics': { icon: Sparkles, color: '#ec4899', bg: 'rgba(236,72,153,0.1)', label: 'Topic Generator' },
  'generate-series': { icon: GraduationCap, color: '#10b981', bg: 'rgba(16,185,129,0.1)', label: 'Learning Paths' },
};

// Fallback so an unmapped pipeline type can never hard-crash the admin page.
const DEFAULT_PIPELINE = { icon: Settings, color: '#6b7280', bg: 'rgba(107,114,128,0.1)', label: 'Pipeline' };

const STATUS_CONFIG = {
  success: { icon: CheckCircle2, color: '#22c55e', bg: 'rgba(34,197,94,0.1)', label: 'Success' },
  partial: { icon: AlertTriangle, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'Partial' },
  failed: { icon: XCircle, color: '#ef4444', bg: 'rgba(239,68,68,0.1)', label: 'Failed' },
  skipped: { icon: SkipForward, color: '#6b7280', bg: 'rgba(107,114,128,0.1)', label: 'Skipped' },
};

function formatDuration(ms) {
  if (!ms) return '—';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
}

function PipelineCard({ config, onToggle, onTrigger }) {
  const pipeline = PIPELINE_ICONS[config.type] || { ...DEFAULT_PIPELINE, label: config.type || 'Pipeline' };
  const PipeIcon = pipeline.icon;
  const [triggering, setTriggering] = useState(false);
  const [toggling, setToggling] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    await onToggle(config.type, !config.enabled);
    setToggling(false);
  };

  const handleTrigger = async () => {
    setTriggering(true);
    await onTrigger(config.type);
    setTriggering(false);
  };

  return (
    <div style={{
      background: 'var(--color-bg-card)',
      border: `1px solid ${config.enabled ? 'var(--color-border-primary)' : 'rgba(239,68,68,0.2)'}`,
      borderRadius: '16px',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
      opacity: config.enabled ? 1 : 0.75,
      transition: 'all 0.3s',
    }}>
      {/* Top glow */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
        background: config.enabled ? pipeline.color : '#6b7280',
        borderRadius: '16px 16px 0 0',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '12px',
            background: pipeline.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <PipeIcon size={20} style={{ color: pipeline.color }} />
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
              {config.label}
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: 0, marginTop: '2px' }}>
              {config.schedule}
            </p>
          </div>
        </div>
        {/* Toggle */}
        <button onClick={handleToggle} disabled={toggling} style={{
          width: '48px', height: '26px', borderRadius: '13px', border: 'none', cursor: 'pointer',
          background: config.enabled ? '#22c55e' : 'var(--color-bg-tertiary)',
          position: 'relative', transition: 'background 0.3s',
        }}>
          <div style={{
            width: '20px', height: '20px', borderRadius: '50%', background: 'white',
            position: 'absolute', top: '3px',
            left: config.enabled ? '25px' : '3px',
            transition: 'left 0.3s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }} />
        </button>
      </div>

      {/* Description */}
      <p style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--color-text-tertiary)', marginBottom: '18px' }}>
        {config.description}
      </p>

      {/* Stats row */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '18px',
        padding: '14px', borderRadius: '10px', background: 'var(--color-bg-primary)',
      }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Today</div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {config.todayStats?.succeeded || 0}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
            {config.todayStats?.runs || 0} runs
          </div>
        </div>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>This Week</div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {config.weekStats?.succeeded || 0}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
            {config.weekStats?.runs || 0} runs
          </div>
        </div>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg Time</div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {formatDuration(config.weekStats?.avgDuration)}
          </div>
        </div>
      </div>

      {/* Last run */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px', borderRadius: '10px',
        background: 'var(--color-bg-primary)', marginBottom: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={14} style={{ color: 'var(--color-text-muted)' }} />
          <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            Last run: {config.lastRunAt ? timeAgo(config.lastRunAt) : 'Never'}
          </span>
        </div>
        {config.lastRunStatus && (() => {
          const s = STATUS_CONFIG[config.lastRunStatus];
          const SIcon = s?.icon || CheckCircle2;
          return s ? (
            <span style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              fontSize: '11px', fontWeight: 600, color: s.color,
              padding: '3px 8px', borderRadius: '6px', background: s.bg,
            }}>
              <SIcon size={12} /> {s.label}
            </span>
          ) : null;
        })()}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={handleTrigger} disabled={triggering} style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          padding: '10px', borderRadius: '10px', border: 'none', cursor: triggering ? 'wait' : 'pointer',
          background: pipeline.bg, color: pipeline.color,
          fontSize: '13px', fontWeight: 600, transition: 'all 0.2s',
        }}>
          {triggering ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
          {triggering ? 'Running...' : 'Run Now'}
        </button>
      </div>
    </div>
  );
}

function LogEntry({ log, defaultExpanded }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const pipeline = PIPELINE_ICONS[log.type] || { ...DEFAULT_PIPELINE, label: log.type || 'Pipeline' };
  const status = STATUS_CONFIG[log.status] || STATUS_CONFIG.success;
  const PipeIcon = pipeline.icon || Activity;
  const StatusIcon = status.icon;

  return (
    <div style={{
      background: 'var(--color-bg-card)',
      border: '1px solid var(--color-border-primary)',
      borderRadius: '12px',
      overflow: 'hidden',
      marginBottom: '8px',
    }}>
      <button onClick={() => setExpanded(!expanded)} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
        padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer',
        textAlign: 'left',
      }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
          background: pipeline?.bg || 'var(--color-bg-tertiary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <PipeIcon size={16} style={{ color: pipeline?.color || 'var(--color-text-muted)' }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {pipeline?.label || log.type}
            </span>
            <span style={{
              display: 'flex', alignItems: 'center', gap: '3px',
              fontSize: '11px', fontWeight: 600, color: status.color,
              padding: '2px 7px', borderRadius: '5px', background: status.bg,
            }}>
              <StatusIcon size={10} /> {status.label}
            </span>
            {log.triggeredBy === 'manual' && (
              <span style={{
                fontSize: '10px', fontWeight: 600, color: 'var(--color-text-muted)',
                padding: '2px 6px', borderRadius: '4px', background: 'var(--color-bg-tertiary)',
              }}>
                Manual
              </span>
            )}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px', display: 'flex', gap: '12px' }}>
            <span>{timeAgo(log.createdAt)}</span>
            <span>⏱ {formatDuration(log.duration)}</span>
            {log.stats?.succeeded > 0 && <span>✅ {log.stats.succeeded} new</span>}
            {log.stats?.failed > 0 && <span>❌ {log.stats.failed} failed</span>}
            {log.stats?.filtered > 0 && <span>🚫 {log.stats.filtered} filtered</span>}
            {log.stats?.duplicates > 0 && <span>🔁 {log.stats.duplicates} dupes</span>}
          </div>
        </div>

        {expanded ? <ChevronDown size={16} style={{ color: 'var(--color-text-muted)' }} /> : <ChevronRight size={16} style={{ color: 'var(--color-text-muted)' }} />}
      </button>

      {/* Expanded details */}
      {expanded && (
        <div style={{
          padding: '0 18px 16px',
          borderTop: '1px solid var(--color-border-primary)',
          paddingTop: '14px',
        }}>
          {log.errorMessage && (
            <div style={{
              padding: '10px 14px', borderRadius: '8px', marginBottom: '12px',
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              fontSize: '13px', color: '#ef4444',
            }}>
              ❌ {log.errorMessage}
            </div>
          )}

          {log.details?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {log.details.map((d, i) => (
                <div key={i} style={{
                  padding: '12px 14px', borderRadius: '8px',
                  background: 'var(--color-bg-primary)',
                  border: d.error ? '1px solid rgba(239,68,68,0.2)' : '1px solid var(--color-border-primary)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    {d.error ? <XCircle size={14} style={{ color: '#ef4444' }} /> : <CheckCircle2 size={14} style={{ color: '#22c55e' }} />}
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {d.title || d.topic || 'Unknown'}
                    </span>
                    {d.hasCoverImage && <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', fontWeight: 600 }}>🖼️ Cover</span>}
                  </div>
                  {d.category && (
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                      📂 {d.category}{d.tags?.length > 0 ? ` · Tags: ${d.tags.join(', ')}` : ''}
                    </div>
                  )}
                  {d.reasoning && (
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.6, fontStyle: 'italic', marginTop: '4px', padding: '8px 10px', borderRadius: '6px', background: 'var(--color-bg-tertiary)' }}>
                      🧠 {d.reasoning}
                    </div>
                  )}
                  {d.error && (
                    <div style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>
                      Error: {d.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', textAlign: 'center', padding: '12px 0' }}>
              No detailed breakdown available for this run.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function AutomationPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logFilter, setLogFilter] = useState('all'); // 'all', 'generate-posts', 'fetch-news', 'fetch-research'
  const [statusFilter, setStatusFilter] = useState('all');
  const [logsLoading, setLogsLoading] = useState(false);
  const [pausing, setPausing] = useState(false);

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { fetchLogs(); }, [logsPage, logFilter, statusFilter]);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/automation');
      const d = await res.json();
      setData(d);
    } catch (err) {
      console.error('Failed to fetch automation data:', err);
    }
    setLoading(false);
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const params = new URLSearchParams({ page: logsPage, limit: 15 });
      if (logFilter !== 'all') params.set('type', logFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const res = await fetch(`/api/admin/automation/logs?${params}`);
      const d = await res.json();
      setLogs(d.logs || []);
      setLogsTotal(d.total || 0);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    }
    setLogsLoading(false);
  };

  const handleToggle = async (type, enabled) => {
    try {
      await fetch('/api/admin/automation', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, enabled }),
      });
      fetchData();
    } catch (err) {
      alert('Failed to toggle pipeline');
    }
  };

  const handlePauseAll = async () => {
    const isPaused = !!data?.automationPaused;
    if (!isPaused && !window.confirm(
      'Stop ALL automation immediately?\n\nEvery pipeline — scheduled crons AND manual "Run Now" — will be halted until you resume. In-progress runs are not interrupted.'
    )) return;
    setPausing(true);
    try {
      const res = await fetch('/api/admin/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: isPaused ? 'resume-all' : 'pause-all' }),
      });
      if (res.ok) {
        await fetchData();
      } else {
        const e = await res.json().catch(() => ({}));
        alert(e.error || 'Failed to update automation state');
      }
    } catch (err) {
      alert('Failed to update automation state');
    }
    setPausing(false);
  };

  const handleTrigger = async (type) => {
    try {
      const res = await fetch('/api/admin/automation/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      const result = await res.json();
      if (res.ok) {
        // Refresh data after trigger completes
        setTimeout(() => { fetchData(); fetchLogs(); }, 1000);
      } else {
        alert(result.error || 'Trigger failed');
      }
    } catch (err) {
      alert('Failed to trigger pipeline');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <Loader2 size={28} className="animate-spin" style={{ color: 'var(--color-brand)' }} />
      </div>
    );
  }

  const configs = data?.configs || [];
  const paused = !!data?.automationPaused;

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(245,158,11,0.3)',
          }}>
            <Bot size={24} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
              Automation Hub
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0 }}>
              Manage automated content pipelines, view execution logs, and generate content on demand
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Global emergency stop / resume */}
          <button onClick={handlePauseAll} disabled={pausing} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 18px', borderRadius: '12px', cursor: pausing ? 'default' : 'pointer',
            border: paused ? '1px solid transparent' : '1px solid rgba(239,68,68,0.4)',
            background: paused ? 'linear-gradient(135deg, #16a34a, #15803d)' : 'rgba(239,68,68,0.08)',
            color: paused ? 'white' : '#ef4444', fontSize: '14px', fontWeight: 700,
            boxShadow: paused ? '0 2px 12px rgba(22,163,74,0.3)' : 'none',
            opacity: pausing ? 0.6 : 1, transition: 'all 0.2s',
          }}>
            {pausing ? <Loader2 size={16} className="animate-spin" /> : paused ? <Play size={16} /> : <Power size={16} />}
            {paused ? 'Resume Automation' : 'Stop All Automation'}
          </button>
          <Link href="/admin/automation/generate" style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 20px', borderRadius: '12px', textDecoration: 'none',
            background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
            color: 'white', fontSize: '14px', fontWeight: 600,
            boxShadow: '0 2px 12px rgba(245,158,11,0.3)',
            transition: 'all 0.2s',
          }}>
            <Sparkles size={16} />
            AI Generate
          </Link>
        </div>
      </div>

      {/* Global paused banner */}
      {paused && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '14px 20px', borderRadius: '14px', marginBottom: '24px',
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
        }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
            background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Power size={18} style={{ color: '#ef4444' }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#ef4444' }}>
              All automation is paused
            </p>
            <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--color-text-muted)' }}>
              No pipeline will run — scheduled or manual — until you resume. Individual toggles are preserved.
            </p>
          </div>
        </div>
      )}

      {/* Pipeline Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '36px' }}>
        {configs.map(config => (
          <PipelineCard key={config.type} config={config} onToggle={handleToggle} onTrigger={handleTrigger} />
        ))}
      </div>

      {/* Execution Logs */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
            Execution Logs
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            {/* Type filter */}
            <select value={logFilter} onChange={e => { setLogFilter(e.target.value); setLogsPage(1); }} style={{
              padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
              background: 'var(--color-bg-card)', border: '1px solid var(--color-border-primary)',
              color: 'var(--color-text-secondary)', cursor: 'pointer',
            }}>
              <option value="all">All Pipelines</option>
              <option value="generate-posts">Blog Posts</option>
              <option value="fetch-news">Pulse News</option>
              <option value="fetch-research">Research Papers</option>
              <option value="generate-topics">Topic Generator</option>
              <option value="generate-series">Learning Paths</option>
            </select>
            {/* Status filter */}
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setLogsPage(1); }} style={{
              padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
              background: 'var(--color-bg-card)', border: '1px solid var(--color-border-primary)',
              color: 'var(--color-text-secondary)', cursor: 'pointer',
            }}>
              <option value="all">All Statuses</option>
              <option value="success">Success</option>
              <option value="partial">Partial</option>
              <option value="failed">Failed</option>
              <option value="skipped">Skipped</option>
            </select>
            <button onClick={() => fetchLogs()} style={{
              padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--color-border-primary)',
              background: 'var(--color-bg-card)', cursor: 'pointer', display: 'flex', alignItems: 'center',
            }}>
              <RefreshCw size={14} style={{ color: 'var(--color-text-muted)' }} />
            </button>
          </div>
        </div>

        {logsLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-brand)', margin: '0 auto' }} />
          </div>
        ) : logs.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '48px 20px',
            background: 'var(--color-bg-card)', border: '1px solid var(--color-border-primary)',
            borderRadius: '12px',
          }}>
            <Activity size={32} style={{ color: 'var(--color-text-muted)', margin: '0 auto 12px', opacity: 0.4 }} />
            <p style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
              No execution logs yet. Logs will appear here after the first pipeline run.
            </p>
          </div>
        ) : (
          <>
            {logs.map((log, i) => (
              <LogEntry key={log._id} log={log} defaultExpanded={i === 0} />
            ))}

            {/* Pagination */}
            {logsTotal > 15 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
                <button disabled={logsPage <= 1} onClick={() => setLogsPage(p => p - 1)} style={{
                  padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                  border: '1px solid var(--color-border-primary)', background: 'var(--color-bg-card)',
                  color: 'var(--color-text-secondary)', cursor: logsPage <= 1 ? 'not-allowed' : 'pointer',
                  opacity: logsPage <= 1 ? 0.5 : 1,
                }}>
                  ← Previous
                </button>
                <span style={{ padding: '6px 12px', fontSize: '12px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center' }}>
                  Page {logsPage} of {Math.ceil(logsTotal / 15)}
                </span>
                <button disabled={logsPage >= Math.ceil(logsTotal / 15)} onClick={() => setLogsPage(p => p + 1)} style={{
                  padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                  border: '1px solid var(--color-border-primary)', background: 'var(--color-bg-card)',
                  color: 'var(--color-text-secondary)', cursor: logsPage >= Math.ceil(logsTotal / 15) ? 'not-allowed' : 'pointer',
                  opacity: logsPage >= Math.ceil(logsTotal / 15) ? 0.5 : 1,
                }}>
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
