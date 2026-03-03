import React, { useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Transformer, Line, Group, Text, Label, Tag } from 'react-konva';
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
    onFinishZone,
    gridRealSize = 2.5,
    parkingUnit = 'm'
}) => {
    const stageRef = useRef(null);
    const transformerRef = useRef(null);
    const hudRef = useRef(null);

    const updateHUD = () => {
        if (!stageRef.current || !hudRef.current) return;
        const stage = stageRef.current;
        const s = stage.scaleX();
        hudRef.current.scale({ x: 1 / s, y: 1 / s });
        hudRef.current.position({ x: -stage.x() / s, y: -stage.y() / s });
        hudRef.current.getLayer()?.batchDraw();
    };

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

    useEffect(() => {
        updateHUD();
    });



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
        updateHUD();
    };

    const handleDragMove = (e) => {
        if (e.target === stageRef.current) {
            updateHUD();
        }
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
        if (slot.isActive === false) fill = "#d1d5db";

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

                {slot.sensorId && (
                    <Rect
                        x={SLOT_SIZE.width - 7}
                        y={2}
                        width={5}
                        height={5}
                        cornerRadius={10}
                        fill={
                            slot.sensorStatus === 'online' ? '#22c55e' :
                                slot.sensorStatus === 'offline' ? '#ef4444' :
                                    '#94a3b8'
                        }
                    />
                )}
            </Group>
        );
    };

    const renderSlotGroup = (group, parentZoneId) => {
        const isSelected = selectedEntity && selectedEntity.id === group.id;
        const isHorizontal = group.direction === 'horizontal';

        // Ensure slots exists
        const slots = group.slots || [];

        return (
            <Group
                key={group.id}
                id={group.id}
                x={group.x}
                y={group.y}
                rotation={group.rotation || 0}
                draggable={editorMode !== 'PAN'}
                onDragEnd={(e) => {
                    const x = Math.round(e.target.x() / GRID_SIZE) * GRID_SIZE;
                    const y = Math.round(e.target.y() / GRID_SIZE) * GRID_SIZE;
                    e.target.x(x); e.target.y(y);
                    onUpdateSlotGroup(parentZoneId, group.id, { x, y });
                }}
                onTransformEnd={(e) => {
                    const node = e.target;
                    const newWidth = group.width * node.scaleX();
                    const newHeight = group.height * node.scaleY();
                    node.scaleX(1);
                    node.scaleY(1);

                    onUpdateSlotGroup(parentZoneId, group.id, {
                        x: node.x(),
                        y: node.y(),
                        width: newWidth,
                        height: newHeight,
                        rotation: node.rotation()
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

                {isSelected && (
                    <Text
                        text={`${group.slots?.length || 0} slots | ${((SLOT_SIZE.width / GRID_SIZE) * gridRealSize).toFixed(1)}${parkingUnit} × ${((SLOT_SIZE.height / GRID_SIZE) * gridRealSize).toFixed(1)}${parkingUnit}`}
                        x={0}
                        y={group.height + 5 / scale}
                        fontSize={Math.max(10, 14 / scale)}
                        fill="#374151"
                        listening={false}
                    />
                )}
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
                    const newWidth = Math.round(gate.width * node.scaleX());
                    node.scaleX(1);
                    node.scaleY(1);

                    const update = {
                        width: newWidth,
                        height: gate.height, // giữ nguyên height gốc
                        x: node.x(),
                        y: node.y(),
                        rotation: Math.round(node.rotation()),
                    };

                    type === 'ENTRANCE'
                        ? onUpdateEntrance(gate.id, update)
                        : onUpdateExit(gate.id, update);
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

                {isSelected && (
                    <Text
                        text={`${((gate.width / GRID_SIZE) * gridRealSize).toFixed(1)}${parkingUnit} × ${((gate.height / GRID_SIZE) * gridRealSize).toFixed(1)}${parkingUnit}`}
                        x={0}
                        y={gate.height + 5 / scale}
                        fontSize={Math.max(10, 14 / scale)}
                        fill="#374151"
                        listening={false}
                    />
                )}
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
                    const newWidth = Math.round(lane.width * node.scaleX());
                    const newHeight = Math.round(lane.height * node.scaleY());
                    node.scaleX(1);
                    node.scaleY(1);
                    onUpdateLane(lane.id, {
                        width: newWidth,
                        height: newHeight,
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

                {isSelected && (
                    <Text
                        text={`${((lane.width / GRID_SIZE) * gridRealSize).toFixed(1)}${parkingUnit} × ${((lane.height / GRID_SIZE) * gridRealSize).toFixed(1)}${parkingUnit}`}
                        x={0}
                        y={lane.height + 5 / scale}
                        fontSize={Math.max(10, 14 / scale)}
                        fill="#374151"
                        listening={false}
                    />
                )}
            </Group>
        );
    };

    const renderScaleBar = () => {
        const niceValues = [1, 2, 5, 10, 25, 50, 100, 200, 500];
        const pixelsPerMeter = (GRID_SIZE / gridRealSize) * scale;
        const targetMeters = 100 / pixelsPerMeter;
        const niceMeter = niceValues.find(v => v >= targetMeters) || 500;
        const barPixels = niceMeter * pixelsPerMeter; // actual pixel width on screen

        return (
            <Group x={20} y={560}>
                <Line
                    points={[0, 0, 0, 8, barPixels, 8, barPixels, 0]}
                    stroke="#374151"
                    strokeWidth={2}
                />
                <Text
                    text={`${niceMeter}${parkingUnit}`}
                    x={barPixels + 10}
                    y={-2}
                    fontSize={12}
                    fill="#374151"
                    fontStyle="bold"
                />
            </Group>
        );
    };

    const computeBBox = (points) => {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (let i = 0; i < points.length; i += 2) {
            if (points[i] < minX) minX = points[i];
            if (points[i] > maxX) maxX = points[i];
            if (points[i + 1] < minY) minY = points[i + 1];
            if (points[i + 1] > maxY) maxY = points[i + 1];
        }
        return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
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
                    onDragMove={handleDragMove}
                    draggable={editorMode === 'PAN'}
                    style={{ cursor: editorMode === 'PAN' ? (stageRef.current?.isDragging() ? 'grabbing' : 'grab') : 'default', backgroundColor: '#f0f2f5' }}
                >
                    <Layer>


                        <BoundaryPolygon
                            points={boundary.points}
                            closed={boundary.closed}
                            isDrawing={editorMode === 'DRAW_BOUNDARY'}
                            scale={scale}
                            gridRealSize={gridRealSize}
                            parkingUnit={parkingUnit}
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
                            scale={scale}
                            gridRealSize={gridRealSize}
                            parkingUnit={parkingUnit}
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
                                        scale={scale}
                                        gridRealSize={gridRealSize}
                                        parkingUnit={parkingUnit}
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

                                    {isSelected && zone.points && zone.points.length > 5 && (() => {
                                        const bbox = computeBBox(zone.points);
                                        const realW = ((bbox.w / GRID_SIZE) * gridRealSize).toFixed(1);
                                        const realH = ((bbox.h / GRID_SIZE) * gridRealSize).toFixed(1);
                                        const fs = Math.max(10, 14 / scale);
                                        return (
                                            <Group listening={false}>
                                                <Text text={`${realW}${parkingUnit}`} x={bbox.x} y={bbox.y - fs - 5} width={bbox.w} align="center" fontSize={fs} fill="#374151" />
                                                <Text text={`${realH}${parkingUnit}`} x={bbox.x + bbox.w + 5} y={bbox.y + bbox.h / 2 - fs / 2} fontSize={fs} fill="#374151" />
                                            </Group>
                                        );
                                    })()}

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

                    {/* HUD Layer that is inversely transformed to stay fixed to view */}
                    <Layer ref={hudRef} listening={false}>
                        {renderScaleBar()}
                    </Layer>
                </Stage>
            </div>
        </div>
    );
};

export default EditorCanvas;
