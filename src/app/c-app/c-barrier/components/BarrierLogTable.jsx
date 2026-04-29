import React, { useState } from 'react';
import { Table, DatePicker, Space, Typography, Tag } from 'antd';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(isBetween);

const { RangePicker } = DatePicker;
const { Text } = Typography;

const BarrierLogTable = ({ logs }) => {
  const [dateRange, setDateRange] = useState(null);

  const filteredLogs = logs.filter((log) => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) return true;
    const logDate = dayjs(log.timestamp);
    return logDate.isBetween(dateRange[0].startOf('day'), dateRange[1].endOf('day'), null, '[]');
  });

  const columns = [
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (text) => <Text>{new Date(text).toLocaleString()}</Text>,
      sorter: (a, b) => new Date(a.timestamp) - new Date(b.timestamp),
    },
    {
      title: 'Barrier',
      dataIndex: 'barrierId',
      key: 'barrierId',
      render: (text) => <Text>{text}</Text>,
    },
    {
      title: 'License Plate',
      dataIndex: 'licensePlate',
      key: 'licensePlate',
      render: (text) => <Text code strong>{text}</Text>,
    },
    {
      title: 'Flow',
      dataIndex: 'laneType',
      key: 'laneType',
      render: (laneType) => (
        <Tag color={laneType === 'entry' ? 'blue' : 'purple'}>
          {laneType === 'entry' ? 'Entry' : 'Exit'}
        </Tag>
      ),
      filters: [
        { text: 'Entry', value: 'Entry' },
        { text: 'Exit', value: 'Exit' },
      ],
      onFilter: (value, record) => (record.laneType === 'entry' ? 'Entry' : 'Exit') === value,
    },
    {
      title: 'Trigger',
      dataIndex: 'trigger',
      key: 'trigger',
      render: (trigger) => <Text>{trigger}</Text>,
    },
    {
      title: 'Payment',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: (status) => {
        let color = 'default';
        if (status === 'Paid') color = 'green';
        if (status === 'Unpaid') color = 'red';
        if (status === 'Timeout') color = 'orange';
        if (status === 'Override') color = 'gold';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Command Result',
      dataIndex: 'commandStatus',
      key: 'commandStatus',
      render: (status) => (
        <Tag color={status === 'Opened' || status === 'Closed' ? 'green' : status === 'Blocked' ? 'orange' : 'red'}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Safety',
      dataIndex: 'safetyStatus',
      key: 'safetyStatus',
      render: (status) => <Tag color={status === 'Clear' ? 'green' : 'orange'}>{status}</Tag>,
    },
    {
      title: 'Mode',
      dataIndex: 'mode',
      key: 'mode',
      render: (mode) => <Tag>{mode}</Tag>,
    },
    {
      title: 'Latency',
      dataIndex: 'latencyMs',
      key: 'latencyMs',
      render: (value) => <Text>{value} ms</Text>,
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Text strong>Filter Request:</Text>
        <RangePicker onChange={(dates) => setDateRange(dates)} />
      </Space>
      <Table
        columns={columns}
        dataSource={filteredLogs}
        rowKey="id"
        pagination={{ pageSize: 10, showSizeChanger: false }}
        scroll={{ x: 'max-content' }}
      />
    </div>
  );
};

export default BarrierLogTable;
