import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  Card, Table, Spin, Alert, Typography, Button, Space, 
  Tag, Form, Input, Select, DatePicker, Row, Col, Divider
} from 'antd';
import { 
  FiFilter, FiSearch, FiRefreshCw, FiDownload, FiMail, FiBarChart2
} from 'react-icons/fi';
import moment from 'moment';
import 'moment/locale/de';
import { withAuth } from '@/utils/withAuth';
import { User } from '@supabase/supabase-js';
import AdminSidebar from '@/components/AdminSidebar';
import Header from '@/components/Header';
import { CSVLink } from 'react-csv';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface Campaign {
  id: string;
  subject: string;
  status: string;
  schedule_type: string;
  scheduled_at?: string;
  recipient_count: number;
  sent_count: number;
  opened_count: number;
  click_count: number;
  open_rate: number;
  click_rate: number;
  created_at: string;
  completed_at?: string;
}

interface FilterOptions {
  status: string[];
  schedule_type: string[];
  date_range: [moment.Moment | null, moment.Moment | null];
  segments: string[];
  metrics: {
    open_rate?: [number, number];
    click_rate?: [number, number];
  };
  search: string;
}

interface CampaignFilterPageProps {
  user: User;
}

function CampaignFilterPage({ user }: CampaignFilterPageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [segments, setSegments] = useState<{id: string, name: string}[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    status: [],
    schedule_type: [],
    date_range: [null, null],
    segments: [],
    metrics: {},
    search: ''
  });
  const [form] = Form.useForm();
  
  useEffect(() => {
    fetchCampaigns();
    fetchSegments();
  }, []);
  
  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      
      // URL-Parameter für Filter erstellen
      const params = new URLSearchParams();
      
      if (filterOptions.status.length > 0) {
        params.append('status', filterOptions.status.join(','));
      }
      
      if (filterOptions.schedule_type.length > 0) {
        params.append('schedule_type', filterOptions.schedule_type.join(','));
      }
      
      if (filterOptions.date_range[0] && filterOptions.date_range[1]) {
        params.append('start_date', filterOptions.date_range[0].format('YYYY-MM-DD'));
        params.append('end_date', filterOptions.date_range[1].format('YYYY-MM-DD'));
      }
      
      if (filterOptions.segments.length > 0) {
        params.append('segments', filterOptions.segments.join(','));
      }
      
      if (filterOptions.metrics.open_rate) {
        params.append('min_open_rate', filterOptions.metrics.open_rate[0].toString());
        params.append('max_open_rate', filterOptions.metrics.open_rate[1].toString());
      }
      
      if (filterOptions.metrics.click_rate) {
        params.append('min_click_rate', filterOptions.metrics.click_rate[0].toString());
        params.append('max_click_rate', filterOptions.metrics.click_rate[1].toString());
      }
      
      if (filterOptions.search) {
        params.append('search', filterOptions.search);
      }
      
      const response = await fetch(`/api/admin/campaigns/filter?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Fehler beim Laden der Kampagnen');
      }
      
      const data = await response.json();
      setCampaigns(data.campaigns || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchSegments = async () => {
    try {
      const response = await fetch('/api/admin/segments');
      
      if (!response.ok) {
        throw new Error('Fehler beim Laden der Segmente');
      }
      
      const data = await response.json();
      setSegments(data.segments || []);
    } catch (err) {
      console.error('Fehler beim Laden der Segmente:', err);
    }
  };
  
  const handleFilterSubmit = (values: any) => {
    const newFilterOptions: FilterOptions = {
      status: values.status || [],
      schedule_type: values.schedule_type || [],
      date_range: values.date_range || [null, null],
      segments: values.segments || [],
      metrics: {
        open_rate: values.open_rate,
        click_rate: values.click_rate
      },
      search: values.search || ''
    };
    
    setFilterOptions(newFilterOptions);
    fetchCampaigns();
  };
  
  const resetFilters = () => {
    form.resetFields();
    setFilterOptions({
      status: [],
      schedule_type: [],
      date_range: [null, null],
      segments: [],
      metrics: {},
      search: ''
    });
    fetchCampaigns();
  };
  
  const getStatusTag = (status: string) => {
    switch (status) {
      case 'draft':
        return <Tag color="default">Entwurf</Tag>;
      case 'scheduled':
        return <Tag color="blue">Geplant</Tag>;
      case 'active':
        return <Tag color="green">Aktiv</Tag>;
      case 'paused':
        return <Tag color="orange">Pausiert</Tag>;
      case 'completed':
        return <Tag color="purple">Abgeschlossen</Tag>;
      case 'failed':
        return <Tag color="red">Fehlgeschlagen</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };
  
  const getScheduleTypeText = (type: string) => {
    switch (type) {
      case 'immediate':
        return 'Sofort';
      case 'scheduled':
        return 'Geplant';
      case 'recurring':
        return 'Wiederkehrend';
      default:
        return type;
    }
  };
  
  if (loading && campaigns.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex flex-1">
          <AdminSidebar activeItem="campaigns" />
          <main className="flex-1 p-6 bg-gray-50">
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-center items-center h-64">
                <Spin size="large" tip="Kampagnen werden geladen..." />
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        <AdminSidebar activeItem="campaigns" />
        <main className="flex-1 p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            {error && (
              <Alert
                message="Fehler"
                description={error}
                type="error"
                showIcon
                className="mb-6"
                closable
                onClose={() => setError(null)}
              />
            )}
            
            <div className="flex justify-between items-center mb-6">
              <div>
                <Title level={2}>Kampagnen-Filter</Title>
                <Text className="text-gray-500">
                  Filtern und analysieren Sie Ihre E-Mail-Kampagnen nach verschiedenen Kriterien
                </Text>
              </div>
              <Space>
                <Button 
                  icon={<FiRefreshCw />} 
                  onClick={fetchCampaigns}
                >
                  Aktualisieren
                </Button>
                {campaigns.length > 0 && (
                  <CSVLink
                    data={campaigns.map(c => ({
                      Betreff: c.subject,
                      Status: c.status,
                      Zeitplan: getScheduleTypeText(c.schedule_type),
                      Empfänger: c.recipient_count,
                      Gesendet: c.sent_count,
                      Geöffnet: c.opened_count,
                      Klicks: c.click_count,
                      Öffnungsrate: `${c.open_rate.toFixed(1)}%`,
                      Klickrate: `${c.click_rate.toFixed(1)}%`,
                      'Erstellt am': moment(c.created_at).format('DD.MM.YYYY'),
                      'Abgeschlossen am': c.completed_at ? moment(c.completed_at).format('DD.MM.YYYY') : '-'
                    }))}
                    filename={`kampagnen-bericht-${moment().format('YYYY-MM-DD')}.csv`}
                    className="ant-btn"
                  >
                    <FiDownload /> Export
                  </CSVLink>
                )}
              </Space>
            </div>
            
            <Card className="mb-6">
              <Form
                form={form}
                layout="vertical"
                onFinish={handleFilterSubmit}
                initialValues={{
                  status: [],
                  schedule_type: [],
                  segments: [],
                  search: ''
                }}
              >
                <Row gutter={16}>
                  <Col xs={24} md={8}>
                    <Form.Item name="search" label="Suche">
                      <Input 
                        placeholder="Nach Betreff oder Inhalt suchen" 
                        prefix={<FiSearch className="text-gray-400" />} 
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item name="status" label="Status">
                      <Select 
                        mode="multiple" 
                        placeholder="Status auswählen"
                        allowClear
                      >
                        <Option value="draft">Entwurf</Option>
                        <Option value="scheduled">Geplant</Option>
                        <Option value="active">Aktiv</Option>
                        <Option value="paused">Pausiert</Option>
                        <Option value="completed">Abgeschlossen</Option>
                        <Option value="failed">Fehlgeschlagen</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item name="schedule_type" label="Zeitplan">
                      <Select 
                        mode="multiple" 
                        placeholder="Zeitplan auswählen"
                        allowClear
                      >
                        <Option value="immediate">Sofort</Option>
                        <Option value="scheduled">Geplant</Option>
                        <Option value="recurring">Wiederkehrend</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
                
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item name="date_range" label="Zeitraum">
                      <RangePicker 
                        style={{ width: '100%' }}
                        format="DD.MM.YYYY"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="segments" label="Segmente">
                      <Select 
                        mode="multiple" 
                        placeholder="Segmente auswählen"
                        allowClear
                      >
                        {segments.map(segment => (
                          <Option key={segment.id} value={segment.id}>{segment.name}</Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
                
                <Divider>Leistungsmetriken</Divider>
                
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item name="open_rate" label="Öffnungsrate (%)">
                      <Select placeholder="Öffnungsrate auswählen">
                        <Option value={[0, 100]}>Alle</Option>
                        <Option value={[0, 10]}>0% - 10%</Option>
                        <Option value={[10, 25]}>10% - 25%</Option>
                        <Option value={[25, 50]}>25% - 50%</Option>
                        <Option value={[50, 75]}>50% - 75%</Option>
                        <Option value={[75, 100]}>75% - 100%</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="click_rate" label="Klickrate (%)">
                      <Select placeholder="Klickrate auswählen">
                        <Option value={[0, 100]}>Alle</Option>
                        <Option value={[0, 5]}>0% - 5%</Option>
                        <Option value={[5, 10]}>5% - 10%</Option>
                        <Option value={[10, 25]}>10% - 25%</Option>
                        <Option value={[25, 50]}>25% - 50%</Option>
                        <Option value={[50, 100]}>50% - 100%</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
                
                <div className="flex justify-end space-x-3">
                  <Button onClick={resetFilters}>
                    Filter zurücksetzen
                  </Button>
                  <Button type="primary" htmlType="submit" icon={<FiFilter />}>
                    Filtern
                  </Button>
                </div>
              </Form>
            </Card>
            
            <Card>
              <div className="mb-4 flex justify-between items-center">
                <Title level={4}>Gefilterte Kampagnen ({campaigns.length})</Title>
              </div>
              
              {campaigns.length === 0 ? (
                <div className="text-center py-8">
                  <Text className="text-gray-500">
                    Keine Kampagnen gefunden, die den Filterkriterien entsprechen.
                  </Text>
                </div>
              ) : (
                <Table 
                  dataSource={campaigns} 
                  rowKey="id"
                  columns={[
                    {
                      title: 'Betreff',
                      dataIndex: 'subject',
                      key: 'subject',
                      render: (text, record) => (
                        <a onClick={() => router.push(`/admin/campaigns/${record.id}`)}>{text}</a>
                      )
                    },
                    {
                      title: 'Status',
                      dataIndex: 'status',
                      key: 'status',
                      render: status => getStatusTag(status)
                    },
                    {
                      title: 'Zeitplan',
                      key: 'schedule',
                      render: (_, record) => (
                        <div>
                          <div>{getScheduleTypeText(record.schedule_type)}</div>
                          {record.scheduled_at && (
                            <div className="text-xs text-gray-500">
                              {moment(record.scheduled_at).format('DD.MM.YYYY HH:mm')}
                            </div>
                          )}
                        </div>
                      )
                    },
                    {
                      title: 'Empfänger',
                      dataIndex: 'recipient_count',
                      key: 'recipients',
                      sorter: (a, b) => a.recipient_count - b.recipient_count
                    },
                    {
                      title: 'Öffnungsrate',
                      key: 'open_rate',
                      render: (_, record) => (
                        <span>{record.open_rate.toFixed(1)}%</span>
                      ),
                      sorter: (a, b) => a.open_rate - b.open_rate
                    },
                    {
                      title: 'Klickrate',
                      key: 'click_rate',
                      render: (_, record) => (
                        <span>{record.click_rate.toFixed(1)}%</span>
                      ),
                      sorter: (a, b) => a.click_rate - b.click_rate
                    },
                    {
                      title: 'Erstellt am',
                      dataIndex: 'created_at',
                      key: 'created_at',
                      render: (text) => moment(text).format('DD.MM.YYYY')
                    },
                    {
                      title: 'Aktionen',
                      key: 'actions',
                      render: (_, record) => (
                        <Space>
                          <Button 
                            icon={<FiMail />} 
                            onClick={() => router.push(`/admin/campaigns/${record.id}`)}
                          />
                          <Button 
                            icon={<FiBarChart2 />} 
                            onClick={() => router.push(`/admin/campaigns/${record.id}/stats`)}
                          />
                        </Space>
                      )
                    }
                  ]}
                />
              )}
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}

export default CampaignFilterPage;

export const getServerSideProps = withAuth(
  ['admin', 'ADMIN'],
  async (context, user) => {
    return {
      props: { user }
    };
  }
);
