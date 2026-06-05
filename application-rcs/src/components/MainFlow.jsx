import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  useReactFlow
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import QuestionNode from './CustomNode';
import EditableEdge from './CustomEdge';
import { styles } from '../styles/flowStyles';
import { convertToBackendPayload } from './workflow-workspace/_utils/functions/workflow-converter';

const nodeTypes = { questionNode: QuestionNode };
const edgeTypes = { editableEdge: EditableEdge };

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
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [sendingState, setSendingState] = useState('idle');
  const [fsVignetteKey, setFsVignetteKey] = useState(0);
  
  const [username, setUsername] = useState(() => localStorage.getItem('flow_username') || 'Thomas Froger');
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
  }, [setEdges]);

  const handleEdgeLabelChange = useCallback((edgeId, newLabel) => {
    setEdges(prev => {
      const nextEdges = prev.map(e => e.id === edgeId ? { ...e, data: { ...e.data, label: newLabel, isManuallyEdited: true } } : e);
      takeSnapshot(nodesRef.current, nextEdges);
      return nextEdges;
    });
  }, [takeSnapshot, setEdges]);

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
  }, [setNodes, setEdges]);

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
  }, [setNodes, setEdges]);

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
  }, [setEdges]);

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
  }, [handleEdgeLabelChange, handleEdgeUpdateGeneric, takeSnapshot, setEdges]);

  const handleNodeDataChange = useCallback((id, updatedData, triggerHistory = false) => {
    setNodes(prev => {
      const nextNodes = prev.map(n => n.id === id ? { ...n, data: updatedData } : n);
      if (triggerHistory) {
        setTimeout(() => takeSnapshot(nextNodes, edgesRef.current), 10);
      }
      return nextNodes;
    });
  }, [takeSnapshot, setNodes]);

  const triggerDeleteModal = (nodeId) => {
    setDeleteModal({ show: true, nodeId });
  };

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
      position: { x: targetX, y: targetY },
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
  }, [handleNodeDataChange, handleEdgeLabelChange, handleEdgeUpdateGeneric, handleOptionTextChange, handleToggleLoopEdge, takeSnapshot, setNodes, setEdges]);

  const rebindNodeCallbacks = useCallback((node) => {
    node.data = {
      ...node.data,
      onNodeChange: handleNodeDataChange,
      onAddChild: handleAddChildBlock,
      onTriggerDelete: triggerDeleteModal,
      onOptionTextChange: handleOptionTextChange,
      onToggleLoopEdge: handleToggleLoopEdge
    };
    return node;
  }, [handleNodeDataChange, handleAddChildBlock, handleOptionTextChange, handleToggleLoopEdge]);

  rebindFunctionsRef.current.rebindNodeCallbacks = rebindNodeCallbacks;

  const handleCreateMotherBlock = () => {
    const rootId = 'node_root_primary';
    const newMotherNode = {
      id: rootId,
      type: 'questionNode',
      position: { x: 150, y: 500 },
      data: {
        question: 'Bienvenue !\nModifiez cette question racine...',
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
  }, [takeSnapshot, setNodes]);

  const executeDeleteBlock = () => {
    const targetId = deleteModal.nodeId;
    if (!targetId) return;

    let nodesToRemove = new Set([targetId]);
    let processQueue = [targetId];

    while (processQueue.length > 0) {
      const currentId = processQueue.shift();
      edgesRef.current.forEach(edge => {
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

  const handleLogoUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const resultStr = reader.result;
        setUserLogo(resultStr);
        localStorage.setItem('flow_userlogo', resultStr);
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

  // Accepts 06/07 local formats, pure 9 digits, or 11-digit numbers starting with 33
  const phoneRegex = /^(0[67]\d{8}|\d{9}|33[67]\d{8})$/;

  const validatePhone = (value) => {
    const cleanValue = value.trim();
    if (!cleanValue) {
      setPhoneError('Le numéro est obligatoire.');
    } else if (!phoneRegex.test(cleanValue)) {
      setPhoneError('Numéro invalide. Exemple : 0612345678 ou 33612345678');
    } else {
      setPhoneError('');
    }
  };

  const handleSaveAndSend = async () => {
    if (!phoneNumber || phoneError) {
      alert("Veuillez entrer un numéro valide.");
      return;
    }

    setSendingState('sending');

    // Automatically rewrite local 06/07 prefix strings into standard 33 international tokens
    let formattedPhoneNumber = phoneNumber.trim();
    if (formattedPhoneNumber.startsWith('0')) {
      formattedPhoneNumber = '33' + formattedPhoneNumber.slice(1);
    }

    // Parse the graph safely from live hooks
    const workflowPayload = convertToBackendPayload(nodesRef.current, edgesRef.current, 'Hack-5');

    const payload = {
      phoneNumber: formattedPhoneNumber,
      ...workflowPayload
    };

    try {
      const response = await fetch("https://smsmode-hack-team-5.ngrok.dev/Rcs-Workflow-Backend-API/work-flow/test-send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setSendingState('success');
      } else {
        const errBody = await response.json();
        throw new Error(errBody.message || 'Erreur lors de l\'envoi');
      }
    } catch (error) {
      console.error("Erreur de transmission NestJS API:", error);
      setSendingState('idle');
      alert(error.message || "Erreur lors de l'envoi du scénario.");
    } 
  };

  useEffect(() => {
    const savedData = localStorage.getItem('flow_data');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.nodes && parsed.edges) {
          const loadedNodes = parsed.nodes.map(n => rebindNodeCallbacks(n));
          const loadedEdges = parsed.edges.map(e => rebindEdgeCallbacks(e));
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
          question: 'Bienvenue !\nModifiez cette question racine...',
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
  }, [handleNodeDataChange, handleAddChildBlock, handleOptionTextChange, handleToggleLoopEdge, handleEdgeLabelChange, handleEdgeUpdateGeneric, rebindNodeCallbacks, rebindEdgeCallbacks, setNodes, setEdges]);

  return (
    <div style={styles.container}>
      <style>{`
        input::placeholder, textarea::placeholder { color: #94a3b8 !important; opacity: 1 !important; }
        .nodrag[placeholder]:empty:before { content: attr(placeholder); color: #94a3b8 !important; opacity: 1 !important; pointer-events: none; }
        input, textarea, .nodrag { color: #000000 !important; }
        @keyframes fluidVignette {
          0% { opacity: 1; backdrop-filter: blur(0px); background-color: rgba(15,23,42,0); }
          50% { opacity: 1; backdrop-filter: blur(5px); background-color: rgba(15,23,42,0.3); }
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
        
        @keyframes fluidOpen {
          0% { transform: scale(0.7) translateY(-20px); opacity: 0; }
          60% { transform: scale(1.04) translateY(2px); }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        .fluid-modal {
          animation: fluidOpen 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        @keyframes celebrationSparks {
          0% { transform: scale(0.5); opacity: 0; box-shadow: 0 0 0px #22c55e, 0 0 0px #eab308; }
          50% { opacity: 1; box-shadow: -20px -20px 10px #22c55e, 20px -20px 10px #eab308, -20px 20px 10px #3b82f6, 20px 20px 10px #ec4899; }
          100% { transform: scale(1.05); opacity: 0; box-shadow: -40px -40px 30px rgba(0,0,0,0), 40px -40px 30px rgba(0,0,0,0), -40px 40px 30px rgba(0,0,0,0), 40px 40px 30px rgba(0,0,0,0); }
        }
        .celebration-active {
          position: relative;
        }
        .celebration-active::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          border-radius: 8px;
          pointer-events: none;
          animation: celebrationSparks 0.8s ease-out infinite;
        }
      `}</style>

      {vignette && (
        <div style={{ position: 'fixed', top: '45px', left: 0, right: 0, bottom: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fluidVignette 5s forwards', pointerEvents: 'none' }}>
          <p style={{ color: '#ffffff', fontSize: '28px', fontWeight: 'bold', fontFamily: '"Inter", sans-serif', textShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
            Initialisation de l'environnement créatif de <span style={{ color: '#38bdf8' }}>SMSMODE FRANCE</span>...
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
        minZoom={0.01}
        maxZoom={Infinity}
        panOnScroll={true}
      />

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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 1 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/></svg>
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

      {showSupportModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal} className="fluid-modal">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ color: '#094776', display: 'flex', alignItems: 'center' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/><path d="M21 15v4a2 2 0 0 1-2 2h-4"/></svg>
              </div>
              <h3 style={{ ...styles.modalTitle, margin: 0 }}>Support technique @SMSMODE</h3>
             </div>
            <p style={{ fontSize: '14px', color: '#475569', marginBottom: '20px', lineHeight: '1.6' }}>
              Notre équipe est à votre disposition pour vous accompagner dans la création de vos workflows RCS. N'hésitez pas à nous contacter en cas de problème technique.
            </p>
            <div style={{ backgroundColor: '#f1f5f9', padding: '16px', borderRadius: '12px', textAlign: 'left', marginBottom: '24px', fontSize: '13px', color: '#1e293b', border: '1px solid #e2e8f0' }}>
              <p style={{ margin: '0 0 8px 0', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                <strong>Téléphone :</strong> +33 04 23 45 67 89
              </p>
              <p style={{ margin: '0 0 8px 0', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                <strong>Email :</strong> support@smsmode.com
              </p>
              <p style={{ margin: 0, display: 'flex', gap: '8px', alignItems: 'center' }}>
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <strong>Horaires :</strong> Lun - Ven, 9h00 - 18h00
              </p>
            </div>
            <button style={{ ...styles.controlBtn, backgroundColor: '#094776', color: '#fff', border: 'none', width: '100%', justifyContent: 'center' }} onClick={() => setShowSupportModal(false)}>
              Fermer
            </button>
          </div>
        </div>
      )}

      {showSendModal && (
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
                    placeholder="0612345678 ou 33612345678"
                    maxLength={13}
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
                    Formats acceptés : 0612345678 ou 33612345678
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
      )}

      {deleteModal.show && (
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
       )}
    </div>
  );
};

export default MainFlow;