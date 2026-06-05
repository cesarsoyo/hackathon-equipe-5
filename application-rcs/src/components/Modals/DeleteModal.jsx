import React from 'react';
import { styles } from '../../styles/flowStyles';

export default function DeleteModal({ executeDeleteBlock, setDeleteModal }) {
  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <h3 style={styles.modalTitle}>Êtes-vous sûr de vouloir supprimer ce bloc et tous les éléments qui lui succèdent ?</h3>
        <div style={styles.modalActions}>
          <button style={{ ...styles.controlBtn, backgroundColor: '#ef4444', color: '#fff', border: 'none' }} onClick={executeDeleteBlock}>
            Oui, supprimer tout
          </button>
          <button style={styles.controlBtn} onClick={() => setDeleteModal({ show: false, nodeId: null })}>
            Non, maintenir
          </button>
        </div>
      </div>
    </div>
  );
}