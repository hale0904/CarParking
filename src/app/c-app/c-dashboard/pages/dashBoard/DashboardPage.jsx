import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Typography,
  Row,
  Col,
  Card,
  Space,
  Tag,
  Divider,
  Tabs,
  ConfigProvider,
  Statistic,
  Empty,
  Alert,
  Spin,
  message,
  notification,
  DatePicker,
  Select,
  Button,
  Badge,
} from 'antd';
import {
  ExpandOutlined,
  FilePdfOutlined,
  FileExcelOutlined,
  WifiOutlined,
} from '@ant-design/icons';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import { io } from 'socket.io-client';
import dayjs from 'dayjs';

import axiosClient from '../../../../c-lib/axios/axiosClient.service';
import {
  CONFLICT_API,
  EXPORT_API,
  PARKING_API,
  STATISTICAL_API,
  TURNOVER_API,
  REVENUE_API,
} from '../../../../c-lib/api';
import EditorCanvas from '../../../c-map/pages/editor/EditorCanvas';
import { useAdminI18n } from '../../../../c-lib/i18n/adminI18n';

// ─── Constants ───────────────────────────────────────────────────────────────

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');

const DEFAULT_DATE_RANGE = [dayjs().startOf('month'), dayjs()];
const DEFAULT_REVENUE_CUSTOM_RANGE = [dayjs().startOf('month'), dayjs()];

const CURRENCY_FORMATTER = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
});

const SLOT_STATUS_MAP = {
  0: 'available',
  1: 'occupied',
  2: 'reserved',
  3: 'inactive',
};

const EXPORT_FORMAT_CONFIG = {
  pdf: {
    extension: 'pdf',
    mimeType: 'application/pdf',
  },
  excel: {
    extension: 'xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  },
};

// ─── Pure helpers ─────────────────────────────────────────────────────────────

const safeNumber = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);

const formatCurrency = (value) => CURRENCY_FORMATTER.format(safeNumber(value));

const getFirstAvailableArray = (source, keys) => {
  if (!source || typeof source !== 'object') return [];
  for (const key of keys) {
    if (Array.isArray(source[key])) return source[key];
  }
  return [];
};

const getLabelFromItem = (item, fallbackIndex) =>
  item?.label ??
  item?.period ??
  item?.date ??
  item?.month ??
  item?.day ??
  item?.time ??
  item?.name ??
  `Point ${fallbackIndex + 1}`;

const getFilenameFromDisposition = (contentDisposition, fallbackFilename) => {
  if (!contentDisposition) return fallbackFilename;
  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1]);
  const asciiMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
  if (asciiMatch?.[1]) return asciiMatch[1];
  return fallbackFilename;
};

const escapeCsvCell = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;

const parseBlobErrorMessage = async (error) => {
  const blob = error?.response?.data;
  if (!(blob instanceof Blob)) {
    return error?.response?.data?.message || error?.message || null;
  }
  try {
    const text = await blob.text();
    if (!text) return error?.message || null;
    try {
      const parsed = JSON.parse(text);
      return parsed?.message || parsed?.error || error?.message || null;
    } catch {
      return text;
    }
  } catch {
    return error?.message || null;
  }
};

const translateExportErrorMessage = (msg) => {
  if (!msg) return 'Failed to export parking report';
  if (msg.includes('Không có dữ liệu cho các bộ lọc đã chọn')) {
    return 'No data matches the selected filters. Export was cancelled.';
  }
  return msg;
};

// ─── Map data helpers ─────────────────────────────────────────────────────────

const parseLegacyLanesToGraph = (lanesApiData, apiNodes = []) => {
  const laneNodes = [];
  const laneEdges = [];
  const mongoIdToCode = {};

  apiNodes.forEach((n) => {
    laneNodes.push({ id: n.code, x: n.positionX, y: n.positionY });
    if (n._id) mongoIdToCode[n._id] = n.code;
  });

  lanesApiData.forEach((l, i) => {
    const pts = l.points;
    const w = l.laneWidth || l.height || 20;
    if (!pts || pts.length < 4) return;

    const fromNodeId = mongoIdToCode[l.fromNodeId] || l.fromNodeId;
    const toNodeId = mongoIdToCode[l.toNodeId] || l.toNodeId;

    if (fromNodeId && toNodeId) {
      if (!laneNodes.find((n) => n.id === fromNodeId))
        laneNodes.push({ id: fromNodeId, x: pts[0], y: pts[1] });
      if (!laneNodes.find((n) => n.id === toNodeId))
        laneNodes.push({ id: toNodeId, x: pts[pts.length - 2], y: pts[pts.length - 1] });
      if (!laneEdges.find((e) => e.fromNodeId === fromNodeId && e.toNodeId === toNodeId))
        laneEdges.push({ id: l.code, fromNodeId, toNodeId, width: w });
    } else {
      const TOLERANCE = 15;
      let prevNodeId = null;
      for (let j = 0; j < pts.length; j += 2) {
        const x = pts[j];
        const y = pts[j + 1];
        let node = laneNodes.find((n) => Math.hypot(n.x - x, n.y - y) < TOLERANCE);
        if (!node) {
          node = { id: `node-${l.code || i}-${j}`, x, y };
          laneNodes.push(node);
        }
        if (prevNodeId && prevNodeId !== node.id) {
          const exists = laneEdges.find(
            (e) =>
              (e.fromNodeId === prevNodeId && e.toNodeId === node.id) ||
              (e.fromNodeId === node.id && e.toNodeId === prevNodeId),
          );
          if (!exists)
            laneEdges.push({
              id: `edge-${l.code || i}-${j}`,
              fromNodeId: prevNodeId,
              toNodeId: node.id,
              width: w,
            });
        }
        prevNodeId = node.id;
      }
    }
  });

  return { laneNodes, laneEdges };
};

const mapSlotStatus = (status) =>
  status === 0
    ? 'available'
    : status === 1
      ? 'occupied'
      : status === 2
        ? 'reserved'
        : status === 3
          ? 'inactive'
          : 'available';

const mapFloorData = (floor) => ({
  id: floor.code,
  name: floor.nameFloor,
  boundary: floor.boundary || { points: [], closed: false },
  standaloneSlots: [],
  ...parseLegacyLanesToGraph(floor.lanes || [], floor.laneNodes || []),
  entrances: (floor.entrances || []).map((e) => ({
    id: e.code,
    x: e.positionX,
    y: e.positionY,
    width: e.witdh,
    height: e.height,
    rotation: e.rotation,
  })),
  exits: (floor.exits || []).map((e) => ({
    id: e.code,
    x: e.positionX,
    y: e.positionY,
    width: e.witdh,
    height: e.height,
    rotation: e.rotation,
  })),
  zones: (floor.zones || []).map((zone) => ({
    id: zone.code,
    name: zone.nameZone,
    color: zone.color || '#3b82f6',
    points: zone.points,
    slotGroups: (zone.groupSlots || []).map((group) => ({
      id: group.code,
      x: group.positionX,
      y: group.positionY,
      width: group.width,
      height: group.height,
      rotation: group.rotation,
      direction: group.direction,
      slots: (group.slots || []).map((slot) => ({
        id: slot._id?.toString(),
        code: slot.code,
        status: mapSlotStatus(slot.status),
        sensorId: slot.sensorId,
        sensorStatus: slot.sensorStatus,
      })),
    })),
  })),
});

// ─── Sub-components ───────────────────────────────────────────────────────────

const FloorMapView = ({ floor, metadata }) => {
  const [scale, setScale] = useState(0.5);

  return (
    <EditorCanvas
      zones={floor.zones}
      standaloneSlots={floor.standaloneSlots || []}
      laneNodes={floor.laneNodes || []}
      laneEdges={floor.laneEdges || []}
      entrances={floor.entrances || []}
      exits={floor.exits || []}
      boundary={floor.boundary || { points: [], closed: false }}
      selectedEntity={null}
      onSelect={() => {}}
      onUpdateZone={() => {}}
      onUpdateSlotGroup={() => {}}
      onUpdateStandaloneSlot={() => {}}
      onUpdateLane={() => {}}
      onUpdateEntrance={() => {}}
      onUpdateExit={() => {}}
      onDrop={() => {}}
      scale={scale}
      setScale={setScale}
      onUpdateBoundary={() => {}}
      onFinishBoundary={() => {}}
      editorMode="PAN"
      draftZone={{ points: [], closed: false }}
      setDraftZone={() => {}}
      onFinishZone={() => {}}
      gridRealSize={metadata?.gridRealSize || 2.5}
      parkingUnit={metadata?.unit || 'm'}
      readOnly
    />
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const DashboardPage = () => {
  const { t, language } = useAdminI18n();
  const socketRef = useRef(null);

  // ── State ──────────────────────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(true);
  const [mapData, setMapData] = useState(null);
  const [statsData, setStatsData] = useState(null);
  const [turnoverData, setTurnoverData] = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [zoneOptions, setZoneOptions] = useState([]);
  const [selectedZoneIds, setSelectedZoneIds] = useState([]);
  const [dateRange, setDateRange] = useState(DEFAULT_DATE_RANGE);
  const [revenueType, setRevenueType] = useState('month');
  const [revenueCustomRange, setRevenueCustomRange] = useState(DEFAULT_REVENUE_CUSTOM_RANGE);
  const [statsLoading, setStatsLoading] = useState(false);
  const [turnoverLoading, setTurnoverLoading] = useState(false);
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [conflictInfo, setConflictInfo] = useState(null);
  const conflictStatusRef = useRef(false);

  // ── Derived ────────────────────────────────────────────────────────────────
  const conflictMessage =
    language === 'vi' ? 'Phát hiện xung đột đỗ xe' : 'Parking Conflict Detected';

  // ── Effects: load map ──────────────────────────────────────────────────────
  useEffect(() => {
    const fetchMap = async () => {
      try {
        const res = await axiosClient.post(PARKING_API.GET_LIST, {});
        const list = res?.data || res;
        if (!list?.length) return;

        const item = list[0];
        const zonesFromMap = (item.floors || []).flatMap((floor) =>
          (floor.zones || []).map((zone) => ({
            label: zone.nameZone || zone.code || zone._id,
            value: zone._id,
          })),
        );
        setZoneOptions(zonesFromMap);
        setMapData({
          metadata: { gridRealSize: 2.5, unit: 'm' },
          parking: {
            floors: (item.floors || []).filter((f) => f.status === 1).map(mapFloorData),
          },
        });
      } catch (err) {
        message.error(t('dashboard.failedToLoadMap', { message: err.message }));
      } finally {
        setIsLoading(false);
      }
    };

    fetchMap();
  }, []);

  // ── Effects: statistics ────────────────────────────────────────────────────
  useEffect(() => {
    if (!dateRange?.length === 2) return;

    const fetchStatistical = async () => {
      setStatsLoading(true);
      try {
        const res = await axiosClient.post(STATISTICAL_API.GET_STATISTICAL, {
          expectedArrivalTime: dateRange[0].toISOString(),
          expectedLeaveTime: dateRange[1].toISOString(),
          zoneIds: selectedZoneIds,
        });
        const zones = res?.data || [];
        const aggregated = zones.reduce(
          (acc, zone) => ({
            totalSlots: acc.totalSlots + (zone.totalSlots || 0),
            available: acc.available + (zone.empty || 0),
            occupied: acc.occupied + (zone.used || 0),
            percentEmptySum: acc.percentEmptySum + (zone.percentEmpty || 0),
            percentUsedSum: acc.percentUsedSum + (zone.percentUsed || 0),
          }),
          { totalSlots: 0, available: 0, occupied: 0, percentEmptySum: 0, percentUsedSum: 0 },
        );
        setStatsData({ ...aggregated, zoneCount: zones.length, zones });
      } catch (err) {
        message.error(
          err?.response?.data?.message || err.message || t('dashboard.failedToLoadStatisticalData'),
        );
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStatistical();
  }, [selectedZoneIds, dateRange]);

  // ── Effects: turnover ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!dateRange?.length === 2) return;

    const fetchTurnover = async () => {
      setTurnoverLoading(true);
      try {
        const res = await axiosClient.post(TURNOVER_API.GET_TURNOVER, {
          startDate: dateRange[0].format('YYYY-MM-DD'),
          endDate: dateRange[1].format('YYYY-MM-DD'),
          zoneIds: selectedZoneIds,
        });
        setTurnoverData(res?.data || null);
      } catch (err) {
        message.error(
          err?.response?.data?.message || err.message || t('dashboard.failedToLoadTurnoverData'),
        );
      } finally {
        setTurnoverLoading(false);
      }
    };

    fetchTurnover();
  }, [selectedZoneIds, dateRange]);

  // ── Effects: revenue ───────────────────────────────────────────────────────
  useEffect(() => {
    if (revenueType === 'custom' && revenueCustomRange?.length !== 2) return;

    const fetchRevenue = async () => {
      setRevenueLoading(true);
      try {
        const payload =
          revenueType === 'custom'
            ? {
                type: 'custom',
                startDate: revenueCustomRange[0].format('YYYY-MM-DD'),
                endDate: revenueCustomRange[1].format('YYYY-MM-DD'),
              }
            : { type: revenueType };

        const res = await axiosClient.post(REVENUE_API.GET_REVENUE, payload);
        setRevenueData(res?.data || null);
      } catch (err) {
        message.error(
          err?.response?.data?.message || err.message || t('dashboard.failedToLoadRevenueData'),
        );
      } finally {
        setRevenueLoading(false);
      }
    };

    fetchRevenue();
  }, [revenueType, revenueCustomRange]);

  // ── Effects: conflict polling ──────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    conflictStatusRef.current = false;

    const validateConflict = async () => {
      let payload = null;
      try {
        payload = await axiosClient
          .post(CONFLICT_API.VALIDATE_CONFLICT, {})
          .catch(() => axiosClient.get(CONFLICT_API.VALIDATE_CONFLICT));
      } catch {}

      if (!isMounted) return;

      const data = payload?.data || {};
      const isConflict = Boolean(data?.isConflict);
      const wasConflict = conflictStatusRef.current;
      conflictStatusRef.current = isConflict;

      setConflictInfo(
        isConflict
          ? {
              message: language === 'vi' ? data.message || conflictMessage : conflictMessage,
              totalOccupied: data.totalOccupied ?? 0,
              totalActiveSessions: data.totalActiveSessions ?? 0,
            }
          : null,
      );

      if (isConflict && !wasConflict) {
        notification.error({
          key: 'parking-conflict',
          message: language === 'vi' ? data.message || conflictMessage : conflictMessage,
          description:
            language === 'vi'
              ? `Số chỗ đang chiếm: ${data.totalOccupied ?? 0} — Phiên đang hoạt động: ${data.totalActiveSessions ?? 0}`
              : `Occupied slots: ${data.totalOccupied ?? 0} — Active sessions: ${data.totalActiveSessions ?? 0}`,
          duration: 0,
          placement: 'topRight',
        });
      }

      if (!isConflict && wasConflict) {
        notification.destroy('parking-conflict');
      }
    };

    validateConflict();
    const id = setInterval(validateConflict, 5_000);

    return () => {
      isMounted = false;
      clearInterval(id);
    };
  }, [language]); // re-subscribe when language changes so messages use correct locale

  // ── Effects: socket ────────────────────────────────────────────────────────
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10_000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketConnected(true);
      socket.emit('ping', 'Hello server');
    });
    socket.on('disconnect', () => setSocketConnected(false));
    socket.on('connect_error', () => setSocketConnected(false));

    socket.on('slot:update', ({ slotId, slotStatus }) => {
      setMapData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          parking: {
            ...prev.parking,
            floors: prev.parking.floors.map((floor) => ({
              ...floor,
              zones: floor.zones.map((zone) => ({
                ...zone,
                slotGroups: zone.slotGroups.map((group) => ({
                  ...group,
                  slots: group.slots.map((slot) =>
                    slot.id?.toString() === slotId
                      ? { ...slot, status: SLOT_STATUS_MAP[slotStatus] ?? slot.status }
                      : slot,
                  ),
                })),
              })),
            })),
          },
        };
      });
    });

    return () => socket.disconnect();
  }, []);

  // ── Derived data ───────────────────────────────────────────────────────────
  const allSlotsGlobal = useMemo(
    () =>
      mapData
        ? mapData.parking.floors.flatMap((f) =>
            f.zones.flatMap((z) => (z.slotGroups || []).flatMap((g) => g.slots || [])),
          )
        : [],
    [mapData],
  );

  const pieData = [
    {
      name: 'AVAILABLE',
      value: statsData?.available ?? allSlotsGlobal.filter((s) => s.status === 'available').length,
      color: '#52c41a',
    },
    {
      name: 'OCCUPIED',
      value: statsData?.occupied ?? allSlotsGlobal.filter((s) => s.status === 'occupied').length,
      color: '#595959',
    },
  ];

  const totalDisplay = statsData?.totalSlots ?? allSlotsGlobal.length;
  const turnoverPercent =
    typeof turnoverData?.turnover === 'number' ? turnoverData.turnover * 100 : 0;

  const revenueSeriesData = useMemo(() => {
    const root = revenueData?.data || revenueData || {};
    const points = Array.isArray(root)
      ? root
      : getFirstAvailableArray(root, ['breakdown', 'series', 'details', 'items', 'list', 'rows']);

    if (points.length > 0) {
      return points.map((item, index) => ({
        name: getLabelFromItem(item, index),
        revenue: safeNumber(item.revenue ?? item.totalRevenue ?? item.amount ?? item.value),
        sessions: safeNumber(item.totalSessions ?? item.sessions ?? item.count),
      }));
    }

    return [
      {
        name: revenueType === 'day' ? 'Today' : revenueType === 'month' ? 'This Month' : 'Custom',
        revenue: safeNumber(revenueData?.totalRevenue),
        sessions: safeNumber(revenueData?.totalSessions),
      },
    ];
  }, [revenueData, revenueType]);

  const turnoverSeriesData = useMemo(() => {
    const root = turnoverData?.data || turnoverData || {};
    const points = Array.isArray(root)
      ? root
      : getFirstAvailableArray(root, ['breakdown', 'series', 'details', 'items', 'list', 'rows']);

    if (points.length > 0) {
      return points.map((item, index) => ({
        name: getLabelFromItem(item, index),
        sessions: safeNumber(item.totalSessions ?? item.sessions ?? item.count),
        turnoverRate: safeNumber(item.turnover ?? item.rate ?? item.turnoverRate) * 100,
      }));
    }

    return [
      {
        name: 'Summary',
        sessions: safeNumber(turnoverData?.totalSessions),
        turnoverRate: safeNumber(turnoverData?.turnover) * 100,
      },
    ];
  }, [turnoverData]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleExportReport = async (format) => {
    const config = EXPORT_FORMAT_CONFIG[format];
    if (!config) return;

    if (!dateRange || dateRange.length !== 2) {
      message.warning(t('dashboard.invalidStatisticalRange'));
      return;
    }
    if (statsLoading) {
      message.info(t('dashboard.statsStillLoading'));
      return;
    }
    if (statsData && !statsData.zones?.length) {
      message.warning(t('dashboard.noStatsToExport'));
      return;
    }

    setExportLoading(format);
    try {
      const response = await axiosClient.post(
        EXPORT_API.EXPORT_REPORT,
        {
          expectedArrivalTime: dateRange[0].format('YYYY-MM-DDTHH:mm:ss'),
          expectedLeaveTime: dateRange[1].format('YYYY-MM-DDTHH:mm:ss'),
          zoneIds: selectedZoneIds,
          format,
        },
        { responseType: 'blob', _returnFullResponse: true },
      );

      const blob = new Blob([response.data], {
        type: response.headers['content-type'] || config.mimeType,
      });
      const fallbackFilename = `parking-report-${dayjs().format('YYYYMMDD-HHmmss')}.${config.extension}`;
      const filename = getFilenameFromDisposition(
        response.headers['content-disposition'],
        fallbackFilename,
      );
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      message.success(
        format === 'pdf' ? t('dashboard.exportedParkingPdf') : t('dashboard.exportedParkingExcel'),
      );
    } catch (err) {
      const errorMessage = await parseBlobErrorMessage(err);
      message.error(translateExportErrorMessage(errorMessage));
    } finally {
      setExportLoading(null);
    }
  };

  const handleExportCsv = () => {
    if (statsLoading || turnoverLoading || revenueLoading) {
      message.info(t('dashboard.dashboardDataStillLoading'));
      return;
    }

    const selectedZoneLabel =
      selectedZoneIds.length > 0
        ? t('dashboard.selectedZones', { count: selectedZoneIds.length })
        : t('common.allZones');

    const summaryRows = [
      ['Section', 'Metric', 'Value'],
      ['General', 'Selected Zones', selectedZoneLabel],
      ['General', 'Total Slots', safeNumber(totalDisplay)],
      ['General', 'Available Slots', safeNumber(pieData[0]?.value)],
      ['General', 'Occupied Slots', safeNumber(pieData[1]?.value)],
      ['Turnover', 'Total Sessions', safeNumber(turnoverData?.totalSessions)],
      ['Turnover', 'Total Slots', safeNumber(turnoverData?.totalSlots)],
      ['Turnover', 'Turnover Rate (%)', Number.isFinite(turnoverPercent) ? turnoverPercent : 0],
      ['Revenue', 'Total Revenue', safeNumber(revenueData?.totalRevenue)],
      ['Revenue', 'Total Sessions', safeNumber(revenueData?.totalSessions)],
    ];

    const revenueRows = [
      [],
      ['Revenue Trend'],
      ['Period', 'Revenue', 'Sessions'],
      ...revenueSeriesData.map((row) => [row.name, row.revenue, row.sessions]),
    ];

    const turnoverRows = [
      [],
      ['Turnover Trend'],
      ['Period', 'Sessions', 'Turnover Rate (%)'],
      ...turnoverSeriesData.map((row) => [row.name, row.sessions, row.turnoverRate]),
    ];

    const csvContent = [...summaryRows, ...revenueRows, ...turnoverRows]
      .map((row) => row.map(escapeCsvCell).join(','))
      .join('\n');

    const blob = new Blob([`\ufeff${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dashboard-report-${dayjs().format('YYYYMMDD-HHmmss')}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    message.success(t('dashboard.exportedDashboardCsv'));
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Spin spinning={isLoading}>
      <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <Title level={4} style={{ margin: 0 }}>
            {t('dashboard.title')}
          </Title>
          <Space>
            <WifiOutlined style={{ color: socketConnected ? '#52c41a' : '#ff4d4f' }} />
            <Badge
              status={socketConnected ? 'processing' : 'error'}
              text={
                <Text style={{ fontSize: 12, color: socketConnected ? '#52c41a' : '#ff4d4f' }}>
                  {socketConnected ? 'Live' : 'Offline'}
                </Text>
              }
            />
          </Space>
        </div>

        {/* Conflict inline alert — always visible in page while conflict persists */}
        {conflictInfo && (
          <Alert
            type="error"
            showIcon
            message={conflictInfo.message}
            description={
              language === 'vi'
                ? `Số chỗ đang chiếm: ${conflictInfo.totalOccupied} — Phiên đang hoạt động: ${conflictInfo.totalActiveSessions}`
                : `Occupied slots: ${conflictInfo.totalOccupied} — Active sessions: ${conflictInfo.totalActiveSessions}`
            }
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Filters */}
        <Card style={{ marginBottom: 16, borderRadius: 10 }} bordered={false}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={8}>
              <Space direction="vertical" size={6} style={{ width: '100%' }}>
                <Text strong>{t('dashboard.zoneFilter')}</Text>
                <Select
                  mode="multiple"
                  allowClear
                  placeholder={t('common.allZones')}
                  value={selectedZoneIds}
                  onChange={setSelectedZoneIds}
                  options={zoneOptions}
                  style={{ width: '100%' }}
                  maxTagCount="responsive"
                />
              </Space>
            </Col>
            <Col xs={24} md={12}>
              <Space direction="vertical" size={6} style={{ width: '100%' }}>
                <Text strong>{t('Data range')}</Text>
                <RangePicker
                  value={dateRange}
                  onChange={(value) => value && setDateRange(value)}
                  style={{ width: '100%' }}
                />
              </Space>
            </Col>
            <Col span={24}>
              <Space size={8}>
                <Button icon={<FileExcelOutlined />} onClick={handleExportCsv}>
                  {t('dashboard.exportCsv')}
                </Button>
                <Button
                  type="primary"
                  icon={<FilePdfOutlined />}
                  onClick={() => handleExportReport('pdf')}
                  loading={exportLoading === 'pdf'}
                >
                  {t('dashboard.exportPdf')}
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Metric cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {/* Status Overview */}
          <Col xs={24} xl={8}>
            <Card
              title={
                <span style={{ color: 'white', fontSize: 14 }}>
                  {t('dashboard.statusOverview')}
                </span>
              }
              style={{
                background: '#1a1a2e',
                borderRadius: 10,
                height: '100%',
                position: 'relative',
              }}
              bordered={false}
              styles={{
                header: { borderBottom: '1px solid #333' },
                body: { position: 'relative' },
              }}
            >
              <Spin spinning={statsLoading}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ position: 'relative', width: 200, height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          dataKey="value"
                          stroke="none"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center',
                      }}
                    >
                      <div
                        style={{ fontSize: 24, fontWeight: 'bold', color: 'white', lineHeight: 1 }}
                      >
                        {totalDisplay}
                      </div>
                      <div style={{ fontSize: 12, color: '#d9d9d9' }}>
                        {t('dashboard.totalSlot')}
                      </div>
                    </div>
                  </div>

                  <div style={{ width: '100%', marginTop: 16 }}>
                    {pieData.map((item) => (
                      <div
                        key={item.name}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: 8,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                              background: item.color,
                              marginRight: 8,
                            }}
                          />
                          <Text style={{ color: 'white' }}>{item.name}</Text>
                        </div>
                        <Text style={{ color: 'white', fontWeight: 'bold' }}>
                          {typeof item.value === 'number' ? item.value : 0}
                        </Text>
                      </div>
                    ))}
                  </div>
                  <Divider style={{ borderColor: '#333', margin: '16px 0' }} />
                </div>
              </Spin>
              <ExpandOutlined
                style={{ position: 'absolute', bottom: 16, right: 16, color: 'gray', fontSize: 16 }}
              />
            </Card>
          </Col>

          {/* Turnover */}
          <Col xs={24} xl={8}>
            <Card
              title={t('dashboard.turnover')}
              style={{ borderRadius: 10, height: '100%' }}
              bordered={false}
            >
              <Spin spinning={turnoverLoading}>
                <div style={{ marginBottom: 8 }}>
                  <Text type="secondary">
                    {t('dashboard.overallTurnover', {
                      value: (Number.isFinite(turnoverPercent) ? turnoverPercent : 0).toFixed(2),
                    })}
                  </Text>
                </div>
                <div style={{ width: '100%', height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={turnoverSeriesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Bar
                        yAxisId="left"
                        dataKey="sessions"
                        fill="#1677ff"
                        name={t('dashboard.sessions')}
                      />
                      <Bar
                        yAxisId="right"
                        dataKey="turnoverRate"
                        fill="#52c41a"
                        name={t('dashboard.turnoverRate')}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Spin>
            </Card>
          </Col>

          {/* Revenue */}
          <Col xs={24} xl={8}>
            <Card
              title={t('dashboard.revenue')}
              style={{ borderRadius: 10, height: '100%' }}
              bordered={false}
              extra={
                <Select
                  value={revenueType}
                  onChange={setRevenueType}
                  options={[
                    { label: t('dashboard.today'), value: 'day' },
                    { label: t('dashboard.thisMonth'), value: 'month' },
                    { label: t('dashboard.custom'), value: 'custom' },
                  ]}
                  style={{ width: 130 }}
                />
              }
            >
              <Spin spinning={revenueLoading}>
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  {revenueType === 'custom' && (
                    <RangePicker
                      value={revenueCustomRange}
                      onChange={(value) => value && setRevenueCustomRange(value)}
                      style={{ width: '100%' }}
                    />
                  )}
                  <Text strong>
                    {t('dashboard.totalRevenue', {
                      value: formatCurrency(revenueData?.totalRevenue || 0),
                    })}
                  </Text>
                  <div style={{ width: '100%', height: 280 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={revenueSeriesData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip
                          formatter={(value, key) =>
                            key === 'revenue' ? formatCurrency(value) : safeNumber(value)
                          }
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="revenue"
                          stroke="#722ed1"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          name={t('dashboard.revenue')}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Space>
              </Spin>
            </Card>
          </Col>
        </Row>

        {/* Parking map */}
        <Title level={4}>{t('dashboard.parkingMap')}</Title>
        <Divider style={{ marginTop: 0, marginBottom: 16 }} />

        <ConfigProvider
          theme={{
            components: {
              Tabs: {
                itemActiveColor: '#ff7875',
                itemSelectedColor: '#ff7875',
                inkBarColor: '#ff7875',
              },
            },
          }}
        >
          {mapData ? (
            <Tabs
              type="card"
              defaultActiveKey={mapData.parking.floors[0]?.id}
              items={mapData.parking.floors.map((floor) => {
                const allSlots = floor.zones.flatMap((z) =>
                  (z.slotGroups || []).flatMap((g) => g.slots || []),
                );
                return {
                  key: floor.id,
                  label: t('dashboard.floor', { name: floor.name }),
                  children: (
                    <div
                      style={{
                        background: '#e8e8e8',
                        minHeight: 400,
                        borderRadius: '0 8px 8px 8px',
                        padding: 24,
                        border: '1px solid #f0f0f0',
                        borderTop: 'none',
                      }}
                    >
                      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                        <Col span={6}>
                          <Statistic title={t('dashboard.totalSlots')} value={allSlots.length} />
                        </Col>
                        <Col span={6}>
                          <Statistic
                            title={t('dashboard.available')}
                            value={allSlots.filter((s) => s.status === 'available').length}
                            valueStyle={{ color: '#52c41a' }}
                          />
                        </Col>
                        <Col span={6}>
                          <Statistic
                            title={t('dashboard.occupied')}
                            value={allSlots.filter((s) => s.status === 'occupied').length}
                            valueStyle={{ color: '#ff4d4f' }}
                          />
                        </Col>
                        <Col span={6}>
                          <Statistic
                            title={t('dashboard.reserved')}
                            value={allSlots.filter((s) => s.status === 'reserved').length}
                            valueStyle={{ color: '#faad14' }}
                          />
                        </Col>
                      </Row>
                      <Divider />
                      {floor.zones.map((zone) => (
                        <Tag key={zone.id} color={zone.color} style={{ marginBottom: 8 }}>
                          {zone.name}:{' '}
                          {(zone.slotGroups || []).flatMap((g) => g.slots || []).length}{' '}
                          {t('dashboard.slotsSuffix')}
                        </Tag>
                      ))}
                      <div
                        style={{
                          marginTop: 16,
                          border: '1px solid #e5e7eb',
                          borderRadius: 8,
                          overflow: 'hidden',
                          background: '#f9fafb',
                        }}
                      >
                        <FloorMapView key={floor.id} floor={floor} metadata={mapData.metadata} />
                      </div>
                    </div>
                  ),
                };
              })}
            />
          ) : (
            <Empty description={t('dashboard.noMapYet')} />
          )}
        </ConfigProvider>
      </div>
    </Spin>
  );
};

export default DashboardPage;
