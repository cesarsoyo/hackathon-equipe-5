// workflow-converter.js

/**
 * Converts the backend node map back into a React Flow graph (nodes array + edges array).
 * Used to restore any workflow from the DB into the canvas, even those without reactFlowData.
 * Positions are computed with a simple BFS tree layout.
 *
 * @param {Record<string, object>} backendNodes - The nodes map from the DB
 * @param {string} entryNodeId - The root node key
 * @returns {{ nodes: Array, edges: Array }}
 */
export const convertFromBackendPayload = (backendNodes = {}, entryNodeId = 'node_root_primary') => {
  const NODE_X_GAP = 520;
  const NODE_Y_GAP = 340;
  const ROOT_X = 150;
  const ROOT_Y = 500;

  // BFS to assign depth + sibling index, then compute positions
  const levelNodes = {}; // depth -> [nodeId, ...]
  const visited = new Set();
  const queue = [{ id: entryNodeId, depth: 0 }];

  while (queue.length > 0) {
    const { id, depth } = queue.shift();
    if (visited.has(id) || !backendNodes[id]) continue;
    visited.add(id);

    if (!levelNodes[depth]) levelNodes[depth] = [];
    levelNodes[depth].push(id);

    const node = backendNodes[id];
    const suggestions = (node.suggestions || []).filter(s => s.nextNode && backendNodes[s.nextNode]);
    suggestions.forEach(s => {
      if (!visited.has(s.nextNode)) queue.push({ id: s.nextNode, depth: depth + 1 });
    });
  }

  // Compute Y positions: center siblings vertically within their level
  const positions = {};
  Object.entries(levelNodes).forEach(([depth, ids]) => {
    const count = ids.length;
    ids.forEach((id, i) => {
      positions[id] = {
        x: ROOT_X + Number(depth) * NODE_X_GAP,
        y: ROOT_Y + (i - (count - 1) / 2) * NODE_Y_GAP,
      };
    });
  });

  // Also place any orphan nodes that weren't reachable from entryNodeId
  let orphanX = ROOT_X;
  let orphanY = ROOT_Y + (Object.keys(levelNodes[0] || {}).length + 2) * NODE_Y_GAP;
  Object.keys(backendNodes).forEach(id => {
    if (!positions[id]) {
      positions[id] = { x: orphanX, y: orphanY };
      orphanY += NODE_Y_GAP;
    }
  });

  const rfNodes = Object.entries(backendNodes).map(([id, node]) => ({
    id,
    type: 'questionNode',
    position: positions[id] || { x: ROOT_X, y: ROOT_Y },
    data: {
      question: node.text || '',
      options: (node.suggestions || []).map(s => s.text || 'Option'),
      media: [],
      loopOptions: (node.suggestions || []).map(() => false),
    },
  }));

  const rfEdges = [];
  Object.entries(backendNodes).forEach(([sourceId, node]) => {
    (node.suggestions || []).forEach((s, idx) => {
      if (!s.nextNode || !backendNodes[s.nextNode]) return;
      rfEdges.push({
        id: `edge_${sourceId}_${s.nextNode}_${idx}`,
        source: sourceId,
        target: s.nextNode,
        type: 'editableEdge',
        data: {
          label: s.text || 'Suivant',
          optionIndex: idx,
          isManuallyEdited: false,
        },
      });
    });
  });

  return { nodes: rfNodes, edges: rfEdges };
};

/**
 * Transforms the React Flow graph state into the structured payload expected by the NestJS API.
 * @param {Array} nodes - React Flow nodes array from live ref tracker
 * @param {Array} edges - React Flow edges array from live ref tracker
 * @param {string} workflowName - The reference tag for the RCS campaign
 * @returns {Object} Clean payload structured for the NestJS test-send endpoint
 */
export const convertToBackendPayload = (nodes = [], edges = [], workflowName = 'Hack-5') => {
  const backendNodes = {};

  nodes.forEach((node) => {
    // 1. Identify all direct child targets branching out from this specific node card
    const outgoingEdges = edges.filter((edge) => edge.source === node.id);

    // 2. Map every structural edge connector link to an interactive user quick-reply button
    const suggestions = outgoingEdges.map((edge) => {
      // Fallback cleanly to default text values if a label property hasn't been set yet
      const optionText = edge.data?.label || 'Suivant';
      
      return {
        type: 'REPLY',
        text: optionText,
        // Enforce clean uppercase postback codes matching typical webhook payload structures
        postbackData: optionText.toUpperCase().trim().replace(/\s+/g, '_'),
        nextNode: edge.target,
      };
    });

    // 3. Construct the server node schema
    backendNodes[node.id] = {
      type: 'TEXT',
      // Safely pull input text configurations or default to empty strings
      text: node.data?.question || '',
      suggestions: suggestions,
    };
  });

  return {
    name: workflowName,
    // Ensure the root node primary anchor string matches MainFlow's setup exactly
    entryNodeId: 'node_root_primary',
    nodes: backendNodes,
  };
};