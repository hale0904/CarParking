import React, { useCallback } from 'react';
import { Group, Line, Circle, Text } from 'react-konva';

const GRID_SIZE = 20;
const SNAP_DIST = 18;
const snapToGrid = (v) => Math.round(v / GRID_SIZE) * GRID_SIZE;

/*
  Props:
    laneNodes  : Array<{ id, x, y }>
    laneEdges  : Array<{ id, fromNodeId, toNodeId, width }>
    selectedEntity : { type, id } | null
    editorMode : string | null
    scale      : number
    gridRealSize : number
    parkingUnit  : string
    onSelect   : (entity) => void
    onUpdateNode : (nodeId, changes) => void
    onAddNode    : (node) => void
    onAddEdge    : (edge) => void
    onDeleteNode : (nodeId) => void
    onDeleteEdge : (edgeId) => void
    drawingEdge  : { fromNodeId } | null   -- active edge being drawn
    setDrawingEdge : (val) => void
*/

const LaneGraph = ({
  laneNodes = [],
  laneEdges = [],
  showNodes = true,
  selectedEntity,
  editorMode,
  scale = 1,
  gridRealSize = 2.5,
  parkingUnit = 'm',
  onSelect,
  onUpdateNode,
  onAddNode,
  onAddEdge,
  onDeleteNode,
  onDeleteEdge,
  drawingEdge,
  setDrawingEdge,
  pointerPos,  // current mouse position on stage (for live preview)
}) => {

  const getNode = (id) => laneNodes.find(n => n.id === id);

  const calcLength = (x1, y1, x2, y2) =>
    Math.hypot(x2 - x1, y2 - y1);

  // Find node near a position (for snap)
  const findNearNode = (x, y, excludeId = null) =>
    laneNodes.find(n =>
      n.id !== excludeId &&
      Math.hypot(n.x - x, n.y - y) < SNAP_DIST / scale
    );

  // --- EDGE RENDERING ---
  const renderEdge = (edge) => {
    const from = getNode(edge.fromNodeId);
    const to   = getNode(edge.toNodeId);
    if (!from || !to) return null;

    const isSelected = selectedEntity?.id === edge.id && selectedEntity?.type === 'LANE_EDGE';
    const w = edge.width ?? 20;
    const len = calcLength(from.x, from.y, to.x, to.y);
    const realLen = ((len / GRID_SIZE) * gridRealSize).toFixed(1);
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;

    return (
      <Group key={edge.id}>
        {/* Selection glow */}
        {isSelected && (
          <Line
            points={[from.x, from.y, to.x, to.y]}
            stroke="#2563eb"
            strokeWidth={w + 8 / scale}
            lineCap="round"
            opacity={0.25}
            listening={false}
          />
        )}

        {/* Road body */}
        <Line
          points={[from.x, from.y, to.x, to.y]}
          stroke="#cbd5e1"
          strokeWidth={w}
          lineCap="round"
          hitStrokeWidth={w + 16}
          onClick={(e) => {
            if (editorMode === 'PAN') return;
            e.cancelBubble = true;
            onSelect({ type: 'LANE_EDGE', id: edge.id });
          }}
          onContextMenu={(e) => {
            e.evt.preventDefault();
            e.cancelBubble = true;
            onDeleteEdge(edge.id);
          }}
          onMouseEnter={(e) => {
            if (editorMode !== 'PAN')
              e.target.getStage().container().style.cursor = 'pointer';
          }}
          onMouseLeave={(e) => {
            e.target.getStage().container().style.cursor = 'default';
          }}
        />

        {/* Center dashed line */}
        <Line
          points={[from.x, from.y, to.x, to.y]}
          stroke="rgba(255,255,255,0.75)"
          strokeWidth={Math.max(1, 1.5 / scale)}
          lineCap="round"
          dash={[10, 8]}
          listening={false}
        />

        {/* Length label when selected */}
        {isSelected && (
          <Text
            x={midX + 4 / scale}
            y={midY - w / 2 - 16 / scale}
            text={`${realLen}${parkingUnit}  W:${((w / GRID_SIZE) * gridRealSize).toFixed(1)}${parkingUnit}  [Chuột phải: xóa]`}
            fontSize={Math.max(10, 12 / scale)}
            fill="#1e40af"
            listening={false}
          />
        )}
      </Group>
    );
  };

  // --- NODE RENDERING ---
  const renderNode = (node) => {
    const isSelected = selectedEntity?.id === node.id && selectedEntity?.type === 'LANE_NODE';
    const isDrawingFrom = drawingEdge?.fromNodeId === node.id;

    // Count edges connected to this node
    const connectedEdges = laneEdges.filter(
      e => e.fromNodeId === node.id || e.toNodeId === node.id
    );
    const isDeadEnd = connectedEdges.length <= 1;

    const isDrawMode = editorMode === 'DRAW_LANE';
    const r = isDrawMode
        ? Math.max(6, 8 / scale)
        : Math.max(3, 4 / scale);
    const strokeW = isDrawMode
        ? Math.max(1.5, 2 / scale)
        : Math.max(1, 1.5 / scale);

    return (
      <Group key={node.id}>
        {/* Snap highlight ring (when drawing edge and near) */}
        {drawingEdge && !isDrawingFrom && pointerPos &&
          Math.hypot(node.x - pointerPos.x, node.y - pointerPos.y) < SNAP_DIST / scale && (
          <Circle
            x={node.x} y={node.y}
            radius={r + 6 / scale}
            fill="none"
            stroke="#22c55e"
            strokeWidth={2 / scale}
            listening={false}
          />
        )}

        {/* Dead-end warning ring */}
        {isDeadEnd && !drawingEdge && (
          <Circle
            x={node.x} y={node.y}
            radius={r + (isDrawMode ? 5 : 3) / scale}
            fill="none"
            stroke="#f59e0b"
            strokeWidth={1.5 / scale}
            opacity={0.6}
            listening={false}
          />
        )}

        {/* Node circle */}
        <Circle
          x={node.x} y={node.y}
          radius={r}
            fill={
              isDrawingFrom           ? '#1d4ed8' :
              isSelected              ? '#3b82f6' :
              (isDeadEnd && isDrawMode) ? '#f59e0b' :
                                          '#94a3b8'
            }
          stroke="white"
          strokeWidth={strokeW}
          draggable={editorMode !== 'PAN' && !drawingEdge}
          onClick={(e) => {
            if (editorMode === 'PAN') return;
            e.cancelBubble = true;

            if (drawingEdge) {
              // Complete edge to this node
              if (drawingEdge.fromNodeId !== node.id) {
                onAddEdge({
                  id: `edge-${Date.now()}`,
                  fromNodeId: drawingEdge.fromNodeId,
                  toNodeId: node.id,
                  width: 20,
                });
                setDrawingEdge(null);
              }
            } else {
              // Start drawing edge FROM this node
              setDrawingEdge({ fromNodeId: node.id });
              onSelect({ type: 'LANE_NODE', id: node.id });
            }
          }}
          onDragMove={(e) => {
            const nx = e.target.x();
            const ny = e.target.y();
            onUpdateNode(node.id, { x: nx, y: ny });
          }}
          onDragEnd={(e) => {
            const nx = snapToGrid(e.target.x());
            const ny = snapToGrid(e.target.y());
            e.target.x(nx); e.target.y(ny);
            onUpdateNode(node.id, { x: nx, y: ny });
          }}
          onContextMenu={(e) => {
            e.evt.preventDefault();
            e.cancelBubble = true;
            onDeleteNode(node.id);
          }}
          onMouseEnter={(e) => {
            if (editorMode !== 'PAN')
              e.target.getStage().container().style.cursor =
                drawingEdge ? 'crosshair' : 'move';
          }}
          onMouseLeave={(e) => {
            e.target.getStage().container().style.cursor = 'default';
          }}
        />
      </Group>
    );
  };

  // --- LIVE PREVIEW EDGE (while drawing) ---
  const renderPreviewEdge = () => {
    if (!drawingEdge || !pointerPos) return null;
    const from = getNode(drawingEdge.fromNodeId);
    if (!from) return null;

    const snapTarget = findNearNode(pointerPos.x, pointerPos.y, drawingEdge.fromNodeId);
    const toX = snapTarget ? snapTarget.x : pointerPos.x;
    const toY = snapTarget ? snapTarget.y : pointerPos.y;

    return (
      <Line
        points={[from.x, from.y, toX, toY]}
        stroke={snapTarget ? '#22c55e' : '#93c5fd'}
        strokeWidth={Math.max(3, 20 / scale * 0.5)}
        lineCap="round"
        dash={[8, 6]}
        opacity={0.7}
        listening={false}
      />
    );
  };

  return (
    <Group>
      {/* Draw edges first (below nodes) */}
      {laneEdges.map(renderEdge)}

      {/* Live preview */}
      {showNodes && renderPreviewEdge()}

      {/* Draw nodes on top */}
      {showNodes && laneNodes.map(renderNode)}
    </Group>
  );
};

export default LaneGraph;
