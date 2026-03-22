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
import { io } from "socket.io-client";

const SLOT_SIZE = { width: 25, height: 40 };
const SLOT_GAP = 3;
const socket = io("https://be-smartparking.onrender.com");

const GRID_SIZE = 20;

// Convert old Rect-lane (x,y,width,height,rotation) → new Polyline-lane (points[], width)
const migrateLegacyLane = (lane) => {
    if (Array.isArray(lane.points) && lane.points.length >= 4) {
        return { id: lane.id, points: lane.points, width: lane.width ?? 20 };
    }
    const rad = ((lane.rotation || 0) * Math.PI) / 180;
    const len = lane.width_legacy || lane.width || 100;
    return {
        id: lane.id,
        points: [
            lane.x, lane.y,
            lane.x + len * Math.cos(rad),
            lane.y + len * Math.sin(rad),
        ],
        width: lane.height ?? 20,
    };
};

const parseLegacyLanesToGraph = (lanesApiData, apiNodes = []) => {
    const laneNodes = [];
    const laneEdges = [];

    // Build _id → code map to resolve MongoDB ObjectId references
    const mongoIdToCode = {};
    apiNodes.forEach(n => {
        laneNodes.push({ id: n.code, x: n.positionX, y: n.positionY });
        if (n._id) mongoIdToCode[n._id] = n.code;
    });

    lanesApiData.forEach((l, i) => {
        const pts = l.points;
        const w = l.laneWidth || l.height || 20;
        if (!pts || pts.length < 4) return;

        // Resolve: if fromNodeId is a MongoDB _id, convert to code
        const fromNodeId = mongoIdToCode[l.fromNodeId] || l.fromNodeId;
        const toNodeId = mongoIdToCode[l.toNodeId] || l.toNodeId;

        if (fromNodeId && toNodeId) {
            if (!laneNodes.find(n => n.id === fromNodeId))
                laneNodes.push({ id: fromNodeId, x: pts[0], y: pts[1] });
            if (!laneNodes.find(n => n.id === toNodeId))
                laneNodes.push({ id: toNodeId, x: pts[pts.length - 2], y: pts[pts.length - 1] });

            if (!laneEdges.find(e =>
                (e.fromNodeId === fromNodeId && e.toNodeId === toNodeId) ||
                (e.fromNodeId === toNodeId && e.toNodeId === fromNodeId)
            )) {
                laneEdges.push({ id: l.code, fromNodeId, toNodeId, width: w });
            }
        } else {
            // Fallback for legacy lanes without node references
            const TOLERANCE = 15;
            let prevNodeId = null;
            for (let j = 0; j < pts.length; j += 2) {
                const x = pts[j], y = pts[j + 1];
                let node = laneNodes.find(n => Math.hypot(n.x - x, n.y - y) < TOLERANCE);
                if (!node) {
                    node = { id: `node-${l.code || i}-${j}`, x, y };
                    laneNodes.push(node);
                }
                if (prevNodeId && prevNodeId !== node.id) {
                    if (!laneEdges.find(e =>
                        (e.fromNodeId === prevNodeId && e.toNodeId === node.id) ||
                        (e.fromNodeId === node.id && e.toNodeId === prevNodeId)
                    )) {
                        laneEdges.push({ id: `edge-${l.code || i}-${j}`, fromNodeId: prevNodeId, toNodeId: node.id, width: w });
                    }
                }
                prevNodeId = node.id;
            }
        }
    });

    // Filter out orphan nodes that have no connected edges
    const connectedNodes = laneNodes.filter(node =>
        laneEdges.some(e => e.fromNodeId === node.id || e.toNodeId === node.id)
    );

    return { laneNodes: connectedNodes, laneEdges };
};

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
    const [parkingStatus, setParkingStatus] = useState(1);

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
            laneNodes: [],
            laneEdges: [],
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
                    // Thêm tạm vào loadMapData sau dòng const item = list[0];
                    console.log('RAW zones:', JSON.stringify(item.floors?.[0]?.zones, null, 2));
                    setParkingCode(item.code || 'PK001');
                    setParkingName(item.name || 'New Parking Lot');
                    setParkingLocation(item.location || '');
                    setParkingStatus(item.status !== undefined ? item.status : 1);

                    if (item.floors && item.floors.length > 0) {
                        const mappedFloors = item.floors.map(floor => ({
                            id: floor.code,
                            name: floor.nameFloor,
                            level: floor.level || 1,
                            status: floor.status ?? 0,
                            boundary: floor.boundary || { points: [], closed: false },
                            standaloneSlots: [],
                            ...parseLegacyLanesToGraph(floor.lanes || [], floor.laneNodes || []),
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
                                status: zone.status !== undefined ? zone.status : 1,
                                color: zone.color || '#3b82f6',
                                points: zone.points,
                                slotGroups: (zone.groupSlots || []).map(group => ({
                                    id: group.code,
                                    code: group.code,
                                    name: group.nameGroupSlot,
                                    x: group.positionX,
                                    y: group.positionY,
                                    width: group.width,
                                    height: group.height,
                                    rotation: group.rotation,
                                    direction: group.direction,
                                    slots:
                                        (group.slots && group.slots.length > 0
                                            ? group.slots.map(slot => ({
                                                id: slot.code,
                                                code: slot.code,
                                                status:
                                                    slot.status === 0 ? 'available' :   // xanh
                                                        slot.status === 1 ? 'occupied' :    // đỏ
                                                            slot.status === 2 ? 'reserved' :    // vàng
                                                                slot.status === 3 ? 'inactive' :    // xám
                                                                    'available',
                                                sensorId: slot.sensorId || null,
                                                sensorStatus: slot.sensorStatus ? 'online' : 'offline'
                                            }))
                                            : Array.from({ length: group.availableSlots || 0 }).map((_, i) => ({
                                                id: `${zone.code}-${group.code}-S${i + 1}`,
                                                code: `S${i + 1}`,
                                                status: 'available',
                                                sensorId: null,
                                                sensorStatus: null
                                            }))
                                        )
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

    React.useEffect(() => {
        socket.on("sensor_update", (data) => {
            const { slotId, status, sensorStatus } = data;

            setFloors(prev =>
                prev.map(floor => ({
                    ...floor,
                    standaloneSlots: floor.standaloneSlots.map(slot =>
                        slot.id === slotId
                            ? { ...slot, status, sensorStatus }
                            : slot
                    ),
                    zones: floor.zones.map(zone => ({
                        ...zone,
                        slotGroups: zone.slotGroups.map(group => ({
                            ...group,
                            slots: group.slots.map(slot =>
                                slot.id === slotId
                                    ? { ...slot, status, sensorStatus }
                                    : slot
                            )
                        }))
                    }))
                }))
            );
        });

        return () => {
            socket.off("sensor_update");
        };
    }, []);

    // Helpers to mimic old state setters for the active floor
    const activeFloor = floors.find(f => f.id === activeFloorId) || floors[0];
    const { zones, standaloneSlots, laneNodes, laneEdges, entrances, exits, boundary } = activeFloor;

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
    const setLaneNodes = (val) => updateActiveFloor(f => ({ laneNodes: typeof val === 'function' ? val(f.laneNodes) : val }));
    const setLaneEdges = (val) => updateActiveFloor(f => ({ laneEdges: typeof val === 'function' ? val(f.laneEdges) : val }));
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
    const [drawingEdge, setDrawingEdge] = useState(null);

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
            laneNodes: [],
            laneEdges: [],
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
            status: 'unassigned',
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
            status: 1,
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




    const updateSlotGroupDimensions = (group, newWidth, newHeight) => {
        const isHorizontal = group.direction === 'horizontal';
        let count = 0;
        if (isHorizontal) {
            count = Math.max(1, Math.floor(
                (newWidth + SLOT_GAP) / (SLOT_SIZE.width + SLOT_GAP)
            ));
        } else {
            count = Math.max(1, Math.floor(
                (newHeight + SLOT_GAP) / (SLOT_SIZE.height + SLOT_GAP)
            ));
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
            width: isHorizontal
                ? count * SLOT_SIZE.width + (count - 1) * SLOT_GAP
                : SLOT_SIZE.width,
            height: isHorizontal
                ? SLOT_SIZE.height
                : count * SLOT_SIZE.height + (count - 1) * SLOT_GAP,
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

    const handleAddNode = (node) => setLaneNodes(prev => [...prev, node]);
    const handleUpdateNode = (id, changes) => setLaneNodes(prev => prev.map(n => n.id === id ? { ...n, ...changes } : n));
    const handleDeleteNode = (id) => {
        setLaneNodes(prev => prev.filter(n => n.id !== id));
        setLaneEdges(prev => prev.filter(e => e.fromNodeId !== id && e.toNodeId !== id));
        if (selectedEntity?.id === id) setSelectedEntity(null);
        if (drawingEdge?.fromNodeId === id) setDrawingEdge(null);
    };

    const handleAddEdge = (edge) => setLaneEdges(prev => [...prev, edge]);
    const handleUpdateEdge = (id, changes) => setLaneEdges(prev => prev.map(e => e.id === id ? { ...e, ...changes } : e));
    const handleDeleteEdge = (id) => {
        setLaneEdges(prev => prev.filter(e => e.id !== id));
        if (selectedEntity?.id === id) setSelectedEntity(null);
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
            } else if (editorMode === 'DRAW_LANE') {
                if (e.key === 'Escape') {
                    setEditorMode(null);
                    setDrawingEdge(null);
                } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                    e.preventDefault();
                    if (!drawingEdge) return;

                    // Find the last edge that starts from the current drawing node
                    const currentNodeId = drawingEdge.fromNodeId;

                    // Find the edge that ends at currentNodeId (the one we just created)
                    const lastEdge = [...laneEdges].reverse().find(
                        edge => edge.toNodeId === currentNodeId || edge.fromNodeId === currentNodeId
                    );

                    if (lastEdge) {
                        // The previous node is the other end of that edge
                        const prevNodeId = lastEdge.fromNodeId === currentNodeId
                            ? lastEdge.toNodeId
                            : lastEdge.fromNodeId;

                        // Remove the last edge
                        handleDeleteEdge(lastEdge.id);

                        // Remove the current node only if it has no other edges after deletion
                        const remainingEdges = laneEdges.filter(e => e.id !== lastEdge.id);
                        const nodeStillUsed = remainingEdges.some(
                            e => e.fromNodeId === currentNodeId || e.toNodeId === currentNodeId
                        );
                        if (!nodeStillUsed) {
                            handleDeleteNode(currentNodeId);
                        }

                        // Move drawing cursor back to previous node
                        setDrawingEdge({ fromNodeId: prevNodeId });
                    } else {
                        // No edges yet — remove the starting node and cancel drawing
                        handleDeleteNode(currentNodeId);
                        setDrawingEdge(null);
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [editorMode, boundary, draftZone, laneEdges, drawingEdge, handleDeleteEdge, handleDeleteNode]);

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
                    name: 'New Group',
                    rotation: 0,
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
                status: 'unassigned',
                sensorId: null,
                sensorStatus: null
            };
            setStandaloneSlots(prev => [...prev, newSlot]);
            setSelectedEntity({ type: 'SLOT', id: newSlot.id });
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
        return;
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
        } else if (selectedEntity.type === 'LANE_NODE') {
            selectedData = laneNodes.find(n => n.id === selectedEntity.id);
            if (selectedData) {
                selectedData._connectedCount = laneEdges.filter(e => e.fromNodeId === selectedData.id || e.toNodeId === selectedData.id).length;
            }
        } else if (selectedEntity.type === 'LANE_EDGE') {
            selectedData = laneEdges.find(e => e.id === selectedEntity.id);
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
        else if (selectedEntity.type === 'SLOT' && selectedEntity.parentId) handleUpdateGroupedSlot(selectedEntity.grandParentId, selectedEntity.parentId, id, props);
        else if (selectedEntity.type === 'LANE_NODE') handleUpdateNode(id, props);
        else if (selectedEntity.type === 'LANE_EDGE') handleUpdateEdge(id, props);
        else if (selectedEntity.type === 'ENTRANCE') handleUpdateEntrance(id, props);
        else if (selectedEntity.type === 'EXIT') handleUpdateExit(id, props);
    };

    const handleSave = async () => {
        if (!parkingCode?.trim()) {
            message.error("Parking code is required!");
            return;
        }
        setIsSaving(true);
        const hideLoading = message.loading("Saving...", 0);

        try {
            const requestBody = {
                code: parkingCode,
                name: parkingName,
                location: parkingLocation,
                status: parkingStatus || 1,
                totalFloors: floors.length,
                floors: floors.map((floor, fi) => ({
                    code: floor.id?.startsWith('floor-')
                        ? `F${String(fi + 1).padStart(3, '0')}`
                        : floor.id,
                    nameFloor: floor.name,
                    parkingCode: parkingCode,
                    status: floor.status ?? 0,
                    level: floor.level,
                    boundary: {
                        points: floor.boundary.points,
                        closed: floor.boundary.closed
                    },
                    zones: floor.zones.map((zone, zi) => ({
                        code: zone.id || `Z${String(zi + 1).padStart(3, '0')}`,
                        nameZone: zone.name,
                        status: zone.status ?? 0,
                        color: zone.color || '#3b82f6',
                        points: zone.points,
                        groupSlots: (zone.slotGroups || []).map((group, gi) => ({
                            code: group.code || `${zone.id}-GS${gi + 1}`,
                            nameGroupSlot: group.name || `Dãy ${gi + 1}`,
                            status: group.status ?? 0,
                            color: group.color || zone.color || '#3b82f6',
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
                                code: slot.code || `${zone.id}-GS${gi + 1}-S${si + 1}`,
                                nameSlot: slot.code || `${zone.id}-GS${gi + 1}-S${si + 1}`,
                                status: slot.status === 'available' ? 0
                                    : slot.status === 'occupied' ? 1
                                        : slot.status === 'reserved' ? 2
                                            : 3,
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
                    laneNodes: (floor.laneNodes || [])
                        .filter(node =>
                            (floor.laneEdges || []).some(e =>
                                e.fromNodeId === node.id || e.toNodeId === node.id
                            )
                        )
                        .map(node => ({
                            code: node.id,
                            positionX: node.x,
                            positionY: node.y,
                        })),
                    lanes: floor.laneEdges.map((edge, i) => {
                        const fromNode = floor.laneNodes.find(n => n.id === edge.fromNodeId);
                        const toNode = floor.laneNodes.find(n => n.id === edge.toNodeId);
                        if (!fromNode || !toNode) {
                            console.warn(
                                '❌ Lane dropped at save:', edge.id,
                                '| fromNode found:', !!fromNode,
                                '| toNode found:', !!toNode,
                                '| fromNodeId:', edge.fromNodeId,
                                '| toNodeId:', edge.toNodeId,
                                '| available node ids:', floor.laneNodes.map(n => n.id)
                            );
                            return null;
                        }

                        return {
                            // Chỉ giữ code dạng L1, L2, L3... còn lại tạo mới
                            code: `L${i + 1}`,
                            status: 1,
                            points: [fromNode.x, fromNode.y, toNode.x, toNode.y],
                            laneWidth: edge.width ?? 20,
                            fromNodeId: edge.fromNodeId,
                            toNodeId: edge.toNodeId,
                        };
                    }).filter(Boolean)
                }))
            };

            console.log("REQUEST BODY:", JSON.stringify(requestBody, null, 2));
            await axiosClient.post(PARKING_API.UPDATE_MAP, requestBody);
            message.success("Map saved successfully!");

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
                    floors: floors
                }
            };
            saveMap(mapData);

        } catch (error) {
            console.error("Save error status:", error.response?.status);
            console.error("Save error detail:", JSON.stringify(error.response?.data, null, 2));
            message.error("Failed to save: " + (error.response?.data?.message || error.response?.data?.error || error.message));
        } finally {
            hideLoading();
            setIsSaving(false);
        }
    };

    const handleDeleteEntity = () => {
        if (!selectedEntity) return;
        const { type, id, parentId } = selectedEntity;

        if (type === 'LANE_NODE') {
            handleDeleteNode(id);
        } else if (type === 'LANE_EDGE') {
            handleDeleteEdge(id);
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
                        laneNodes={laneNodes}
                        laneEdges={laneEdges}
                        onUpdateNode={handleUpdateNode}
                        onAddNode={handleAddNode}
                        onAddEdge={handleAddEdge}
                        onDeleteNode={handleDeleteNode}
                        onDeleteEdge={handleDeleteEdge}
                        drawingEdge={drawingEdge}
                        setDrawingEdge={setDrawingEdge}
                        entrances={entrances}
                        exits={exits}
                        selectedEntity={selectedEntity}
                        onSelect={setSelectedEntity}
                        onUpdateZone={handleUpdateZone}
                        onUpdateSlotGroup={handleUpdateSlotGroup}
                        onUpdateStandaloneSlot={handleUpdateStandaloneSlot}
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
                            floorStatus: activeFloor.status ?? 1,
                            gridRealSize,
                            status: parkingStatus
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
                                if (props.status !== undefined) setParkingStatus(props.status);
                                if (props.activeFloorLevel !== undefined) {
                                    setFloors(prev => prev.map(f => f.id === activeFloorId ? { ...f, level: props.activeFloorLevel } : f));
                                }
                                if (props.floorStatus !== undefined) {
                                    setFloors(prev => prev.map(f =>
                                        f.id === activeFloorId ? { ...f, status: props.floorStatus } : f
                                    ));
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
