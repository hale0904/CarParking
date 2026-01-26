import React, { useEffect, useState } from 'react';
import { Table, Button, Input, Row, Col, Select, Space, Tag, Popconfirm, notification } from 'antd';
import { PlusOutlined, SearchOutlined, EditTwoTone, DeleteTwoTone } from '@ant-design/icons';
import ParkingService from '../shared/service/services';
import './carParkingList.scss';

import AddCarParkingModal from './AddCarParkingModal';
import UpdateCarParkingModal from './UpdateCarParkingModal';

const { Option } = Select;

/* =======================
   STATUS CONFIG (FIXED)
======================= */
const STATUS = {
  EDITING: 0,
  ACTIVE: 1,
  INACTIVE: 2,
};

const STATUS_LABEL_MAP = {
  [STATUS.EDITING]: 'Đang chỉnh sửa',
  [STATUS.ACTIVE]: 'Hoạt động',
  [STATUS.INACTIVE]: 'Ngừng hoạt động',
};

const STATUS_COLOR_MAP = {
  [STATUS.EDITING]: 'gold',
  [STATUS.ACTIVE]: 'green',
  [STATUS.INACTIVE]: 'red',
};

const CarParkingList = () => {
  const [listCarParking, setListCarParking] = useState([]);
  const [listCarParkingAll, setListCarParkingAll] = useState([]);

  const [current, setCurrent] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [filters, setFilters] = useState({
    name: '',
    location: '',
    status: null,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCarParking, setSelectedCarParking] = useState(null);

  /* =======================
     RESPONSIVE
  ======================= */
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1100);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /* =======================
     FETCH LIST
  ======================= */
  useEffect(() => {
    fetchCarParking();
  }, []);

  const fetchCarParking = async () => {
    try {
      setIsLoading(true);
      const res = await ParkingService.getList({});
      if (res?.success) {
        setListCarParking(res.data);
        setListCarParkingAll(res.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  /* =======================
     FILTER (FE)
  ======================= */
  const applyFilters = (data, currentFilters) => {
    const { name, location, status } = currentFilters;
    const lowerName = name.toLowerCase().trim();
    const lowerLocation = location.toLowerCase().trim();

    return data.filter((item) => {
      const matchName = item.name?.toLowerCase().includes(lowerName);
      const matchLocation = item.location?.toLowerCase().includes(lowerLocation);
      const matchStatus = status !== null ? item.status === status : true;
      return matchName && matchLocation && matchStatus;
    });
  };

  /* =======================
     CREATE SUCCESS
  ======================= */
  const handleCreateSuccess = (newItem) => {
    setIsAddModalOpen(false);

    const updatedListAll = [newItem, ...listCarParkingAll];
    setListCarParkingAll(updatedListAll);

    const filtered = applyFilters(updatedListAll, filters);
    setListCarParking(filtered);
    setCurrent(1);
  };

  /* =======================
     UPDATE SUCCESS
  ======================= */
  const handleUpdateSuccess = (updatedItem) => {
    setIsEditModalOpen(false);

    const updatedListAll = listCarParkingAll.map((item) =>
      item.code === updatedItem.code ? { ...item, ...updatedItem } : item,
    );

    setListCarParkingAll(updatedListAll);
    setListCarParking(applyFilters(updatedListAll, filters));
  };

  /* =======================
     ACTIONS
  ======================= */
  const handleEdit = (record) => {
    setSelectedCarParking(record);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (code) => {
    try {
      const item = listCarParkingAll.find((i) => i.code === code);

      if (!item) return;

      // Chỉ cho xóa khi status = 0
      if (item.status !== 0) {
        notification.warning({
          message: 'Không thể xóa',
          description: 'Chỉ những bãi xe ở trạng thái "Đang chỉnh sửa" mới được phép xóa.',
        });
        return;
      }

      // Call API delete
      await ParkingService.deleteParking([{ code }]);

      // ✅ Update state
      const updated = listCarParkingAll.filter((i) => i.code !== code);
      setListCarParkingAll(updated);
      setListCarParking(applyFilters(updated, filters));

      // THÔNG BÁO THÀNH CÔNG (BỊ THIẾU)
      notification.success({
        message: 'Thành công',
        description: 'Xóa bãi xe thành công!',
      });
    } catch (err) {
      console.error(err);
      notification.error({
        message: 'Lỗi',
        description: err?.response?.data?.message || 'Xóa bãi xe thất bại.',
      });
    }
  };

  const handleSearch = () => {
    setListCarParking(applyFilters(listCarParkingAll, filters));
    setCurrent(1);
  };

  const handleClearFilters = () => {
    const emptyFilters = { name: '', location: '', status: null };
    setFilters(emptyFilters);
    setListCarParking(listCarParkingAll);
    setCurrent(1);
  };

  /* =======================
     TABLE COLUMNS
  ======================= */
  const columns = [
    {
      title: 'Tên bãi xe',
      dataIndex: 'name',
      key: 'name',
      width: 220,
      render: (text) => <span className="clickable-name">{text}</span>,
    },
    {
      title: 'Vị trí',
      dataIndex: 'location',
      key: 'location',
      width: 200,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 160,
      render: (status) => (
        <Tag color={STATUS_COLOR_MAP[status]} style={{ borderRadius: '20px', padding: '2px 12px' }}>
          {STATUS_LABEL_MAP[status]}
        </Tag>
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      align: 'center',
      width: 120,
      render: (_, record) => (
        <Space size="middle">
          <EditTwoTone
            twoToneColor="#1890ff"
            style={{ cursor: 'pointer', fontSize: 18 }}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa không?"
            onConfirm={() => handleDelete(record.code)}
            okText="Xác nhận"
            cancelText="Hủy"
          >
            <DeleteTwoTone twoToneColor="#ff4d4f" style={{ cursor: 'pointer', fontSize: 18 }} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  /* =======================
     RENDER
  ======================= */
  return (
    <div className="car-parking-container">
      {/* FILTER */}
      <div className="filter-section">
        <h3>Lọc dữ liệu</h3>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <label>Trạng thái</label>
            <Select
              placeholder="Chọn trạng thái"
              value={filters.status ?? undefined}
              onChange={(value) => setFilters({ ...filters, status: value })}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value={STATUS.EDITING}>Đang chỉnh sửa</Option>
              <Option value={STATUS.ACTIVE}>Hoạt động</Option>
              <Option value={STATUS.INACTIVE}>Ngừng hoạt động</Option>
            </Select>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <label>Tên bãi xe</label>
            <Input
              value={filters.name}
              onChange={(e) => setFilters({ ...filters, name: e.target.value })}
            />
          </Col>

          <Col xs={24} sm={12} md={8}>
            <label>Vị trí</label>
            <Input
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
            />
          </Col>
        </Row>

        <div className="filter-actions">
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            Tìm kiếm
          </Button>
          <Button style={{ marginLeft: 8 }} onClick={handleClearFilters}>
            Xóa bộ lọc
          </Button>
        </div>
      </div>

      {/* LIST */}
      <div className="list-section">
        <div className="list-header">
          <h3>Danh sách bãi xe</h3>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsAddModalOpen(true)}>
            Thêm bãi
          </Button>
        </div>

        <Table
          loading={isLoading}
          columns={columns}
          dataSource={listCarParking}
          rowKey="code"
          pagination={{
            current,
            pageSize,
            total: listCarParking.length,
            showSizeChanger: true,
            onChange: (page, size) => {
              setCurrent(page);
              setPageSize(size);
            },
          }}
        />
      </div>

      {/* MODALS */}
      <AddCarParkingModal
        open={isAddModalOpen}
        onCancel={() => setIsAddModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      <UpdateCarParkingModal
        open={isEditModalOpen}
        data={selectedCarParking}
        onCancel={() => setIsEditModalOpen(false)}
        onSuccess={handleUpdateSuccess}
      />
    </div>
  );
};

export default CarParkingList;
