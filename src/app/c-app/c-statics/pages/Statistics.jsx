import React from 'react';
import { Card } from 'antd';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Dữ liệu mẫu cho biểu đồ giờ cao điểm
const peakHourData = [
  { hour: '1', available: 22, booked: 3, occupied: 0 },
  { hour: '2', available: 20, booked: 5, occupied: 0 },
  { hour: '3', available: 18, booked: 7, occupied: 0 },
  { hour: '4', available: 19, booked: 6, occupied: 0 },
  { hour: '5', available: 15, booked: 5, occupied: 5 },
  { hour: '6', available: 10, booked: 8, occupied: 7 },
  { hour: '7', available: 5, booked: 10, occupied: 10 },
  { hour: '8', available: 3, booked: 7, occupied: 15 },
  { hour: '9', available: 2, booked: 8, occupied: 15 },
  { hour: '10', available: 5, booked: 5, occupied: 15 },
  { hour: '11', available: 8, booked: 7, occupied: 10 },
  { hour: '12', available: 15, booked: 5, occupied: 5 },
  { hour: '13', available: 5, booked: 0, occupied: 0 },
  { hour: '14', available: 3, booked: 0, occupied: 0 },
  { hour: '15', available: 8, booked: 0, occupied: 0 },
  { hour: '16', available: 6, booked: 0, occupied: 0 },
  { hour: '17', available: 4, booked: 0, occupied: 0 },
  { hour: '18', available: 12, booked: 0, occupied: 0 },
  { hour: '19', available: 18, booked: 0, occupied: 0 },
  { hour: '20', available: 15, booked: 0, occupied: 0 },
  { hour: '21', available: 8, booked: 0, occupied: 0 },
  { hour: '22', available: 6, booked: 0, occupied: 0 },
  { hour: '23', available: 10, booked: 0, occupied: 0 },
];

// Dữ liệu cho biểu đồ thời gian đỗ xe trung bình
const avgParkingData = Array.from({ length: 50 }, (_, i) => ({
  day: i + 1,
  duration: Math.random() * 10 + 2,
}));

const Statistics = () => {
  return (
    <div style={{ padding: '24px', background: '#fff', minHeight: '100vh' }}>
      <h2 style={{ marginBottom: '24px', fontSize: '18px', fontWeight: 'normal' }}>THỐNG KÊ</h2>

      <Card
        title="GIỜ CAO ĐIỂM"
        style={{ marginBottom: '24px' }}
        headStyle={{ fontWeight: 'bold' }}
      >
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={peakHourData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="hour"
              label={{ value: 'Giờ', position: 'insideBottomRight', offset: -5 }}
            />
            <YAxis label={{ value: 'Chỗ đậu', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="square" />
            <Bar dataKey="occupied" stackId="a" fill="#ff7875" name="Có xe" radius={[0, 0, 0, 0]} />
            <Bar dataKey="booked" stackId="a" fill="#ffd666" name="Đã đặt" radius={[0, 0, 0, 0]} />
            <Bar
              dataKey="available"
              stackId="a"
              fill="#95de64"
              name="Trống"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card title="THỜI GIAN ĐỖ XE TRUNG BÌNH" headStyle={{ fontWeight: 'bold' }}>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={avgParkingData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="day"
              label={{ value: 'Ngày kết thúc', position: 'insideBottomRight', offset: -5 }}
            />
            <YAxis label={{ value: 'Ngày', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Bar dataKey="duration" fill="#1890ff" />
          </BarChart>
        </ResponsiveContainer>
        <div
          style={{
            textAlign: 'right',
            marginTop: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            paddingTop: '8px',
          }}
        >
          <span style={{ color: '#999' }}>Ngày bắt đầu</span>
        </div>
      </Card>
    </div>
  );
};

export default Statistics;
