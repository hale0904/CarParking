import React, { useState, useEffect, useRef } from 'react';
import { Typography, Row, Col, Card, Space, Tag, Divider, Tabs, ConfigProvider, Statistic, Empty, Spin, message } from 'antd';
import { ExpandOutlined } from '@ant-design/icons';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import axiosClient from '../../../../c-lib/axios/axiosClient.service';
import { PARKING_API, STATISTICAL_API } from '../../../../c-lib/constants/auth-api.constant';
import EditorCanvas from '../../../c-map/pages/editor/EditorCanvas';
import { io } from "socket.io-client";


const { Title, Text } = Typography;

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

        const fromNodeId = mongoIdToCode[l.fromNodeId] || l.fromNodeId;
        const toNodeId = mongoIdToCode[l.toNodeId] || l.toNodeId;

        if (fromNodeId && toNodeId) {
            if (!laneNodes.find(n => n.id === fromNodeId))
                laneNodes.push({ id: fromNodeId, x: pts[0], y: pts[1] });
            if (!laneNodes.find(n => n.id === toNodeId))
                laneNodes.push({ id: toNodeId, x: pts[pts.length - 2], y: pts[pts.length - 1] });

            if (!laneEdges.find(e => e.fromNodeId === fromNodeId && e.toNodeId === toNodeId)) {
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

    return { laneNodes, laneEdges };
};

const FloorMapView = ({ floor, metadata }) => {
    const [scale, setScale] = useState(0.5);
    const [editorMode] = useState("PAN");

    return (
        <EditorCanvas
            zones={floor.zones}
            standaloneSlots={floor.standaloneSlots || []}
            laneNodes={floor.laneNodes || []}
            laneEdges={floor.laneEdges || []}
            entrances={floor.entrances || []}
            exits={floor.exits || []}
            boundary={floor.boundary || { points: [], closed: false }}
            selectedEntity={null}
            onSelect={() => { }}
            onUpdateZone={() => { }}
            onUpdateSlotGroup={() => { }}
            onUpdateStandaloneSlot={() => { }}
            onUpdateLane={() => { }}
            onUpdateEntrance={() => { }}
            onUpdateExit={() => { }}
            onDrop={() => { }}
            scale={scale}
            setScale={setScale}
            onUpdateBoundary={() => { }}
            onFinishBoundary={() => { }}
            editorMode={editorMode}
            draftZone={{ points: [], closed: false }}
            setDraftZone={() => { }}
            onFinishZone={() => { }}
            gridRealSize={metadata?.gridRealSize || 2.5}
            parkingUnit={metadata?.unit || 'm'}
        />
    );
};

const DashboardPage = () => {
    const socketRef = useRef(null);
    const [mapData, setMapData] = useState(null);
    const [statsData, setStatsData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const now = new Date();
                const startOfDay = new Date(now);
                startOfDay.setHours(0, 0, 0, 0);

                const res = await axiosClient.post(STATISTICAL_API.GET_STATISTICAL, {
                    expectedArrivalTime: startOfDay.toISOString(),
                    expectedLeaveTime: now.toISOString(),
                    zoneIds: [],
                });

                const zones = res?.data || res || [];

                const aggregated = zones.reduce((acc, zone) => ({
                    totalSlots: acc.totalSlots + zone.totalSlots,
                    available: acc.available + zone.empty,
                    occupied: acc.occupied + zone.used,
                }), { totalSlots: 0, available: 0, occupied: 0 });

                setStatsData(aggregated);
            } catch (err) {
                console.error('Stats error:', err.response?.data);
            }
        };

        const fetchMap = async () => {
            try {
                const res = await axiosClient.post(PARKING_API.GET_LIST, {});
                const list = res?.data || res;

                if (!list || list.length === 0) return;

                const item = list[0];
                const mapped = {
                    metadata: { gridRealSize: 2.5, unit: 'm' },
                    parking: {
                        floors: (item.floors || []).map(floor => ({
                            id: floor.code,
                            name: floor.nameFloor,
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
                                color: zone.color || '#3b82f6',
                                points: zone.points,
                                slotGroups: (zone.groupSlots || []).map(group => ({
                                    id: group.code,
                                    x: group.positionX,
                                    y: group.positionY,
                                    width: group.width,
                                    height: group.height,
                                    rotation: group.rotation,
                                    direction: group.direction,
                                    slots: (group.slots || []).map(slot => ({
                                        id: slot._id,
                                        code: slot.code,
                                        status:
                                            slot.status === 0 ? 'available' :
                                                slot.status === 1 ? 'occupied' :
                                                    slot.status === 2 ? 'reserved' :
                                                        slot.status === 3 ? 'inactive' :
                                                            'available',
                                        sensorId: slot.sensorId,
                                        sensorStatus: slot.sensorStatus
                                    }))
                                }))
                            }))
                        }))
                    }
                };
                setMapData(mapped);
            } catch (err) {
                message.error('Failed to load map: ' + err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMap();
        fetchStats();

        const interval = setInterval(() => {
            fetchMap();
            fetchStats();
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const socket = io("https://be-smartparking.onrender.com", {
            transports: ["websocket"]
        });

        socketRef.current = socket;

        socket.on("slot:update", (data) => {
            const { slotId, sensorStatus } = data;
            const isOccupied = sensorStatus === true || sensorStatus === 1;

            setMapData(prev => {
                if (!prev) return prev;
                const newFloors = prev.parking.floors.map(floor => ({
                    ...floor,
                    zones: floor.zones.map(zone => ({
                        ...zone,
                        slotGroups: zone.slotGroups.map(group => ({
                            ...group,
                            slots: group.slots.map(slot =>
                                slot.id === slotId
                                    ? {
                                        ...slot,
                                        sensorStatus: isOccupied,
                                        status: isOccupied ? "occupied" : "available"
                                    }
                                    : slot
                            )
                        }))
                    }))
                }));
                return { ...prev, parking: { ...prev.parking, floors: newFloors } };
            });
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const allSlotsGlobal = mapData
        ? mapData.parking.floors.flatMap(f =>
            f.zones.flatMap(z =>
                (z.slotGroups || []).flatMap(g => g.slots || [])
            )
        )
        : [];

    const pieData = [
        { name: 'AVAILABLE', value: statsData?.available ?? allSlotsGlobal.filter(s => s.status === 'available').length, color: '#52c41a' },
        { name: 'OCCUPIED', value: statsData?.occupied ?? allSlotsGlobal.filter(s => s.status === 'occupied').length, color: '#595959' },
        { name: 'MALFUNCTION', value: allSlotsGlobal.filter(s => s.status === 'inactive').length, color: '#ff4d4f' },
        { name: 'RESERVED', value: allSlotsGlobal.filter(s => s.status === 'reserved').length, color: '#faad14' },
    ];

    const totalDisplay = statsData?.totalSlots ?? allSlotsGlobal.length;

    return (
        <Spin spinning={isLoading}>
            <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>
                <Title level={4}>Dashboard</Title>

                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    <Col span={12}>
                        <Card
                            title={<span style={{ color: 'white', fontSize: 14 }}>Status Overview</span>}
                            style={{ background: '#1a1a2e', borderRadius: 10, color: 'white', height: '100%', position: 'relative' }}
                            bordered={false}
                            styles={{ header: { borderBottom: '1px solid #333' }, body: { position: 'relative' } }}
                        >
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{ position: 'relative', width: 200, height: 200 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={90}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {pieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div style={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ fontSize: 24, fontWeight: 'bold', color: 'white', lineHeight: 1 }}>
                                            {totalDisplay}
                                        </div>
                                        <div style={{ fontSize: 12, color: '#d9d9d9' }}>Total slot</div>
                                    </div>
                                </div>

                                <div style={{ width: '100%', marginTop: 16 }}>
                                    {pieData.map((item) => (
                                        <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, marginRight: 8 }} />
                                                <Text style={{ color: 'white' }}>{item.name}</Text>
                                            </div>
                                            <Text style={{ color: 'white', fontWeight: 'bold' }}>
                                                {typeof item.value === 'number' ? item.value : 0}
                                            </Text>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <ExpandOutlined style={{ position: 'absolute', bottom: 16, right: 16, color: 'gray', fontSize: 16 }} />
                        </Card>
                    </Col>

                    <Col span={12}>
                        <Card
                            title="Traffic Monitoring"
                            style={{ borderRadius: 10, height: '100%' }}
                            bordered={false}
                        >
                            <Space direction="vertical" size={16} style={{ width: '100%' }}>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <Tag color="blue" style={{ width: 14, height: 14, padding: 0, marginRight: 8, borderRadius: 2 }} />
                                    <Text>Vehicles In (occupied): {allSlotsGlobal.filter(s => s.status === 'occupied').length}</Text>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <Tag color="blue" style={{ width: 14, height: 14, padding: 0, marginRight: 8, borderRadius: 2 }} />
                                    <Text>Vehicles Available: {allSlotsGlobal.filter(s => s.status === 'available').length}</Text>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <Tag color="blue" style={{ width: 14, height: 14, padding: 0, marginRight: 8, borderRadius: 2 }} />
                                    <Text>Total Slots: {allSlotsGlobal.length}</Text>
                                </div>
                            </Space>
                        </Card>
                    </Col>
                </Row>

                <Title level={4}>Parking Map</Title>
                <Divider style={{ marginTop: 0, marginBottom: 16 }} />

                <ConfigProvider
                    theme={{
                        components: {
                            Tabs: {
                                itemActiveColor: '#ff7875',
                                itemSelectedColor: '#ff7875',
                                inkBarColor: '#ff7875',
                            },
                        },
                    }}
                >
                    {mapData ? (
                        <Tabs
                            type="card"
                            defaultActiveKey={mapData.parking.floors[0]?.id}
                            items={mapData.parking.floors.map(floor => {
                                const allSlots = floor.zones.flatMap(z =>
                                    (z.slotGroups || []).flatMap(g => g.slots || [])
                                );
                                return {
                                    key: floor.id,
                                    label: `Floor ${floor.name}`,
                                    children: (
                                        <div style={{ background: '#e8e8e8', minHeight: 400, borderRadius: '0 8px 8px 8px', padding: 24, border: '1px solid #f0f0f0', borderTop: 'none' }}>
                                            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                                                <Col span={6}>
                                                    <Statistic title="Total Slots" value={allSlots.length} />
                                                </Col>
                                                <Col span={6}>
                                                    <Statistic
                                                        title="Available"
                                                        value={allSlots.filter(s => s.status === 'available').length}
                                                        valueStyle={{ color: '#52c41a' }}
                                                    />
                                                </Col>
                                                <Col span={6}>
                                                    <Statistic
                                                        title="Occupied"
                                                        value={allSlots.filter(s => s.status === 'occupied').length}
                                                        valueStyle={{ color: '#ff4d4f' }}
                                                    />
                                                </Col>
                                                <Col span={6}>
                                                    <Statistic
                                                        title="Reserved"
                                                        value={allSlots.filter(s => s.status === 'reserved').length}
                                                        valueStyle={{ color: '#faad14' }}
                                                    />
                                                </Col>
                                            </Row>
                                            <Divider />
                                            {floor.zones.map(zone => (
                                                <Tag key={zone.id} color={zone.color} style={{ marginBottom: 8 }}>
                                                    {zone.name}: {(zone.slotGroups || []).flatMap(g => g.slots || []).length} slots
                                                </Tag>
                                            ))}
                                            <div style={{ marginTop: 16, border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', background: '#f9fafb' }}>
                                                <FloorMapView key={floor.id} floor={floor} metadata={mapData.metadata} />
                                            </div>
                                        </div>
                                    )
                                };
                            })}
                        />
                    ) : (
                        <Empty description="No map saved yet. Go to Parking Map to create one." />
                    )}
                </ConfigProvider>
            </div>
        </Spin>
    );
};

export default DashboardPage;