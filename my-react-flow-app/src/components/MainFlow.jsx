import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  useReactFlow,
} from "@xyflow/react";
import { QuestionNode } from "./QuestionNode";
import { EditableEdge } from "./EditableEdge";
import { styles } from "../styles";

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

export const MainFlow = () => {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  const [loading, setLoading] = useState(true);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [history, setHistory] = useState({ list: [], index: -1 });
  const [fullScreen, setFullScreen] = useState(false);
  const [vignette, setVignette] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ show: false, nodeId: null });
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendingState, setSendingState] = useState("idle");
  const [username, setUsername] = useState("Jean Dupont");
  const [isEditingName, setIsEditingName] = useState(false);
  const [userLogo, setUserLogo] = useState(null);

  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const logoInputRef = useRef(null);
  const rebindFunctionsRef = useRef({});

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);
  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  const takeSnapshot = useCallback((currentNodes, currentEdges) => {
    setHistory((prev) => {
      const snapshot = {
        nodes: JSON.parse(JSON.stringify(currentNodes)),
        edges: JSON.parse(JSON.stringify(currentEdges)),
      };
      if (prev.index >= 0 && prev.list[prev.index]) {
        const lastSaved = prev.list[prev.index];
        if (
          JSON.stringify(lastSaved.nodes) === JSON.stringify(snapshot.nodes) &&
          JSON.stringify(lastSaved.edges) === JSON.stringify(snapshot.edges)
        )
          return prev;
      }
      const nextList = prev.list.slice(0, prev.index + 1);
      const updatedList = [...nextList, snapshot];
      if (updatedList.length > 5) updatedList.shift();
      return { list: updatedList, index: updatedList.length - 1 };
    });
  }, []);

  const handleEdgeUpdateGeneric = useCallback(
    (edgeId, updatedData) => {
      setEdges((prev) =>
        prev.map((e) => (e.id === edgeId ? { ...e, data: updatedData } : e)),
      );
    },
    [setEdges],
  );

  const handleEdgeLabelChange = useCallback(
    (edgeId, newLabel) => {
      setEdges((prev) => {
        const nextEdges = prev.map((e) =>
          e.id === edgeId
            ? {
                ...e,
                data: { ...e.data, label: newLabel, isManuallyEdited: true },
              }
            : e,
        );
        takeSnapshot(nodesRef.current, nextEdges);
        return nextEdges;
      });
    },
    [takeSnapshot],
  );

  const rebindEdgeCallbacks = useCallback(
    (edge) => ({
      ...edge,
      data: {
        ...edge.data,
        onEdgeLabelChange: handleEdgeLabelChange,
        onEdgeDataChange: handleEdgeUpdateGeneric,
      },
    }),
    [handleEdgeLabelChange, handleEdgeUpdateGeneric],
  );

  rebindFunctionsRef.current.rebindEdgeCallbacks = rebindEdgeCallbacks;

  const handleNodeDataChange = useCallback(
    (id, updatedData, triggerHistory = false) => {
      setNodes((prev) => {
        const nextNodes = prev.map((n) =>
          n.id === id ? { ...n, data: updatedData } : n,
        );
        if (triggerHistory)
          setTimeout(() => takeSnapshot(nextNodes, edgesRef.current), 10);
        return nextNodes;
      });
    },
    [takeSnapshot, setNodes],
  );

  const handleOptionTextChange = useCallback(
    (nodeId, optionIndex, newText) => {
      setEdges((prev) =>
        prev.map((edge) =>
          edge.source === nodeId &&
          edge.data?.optionIndex === optionIndex &&
          !edge.data?.isManuallyEdited
            ? { ...edge, data: { ...edge.data, label: newText } }
            : edge,
        ),
      );
    },
    [setEdges],
  );

  const handleToggleLoopEdge = useCallback(
    (nodeId, optionIndex) => {
      let nextEdges = edgesRef.current.filter(
        (e) => !(e.source === nodeId && e.data?.isLoop),
      );
      if (optionIndex !== -1) {
        const parentEdge = nextEdges.find((e) => e.target === nodeId);
        if (parentEdge) {
          const parentId = parentEdge.source;
          const currentNode = nodesRef.current.find((n) => n.id === nodeId);
          const optionText =
            currentNode?.data?.options?.[optionIndex] ||
            `Boucle ${optionIndex + 1}`;
          const newLoopEdge = {
            id: `loop_${nodeId}_${optionIndex}`,
            source: nodeId,
            target: parentId,
            type: "editableEdge",
            animated: true,
            style: {
              strokeDasharray: "6,6",
              stroke: "#6bb884",
              strokeWidth: 2,
            },
            data: {
              label: optionText,
              optionIndex,
              isLoop: true,
              isManuallyEdited: false,
              onEdgeLabelChange: handleEdgeLabelChange,
              onEdgeDataChange: handleEdgeUpdateGeneric,
            },
          };
          nextEdges.push(newLoopEdge);
        }
      }
      setEdges(nextEdges);
      takeSnapshot(nodesRef.current, nextEdges);
    },
    [handleEdgeLabelChange, handleEdgeUpdateGeneric, takeSnapshot, setEdges],
  );

  const handleAddChildBlock = useCallback(
    (sourceId) => {
      const parentNode = nodesRef.current.find((n) => n.id === sourceId);
      const directChildrenCount = edgesRef.current.filter(
        (e) => e.source === sourceId && !e.data?.isLoop,
      ).length;
      if (directChildrenCount >= 4) {
        alert("Limite de 4 blocs enfants atteinte.");
        return;
      }
      if (!parentNode) return;

      const nextId = `node_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const nonCollidingPos = getNonOverlappingPosition(
        parentNode.position.x + 520,
        parentNode.position.y + directChildrenCount * 140,
        nodesRef.current,
      );
      const defaultOptionText =
        parentNode.data.options?.[directChildrenCount] ||
        `Option ${directChildrenCount + 1}`;

      const newChildNode = {
        id: nextId,
        type: "questionNode",
        position: nonCollidingPos,
        data: {
          question: "",
          options: ["Option 1", "Option 2", "Option 3", "Autre"],
          media: [],
          loopOptions: [false, false, false, false],
          onNodeChange: handleNodeDataChange,
          onAddChild: handleAddChildBlock,
          onTriggerDelete: triggerDeleteModal,
          onOptionTextChange: handleOptionTextChange,
          onToggleLoopEdge: handleToggleLoopEdge,
        },
      };
      const newEdge = {
        id: `edge_${sourceId}_${nextId}`,
        source: sourceId,
        target: nextId,
        type: "editableEdge",
        data: {
          label: defaultOptionText,
          optionIndex: directChildrenCount,
          isManuallyEdited: false,
          onEdgeLabelChange: handleEdgeLabelChange,
          onEdgeDataChange: handleEdgeUpdateGeneric,
        },
      };
      const nextNodes = [...nodesRef.current, newChildNode];
      const nextEdges = [...edgesRef.current, newEdge];
      setNodes(nextNodes);
      setEdges(nextEdges);
      setTimeout(() => takeSnapshot(nextNodes, nextEdges), 10);
    },
    [
      handleNodeDataChange,
      handleEdgeLabelChange,
      handleEdgeUpdateGeneric,
      handleOptionTextChange,
      handleToggleLoopEdge,
      takeSnapshot,
      setNodes,
      setEdges,
    ],
  );

  const triggerDeleteModal = useCallback((nodeId) => {
    setDeleteModal({ show: true, nodeId });
  }, []);

  const rebindNodeCallbacks = useCallback(
    (node) => {
      node.data.onNodeChange = handleNodeDataChange;
      node.data.onAddChild = handleAddChildBlock;
      node.data.onTriggerDelete = triggerDeleteModal;
      node.data.onOptionTextChange = handleOptionTextChange;
      node.data.onToggleLoopEdge = handleToggleLoopEdge;
      return node;
    },
    [
      handleNodeDataChange,
      handleAddChildBlock,
      triggerDeleteModal,
      handleOptionTextChange,
      handleToggleLoopEdge,
    ],
  );

  rebindFunctionsRef.current.rebindNodeCallbacks = rebindNodeCallbacks;

  const undo = useCallback(() => {
    setHistory((prev) => {
      if (prev.index > 0) {
        const nextIdx = prev.index - 1;
        const prevStep = prev.list[nextIdx];
        setNodes(
          prevStep.nodes.map((n) =>
            rebindFunctionsRef.current.rebindNodeCallbacks(n),
          ),
        );
        setEdges(
          prevStep.edges.map((e) =>
            rebindFunctionsRef.current.rebindEdgeCallbacks(e),
          ),
        );
        return { ...prev, index: nextIdx };
      }
      return prev;
    });
  }, [setNodes, setEdges]);

  const redo = useCallback(() => {
    setHistory((prev) => {
      if (prev.index < prev.list.length - 1) {
        const nextIdx = prev.index + 1;
        const nextStep = prev.list[nextIdx];
        setNodes(
          nextStep.nodes.map((n) =>
            rebindFunctionsRef.current.rebindNodeCallbacks(n),
          ),
        );
        setEdges(
          nextStep.edges.map((e) =>
            rebindFunctionsRef.current.rebindEdgeCallbacks(e),
          ),
        );
        return { ...prev, index: nextIdx };
      }
      return prev;
    });
  }, [setNodes, setEdges]);

  // FIX BUG : Algorithme d'élimination exclusive vers le bas (Protection de la mère)
  const executeDeleteBlock = () => {
    const targetId = deleteModal.nodeId;
    if (!targetId) return;

    let nodesToRemove = new Set([targetId]);
    let processQueue = [targetId];

    while (processQueue.length > 0) {
      const currentId = processQueue.shift();
      edgesRef.current.forEach((edge) => {
        // Condition stricte : on ne supprime que si l'élément cible est la SOURCE de la liaison (Descendant)
        if (edge.source === currentId && !nodesToRemove.has(edge.target)) {
          nodesToRemove.add(edge.target);
          processQueue.push(edge.target);
        }
      });
    }

    const nextNodes = nodesRef.current.filter((n) => !nodesToRemove.has(n.id));
    const nextEdges = edgesRef.current.filter(
      (e) => !nodesToRemove.has(e.source) && !nodesToRemove.has(e.target),
    );

    setNodes(nextNodes);
    setEdges(nextEdges);
    takeSnapshot(nextNodes, nextEdges);
    setDeleteModal({ show: false, nodeId: null });
  };

  const onNodeDragStop = useCallback(
    (event, draggedNode) => {
      setNodes((currentNodes) => {
        const nextNodes = currentNodes.map((node) =>
          node.id === draggedNode.id ? draggedNode : node,
        );
        setTimeout(() => takeSnapshot(nextNodes, edgesRef.current), 10);
        return nextNodes;
      });
    },
    [takeSnapshot, setNodes],
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  useEffect(() => {
    const rootId = "node_root_primary";
    const initialNodesArr = [
      {
        id: rootId,
        type: "questionNode",
        position: { x: 150, y: 500 },
        data: {
          question: "Bienvenue ! Modifiez cette question racine...",
          options: ["Option A", "Option B", "Option C", "Autre"],
          media: [],
          loopOptions: [false, false, false, false],
          onNodeChange: handleNodeDataChange,
          onAddChild: handleAddChildBlock,
          onTriggerDelete: triggerDeleteModal,
          onOptionTextChange: handleOptionTextChange,
          onToggleLoopEdge: handleToggleLoopEdge,
        },
      },
    ];
    const initialEdgesArr = [];
    for (let i = 1; i <= 4; i++) {
      const childId = `node_init_child_${i}`;
      initialNodesArr.push({
        id: childId,
        type: "questionNode",
        position: { x: 150 + 520, y: 500 + (i - 2.5) * 350 },
        data: {
          question: `Question Enfant ${i}`,
          options: ["Option 1", "Option 2", "Option 3", "Autre"],
          media: [],
          loopOptions: [false, false, false, false],
          onNodeChange: handleNodeDataChange,
          onAddChild: handleAddChildBlock,
          onTriggerDelete: triggerDeleteModal,
          onOptionTextChange: handleOptionTextChange,
          onToggleLoopEdge: handleToggleLoopEdge,
        },
      });
      initialEdgesArr.push({
        id: `edge_root_${childId}`,
        source: rootId,
        target: childId,
        type: "editableEdge",
        data: {
          label: initialNodesArr[0].data.options[i - 1] || `Option ${i}`,
          optionIndex: i - 1,
          isManuallyEdited: false,
          onEdgeLabelChange: handleEdgeLabelChange,
          onEdgeDataChange: handleEdgeUpdateGeneric,
        },
      });
    }
    setNodes(initialNodesArr);
    setEdges(initialEdgesArr);
    setHistory({
      list: [
        {
          nodes: JSON.parse(JSON.stringify(initialNodesArr)),
          edges: JSON.parse(JSON.stringify(initialEdgesArr)),
        },
      ],
      index: 0,
    });
  }, []);

  return (
    <div style={styles.container}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        minZoom={0.005}
        maxZoom={8}
        fitView
      />
      {/* Fenêtres modales de contrôle simplifiées à l'affichage */}
      {!fullScreen && (
        <div style={styles.overlayTL}>
          <button style={styles.sendBtn} onClick={() => setShowSendModal(true)}>
            Envoyer
          </button>
        </div>
      )}
      {/* Section des boutons d'annulation bas gauche */}
      {!fullScreen && (
        <div style={styles.overlayBL}>
          <button
            style={styles.circularControlBtn}
            onClick={undo}
            disabled={history.index <= 0}
          >
            ↩
          </button>
          <button
            style={styles.circularControlBtn}
            onClick={redo}
            disabled={history.index >= history.list.length - 1}
          >
            ↪
          </button>
        </div>
      )}
      {/* Fenêtre modale de confirmation de suppression */}
      {deleteModal.show && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>
              Êtes-vous sûr de vouloir supprimer ce bloc et ses descendants ?
            </h3>
            <div style={styles.modalActions}>
              <button
                style={{
                  ...styles.controlBtn,
                  backgroundColor: "#ef4444",
                  color: "#fff",
                }}
                onClick={executeDeleteBlock}
              >
                Oui, supprimer
              </button>
              <button
                style={styles.controlBtn}
                onClick={() => setDeleteModal({ show: false, nodeId: null })}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
