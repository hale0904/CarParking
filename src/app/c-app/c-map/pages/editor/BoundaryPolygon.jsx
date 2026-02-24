import React, { useState } from 'react';
import { Group, Line, Circle } from 'react-konva';

const GRID_SIZE = 20;

const BoundaryPolygon = ({
    points,
    closed,
    isDrawing,
    onDragVertex,
    onVertexClick,
}) => {
    const [hoveredVertexIndex, setHoveredVertexIndex] = useState(null);

    if (!points || points.length === 0) return null;

    // Convert flat array to array of {x, y} for rendering circles
    const vertices = [];
    for (let i = 0; i < points.length; i += 2) {
        vertices.push({ x: points[i], y: points[i + 1] });
    }

    const firstVertex = vertices[0];
    const canClose = !closed && vertices.length >= 3;

    return (
        <Group>
            {/* The Polygon Outline/Fill */}
            <Line
                points={points}
                closed={closed}
                stroke="#3b82f6"
                strokeWidth={2}
                fill={closed ? "rgba(59, 130, 246, 0.1)" : null}
                dash={closed ? [] : [10, 5]}
                lineCap="round"
                lineJoin="round"
                listening={false} // Pass events through line (e.g. valid click on stage while drawing)
            />

            {/* Vertices */}
            {vertices.map((v, i) => {
                const isFirst = i === 0;
                // Vertices are draggable if polygon is closed (edit mode)
                const isDraggable = closed;

                // Allow closing by clicking first point
                const isInteractive = isDraggable || (isDrawing && isFirst && canClose);
                const isHovered = hoveredVertexIndex === i;

                return (
                    <Circle
                        key={`v-${i}`}
                        x={v.x}
                        y={v.y}
                        radius={isInteractive && isHovered ? 8 : 6}
                        fill={isInteractive && isHovered ? "#2563eb" : "#3b82f6"}
                        stroke="#ffffff"
                        strokeWidth={2}
                        draggable={isDraggable}
                        hitStrokeWidth={20}
                        onMouseEnter={() => setHoveredVertexIndex(i)}
                        onMouseLeave={() => setHoveredVertexIndex(null)}
                        onDragEnd={(e) => {
                            if (!isDraggable) return;
                            const nx = Math.round(e.target.x() / GRID_SIZE) * GRID_SIZE;
                            const ny = Math.round(e.target.y() / GRID_SIZE) * GRID_SIZE;
                            e.target.position({ x: nx, y: ny });
                            if (onDragVertex) onDragVertex(i, nx, ny);
                        }}
                        onClick={(e) => {
                            e.cancelBubble = true;
                            if (onVertexClick) onVertexClick(i);
                        }}
                        onTap={(e) => {
                            e.cancelBubble = true;
                            if (onVertexClick) onVertexClick(i);
                        }}
                    />
                );
            })}
        </Group>
    );
};

export default BoundaryPolygon;
