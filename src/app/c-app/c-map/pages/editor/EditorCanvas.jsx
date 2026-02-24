import React, { useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Transformer, Line, Group, Text } from 'react-konva';
import BoundaryPolygon from './BoundaryPolygon';
import ZonePolygon from './ZonePolygon';
import { isPolygonInsidePolygon, pointInPolygon } from '../../utils/geometry';

const GRID_SIZE = 20;
const SLOT_SIZE = { width: 25, height: 40 };

export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 5;

const EditorCanvas = ({
    zones,
    standaloneSlots,
    lanes,
    entrances,
    exits,
    selectedEntity,
    onSelect,
    onUpdateZone,
    onUpdateSlotGroup,
    onUpdateStandaloneSlot,
    onUpdateLane,
    onUpdateEntrance,
    onUpdateExit,
    onDrop,

    scale,
    setScale,
    boundary,
    onUpdateBoundary,
    onFinishBoundary,
    editorMode, // 'DRAW_BOUNDARY' | 'EDIT_BOUNDARY' | 'DRAW_ZONE' | null
    draftZone,
    setDraftZone,
    onFinishZone
}) => {
    const stageRef = useRef(null);
    const transformerRef = useRef(null);

    useEffect(() => {
        if (!transformerRef.current || !stageRef.current) return;

        if (!selectedEntity) {
            transformerRef.current.nodes([]);
            return;
        }

        const node = stageRef.current.findOne('#' + selectedEntity.id);

        if (!node) {
            transformerRef.current.nodes([]);
            return;
        }

        if (selectedEntity.type === 'SLOT' && selectedEntity.parentId) {
            transformerRef.current.nodes([]);
        } else if (selectedEntity.type === 'ZONE') {
            transformerRef.current.nodes([]);
        } else {
            transformerRef.current.nodes([node]);
        }

        transformerRef.current.getLayer()?.batchDraw();
    }, [selectedEntity, zones, standaloneSlots, lanes, entrances, exits]);


    const handleWheel = (e) => {
        e.evt.preventDefault();
        const stage = stageRef.current;
        const oldScale = stage.scaleX();

        const pointer = stage.getPointerPosition();

        const scaleBy = 1.1;
        const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;

        // Limit scale
        if (newScale < MIN_ZOOM || newScale > MAX_ZOOM) return;

        setScale(newScale);

        const mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale,
        };

        const newPos = {
            x: pointer.x - mousePointTo.x * newScale,
            y: pointer.y - mousePointTo.y * newScale,
        };

        stage.position(newPos);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const stage = stageRef.current;
        stage.setPointersPositions(e);
        const pointer = stage.getPointerPosition();

        if (pointer) {
            // Convert to absolute coordinates based on Stage transform
            const transform = stage.getAbsoluteTransform().copy();
            transform.invert();
            const absPos = transform.point(pointer);

            const x = Math.round(absPos.x / GRID_SIZE) * GRID_SIZE;
            const y = Math.round(absPos.y / GRID_SIZE) * GRID_SIZE;

            onDrop(e.dataTransfer.getData('toolType'), x, y);
        }
    };

    const renderSlot = (slot, x, y, isGrouped, parentId, grandParentId) => {
        const isSelected = selectedEntity && selectedEntity.id === slot.id;

        let fill = "#86efac"; // available
        if (slot.status === 'occupied') fill = "#f87171";
        if (slot.status === 'reserved') fill = "#fbbf24";

        return (
            <Group
                key={slot.id}
                id={slot.id}
                x={x}
                y={y}
                draggable={!isGrouped && editorMode !== 'PAN'} // Only standalone are draggable, and not in PAN mode
                onDragEnd={!isGrouped ? (e) => {
                    const nx = Math.round(e.target.x() / GRID_SIZE) * GRID_SIZE;
                    const ny = Math.round(e.target.y() / GRID_SIZE) * GRID_SIZE;
                    e.target.x(nx); e.target.y(ny);
                    onUpdateStandaloneSlot(slot.id, { x: nx, y: ny });
                } : undefined}
                onClick={(e) => {
                    if (editorMode === 'PAN') return;
                    e.cancelBubble = true;
                    if (isGrouped) {
                        onSelect({ type: 'SLOT', id: slot.id, parentId: parentId, grandParentId: grandParentId });
                    } else {
                        onSelect({ type: 'SLOT', id: slot.id });
                    }
                }}
            >
                <Rect
                    width={SLOT_SIZE.width}
                    height={SLOT_SIZE.height}
                    fill={fill}
                    stroke={isSelected ? "#2563eb" : "#166534"}
                    strokeWidth={isSelected ? 3 : 1}
                    cornerRadius={2}
                />
                <Text
                    text={isGrouped ? "S" : "1"}
                    width={SLOT_SIZE.width}
                    height={SLOT_SIZE.height}
                    align="center"
                    verticalAlign="middle"
                    fontSize={10}
                    fill="#000"
                />
            </Group>
        );
    };

    const renderSlotGroup = (group, parentZoneId) => {
        const isHorizontal = group.direction === 'horizontal';

        // Ensure slots exists
        const slots = group.slots || [];

        return (
            <Group
                key={group.id}
                id={group.id}
                x={group.x}
                y={group.y}
                draggable={editorMode !== 'PAN'}
                onDragEnd={(e) => {
                    const x = Math.round(e.target.x() / GRID_SIZE) * GRID_SIZE;
                    const y = Math.round(e.target.y() / GRID_SIZE) * GRID_SIZE;
                    e.target.x(x); e.target.y(y);
                    onUpdateSlotGroup(parentZoneId, group.id, { x, y });
                }}
                onTransformEnd={(e) => {
                    const node = e.target;
                    const scaleX = node.scaleX();
                    const scaleY = node.scaleY();
                    node.scaleX(1); node.scaleY(1);

                    const newW = Math.max(SLOT_SIZE.width, Math.round(node.width() * scaleX));
                    const newH = Math.max(SLOT_SIZE.height, Math.round(node.height() * scaleY));

                    onUpdateSlotGroup(parentZoneId, group.id, {
                        width: newW,
                        height: newH,
                        x: node.x(),
                        y: node.y()
                    });
                }}
                onClick={(e) => {
                    if (editorMode === 'PAN') return;
                    e.cancelBubble = true;
                    onSelect({ type: 'SLOT_GROUP', id: group.id, parentId: parentZoneId });
                }}
            >
                {/* Hit area */}
                <Rect width={group.width} height={group.height} fill="transparent" />

                {slots.map((slot, i) => {
                    const sx = isHorizontal ? i * SLOT_SIZE.width : 0;
                    const sy = isHorizontal ? 0 : i * SLOT_SIZE.height;
                    return renderSlot(slot, sx, sy, true, group.id, parentZoneId);
                })}
            </Group>
        );

    };

    const renderGate = (gate, type) => {
        const isSelected = selectedEntity && selectedEntity.id === gate.id;
        const fill = type === 'ENTRANCE' ? '#86efac' : '#fca5a5';

        return (
            <Group
                key={gate.id}
                id={gate.id}
                x={gate.x}
                y={gate.y}
                rotation={gate.rotation || 0}
                draggable={editorMode !== 'PAN'}
                onDragEnd={(e) => {
                    const x = Math.round(e.target.x() / GRID_SIZE) * GRID_SIZE;
                    const y = Math.round(e.target.y() / GRID_SIZE) * GRID_SIZE;
                    e.target.x(x);
                    e.target.y(y);

                    type === 'ENTRANCE'
                        ? onUpdateEntrance(gate.id, { x, y })
                        : onUpdateExit(gate.id, { x, y });
                }}
                onTransformEnd={(e) => {
                    const node = e.target;
                    const scaleX = node.scaleX();
                    node.scaleX(1);
                    node.scaleY(1); // lock thickness

                    const newWidth = Math.round(node.width() * scaleX);

                    type === 'ENTRANCE'
                        ? onUpdateEntrance(gate.id, {
                            width: newWidth,
                            x: node.x(),
                            y: node.y(),
                            rotation: Math.round(node.rotation()),
                        })
                        : onUpdateExit(gate.id, {
                            width: newWidth,
                            x: node.x(),
                            y: node.y(),
                            rotation: Math.round(node.rotation()),
                        });
                }}
                onClick={(e) => {
                    if (editorMode === 'PAN') return;
                    e.cancelBubble = true;
                    onSelect({ type, id: gate.id });
                }}
            >
                <Rect
                    width={gate.width}
                    height={gate.height}
                    fill={fill}
                    stroke={isSelected ? '#2563eb' : '#64748b'}
                    strokeWidth={isSelected ? 2 : 1}
                />

                <Line
                    points={[0, gate.height / 2, gate.width, gate.height / 2]}
                    stroke="#fff"
                    strokeWidth={2}
                />

                <Text
                    text={type === 'ENTRANCE' ? 'IN' : 'OUT'}
                    x={4}
                    y={gate.height / 2 - 6}
                    fontSize={10}
                    fill="#1f2937"
                />
            </Group>
        );
    };


    const renderLane = (lane) => {
        const isSelected = selectedEntity && selectedEntity.id === lane.id;

        return (
            <Group
                key={lane.id}
                id={lane.id}
                x={lane.x}
                y={lane.y}
                width={lane.width}
                height={lane.height}
                rotation={lane.rotation || 0}
                draggable={editorMode !== 'PAN'}
                onDragEnd={(e) => {
                    const x = Math.round(e.target.x() / GRID_SIZE) * GRID_SIZE;
                    const y = Math.round(e.target.y() / GRID_SIZE) * GRID_SIZE;
                    e.target.x(x); e.target.y(y);
                    onUpdateLane(lane.id, { x, y });
                }}
                onTransformEnd={(e) => {
                    const node = e.target;
                    const scaleX = node.scaleX();
                    const scaleY = node.scaleY();
                    node.scaleX(1); node.scaleY(1);
                    onUpdateLane(lane.id, {
                        width: Math.round(node.width() * scaleX),
                        height: Math.round(node.height() * scaleY),
                        x: node.x(),
                        y: node.y(),
                        rotation: Math.round(node.rotation())
                    });
                }}
                onClick={(e) => {
                    if (editorMode === 'PAN') return;
                    e.cancelBubble = true;
                    onSelect({ type: 'LANE', id: lane.id });
                }}
            >
                <Rect
                    width={lane.width}
                    height={lane.height}
                    fill="#cbd5e1" // slate-300
                    stroke={isSelected ? "#2563eb" : "#94a3b8"}
                    strokeWidth={isSelected ? 2 : 1}
                // dash={[5, 5]} // Optional: dashed line for lane markings?
                />
                {/* Optional: Add a center line or lane markings */}
                <Line
                    points={[0, lane.height / 2, lane.width, lane.height / 2]}
                    stroke="#fff"
                    strokeWidth={2}
                    dash={[10, 5]}
                />
                <Text
                    text={`Len: ${Math.round(lane.width / 10)}m`}
                    x={5}
                    y={lane.height - 12}
                    fontSize={10}
                    fill="#64748b"
                />
            </Group>
        );
    };



    return (
        <div className="editor-canvas-area">
            <div
                className="canvas-viewport"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                style={{ backgroundColor: '#f9fafb', border: '1px solid #ddd', overflow: 'hidden' }}
            >
                <Stage
                    width={800}
                    height={600}
                    scaleX={scale}
                    scaleY={scale}
                    ref={stageRef}
                    onMouseDown={(e) => {
                        const stage = stageRef.current;
                        if (editorMode === 'PAN') return; // Allow dragging logic from Stage prop

                        if (e.target !== stage) {
                            return;
                        }

                        onSelect(null);

                        if (editorMode === 'DRAW_BOUNDARY') {
                            const pos = stage.getPointerPosition();
                            const transform = stage.getAbsoluteTransform().copy();
                            transform.invert();
                            const abs = transform.point(pos);

                            const x = Math.round(abs.x / GRID_SIZE) * GRID_SIZE;
                            const y = Math.round(abs.y / GRID_SIZE) * GRID_SIZE;

                            onUpdateBoundary({
                                ...boundary,
                                points: [...(boundary?.points || []), x, y]
                            });
                        } else if (editorMode === 'DRAW_ZONE') {
                            const pos = stage.getPointerPosition();
                            const transform = stage.getAbsoluteTransform().copy();
                            transform.invert();
                            const abs = transform.point(pos);

                            const x = Math.round(abs.x / GRID_SIZE) * GRID_SIZE;
                            const y = Math.round(abs.y / GRID_SIZE) * GRID_SIZE;

                            if (boundary.closed && !pointInPolygon({ x, y }, boundary.points)) {
                                alert("Zone point must be inside the boundary.");
                                return;
                            }

                            setDraftZone({
                                ...draftZone,
                                points: [...(draftZone?.points || []), x, y]
                            });
                        }
                    }}
                    onWheel={handleWheel}
                    draggable={editorMode === 'PAN'}
                    style={{ cursor: editorMode === 'PAN' ? (stageRef.current?.isDragging() ? 'grabbing' : 'grab') : 'default', backgroundColor: '#f0f2f5' }}
                >
                    <Layer>


                        <BoundaryPolygon
                            points={boundary.points}
                            closed={boundary.closed}
                            isDrawing={editorMode === 'DRAW_BOUNDARY'}
                            onDragVertex={(index, x, y) => {
                                const newPoints = [...boundary.points];
                                newPoints[index * 2] = x;
                                newPoints[index * 2 + 1] = y;
                                onUpdateBoundary({ ...boundary, points: newPoints });
                            }}
                            onVertexClick={(index) => {
                                // Close logic if clicking on first vertex while drawing
                                if (editorMode === 'DRAW_BOUNDARY' && index === 0 && boundary.points.length >= 6) {
                                    onFinishBoundary();
                                }
                            }}
                        />

                        {/* Draft Zone */}
                        <ZonePolygon
                            points={draftZone?.points}
                            closed={draftZone?.closed}
                            isDrawing={editorMode === 'DRAW_ZONE'}
                            onVertexClick={(index) => {
                                if (editorMode === 'DRAW_ZONE' && index === 0 && draftZone.points.length >= 6) {
                                    onFinishZone();
                                }
                            }}
                        />

                        {/* Render Zones */}
                        {zones.map(zone => {
                            const isSelected = selectedEntity && selectedEntity.id === zone.id;
                            return (
                                <Group
                                    key={zone.id}
                                    id={zone.id}
                                >
                                    <ZonePolygon
                                        points={zone.points}
                                        closed={true}
                                        color={zone.color}
                                        isSelected={isSelected}
                                        onDragVertex={(index, x, y) => {
                                            if (boundary.closed && !pointInPolygon({ x, y }, boundary.points)) {
                                                alert("Vertex must remain inside boundary.");
                                                onUpdateZone(zone.id, { points: [...zone.points] });
                                                return;
                                            }
                                            const newPoints = [...zone.points];
                                            newPoints[index * 2] = x;
                                            newPoints[index * 2 + 1] = y;
                                            onUpdateZone(zone.id, { points: newPoints });
                                        }}
                                        onDragEnd={(e) => {
                                            if (editorMode === 'PAN') return;
                                            const node = e.target;

                                            const dx = Math.round(node.x() / GRID_SIZE) * GRID_SIZE;
                                            const dy = Math.round(node.y() / GRID_SIZE) * GRID_SIZE;
                                            node.x(0); node.y(0);

                                            if (dx === 0 && dy === 0) return;

                                            const newPoints = zone.points.map((p, i) => p + (i % 2 === 0 ? dx : dy));

                                            if (boundary.closed && !isPolygonInsidePolygon(newPoints, boundary.points)) {
                                                alert("Zone must remain inside boundary.");
                                                onUpdateZone(zone.id, { points: [...zone.points] });
                                                return;
                                            }

                                            const updatedGroups = (zone.slotGroups || []).map(g => ({
                                                ...g,
                                                x: g.x + dx,
                                                y: g.y + dy
                                            }));

                                            onUpdateZone(zone.id, { points: newPoints, slotGroups: updatedGroups });
                                        }}
                                        onClick={() => {
                                            if (editorMode !== 'PAN') onSelect({ type: 'ZONE', id: zone.id });
                                        }}
                                    />
                                    {zone.points && zone.points.length > 1 && (
                                        <Text text={zone.name} x={zone.points[0]} y={zone.points[1] - 20} fontSize={16} fill="#374151" fontStyle="bold" />
                                    )}

                                    {zone.slotGroups && zone.slotGroups.map(group => renderSlotGroup(group, zone.id))}
                                </Group>
                            );
                        })}

                        {lanes && lanes.map(lane => renderLane(lane))}

                        {entrances && entrances.map(ent => renderGate(ent, 'ENTRANCE'))}
                        {exits && exits.map(ext => renderGate(ext, 'EXIT'))}

                        {standaloneSlots.map(slot => renderSlot(slot, slot.x, slot.y, false))}

                        <Transformer
                            ref={transformerRef}
                            enabledAnchors={['middle-left', 'middle-right']}
                            rotateEnabled={true}
                        />
                    </Layer>
                </Stage>
            </div>
        </div>
    );
};

export default EditorCanvas;
