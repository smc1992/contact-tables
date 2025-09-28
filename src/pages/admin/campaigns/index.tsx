import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { withAuth } from '@/utils/withAuth';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdminSidebar from '@/components/AdminSidebar';
import { Table, Tag, Button, Space, Tooltip, message, Modal, Spin } from 'antd';
import { FiPlus, FiEdit, FiTrash2, FiPause, FiPlay, FiCopy, FiBarChart2, FiCalendar, FiClock, FiRefreshCw, FiMail } from 'react-icons/fi';

interface Campaign {
  id: string;
  subject: string;
  content: string;
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'failed';
  schedule_type: 'immediate' | 'scheduled' | 'recurring';
  scheduled_at?: string;
  recurring_config?: any;
  target_config?: any;
  recipient_count: number;
  sent_count: number;
  failed_count: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  _count?: {
    recipients: number;
    batches: number;
  };
}

function CampaignDashboardPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [quota, setQuota] = useState<{ remaining: number; used: number; maxPerHour: number; resetTime: string } | null>(null);
  const [quotaLoading, setQuotaLoading] = useState(false);

  useEffect(() => {
    fetchCampaigns();
    fetchQuota();
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/campaigns');
      const data = await response.json();
      
      if (response.ok) {
        setCampaigns(data.campaigns || []);
      } else {
        throw new Error(data.error || 'Fehler beim Laden der Kampagnen');
      }
    } catch (error) {
      console.error('Fehler beim Laden der Kampagnen:', error);
      message.error('Kampagnen konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuota = async () => {
    setQuotaLoading(true);
    try {
      const response = await fetch('/api/admin/emails/quota', {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' },
        credentials: 'same-origin'
      });
      const data = await response.json();
      if (response.ok) {
        setQuota({ remaining: data.remaining, used: data.used, maxPerHour: data.maxPerHour, resetTime: data.resetTime });
      } else {
        throw new Error(data.error || 'Fehler beim Laden des E-Mail-Kontingents');
      }
    } catch (error) {
      console.error('Fehler beim Laden des E-Mail-Kontingents:', error);
      message.warning('E-Mail-Kontingent konnte nicht geladen werden');
    } finally {
      setQuotaLoading(false);
    }
  };

  const getStatusTag = (status: string) => {
    const statusConfig: Record<string, { color: string; text: string }> = {
      draft: { color: 'default', text: 'Entwurf' },
      scheduled: { color: 'blue', text: 'Geplant' },
      active: { color: 'green', text: 'Aktiv' },
      paused: { color: 'orange', text: 'Pausiert' },
      completed: { color: 'cyan', text: 'Abgeschlossen' },
      failed: { color: 'red', text: 'Fehlgeschlagen' }
    };
    
    const config = statusConfig[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getScheduleTypeText = (campaign: Campaign) => {
    if (campaign.schedule_type === 'immediate') {
      return 'Sofort';
    } else if (campaign.schedule_type === 'scheduled') {
      return campaign.scheduled_at 
        ? `Geplant für ${new Date(campaign.scheduled_at).toLocaleString('de-DE')}`
        : 'Geplant';
    } else if (campaign.schedule_type === 'recurring') {
      try {
        const config = typeof campaign.recurring_config === 'string' 
          ? JSON.parse(campaign.recurring_config) 
          : campaign.recurring_config;
        
        if (!config) return 'Wiederkehrend';
        
        let text = '';
        switch (config.frequency) {
          case 'daily':
            text = 'Täglich';
            break;
          case 'weekly':
            text = `Wöchentlich (${(config.days || []).map((d: number) => ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][d]).join(', ')})`;
            break;
          case 'monthly':
            text = `Monatlich (Tag ${(config.days || []).join(', ')})`;
            break;
          default:
            text = 'Wiederkehrend';
        }
        
        if (config.time) {
          text += ` um ${config.time} Uhr`;
        }
        
        return text;
      } catch (e) {
        return 'Wiederkehrend';
      }
    }
    
    return 'Unbekannt';
  };

  const handleCampaignAction = async (id: string, action: string) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/campaigns/${id}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        message.success(data.message || 'Aktion erfolgreich ausgeführt');
        fetchCampaigns(); // Kampagnen neu laden
      } else {
        throw new Error(data.error || 'Fehler bei der Ausführung der Aktion');
      }
    } catch (error: unknown) {
      console.error(`Fehler bei Aktion "${action}":`, error);
      message.error(`Aktion konnte nicht ausgeführt werden: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCampaign = async () => {
    if (!selectedCampaign) return;
    
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/campaigns/${selectedCampaign}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (response.ok) {
        message.success('Kampagne erfolgreich gelöscht');
        setDeleteModalVisible(false);
        fetchCampaigns(); // Kampagnen neu laden
      } else {
        throw new Error(data.error || 'Fehler beim Löschen der Kampagne');
      }
    } catch (error: unknown) {
      console.error('Fehler beim Löschen der Kampagne:', error);
      message.error(`Kampagne konnte nicht gelöscht werden: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    } finally {
      setActionLoading(false);
      setSelectedCampaign(null);
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'subject',
      key: 'subject',
      render: (text: string, record: Campaign) => (
        <Link href={`/admin/campaigns/${record.id}`} className="text-indigo-600 hover:text-indigo-800">
          {text}
        </Link>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: getStatusTag,
    },
    {
      title: 'Zeitplan',
      key: 'schedule',
      render: (_: any, record: Campaign) => (
        <div className="flex items-center">
          {record.schedule_type === 'scheduled' && <FiCalendar className="mr-1" />}
          {record.schedule_type === 'recurring' && <FiClock className="mr-1" />}
          {getScheduleTypeText(record)}
        </div>
      ),
    },
    {
      title: 'Empfänger',
      key: 'recipients',
      render: (_: any, record: Campaign) => record._count?.recipients || record.recipient_count || 0,
    },
    {
      title: 'Gesendet',
      dataIndex: 'sent_count',
      key: 'sent_count',
      render: (sent: number, record: Campaign) => `${sent || 0} / ${record.recipient_count || 0}`,
    },
    {
      title: 'Erstellt am',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString('de-DE'),
    },
    {
      title: 'Aktionen',
      key: 'actions',
      render: (_: any, record: Campaign) => (
        <Space size="small">
          <Tooltip title="Bearbeiten">
            <Button 
              icon={<FiEdit />} 
              size="small" 
              onClick={() => router.push(`/admin/campaigns/${record.id}/edit`)}
              disabled={record.status === 'active' || record.status === 'completed'}
            />
          </Tooltip>
          
          {record.status === 'draft' && record.schedule_type !== 'immediate' && (
            <Tooltip title="Planen">
              <Button 
                icon={<FiCalendar />} 
                size="small" 
                onClick={() => handleCampaignAction(record.id, 'schedule')}
              />
            </Tooltip>
          )}
          
          {(record.status === 'draft' || record.status === 'scheduled' || record.status === 'paused') && (
            <Tooltip title="Starten">
              <Button 
                icon={<FiPlay />} 
                size="small" 
                onClick={() => handleCampaignAction(record.id, 'start')}
              />
            </Tooltip>
          )}
          
          {record.status === 'active' && (
            <Tooltip title="Pausieren">
              <Button 
                icon={<FiPause />} 
                size="small" 
                onClick={() => handleCampaignAction(record.id, 'pause')}
              />
            </Tooltip>
          )}
          
          {record.status === 'paused' && (
            <Tooltip title="Fortsetzen">
              <Button 
                icon={<FiPlay />} 
                size="small" 
                onClick={() => handleCampaignAction(record.id, 'resume')}
              />
            </Tooltip>
          )}
          
          {(record.status === 'scheduled' || record.status === 'active' || record.status === 'paused') && (
            <Tooltip title="Abbrechen">
              <Button 
                icon={<FiRefreshCw />} 
                size="small" 
                onClick={() => handleCampaignAction(record.id, 'cancel')}
              />
            </Tooltip>
          )}
          
          <Tooltip title="Duplizieren">
            <Button 
              icon={<FiCopy />} 
              size="small" 
              onClick={() => handleCampaignAction(record.id, 'duplicate')}
            />
          </Tooltip>
          
          <Tooltip title="Statistiken">
            <Button 
              icon={<FiBarChart2 />} 
              size="small" 
              onClick={() => router.push(`/admin/campaigns/${record.id}/stats`)}
              disabled={record.status === 'draft' || record.status === 'scheduled'}
            />
          </Tooltip>
          
          {(record.status === 'draft' || record.status === 'scheduled' || record.status === 'paused') && (
            <Tooltip title="Löschen">
              <Button 
                icon={<FiTrash2 />} 
                size="small" 
                danger
                onClick={() => {
                  setSelectedCampaign(record.id);
                  setDeleteModalVisible(true);
                }}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        <AdminSidebar activeItem="campaigns" />
        <main className="flex-1 p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Email-Kampagnen</h1>
                <p className="text-sm text-gray-500">
                  Verwalten Sie Ihre Email-Kampagnen und Zeitpläne
                </p>
              </div>
              <div className="flex space-x-3">
                <Button 
                  type="primary" 
                  icon={<FiPlus />} 
                  onClick={() => router.push('/admin/campaigns/new')}
                >
                  Neue Kampagne
                </Button>
                <Button 
                  icon={<FiRefreshCw />} 
                  onClick={fetchCampaigns}
                  loading={loading}
                >
                  Aktualisieren
                </Button>
              </div>
        </div>

            {/* Quotenanzeige */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center space-x-3 text-sm text-gray-700">
                <span className="flex items-center"><FiMail className="mr-1" />Kontingent pro Stunde:</span>
                <Tag color="blue">{quota?.maxPerHour ?? 200}</Tag>
                <span>Verfügbar:</span>
                <Tag color={(quota?.remaining ?? 0) > 0 ? 'green' : 'red'}>
                  {quota ? `${quota.remaining}` : 'lädt...'}
                </Tag>
                <span>Reset:</span>
                <Tag>{quota ? new Date(quota.resetTime).toLocaleTimeString('de-DE') : '-'}</Tag>
              </div>
              <Button icon={<FiRefreshCw />} onClick={fetchQuota} loading={quotaLoading}>
                Quota aktualisieren
              </Button>
            </div>

            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <Table 
                columns={columns} 
                dataSource={campaigns} 
                rowKey="id" 
                loading={loading}
                pagination={{ pageSize: 10 }}
              />
            </div>
          </div>
        </main>
      </div>
      <Footer />

      {/* Lösch-Bestätigungsdialog */}
      <Modal
        title="Kampagne löschen"
        open={deleteModalVisible}
        onOk={handleDeleteCampaign}
        onCancel={() => {
          setDeleteModalVisible(false);
          setSelectedCampaign(null);
        }}
        okText="Löschen"
        cancelText="Abbrechen"
        confirmLoading={actionLoading}
      >
        <p>Sind Sie sicher, dass Sie diese Kampagne löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.</p>
      </Modal>
    </div>
  );
}

export const getServerSideProps = withAuth(
  ['admin', 'ADMIN'],
  async (context, user) => {
    return {
      props: {}
    };
  }
);

export default CampaignDashboardPage;
