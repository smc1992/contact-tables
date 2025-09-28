import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  Card, Table, Spin, Alert, Tabs, Typography, Statistic, Row, Col, 
  Button, Select, Space, Tooltip, Tag, Modal, Form, Input, Radio
} from 'antd';
import { 
  FiPlus, FiEdit, FiBarChart2, FiCopy, FiTrash2, FiCheck, FiX
} from 'react-icons/fi';
import moment from 'moment';
import 'moment/locale/de';

import AdminSidebar from '@/components/AdminSidebar';
import Header from '@/components/Header';
import { withAuth } from '@/utils/withAuth';
import { User } from '@supabase/supabase-js';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

interface ABTest {
  id: string;
  name: string;
  status: string;
  created_at: string;
  variants: ABTestVariant[];
  winner_id?: string;
  metric: string;
  total_recipients: number;
}

interface ABTestVariant {
  id: string;
  name: string;
  subject: string;
  content: string;
  recipient_count: number;
  sent_count: number;
  opened_count: number;
  click_count: number;
  open_rate: number;
  click_rate: number;
  is_winner: boolean;
}

interface ABTestingPageProps {
  user: User;
}

function ABTestingPage({ user }: ABTestingPageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tests, setTests] = useState<ABTest[]>([]);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [form] = Form.useForm();
  
  useEffect(() => {
    fetchABTests();
  }, []);
  
  const fetchABTests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/campaigns/ab-tests');
      
      if (!response.ok) {
        throw new Error('Fehler beim Laden der A/B-Tests');
      }
      
      const data = await response.json();
      setTests(data.tests || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateTest = async (values: any) => {
    try {
      const response = await fetch('/api/admin/campaigns/ab-tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      
      if (!response.ok) {
        throw new Error('Fehler beim Erstellen des A/B-Tests');
      }
      
      setCreateModalVisible(false);
      form.resetFields();
      fetchABTests();
    } catch (err) {
      setError((err as Error).message);
    }
  };
  
  const handleDeclareWinner = async (testId: string, variantId: string) => {
    try {
      const response = await fetch(`/api/admin/campaigns/ab-tests/${testId}/winner`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ winner_id: variantId }),
      });
      
      if (!response.ok) {
        throw new Error('Fehler beim Festlegen des Gewinners');
      }
      
      fetchABTests();
    } catch (err) {
      setError((err as Error).message);
    }
  };
  
  const getStatusTag = (status: string) => {
    switch (status) {
      case 'running':
        return <Tag color="blue">Aktiv</Tag>;
      case 'completed':
        return <Tag color="green">Abgeschlossen</Tag>;
      case 'scheduled':
        return <Tag color="gold">Geplant</Tag>;
      default:
        return <Tag color="default">{status}</Tag>;
    }
  };
  
  if (loading && tests.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex flex-1">
          <AdminSidebar activeItem="ab-testing" />
          <main className="flex-1 p-6 bg-gray-50">
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-center items-center h-64">
                <Spin size="large" tip="A/B-Tests werden geladen..." />
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
        <AdminSidebar activeItem="ab-testing" />
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
                <Title level={2}>A/B-Testing</Title>
                <Text className="text-gray-500">
                  Testen Sie verschiedene Betreffzeilen oder Inhalte, um die Effektivität Ihrer Kampagnen zu optimieren
                </Text>
              </div>
              <Button 
                type="primary" 
                icon={<FiPlus />} 
                onClick={() => setCreateModalVisible(true)}
              >
                Neuer A/B-Test
              </Button>
            </div>
            
            {tests.length === 0 ? (
              <Card>
                <div className="text-center py-12">
                  <Title level={4}>Keine A/B-Tests vorhanden</Title>
                  <Text className="text-gray-500 block mb-6">
                    Erstellen Sie Ihren ersten A/B-Test, um verschiedene Versionen Ihrer E-Mail-Kampagnen zu vergleichen.
                  </Text>
                  <Button 
                    type="primary" 
                    icon={<FiPlus />} 
                    onClick={() => setCreateModalVisible(true)}
                  >
                    A/B-Test erstellen
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="space-y-8">
                {tests.map(test => (
                  <Card key={test.id} className="overflow-hidden">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <Title level={4} className="mb-1">{test.name}</Title>
                        <div className="flex items-center space-x-3">
                          {getStatusTag(test.status)}
                          <Text className="text-gray-500">
                            Erstellt am {moment(test.created_at).format('DD.MM.YYYY')}
                          </Text>
                          <Text className="text-gray-500">
                            {test.total_recipients} Empfänger
                          </Text>
                          <Text className="text-gray-500">
                            Metrik: {test.metric === 'open_rate' ? 'Öffnungsrate' : 'Klickrate'}
                          </Text>
                        </div>
                      </div>
                      <Space>
                        <Button 
                          icon={<FiBarChart2 />} 
                          onClick={() => router.push(`/admin/campaigns/ab-testing/${test.id}`)}
                        >
                          Details
                        </Button>
                        {test.status === 'completed' && !test.winner_id && (
                          <Button 
                            type="primary"
                            onClick={() => router.push(`/admin/campaigns/ab-testing/${test.id}/winner`)}
                          >
                            Gewinner auswählen
                          </Button>
                        )}
                      </Space>
                    </div>
                    
                    <div className="mt-6">
                      <Table 
                        dataSource={test.variants} 
                        rowKey="id"
                        pagination={false}
                        columns={[
                          {
                            title: 'Variante',
                            dataIndex: 'name',
                            key: 'name',
                            render: (text, record) => (
                              <div className="flex items-center">
                                <span>{text}</span>
                                {record.is_winner && (
                                  <Tag color="gold" className="ml-2">Gewinner</Tag>
                                )}
                              </div>
                            )
                          },
                          {
                            title: 'Betreff',
                            dataIndex: 'subject',
                            key: 'subject',
                            ellipsis: true
                          },
                          {
                            title: 'Empfänger',
                            dataIndex: 'recipient_count',
                            key: 'recipients',
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
                            title: 'Aktionen',
                            key: 'actions',
                            render: (_, record) => (
                              <Space>
                                <Tooltip title="Als Gewinner festlegen">
                                  <Button 
                                    icon={<FiCheck />} 
                                    disabled={test.status !== 'completed' || record.is_winner}
                                    onClick={() => handleDeclareWinner(test.id, record.id)}
                                  />
                                </Tooltip>
                                <Tooltip title="Bearbeiten">
                                  <Button 
                                    icon={<FiEdit />} 
                                    disabled={test.status !== 'draft'}
                                  />
                                </Tooltip>
                              </Space>
                            )
                          }
                        ]}
                      />
                    </div>
                  </Card>
                ))}
              </div>
            )}
            
            {/* Modal für neuen A/B-Test */}
            <Modal
              title="Neuen A/B-Test erstellen"
              open={createModalVisible}
              onCancel={() => setCreateModalVisible(false)}
              footer={null}
              width={800}
            >
              <Form
                form={form}
                layout="vertical"
                onFinish={handleCreateTest}
                initialValues={{
                  variant_type: 'subject',
                  metric: 'open_rate',
                  variants: 2
                }}
              >
                <Form.Item
                  name="name"
                  label="Name des Tests"
                  rules={[{ required: true, message: 'Bitte geben Sie einen Namen ein' }]}
                >
                  <Input placeholder="z.B. Newsletter September - Betreffzeilen-Test" />
                </Form.Item>
                
                <Form.Item
                  name="variant_type"
                  label="Was möchten Sie testen?"
                  rules={[{ required: true }]}
                >
                  <Radio.Group>
                    <Radio value="subject">Betreffzeilen</Radio>
                    <Radio value="content">E-Mail-Inhalte</Radio>
                    <Radio value="both">Beides</Radio>
                  </Radio.Group>
                </Form.Item>
                
                <Form.Item
                  name="metric"
                  label="Erfolgsmetrik"
                  rules={[{ required: true }]}
                >
                  <Radio.Group>
                    <Radio value="open_rate">Öffnungsrate</Radio>
                    <Radio value="click_rate">Klickrate</Radio>
                  </Radio.Group>
                </Form.Item>
                
                <Form.Item
                  name="variants"
                  label="Anzahl der Varianten"
                  rules={[{ required: true }]}
                >
                  <Radio.Group>
                    <Radio value={2}>2 Varianten</Radio>
                    <Radio value={3}>3 Varianten</Radio>
                    <Radio value={4}>4 Varianten</Radio>
                  </Radio.Group>
                </Form.Item>
                
                <Form.Item
                  name="test_size"
                  label="Testgröße"
                  rules={[{ required: true }]}
                  help="Prozentsatz der Empfänger, die für den Test verwendet werden sollen. Der Rest erhält die Gewinnervariante nach Abschluss des Tests."
                >
                  <Select>
                    <Option value={10}>10% der Empfänger</Option>
                    <Option value={25}>25% der Empfänger</Option>
                    <Option value={50}>50% der Empfänger</Option>
                    <Option value={100}>100% der Empfänger (kein automatischer Versand an den Rest)</Option>
                  </Select>
                </Form.Item>
                
                <Form.Item
                  name="base_campaign_id"
                  label="Basiskampagne"
                  rules={[{ required: true, message: 'Bitte wählen Sie eine Kampagne als Basis' }]}
                >
                  <Select
                    placeholder="Wählen Sie eine Kampagne als Basis für den A/B-Test"
                    loading={loading}
                  >
                    {/* Hier würden die verfügbaren Kampagnen geladen */}
                    <Option value="example-id">Beispielkampagne (Entwurf)</Option>
                  </Select>
                </Form.Item>
                
                <div className="flex justify-end space-x-3">
                  <Button onClick={() => setCreateModalVisible(false)}>
                    Abbrechen
                  </Button>
                  <Button type="primary" htmlType="submit">
                    Test erstellen
                  </Button>
                </div>
              </Form>
            </Modal>
          </div>
        </main>
      </div>
    </div>
  );
}

export default ABTestingPage;

export const getServerSideProps = withAuth(
  ['admin', 'ADMIN'],
  async (context, user) => {
    return {
      props: { user }
    };
  }
);
