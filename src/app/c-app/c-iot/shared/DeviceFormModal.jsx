// d:\Dev\DoAn\CarParking\src\app\c-app\c-iot\shared\DeviceFormModal.jsx
import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, Button, Alert } from 'antd';
import { DEVICE_TYPES } from '../utils/deviceHelpers';

const DeviceFormModal = ({ open, mode, initialData, onClose, onSubmit }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [pingSuccess, setPingSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      form.resetFields();
      setPingSuccess(false);
      if (mode === 'edit' && initialData) {
        form.setFieldsValue(initialData);
      }
    }
  }, [open, mode, initialData, form]);

  const handleFinish = async (values) => {
    if (mode === 'add') {
      setLoading(true);
      setPingSuccess(false);
      
      // Simulate MQTT ping
      setTimeout(() => {
        setPingSuccess(true);
        setTimeout(() => {
          setLoading(false);
          onSubmit(values); // call onSubmit after 0.5s more
        }, 500);
      }, 1500);
    } else {
      onSubmit(values);
    }
  };

  return (
    <Modal
      title={mode === 'add' ? "Add New Device" : "Edit Device"}
      open={open}
      onCancel={!loading ? onClose : undefined}
      closable={!loading}
      footer={[
        <Button key="cancel" onClick={onClose} disabled={loading}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={() => form.submit()}
        >
          {mode === 'add' ? "Register & Ping" : "Save Changes"}
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
      >
        <Form.Item
          name="name"
          label="Device Name"
          rules={[{ required: true, message: 'Please enter device name' }]}
        >
          <Input placeholder="E.g. Sensor Tầng 1 - A1" disabled={loading} />
        </Form.Item>

        <Form.Item
          name="deviceId"
          label="Device ID (MAC Address)"
          rules={[
            { required: true, message: 'Please enter MAC address' },
            { pattern: /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/, message: 'Invalid MAC format (e.g. AA:BB:CC:DD:EE:FF)' }
          ]}
        >
          <Input placeholder="AA:BB:CC:DD:EE:FF" disabled={loading} style={{ fontFamily: 'monospace' }} />
        </Form.Item>

        <Form.Item
          name="type"
          label="Device Type"
          rules={[{ required: true, message: 'Please select device type' }]}
        >
          <Select placeholder="Select type" disabled={loading}>
            {DEVICE_TYPES.map((type) => (
              <Select.Option key={type} value={type}>{type}</Select.Option>
            ))}
          </Select>
        </Form.Item>
      </Form>

      {pingSuccess && (
        <Alert
          message="✅ Device registered and connection verified."
          type="success"
          showIcon
          style={{ marginTop: 16 }}
        />
      )}
    </Modal>
  );
};

export default DeviceFormModal;
