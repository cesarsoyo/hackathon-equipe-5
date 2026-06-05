import React from 'react';
import { getBezierPath } from '@xyflow/react';

export default function FloatingConnectionLine({
  toX,
  toY,
  fromPosition,
  toPosition,
  fromNode
}) {
  const [edgePath] = getBezierPath({
    sourceX: fromNode.position.x + fromNode.measured.width,
    sourceY: fromNode.position.y + fromNode.measured.height / 2,
    sourcePosition: fromPosition,
    targetX: toX,
    targetY: toY,
    targetPosition: toPosition,
  });

  return (
    <g>
      <path
        fill="none"
        stroke="#2563eb"
        strokeWidth={2}
        className="animated"
        d={edgePath}
        strokeDasharray="5,5"
      />
      <circle
        cx={toX}
        cy={toY}
        fill="#fff"
        r={3}
        stroke="#2563eb"
        strokeWidth={1.5}
      />
    </g>
  );
}