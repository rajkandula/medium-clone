'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Loader2, Plus, Trash2, Globe, FileText, Image as ImageIcon } from 'lucide-react';

export default function ProjectsPage() {
  const { user, refresh } = useAuth();
  const [projects, setProjects] = useState([]);
  const [saving, setSaving] = useState(false);
  
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    url: '',
    imageUrl: '',
  });

  useEffect(() => {
    if (user?.projects) {
      setProjects(user.projects);
    }
  }, [user]);

  const saveProjectsToDb = async (updatedProjects) => {
    setSaving(true);
    try {
      const res = await fetch('/api/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projects: updatedProjects }),
      });
      if (res.ok) {
        await refresh();
      }
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  };

  const handleAddProject = () => {
    if (!newProject.title) return;
    const updated = [...projects, newProject];
    setProjects(updated);
    saveProjectsToDb(updated);
    setNewProject({ title: '', description: '', url: '', imageUrl: '' });
  };

  const handleDeleteProject = (index) => {
    const updated = projects.filter((_, i) => i !== index);
    setProjects(updated);
    saveProjectsToDb(updated);
  };

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>Projects</h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>Showcase your portfolio, open source work, or side projects.</p>
      </div>

      {/* Add New Project Form */}
      <div className="p-6 rounded-xl space-y-4" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-primary)' }}>
        <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>Add New Project</h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>Project Title *</label>
            <input 
              value={newProject.title} 
              onChange={e => setNewProject({...newProject, title: e.target.value})}
              className="w-full px-4 py-2.5 rounded-lg text-sm focus:outline-none focus-ring"
              style={{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border-primary)', color: 'var(--color-text-primary)' }} 
              placeholder="e.g. My Awesome App" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2" style={{ color: 'var(--color-text-secondary)' }}>
              <Globe size={14} /> Project URL
            </label>
            <input 
              value={newProject.url} 
              onChange={e => setNewProject({...newProject, url: e.target.value})}
              className="w-full px-4 py-2.5 rounded-lg text-sm focus:outline-none focus-ring"
              style={{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border-primary)', color: 'var(--color-text-primary)' }} 
              placeholder="https://..." 
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 flex items-center gap-2" style={{ color: 'var(--color-text-secondary)' }}>
            <FileText size={14} /> Description
          </label>
          <textarea 
            value={newProject.description} 
            onChange={e => setNewProject({...newProject, description: e.target.value})}
            className="w-full h-20 px-4 py-3 rounded-lg text-sm resize-none focus:outline-none focus-ring"
            style={{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border-primary)', color: 'var(--color-text-primary)' }}
            maxLength={300} placeholder="Briefly describe what this project is about..." 
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 flex items-center gap-2" style={{ color: 'var(--color-text-secondary)' }}>
            <ImageIcon size={14} /> Image URL (Optional)
          </label>
          <input 
            value={newProject.imageUrl} 
            onChange={e => setNewProject({...newProject, imageUrl: e.target.value})}
            className="w-full px-4 py-2.5 rounded-lg text-sm focus:outline-none focus-ring"
            style={{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border-primary)', color: 'var(--color-text-primary)' }} 
            placeholder="https://example.com/image.png" 
          />
        </div>

        <div className="pt-2">
          <button 
            onClick={handleAddProject} 
            disabled={!newProject.title || saving}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white gradient-brand hover:opacity-90 disabled:opacity-50 flex items-center gap-2 transition-all"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={16} />}
            Add Project
          </button>
        </div>
      </div>

      {/* Project List */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>Your Projects</h3>
        
        {projects.length === 0 ? (
          <div className="p-8 text-center rounded-xl border border-dashed" style={{ borderColor: 'var(--color-border-primary)' }}>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>No projects added yet. They will appear here.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {projects.map((proj, idx) => (
              <div key={idx} className="p-4 rounded-xl flex gap-4 items-start" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-primary)' }}>
                {proj.imageUrl ? (
                  <img src={proj.imageUrl} alt={proj.title} className="w-16 h-16 rounded-lg object-cover bg-gray-100" />
                ) : (
                  <div className="w-16 h-16 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-bg-tertiary)' }}>
                    <Globe size={20} style={{ color: 'var(--color-text-secondary)' }} />
                  </div>
                )}
                
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{proj.title}</h4>
                      {proj.url && (
                        <a href={proj.url} target="_blank" rel="noopener noreferrer" className="text-xs hover:underline flex items-center gap-1 mt-1" style={{ color: 'var(--color-brand)' }}>
                          {proj.url}
                        </a>
                      )}
                    </div>
                    <button 
                      onClick={() => handleDeleteProject(idx)}
                      disabled={saving}
                      className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  {proj.description && (
                    <p className="text-sm mt-2 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>{proj.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
