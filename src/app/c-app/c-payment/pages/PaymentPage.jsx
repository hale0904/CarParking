import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Descriptions,
  Drawer,
  Empty,
  Image,
  List,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  CheckCircleOutlined,
  CreditCardOutlined,
  DollarCircleOutlined,
  QrcodeOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import axiosClient from '../../../c-lib/axios/axiosClient.service';
import { PAYMENT_API } from '../../../c-lib/api';
import { useAdminI18n } from '../../../c-lib/i18n/adminI18n';
import './PaymentPage.scss';

const { Title, Text, Paragraph } = Typography;

const getQrUrl = (item) =>
  item?.qrPayment?.qrUrl ||
  item?.qrUrl ||
  item?.qrImage ||
  item?.qrCode ||
  item?.qr ||
  item?.paymentQr ||
  item?.paymentQrUrl ||
  item?.url ||
  item?.link ||
  item?.image;

const getPaymentContent = (item) =>
  item?.qrPayment?.content || item?.transaction?.paymentCode || item?.transaction?.code || '--';

const getSessionList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.sessions)) return payload.sessions;
  if (Array.isArray(payload?.items)) return payload.items;
  if (payload && typeof payload === 'object') return [payload];
  return [];
};

const formatDateTime = (value, language) => {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US');
};

const formatCurrency = (value, language) =>
  new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const statusColorMap = {
  COMPLETED: 'green',
  PAID: 'green',
  PENDING: 'gold',
  FAILED: 'red',
  EXPIRED: 'volcano',
  UNPAID: 'default',
  ONGOING: 'blue',
};

const PAYMENT_STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Status' },
  { value: 'PAID', label: 'PAID' },
  { value: 'UNPAID', label: 'UNPAID' },
];

const BACKGROUND_REFRESH_MS = 15000;

const PaymentPage = () => {
  const { t, language } = useAdminI18n();
  const [qrSessions, setQrSessions] = useState([]);
  const [qrLoading, setQrLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [verifyLoadingKey, setVerifyLoadingKey] = useState(null);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('ALL');
  const [selectedSession, setSelectedSession] = useState(null);
  const [activityLog, setActivityLog] = useState([]);
  const isFetchingRef = useRef(false);

  const updateSessionLocally = (session, resultSession) => {
    if (!resultSession) return;

    setQrSessions((prev) =>
      prev.map((item) =>
        item._rowKey === session._rowKey
          ? {
              ...item,
              ...resultSession,
              statusPayment: resultSession.statusPayment ?? item.statusPayment,
              statusPaymentName: resultSession.statusPaymentName || item.statusPaymentName,
              status: resultSession.status ?? item.status,
              statusName: resultSession.statusName || item.statusName,
              checkOutTime: resultSession.checkOutTime || item.checkOutTime,
              price: resultSession.price ?? item.price,
              qrPayment: item.qrPayment
                ? {
                    ...item.qrPayment,
                    status: resultSession.statusPaymentName || 'PAID',
                  }
                : item.qrPayment,
            }
          : item,
      ),
    );

    setSelectedSession((prev) =>
      prev && prev._rowKey === session._rowKey
        ? {
            ...prev,
            ...resultSession,
            statusPayment: resultSession.statusPayment ?? prev.statusPayment,
            statusPaymentName: resultSession.statusPaymentName || prev.statusPaymentName,
            status: resultSession.status ?? prev.status,
            statusName: resultSession.statusName || prev.statusName,
            checkOutTime: resultSession.checkOutTime || prev.checkOutTime,
            price: resultSession.price ?? prev.price,
            qrPayment: prev.qrPayment
              ? {
                  ...prev.qrPayment,
                  status: resultSession.statusPaymentName || 'PAID',
                }
              : prev.qrPayment,
          }
        : prev,
    );
  };

  const fetchQrSessions = async ({ showLoading = false } = {}) => {
    if (isFetchingRef.current) return;

    isFetchingRef.current = true;
    if (showLoading) {
      setQrLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const response = await axiosClient.post(PAYMENT_API.GET_GUEST_PARKING_SESSIONS_WITH_QR, {});
      const sessions = getSessionList(response?.data || response).map((item, index) => ({
        ...item,
        _rowKey: item?._id || item?.id || item?.code || `${index}`,
      }));
      setQrSessions(sessions);
      setSelectedSession((prev) =>
        prev ? sessions.find((item) => item._rowKey === prev._rowKey) || null : null,
      );
    } catch (error) {
      if (showLoading) {
        message.error(error?.response?.data?.message || error?.message || t('payment.loadQrFailed'));
      }
    } finally {
      if (showLoading) {
        setQrLoading(false);
      } else {
        setRefreshing(false);
      }
      isFetchingRef.current = false;
    }
  };

  const verifyPayment = async (session) => {
    const amount = Number(session?.qrPayment?.amount ?? session?.price ?? 0);
    const content = getPaymentContent(session);
    const loadingKey = session?._rowKey || session?._id || content;

    if (!content || content === '--') {
      message.warning(t('payment.verifyPaymentFailed'));
      return;
    }

    setVerifyLoadingKey(loadingKey);
    try {
      const response = await axiosClient.post(PAYMENT_API.WEBHOOK_PARKING, {
        amount,
        content,
      });
      const result = response?.data || response;
      updateSessionLocally(session, result?.session);
      setActivityLog((prev) =>
        [
          {
            id: `${Date.now()}-${content}`,
            content,
            amount,
            message: t('payment.verifyPaymentSuccess'),
            statusName: result?.session?.statusPaymentName || result?.session?.statusName || 'PAID',
            actionTime: new Date().toISOString(),
            sessionCode: result?.session?.code || session?.code,
          },
          ...prev,
        ].slice(0, 20),
      );
      message.success(t('payment.verifyPaymentSuccess'));
    } catch (error) {
      const errorMessage = t('payment.verifyPaymentFailed');
      setActivityLog((prev) =>
        [
          {
            id: `${Date.now()}-${content}-error`,
            content,
            amount,
            message: errorMessage,
            statusName: 'FAILED',
            actionTime: new Date().toISOString(),
            sessionCode: session?.code,
          },
          ...prev,
        ].slice(0, 20),
      );
      message.error(errorMessage);
    } finally {
      setVerifyLoadingKey(null);
    }
  };

  useEffect(() => {
    fetchQrSessions({ showLoading: true });
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchQrSessions();
      }
    }, BACKGROUND_REFRESH_MS);

    return () => clearInterval(intervalId);
  }, []);

  const filteredSessions = useMemo(() => {
    return qrSessions.filter((item) => {
      const matchesPaymentStatus =
        paymentStatusFilter === 'ALL' || item?.statusPaymentName === paymentStatusFilter;

      if (!matchesPaymentStatus) {
        return false;
      }

      return true;
    });
  }, [paymentStatusFilter, qrSessions]);

  const paidSessions = useMemo(
    () => qrSessions.filter((item) => item?.statusPaymentName === 'PAID').length,
    [qrSessions],
  );

  const totalRevenue = useMemo(
    () => qrSessions.reduce((sum, item) => sum + (Number(item?.price) || 0), 0),
    [qrSessions],
  );

  const selectedQrUrl = getQrUrl(selectedSession);
  const selectedPaymentContent = getPaymentContent(selectedSession);
  const selectedLoadingKey =
    selectedSession?._rowKey || selectedSession?._id || selectedPaymentContent;

  const columns = [
    {
      title: t('payment.transactionCode'),
      key: 'content',
      render: (_, record) => (
        <Tag color="magenta" style={{ marginInlineEnd: 0, maxWidth: 180 }}>
          <span
            style={{
              display: 'inline-block',
              maxWidth: 150,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              verticalAlign: 'bottom',
            }}
            title={getPaymentContent(record)}
          >
            {getPaymentContent(record)}
          </span>
        </Tag>
      ),
    },
    {
      title: t('payment.amount'),
      key: 'amount',
      render: (_, record) => formatCurrency(record?.qrPayment?.amount ?? record?.price, language),
    },
    {
      title: t('payment.paymentStatus'),
      key: 'paymentStatus',
      render: (_, record) => (
        <Tag color={statusColorMap[record?.statusPaymentName] || 'default'}>
          {record?.statusPaymentName || '--'}
        </Tag>
      ),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 150,
      render: (_, record) => {
        const loadingKey = record?._rowKey || record?._id || getPaymentContent(record);
        const canVerify = record?.statusPaymentName !== 'PAID';
        return (
          <Space>
            <Button
              size="small"
              onClick={(event) => {
                event.stopPropagation();
                setSelectedSession(record);
              }}
            >
              {t('payment.openDetails')}
            </Button>
            {canVerify && (
              <Button
                type="primary"
                size="small"
                onClick={(event) => {
                  event.stopPropagation();
                  verifyPayment(record);
                }}
                loading={verifyLoadingKey === loadingKey}
              >
                {t('payment.verifyPayment')}
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{ padding: 0, background: '#f5f7fb', minHeight: '100%' }}>
      <Card bordered={false} style={{ marginBottom: 24, borderRadius: 16 }}>
        <Row gutter={[24, 24]} align="middle" justify="space-between">
          <Col xs={24} lg={15}>
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Title level={3} style={{ margin: 0 }}>
                {t('payment.title')}
              </Title>
              <Paragraph type="secondary" style={{ marginBottom: 0, fontSize: 15 }}>
                {t('payment.subtitle')}
              </Paragraph>
            </Space>
          </Col>
          <Col xs={24} lg={9}>
            <Space wrap style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => fetchQrSessions({ showLoading: true })}
                loading={qrLoading || refreshing}
                size="large"
              >
                {t('payment.refreshQrList')}
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={8}>
          <Card bordered={false} style={{ borderRadius: 16 }}>
            <Statistic
              title={t('payment.totalSessions')}
              value={qrSessions.length}
              prefix={<QrcodeOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card bordered={false} style={{ borderRadius: 16 }}>
            <Statistic
              title={t('payment.paidSessions')}
              value={paidSessions}
              prefix={<CreditCardOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card bordered={false} style={{ borderRadius: 16 }}>
            <Statistic
              title={t('payment.totalRevenue')}
              value={totalRevenue}
              formatter={(value) => formatCurrency(value, language)}
              prefix={<DollarCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <Card bordered={false} style={{ borderRadius: 16, minHeight: 520 }}>
            <Space direction="vertical" size={14} style={{ width: '100%' }}>
              <Space
                wrap
                style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <Title level={5} style={{ margin: 0 }}>
                  {t('payment.listView')}
                </Title>
                <Select
                  value={paymentStatusFilter}
                  onChange={setPaymentStatusFilter}
                  options={PAYMENT_STATUS_OPTIONS}
                  style={{ width: 180, maxWidth: '100%' }}
                />
              </Space>

              <Table
                className="payment-session-table"
                rowKey="_rowKey"
                columns={columns}
                dataSource={filteredSessions}
                loading={qrLoading}
                pagination={{ pageSize: 5, showSizeChanger: false }}
                locale={{ emptyText: t('payment.noQrData') }}
                style={{ marginTop: 20 }}
                onRow={(record) => ({
                  onClick: () => setSelectedSession(record),
                  style: { cursor: 'pointer' },
                })}
              />
            </Space>
          </Card>
        </Col>

        <Col xs={24} xl={8}>
          <Card bordered={false} style={{ borderRadius: 16, minHeight: 520 }}>
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <Title level={5} style={{ margin: 0 }}>
                {t('payment.paymentLog')}
              </Title>

              {activityLog.length > 0 ? (
                <div style={{ maxHeight: 460, overflowY: 'auto', paddingRight: 4 }}>
                  <List
                    dataSource={activityLog}
                    renderItem={(item) => (
                      <List.Item key={item.id} style={{ paddingInline: 0 }}>
                        <Card
                          size="small"
                          style={{
                            width: '100%',
                            borderRadius: 12,
                            background: '#fafafa',
                            border: '1px solid #f0f0f0',
                          }}
                        >
                          <Space direction="vertical" size={6} style={{ width: '100%' }}>
                            <Space wrap style={{ justifyContent: 'space-between', width: '100%' }}>
                              <Tag color={statusColorMap[item.statusName] || 'default'}>
                                {item.statusName}
                              </Tag>
                              <Text type="secondary">
                                {formatDateTime(item.actionTime, language)}
                              </Text>
                            </Space>
                            <Text strong>{item.content}</Text>
                            <Text>{item.sessionCode || '--'}</Text>
                            <Text>{formatCurrency(item.amount, language)}</Text>
                            <Text type="secondary">{item.message}</Text>
                          </Space>
                        </Card>
                      </List.Item>
                    )}
                  />
                </div>
              ) : (
                <Empty description={t('payment.noPaymentLog')} />
              )}
            </Space>
          </Card>
        </Col>
      </Row>

      <Drawer
        title={t('payment.detailView')}
        placement="right"
        width={520}
        open={Boolean(selectedSession)}
        onClose={() => setSelectedSession(null)}
      >
        {selectedSession ? (
          <Space direction="vertical" size={20} style={{ width: '100%' }}>
            <Card
              bordered={false}
              style={{ background: '#f8fafc', borderRadius: 16, textAlign: 'center' }}
            >
              {selectedQrUrl ? (
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  <Image
                    src={selectedQrUrl}
                    alt="QR payment"
                    width={220}
                    height={220}
                    style={{ objectFit: 'contain', borderRadius: 12 }}
                  />
                  <Tag color="magenta" style={{ width: 'fit-content', margin: '0 auto' }}>
                    {selectedPaymentContent}
                  </Tag>
                  <Space wrap style={{ justifyContent: 'center' }}>
                    {selectedSession?.statusPaymentName !== 'PAID' && (
                      <Button
                        type="primary"
                        icon={<CheckCircleOutlined />}
                        onClick={() => verifyPayment(selectedSession)}
                        loading={verifyLoadingKey === selectedLoadingKey}
                      >
                        {t('payment.verifyPayment')}
                      </Button>
                    )}
                    <Button type="link" href={selectedQrUrl} target="_blank">
                      {t('payment.viewQrImage')}
                    </Button>
                  </Space>
                </Space>
              ) : (
                <Empty description={t('payment.noQrData')} />
              )}
            </Card>

            <Card size="small" title={t('payment.sessionDetails')}>
              <Descriptions
                column={1}
                size="small"
                styles={{ label: { width: 150, fontWeight: 600 } }}
                items={[
                  {
                    key: 'sessionId',
                    label: t('payment.sessionId'),
                    children: selectedSession?._id || '--',
                  },
                  {
                    key: 'sessionCode',
                    label: t('payment.sessionCode'),
                    children: selectedSession?.code || '--',
                  },
                  {
                    key: 'checkIn',
                    label: t('payment.checkIn'),
                    children: formatDateTime(selectedSession?.checkInTime, language),
                  },
                  {
                    key: 'checkOut',
                    label: t('payment.checkOut'),
                    children: formatDateTime(selectedSession?.checkOutTime, language),
                  },
                  {
                    key: 'createdAt',
                    label: t('payment.createdAt'),
                    children: formatDateTime(selectedSession?.transaction?.createdAt, language),
                  },
                  {
                    key: 'amount',
                    label: t('payment.amount'),
                    children: formatCurrency(
                      selectedSession?.qrPayment?.amount ?? selectedSession?.price,
                      language,
                    ),
                  },
                ]}
              />
            </Card>

            <Card size="small" title={t('payment.paymentDetails')}>
              <Descriptions
                column={1}
                size="small"
                styles={{ label: { width: 150, fontWeight: 600 } }}
                items={[
                  {
                    key: 'transactionCode',
                    label: t('payment.transactionCode'),
                    children: selectedPaymentContent,
                  },
                  {
                    key: 'parkingStatus',
                    label: t('payment.parkingStatus'),
                    children: (
                      <Tag color={statusColorMap[selectedSession?.statusName] || 'default'}>
                        {selectedSession?.statusName || '--'}
                      </Tag>
                    ),
                  },
                  {
                    key: 'paymentStatus',
                    label: t('payment.paymentStatus'),
                    children: (
                      <Tag color={statusColorMap[selectedSession?.statusPaymentName] || 'default'}>
                        {selectedSession?.statusPaymentName || '--'}
                      </Tag>
                    ),
                  },
                  {
                    key: 'qrStatus',
                    label: t('payment.qrStatus'),
                    children: (
                      <Tag color={statusColorMap[selectedSession?.qrPayment?.status] || 'default'}>
                        {selectedSession?.qrPayment?.status || '--'}
                      </Tag>
                    ),
                  },
                  {
                    key: 'expiresAt',
                    label: t('payment.expiresAt'),
                    children: formatDateTime(selectedSession?.qrPayment?.expireAt, language),
                  },
                  {
                    key: 'licensePlateId',
                    label: t('payment.licensePlateId'),
                    children: selectedSession?.licensePlateId || '--',
                  },
                  {
                    key: 'userId',
                    label: t('payment.userId'),
                    children: selectedSession?.userId || '--',
                  },
                  {
                    key: 'vehicleId',
                    label: t('payment.vehicleId'),
                    children: selectedSession?.vehicleId || '--',
                  },
                ]}
              />
            </Card>
          </Space>
        ) : (
          <Empty description={t('payment.noSessionSelected')} />
        )}
      </Drawer>
    </div>
  );
};

export default PaymentPage;
