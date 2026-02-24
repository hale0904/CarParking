import React, { useState } from 'react';
import { Button } from 'antd';
import { PlusOutlined, FileAddOutlined } from '@ant-design/icons';
import EditorTopBar from './editor/EditorTopBar';
import EditorToolsPanel from './editor/EditorToolsPanel';
import EditorCanvas from './editor/EditorCanvas';
import EditorPropertiesPanel from './editor/EditorPropertiesPanel';
import { pointInPolygon } from '../utils/geometry';
import './parkingMapEditor.scss';

const SLOT_SIZE = { width: 25, height: 40 };

const EmptyStateMap = ({ onCreate }) => (
    <div className="parking-map-entry">
        <div className="empty-state-content">
            <FileAddOutlined className="empty-icon" />
            <h2>Parking Map Management</h2>
            <p>Create a parking map to start designing zones, slots, and traffic flow.</p>
            <Button type="primary" size="large" icon={<PlusOutlined />} onClick={onCreate}>
                Create Map
            </Button>
        </div>
    </div>
);

const ParkingMapEditor = () => {
    const [isEditorActive, setIsEditorActive] = useState(false);
    const [zones, setZones] = useState([]);
    const [standaloneSlots, setStandaloneSlots] = useState([]);

    const [lanes, setLanes] = useState([]); // [NEW] Lanes state
    const [entrances, setEntrances] = useState([]); // [NEW] Entrances
    const [exits, setExits] = useState([]); // [NEW] Exits
    const [selectedEntity, setSelectedEntity] = useState(null); // { type, id, parentId? }
    const [scale, setScale] = useState(1); // Stage zoom level
    const [boundary, setBoundary] = useState({
        id: 'boundary-1',
        points: [],
        closed: false
    });
    const [draftZone, setDraftZone] = useState({
        points: [],
        closed: false
    });
    const [editorMode, setEditorMode] = useState(null); // 'DRAW_BOUNDARY' | 'EDIT_BOUNDARY' | 'DRAW_ZONE' | null

    // Helpers
    const generateSlots = (count) => {
        return Array.from({ length: count }).map((_, i) => ({
            id: `slot-${Date.now()}-${i}`,
            status: 'available'
        }));
    };

    const handleUpdateBoundary = (newBoundary) => {
        setBoundary(newBoundary);
    };

    // Boundary Logic
    const handleStartDrawBoundary = () => {
        setEditorMode('DRAW_BOUNDARY');
        // Optional: clear existing if starting fresh?
        // For now, assume if we click draw, we might be continuing or starting over.
        // If it's already closed, maybe we want to clear it and start over?
        if (boundary.closed) {
            if (window.confirm("Start new boundary? This will clear the existing one.")) {
                setBoundary({ ...boundary, points: [], closed: false });
            } else {
                setEditorMode(null); // Cancel action
            }
        }
    };

    const handleFinishBoundary = () => {
        if (boundary.points.length < 6) {
            alert("Boundary must have at least 3 points.");
            return;
        }
        setBoundary({ ...boundary, closed: true });
        setEditorMode('EDIT_BOUNDARY'); // Auto switch to edit mode
    };

    const handleClearBoundary = () => {
        if (window.confirm("Are you sure you want to clear the boundary?")) {
            setBoundary({ ...boundary, points: [], closed: false });
            setEditorMode(null);
        }
    };

    const handleCancelDraw = () => {
        setEditorMode(null);
        // If we were drawing (points exist but not closed), maybe keep them? 
        // Or revert? For now, just exit mode.
    };

    const handleUndoBoundary = () => {
        if (boundary.points.length > 0 && !boundary.closed) {
            // Remove last 2 points (x, y)
            const newPoints = boundary.points.slice(0, -2);
            setBoundary({ ...boundary, points: newPoints });
        }
    };

    // Zone Logic
    const handleStartDrawZone = () => {
        setEditorMode('DRAW_ZONE');
        setDraftZone({ points: [], closed: false });
        setSelectedEntity(null);
    };

    const handleFinishZone = () => {
        if (draftZone.points.length < 6) {
            alert("Zone must have at least 3 points.");
            return;
        }
        const newZone = {
            id: `zone-${Date.now()}`,
            name: 'New Zone',
            points: draftZone.points,
            color: '#3b82f6', // Default color
            slotGroups: []
        };
        setZones(prev => [...prev, newZone]);
        setEditorMode(null);
        setSelectedEntity({ type: 'ZONE', id: newZone.id });
        setDraftZone({ points: [], closed: false });
    };

    const handleCancelDrawZone = () => {
        setEditorMode(null);
        setDraftZone({ points: [], closed: false });
    };

    const handleUndoZonePoint = () => {
        if (draftZone.points.length > 0 && !draftZone.closed) {
            const newPoints = draftZone.points.slice(0, -2);
            setDraftZone({ ...draftZone, points: newPoints });
        }
    };

    // Keyboard shortcuts
    React.useEffect(() => {
        const handleKeyDown = (e) => {
            if (editorMode === 'DRAW_BOUNDARY') {
                if (e.key === 'Enter') {
                    handleFinishBoundary();
                } else if (e.key === 'Escape') {
                    handleCancelDraw();
                } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                    e.preventDefault();
                    handleUndoBoundary();
                }
            } else if (editorMode === 'DRAW_ZONE') {
                if (e.key === 'Enter') {
                    handleFinishZone();
                } else if (e.key === 'Escape') {
                    handleCancelDrawZone();
                } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                    e.preventDefault();
                    handleUndoZonePoint();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [editorMode, boundary, draftZone]);


    const updateSlotGroupDimensions = (group, newWidth, newHeight) => {
        const isHorizontal = group.direction === 'horizontal';
        let count = 0;
        if (isHorizontal) {
            count = Math.max(1, Math.floor(newWidth / SLOT_SIZE.width));
        } else {
            count = Math.max(1, Math.floor(newHeight / SLOT_SIZE.height));
        }

        let newSlots = [...group.slots];
        if (count > newSlots.length) {
            const added = generateSlots(count - newSlots.length);
            newSlots = [...newSlots, ...added];
        } else if (count < newSlots.length) {
            newSlots = newSlots.slice(0, count);
        }

        return {
            ...group,
            // Force precise dimensions based on slot count
            width: isHorizontal ? count * SLOT_SIZE.width : SLOT_SIZE.width,
            height: isHorizontal ? SLOT_SIZE.height : count * SLOT_SIZE.height,
            slots: newSlots
        };
    };

    const handleUpdateZone = (id, newProps) => {
        setZones(prev => prev.map(z => z.id === id ? { ...z, ...newProps } : z));
    };

    const handleUpdateSlotGroup = (zoneId, groupId, newProps) => {
        setZones(prev => prev.map(z => {
            if (z.id !== zoneId) return z;
            return {
                ...z,
                slotGroups: z.slotGroups.map(g => {
                    if (g.id !== groupId) return g;

                    let updatedGroup = { ...g, ...newProps };
                    if (newProps.width || newProps.height) {
                        updatedGroup = updateSlotGroupDimensions(
                            updatedGroup,
                            updatedGroup.width,
                            updatedGroup.height
                        );
                    }
                    return updatedGroup;
                })
            };
        }));
    };

    const handleUpdateStandaloneSlot = (id, newProps) => {
        setStandaloneSlots(prev => prev.map(s => s.id === id ? { ...s, ...newProps } : s));
    };

    const handleUpdateLane = (id, newProps) => {
        setLanes(prev => prev.map(l => l.id === id ? { ...l, ...newProps } : l));
    };

    const handleUpdateEntrance = (id, newProps) => {
        setEntrances(prev => prev.map(e => e.id === id ? { ...e, ...newProps } : e));
    };

    const handleUpdateExit = (id, newProps) => {
        setExits(prev => prev.map(e => e.id === id ? { ...e, ...newProps } : e));
    };

    const handleDrop = (type, x, y) => {
        if (type === 'SLOT_GROUP') {
            const targetZone = zones.find(z => pointInPolygon({ x, y }, z.points));

            if (targetZone) {
                const initialCount = 5;
                const newGroup = {
                    id: `sg-${Date.now()}`,
                    x: x,
                    y: y,
                    width: initialCount * SLOT_SIZE.width,
                    height: SLOT_SIZE.height,
                    direction: 'horizontal',
                    slots: generateSlots(initialCount)
                };
                setZones(prev => prev.map(z => {
                    if (z.id !== targetZone.id) return z;
                    return { ...z, slotGroups: [...z.slotGroups, newGroup] };
                }));
                setSelectedEntity({ type: 'SLOT_GROUP', id: newGroup.id, parentId: targetZone.id });
            } else {
                alert("Slot Groups must be placed inside a Zone.");
            }
        } else if (type === 'SLOT') {
            const newSlot = {
                id: `slot-solo-${Date.now()}`,
                x, y,
                status: 'available'
            };
            setStandaloneSlots(prev => [...prev, newSlot]);
            setSelectedEntity({ type: 'SLOT', id: newSlot.id });
        } else if (type === 'LANE') {
            const newLane = {
                id: `lane-${Date.now()}`,
                x, y,
                width: 100,
                height: 20,
                rotation: 0
            };
            setLanes(prev => [...prev, newLane]);
            setSelectedEntity({ type: 'LANE', id: newLane.id });
        } else if (type === 'ENTRANCE') {
            const newEntrance = {
                id: `ent-${Date.now()}`,
                x, y,
                width: 60, // Length
                height: 40, // Thickness
                rotation: 0
            };
            setEntrances(prev => [...prev, newEntrance]);
            setSelectedEntity({ type: 'ENTRANCE', id: newEntrance.id });
        } else if (type === 'EXIT') {
            const newExit = {
                id: `exit-${Date.now()}`,
                x, y,
                width: 60, // Length
                height: 40, // Thickness
                rotation: 0
            };
            setExits(prev => [...prev, newExit]);
            setSelectedEntity({ type: 'EXIT', id: newExit.id });
        }
    };

    const handleSlotClick = (zoneId, groupId, slotId) => {
        if (zoneId && groupId) {
            // Grouped slot
            setSelectedEntity({ type: 'SLOT', id: slotId, parentId: groupId, grandParentId: zoneId });
        } else {
            // Standalone slot would be handled by its own OnClick
        }
    };

    // Cycle status helper for Properties Panel
    const cycleSlotStatus = () => {
        if (!selectedEntity) return;
        const { type, id, parentId, grandParentId } = selectedEntity;

        const nextStatus = (current) => {
            const map = { 'available': 'occupied', 'occupied': 'reserved', 'reserved': 'available' };
            return map[current] || 'available';
        };

        if (type === 'SLOT' && parentId && grandParentId) {
            // Grouped Slot
            setZones(prev => prev.map(z => {
                if (z.id !== grandParentId) return z;
                return {
                    ...z,
                    slotGroups: z.slotGroups.map(g => {
                        if (g.id !== parentId) return g;
                        return {
                            ...g,
                            slots: g.slots.map(s => {
                                if (s.id !== id) return s;
                                return { ...s, status: nextStatus(s.status) };
                            })
                        };
                    })
                };
            }));
        } else if (type === 'SLOT' && !parentId) {
            // Standalone Slot
            setStandaloneSlots(prev => prev.map(s => {
                if (s.id !== id) return s;
                return { ...s, status: nextStatus(s.status) };
            }));
        }
    };

    // Find actual data object for Selected Entity
    let selectedData = null;
    if (selectedEntity) {
        if (selectedEntity.type === 'ZONE') {
            selectedData = zones.find(z => z.id === selectedEntity.id);
        } else if (selectedEntity.type === 'SLOT_GROUP') {
            const z = zones.find(z => z.id === selectedEntity.parentId);
            if (z) selectedData = z.slotGroups.find(g => g.id === selectedEntity.id);
        } else if (selectedEntity.type === 'SLOT') {
            if (selectedEntity.parentId) {
                const z = zones.find(z => z.id === selectedEntity.grandParentId);
                const g = z?.slotGroups.find(g => g.id === selectedEntity.parentId);
                selectedData = g?.slots.find(s => s.id === selectedEntity.id);
                if (selectedData) selectedData = { ...selectedData, parentGroupId: selectedEntity.parentId }; // Inject parent ID for display
            } else {
                selectedData = standaloneSlots.find(s => s.id === selectedEntity.id);
            }
        } else if (selectedEntity.type === 'LANE') {
            selectedData = lanes.find(l => l.id === selectedEntity.id);
        } else if (selectedEntity.type === 'ENTRANCE') {
            selectedData = entrances.find(e => e.id === selectedEntity.id);
        } else if (selectedEntity.type === 'EXIT') {
            selectedData = exits.find(e => e.id === selectedEntity.id);
        }
    }


    const handlePropertiesUpdate = (id, props) => {
        if (!selectedEntity) return;
        if (selectedEntity.type === 'ZONE') handleUpdateZone(id, props);
        else if (selectedEntity.type === 'SLOT_GROUP') handleUpdateSlotGroup(selectedEntity.parentId, id, props);
        else if (selectedEntity.type === 'SLOT' && !selectedEntity.parentId) handleUpdateStandaloneSlot(id, props);
        else if (selectedEntity.type === 'LANE') handleUpdateLane(id, props);
    };

    const handleSave = () => {
        const mapData = {
            metadata: {
                version: "1.0",
                width: 800,
                height: 600,
                scale: scale
            },
            zones,
            standaloneSlots,
            lanes,
            entrances,
            exits
        };
        console.log("Data:", JSON.stringify(mapData, null, 2));
    };

    const handleDeleteEntity = () => {
        if (!selectedEntity) return;
        const { type, id, parentId } = selectedEntity;

        if (type === 'LANE') {
            setLanes(prev => prev.filter(l => l.id !== id));
        } else if (type === 'ENTRANCE') {
            setEntrances(prev => prev.filter(e => e.id !== id));
        } else if (type === 'EXIT') {
            setExits(prev => prev.filter(e => e.id !== id));
        } else if (type === 'ZONE') {
            setZones(prev => prev.filter(z => z.id !== id));
        } else if (type === 'SLOT_GROUP') {
            if (parentId) {
                setZones(prev => prev.map(z => {
                    if (z.id !== parentId) return z;
                    return {
                        ...z,
                        slotGroups: z.slotGroups.filter(g => g.id !== id)
                    };
                }));
            }
        } else if (type === 'SLOT') {
            if (!parentId) {
                // Standalone Slot
                setStandaloneSlots(prev => prev.filter(s => s.id !== id));
            } else {
                // Grouped Slot deletion - usually we don't delete single slots from grid, 
                // but if required, we could mark it as 'removed' or shift others.
                // For now, let's assume Delete is mainly for Standalone.
                // Or maybe the user wants to remove the slot from the array?
                // Given the grid nature, removing one slot might leave a hole.
                // Let's implement removal for now.
                setZones(prev => prev.map(z => {
                    if (z.id !== selectedEntity.grandParentId) return z;
                    return {
                        ...z,
                        slotGroups: z.slotGroups.map(g => {
                            if (g.id !== parentId) return g;
                            return {
                                ...g,
                                slots: g.slots.filter(s => s.id !== id)
                            };
                        })
                    };
                }));
            }
        }

        setSelectedEntity(null);
    };

    if (!isEditorActive) {
        return <EmptyStateMap onCreate={() => setIsEditorActive(true)} />;
    }

    return (
        <div className="parking-map-editor">
            <EditorTopBar
                onSave={handleSave}
                onCancel={() => setIsEditorActive(false)}
                parkingName="Advanced Editor"
            />
            <div className="editor-main-layout">
                <div className="editor-tools-panel">
                    <EditorToolsPanel
                        editorMode={editorMode}
                        setEditorMode={setEditorMode}
                        onStartDraw={handleStartDrawBoundary}
                        onFinishDraw={handleFinishBoundary}
                        onClearBoundary={handleClearBoundary}
                        onCancelDraw={handleCancelDraw}
                        onUndoBoundary={handleUndoBoundary}
                        hasBoundary={boundary.points.length > 0}
                        isBoundaryClosed={boundary.closed}
                        onStartDrawZone={handleStartDrawZone}
                        onFinishDrawZone={handleFinishZone}
                        onCancelDrawZone={handleCancelDrawZone}
                        onUndoDrawZone={handleUndoZonePoint}
                        draftZone={draftZone}
                    />
                </div>

                <div className="editor-canvas-area" style={{ position: 'relative' }}>
                    <EditorCanvas
                        zones={zones}
                        standaloneSlots={standaloneSlots}
                        lanes={lanes}
                        entrances={entrances}
                        exits={exits}
                        selectedEntity={selectedEntity}
                        onSelect={setSelectedEntity}
                        onUpdateZone={handleUpdateZone}
                        onUpdateSlotGroup={handleUpdateSlotGroup}
                        onUpdateStandaloneSlot={handleUpdateStandaloneSlot}
                        onUpdateLane={handleUpdateLane}
                        onUpdateEntrance={handleUpdateEntrance}
                        onUpdateExit={handleUpdateExit}
                        onDrop={handleDrop}

                        scale={scale}
                        setScale={setScale}
                        boundary={boundary}
                        onUpdateBoundary={handleUpdateBoundary}
                        onFinishBoundary={handleFinishBoundary}
                        editorMode={editorMode}
                        onUndoBoundary={handleUndoBoundary}
                        draftZone={draftZone}
                        setDraftZone={setDraftZone}
                        onFinishZone={handleFinishZone}
                    />

                    {/* Zoom Indicator */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: 16,
                            right: 16,
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            padding: '4px 12px',
                            borderRadius: '16px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                            fontSize: '13px',
                            fontWeight: 500,
                            color: (scale <= 0.1 || scale >= 5) ? '#ef4444' : '#374151',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            pointerEvents: 'none',
                            userSelect: 'none',
                            border: (scale <= 0.1 || scale >= 5) ? '1px solid #fecaca' : '1px solid #e5e7eb'
                        }}
                    >
                        <span>{Math.round(scale * 100)}%</span>
                        {scale <= 0.1 && <span style={{ fontSize: '11px', fontWeight: 600 }}>(MIN)</span>}
                        {scale >= 5 && <span style={{ fontSize: '11px', fontWeight: 600 }}>(MAX)</span>}
                    </div>
                </div>

                <div className="editor-properties-panel">
                    <EditorPropertiesPanel
                        selectedData={selectedData}
                        selectedType={selectedEntity?.type}
                        onUpdate={handlePropertiesUpdate}
                        onCycleStatus={cycleSlotStatus}
                        onDelete={handleDeleteEntity}
                    />
                </div>
            </div>
        </div>
    );
};

export default ParkingMapEditor;
