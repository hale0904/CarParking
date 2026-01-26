import React, { useState } from 'react';
import { Modal, Form, Input, notification } from 'antd';
import ParkingService from '../shared/service/services';

const AddCarParkingModal = ({ open, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setIsSubmitting(true);

      const payload = {
        code: 0, // ✅ CREATE
        name: values.name,
        location: values.location,
        status: 0, // ✅ backend yêu cầu status = 0 khi tạo
      };

      const res = await ParkingService.saveParking(payload);

      if (res?.success) {
        notification.success({
          message: 'Thành công',
          description: 'Thêm bãi xe mới thành công!',
        });

        form.resetFields();
        onSuccess(res.data || payload);
      } else {
        notification.error({
          message: 'Lỗi',
          description: res?.message || 'Có lỗi xảy ra khi thêm bãi xe.',
        });
      }
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
      title="Thêm bãi xe mới"
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
      </Form>
    </Modal>
  );
};

export default AddCarParkingModal;
