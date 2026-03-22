// d:\Dev\DoAn\CarParking\src\app\c-app\c-iot\utils\deviceHelpers.js

export const DEVICE_TYPES = ["Sensor", "Camera", "Barrier"];
export const DEVICE_STATUSES = ["Online", "Offline", "Unlinked"];

export const TYPE_COLOR = {
  Sensor: "blue",
  Camera: "purple",
  Barrier: "orange"
};

export const STATUS_COLOR = {
  Online: "green",
  Offline: "red",
  Unlinked: "default"
};

export const generateMockDevices = () => {
  return [
    { id: "DEV-001", name: "Sensor Tầng 1 - A1", deviceId: "AA:BB:CC:DD:EE:01", type: "Sensor", status: "Online", linkedSlot: "A1" },
    { id: "DEV-002", name: "Sensor Tầng 1 - A2", deviceId: "AA:BB:CC:DD:EE:02", type: "Sensor", status: "Offline", linkedSlot: "A2" },
    { id: "DEV-003", name: "Camera Cổng Vào", deviceId: "11:22:33:44:55:66", type: "Camera", status: "Online", linkedSlot: null },
    { id: "DEV-004", name: "Barrier Cổng Vào", deviceId: "11:22:33:44:55:67", type: "Barrier", status: "Online", linkedSlot: null },
    { id: "DEV-005", name: "Sensor Tầng 2 - B1", deviceId: "AA:BB:CC:DD:EE:05", type: "Sensor", status: "Unlinked", linkedSlot: null },
    { id: "DEV-006", name: "Camera Cổng Ra", deviceId: "11:22:33:44:55:68", type: "Camera", status: "Offline", linkedSlot: null },
    { id: "DEV-007", name: "Barrier Cổng Ra", deviceId: "11:22:33:44:55:69", type: "Barrier", status: "Online", linkedSlot: null },
    { id: "DEV-008", name: "Sensor Tầng 1 - A3", deviceId: "AA:BB:CC:DD:EE:03", type: "Sensor", status: "Online", linkedSlot: "A3" },
  ];
};
