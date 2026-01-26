import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, notification } from 'antd';
import ParkingService from '../shared/service/services';

const { Option } = Select;

/* =======================
   STATUS ENUM (SYNC BE)
======================= */
const STATUS = {
  EDITING: 0,
  ACTIVE: 1,
  INACTIVE: 2,
};

const UpdateCarParkingModal = ({ open, data, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    console.log('data', data);
    if (open && data) {
      form.setFieldsValue({
        name: data.name,
        location: data.location,
        status: data.status,
      });
    }
  }, [open, data, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setIsSubmitting(true);

      // 1️⃣ Update info (KHÔNG gồm status)
      const updateInfoPayload = {
        code: data.code,
        name: values.name,
        location: values.location,
      };

      const updateInfoRes = await ParkingService.saveParking(updateInfoPayload);

      if (!updateInfoRes?.success) {
        notification.error({
          message: 'Lỗi',
          description: updateInfoRes?.message || 'Có lỗi xảy ra khi cập nhật thông tin bãi xe.',
        });
        return;
      }

      // 2️⃣ Nếu status thay đổi → update status riêng
      if (values.status !== data.status) {
        const updateStatusRes = await ParkingService.updateParkingStatus([
          {
            code: data.code,
            status: values.status,
          },
        ]);

        if (!updateStatusRes?.success) {
          notification.error({
            message: 'Lỗi',
            description: updateStatusRes?.message || 'Cập nhật trạng thái thất bại.',
          });
          return;
        }
      }

      notification.success({
        message: 'Thành công',
        description: 'Cập nhật bãi xe thành công!',
      });

      onSuccess({
        ...data,
        ...values,
      });
    } catch (error) {
      console.error(error);
      notification.error({
        message: 'Lỗi',
        description: 'Có lỗi không xác định xảy ra.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title="Cập nhật bãi xe"
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={isSubmitting}
      okText="Lưu"
      cancelText="Hủy"
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="Tên bãi xe"
          rules={[{ required: true, message: 'Vui lòng nhập tên bãi xe!' }]}
        >
          <Input placeholder="Nhập tên bãi xe" />
        </Form.Item>

        <Form.Item
          name="location"
          label="Vị trí"
          rules={[{ required: true, message: 'Vui lòng nhập vị trí!' }]}
        >
          <Input placeholder="Nhập vị trí" />
        </Form.Item>

        <Form.Item
          name="status"
          label="Trạng thái"
          rules={[{ required: true, message: 'Vui lòng chọn trạng thái!' }]}
        >
          <Select placeholder="Chọn trạng thái">
            <Option value={STATUS.EDITING}>Đang chỉnh sửa</Option>
            <Option value={STATUS.ACTIVE}>Hoạt động</Option>
            <Option value={STATUS.INACTIVE}>Ngừng hoạt động</Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default UpdateCarParkingModal;
