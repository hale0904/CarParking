export const barrierList = [
  { barrierId: 'B-01', name: 'Main Gate Entrance', status: 'closed', lastUpdated: new Date().toISOString() },
  { barrierId: 'B-02', name: 'Main Gate Exit', status: 'open', lastUpdated: new Date().toISOString() },
];

export const barrierLogs = [
  { id: 1, timestamp: new Date().toISOString(), licensePlate: '30A-12345', action: 'Entry', paymentStatus: 'Paid', gateStatus: 'Success' },
  { id: 2, timestamp: new Date().toISOString(), licensePlate: '29B-98765', action: 'Exit', paymentStatus: 'Unpaid', gateStatus: 'Failed' },
];

export const lprLogs = [
  { id: 1, ocrResult: '30A-12345', status: 'Matched (Auto)', image: 'https://placehold.co/200x100/EEE/31343C?text=30A-12345', timestamp: new Date().toISOString() },
  { id: 2, ocrResult: null, status: 'Failed', image: 'https://placehold.co/200x100/EEE/31343C?text=UNKNOWN', timestamp: new Date().toISOString() },
];

export const hardwareAlerts = [
  { id: 1, type: 'warning', message: 'Camera at Main Gate Entrance requires cleaning.' },
];
