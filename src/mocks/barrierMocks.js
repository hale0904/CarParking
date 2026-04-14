// Mock data for Barrier Control Feature

export const barrierList = [
  {
    barrierId: 'GATE-001',
    name: 'Main Entry Gate',
    status: 'closed', // 'open' | 'closed' | 'error' | 'offline'
    lastUpdated: '2025-10-15T08:30:00Z',
  },
  {
    barrierId: 'GATE-002',
    name: 'Main Exit Gate',
    status: 'open',
    lastUpdated: '2025-10-15T08:32:00Z',
  },
];

export const barrierLogs = [
  { id: 1, timestamp: '2025-10-15T08:00:00Z', licensePlate: '29A-123.45', action: 'Entry', paymentStatus: 'N/A', gateStatus: 'Success' },
  { id: 2, timestamp: '2025-10-15T08:05:00Z', licensePlate: '30B-678.90', action: 'Exit', paymentStatus: 'Paid', gateStatus: 'Success' },
  { id: 3, timestamp: '2025-10-15T08:10:00Z', licensePlate: '29C-111.22', action: 'Entry', paymentStatus: 'N/A', gateStatus: 'Success' },
  { id: 4, timestamp: '2025-10-15T08:15:00Z', licensePlate: '51F-333.44', action: 'Exit', paymentStatus: 'Unpaid', gateStatus: 'Blocked' },
  { id: 5, timestamp: '2025-10-15T08:20:00Z', licensePlate: '60A-555.66', action: 'Entry', paymentStatus: 'N/A', gateStatus: 'Success' },
  { id: 6, timestamp: '2025-10-15T08:25:00Z', licensePlate: '15D-777.88', action: 'Exit', paymentStatus: 'Paid', gateStatus: 'Success' },
  { id: 7, timestamp: '2025-10-15T08:30:00Z', licensePlate: '29A-999.00', action: 'Entry', paymentStatus: 'N/A', gateStatus: 'Success' },
  { id: 8, timestamp: '2025-10-15T08:35:00Z', licensePlate: '30E-246.80', action: 'Exit', paymentStatus: 'Paid', gateStatus: 'Success' },
  { id: 9, timestamp: '2025-10-15T08:40:00Z', licensePlate: '51C-135.79', action: 'Entry', paymentStatus: 'N/A', gateStatus: 'Success' },
  { id: 10, timestamp: '2025-10-15T08:45:00Z', licensePlate: '29C-111.22', action: 'Exit', paymentStatus: 'Paid', gateStatus: 'Success' },
];

export const lprLogs = [
  { id: 101, timestamp: '2025-10-15T08:00:00Z', image: 'https://via.placeholder.com/150x80?text=Plate+1', ocrResult: '29A-123.45', status: 'Matched' },
  { id: 102, timestamp: '2025-10-15T08:05:00Z', image: 'https://via.placeholder.com/150x80?text=Plate+2', ocrResult: '30E-246.80', status: 'Matched' },
  { id: 103, timestamp: '2025-10-15T08:10:00Z', image: 'https://via.placeholder.com/150x80?text=Unclear', ocrResult: '???-111.22', status: 'Failed' },
  { id: 104, timestamp: '2025-10-15T08:15:00Z', image: 'https://via.placeholder.com/150x80?text=Plate+4', ocrResult: '51F-333.44', status: 'Matched' },
  { id: 105, timestamp: '2025-10-15T08:20:00Z', image: 'https://via.placeholder.com/150x80?text=Blurry', ocrResult: '60A-???', status: 'Failed' },
  { id: 106, timestamp: '2025-10-15T08:25:00Z', image: 'https://via.placeholder.com/150x80?text=Plate+6', ocrResult: '15D-777.88', status: 'Matched' },
  { id: 107, timestamp: '2025-10-15T08:30:00Z', image: 'https://via.placeholder.com/150x80?text=Wait', ocrResult: '29A-999.00', status: 'Matched' },
  { id: 108, timestamp: '2025-10-15T08:35:00Z', image: 'https://via.placeholder.com/150x80?text=Too+Dark', ocrResult: '', status: 'Failed' },
  { id: 109, timestamp: '2025-10-15T08:40:00Z', image: 'https://via.placeholder.com/150x80?text=Plate+9', ocrResult: '51C-135.79', status: 'Matched' },
  { id: 110, timestamp: '2025-10-15T08:45:00Z', image: 'https://via.placeholder.com/150x80?text=Plate+10', ocrResult: '29C-111.22', status: 'Matched' },
];

export const hardwareAlerts = [
  { id: 'ALT-01', type: 'Mechanical Jam', message: 'Main Entry Gate has detected a mechanical jam.', timestamp: '2025-10-15T08:28:00Z' },
  { id: 'ALT-02', type: 'Sensor Offline', message: 'Loop sensor at Exit Gate is currently offline.', timestamp: '2025-10-15T08:31:00Z' },
];
