import React from 'react';
import {
  Empty,
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Tag,
  Typography,
  ColorPicker,
  message,
} from 'antd';
import { ReloadOutlined, InfoCircleOutlined, CloseCircleFilled } from '@ant-design/icons';

import axiosClient from '../../../../c-lib/axios/axiosClient.service';
import { PARKING_API } from '../../../../c-lib/api/parking.api';

const { Title, Text } = Typography;
const { Option } = Select;
const SLOT_STATUS_OPTIONS = [
  { value: 'available', label: 'Available' },
  { value: 'occupied', label: 'Occupied' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'inactive', label: 'Error / Editing' },
];

const EditorPropertiesPanel = ({
  selectedData,
  selectedType,
  selectedEntity,
  onUpdate,
  onUpdateGroupedSlot,
  onUpdateSlot,
  onCycleStatus,
  onDelete,
  assignedSensorIds = [],
  sensors = [],
  interactionLocked = false,
}) => {
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
        { [field]: val },
      );
    } else {
      onUpdate(selectedData.id, { [field]: val });
    }
  };

  const getDeleteTooltip = () => {
    if (selectedType === 'SLOT') {
      if (selectedData?.dbStatus !== 'inactive') {
        if (selectedData?.status === 'inactive' || selectedData?.status === 3) {
          return 'You changed the status but have not saved the map yet. Please save the map first to persist the Error state before deleting.';
        }
        return 'Slot can only be deleted after the Error/Editing state is saved to the database.';
      }
      if (selectedData?.sensorCode) {
        return 'Please unassign the sensor from this slot before deleting.';
      }
    }

    if (selectedType === 'ZONE') {
      if (![0, 2].includes(selectedData?.status)) {
        return 'Zone can only be deleted when its status is Editing or Inactive.';
      }
    }

    return '';
  };

  const canDeleteSelectedSlot =
    (selectedType === 'SLOT' &&
      selectedData?.dbStatus === 'inactive' &&
      !selectedData?.sensorCode) ||
    (selectedType === 'ZONE' && [0, 2].includes(selectedData?.status)) ||
    !['SLOT', 'ZONE'].includes(selectedType);

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
        {selectedData?.id && (
          <Tag color="blue">
            {selectedType === 'SLOT' ? selectedData.code || selectedData.id : selectedData.id}
          </Tag>
        )}
      </div>

      <Form layout="vertical" size="small">
        {selectedType === 'SLOT' ? (
          <>
            {/* Slot display name — read only */}
            <Form.Item label="Slot Name">
              <Input
                value={selectedData.nameSlot || selectedData.code || selectedData.id || '—'}
                disabled
                style={{ color: '#111827', fontWeight: 600, cursor: 'default' }}
              />
            </Form.Item>
            <Form.Item label="Status">
              <Select
                value={selectedData.status || 'available'}
                onChange={(val) => handleChange('status', val)}
                style={{ width: '100%' }}
              >
                {SLOT_STATUS_OPTIONS.map((status) => (
                  <Option key={status.value} value={status.value}>
                    {status.label}
                  </Option>
                ))}
              </Select>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                Status is updated automatically from IoT sensors
              </div>
            </Form.Item>

            <Form.Item label="IoT Sensor" style={{ marginBottom: '8px' }}>
              <Select
                showSearch
                allowClear
                clearIcon={<CloseCircleFilled style={{ color: '#ff4d4f' }} />}
                showArrow={!selectedData.sensorCode}
                disabled={selectedData.status !== 'inactive'}
                value={selectedData.sensorCode || undefined} // sensorCode
                placeholder="-- Select sensor --"
                optionFilterProp="children"
                optionLabelProp="label"
                onChange={async (val) => {
                  const newVal = val || null;
                  const oldSensorCode = selectedData.sensorCode; // sensorCode
                  const updates = { sensorCode: newVal }; // sensorCode

                  const updateSensorSlotId = async (sensorIdToUpdate, mappedSlotId) => {
                    if (!sensorIdToUpdate) return;
                    try {
                      const payload = { sensorCode: sensorIdToUpdate, slotId: mappedSlotId }; // sensorCode
                      console.log('Updating sensor:', payload);
                      const res = await axiosClient.post(PARKING_API.UPDATE_SENSOR, payload);
                      console.log('Update response:', res);
                    } catch (e) {
                      console.error('Sensor update fail:', e);
                      // message.error(`Lỗi cập nhật sensor vào slot`);
                    }
                  };

                  // If unassigning or switching to a new sensor, clear the old one first
                  if (oldSensorCode && oldSensorCode !== newVal) {
                    // sensorCode
                    await updateSensorSlotId(oldSensorCode, null); // sensorCode
                  }

                  // If assigning a new sensor
                  if (newVal) {
                    await updateSensorSlotId(newVal, selectedData.mongoId || selectedData.id); // sensorCode
                    // message.success(`Đã gán sensor thành công vào slot`);
                  } else if (!newVal && oldSensorCode) {
                    // sensorCode
                    // message.success(`Đã gỡ sensor khỏi slot`);
                  }

                  if (onUpdateSlot) {
                    onUpdateSlot(selectedData.id, updates);
                  } else {
                    handleChange('sensorCode', updates.sensorCode); // sensorCode
                  }
                }}
                style={{ width: '100%' }}
              >
                {sensors
                  .filter(
                    (sensor) =>
                      // Hiển thị nếu: chưa được assign cho ai
                      // HOẶC đang được assign cho chính slot đang chọn
                      sensor.categoryId?.code === 'CA001' &&
                      (!assignedSensorIds.includes(sensor.code) ||
                        sensor.code === selectedData.sensorCode), // sensorCode
                  )
                  .map(
                    (
                      sensor, // sensorCode
                    ) => (
                      <Option key={sensor.id} value={sensor.code} label={sensor.code}>
                        {sensor.code}
                      </Option>
                    ),
                  )}
              </Select>
            </Form.Item>

            {selectedData.parentGroupId && (
              <Form.Item label="Parent Group">
                <Input
                  value={selectedData.parentGroupId}
                  disabled
                  prefix={<InfoCircleOutlined style={{ color: '#bfbfbf' }} />}
                />
              </Form.Item>
            )}

            {!selectedData.parentGroupId && (
              <div className="form-row" style={{ display: 'flex', gap: '12px' }}>
                <Form.Item label="X Position" style={{ flex: 1 }}>
                  <InputNumber
                    style={{ width: '100%' }}
                    value={selectedData.x}
                    onChange={(val) => handleChange('x', val)}
                    disabled={selectedData.status !== 'inactive'}
                  />
                </Form.Item>
                <Form.Item label="Y Position" style={{ flex: 1 }}>
                  <InputNumber
                    style={{ width: '100%' }}
                    value={selectedData.y}
                    onChange={(val) => handleChange('y', val)}
                    disabled={selectedData.status !== 'inactive'}
                  />
                </Form.Item>
              </div>
            )}
          </>
        ) : selectedType === 'PARKING_GLOBAL' ? (
          <>
            {/* ── PARKING SECTION ── */}
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 8,
              }}
            >
              🅿️ Parking Info
            </div>

            <Form.Item label="Parking Name">
              <Input
                value={selectedData.parkingName}
                onChange={(e) => handleChange('parkingName', e)}
                disabled={selectedData.parkingDbStatus !== 0}
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
                disabled={selectedData.parkingDbStatus !== 0}
              />
            </Form.Item>
            <Form.Item label="Location">
              <Input
                value={selectedData.parkingLocation}
                onChange={(e) => handleChange('parkingLocation', e)}
                placeholder="e.g. Ward 8, HCMC"
                disabled={selectedData.parkingDbStatus !== 0}
              />
            </Form.Item>

            {/* ── FLOOR SECTION ── */}
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginTop: 20,
                marginBottom: 8,
                paddingTop: 16,
                borderTop: '1px solid #f0f0f0',
              }}
            >
              🏢 Current Floor
            </div>

            <Form.Item label="Floor Level">
              <InputNumber
                style={{ width: '100%' }}
                value={selectedData.activeFloorLevel}
                placeholder="e.g. -1 for B1, 1 for ground"
                disabled
              />
            </Form.Item>
            <Form.Item label="Floor Status">
              <Select
                value={selectedData.floorStatus !== undefined ? selectedData.floorStatus : 1}
                onChange={(val) => handleChange('floorStatus', val)}
              >
                <Option value={0}>Editing</Option>
                <Option value={1}>Active</Option>
                <Option value={2}>Inactive</Option>
              </Select>
            </Form.Item>
            <Form.Item label="Measurement Unit">
              <Select
                value={selectedData.parkingUnit}
                onChange={(val) => handleChange('parkingUnit', val)}
                disabled
              >
                <Option value="m">Meters (m)</Option>
                <Option value="ft">Feet (ft)</Option>
              </Select>
            </Form.Item>
            <Form.Item
              label={`1 grid cell = [ ${selectedData.gridRealSize || 2.5} ] ${selectedData.parkingUnit}`}
            >
              <InputNumber
                style={{ width: '100%' }}
                value={selectedData.gridRealSize}
                onChange={(val) => handleChange('gridRealSize', val)}
                placeholder="e.g. 2.5"
                step={0.1}
                min={0.1}
                disabled
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
                    readOnly={selectedData.status !== 0}
                    style={{
                      backgroundColor: selectedData.status !== 0 ? '#f5f5f5' : undefined,
                      color: selectedData.status !== 0 ? '#bfbfbf' : undefined,
                    }}
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
                    disabled={selectedData.status !== 0}
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

        {selectedType === 'LANE_EDGE' && (
          <>
            <Form.Item label="Edge Width / Thickness (px)">
              <InputNumber
                style={{ width: '100%' }}
                min={10}
                max={60}
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
        )}

        {selectedType === 'LANE_NODE' && (
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
                <div
                  style={{
                    color: '#d97706',
                    marginTop: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <InfoCircleOutlined /> Dead-end node
                </div>
              )}
              {(selectedData._connectedCount === 0 ||
                selectedData._connectedCount === undefined) && (
                <div
                  style={{
                    color: '#dc2626',
                    marginTop: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <InfoCircleOutlined /> Isolated node
                </div>
              )}
            </Form.Item>
          </>
        )}

        {(selectedType === 'LANE' || selectedType === 'ENTRANCE' || selectedType === 'EXIT') && (
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
        )}

        {selectedType === 'SLOT_GROUP' && (
          <Form.Item label="Direction">
            <Select
              value={selectedData.direction || 'horizontal'}
              onChange={(val) => handleChange('direction', val)}
            >
              <Option value="horizontal">Horizontal</Option>
              <Option value="vertical">Vertical</Option>
            </Select>
          </Form.Item>
        )}
      </Form>

      {(selectedType === 'LANE' ||
        selectedType === 'LANE_NODE' ||
        selectedType === 'LANE_EDGE' ||
        selectedType === 'ENTRANCE' ||
        selectedType === 'EXIT' ||
        selectedType === 'ZONE' ||
        selectedType === 'SLOT_GROUP' ||
        selectedType === 'SLOT') && (
        <div style={{ marginTop: '20px', borderTop: '1px solid #f0f0f0', paddingTop: '16px' }}>
          <Button
            danger
            block
            onClick={onDelete}
            disabled={!canDeleteSelectedSlot}
            title={getDeleteTooltip()}
          >
            {selectedType === 'SLOT_GROUP'
              ? 'Delete Group'
              : selectedType === 'ZONE'
                ? 'Delete Zone'
                : selectedType === 'SLOT'
                  ? 'Delete Slot'
                  : selectedType === 'LANE_NODE'
                    ? 'Delete Node'
                    : selectedType === 'LANE_EDGE'
                      ? 'Delete Edge'
                      : 'Delete Element'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default EditorPropertiesPanel;
