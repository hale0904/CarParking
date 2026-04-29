const now = Date.now();

export const initialBarriers = [
  {
    barrierId: 'ENTRY-01',
    name: 'Main Entry Barrier',
    laneType: 'entry',
    status: 'closed',
    networkMode: 'online',
    vehicleDetected: false,
    safetyLoopClear: true,
    mechanicalJam: false,
    powerState: 'normal',
    lastUpdated: new Date(now - 90 * 1000).toISOString(),
    lastCommandSource: 'system',
    lastCommandReason: 'Initialised',
    lastCommandLatencyMs: 320,
  },
  {
    barrierId: 'EXIT-01',
    name: 'Main Exit Barrier',
    laneType: 'exit',
    status: 'closed',
    networkMode: 'online',
    vehicleDetected: false,
    safetyLoopClear: true,
    mechanicalJam: false,
    powerState: 'normal',
    lastUpdated: new Date(now - 2 * 60 * 1000).toISOString(),
    lastCommandSource: 'system',
    lastCommandReason: 'Initialised',
    lastCommandLatencyMs: 340,
  },
];

export const initialBarrierLogs = [
  {
    id: 'log-1',
    timestamp: new Date(now - 8 * 60 * 1000).toISOString(),
    barrierId: 'ENTRY-01',
    laneType: 'entry',
    licensePlate: '30A-12345',
    trigger: 'LPR verified',
    paymentStatus: 'N/A',
    commandStatus: 'Opened',
    safetyStatus: 'Clear',
    mode: 'Automatic',
    latencyMs: 420,
    notes: 'Barrier opened after successful plate validation.',
  },
  {
    id: 'log-2',
    timestamp: new Date(now - 3 * 60 * 1000).toISOString(),
    barrierId: 'EXIT-01',
    laneType: 'exit',
    licensePlate: '51H-67890',
    trigger: 'Payment success',
    paymentStatus: 'Paid',
    commandStatus: 'Opened',
    safetyStatus: 'Clear',
    mode: 'Automatic',
    latencyMs: 510,
    notes: 'Exit barrier opened after payment confirmation.',
  },
];

export const initialLprLogs = [
  {
    id: 'lpr-1',
    barrierId: 'ENTRY-01',
    laneType: 'entry',
    ocrResult: '30A-12345',
    status: 'Matched (Auto)',
    decision: 'Allowed',
    image: 'https://placehold.co/200x100/EEE/31343C?text=30A-12345',
    timestamp: new Date(now - 8 * 60 * 1000).toISOString(),
  },
  {
    id: 'lpr-2',
    barrierId: 'EXIT-01',
    laneType: 'exit',
    ocrResult: '51H-67890',
    status: 'Matched (Auto)',
    decision: 'Awaiting payment',
    image: 'https://placehold.co/200x100/EEE/31343C?text=51H-67890',
    timestamp: new Date(now - 3 * 60 * 1000).toISOString(),
  },
  {
    id: 'lpr-3',
    barrierId: 'ENTRY-01',
    laneType: 'entry',
    ocrResult: null,
    status: 'Failed',
    decision: 'Manual review required',
    image: 'https://placehold.co/200x100/EEE/31343C?text=UNKNOWN',
    timestamp: new Date(now - 75 * 1000).toISOString(),
  },
];

export const initialHardwareAlerts = [
  {
    id: 'alert-seed-1',
    type: 'Reliability Monitor',
    severity: 'info',
    message: 'Barrier simulation is running in mock mode. Relay pulse and sensor checks are simulated.',
    timestamp: new Date(now - 45 * 1000).toISOString(),
  },
];
