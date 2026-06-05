import React from 'react';
import { styles } from '../../styles/flowStyles';

export default function SendModal({
  sendingState,
  phoneNumber,
  setPhoneNumber,
  validatePhone,
  phoneError,
  handleSaveAndSend,
  setShowSendModal,
  setSendingState
}) {
  return (
    <div style={styles.modalOverlay}>
      <div style={{ ...styles.modal, overflow: 'hidden', position: 'relative' }}>
        {sendingState === 'idle' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', position: 'relative', height: '70px', width: '260px', margin: '0 auto 20px auto' }}>
              <div style={{ color: '#2563eb', display: 'inline-flex', alignItems: 'center' }}>
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </div>
            </div>
            <h3 style={styles.modalTitle}>Êtes-vous sûr de vouloir envoyer le SMS avec cette configuration RCS ?</h3>
            <div style={{ marginTop: '16px', textAlign: 'left' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>
                Numéro de téléphone destinataire
              </label>
              <input
                type="tel"
                value={phoneNumber}
                placeholder="0612345678"
                maxLength="11"
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  validatePhone(e.target.value);
                }}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: `1px solid ${phoneError ? '#ef4444' : '#cbd5e1'}`,
                  borderRadius: '10px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  color: '#0f172a'
                }}
              />
              {phoneError && (
                <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '6px', marginBottom: 0 }}>
                  ⚠ {phoneError}
                </p>
              )}
              {!phoneError && phoneNumber && (
                <p style={{ fontSize: '12px', color: '#16a34a', marginTop: '6px', marginBottom: 0 }}>
                  ✓ Format valide
                </p>
              )}
              <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', marginBottom: 0 }}>
                Format attendu : 33612345678
              </p>
            </div>
            <div style={styles.modalActions}>
              <button style={{ ...styles.controlBtn, backgroundColor: '#094776', color: '#fff', border: 'none' }} onClick={handleSaveAndSend}>
                Oui, envoyer
              </button>
              <button style={styles.controlBtn} onClick={() => setShowSendModal(false)}>
                Annuler
              </button>
            </div>
          </>
        )}

        {sendingState === 'sending' && (
          <>
            <div style={{ width: '40px', height: '40px', border: '3px solid #f3f3f3', borderTop: '3px solid #2563eb', borderRadius: '50%', animation: 'pulseDot 1s infinite linear', margin: '0 auto 20px auto' }} />
            <h3 style={styles.modalTitle}>Envoi en cours des données à smsmode France...</h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '10px' }}>Veuillez patienter pendant la synchronisation sécurisée.</p>
          </>
        )}

        {sendingState === 'success' && (
           <>
            <div 
        style={{ 
          width: '64px', 
          height: '64px', 
          borderRadius: '50%', 
          backgroundColor: '#dcfce7', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          margin: '0 auto 16px auto'
        }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
            <h3 style={styles.modalTitle}>Votre message a été envoyé avec succès !</h3>

<div className="fw-rocket" style={{ left: '20%', background: '#eab308', animationDuration: '1s' }} />
<div className="fw-burst" style={{ left: 'calc(20% - 4px)', bottom: '170px', background: '#eab308' }} />
<div className="fw-rocket" style={{ left: '50%', background: '#ef4444', animationDuration: '1.15s', animationDelay: '0.1s' }} />
<div className="fw-burst" style={{ left: 'calc(50% - 4px)', bottom: '185px', background: '#ef4444', animationDelay: '0.95s' }} />
<div className="fw-rocket" style={{ left: '78%', background: '#22c55e', animationDuration: '1.05s', animationDelay: '0.2s' }} />
<div className="fw-burst" style={{ left: 'calc(78% - 4px)', bottom: '175px', background: '#22c55e', animationDelay: '1.05s' }} />

      <button 
        style={{ 
          ...styles.controlBtn, 
          backgroundColor: '#0f172a', 
          color: '#fff', 
          marginTop: '20px', 
          border: 'none', 
          width: '50%', 
          boxSizing: 'border-box', 
          display: 'inline-flex', 
          justifyContent: 'center' 
        }} 
        onClick={() => { setSendingState('idle'); setShowSendModal(false); }}
      >
        Fermer
      </button>
           </>
        )}
      </div>
    </div>
  );
}