import React from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import MainFlow from '../MainFlow'; // Ensure this points directly to your MainFlow path

/**
 * Layout shell providing global styles, viewport protection limits, 
 * and context state boundaries for the React Flow canvas workspace.
 */
const Workspace = () => {
  return (
    <div style={workspaceStyles.viewportContainer}>
      <ReactFlowProvider>
        {/* Core interaction layout panel container */}
        <div style={workspaceStyles.flowWrapper}>
          <MainFlow />
        </div>
      </ReactFlowProvider>
    </div>
  );
};

// Inline layout configurations optimized for high-performance canvas tracking
const workspaceStyles = {
  viewportContainer: {
    width: '100vw',
    height: '100vh',
    margin: 0,
    padding: 0,
    backgroundColor: '#0f172a', // Matches MainFlow loading backdrop themes perfectly
    overflow: 'hidden',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column'
  },
  flowWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
    flexGrow: 1
  }
};

export default Workspace;