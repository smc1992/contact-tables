import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  Card, Table, Spin, Alert, Tabs, Typography, Statistic, Row, Col, 
  DatePicker, Button, Select, Space, Tooltip, Radio
} from 'antd';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { 
  FiDownload, FiBarChart2, FiPieChart, FiTrendingUp, 
  FiCalendar, FiFilter, FiMail, FiEye, FiMousePointer
} from 'react-icons/fi';
import moment from 'moment';
import 'moment/locale/de';
import withAuthClient from '@/utils/withAuthClient';
import AdminSidebar from '@/components/AdminSidebar';
import Header from '@/components/Header';
import { CSVLink } from 'react-csv';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

const { TabPane } = Tabs;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

// Farbpalette für Diagramme
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

interface CampaignSummary {
  id: string;
  subject: string;
  status: string;
  sent_count: number;
  opened_count: number;
  click_count: number;
  recipient_count: number;
  created_at: string;
}

interface DailyStats {
  date: string;
  sent: number;
  opened: number;
  clicked: number;
}

interface PerformanceData {
  campaigns: CampaignSummary[];
  dailyStats: DailyStats[];
  topLinks: {
    url: string;
    clicks: number;
  }[];
  totalStats: {
    total_campaigns: number;
    total_sent: number;
    total_opened: number;
    total_clicked: number;
    avg_open_rate: number;
    avg_click_rate: number;
  };
}

function CampaignAnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PerformanceData | null>(null);
  const [dateRange, setDateRange] = useState<any[]>([
    moment().subtract(30, 'days'), 
    moment()
  ]);
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [metricView, setMetricView] = useState<'absolute' | 'rate'>('absolute');
  
  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange]);
  
  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');
      
      const response = await fetch(`/api/admin/campaigns/analytics?start=${startDate}&end=${endDate}`);
      
      if (!response.ok) {
        throw new Error('Fehler beim Laden der Analysedaten');
      }
      
      const analyticsData = await response.json();
      setData(analyticsData);
      
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };
  
  const exportToCSV = () => {
    // CSV-Export wird durch die CSVLink-Komponente gehandhabt
  };
  
  const exportToExcel = () => {
    if (!data) return;
    
    // Kampagnen-Daten für Excel vorbereiten
    const campaignData = data.campaigns.map(campaign => ({
      'Betreff': campaign.subject,
      'Status': campaign.status,
      'Empfänger': campaign.recipient_count,
      'Gesendet': campaign.sent_count,
      'Geöffnet': campaign.opened_count,
      'Klicks': campaign.click_count,
      'Öffnungsrate': campaign.sent_count > 0 ? 
        `${Math.round((campaign.opened_count / campaign.sent_count) * 100)}%` : '0%',
      'Klickrate': campaign.opened_count > 0 ? 
        `${Math.round((campaign.click_count / campaign.opened_count) * 100)}%` : '0%',
      'Erstellt am': moment(campaign.created_at).format('DD.MM.YYYY')
    }));
    
    // Tägliche Statistiken für Excel vorbereiten
    const dailyData = data.dailyStats.map(day => ({
      'Datum': day.date,
      'Gesendet': day.sent,
      'Geöffnet': day.opened,
      'Klicks': day.clicked
    }));
    
    // Excel-Arbeitsmappe erstellen
    const wb = XLSX.utils.book_new();
    
    // Arbeitsblätter hinzufügen
    const wsCampaigns = XLSX.utils.json_to_sheet(campaignData);
    XLSX.utils.book_append_sheet(wb, wsCampaigns, 'Kampagnen');
    
    const wsDaily = XLSX.utils.json_to_sheet(dailyData);
    XLSX.utils.book_append_sheet(wb, wsDaily, 'Tägliche Statistiken');
    
    const wsLinks = XLSX.utils.json_to_sheet(data.topLinks.map(link => ({
      'URL': link.url,
      'Klicks': link.clicks
    })));
    XLSX.utils.book_append_sheet(wb, wsLinks, 'Top Links');
    
    // Excel-Datei herunterladen
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const excelFile = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(excelFile, `email-kampagnen-bericht-${moment().format('YYYY-MM-DD')}.xlsx`);
  };
  
  if (loading && !data) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex flex-1">
          <AdminSidebar activeItem="analytics" />
          <main className="flex-1 p-6 bg-gray-50">
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-center items-center h-64">
                <Spin size="large" tip="Analysedaten werden geladen..." />
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex flex-1">
          <AdminSidebar activeItem="analytics" />
          <main className="flex-1 p-6 bg-gray-50">
            <div className="max-w-7xl mx-auto">
              <Alert
                message="Fehler"
                description={error}
                type="error"
                showIcon
                className="mb-6"
              />
            </div>
          </main>
        </div>
      </div>
    );
  }
  
  if (!data) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex flex-1">
          <AdminSidebar activeItem="analytics" />
          <main className="flex-1 p-6 bg-gray-50">
            <div className="max-w-7xl mx-auto">
              <Alert
                message="Keine Daten verfügbar"
                description="Es konnten keine Analysedaten gefunden werden."
                type="warning"
                showIcon
                className="mb-6"
              />
            </div>
          </main>
        </div>
      </div>
    );
  }
  
  // Daten für Diagramme aufbereiten
  const chartData = data.dailyStats.map(day => ({
    name: moment(day.date).format('DD.MM'),
    Gesendet: day.sent,
    Geöffnet: day.opened,
    Klicks: day.clicked,
    'Öffnungsrate': day.sent > 0 ? Math.round((day.opened / day.sent) * 100) : 0,
    'Klickrate': day.opened > 0 ? Math.round((day.clicked / day.opened) * 100) : 0
  }));
  
  // Daten für Pie-Chart
  const pieData = [
    { name: 'Geöffnet', value: data.totalStats.total_opened },
    { name: 'Nicht geöffnet', value: data.totalStats.total_sent - data.totalStats.total_opened }
  ];
  
  const clickPieData = [
    { name: 'Geklickt', value: data.totalStats.total_clicked },
    { name: 'Nicht geklickt', value: data.totalStats.total_opened - data.totalStats.total_clicked }
  ];
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        <AdminSidebar activeItem="analytics" />
        <main className="flex-1 p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <Title level={2}>E-Mail-Kampagnen Analyse</Title>
                  <Text>Detaillierte Leistungsanalyse Ihrer E-Mail-Kampagnen</Text>
                </div>
                <Space>
                  <RangePicker 
                    value={dateRange}
                    onChange={(dates: any) => {
                      if (dates && dates[0] && dates[1]) {
                        setDateRange([dates[0], dates[1]]);
                      }
                    }}
                    format="DD.MM.YYYY"
                  />
                  <Select defaultValue="all" style={{ width: 150 }}>
                    <Option value="all">Alle Kampagnen</Option>
                    {data.campaigns.map(campaign => (
                      <Option key={campaign.id} value={campaign.id}>{campaign.subject}</Option>
                    ))}
                  </Select>
                  <Tooltip title="Als CSV exportieren">
                    <CSVLink 
                      data={data.campaigns.map(c => ({
                        Betreff: c.subject,
                        Status: c.status,
                        Empfänger: c.recipient_count,
                        Gesendet: c.sent_count,
                        Geöffnet: c.opened_count,
                        Klicks: c.click_count,
                        'Erstellt am': moment(c.created_at).format('DD.MM.YYYY')
                      }))}
                      filename={`email-kampagnen-bericht-${moment().format('YYYY-MM-DD')}.csv`}
                      className="ant-btn ant-btn-default"
                    >
                      <FiDownload /> CSV
                    </CSVLink>
                  </Tooltip>
                  <Tooltip title="Als Excel exportieren">
                    <Button onClick={exportToExcel} icon={<FiDownload />}>
                      Excel
                    </Button>
                  </Tooltip>
                </Space>
              </div>
            </div>
            
            {/* Übersichts-Statistiken */}
            <Card className="mb-6">
              <Row gutter={[24, 24]}>
                <Col xs={12} sm={8} md={4}>
                  <Statistic 
                    title="Kampagnen" 
                    value={data.totalStats.total_campaigns} 
                    prefix={<FiMail className="mr-1" />} 
                  />
                </Col>
                <Col xs={12} sm={8} md={4}>
                  <Statistic 
                    title="Gesendet" 
                    value={data.totalStats.total_sent} 
                    prefix={<FiMail className="mr-1" />} 
                  />
                </Col>
                <Col xs={12} sm={8} md={4}>
                  <Statistic 
                    title="Geöffnet" 
                    value={data.totalStats.total_opened} 
                    prefix={<FiEye className="mr-1" />} 
                  />
                </Col>
                <Col xs={12} sm={8} md={4}>
                  <Statistic 
                    title="Klicks" 
                    value={data.totalStats.total_clicked} 
                    prefix={<FiMousePointer className="mr-1" />} 
                  />
                </Col>
                <Col xs={12} sm={8} md={4}>
                  <Statistic 
                    title="Öffnungsrate" 
                    value={data.totalStats.avg_open_rate} 
                    suffix="%" 
                    precision={1}
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Col>
                <Col xs={12} sm={8} md={4}>
                  <Statistic 
                    title="Klickrate" 
                    value={data.totalStats.avg_click_rate} 
                    suffix="%" 
                    precision={1}
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Col>
              </Row>
            </Card>
            
            {/* Diagramm-Optionen */}
            <div className="mb-4 flex justify-between">
              <Radio.Group value={chartType} onChange={e => setChartType(e.target.value)}>
                <Radio.Button value="line"><FiTrendingUp /> Liniendiagramm</Radio.Button>
                <Radio.Button value="bar"><FiBarChart2 /> Balkendiagramm</Radio.Button>
              </Radio.Group>
              
              <Radio.Group value={metricView} onChange={e => setMetricView(e.target.value)}>
                <Radio.Button value="absolute">Absolute Zahlen</Radio.Button>
                <Radio.Button value="rate">Prozentsätze</Radio.Button>
              </Radio.Group>
            </div>
            
            {/* Trend-Diagramm */}
            <Card className="mb-6">
              <Title level={4}>Kampagnen-Performance im Zeitverlauf</Title>
              <div style={{ width: '100%', height: 400 }}>
                <ResponsiveContainer>
                  {chartType === 'line' ? (
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      {metricView === 'absolute' ? (
                        <>
                          <Line type="monotone" dataKey="Gesendet" stroke="#8884d8" />
                          <Line type="monotone" dataKey="Geöffnet" stroke="#82ca9d" />
                          <Line type="monotone" dataKey="Klicks" stroke="#ffc658" />
                        </>
                      ) : (
                        <>
                          <Line type="monotone" dataKey="Öffnungsrate" stroke="#82ca9d" />
                          <Line type="monotone" dataKey="Klickrate" stroke="#ffc658" />
                        </>
                      )}
                    </LineChart>
                  ) : (
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      {metricView === 'absolute' ? (
                        <>
                          <Bar dataKey="Gesendet" fill="#8884d8" />
                          <Bar dataKey="Geöffnet" fill="#82ca9d" />
                          <Bar dataKey="Klicks" fill="#ffc658" />
                        </>
                      ) : (
                        <>
                          <Bar dataKey="Öffnungsrate" fill="#82ca9d" />
                          <Bar dataKey="Klickrate" fill="#ffc658" />
                        </>
                      )}
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </Card>
            
            <Row gutter={16} className="mb-6">
              {/* Öffnungsrate Pie-Chart */}
              <Col xs={24} md={12}>
                <Card>
                  <Title level={4}>Öffnungsrate</Title>
                  <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </Col>
              
              {/* Klickrate Pie-Chart */}
              <Col xs={24} md={12}>
                <Card>
                  <Title level={4}>Klickrate (von geöffneten E-Mails)</Title>
                  <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={clickPieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                        >
                          {clickPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </Col>
            </Row>
            
            <Tabs defaultActiveKey="campaigns">
              <TabPane tab="Kampagnen" key="campaigns">
                <Table 
                  dataSource={data.campaigns} 
                  rowKey="id"
                  columns={[
                    {
                      title: 'Betreff',
                      dataIndex: 'subject',
                      key: 'subject',
                      render: (text, record) => (
                        <a onClick={() => router.push(`/admin/campaigns/${record.id}/stats`)}>{text}</a>
                      )
                    },
                    {
                      title: 'Status',
                      dataIndex: 'status',
                      key: 'status',
                    },
                    {
                      title: 'Empfänger',
                      dataIndex: 'recipient_count',
                      key: 'recipients',
                      sorter: (a, b) => a.recipient_count - b.recipient_count
                    },
                    {
                      title: 'Gesendet',
                      dataIndex: 'sent_count',
                      key: 'sent',
                      sorter: (a, b) => a.sent_count - b.sent_count
                    },
                    {
                      title: 'Geöffnet',
                      dataIndex: 'opened_count',
                      key: 'opened',
                      sorter: (a, b) => a.opened_count - b.opened_count,
                      render: (text, record) => (
                        <span>
                          {text} ({record.sent_count > 0 ? 
                            Math.round((record.opened_count / record.sent_count) * 100) : 0}%)
                        </span>
                      )
                    },
                    {
                      title: 'Klicks',
                      dataIndex: 'click_count',
                      key: 'clicks',
                      sorter: (a, b) => a.click_count - b.click_count,
                      render: (text, record) => (
                        <span>
                          {text} ({record.opened_count > 0 ? 
                            Math.round((record.click_count / record.opened_count) * 100) : 0}%)
                        </span>
                      )
                    },
                    {
                      title: 'Erstellt am',
                      dataIndex: 'created_at',
                      key: 'created_at',
                      render: (text) => moment(text).format('DD.MM.YYYY')
                    }
                  ]}
                />
              </TabPane>
              
              <TabPane tab="Top Links" key="links">
                <Table 
                  dataSource={data.topLinks} 
                  rowKey="url"
                  columns={[
                    {
                      title: 'URL',
                      dataIndex: 'url',
                      key: 'url',
                      render: (text) => (
                        <a href={text} target="_blank" rel="noopener noreferrer" className="truncate block max-w-md">
                          {text}
                        </a>
                      )
                    },
                    {
                      title: 'Klicks',
                      dataIndex: 'clicks',
                      key: 'clicks',
                      sorter: (a, b) => a.clicks - b.clicks
                    }
                  ]}
                />
              </TabPane>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}

export default withAuthClient(CampaignAnalyticsPage, ['admin', 'ADMIN']);
