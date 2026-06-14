import React, { useEffect, useState } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { FolderPlus, Folder } from 'lucide-react';

export const ProjectAdmin = () => {
  const { projects, isLoading, fetchProjects, addProject } = useProjectStore();
  const [newProjectName, setNewProjectName] = useState('');
  const [newClientName, setNewClientName] = useState('');

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    
    await addProject(newProjectName, newClientName);
    setNewProjectName('');
    setNewClientName('');
  };

  return (
    <div className="glass-card" style={{ maxWidth: '600px', margin: '2rem auto', padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Folder size={32} style={{ color: 'var(--primary)' }} />
        <h2>Projekt-Verwaltung</h2>
      </div>

      <form onSubmit={handleCreate} style={{ display: 'flex', gap: '1rem', marginBottom: '3rem' }}>
        <div style={{ flex: 1 }}>
          <input 
            type="text" 
            placeholder="Projektname" 
            className="input-field" 
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            required
          />
        </div>
        <div style={{ flex: 1 }}>
          <input 
            type="text" 
            placeholder="Kunde (Optional)" 
            className="input-field" 
            value={newClientName}
            onChange={(e) => setNewClientName(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FolderPlus size={18} />
          Erstellen
        </button>
      </form>

      <div className="project-list">
        <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Aktive Projekte</h3>
        {isLoading ? (
          <p>Lade Projekte...</p>
        ) : projects.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Noch keine Projekte angelegt.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {projects.map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <strong>{p.name}</strong>
                {p.client_name && <span style={{ color: 'var(--text-secondary)', fontSize: '0.9em' }}>{p.client_name}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
