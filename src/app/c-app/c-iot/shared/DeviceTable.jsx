// d:\Dev\DoAn\CarParking\src\app\c-app\c-iot\shared\DeviceTable.jsx
import React from 'react';
import { Table, Tag, Button, Space, message } from 'antd';
import { EditOutlined, DeleteOutlined, WifiOutlined } from '@ant-design/icons';
import { TYPE_COLOR, STATUS_COLOR } from '../utils/deviceHelpers';

const DeviceTable = ({ data, onEdit, onDeleteClick }) => {
  const handlePing = (record) => {
    const hide = message.loading(`Pinging ${record.name}...`, 0);
    setTimeout(() => {
      hide();
      const isSuccess = Math.random() > 0.5;
      if (isSuccess) {
        message.success("Device Online");
      } else {
        message.error("No Response");
      }
    }, 1500);
  };

  const columns = [
    {
      title: '#',
      dataIndex: 'index',
      key: 'index',
      render: (_, __, index) => index + 1,
      width: 60,
    },
    {
      title: 'Device Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Device ID (MAC)',
      dataIndex: 'deviceId',
      key: 'deviceId',
      render: (text) => <span style={{ fontFamily: 'monospace' }}>{text}</span>,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => <Tag color={TYPE_COLOR[type] || 'default'}>{type}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={STATUS_COLOR[status] || 'default'}>{status}</Tag>,
    },
    {
      title: 'Linked Slot',
      dataIndex: 'linkedSlot',
      key: 'linkedSlot',
      render: (slot) => slot ? <b>{slot}</b> : <span style={{ color: '#aaa' }}>—</span>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            icon={<WifiOutlined />}
            onClick={() => handlePing(record)}
            title="Ping Device"
          />
          <Button
            icon={<EditOutlined />}
            onClick={() => onEdit(record)}
            title="Edit Device"
          />
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => onDeleteClick(record)}
            title="Delete Device"
          />
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey="id"
      pagination={{ pageSize: 10 }}
    />
  );
};

export default DeviceTable;
