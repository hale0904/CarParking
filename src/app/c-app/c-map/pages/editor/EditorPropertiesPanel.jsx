import React from 'react';
import { Empty, Form, Input, InputNumber, Select, Button, Tag, Typography } from 'antd';
import { ReloadOutlined, InfoCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

const EditorPropertiesPanel = ({ selectedData, selectedType, onUpdate, onCycleStatus, onDelete }) => {
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
        onUpdate(selectedData.id, { [field]: val });
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
                    {selectedType === 'ZONE' && 'Zone Properties'}
                    {selectedType === 'SLOT_GROUP' && 'Group Properties'}
                    {selectedType === 'SLOT' && 'Slot Properties'}
                    {selectedType === 'LANE' && 'Lane Properties'}
                    {selectedType === 'ENTRANCE' && 'Entrance Properties'}
                    {selectedType === 'EXIT' && 'Exit Properties'}
                </Title>
                <Tag color="blue">{selectedData.id}</Tag>
            </div>

            <Form layout="vertical" size="small">
                {selectedType === 'SLOT' ? (
                    <>
                        <Form.Item label="Status">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Tag color={getStatusColor(selectedData.status)} style={{ margin: 0, flex: 1, textAlign: 'center', padding: '4px' }}>
                                    {selectedData.status?.toUpperCase()}
                                </Tag>
                                <Button
                                    icon={<ReloadOutlined />}
                                    onClick={onCycleStatus}
                                    title="Cycle Status"
                                />
                            </div>
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
                ) : selectedType === 'LANE' ? null : (
                    <>
                        {selectedType === 'ZONE' && (
                            <>
                                <Form.Item label="Zone Name">
                                    <Input
                                        value={selectedData.name}
                                        onChange={(e) => handleChange('name', e)}
                                    />
                                </Form.Item>
                                <Form.Item label="Color">
                                    <Input
                                        type="color"
                                        value={selectedData.color || '#3b82f6'}
                                        onChange={(e) => handleChange('color', e)}
                                        style={{ padding: 0, height: 32, cursor: 'pointer' }}
                                    />
                                </Form.Item>
                            </>
                        )}

                        {selectedType === 'SLOT_GROUP' && (
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


            {(selectedType === 'LANE' || selectedType === 'ENTRANCE' || selectedType === 'EXIT' || selectedType === 'ZONE' || selectedType === 'SLOT_GROUP' || selectedType === 'SLOT') && (
                <div style={{ marginTop: '20px', borderTop: '1px solid #f0f0f0', paddingTop: '16px' }}>
                    <Button
                        danger
                        block
                        onClick={onDelete}
                    >
                        {selectedType === 'SLOT_GROUP' ? 'Delete Group' :
                            selectedType === 'ZONE' ? 'Delete Zone' :
                                selectedType === 'SLOT' ? 'Delete Slot' : 'Delete Element'}
                    </Button>
                </div>
            )}
        </div >
    );
};

export default EditorPropertiesPanel;
