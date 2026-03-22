import React from 'react';
import { Empty, Form, Input, InputNumber, Select, Button, Tag, Typography, ColorPicker } from 'antd';
import { ReloadOutlined, InfoCircleOutlined } from '@ant-design/icons';

import { MOCK_SENSORS } from '../../../../../mocks/sensors';

const { Title, Text } = Typography;
const { Option } = Select;

const EditorPropertiesPanel = ({ selectedData, selectedType, selectedEntity, onUpdate, onUpdateGroupedSlot, onUpdateSlot, onCycleStatus, onDelete, assignedSensorIds = [] }) => {
    if (!selectedData) {
        return (
            <div className="empty-props">
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Select an element to view and edit its properties"
                />
            </div>
        );
    }

    const handleChange = (field, value) => {
        // Ant Design InputNumber returns value directly, Input returns event
        let val = value;
        if (value && value.target) {
            val = value.target.value;
        }
        if (selectedType === 'SLOT' && selectedEntity?.parentId) {
            onUpdateGroupedSlot(
                selectedEntity.grandParentId,
                selectedEntity.parentId,
                selectedEntity.id,
                { [field]: val }
            );
        } else {
            onUpdate(selectedData.id, { [field]: val });
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'available': return 'green';
            case 'occupied': return 'red';
            case 'reserved': return 'gold';
            default: return 'default';
        }
    };

    return (
        <div className="properties-content">
            <div className="panel-header">
                <Title level={5} style={{ margin: 0 }}>
                    {selectedType === 'PARKING_GLOBAL' && 'Global Properties'}
                    {selectedType === 'ZONE' && 'Zone Properties'}
                    {selectedType === 'SLOT_GROUP' && 'Group Properties'}
                    {selectedType === 'SLOT' && 'Slot Properties'}
                    {selectedType === 'LANE' && 'Lane Properties'}
                    {selectedType === 'LANE_EDGE' && 'Lane Edge Properties'}
                    {selectedType === 'LANE_NODE' && 'Lane Node Properties'}
                    {selectedType === 'ENTRANCE' && 'Entrance Properties'}
                    {selectedType === 'EXIT' && 'Exit Properties'}
                </Title>
                {selectedData?.id && <Tag color="blue">{selectedData.id}</Tag>}
            </div>

            <Form layout="vertical" size="small">
                {selectedType === 'SLOT' ? (
                    <>
                        <Form.Item label="Status">
                            <Select
                                value={selectedData.status || 'unassigned'}
                                onChange={(val) => handleChange('status', val)}
                                style={{ width: '100%' }}
                                disabled={true}
                            >
                                <Option value="unassigned"><span style={{ color: '#d1d5db', fontWeight: 'bold' }}>UNASSIGNED</span></Option>
                                <Option value="available"><span style={{ color: '#86efac', fontWeight: 'bold' }}>AVAILABLE</span></Option>
                                <Option value="occupied"><span style={{ color: '#f87171', fontWeight: 'bold' }}>OCCUPIED</span></Option>
                                <Option value="reserved"><span style={{ color: '#fbbf24', fontWeight: 'bold' }}>RESERVED</span></Option>
                            </Select>
                            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Trạng thái cập nhật tự động từ cảm biến IoT</div>
                        </Form.Item>

                        <Form.Item label="IoT Sensor ID" style={{ marginBottom: '8px' }}>
                            <Select
                                showSearch
                                value={selectedData.sensorId || ''}
                                placeholder="-- Chọn sensor --"
                                optionFilterProp="children"
                                onChange={(val) => {
                                    const newVal = val === '' ? null : val;
                                    const selectedSensor = MOCK_SENSORS.find(s => s.id === newVal);

                                    const updates = { sensorId: newVal };
                                    if (selectedSensor) {
                                        updates.sensorStatus = selectedSensor.sensorStatus;
                                    }

                                    if (onUpdateSlot) {
                                        onUpdateSlot(selectedData.id, updates);
                                    } else {
                                        handleChange('sensorId', updates.sensorId);
                                        if (updates.sensorStatus !== undefined) {
                                            handleChange('sensorStatus', updates.sensorStatus);
                                        }
                                    }
                                }}
                                style={{ width: '100%' }}
                            >
                                <Option value="">-- Chọn sensor --</Option>
                                {MOCK_SENSORS.map(sensor => {
                                    const isAssignedToOther = assignedSensorIds.includes(sensor.id) && sensor.id !== selectedData.sensorId;
                                    if (isAssignedToOther) return null;

                                    return (
                                        <Option key={sensor.id} value={sensor.id}>
                                            {sensor.name} — {sensor.zone}
                                        </Option>
                                    );
                                })}
                            </Select>
                        </Form.Item>
                        <Form.Item label="Sensor Status" style={{ marginBottom: '16px' }}>
                            <Select
                                value={selectedData.sensorStatus || ''}
                                onChange={(val) => {
                                    const newVal = val === '' ? null : val;
                                    if (onUpdateSlot) onUpdateSlot(selectedData.id, { sensorStatus: newVal });
                                    else handleChange('sensorStatus', newVal);
                                }}
                                style={{ width: '100%' }}
                            >
                                <Option value="">-- None --</Option>
                                <Option value="online">Online</Option>
                                <Option value="offline">Offline</Option>
                            </Select>
                        </Form.Item>

                        {selectedData.parentGroupId && (
                            <Form.Item label="Parent Group">
                                <Input value={selectedData.parentGroupId} disabled prefix={<InfoCircleOutlined style={{ color: '#bfbfbf' }} />} />
                            </Form.Item>
                        )}

                        {!selectedData.parentGroupId && (
                            <div className="form-row" style={{ display: 'flex', gap: '12px' }}>
                                <Form.Item label="X Position" style={{ flex: 1 }}>
                                    <InputNumber
                                        style={{ width: '100%' }}
                                        value={selectedData.x}
                                        onChange={(val) => handleChange('x', val)}
                                    />
                                </Form.Item>
                                <Form.Item label="Y Position" style={{ flex: 1 }}>
                                    <InputNumber
                                        style={{ width: '100%' }}
                                        value={selectedData.y}
                                        onChange={(val) => handleChange('y', val)}
                                    />
                                </Form.Item>
                            </div>
                        )}
                    </>
                ) : selectedType === 'PARKING_GLOBAL' ? (
                    <>
                        {/* ── PARKING SECTION ── */}
                        <div style={{
                            fontSize: 11, fontWeight: 600, color: '#6b7280',
                            textTransform: 'uppercase', letterSpacing: '0.05em',
                            marginBottom: 8
                        }}>
                            🅿️ Parking Info
                        </div>

                        <Form.Item label="Parking Name">
                            <Input
                                value={selectedData.parkingName}
                                onChange={(e) => handleChange('parkingName', e)}
                            />
                        </Form.Item>
                        <Form.Item label="Status">
                            <Select
                                value={selectedData.status !== undefined ? selectedData.status : 1}
                                onChange={(val) => handleChange('status', val)}
                            >
                                <Option value={0}>Editing</Option>
                                <Option value={1}>Active</Option>
                                <Option value={2}>Inactive</Option>
                            </Select>
                        </Form.Item>
                        <Form.Item label="Parking Code">
                            <Input
                                value={selectedData.parkingCode}
                                onChange={(e) => handleChange('parkingCode', e)}
                                placeholder="e.g. PK001"
                            />
                        </Form.Item>
                        <Form.Item label="Location">
                            <Input
                                value={selectedData.parkingLocation}
                                onChange={(e) => handleChange('parkingLocation', e)}
                                placeholder="e.g. Phường 8, TP HCM"
                            />
                        </Form.Item>

                        {/* ── FLOOR SECTION ── */}
                        <div style={{
                            fontSize: 11, fontWeight: 600, color: '#6b7280',
                            textTransform: 'uppercase', letterSpacing: '0.05em',
                            marginTop: 20, marginBottom: 8,
                            paddingTop: 16, borderTop: '1px solid #f0f0f0'
                        }}>
                            🏢 Current Floor
                        </div>

                        <Form.Item label="Floor Level">
                            <InputNumber
                                style={{ width: '100%' }}
                                value={selectedData.activeFloorLevel}
                                onChange={(val) => handleChange('activeFloorLevel', val)}
                                placeholder="e.g. -1 for B1, 1 for ground"
                            />
                        </Form.Item>
                        <Form.Item label="Floor Status">
                            <Select
                                value={selectedData.floorStatus !== undefined ? selectedData.floorStatus : 1}
                                onChange={(val) => handleChange('floorStatus', val)}
                            >
                                <Option value={0}>Inactive</Option>
                                <Option value={1}>Active</Option>
                                <Option value={2}>Maintenance</Option>
                            </Select>
                        </Form.Item>
                        <Form.Item label="Measurement Unit">
                            <Select
                                value={selectedData.parkingUnit}
                                onChange={(val) => handleChange('parkingUnit', val)}
                            >
                                <Option value="m">Meters (m)</Option>
                                <Option value="ft">Feet (ft)</Option>
                            </Select>
                        </Form.Item>
                        <Form.Item label={`1 grid cell = [ ${selectedData.gridRealSize || 2.5} ] ${selectedData.parkingUnit}`}>
                            <InputNumber
                                style={{ width: '100%' }}
                                value={selectedData.gridRealSize}
                                onChange={(val) => handleChange('gridRealSize', val)}
                                placeholder="e.g. 2.5"
                                step={0.1}
                                min={0.1}
                            />
                        </Form.Item>
                    </>
                ) : selectedType === 'LANE' ? null : (
                    <>
                        {selectedType === 'ZONE' && (
                            <>
                                <Form.Item label="Status">
                                    <Select
                                        value={selectedData.status !== undefined ? selectedData.status : 1}
                                        onChange={(val) => handleChange('status', val)}
                                    >
                                        <Option value={0}>Editing</Option>
                                        <Option value={1}>Active</Option>
                                        <Option value={2}>Inactive</Option>
                                    </Select>
                                </Form.Item>
                                <Form.Item label="Zone Name">
                                    <Input
                                        value={selectedData.name}
                                        onChange={(e) => handleChange('name', e)}
                                    />
                                </Form.Item>
                                <Form.Item label="Color">
                                    <ColorPicker
                                        value={selectedData.color || '#3b82f6'}
                                        onChange={(color) => {
                                            const hexString = typeof color === 'string' ? color : color.toHexString();
                                            handleChange('color', hexString);
                                        }}
                                        showText
                                    />
                                </Form.Item>
                            </>
                        )}

                        {selectedType === 'SLOT_GROUP' && (
                            <>
                                <Form.Item label="Name">
                                    <Input
                                        value={selectedData.name || ''}
                                        onChange={(e) => handleChange('name', e)}
                                    />
                                </Form.Item>

                                <div className="form-row" style={{ display: 'flex', gap: '12px' }}>
                                    <Form.Item label="X Position" style={{ flex: 1 }}>
                                        <InputNumber
                                            style={{ width: '100%' }}
                                            value={selectedData.x}
                                            onChange={(val) => handleChange('x', val)}
                                        />
                                    </Form.Item>
                                    <Form.Item label="Y Position" style={{ flex: 1 }}>
                                        <InputNumber
                                            style={{ width: '100%' }}
                                            value={selectedData.y}
                                            onChange={(val) => handleChange('y', val)}
                                        />
                                    </Form.Item>
                                </div>

                                <div className="form-row" style={{ display: 'flex', gap: '12px' }}>
                                    <Form.Item label="Width" style={{ flex: 1 }}>
                                        <InputNumber
                                            style={{ width: '100%' }}
                                            value={selectedData.width}
                                            onChange={(val) => handleChange('width', val)}
                                        />
                                    </Form.Item>
                                    <Form.Item label="Height" style={{ flex: 1 }}>
                                        <InputNumber
                                            style={{ width: '100%' }}
                                            value={selectedData.height}
                                            onChange={(val) => handleChange('height', val)}
                                        />
                                    </Form.Item>
                                </div>
                            </>
                        )}
                    </>
                )}

                {
                    selectedType === 'LANE_EDGE' && (
                        <>
                            <Form.Item label="Edge Width / Thickness (px)">
                                <InputNumber
                                    style={{ width: '100%' }}
                                    min={10} max={60}
                                    value={selectedData.width ?? 20}
                                    onChange={(val) => handleChange('width', val)}
                                />
                            </Form.Item>
                            <Form.Item label="Connected Nodes">
                                <Text code>{selectedData.fromNodeId}</Text>
                                <span style={{ margin: '0 8px' }}>↔</span>
                                <Text code>{selectedData.toNodeId}</Text>
                            </Form.Item>
                        </>
                    )
                }

                {
                    selectedType === 'LANE_NODE' && (
                        <>
                            <div className="form-row" style={{ display: 'flex', gap: '12px' }}>
                                <Form.Item label="X Position" style={{ flex: 1 }}>
                                    <InputNumber style={{ width: '100%' }} value={selectedData.x} disabled />
                                </Form.Item>
                                <Form.Item label="Y Position" style={{ flex: 1 }}>
                                    <InputNumber style={{ width: '100%' }} value={selectedData.y} disabled />
                                </Form.Item>
                            </div>
                            <Form.Item label="Connected Edges">
                                <Text strong>{selectedData._connectedCount ?? 0}</Text>
                                {selectedData._connectedCount === 1 && (
                                    <div style={{ color: '#d97706', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <InfoCircleOutlined /> Dead-end node
                                    </div>
                                )}
                                {(selectedData._connectedCount === 0 || selectedData._connectedCount === undefined) && (
                                    <div style={{ color: '#dc2626', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <InfoCircleOutlined /> Isolated node
                                    </div>
                                )}
                            </Form.Item>
                        </>
                    )
                }

                {
                    (selectedType === 'LANE' || selectedType === 'ENTRANCE' || selectedType === 'EXIT') && (
                        <>
                            <div className="form-row" style={{ display: 'flex', gap: '12px' }}>
                                <Form.Item label="X Position" style={{ flex: 1 }}>
                                    <InputNumber
                                        style={{ width: '100%' }}
                                        value={selectedData.x}
                                        onChange={(val) => handleChange('x', val)}
                                    />
                                </Form.Item>
                                <Form.Item label="Y Position" style={{ flex: 1 }}>
                                    <InputNumber
                                        style={{ width: '100%' }}
                                        value={selectedData.y}
                                        onChange={(val) => handleChange('y', val)}
                                    />
                                </Form.Item>
                            </div>

                            <div className="form-row" style={{ display: 'flex', gap: '12px' }}>
                                <Form.Item label="Length" style={{ flex: 1 }}>
                                    <InputNumber
                                        style={{ width: '100%' }}
                                        value={selectedData.width}
                                        onChange={(val) => handleChange('width', val)}
                                    />
                                </Form.Item>
                                <Form.Item label="Thickness" style={{ flex: 1 }}>
                                    <InputNumber
                                        style={{ width: '100%' }}
                                        value={selectedData.height}
                                        onChange={(val) => handleChange('height', val)}
                                        disabled={selectedType !== 'LANE'} // Lanes flexible, Gates fixed thickness logic preferred
                                    />
                                </Form.Item>
                            </div>

                            <Form.Item label="Rotation (deg)">
                                <Select
                                    value={selectedData.rotation || 0}
                                    onChange={(val) => handleChange('rotation', val)}
                                >
                                    <Option value={0}>0°</Option>
                                    <Option value={90}>90°</Option>
                                    <Option value={180}>180°</Option>
                                    <Option value={270}>270°</Option>
                                </Select>
                            </Form.Item>
                        </>
                    )
                }

                {
                    selectedType === 'SLOT_GROUP' && (
                        <Form.Item label="Direction">
                            <Select
                                value={selectedData.direction || 'horizontal'}
                                onChange={(val) => handleChange('direction', val)}
                            >
                                <Option value="horizontal">Horizontal</Option>
                                <Option value="vertical">Vertical</Option>
                            </Select>
                        </Form.Item>
                    )
                }
            </Form >


            {(selectedType === 'LANE' || selectedType === 'LANE_NODE' || selectedType === 'LANE_EDGE' || selectedType === 'ENTRANCE' || selectedType === 'EXIT' || selectedType === 'ZONE' || selectedType === 'SLOT_GROUP' || selectedType === 'SLOT') && (
                <div style={{ marginTop: '20px', borderTop: '1px solid #f0f0f0', paddingTop: '16px' }}>
                    <Button
                        danger
                        block
                        onClick={onDelete}
                    >
                        {selectedType === 'SLOT_GROUP' ? 'Delete Group' :
                            selectedType === 'ZONE' ? 'Delete Zone' :
                                selectedType === 'SLOT' ? 'Delete Slot' :
                                    selectedType === 'LANE_NODE' ? 'Delete Node' :
                                        selectedType === 'LANE_EDGE' ? 'Delete Edge' : 'Delete Element'}
                    </Button>
                </div>
            )}
        </div >
    );
};

export default EditorPropertiesPanel;
