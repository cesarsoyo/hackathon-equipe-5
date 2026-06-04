import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  useReactFlow,
  ReactFlowProvider,
  getBezierPath
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// --- ESTILOS COMPLETOS PRESERVADOS Y OPTIMIZADOS ---
const styles = {
  container: { 
    width: '100vw', 
    height: '100vh', 
    fontFamily: '"Inter", sans-serif', 
    backgroundColor: '#f1f5f9', 
    overflow: 'hidden',
    position: 'relative'
  },
  customWatermarkBackground: {
    position: 'absolute',
    top: '-50%',
    left: '-50%',
    width: '200%',
    height: '200%',
    backgroundImage: 'url("/logo-smsmode.svg")',
    backgroundSize: '160px 160px',
    backgroundRepeat: 'repeat',
    transform: 'rotate(-25deg)',
    opacity: 0.18,
    filter: 'brightness(0) invert(1)',
    pointerEvents: 'none',
    zIndex: 0
  },
  nodeWrapper: {
    width: '350px',
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    border: '1px solid #cbd5e1',
    padding: '18px',
    boxSizing: 'border-box',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    position: 'relative',
  },
  toolbar: {
    position: 'absolute',
    top: '-44px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    color: '#1e293b',
    padding: '6px 12px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    zIndex: 100,
    fontSize: '12px',
    whiteSpace: 'nowrap',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  },
  styleMenu: {
    position: 'absolute',
    bottom: '45px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    zIndex: 120,
  },
  colorBox: { width: '20px', height: '20px', borderRadius: '4px', cursor: 'pointer', border: '1px solid rgba(0,0,0,0.1)' },
  linkPopup: {
    position: 'absolute',
    top: '-95px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#ffffff',
    padding: '10px',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    zIndex: 200,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
    width: '170px'
  },
  popupInput: { padding: '6px 8px', fontSize: '11px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' },
  toolbarBtn: { background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '12px', fontWeight: '500', display: 'inline-flex', alignItems: 'center', gap: '4px' },
  nodeLabel: { fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' },
  editableArea: { 
    width: '100%', 
    minHeight: '65px', 
    maxHeight: '150px', 
    padding: '10px', 
    marginBottom: '12px', 
    boxSizing: 'border-box', 
    border: '1px solid #cbd5e1', 
    borderRadius: '10px', 
    fontSize: '13px', 
    outline: 'none', 
    lineHeight: '1.5', 
    backgroundColor: '#fff', 
    overflowY: 'auto', 
    whiteSpace: 'pre-wrap', 
    wordBreak: 'break-word',
    color: '#000000'
  },
  optionRow: { display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' },
  dragHandle: { display: 'flex', flexDirection: 'column', gap: '2px', userSelect: 'none' },
  sortBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  optionInput: { 
    flex: 1, 
    padding: '6px 12px', 
    border: '1px solid #cbd5e1', 
    borderRadius: '10px', 
    fontSize: '13px', 
    outline: 'none', 
    backgroundColor: '#fff', 
    maxWidth: '180px', 
    boxSizing: 'border-box',
    overflowX: 'auto',
    color: '#000000'
  },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' },
  addOptionBtn: { width: '100%', padding: '8px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '9999px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: '#475569', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' },
  addChildBtn: {
    position: 'absolute',
    right: '-21px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    backgroundColor: '#2563eb',
    color: '#fff',
    border: '3px solid #fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    zIndex: 10,
    fontSize: '18px',
    fontWeight: 'bold'
  },
  overlayBL: { position: 'fixed', bottom: '24px', left: '24px', display: 'flex', flexDirection: 'column', gap: '12px', zIndex: 100, backgroundColor: '#fff', padding: '14px', borderRadius: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', alignItems: 'center' },
  overlayBR: { position: 'fixed', bottom: '24px', right: '24px', display: 'flex', gap: '12px', zIndex: 100, backgroundColor: '#fff', padding: '14px', borderRadius: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', alignItems: 'center' },
  overlayTR: { 
    position: 'fixed', 
    top: '24px', 
    right: '24px', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '14px', 
    zIndex: 100, 
    backgroundColor: '#fff', 
    padding: '10px 20px', 
    borderRadius: '9999px', 
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)', 
    border: '1px solid #e2e8f0' 
  },
  overlayTL: {
    position: 'fixed',
    top: '24px',
    left: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    zIndex: 100,
    backgroundColor: 'transparent',
    padding: '0px',
    borderRadius: '0px',
    boxShadow: 'none',
    border: 'none'
  },
  sendBtn: {
    padding: '12px 24px',
    backgroundColor: '#094776',
    border: 'none',
    borderRadius: '9999px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    color: '#ffffff',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px'
  },
  logoCircle: {
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    backgroundColor: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    border: '2px solid #cbd5e1'
  },
  usernameInput: {
    border: 'none',
    outline: 'none',
    fontSize: '13px',
    fontWeight: '600',
    color: '#1e293b',
    backgroundColor: 'transparent',
    width: '130px',
    padding: '0px',
    borderBottom: '1px dashed #cbd5e1'
  },
  controlBtn: { padding: '8px 16px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '9999px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', color: '#1e293b', display: 'inline-flex', alignItems: 'center', gap: '6px' },
  circularControlBtn: { width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#fff', border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e293b', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', padding: 0 },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
  modal: { backgroundColor: '#fff', padding: '28px', borderRadius: '24px', maxWidth: '440px', width: '100%', boxSizing: 'border-box', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' },
  modalTitle: { marginTop: 0, fontSize: '16px', color: '#0f172a', fontWeight: '600', lineHeight: '1.5' },
  modalActions: { display: 'flex', justifyContent: 'center', gap: '14px', marginTop: '24px' },
  dropdownMenu: { position: 'absolute', top: '100%', right: '0', backgroundColor: '#fff', color: '#1e293b', border: '1px solid #e2e8f0', borderRadius: '12px', listStyle: 'none', padding: '6px 0', margin: '4px 0 0 0', minWidth: '150px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 120 },
  dropdownItem: { padding: '8px 14px', cursor: 'pointer', fontSize: '13px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }
};

const getNonOverlappingPosition = (targetX, targetY, existingNodes) => {
  let currentY = targetY;
  const bufferY = 340; 
  const bufferX = 520; 
  let collisionDetected = true;
  let safetyCounter = 0;
  while (collisionDetected && safetyCounter < 30) {
    safetyCounter++;
    collisionDetected = false;
    for (const node of existingNodes) {
      const dx = Math.abs(node.position.x - targetX);
      const dy = Math.abs(node.position.y - currentY);
      if (dx < bufferX && dy < bufferY) {
        currentY = node.position.y + bufferY;
        collisionDetected = true;
        break;
      }
    }
  }
  return { x: targetX, y: currentY };
};

// --- COMPONENTE PREGUNTA (CUSTOM NODE) ---
const QuestionNode = ({ id, data }) => {
  const [hovered, setHovered] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [showLinkPopup, setShowLinkPopup] = useState(false);
  
  const fileInputRef = useRef(null);
  const timeoutRef = useRef(null);
  const linkUrlRef = useRef(null);
  const savedSelectionRef = useRef(null);
  const questionEditableRef = useRef(null);

  useEffect(() => {
    if (questionEditableRef.current && questionEditableRef.current.innerHTML !== data.question) {
      questionEditableRef.current.innerHTML = data.question || '';
    }
  }, [data.question]);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setHovered(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setHovered(false);
      setShowDropdown(false);
      setShowStyleMenu(false);
      setShowLinkPopup(false);
    }, 450);
  };

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel.rangeCount > 0) {
      savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    if (questionEditableRef.current) {
      questionEditableRef.current.focus();
    }
    if (savedSelectionRef.current) {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(savedSelectionRef.current);
    }
  };

  const deleteOption = (idx) => {
    const updatedOptions = data.options.filter((_, i) => i !== idx);
    let updatedLoops = [...(data.loopOptions || [false, false, false, false])];
    
    const wasSelected = updatedLoops[idx];
    
    // Filtramos la opción del array de bucles y reponemos un false al final
    updatedLoops = updatedLoops.filter((_, i) => i !== idx);
    updatedLoops.push(false);
    
    if (wasSelected) {
      // Si la opción eliminada era la seleccionada, limpiamos todo y quitamos el enlace
      updatedLoops = [false, false, false, false];
      if (data.onToggleLoopEdge) {
        data.onToggleLoopEdge(id, -1);
      }
    } else {
      // Si se elimina una opción ANTES de la que está seleccionada, ajustamos la conexión
      const oldActive = (data.loopOptions || []).findIndex(v => v);
      if (oldActive > idx && data.onToggleLoopEdge) {
        data.onToggleLoopEdge(id, oldActive - 1);
      }
    }
    
    data.onNodeChange(id, { ...data, options: updatedOptions, loopOptions: updatedLoops }, true);
  };

  const addOption = () => {
    if (data.options.length < 4) {
      const updatedOptions = [...data.options, ''];
      data.onNodeChange(id, { ...data, options: updatedOptions }, true);
    }
  };

  const moveOption = (index, direction) => {
    const updatedOptions = [...data.options];
    const targetIndex = index + direction;
    if (targetIndex >= 0 && targetIndex < updatedOptions.length) {
      const temp = updatedOptions[index];
      updatedOptions[index] = updatedOptions[targetIndex];
      updatedOptions[targetIndex] = temp;
      data.onNodeChange(id, { ...data, options: updatedOptions }, true);
    }
  };

  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files);
    const currentMedia = data.media || [];
    if (currentMedia.length + files.length > 8) {
      alert("Limite atteinte: Vous pouvez ajouter jusqu'à 8 images maximum par bloc.");
      return;
    }
    const newUrls = files.map(file => URL.createObjectURL(file));
    data.onNodeChange(id, { ...data, media: [...currentMedia, ...newUrls] }, true);
  };

  const executeFormat = (command, value = null) => {
    restoreSelection();
    document.execCommand('styleWithCSS', false, true);
    document.execCommand(command, false, value);
    if (questionEditableRef.current) {
      const nextHTML = questionEditableRef.current.innerHTML;
      data.onNodeChange(id, { ...data, question: nextHTML }, true);
    }
  };

  const insertCustomHyperlink = () => {
    restoreSelection();
    const url = linkUrlRef.current?.value || 'https://';
    document.execCommand('createLink', false, url);
    if (questionEditableRef.current) {
      data.onNodeChange(id, { ...data, question: questionEditableRef.current.innerHTML }, true);
    }
    setShowLinkPopup(false);
  };

  const handleInputKeyDown = (e) => {
    e.stopPropagation(); 
  };

  const handlePastePrevent = (e) => {
    e.stopPropagation();
    const text = e.clipboardData.getData('text/plain').trim();
    const selection = window.getSelection();
    const isUrl = /^(https?:\/\/[^\s]+|www\.[^\s]+)/i.test(text);
    
    if (isUrl && selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      e.preventDefault();
      const finalUrl = /^www\./i.test(text) ? `https://${text}` : text;
      document.execCommand('createLink', false, finalUrl);
      if (questionEditableRef.current) {
        data.onNodeChange(id, { ...data, question: questionEditableRef.current.innerHTML }, true);
      }
    } else {
      e.preventDefault();
      document.execCommand('insertText', false, text);
      if (questionEditableRef.current) {
        data.onNodeChange(id, { ...data, question: questionEditableRef.current.innerHTML }, true);
      }
    }
  };

  return (
    <div 
      style={styles.nodeWrapper}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Handle type="target" position={Position.Left} style={{ background: '#cbd5e1', width: '10px', height: '10px' }} />
      <Handle type="source" position={Position.Right} style={{ background: '#cbd5e1', width: '10px', height: '10px' }} />

      <button 
        style={styles.addChildBtn} 
        onMouseDown={(e) => e.preventDefault()}
        onClick={(e) => { e.stopPropagation(); data.onAddChild(id); }}
      >
        +
      </button>

      {hovered && (
        <div style={styles.toolbar}>
          <button style={styles.toolbarBtn} onMouseDown={(e) => e.preventDefault()} onClick={() => fileInputRef.current?.click()}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            Média
          </button>
          <input type="file" ref={fileInputRef} accept="image/png, image/jpeg, image/jpg, image/gif, image/webp" multiple style={{ display: 'none' }} onChange={handleMediaChange} />
          
          <button 
            style={styles.toolbarBtn} 
            onMouseDown={(e) => { e.preventDefault(); saveSelection(); }} 
            onClick={() => setShowLinkPopup(!showLinkPopup)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            Hyperlien
          </button>
          
          <button 
            style={styles.toolbarBtn} 
            onMouseDown={(e) => { e.preventDefault(); }} 
            onClick={() => setShowStyleMenu(!showStyleMenu)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            Style
          </button>
          
          {showLinkPopup && (
            <div style={styles.linkPopup} onKeyDown={handleInputKeyDown}>
              <input ref={linkUrlRef} type="text" placeholder="https://..." style={styles.popupInput} defaultValue="https://" />
              <button 
                style={{ ...styles.controlBtn, padding: '6px 8px', fontSize: '11px', backgroundColor: '#2563eb', color: '#fff', justifyContent:'center' }}
                onClick={insertCustomHyperlink}
              >
                Ajouter link
              </button>
            </div>
          )}

          {showStyleMenu && (
            <div style={styles.styleMenu}>
              <select 
                onMouseDown={(e) => e.stopPropagation()} 
                onChange={(e) => executeFormat('fontName', e.target.value)} 
                style={{ fontSize: '12px', padding: '4px', borderRadius: '6px' }}
              >
                <option value="Arial">Arial</option>
                <option value="Georgia">Georgia</option>
                <option value="Courier New">Courier New</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Verdana">Verdana</option>
              </select>
              
              <div style={{ display: 'flex', gap: '6px' }}>
                {['#0f172a', '#2563eb', '#16a34a', '#dc2626', '#ea580c'].map(color => (
                  <div 
                    key={color} 
                    style={{ ...styles.colorBox, backgroundColor: color }} 
                    onMouseDown={(e) => { e.preventDefault(); executeFormat('foreColor', color); }}
                  />
                ))}
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                <button style={{ ...styles.toolbarBtn, color: '#0f172a', fontWeight: 'bold' }} onMouseDown={(e) => { e.preventDefault(); executeFormat('bold'); }}>B</button>
                <button style={{ ...styles.toolbarBtn, color: '#0f172a', fontStyle: 'italic' }} onMouseDown={(e) => { e.preventDefault(); executeFormat('italic'); }}>I</button>
                <button style={{ ...styles.toolbarBtn, color: '#0f172a', textDecoration: 'underline' }} onMouseDown={(e) => { e.preventDefault(); executeFormat('underline'); }}>U</button>
              </div>
            </div>
          )}

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <button style={styles.toolbarBtn} onClick={() => setShowDropdown(!showDropdown)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
            </button>
            {showDropdown && (
              <ul style={styles.dropdownMenu}>
                <li style={styles.dropdownItem} onClick={(e) => { e.stopPropagation(); data.onAddChild(id); setShowDropdown(false); }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Ajouter un bloc enfant
                </li>
                <li style={{ ...styles.dropdownItem, color: '#ef4444' }} onClick={(e) => { e.stopPropagation(); data.onTriggerDelete(id); setShowDropdown(false); }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  Supprimer bloc
                </li>
              </ul>
            )}
          </div>
        </div>
      )}

      <div>
        <label style={styles.nodeLabel}>Question à poser</label>
        <div 
          ref={questionEditableRef}
          contentEditable
          className="nodrag nowheel"
          style={styles.editableArea}
          placeholder="Entrez votre question ici..."
          onKeyDown={handleInputKeyDown}
          onSelect={saveSelection}
          onMouseUp={saveSelection}
          onKeyUp={saveSelection}
          onPaste={handlePastePrevent}
          onBlur={(e) => data.onNodeChange(id, { ...data, question: e.target.innerHTML }, true)}
        />

        {data.media && data.media.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '12px' }}>
            {data.media.map((url, index) => (
              <div key={index} style={{ position: 'relative', width: '100%', height: '55px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                <img src={url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button 
                  style={{ position: 'absolute', top: '2px', right: '2px', backgroundColor: 'rgba(15,23,42,0.75)', color: '#fff', border: 'none', borderRadius: '50%', width: '16px', height: '16px', fontSize: '9px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={() => {
                    const filteredMedia = data.media.filter((_, i) => i !== index);
                    data.onNodeChange(id, { ...data, media: filteredMedia }, true);
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {id !== 'node_root_primary' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <span style={{ width: '14px' }} />
            <label style={{ ...styles.nodeLabel, marginBottom: 0, flex: 1, maxWidth: '180px' }}>Options</label>
            <label style={{ ...styles.nodeLabel, marginBottom: 0, width: '24px', textAlign: 'center' }}>Retour</label>
            <span style={{ width: '22px' }} />
          </div>
        ) : (
          <label style={styles.nodeLabel}>Options</label>
        )}

        {data.options && data.options.map((opt, idx) => (
          <div key={idx} style={styles.optionRow}>
            <span style={styles.dragHandle}>
              <button style={styles.sortBtn} onClick={() => moveOption(idx, -1)}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="18 15 12 9 6 15"/></svg>
              </button>
              <button style={styles.sortBtn} onClick={() => moveOption(idx, 1)}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
            </span>
            <input 
              type="text" 
              value={opt} 
              placeholder="Entrez l'option..."
              style={styles.optionInput}
              onKeyDown={handleInputKeyDown}
              onChange={(e) => {
                const updatedOptions = [...data.options];
                updatedOptions[idx] = e.target.value;
                data.onNodeChange(id, { ...data, options: updatedOptions }, true);
                if (data.onOptionTextChange) {
                  data.onOptionTextChange(id, idx, e.target.value);
                }
              }}
            />
            
            {/* Solo muestra el radio box si NO es el bloque principal */}
            {id !== 'node_root_primary' ? (
              <input 
                type="radio"
                checked={!!data.loopOptions?.[idx]}
                style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#6bb884' }}
                className="nodrag nowheel"
                onClick={(e) => {
                  if (data.loopOptions?.[idx]) {
                    e.preventDefault();
                    const updatedLoops = [false, false, false, false];
                    data.onNodeChange(id, { ...data, loopOptions: updatedLoops }, false);
                    if (data.onToggleLoopEdge) {
                      data.onToggleLoopEdge(id, -1);
                    }
                  }
                }}
                onChange={(e) => {
                  const alertShown = localStorage.getItem('retour_alert_shown');
                  if (!alertShown) {
                    alert("Sélectionner cette case sert de bouton de retour, pour revenir à la question précédente.");
                    localStorage.setItem('retour_alert_shown', 'true');
                  }
                  const updatedLoops = [false, false, false, false];
                  updatedLoops[idx] = true;
                  data.onNodeChange(id, { ...data, loopOptions: updatedLoops }, false);
                  if (data.onToggleLoopEdge) {
                    data.onToggleLoopEdge(id, idx);
                  }
                }}
                title="Ligne supplémentaire (Boucle)"
              />
            ) : (
              <div style={{ width: '16px', height: '16px' }} />
            )}

            <button style={styles.iconBtn} onClick={() => deleteOption(idx)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="19"/><line x1="6" y1="6" x2="18" y2="19"/></svg>
            </button>
          </div>
        ))}

        {data.options && data.options.length < 4 && (
          <button style={styles.addOptionBtn} onClick={addOption}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Ajouter Option
          </button>
        )}
      </div>
    </div>
  );
};

// --- COMPONENTE CONEXIÓN DRAGGABLE (EDITABLE EDGE) ---
const EditableEdge = ({ id, sourceX, sourceY, targetX, targetY, style = {}, markerEnd, data, animated }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [textValue, setTextValue] = useState(data?.label || 'Texte');

  useEffect(() => {
    if (data?.label) setTextValue(data.label);
  }, [data?.label]);

  const handleBlur = () => {
    setIsEditing(false);
    if (data?.onEdgeLabelChange) {
      data.onEdgeLabelChange(id, textValue);
    }
  };

  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;
  const ctrlX = midX + (data?.controlOffsetX || 0);
  const ctrlY = midY + (data?.controlOffsetY || 0);
  
  const edgePath = `M ${sourceX} ${sourceY} Q ${ctrlX} ${ctrlY} ${targetX} ${targetY}`;
  
  const t = data?.labelT !== undefined ? data.labelT : 0.5;
  const labelX = Math.pow(1 - t, 2) * sourceX + 2 * (1 - t) * t * ctrlX + Math.pow(t, 2) * targetX;
  const labelY = Math.pow(1 - t, 2) * sourceY + 2 * (1 - t) * t * ctrlY + Math.pow(t, 2) * targetY;

  const handlePathMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const initialOffsetX = data?.controlOffsetX || 0;
    const initialOffsetY = data?.controlOffsetY || 0;

    const handleMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      if (data?.onEdgeDataChange) {
        data.onEdgeDataChange(id, {
          ...data,
          controlOffsetX: initialOffsetX + dx,
          controlOffsetY: initialOffsetY + dy
        });
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleLabelMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const initialT = data?.labelT !== undefined ? data.labelT : 0.5;
    let clickMoved = false;

    const handleMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        clickMoved = true;
      }
      
      const vX = targetX - sourceX;
      const vY = targetY - sourceY;
      const len = Math.hypot(vX, vY) || 1;
      const dot = (dx * vX + dy * vY) / len;
      const dt = dot / len;
      
      let newT = initialT + dt;
      newT = Math.max(0.1, Math.min(0.9, newT));
      
      if (data?.onEdgeDataChange) {
        data.onEdgeDataChange(id, {
          ...data,
          labelT: newT
        });
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      if (!clickMoved) {
        setIsEditing(true);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <>
      <path 
        d={edgePath} 
        fill="none" 
        stroke="transparent" 
        strokeWidth={15} 
        style={{ cursor: 'grab' }} 
        onMouseDown={handlePathMouseDown} 
      />
      
      <path 
        id={id} 
        style={style} 
        className={`react-flow__edge-path ${animated ? 'animated' : ''}`}
        d={edgePath} 
        markerEnd={markerEnd} 
      />
      
      <foreignObject
        x={labelX - 120}
        y={labelY - 25}
        width={240}
        height={50}
        className="nodrag nowheel"
        style={{ overflow: 'visible', pointerEvents: 'none' }}
      >
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'all' }}>
          {isEditing ? (
            <input 
              type="text" 
              value={textValue} 
              placeholder="Texte..."
              onChange={(e) => setTextValue(e.target.value)} 
              onBlur={handleBlur}
              onKeyDown={(e) => { if (e.key === 'Enter') handleBlur(); e.stopPropagation(); }}
              autoFocus
              style={{ width: '100%', padding: '4px 6px', fontSize: '12px', border: '2px solid #2563eb', borderRadius: '6px', textAlign: 'center', outline: 'none', backgroundColor: '#ffffff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
            />
          ) : (
            <div 
              onMouseDown={handleLabelMouseDown}
              style={{ backgroundColor: '#ffffff', padding: '5px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: '500', color: '#475569', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', maxWidth: '100%', userSelect: 'none', cursor: 'ew-resize' }}
            >
              {textValue}
            </div>
          )}
        </div>
      </foreignObject>
    </>
  );
};

const nodeTypes = { questionNode: QuestionNode };
const edgeTypes = { editableEdge: EditableEdge };

// --- LIENZO DE FLUJO PRINCIPAL (MAIN FLOW) ---
const MainFlow = () => {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  
  const [loading, setLoading] = useState(true);
  const [vignette, setVignette] = useState(true);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [history, setHistory] = useState({ list: [], index: -1 });
  const [fullScreen, setFullScreen] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ show: false, nodeId: null });
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendingState, setSendingState] = useState('idle'); 
  const [fsVignetteKey, setFsVignetteKey] = useState(0);
  
  const [username, setUsername] = useState(() => localStorage.getItem('flow_username') || 'Jean Dupont');
  const [isEditingName, setIsEditingName] = useState(false);
  const [userLogo, setUserLogo] = useState(() => localStorage.getItem('flow_userlogo') || null);

  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const logoInputRef = useRef(null);
  const rebindFunctionsRef = useRef({});

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
      setVignette(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { edgesRef.current = edges; }, [edges]);

  useEffect(() => {
    if (nodes.length > 0) {
      const dataToSave = { nodes, edges };
      localStorage.setItem('flow_data', JSON.stringify(dataToSave));
    }
  }, [nodes, edges]);

  const takeSnapshot = useCallback((currentNodes, currentEdges) => {
    setHistory(prev => {
      const snapshot = {
        nodes: JSON.parse(JSON.stringify(currentNodes)),
        edges: JSON.parse(JSON.stringify(currentEdges))
      };
      if (prev.index >= 0 && prev.list[prev.index]) {
        const lastSaved = prev.list[prev.index];
        if (JSON.stringify(lastSaved.nodes) === JSON.stringify(snapshot.nodes) &&
            JSON.stringify(lastSaved.edges) === JSON.stringify(snapshot.edges)) {
          return prev;
        }
      }
      const nextList = prev.list.slice(0, prev.index + 1);
      const updatedList = [...nextList, snapshot];
      if (updatedList.length > 5) { updatedList.shift(); }
      return { list: updatedList, index: updatedList.length - 1 };
    });
  }, []);

  const handleEdgeUpdateGeneric = useCallback((edgeId, updatedData) => {
    setEdges(prev => prev.map(e => e.id === edgeId ? { ...e, data: updatedData } : e));
  }, []);

  const handleEdgeLabelChange = useCallback((edgeId, newLabel) => {
    setEdges(prev => {
      const nextEdges = prev.map(e => e.id === edgeId ? { ...e, data: { ...e.data, label: newLabel, isManuallyEdited: true } } : e);
      takeSnapshot(nodesRef.current, nextEdges);
      return nextEdges;
    });
  }, [takeSnapshot]);

  const rebindEdgeCallbacks = useCallback((edge) => {
    return {
      ...edge,
      data: {
        ...edge.data,
        onEdgeLabelChange: handleEdgeLabelChange,
        onEdgeDataChange: handleEdgeUpdateGeneric
      }
    };
  }, [handleEdgeLabelChange, handleEdgeUpdateGeneric]);

  rebindFunctionsRef.current.rebindEdgeCallbacks = rebindEdgeCallbacks;

  const undo = useCallback(() => {
    setHistory(prev => {
      if (prev.index > 0) {
        const nextIndex = prev.index - 1;
        const prevStep = prev.list[nextIndex];
        setNodes(prevStep.nodes.map(n => rebindFunctionsRef.current.rebindNodeCallbacks(n)));
        setEdges(prevStep.edges.map(e => rebindFunctionsRef.current.rebindEdgeCallbacks(e)));
        return { ...prev, index: nextIndex };
      }
      return prev;
    });
  }, []);

  const redo = useCallback(() => {
    setHistory(prev => {
      if (prev.index < prev.list.length - 1) {
        const nextIndex = prev.index + 1;
        const nextStep = prev.list[nextIndex];
        setNodes(nextStep.nodes.map(n => rebindFunctionsRef.current.rebindNodeCallbacks(n)));
        setEdges(nextStep.edges.map(e => rebindFunctionsRef.current.rebindEdgeCallbacks(e)));
        return { ...prev, index: nextIndex };
      }
      return prev;
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const handleOptionTextChange = useCallback((nodeId, optionIndex, newText) => {
    setEdges(prev => prev.map(edge => {
      if (edge.source === nodeId && edge.data?.optionIndex === optionIndex && !edge.data?.isManuallyEdited) {
        return {
          ...edge,
          data: { ...edge.data, label: newText }
        };
      }
      return edge;
    }));
  }, []);

  const handleToggleLoopEdge = useCallback((nodeId, optionIndex) => {
    let nextEdges = edgesRef.current.filter(e => !(e.source === nodeId && e.data?.isLoop));

    if (optionIndex !== -1) {
      const parentEdge = nextEdges.find(e => e.target === nodeId);
      if (parentEdge) {
        const parentId = parentEdge.source;
        const currentNode = nodesRef.current.find(n => n.id === nodeId);
        const optionText = currentNode?.data?.options?.[optionIndex] || `Boucle ${optionIndex + 1}`;

        const newLoopEdge = {
          id: `loop_${nodeId}_${optionIndex}`,
          source: nodeId,
          target: parentId,
          type: 'editableEdge',
          animated: true,
          style: { strokeDasharray: '6,6', stroke: '#6bb884', strokeWidth: 2 },
          data: {
            label: optionText,
            optionIndex,
            isLoop: true,
            isManuallyEdited: false,
            onEdgeLabelChange: handleEdgeLabelChange,
            onEdgeDataChange: handleEdgeUpdateGeneric
          }
        };
        nextEdges.push(newLoopEdge);
      }
    }
    
    setEdges(nextEdges);
    takeSnapshot(nodesRef.current, nextEdges);
  }, [handleEdgeLabelChange, handleEdgeUpdateGeneric, takeSnapshot]);

  const rebindNodeCallbacks = useCallback((node) => {
    node.data.onNodeChange = handleNodeDataChange;
    node.data.onAddChild = handleAddChildBlock;
    node.data.onTriggerDelete = triggerDeleteModal;
    node.data.onOptionTextChange = handleOptionTextChange;
    node.data.onToggleLoopEdge = handleToggleLoopEdge;
    return node;
  }, []);

  rebindFunctionsRef.current.rebindNodeCallbacks = rebindNodeCallbacks;

  const handleNodeDataChange = useCallback((id, updatedData, triggerHistory = false) => {
    setNodes(prev => {
      const nextNodes = prev.map(n => n.id === id ? { ...n, data: updatedData } : n);
      if (triggerHistory) {
        setTimeout(() => takeSnapshot(nextNodes, edgesRef.current), 10);
      }
      return nextNodes;
    });
  }, [takeSnapshot]);

  const handleAddChildBlock = useCallback((sourceId) => {
    const parentNode = nodesRef.current.find(n => n.id === sourceId);
    const directChildrenCount = edgesRef.current.filter(e => e.source === sourceId && !e.data?.isLoop).length;
    
    if (directChildrenCount >= 4) {
      alert("Limite de 4 blocs enfants atteinte.");
      return;
    }
    if (!parentNode) return;

    const nextId = `node_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const targetX = parentNode.position.x + 520;
    const targetY = parentNode.position.y + (directChildrenCount * 140);
    const nonCollidingPos = getNonOverlappingPosition(targetX, targetY, nodesRef.current);

    const defaultOptionText = parentNode.data.options?.[directChildrenCount] || `Option ${directChildrenCount + 1}`;

    const newChildNode = {
      id: nextId,
      type: 'questionNode',
      position: nonCollidingPos,
      data: {
        question: '',
        options: ['Option 1', 'Option 2', 'Option 3', 'Autre'],
        media: [],
        loopOptions: [false, false, false, false],
        onNodeChange: handleNodeDataChange,
        onAddChild: handleAddChildBlock,
        onTriggerDelete: triggerDeleteModal,
        onOptionTextChange: handleOptionTextChange,
        onToggleLoopEdge: handleToggleLoopEdge
      }
    };

    const newEdge = {
      id: `edge_${sourceId}_${nextId}`,
      source: sourceId,
      target: nextId,
      type: 'editableEdge',
      data: { 
        label: defaultOptionText, 
        optionIndex: directChildrenCount,
        isManuallyEdited: false,
        onEdgeLabelChange: handleEdgeLabelChange,
        onEdgeDataChange: handleEdgeUpdateGeneric
      }
    };

    const nextNodes = [...nodesRef.current, newChildNode];
    const nextEdges = [...edgesRef.current, newEdge];

    setNodes(nextNodes);
    setEdges(nextEdges);
    setTimeout(() => takeSnapshot(nextNodes, nextEdges), 10);
  }, [handleNodeDataChange, handleEdgeLabelChange, handleEdgeUpdateGeneric, handleOptionTextChange, handleToggleLoopEdge, takeSnapshot]);

  const handleCreateMotherBlock = () => {
    const rootId = 'node_root_primary';
    const newMotherNode = {
      id: rootId,
      type: 'questionNode',
      position: { x: 150, y: 500 },
      data: {
        question: 'Bienvenue ! Modifiez cette question racine...',
        options: ['Option A', 'Option B', 'Option C', 'Autre'],
        media: [],
        loopOptions: [false, false, false, false],
        onNodeChange: handleNodeDataChange,
        onAddChild: handleAddChildBlock,
        onTriggerDelete: triggerDeleteModal,
        onOptionTextChange: handleOptionTextChange,
        onToggleLoopEdge: handleToggleLoopEdge
      }
    };
    setNodes([newMotherNode]);
    setEdges([]);
    takeSnapshot([newMotherNode], []);
  };

  const onNodeDragStop = useCallback((event, draggedNode) => {
    setNodes(currentNodes => {
      const nextNodes = currentNodes.map(node => node.id === draggedNode.id ? draggedNode : node );
      setTimeout(() => takeSnapshot(nextNodes, edgesRef.current), 10);
      return nextNodes;
    });
  }, [takeSnapshot]);

  const executeDeleteBlock = () => {
    const targetId = deleteModal.nodeId;
    if (!targetId) return;

    let nodesToRemove = new Set([targetId]);
    let processQueue = [targetId];

    while (processQueue.length > 0) {
      const currentId = processQueue.shift();
      edgesRef.current.forEach(edge => {
        // Excluimos explícitamente las conexiones tipo isLoop para no afectar al bloque madre
        if (edge.source === currentId && !nodesToRemove.has(edge.target) && !edge.data?.isLoop) {
          nodesToRemove.add(edge.target);
          processQueue.push(edge.target);
        }
      });
    }

    const nextNodes = nodesRef.current.filter(n => !nodesToRemove.has(n.id));
    const nextEdges = edgesRef.current.filter(e => !nodesToRemove.has(e.source) && !nodesToRemove.has(e.target));

    setNodes(nextNodes);
    setEdges(nextEdges);
    takeSnapshot(nextNodes, nextEdges);
    setDeleteModal({ show: false, nodeId: null });
  };

  const triggerDeleteModal = (nodeId) => {
    setDeleteModal({ show: true, nodeId });
  };

  const handleLogoUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserLogo(reader.result);
        localStorage.setItem('flow_userlogo', reader.result);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const toggleFullScreen = () => {
    setFsVignetteKey(prev => prev + 1);
    if (!fullScreen) {
      document.documentElement.requestFullscreen?.();
      setFullScreen(true);
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen?.();
      }
      setFullScreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setFullScreen(!!document.fullscreenElement);
      setFsVignetteKey(prev => prev + 1);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const handleSaveAndSend = () => {
    const savedBlocksStructure = nodes.map(node => ({
      id: node.id,
      question: node.data.question,
      options: node.data.options
    }));
    console.log("Données globales sauvegardées lors du clic d'envoi :", savedBlocksStructure);
    
    setSendingState('sending');
    setTimeout(() => {
      setSendingState('success');
    }, 6000);
  };

  useEffect(() => {
    const savedData = localStorage.getItem('flow_data');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.nodes && parsed.edges) {
          const loadedNodes = parsed.nodes.map(n => {
            n.data.onNodeChange = handleNodeDataChange;
            n.data.onAddChild = handleAddChildBlock;
            n.data.onTriggerDelete = triggerDeleteModal;
            n.data.onOptionTextChange = handleOptionTextChange;
            n.data.onToggleLoopEdge = handleToggleLoopEdge;
            return n;
          });
          const loadedEdges = parsed.edges.map(e => {
            e.data.onEdgeLabelChange = handleEdgeLabelChange;
            e.data.onEdgeDataChange = handleEdgeUpdateGeneric;
            return e;
          });
          setNodes(loadedNodes);
          setEdges(loadedEdges);
          setHistory({ list: [{ nodes: JSON.parse(JSON.stringify(loadedNodes)), edges: JSON.parse(JSON.stringify(loadedEdges)) }], index: 0 });
          return;
        }
      } catch (e) {
        console.error("Error loading saved workflow:", e);
      }
    }

    const rootId = 'node_root_primary';
    const initialNodesArr = [
      {
        id: rootId,
        type: 'questionNode',
        position: { x: 150, y: 500 },
        data: {
          question: 'Bienvenue ! Modifiez cette question racine...',
          options: ['Option A', 'Option B', 'Option C', 'Autre'],
          media: [],
          loopOptions: [false, false, false, false],
          onNodeChange: handleNodeDataChange,
          onAddChild: handleAddChildBlock,
          onTriggerDelete: triggerDeleteModal,
          onOptionTextChange: handleOptionTextChange,
          onToggleLoopEdge: handleToggleLoopEdge
        }
      }
    ];

    const initialEdgesArr = [];
    for (let i = 1; i <= 4; i++) {
      const childId = `node_init_child_${i}`;
      initialNodesArr.push({
        id: childId,
        type: 'questionNode',
        position: { x: 150 + 520, y: 500 + (i - 2.5) * 350 },
        data: {
          question: `Question Enfant ${i}`,
          options: ['Option 1', 'Option 2', 'Option 3', 'Autre'],
          media: [],
          loopOptions: [false, false, false, false],
          onNodeChange: handleNodeDataChange,
          onAddChild: handleAddChildBlock,
          onTriggerDelete: triggerDeleteModal,
          onOptionTextChange: handleOptionTextChange,
          onToggleLoopEdge: handleToggleLoopEdge
        }
      });

      const optText = initialNodesArr[0].data.options[i - 1] || `Option ${i}`;
      initialEdgesArr.push({
        id: `edge_root_${childId}`,
        source: rootId,
        target: childId,
        type: 'editableEdge',
        data: { 
          label: optText, 
          optionIndex: i - 1, 
          isManuallyEdited: false,
          onEdgeLabelChange: handleEdgeLabelChange,
          onEdgeDataChange: handleEdgeUpdateGeneric
        }
      });
    }

    setNodes(initialNodesArr);
    setEdges(initialEdgesArr);
    setHistory({ list: [{ nodes: JSON.parse(JSON.stringify(initialNodesArr)), edges: JSON.parse(JSON.stringify(initialEdgesArr)) }], index: 0 });
  }, [handleNodeDataChange, handleAddChildBlock, handleOptionTextChange, handleToggleLoopEdge, handleEdgeLabelChange, handleEdgeUpdateGeneric]);

  return (
    <div style={styles.container}>
      <style>{`
        input::placeholder, textarea::placeholder { color: #94a3b8 !important; opacity: 1 !important; }
        .nodrag[placeholder]:empty:before { content: attr(placeholder); color: #94a3b8 !important; opacity: 1 !important; pointer-events: none; }
        input, textarea, .nodrag { color: #000000 !important; }
        @keyframes fluidVignette {
          0% { opacity: 0; backdrop-filter: blur(0px); background-color: rgba(15,23,42,0); }
          20% { opacity: 1; backdrop-filter: blur(3px); background-color: rgba(15,23,42,0.3); }
          80% { opacity: 1; backdrop-filter: blur(3px); background-color: rgba(15,23,42,0.3); }
          100% { opacity: 0; backdrop-filter: blur(0px); background-color: rgba(15,23,42,0); }
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes fsVignetteFlash {
          0% { opacity: 0; box-shadow: inset 0 0 80px rgba(0,0,0,0.6); }
          50% { opacity: 1; box-shadow: inset 0 0 120px rgba(0,0,0,0.85); }
          100% { opacity: 0; box-shadow: inset 0 0 80px rgba(0,0,0,0); }
        }
        .fs-vignette-anim {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          z-index: 9998;
          animation: fsVignetteFlash 0.5s ease-out forwards;
        }
        .tester-bot-btn {
          transition: box-shadow 0.2s ease;
        }
        .tester-bot-btn:hover {
          box-shadow: 0 4px 14px rgba(9, 71, 118, 0.4);
        }
      `}</style>

      {vignette && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fluidVignette 5s forwards', pointerEvents: 'none' }}>
          <p style={{ color: '#ffffff', fontSize: '24px', fontWeight: 'bold', fontFamily: '"Inter", sans-serif', textShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
            Initialisation de l'environnement créatif de <span style={{ color: '#38bdf8' }}>smsmode France</span>...
          </p>
        </div>
      )}

      {loading && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#0f172a', zIndex: 999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '30px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
            <div style={{ width: '12px', height: '12px', backgroundColor: '#38bdf8', borderRadius: '50%', animation: 'pulseDot 1.4s infinite ease-in-out' }} />
            <div style={{ width: '12px', height: '12px', backgroundColor: '#38bdf8', borderRadius: '50%', animation: 'pulseDot 1.4s infinite ease-in-out 0.2s' }} />
            <div style={{ width: '12px', height: '12px', backgroundColor: '#38bdf8', borderRadius: '50%', animation: 'pulseDot 1.4s infinite ease-in-out 0.4s' }} />
          </div>
          <p style={{ color: '#94a3b8', fontSize: '14px', fontWeight: '500' }}>Chargement du workflow interactif...</p>
        </div>
      )}

      {fsVignetteKey > 0 && (
        <div key={`fs-vignette-${fsVignetteKey}`} className="fs-vignette-anim" />
      )}

      <div style={styles.customWatermarkBackground} />

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        deleteKeyCode={null}
        selectionKeyCode={null}
        multiSelectionKeyCode={null}
      />

      {!fullScreen && (
        <div style={styles.overlayTL}>
          <button className="tester-bot-btn" style={styles.sendBtn} onClick={() => setShowSendModal(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            Tester le Bot
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

      {showSendModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            {sendingState === 'idle' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', position: 'relative', height: '70px', width: '260px', margin: '0 auto 20px auto' }}>
                  <div style={{ color: '#2563eb', display: 'inline-flex', alignItems: 'center' }}>
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  </div>
                </div>
                <h3 style={styles.modalTitle}>Êtes-vous sûr de vouloir envoyer cette configuration de bot RCS à smsmode France ?</h3>
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
                <div style={{ width: '50px', height: '50px', backgroundColor: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <h3 style={styles.modalTitle}>Votre message a été envoyé avec succès !</h3>
                <button style={{ ...styles.controlBtn, backgroundColor: '#0f172a', color: '#fff', marginTop: '20px', border: 'none', width: '50%', boxSizing: 'border-box', display: 'inline-flex', justifyContent: 'center' }} onClick={() => setSendingState('idle')}>
                  Fermer
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {deleteModal.show && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>Êtes-vous sûr de vouloir supprimer ce bloc, toutes ses lignes de connexion et tous les éléments qui lui succèdent ?</h3>
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
      )}
    </div>
  );
};

export default function App() {
  return (
    <ReactFlowProvider>
      <MainFlow />
    </ReactFlowProvider>
  );
}