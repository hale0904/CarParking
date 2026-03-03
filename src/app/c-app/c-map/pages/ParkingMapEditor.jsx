import React, { useState } from 'react';
import { Button, Modal, Form, Input, InputNumber, Select, message } from 'antd';
import { PlusOutlined, FileAddOutlined } from '@ant-design/icons';
import { useParkingMapStorage } from '../../../c-lib/hooks/useParkingMapStorage';

const { Option } = Select;
import EditorTopBar from './editor/EditorTopBar';
import EditorToolsPanel from './editor/EditorToolsPanel';
import EditorCanvas from './editor/EditorCanvas';
import EditorPropertiesPanel from './editor/EditorPropertiesPanel';
import { pointInPolygon } from '../utils/geometry';
import './parkingMapEditor.scss';
import axiosClient from '../../../c-lib/axios/axiosClient.service';
import { PARKING_API } from '../../../c-lib/constants/auth-api.constant';

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
    const { saveMap } = useParkingMapStorage();
    const [isEditorActive, setIsEditorActive] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [parkingCode, setParkingCode] = useState('PK001');
    const [parkingLocation, setParkingLocation] = useState('');

    // [MULTIFLOOR STATE]
    const [parkingName, setParkingName] = useState('New Parking Lot');
    const [parkingUnit, setParkingUnit] = useState('m');
    const [gridRealSize, setGridRealSize] = useState(2.5);

    const initialFloorId = 'floor-1';
    const [floors, setFloors] = useState([
        {
            id: initialFloorId,
            name: "1",
            level: 1,
            boundary: { points: [], closed: false },
            zones: [],
            standaloneSlots: [],
            lanes: [],
            entrances: [],
            exits: []
        }
    ]);
    const [activeFloorId, setActiveFloorId] = useState(initialFloorId);

    React.useEffect(() => {
        const loadMapData = async () => {
            try {
                const res = await axiosClient.post(PARKING_API.GET_LIST, {});
                const list = res.data?.data || res.data;
                if (list && list.length > 0) {
                    const item = list[0];
                    setParkingCode(item.code || 'PK001');
                    setParkingName(item.name || 'New Parking Lot');
                    setParkingLocation(item.location || '');

                    if (item.floors && item.floors.length > 0) {
                        const mappedFloors = item.floors.map(floor => ({
                            id: floor.code,
                            name: floor.nameFloor,
                            level: floor.level || 1,
                            boundary: floor.boundary || { points: [], closed: false },
                            standaloneSlots: [],
                            lanes: (floor.lanes || []).map(l => ({
                                id: l.code,
                                x: l.positionX,
                                y: l.positionY,
                                width: l.witdh,
                                height: l.height,
                                rotation: l.rotation
                            })),
                            entrances: (floor.entrances || []).map(e => ({
                                id: e.code,
                                x: e.positionX,
                                y: e.positionY,
                                width: e.witdh,
                                height: e.height,
                                rotation: e.rotation
                            })),
                            exits: (floor.exits || []).map(e => ({
                                id: e.code,
                                x: e.positionX,
                                y: e.positionY,
                                width: e.witdh,
                                height: e.height,
                                rotation: e.rotation
                            })),
                            zones: (floor.zones || []).map(zone => ({
                                id: zone.code,
                                name: zone.nameZone,
                                color: '#3b82f6',
                                points: zone.points,
                                slotGroups: (zone.groupSlots || []).map(group => ({
                                    id: group.code,
                                    name: group.nameGroupSlot,
                                    x: group.positionX,
                                    y: group.positionY,
                                    width: group.width,
                                    height: group.height,
                                    rotation: group.rotation,
                                    direction: group.direction,
                                    slots: (group.slots || []).map(slot => ({
                                        id: slot.code,
                                        status: slot.status === 0 ? 'available' : slot.status === 1 ? 'occupied' : 'reserved',
                                        sensorId: slot.sensorId,
                                        sensorStatus: slot.sensorStatus
                                    }))
                                }))
                            }))
                        }));
                        setFloors(mappedFloors);
                        setActiveFloorId(mappedFloors[0].id);
                    }
                    setIsEditorActive(true);
                }
            } catch (err) {
                console.error("Failed to load map on mount:", err);
            }
        };

        loadMapData();
    }, []);

    // Helpers to mimic old state setters for the active floor
    const activeFloor = floors.find(f => f.id === activeFloorId) || floors[0];
    const { zones, standaloneSlots, lanes, entrances, exits, boundary } = activeFloor;

    const updateActiveFloor = (updates) => {
        setFloors(prev => prev.map(f => {
            if (f.id === activeFloorId) {
                const result = typeof updates === 'function' ? updates(f) : updates;
                return { ...f, ...result };
            }
            return f;
        }));
    };

    const setZones = (val) => updateActiveFloor(f => ({ zones: typeof val === 'function' ? val(f.zones) : val }));
    const setStandaloneSlots = (val) => updateActiveFloor(f => ({ standaloneSlots: typeof val === 'function' ? val(f.standaloneSlots) : val }));
    const setLanes = (val) => updateActiveFloor(f => ({ lanes: typeof val === 'function' ? val(f.lanes) : val }));
    const setEntrances = (val) => updateActiveFloor(f => ({ entrances: typeof val === 'function' ? val(f.entrances) : val }));
    const setExits = (val) => updateActiveFloor(f => ({ exits: typeof val === 'function' ? val(f.exits) : val }));
    const setBoundary = (val) => updateActiveFloor(f => ({ boundary: typeof val === 'function' ? val(f.boundary) : val }));

    const [selectedEntity, setSelectedEntity] = useState(null); // { type, id, parentId? }
    const [scale, setScale] = useState(1); // Stage zoom level

    // Draft states for drawing
    const [draftZone, setDraftZone] = useState({
        points: [],
        closed: false
    });
    const [editorMode, setEditorMode] = useState(null); // 'DRAW_BOUNDARY' | 'EDIT_BOUNDARY' | 'DRAW_ZONE' | null

    // Floor Modal State
    const [isFloorModalVisible, setIsFloorModalVisible] = useState(false);
    const [floorForm] = Form.useForm();

    // Floor Management Handlers
    const handleAddFloor = (values) => {
        const newFloor = {
            id: `floor-${Date.now()}`,
            name: values.name,
            level: values.level,
            boundary: { points: [], closed: false },
            zones: [],
            standaloneSlots: [],
            lanes: [],
            entrances: [],
            exits: []
        };
        setFloors(prev => [...prev, newFloor]);
        setActiveFloorId(newFloor.id);
        setIsFloorModalVisible(false);
        floorForm.resetFields();
    };

    const handleDeleteFloor = (e, floorId) => {
        e.stopPropagation();
        if (floors.length <= 1) {
            alert("Cannot delete the last floor.");
            return;
        }
        if (window.confirm("Are you sure you want to delete this floor? All data will be lost.")) {
            const newFloors = floors.filter(f => f.id !== floorId);
            setFloors(newFloors);
            if (activeFloorId === floorId) {
                setActiveFloorId(newFloors[0].id);
            }
        }
    };

    // Helpers
    const generateSlots = (count) => {
        return Array.from({ length: count }).map((_, i) => ({
            id: `slot-${Date.now()}-${i}`,
            status: 'available',
            sensorId: null,
            sensorStatus: null
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
        if (!boundary.closed) {
            alert("Please draw and close a boundary before adding zones.");
            return;
        }
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

                    // ✅ Chỉ recalculate khi resize thực sự, không phải khi rotate
                    const isResizing = (newProps.width || newProps.height) && !newProps.rotation;
                    if (isResizing) {
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
                status: 'available',
                sensorId: null,
                sensorStatus: null
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


    const handleUpdateSlot = (slotId, updates) => {
        setFloors(prev => prev.map(f => {
            if (f.id !== activeFloorId) return f;

            // Try standalone slots first
            if (f.standaloneSlots.some(s => s.id === slotId)) {
                return {
                    ...f,
                    standaloneSlots: f.standaloneSlots.map(s =>
                        s.id === slotId ? { ...s, ...updates } : s
                    )
                };
            }

            // Otherwise update in zones > slotGroups
            return {
                ...f,
                zones: f.zones.map(zone => ({
                    ...zone,
                    slotGroups: zone.slotGroups.map(group => ({
                        ...group,
                        slots: group.slots.map(slot =>
                            slot.id === slotId ? { ...slot, ...updates } : slot
                        )
                    }))
                }))
            };
        }));
    };

    const handleUpdateGroupedSlot = (zoneId, groupId, slotId, changes) => {
        setZones(prev => prev.map(zone => {
            if (zone.id !== zoneId) return zone;
            return {
                ...zone,
                slotGroups: zone.slotGroups.map(group => {
                    if (group.id !== groupId) return group;
                    return {
                        ...group,
                        slots: group.slots.map(slot =>
                            slot.id === slotId ? { ...slot, ...changes } : slot
                        )
                    };
                })
            };
        }));
    };

    const handlePropertiesUpdate = (id, props) => {
        if (!selectedEntity) return;
        if (selectedEntity.type === 'ZONE') handleUpdateZone(id, props);
        else if (selectedEntity.type === 'SLOT_GROUP') handleUpdateSlotGroup(selectedEntity.parentId, id, props);
        else if (selectedEntity.type === 'SLOT' && !selectedEntity.parentId) handleUpdateStandaloneSlot(id, props);
        else if (selectedEntity.type === 'LANE') handleUpdateLane(id, props);
    };

    const handleSave = async () => {
        setIsSaving(true);
        const hideLoading = message.loading("Saving...", 0);

        try {
            const requestBody = {
                code: parkingCode,
                name: parkingName,
                location: parkingLocation,
                status: 1,
                totalFloors: floors.length,
                floors: floors.map((floor, fi) => ({
                    code: `F${String(fi + 1).padStart(3, '0')}`,
                    nameFloor: floor.name,
                    parkingCode: parkingCode,
                    status: 0,
                    level: floor.level,
                    boundary: {
                        points: floor.boundary.points,
                        closed: floor.boundary.closed
                    },
                    zones: floor.zones.map((zone, zi) => ({
                        code: String(zi),
                        nameZone: zone.name,
                        status: 0,
                        points: zone.points,
                        groupSlots: (zone.slotGroups || []).map((group, gi) => ({
                            code: `GS${gi + 1}`,
                            nameGroupSlot: group.name || `Dãy ${gi + 1}`,
                            positionX: group.x,
                            positionY: group.y,
                            rotation: group.rotation ?? 0,
                            direction: group.direction,
                            width: group.width,
                            height: group.height,
                            availableSlots: group.slots.filter(s => s.status === 'available').length,
                            occupiedSlots: group.slots.filter(s => s.status === 'occupied').length,
                            reservedSlots: group.slots.filter(s => s.status === 'reserved').length,
                            slots: group.slots.map((slot, si) => ({
                                code: `S${si + 1}`,
                                nameSlot: `${zone.name?.split(' ').pop()?.charAt(0) || 'S'}${si + 1}`,
                                status: slot.status === 'available' ? 0 : slot.status === 'occupied' ? 1 : 2,
                                sensorId: slot.sensorId || null,
                                isSensorReal: !!slot.sensorId,
                                isActive: true,
                                sensorStatus: slot.sensorStatus === true || slot.sensorStatus === 'online' ? true : false
                            }))
                        }))
                    })),
                    entrances: floor.entrances.map((e, i) => ({
                        code: `E${i + 1}`,
                        positionX: e.x,
                        positionY: e.y,
                        height: e.height,
                        witdh: e.width,
                        rotation: e.rotation ?? 0,
                        status: 1
                    })),
                    exits: floor.exits.map((e, i) => ({
                        code: `X${i + 1}`,
                        positionX: e.x,
                        positionY: e.y,
                        height: e.height,
                        witdh: e.width,
                        rotation: e.rotation ?? 0,
                        status: 1
                    })),
                    lanes: floor.lanes.map((l, i) => ({
                        code: `L${i + 1}`,
                        positionX: l.x,
                        positionY: l.y,
                        height: l.height,
                        witdh: l.width,
                        rotation: l.rotation ?? 0,
                        status: 1
                    }))
                }))
            };

            await axiosClient.post(PARKING_API.UPDATE_MAP, requestBody);
            message.success("Map saved successfully!");

            const formattedFloors = floors.map(floor => ({
                ...floor,
                zones: floor.zones.map(zone => ({
                    ...zone,
                    slotGroups: (zone.slotGroups || []).map(group => ({
                        id: group.id,
                        x: group.x,
                        y: group.y,
                        width: group.width,
                        height: group.height,
                        rotation: group.rotation ?? 0,
                        direction: group.direction,
                        slots: (group.slots || []).map(slot => ({
                            id: slot.id,
                            status: slot.status,
                            sensorId: slot.sensorId || null,
                            sensorStatus: slot.sensorStatus || null
                        }))
                    }))
                }))
            }));

            const mapData = {
                metadata: {
                    version: "2.0",
                    canvasWidth: 800,
                    canvasHeight: 600,
                    scale: scale,
                    savedAt: new Date().toISOString(),
                    gridSize: 20,
                    gridRealSize: gridRealSize,
                    unit: parkingUnit,
                    slotSize: {
                        widthPx: SLOT_SIZE.width,
                        heightPx: SLOT_SIZE.height,
                        widthReal: (SLOT_SIZE.width / 20) * gridRealSize,
                        heightReal: (SLOT_SIZE.height / 20) * gridRealSize
                    }
                },
                parking: {
                    id: parkingCode,
                    name: parkingName,
                    unit: parkingUnit,
                    floors: formattedFloors
                }
            };
            saveMap(mapData);

        } catch (error) {
            message.error("Failed to save map: " + error.message);
        } finally {
            hideLoading();
            setIsSaving(false);
        }
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

    const assignedSensorIds = Array.from(new Set(
        floors.flatMap(f => [
            ...f.standaloneSlots.map(s => s.sensorId),
            ...f.zones.flatMap(z =>
                (z.slotGroups || []).flatMap(g =>
                    (g.slots || []).map(s => s.sensorId)
                )
            )
        ]).filter(Boolean)
    ));

    return (
        <div className="parking-map-editor">
            <EditorTopBar
                onSave={handleSave}
                onCancel={() => setIsEditorActive(false)}
                parkingName={parkingName}
                isSaving={isSaving}
            />

            {/* Floor Tabs */}
            <div className="floor-tabs-container">
                {floors.map(floor => (
                    <div
                        key={floor.id}
                        className={`floor-tab ${activeFloorId === floor.id ? 'active' : ''}`}
                        onClick={() => {
                            setActiveFloorId(floor.id);
                            setSelectedEntity(null);
                        }}
                    >
                        <span className="floor-name">{floor.name}</span>
                        {floors.length > 1 && (
                            <span className="delete-floor-btn" onClick={(e) => handleDeleteFloor(e, floor.id)}>
                                &times;
                            </span>
                        )}
                    </div>
                ))}
                <div className="floor-tab add-floor-btn" onClick={() => setIsFloorModalVisible(true)}>
                    <PlusOutlined />
                </div>
            </div>

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
                        gridRealSize={gridRealSize}
                        parkingUnit={parkingUnit}
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
                        selectedData={selectedData || (selectedEntity ? null : {
                            parkingName,
                            parkingCode,
                            parkingLocation,
                            parkingUnit,
                            activeFloorLevel: activeFloor.level,
                            gridRealSize
                        })}
                        selectedType={selectedEntity ? selectedEntity.type : 'PARKING_GLOBAL'}
                        selectedEntity={selectedEntity}
                        assignedSensorIds={assignedSensorIds}
                        onUpdateGroupedSlot={handleUpdateGroupedSlot}
                        onUpdateSlot={handleUpdateSlot}
                        onUpdate={(id, props) => {
                            if (!selectedEntity) {
                                // Update Global/Floor properties
                                if (props.parkingName !== undefined) setParkingName(props.parkingName);
                                if (props.parkingCode !== undefined) setParkingCode(props.parkingCode);
                                if (props.parkingLocation !== undefined) setParkingLocation(props.parkingLocation);
                                if (props.parkingUnit !== undefined) setParkingUnit(props.parkingUnit);
                                if (props.gridRealSize !== undefined) setGridRealSize(props.gridRealSize);
                                if (props.activeFloorLevel !== undefined) {
                                    setFloors(prev => prev.map(f => f.id === activeFloorId ? { ...f, level: props.activeFloorLevel } : f));
                                }
                            } else {
                                handlePropertiesUpdate(id, props);
                            }
                        }}
                        onCycleStatus={cycleSlotStatus}
                        onDelete={handleDeleteEntity}
                    />
                </div>
            </div>

            {/* Floor Creation Modal */}
            <Modal
                title="Add New Floor"
                open={isFloorModalVisible}
                onCancel={() => setIsFloorModalVisible(false)}
                onOk={() => floorForm.submit()}
                destroyOnClose
            >
                <Form
                    form={floorForm}
                    layout="vertical"
                    onFinish={handleAddFloor}
                    initialValues={{ name: '2', level: 2 }}
                >
                    <Form.Item
                        name="name"
                        label="Floor Name (e.g., B1, 1, 2)"
                        rules={[{ required: true, message: 'Please input floor name!' }]}
                    >
                        <Input placeholder="1" />
                    </Form.Item>
                    <Form.Item
                        name="level"
                        label="Level (Integer: Basement = -1, Ground = 1)"
                        rules={[{ required: true, message: 'Please input floor level!' }]}
                    >
                        <InputNumber style={{ width: '100%' }} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default ParkingMapEditor;
