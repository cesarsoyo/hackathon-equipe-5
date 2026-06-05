import React from 'react';
import { styles } from '../styles/flowStyles';

export default function Sidebar({
  fullScreen,
  setShowSendModal,
  userLogo,
  logoInputRef,
  handleLogoUpload,
  isEditingName,
  username,
  setUsername,
  setIsEditingName,
  handleCreateMotherBlock,
  undo,
  redo,
  history,
  setShowSupportModal,
  zoomIn,
  zoomOut,
  fitView,
  toggleFullScreen
}) {
  return (
    <>
      {!fullScreen && (
        <div style={styles.overlayTL}>
          <button className="tester-bot-btn" style={styles.sendBtn} onClick={() => setShowSendModal(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            Envoyer le SMS
          </button>
        </div>
      )}

      {!fullScreen && (
        <div style={styles.overlayTR}>
          <div style={{ ...styles.logoCircle, cursor: 'pointer' }} onClick={() => logoInputRef.current?.click()}>
            {userLogo ? (
              <img src={userLogo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
            )}
          </div>
          <input type="file" ref={logoInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {isEditingName ? (
              <input 
                type="text" 
                value={username} 
                onChange={(e) => { setUsername(e.target.value); localStorage.setItem('flow_username', e.target.value); }} 
                onBlur={() => setIsEditingName(false)} 
                onKeyDown={(e) => { if (e.key === 'Enter') setIsEditingName(false); }} 
                autoFocus 
                style={{ ...styles.usernameInput, backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '2px 4px' }} 
              />
            ) : (
              <span style={styles.usernameInput} onClick={() => setIsEditingName(true)}>{username}</span>
            )}
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>smsmode France</span>
          </div>
        </div>
      )}

      {!fullScreen && (
        <div style={styles.overlayBL}>
          <button style={styles.controlBtn} onClick={handleCreateMotherBlock}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
            Réinitialiser le Workflow
          </button>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button style={styles.circularControlBtn} onClick={undo} disabled={history.index <= 0}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
            </button>
            <button style={styles.circularControlBtn} onClick={redo} disabled={history.index >= history.list.length - 1}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/></svg>
            </button>
            <button style={styles.circularControlBtn} onClick={() => setShowSupportModal(true)} title="Contacter le support technique">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/><path d="M21 15v4a2 2 0 0 1-2 2h-4"/></svg>
            </button>
          </div>
        </div>
      )}

      <div style={styles.overlayBR}>
        {!fullScreen && (
          <>
            <button style={styles.controlBtn} onClick={() => zoomIn()}>Zoom +</button>
            <button style={styles.controlBtn} onClick={() => zoomOut()}>Zoom -</button>
            <button style={styles.controlBtn} onClick={() => fitView({ duration: 400 })}>Centrer</button>
          </>
        )}
        <button style={styles.circularControlBtn} onClick={toggleFullScreen} title={fullScreen ? "Quitter Plein Écran" : "Plein Écran"}>
          {fullScreen ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 14h6v6M20 10h-6V4M14 10l7-7M10 14l-7 7"/></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3M10 21v-6H4M14 3v6h6"/></svg>
          )}
        </button>
      </div>
    </>
  );
}