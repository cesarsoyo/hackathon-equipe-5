import React from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { MainFlow } from "./components/MainFlow";
import "@xyflow/react/dist/style.css";

export default function App() {
  return (
    <ReactFlowProvider>
      <MainFlow />
    </ReactFlowProvider>
  );
}
