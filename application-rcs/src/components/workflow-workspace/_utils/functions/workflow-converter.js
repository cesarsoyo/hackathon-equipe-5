// workflow-converter.js

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