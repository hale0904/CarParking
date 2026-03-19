import React, { useState, useEffect, useRef } from 'react';
import { Typography, Row, Col, Card, Space, Tag, Divider, Tabs, ConfigProvider, Statistic, Empty, Spin, message } from 'antd';
import { ExpandOutlined } from '@ant-design/icons';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import axiosClient from '../../../../c-lib/axios/axiosClient.service';
import { PARKING_API } from '../../../../c-lib/constants/auth-api.constant';
import EditorCanvas from '../../../c-map/pages/editor/EditorCanvas';
import { io } from "socket.io-client";


const { Title, Text } = Typography;

const pieData = [
    { name: 'AVAILABLE', value: 155, color: '#52c41a' },
    { name: 'OCCUPIED', value: 194, color: '#595959' },
    { name: 'MALFUNCTION', value: 23, color: '#ff4d4f' },
    { name: 'RESERVED', value: 16, color: '#faad14' },
];

const FloorMapView = ({ floor, metadata }) => {
    const [scale, setScale] = useState(0.5);
    const [editorMode] = useState("PAN")

    return (
        <EditorCanvas
            zones={floor.zones}
            standaloneSlots={floor.standaloneSlots || []}
            lanes={floor.lanes || []}
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
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchMap = async () => {
            try {
                const res = await axiosClient.post(PARKING_API.GET_LIST, {});
                const list = res.data;
                console.log("RAW API DATA:", list);

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
                                            slot.status === 0 ? 'available' :   // xanh
                                                slot.status === 1 ? 'occupied' :    // đỏ
                                                    slot.status === 2 ? 'reserved' :    // vàng
                                                        slot.status === 3 ? 'inactive' :    // xám
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

        // ✅ Gọi lần đầu ngay lập tức
        fetchMap();

        // ✅ Sau đó polling mỗi 3 giây
        const interval = setInterval(fetchMap, 2000);

        // ✅ Cleanup khi unmount — đặt ở useEffect, không phải trong fetchMap
        return () => clearInterval(interval);

    }, []);
    useEffect(() => {

        const socket = io("https://be-smartparking.onrender.com", {
            transports: ["websocket"]
        });

        socketRef.current = socket;

        socket.on("slot:update", (data) => {
            const { slotId, sensorStatus } = data;
            console.log("📡 Socket received:", data);
            console.log("Looking for slotId:", data.slotId, typeof data.slotId);

            // ✅ Xử lý rõ ràng hơn
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
                                slot.id === slotId  // ✅ giờ cả 2 đều là string
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

    return (
        <Spin spinning={isLoading}>
            <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>
                <Title level={4}>Dashboard</Title>

                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    {/* Left Col - Status Overview */}
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
                                        <div style={{ fontSize: 24, fontWeight: 'bold', color: 'white', lineHeight: 1 }}>388</div>
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
                                            <Text style={{ color: 'white', fontWeight: 'bold' }}>{item.value}</Text>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <ExpandOutlined style={{ position: 'absolute', bottom: 16, right: 16, color: 'gray', fontSize: 16 }} />
                        </Card>
                    </Col>

                    {/* Right Col - Traffic Monitoring */}
                    <Col span={12}>
                        <Card
                            title="Traffic Monitoring"
                            style={{ borderRadius: 10, height: '100%' }}
                            bordered={false}
                        >
                            <Space direction="vertical" size={16} style={{ width: '100%' }}>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <Tag color="blue" style={{ width: 14, height: 14, padding: 0, marginRight: 8, borderRadius: 2 }} />
                                    <Text>Vehicles In: 200</Text>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <Tag color="blue" style={{ width: 14, height: 14, padding: 0, marginRight: 8, borderRadius: 2 }} />
                                    <Text>Vehicles Out: 6</Text>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <Tag color="blue" style={{ width: 14, height: 14, padding: 0, marginRight: 8, borderRadius: 2 }} />
                                    <Text>Average parking duration: 2 (hour)</Text>
                                </div>
                            </Space>
                        </Card>
                    </Col>
                </Row>

                {/* Section 2 - Parking Map */}
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