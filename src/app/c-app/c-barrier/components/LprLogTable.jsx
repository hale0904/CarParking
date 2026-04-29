import React, { useState } from 'react';
import { Table, Typography, Image, Tag, Button, Modal, Form, Input, notification } from 'antd';
import { EditOutlined } from '@ant-design/icons';

const { Text } = Typography;

const LprLogTable = ({ lprLogs }) => {
  const [logs, setLogs] = useState(lprLogs);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [form] = Form.useForm();

  const handleManualInput = (record) => {
    setEditingLog(record);
    form.setFieldsValue({ manualPlate: '' });
    setModalVisible(true);
  };

  const handleModalSubmit = () => {
    form.validateFields().then((values) => {
      const { manualPlate } = values;

      setLogs((prev) =>
        prev.map((log) =>
          log.id === editingLog.id
            ? { ...log, ocrResult: manualPlate, status: 'Matched (Manual)', decision: 'Allowed' }
            : log,
        ),
      );

      notification.success({
        message: 'Plate Updated',
        description: `License plate manually set to ${manualPlate}.`,
      });

      setModalVisible(false);
      setEditingLog(null);
    });
  };

  const columns = [
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (text) => <Text>{new Date(text).toLocaleString()}</Text>,
    },
    {
      title: 'Barrier',
      dataIndex: 'barrierId',
      key: 'barrierId',
    },
    {
      title: 'Captured Image',
      dataIndex: 'image',
      key: 'image',
      render: (src) => <Image src={src} width={100} style={{ borderRadius: 4 }} alt="LPR Capture" />,
    },
    {
      title: 'OCR Result',
      dataIndex: 'ocrResult',
      key: 'ocrResult',
      render: (text) => (text ? <Text strong code>{text}</Text> : <Text type="secondary">N/A</Text>),
    },
    {
      title: 'Match Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        if (status.includes('Matched')) color = 'success';
        if (status === 'Failed') color = 'error';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Decision',
      dataIndex: 'decision',
      key: 'decision',
      render: (decision) => (
        <Tag color={decision === 'Allowed' ? 'green' : decision === 'Awaiting payment' ? 'gold' : 'default'}>
          {decision}
        </Tag>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => {
        if (record.status === 'Failed') {
          return (
            <Button
              type="primary"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleManualInput(record)}
            >
              Manual Input
            </Button>
          );
        }
        return <Text type="secondary">-</Text>;
      },
    },
  ];

  return (
    <div>
      <Table
        columns={columns}
        dataSource={logs}
        rowKey="id"
        pagination={{ pageSize: 10, showSizeChanger: false }}
        rowClassName={(record) => (record.status === 'Failed' ? 'highlight-row-failed' : '')}
        scroll={{ x: 'max-content' }}
      />

      <Modal
        title="Manual Plate Input"
        open={modalVisible}
        onOk={handleModalSubmit}
        onCancel={() => {
          setModalVisible(false);
          setEditingLog(null);
        }}
        okText="Save Plate"
        destroyOnClose
      >
        <div style={{ marginBottom: 16, textAlign: 'center' }}>
          {editingLog && <Image src={editingLog.image} width={200} alt="Capture" />}
          <p style={{ marginTop: 8 }}>Please inspect the image and enter the correct plate number.</p>
        </div>
        <Form form={form} layout="vertical">
          <Form.Item
            name="manualPlate"
            label="License Plate Number"
            rules={[{ required: true, message: 'Please input the license plate number' }]}
          >
            <Input placeholder="e.g. 29A-123.45" />
          </Form.Item>
        </Form>
      </Modal>

      <style jsx="true">{`
        .highlight-row-failed {
          background-color: #fff1f0;
        }
        .highlight-row-failed:hover > td {
          background-color: #ffccc7 !important;
        }
      `}</style>
    </div>
  );
};

export default LprLogTable;
