import React, { useState } from 'react';
import { Group, Line, Circle } from 'react-konva';

const GRID_SIZE = 20;

const ZonePolygon = ({
    points,
    closed,
    isDrawing,
    color,
    isSelected,
    onDragVertex,
    onVertexClick,
    onDragMove,
    onDragEnd,
    onClick
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

    // Base color or gray if undefined
    const baseColor = color || '#3b82f6';
    const fillColor = `${baseColor}33`; // 20% opacity approx

    return (
        <Group
            draggable={!isDrawing && closed}
            onDragMove={onDragMove}
            onDragEnd={onDragEnd}
            onClick={onClick}
            onTap={onClick}
        >
            {/* The Polygon Outline/Fill */}
            <Line
                points={points}
                closed={closed}
                stroke={isSelected ? "#2563eb" : baseColor}
                strokeWidth={isSelected ? 3 : 2}
                fill={closed ? fillColor : null}
                dash={closed ? [] : [10, 5]}
                lineCap="round"
                lineJoin="round"
                // Pass events through line when drawing to click on stage
                // but enable when closed to select it
                listening={closed}
            />

            {/* Vertices */}
            {vertices.map((v, i) => {
                const isFirst = i === 0;
                // Vertices are draggable only if polygon is closed and it is selected (edit mode)
                const isDraggable = closed && isSelected;

                // Allow closing by clicking first point
                const isInteractive = isDraggable || (isDrawing && isFirst && canClose);
                const isHovered = hoveredVertexIndex === i;

                return (
                    <Circle
                        key={`v-${i}`}
                        x={v.x}
                        y={v.y}
                        radius={isInteractive && isHovered ? 8 : (isSelected || isDrawing ? 6 : 0)}
                        fill={isInteractive && isHovered ? "#2563eb" : baseColor}
                        stroke="#ffffff"
                        strokeWidth={isSelected || isDrawing ? 2 : 0}
                        draggable={isDraggable}
                        listening={isInteractive || isDrawing || isSelected}
                        hitStrokeWidth={20}
                        onMouseEnter={() => setHoveredVertexIndex(i)}
                        onMouseLeave={() => setHoveredVertexIndex(null)}
                        onDragMove={(e) => {
                            // Stop event propagation so the group doesn't drag
                            if (!isDraggable) return;
                            e.cancelBubble = true;
                        }}
                        onDragEnd={(e) => {
                            if (!isDraggable) return;
                            e.cancelBubble = true; // Stop event propagation
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

export default ZonePolygon;
