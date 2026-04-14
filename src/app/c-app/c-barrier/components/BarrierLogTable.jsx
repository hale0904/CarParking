import React, { useState } from 'react';
import { Table, DatePicker, Space, Typography, Tag } from 'antd';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(isBetween);

const { RangePicker } = DatePicker;
const { Text } = Typography;

const BarrierLogTable = ({ logs }) => {
  const [dateRange, setDateRange] = useState(null);

  const filteredLogs = logs.filter(log => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) return true;
    const logDate = dayjs(log.timestamp);
    // Check if the date is within the selected range start of day to end of day
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
      title: 'License Plate',
      dataIndex: 'licensePlate',
      key: 'licensePlate',
      render: (text) => <Text code strong>{text}</Text>,
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      render: (action) => (
        <Tag color={action === 'Entry' ? 'blue' : 'purple'}>{action}</Tag>
      ),
      filters: [
        { text: 'Entry', value: 'Entry' },
        { text: 'Exit', value: 'Exit' },
      ],
      onFilter: (value, record) => record.action === value,
    },
    {
      title: 'Payment Status',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: (status) => {
        let color = 'default';
        if (status === 'Paid') color = 'green';
        if (status === 'Unpaid') color = 'red';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Gate Status',
      dataIndex: 'gateStatus',
      key: 'gateStatus',
      render: (status) => (
        <Text type={status === 'Success' ? 'success' : 'danger'}>{status}</Text>
      ),
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
