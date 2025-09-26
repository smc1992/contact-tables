import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  Card, Table, Spin, Alert, Typography, Button, Space, 
  Tag, Modal, Form, Input, Switch, Select, Tooltip, Tabs
} from 'antd';
import { 
  FiPlus, FiEdit, FiTrash2, FiUsers, FiBarChart2, FiRefreshCw, FiFilter
} from 'react-icons/fi';
import moment from 'moment';
import 'moment/locale/de';
import withAuthClient from '@/utils/withAuthClient';
import AdminSidebar from '@/components/AdminSidebar';
import Header from '@/components/Header';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

interface Segment {
  id: string;
  name: string;
  description: string;
  criteria: any;
  is_dynamic: boolean;
  member_count: number;
  created_at: string;
}

function UserSegmentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [form] = Form.useForm();
  
  useEffect(() => {
    fetchSegments();
  }, []);
  
  const fetchSegments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/segments');
      
      if (!response.ok) {
        throw new Error('Fehler beim Laden der Segmente');
      }
      
      const data = await response.json();
      setSegments(data.segments || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateSegment = async (values: any) => {
    try {
      const response = await fetch('/api/admin/segments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      
      if (!response.ok) {
        throw new Error('Fehler beim Erstellen des Segments');
      }
      
      setCreateModalVisible(false);
      form.resetFields();
      fetchSegments();
    } catch (err) {
      setError((err as Error).message);
    }
  };
  
  const handleDeleteSegment = async () => {
    if (!selectedSegment) return;
    
    try {
      const response = await fetch(`/api/admin/segments/${selectedSegment}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Fehler beim Löschen des Segments');
      }
      
      setDeleteModalVisible(false);
      setSelectedSegment(null);
      fetchSegments();
    } catch (err) {
      setError((err as Error).message);
    }
  };
  
  const handleRefreshSegment = async (segmentId: string) => {
    try {
      const response = await fetch(`/api/admin/segments/${segmentId}/refresh`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Fehler beim Aktualisieren des Segments');
      }
      
      fetchSegments();
    } catch (err) {
      setError((err as Error).message);
    }
  };
  
  if (loading && segments.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex flex-1">
          <AdminSidebar activeItem="segments" />
          <main className="flex-1 p-6 bg-gray-50">
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-center items-center h-64">
                <Spin size="large" tip="Segmente werden geladen..." />
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
        <AdminSidebar activeItem="segments" />
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
                <Title level={2}>Benutzersegmente</Title>
                <Text className="text-gray-500">
                  Erstellen und verwalten Sie Segmente basierend auf Benutzerverhalten und Eigenschaften
                </Text>
              </div>
              <Button 
                type="primary" 
                icon={<FiPlus />} 
                onClick={() => setCreateModalVisible(true)}
              >
                Neues Segment
              </Button>
            </div>
            
            <Tabs defaultActiveKey="all">
              <TabPane tab="Alle Segmente" key="all">
                {segments.length === 0 ? (
                  <Card>
                    <div className="text-center py-12">
                      <Title level={4}>Keine Segmente vorhanden</Title>
                      <Text className="text-gray-500 block mb-6">
                        Erstellen Sie Ihr erstes Benutzersegment, um Ihre Zielgruppe besser anzusprechen.
                      </Text>
                      <Button 
                        type="primary" 
                        icon={<FiPlus />} 
                        onClick={() => setCreateModalVisible(true)}
                      >
                        Segment erstellen
                      </Button>
                    </div>
                  </Card>
                ) : (
                  <Table 
                    dataSource={segments} 
                    rowKey="id"
                    columns={[
                      {
                        title: 'Name',
                        dataIndex: 'name',
                        key: 'name',
                        render: (text, record) => (
                          <a onClick={() => router.push(`/admin/segments/${record.id}`)}>{text}</a>
                        )
                      },
                      {
                        title: 'Beschreibung',
                        dataIndex: 'description',
                        key: 'description',
                        ellipsis: true
                      },
                      {
                        title: 'Typ',
                        key: 'type',
                        render: (_, record) => (
                          <Tag color={record.is_dynamic ? 'blue' : 'green'}>
                            {record.is_dynamic ? 'Dynamisch' : 'Statisch'}
                          </Tag>
                        )
                      },
                      {
                        title: 'Mitglieder',
                        dataIndex: 'member_count',
                        key: 'members',
                        sorter: (a, b) => a.member_count - b.member_count
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
                            <Tooltip title="Bearbeiten">
                              <Button 
                                icon={<FiEdit />} 
                                onClick={() => router.push(`/admin/segments/${record.id}/edit`)}
                              />
                            </Tooltip>
                            {record.is_dynamic && (
                              <Tooltip title="Aktualisieren">
                                <Button 
                                  icon={<FiRefreshCw />} 
                                  onClick={() => handleRefreshSegment(record.id)}
                                />
                              </Tooltip>
                            )}
                            <Tooltip title="Statistiken">
                              <Button 
                                icon={<FiBarChart2 />} 
                                onClick={() => router.push(`/admin/segments/${record.id}/stats`)}
                              />
                            </Tooltip>
                            <Tooltip title="Löschen">
                              <Button 
                                danger
                                icon={<FiTrash2 />} 
                                onClick={() => {
                                  setSelectedSegment(record.id);
                                  setDeleteModalVisible(true);
                                }}
                              />
                            </Tooltip>
                          </Space>
                        )
                      }
                    ]}
                  />
                )}
              </TabPane>
              <TabPane tab="Dynamische Segmente" key="dynamic">
                <Table 
                  dataSource={segments.filter(s => s.is_dynamic)} 
                  rowKey="id"
                  columns={[
                    {
                      title: 'Name',
                      dataIndex: 'name',
                      key: 'name',
                      render: (text, record) => (
                        <a onClick={() => router.push(`/admin/segments/${record.id}`)}>{text}</a>
                      )
                    },
                    {
                      title: 'Beschreibung',
                      dataIndex: 'description',
                      key: 'description',
                      ellipsis: true
                    },
                    {
                      title: 'Mitglieder',
                      dataIndex: 'member_count',
                      key: 'members',
                      sorter: (a, b) => a.member_count - b.member_count
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
                          <Tooltip title="Bearbeiten">
                            <Button 
                              icon={<FiEdit />} 
                              onClick={() => router.push(`/admin/segments/${record.id}/edit`)}
                            />
                          </Tooltip>
                          <Tooltip title="Aktualisieren">
                            <Button 
                              icon={<FiRefreshCw />} 
                              onClick={() => handleRefreshSegment(record.id)}
                            />
                          </Tooltip>
                          <Tooltip title="Statistiken">
                            <Button 
                              icon={<FiBarChart2 />} 
                              onClick={() => router.push(`/admin/segments/${record.id}/stats`)}
                            />
                          </Tooltip>
                        </Space>
                      )
                    }
                  ]}
                />
              </TabPane>
              <TabPane tab="Statische Segmente" key="static">
                <Table 
                  dataSource={segments.filter(s => !s.is_dynamic)} 
                  rowKey="id"
                  columns={[
                    {
                      title: 'Name',
                      dataIndex: 'name',
                      key: 'name',
                      render: (text, record) => (
                        <a onClick={() => router.push(`/admin/segments/${record.id}`)}>{text}</a>
                      )
                    },
                    {
                      title: 'Beschreibung',
                      dataIndex: 'description',
                      key: 'description',
                      ellipsis: true
                    },
                    {
                      title: 'Mitglieder',
                      dataIndex: 'member_count',
                      key: 'members',
                      sorter: (a, b) => a.member_count - b.member_count
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
                          <Tooltip title="Bearbeiten">
                            <Button 
                              icon={<FiEdit />} 
                              onClick={() => router.push(`/admin/segments/${record.id}/edit`)}
                            />
                          </Tooltip>
                          <Tooltip title="Statistiken">
                            <Button 
                              icon={<FiBarChart2 />} 
                              onClick={() => router.push(`/admin/segments/${record.id}/stats`)}
                            />
                          </Tooltip>
                        </Space>
                      )
                    }
                  ]}
                />
              </TabPane>
            </Tabs>
            
            {/* Modal für neues Segment */}
            <Modal
              title="Neues Segment erstellen"
              open={createModalVisible}
              onCancel={() => setCreateModalVisible(false)}
              footer={null}
              width={800}
            >
              <Form
                form={form}
                layout="vertical"
                onFinish={handleCreateSegment}
                initialValues={{
                  is_dynamic: true,
                  criteria: {
                    engagement_level: 'any',
                    last_active_days: 30,
                    email_activity: {
                      open_rate: 0,
                      click_rate: 0
                    }
                  }
                }}
              >
                <Form.Item
                  name="name"
                  label="Name des Segments"
                  rules={[{ required: true, message: 'Bitte geben Sie einen Namen ein' }]}
                >
                  <Input placeholder="z.B. Aktive Benutzer" />
                </Form.Item>
                
                <Form.Item
                  name="description"
                  label="Beschreibung"
                >
                  <TextArea 
                    placeholder="Beschreiben Sie das Segment und seinen Zweck" 
                    rows={3} 
                  />
                </Form.Item>
                
                <Form.Item
                  name="is_dynamic"
                  label="Dynamisches Segment"
                  valuePropName="checked"
                  help="Dynamische Segmente werden automatisch aktualisiert, basierend auf den definierten Kriterien"
                >
                  <Switch />
                </Form.Item>
                
                <Form.Item
                  label="Segmentierungskriterien"
                  required
                >
                  <Card className="bg-gray-50">
                    <Form.Item
                      name={['criteria', 'engagement_level']}
                      label="Engagement-Level"
                    >
                      <Select>
                        <Option value="any">Beliebig</Option>
                        <Option value="high">Hoch</Option>
                        <Option value="medium">Mittel</Option>
                        <Option value="low">Niedrig</Option>
                        <Option value="inactive">Inaktiv</Option>
                      </Select>
                    </Form.Item>
                    
                    <Form.Item
                      name={['criteria', 'last_active_days']}
                      label="Zuletzt aktiv innerhalb von (Tagen)"
                    >
                      <Select>
                        <Option value={7}>7 Tagen</Option>
                        <Option value={30}>30 Tagen</Option>
                        <Option value={90}>90 Tagen</Option>
                        <Option value={180}>180 Tagen</Option>
                        <Option value={365}>1 Jahr</Option>
                        <Option value={0}>Beliebig</Option>
                      </Select>
                    </Form.Item>
                    
                    <Title level={5} className="mt-4">E-Mail-Aktivität</Title>
                    
                    <Form.Item
                      name={['criteria', 'email_activity', 'open_rate']}
                      label="Mindest-Öffnungsrate (%)"
                    >
                      <Select>
                        <Option value={0}>Beliebig</Option>
                        <Option value={10}>Mindestens 10%</Option>
                        <Option value={25}>Mindestens 25%</Option>
                        <Option value={50}>Mindestens 50%</Option>
                        <Option value={75}>Mindestens 75%</Option>
                      </Select>
                    </Form.Item>
                    
                    <Form.Item
                      name={['criteria', 'email_activity', 'click_rate']}
                      label="Mindest-Klickrate (%)"
                    >
                      <Select>
                        <Option value={0}>Beliebig</Option>
                        <Option value={5}>Mindestens 5%</Option>
                        <Option value={10}>Mindestens 10%</Option>
                        <Option value={25}>Mindestens 25%</Option>
                        <Option value={50}>Mindestens 50%</Option>
                      </Select>
                    </Form.Item>
                    
                    <Form.Item
                      name={['criteria', 'tags']}
                      label="Benutzer-Tags"
                    >
                      <Select mode="multiple" placeholder="Tags auswählen">
                        <Option value="newsletter">Newsletter</Option>
                        <Option value="premium">Premium</Option>
                        <Option value="new_user">Neuer Benutzer</Option>
                      </Select>
                    </Form.Item>
                  </Card>
                </Form.Item>
                
                <div className="flex justify-end space-x-3">
                  <Button onClick={() => setCreateModalVisible(false)}>
                    Abbrechen
                  </Button>
                  <Button type="primary" htmlType="submit">
                    Segment erstellen
                  </Button>
                </div>
              </Form>
            </Modal>
            
            {/* Modal für Segment löschen */}
            <Modal
              title="Segment löschen"
              open={deleteModalVisible}
              onCancel={() => {
                setDeleteModalVisible(false);
                setSelectedSegment(null);
              }}
              onOk={handleDeleteSegment}
              okText="Löschen"
              okButtonProps={{ danger: true }}
              cancelText="Abbrechen"
            >
              <p>Sind Sie sicher, dass Sie dieses Segment löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.</p>
            </Modal>
          </div>
        </main>
      </div>
    </div>
  );
}

export default withAuthClient(UserSegmentsPage, ['admin', 'ADMIN']);
