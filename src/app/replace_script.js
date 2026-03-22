const fs = require('fs');

const file_path = "d:\\\\Dev\\\\DoAn\\\\CarParking\\\\src\\\\app\\\\c-app\\\\c-map\\\\pages\\\\ParkingMapEditor.jsx";

let content = fs.readFileSync(file_path, "utf-8");

// Chunk 1: parseLegacyLanesToGraph
const chunk1_target = `const migrateLegacyLane = (lane) => {
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
};`;

const chunk1_replacement = chunk1_target + `

const parseLegacyLanesToGraph = (lanesApiData) => {
    const laneNodes = [];
    const laneEdges = [];
    
    lanesApiData.forEach((l, i) => {
        const lane = migrateLegacyLane({
            id: l.code,
            points: l.points,
            width: l.laneWidth,
            x: l.positionX,
            y: l.positionY,
            width_legacy: l.witdh,
            height: l.height,
            rotation: l.rotation,
        });

        const pts = lane.points || [];
        const w = lane.width || 20;

        if (pts.length < 4) return;
        
        let prevNodeId = null;
        for (let j = 0; j < pts.length; j += 2) {
            const x = pts[j];
            const y = pts[j + 1];
            
            let node = laneNodes.find(n => Math.hypot(n.x - x, n.y - y) < 5);
            if (!node) {
                node = { id: \`node-\${l.code || i}-\${j}\`, x, y };
                laneNodes.push(node);
            }
            
            if (prevNodeId && prevNodeId !== node.id) {
                const edgeExists = laneEdges.find(e => 
                    (e.fromNodeId === prevNodeId && e.toNodeId === node.id) ||
                    (e.fromNodeId === node.id && e.toNodeId === prevNodeId)
                );
                if (!edgeExists) {
                    laneEdges.push({
                        id: \`edge-\${l.code || i}-\${j}\`,
                        fromNodeId: prevNodeId,
                        toNodeId: node.id,
                        width: w
                    });
                }
            }
            prevNodeId = node.id;
        }
    });

    return { laneNodes, laneEdges };
};`;

content = content.replace(chunk1_target, chunk1_replacement);

// Chunk 2: Initial floor state
content = content.replace("lanes: [],", "laneNodes: [],\\n            laneEdges: [],");

// Chunk 3: Load API mappedFloors
const chunk3_target = `                            lanes: (floor.lanes || []).map(l => migrateLegacyLane({
                                id: l.code,
                                points: l.points,          // new API field (may be undefined)
                                width:  l.laneWidth,       // new API field (may be undefined)
                                // legacy fallback fields
                                x: l.positionX,
                                y: l.positionY,
                                width_legacy: l.witdh,
                                height: l.height,
                                rotation: l.rotation,
                            })),`;

const chunk3_replacement = `                            ...parseLegacyLanesToGraph(floor.lanes || []),`;

content = content.replace(chunk3_target, chunk3_replacement);

// Chunk 4: destructuring
content = content.replace("const { zones, standaloneSlots, lanes, entrances, exits, boundary } = activeFloor;", "const { zones, standaloneSlots, laneNodes, laneEdges, entrances, exits, boundary } = activeFloor;");

// Chunk 5: updateActiveFloor
content = content.replace("const setLanes = (val) => updateActiveFloor(f => ({ lanes: typeof val === 'function' ? val(f.lanes) : val }));", "const setLaneNodes = (val) => updateActiveFloor(f => ({ laneNodes: typeof val === 'function' ? val(f.laneNodes) : val }));\\n    const setLaneEdges = (val) => updateActiveFloor(f => ({ laneEdges: typeof val === 'function' ? val(f.laneEdges) : val }));");

// Chunk 6: drawingEdge state
content = content.replace("const [editorMode, setEditorMode] = useState(null);", "const [editorMode, setEditorMode] = useState(null);\\n    const [drawingEdge, setDrawingEdge] = useState(null);");

// Chunk 7: DRAW_LANE keyboard shortcut
const chunk7_target = `                } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                    e.preventDefault();
                    handleUndoZonePoint();
                }
            }
        };`;

const chunk7_replacement = `                } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                    e.preventDefault();
                    handleUndoZonePoint();
                }
            } else if (editorMode === 'DRAW_LANE') {
                if (e.key === 'Escape') {
                    setEditorMode(null);
                    setDrawingEdge(null);
                }
            }
        };`;
content = content.replace(chunk7_target, chunk7_replacement);

// Chunk 8: CRUD
const chunk8_target = "const handleUpdateLane = (id, newProps) => {\\n        setLanes(prev => prev.map(l => l.id === id ? { ...l, ...newProps } : l));\\n    };";

const chunk8_replacement = `    const handleAddNode = (node) => setLaneNodes(prev => [...prev, node]);
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
    };`;
content = content.replace("const handleUpdateLane = (id, newProps) => {\n        setLanes(prev => prev.map(l => l.id === id ? { ...l, ...newProps } : l));\n    };", chunk8_replacement);

// Chunk 9: handleDrop
const chunk9_target = `        } else if (type === 'LANE') {
            const newLane = {
                id: \`lane-\${Date.now()}\`,
                points: [x, y, x + 100, y, x + 200, y],
                width: 20,
            };
            setLanes(prev => [...prev, newLane]);
            setSelectedEntity({ type: 'LANE', id: newLane.id });
        } else if (type === 'ENTRANCE') {`;

const chunk9_replacement = "        } else if (type === 'ENTRANCE') {";
content = content.replace(chunk9_target, chunk9_replacement);

// Chunk 10: selectedData
const chunk10_target = `        } else if (selectedEntity.type === 'LANE') {
            selectedData = lanes.find(l => l.id === selectedEntity.id);
        } else if (selectedEntity.type === 'ENTRANCE') {`;

const chunk10_replacement = `        } else if (selectedEntity.type === 'LANE_NODE') {
            selectedData = laneNodes.find(n => n.id === selectedEntity.id);
            if (selectedData) {
                selectedData._connectedCount = laneEdges.filter(e => e.fromNodeId === selectedData.id || e.toNodeId === selectedData.id).length;
            }
        } else if (selectedEntity.type === 'LANE_EDGE') {
            selectedData = laneEdges.find(e => e.id === selectedEntity.id);
        } else if (selectedEntity.type === 'ENTRANCE') {`;
content = content.replace(chunk10_target, chunk10_replacement);

// Chunk 11: handlePropertiesUpdate
const chunk11_target = "else if (selectedEntity.type === 'LANE') handleUpdateLane(id, props);";
const chunk11_replacement = "else if (selectedEntity.type === 'LANE_NODE') handleUpdateNode(id, props);\\n        else if (selectedEntity.type === 'LANE_EDGE') handleUpdateEdge(id, props);";
content = content.replace("else if (selectedEntity.type === 'LANE') handleUpdateLane(id, props);", "else if (selectedEntity.type === 'LANE_NODE') handleUpdateNode(id, props);\n        else if (selectedEntity.type === 'LANE_EDGE') handleUpdateEdge(id, props);");

// Chunk 12: handleSave
const chunk12_target = `                    lanes: floor.lanes.map((l, i) => {
                        const pts   = l.points || [];
                        const x1    = pts[0] ?? 0;
                        const y1    = pts[1] ?? 0;
                        const xLast = pts[pts.length - 2] ?? x1;
                        const yLast = pts[pts.length - 1] ?? y1;
                        const angle = pts.length >= 4
                            ? Math.round((Math.atan2(yLast - y1, xLast - x1) * 180) / Math.PI)
                            : 0;
                        const totalLen = pts.length >= 4
                            ? Math.round(Math.hypot(xLast - x1, yLast - y1))
                            : 0;
                        return {
                            code: l.id?.match(/^[A-Z]/) ? l.id : \`L\${i + 1}\`,
                            positionX: x1,
                            positionY: y1,
                            height: l.width ?? 20,
                            witdh: totalLen,
                            rotation: angle,
                            status: 1,
                            // Extended fields for new API
                            points: l.points,
                            laneWidth: l.width,
                        };
                    })`;

const chunk12_replacement = `                    lanes: floor.laneEdges.map((edge, i) => {
                        const fromNode = floor.laneNodes.find(n => n.id === edge.fromNodeId);
                        const toNode = floor.laneNodes.find(n => n.id === edge.toNodeId);
                        
                        const pts = fromNode && toNode ? [fromNode.x, fromNode.y, toNode.x, toNode.y] : [0,0,0,0];
                        const x1 = pts[0];
                        const y1 = pts[1];
                        const xLast = pts[2];
                        const yLast = pts[3];

                        const angle = Math.round((Math.atan2(yLast - y1, xLast - x1) * 180) / Math.PI);
                        const totalLen = Math.round(Math.hypot(xLast - x1, yLast - y1));

                        return {
                            code: edge.id?.match(/^[A-Z]/) ? edge.id : \`L\${i + 1}\`,
                            positionX: x1,
                            positionY: y1,
                            height: edge.width ?? 20,
                            witdh: totalLen,
                            rotation: angle,
                            status: 1,
                            points: pts,
                            laneWidth: edge.width,
                        };
                    })`;
content = content.replace(chunk12_target, chunk12_replacement);

// Chunk 13: handleDeleteEntity
const chunk13_target = `        if (type === 'LANE') {
            setLanes(prev => prev.filter(l => l.id !== id));
        } else if (type === 'ENTRANCE') {`;

const chunk13_replacement = `        if (type === 'LANE_NODE') {
            handleDeleteNode(id);
        } else if (type === 'LANE_EDGE') {
            handleDeleteEdge(id);
        } else if (type === 'ENTRANCE') {`;
content = content.replace(chunk13_target, chunk13_replacement);


fs.writeFileSync(file_path, content, "utf-8");

console.log("Done");
