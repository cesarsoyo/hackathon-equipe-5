import React from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import './styles/index.css';
import Workspace from './components/workflow-workspace/WorkflowWorkspace';

export default function App() {
  return (
   <>
      <Workspace/>
   </>
    
  );
}