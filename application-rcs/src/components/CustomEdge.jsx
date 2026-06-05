import React, { useState, useEffect } from 'react';
import { styles } from '../styles/flowStyles';

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

export default EditableEdge;