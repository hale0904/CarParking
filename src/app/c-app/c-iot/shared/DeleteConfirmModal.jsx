// d:\Dev\DoAn\CarParking\src\app\c-app\c-iot\shared\DeleteConfirmModal.jsx
import React from 'react';
import { Modal, Button, message } from 'antd';

const DeleteConfirmModal = ({ open, device, onClose, onDelete }) => {
  if (!device) return null;

  const handleConfirm = () => {
    onDelete(device.id);
    if (device.linkedSlot) {
      message.warning(`Device deleted. Linked slot ${device.linkedSlot} set to Inactive.`);
    } else {
      message.success("Device deleted.");
    }
  };

  return (
    <Modal
      title="Confirm Delete Device"
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="delete" danger type="primary" onClick={handleConfirm}>
          Delete
        </Button>,
      ]}
    >
      <p>Are you sure you want to delete <b>{device.name}</b>?</p>
      {device.linkedSlot && (
        <p style={{ color: "var(--ant-color-warning)" }}>
          If this device is linked to slot <b>{device.linkedSlot}</b>, that slot will automatically be set to Inactive (Gray).
        </p>
      )}
    </Modal>
  );
};

export default DeleteConfirmModal;
