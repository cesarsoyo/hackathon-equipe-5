import React from 'react';

const formatDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const nodeCount = (wf) => {
  if (wf.reactFlowData) return wf.reactFlowData.nodes.length;
  if (wf.nodes) return Object.keys(wf.nodes).length;
  return 0;
};

const SavedWorkflowsPanel = ({ workflows, currentWorkflowId, onLoad, onClose }) => {
  return (
    <div style={{
      position: 'fixed',
      top: '45px',
      left: 0,
      bottom: 0,
      width: '300px',
      backgroundColor: '#0f172a',
      borderRight: '1px solid #1e293b',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '4px 0 24px rgba(0,0,0,0.5)',
      fontFamily: '"Inter", sans-serif',
    }}>
      <div style={{
        padding: '14px 16px',
        borderBottom: '1px solid #1e293b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
          <h3 style={{ margin: 0, color: '#f1f5f9', fontSize: '13px', fontWeight: '600' }}>
            Mes Workflows
          </h3>
          <span style={{
            backgroundColor: '#1e293b',
            color: '#94a3b8',
            fontSize: '11px',
            borderRadius: '10px',
            padding: '1px 7px',
          }}>
            {workflows.length}
          </span>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {workflows.length === 0 ? (
          <div style={{ padding: '40px 16px', textAlign: 'center' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.5" style={{ marginBottom: '12px' }}>
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
            <p style={{ color: '#475569', fontSize: '13px', margin: 0, lineHeight: '1.6' }}>
              Aucun workflow disponible.<br/>
              Utilisez <strong style={{ color: '#94a3b8' }}>Sauvegarder</strong> pour conserver votre travail.
            </p>
          </div>
        ) : (
          workflows.map(wf => {
            const isActive = currentWorkflowId === wf.id;
            const count = nodeCount(wf);
            return (
              <div
                key={wf.id}
                onClick={() => onLoad(wf)}
                style={{
                  padding: '11px 12px',
                  borderRadius: '8px',
                  marginBottom: '6px',
                  cursor: 'pointer',
                  backgroundColor: isActive ? '#0c2340' : '#1e293b',
                  border: `1px solid ${isActive ? '#3b82f6' : '#334155'}`,
                  transition: 'border-color 0.15s, background-color 0.15s',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.borderColor = '#475569'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.borderColor = '#334155'; }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      margin: '0 0 4px 0',
                      color: isActive ? '#93c5fd' : '#f1f5f9',
                      fontSize: '13px',
                      fontWeight: '600',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {wf.name}
                    </p>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '11px' }}>
                      {count} nœud{count !== 1 ? 's' : ''} · {formatDate(wf.createdAt)}
                    </p>
                  </div>
                  {isActive ? (
                    <span style={{ flexShrink: 0, color: '#3b82f6', display: 'flex', alignItems: 'center' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </span>
                  ) : (
                    <span style={{ flexShrink: 0, color: '#475569', display: 'flex', alignItems: 'center' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default SavedWorkflowsPanel;
