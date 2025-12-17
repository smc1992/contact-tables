import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Card, Table, Spin, Alert, Tabs, Typography, Statistic, Row, Col, Badge } from 'antd';
import { FiMail, FiEye, FiMousePointer, FiClock } from 'react-icons/fi';
import moment from 'moment';
import 'moment/locale/de';
import { withAuth } from '@/utils/withAuth';
import { User } from '@supabase/supabase-js';
import { Layout as AdminLayout } from 'antd';
import AdminSidebar from '@/components/AdminSidebar';
import Header from '@/components/Header';
import { createClient } from '@/utils/supabase/client';

const { Title, Text } = Typography;

interface LinkClick {
  id: string;
  recipient_email: string;
  link_url: string;
  clicked_at: string;
  user_agent?: string;
}

interface Recipient {
  id: string;
  recipient_email: string;
  status: string;
  sent_at?: string;
  opened_at?: string;
}

interface CampaignStats {
  id: string;
  subject: string;
  status: string;
  created_at: string;
  sent_at?: string;
  completed_at?: string;
  recipient_count: number;
  sent_count: number;
  opened_count: number;
  click_count: number;
  failed_count: number;
  links: {
    url: string;
    clicks: number;
  }[];
}

interface CampaignStatsPageProps {
  user: User;
}

function CampaignStatsPage({ user }: CampaignStatsPageProps) {
  const router = useRouter();
  const { id } = router.query;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [linkClicks, setLinkClicks] = useState<LinkClick[]>([]);
  
  useEffect(() => {
    if (!id) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          throw new Error('Nicht authentifiziert');
        }
        
        const headers = {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        };
        
        // Kampagnen-Statistiken abrufen
        const statsResponse = await fetch(`/api/admin/campaigns/${id}/stats/`, { headers });
        if (!statsResponse.ok) {
          throw new Error('Fehler beim Laden der Kampagnen-Statistiken');
        }
        const statsData = await statsResponse.json();
        setStats(statsData);
        
        // Empfänger abrufen
        const recipientsResponse = await fetch(`/api/admin/campaigns/${id}/recipients/`, { headers });
        if (!recipientsResponse.ok) {
          throw new Error('Fehler beim Laden der Empfänger');
        }
        const recipientsData = await recipientsResponse.json();
        setRecipients(recipientsData.recipients || []);
        
        // Link-Klicks abrufen
        const clicksResponse = await fetch(`/api/admin/campaigns/${id}/clicks/`, { headers });
        if (!clicksResponse.ok) {
          throw new Error('Fehler beim Laden der Link-Klicks');
        }
        const clicksData = await clicksResponse.json();
        setLinkClicks(clicksData.clicks || []);
        
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex flex-1">
          <AdminSidebar activeItem="campaigns" />
          <main className="flex-1 p-6 bg-gray-50">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col justify-center items-center h-64">
                <Spin size="large" />
                <div className="mt-4 text-gray-600">Statistiken werden geladen...</div>
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
          <AdminSidebar activeItem="campaigns" />
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
  
  if (!stats) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex flex-1">
          <AdminSidebar activeItem="campaigns" />
          <main className="flex-1 p-6 bg-gray-50">
            <div className="max-w-7xl mx-auto">
              <Alert
                message="Kampagne nicht gefunden"
                description="Die angeforderte Kampagne konnte nicht gefunden werden."
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
  
  // Tabellen-Spalten für Empfänger
  const recipientColumns = [
    {
      title: 'E-Mail',
      dataIndex: 'recipient_email',
      key: 'email',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'default';
        let text = status;
        
        switch (status) {
          case 'sent':
            color = 'green';
            text = 'Gesendet';
            break;
          case 'pending':
            color = 'blue';
            text = 'Ausstehend';
            break;
          case 'failed':
            color = 'red';
            text = 'Fehlgeschlagen';
            break;
          case 'opened':
            color = 'purple';
            text = 'Geöffnet';
            break;
        }
        
        return <Badge color={color} text={text} />;
      }
    },
    {
      title: 'Gesendet am',
      dataIndex: 'sent_at',
      key: 'sent_at',
      render: (date: string) => date ? moment(date).format('DD.MM.YYYY HH:mm') : '-'
    },
    {
      title: 'Geöffnet am',
      dataIndex: 'opened_at',
      key: 'opened_at',
      render: (date: string) => date ? moment(date).format('DD.MM.YYYY HH:mm') : '-'
    }
  ];
  
  // Tabellen-Spalten für Link-Klicks
  const clickColumns = [
    {
      title: 'E-Mail',
      dataIndex: 'recipient_email',
      key: 'email',
    },
    {
      title: 'Link',
      dataIndex: 'link_url',
      key: 'link',
      render: (url: string) => (
        <a href={url} target="_blank" rel="noopener noreferrer" className="truncate block max-w-md">
          {url}
        </a>
      )
    },
    {
      title: 'Geklickt am',
      dataIndex: 'clicked_at',
      key: 'clicked_at',
      render: (date: string) => moment(date).format('DD.MM.YYYY HH:mm')
    }
  ];
  
  // Tabellen-Spalten für Link-Statistiken
  const linkStatsColumns = [
    {
      title: 'Link',
      dataIndex: 'url',
      key: 'url',
      render: (url: string) => (
        <a href={url} target="_blank" rel="noopener noreferrer" className="truncate block max-w-md">
          {url}
        </a>
      )
    },
    {
      title: 'Klicks',
      dataIndex: 'clicks',
      key: 'clicks',
    }
  ];
  
  // Öffnungsrate berechnen
  const openRate = stats.sent_count > 0 ? Math.round((stats.opened_count / stats.sent_count) * 100) : 0;
  
  // Klickrate berechnen
  const clickRate = stats.opened_count > 0 ? Math.round((stats.click_count / stats.opened_count) * 100) : 0;
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        <AdminSidebar activeItem="campaigns" />
        <main className="flex-1 p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <Title level={2}>Kampagnen-Statistik</Title>
              <Text>{stats.subject}</Text>
            </div>
      
      <Card className="mb-6">
        <Row gutter={[24, 24]}>
          <Col xs={12} sm={8} md={6}>
            <Statistic 
              title="Empfänger" 
              value={stats.recipient_count} 
              prefix={<FiMail className="mr-1" />} 
            />
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Statistic 
              title="Gesendet" 
              value={stats.sent_count} 
              prefix={<FiMail className="mr-1" />} 
            />
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Statistic 
              title="Geöffnet" 
              value={stats.opened_count} 
              suffix={`(${openRate}%)`}
              prefix={<FiEye className="mr-1" />} 
            />
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Statistic 
              title="Link-Klicks" 
              value={stats.click_count} 
              suffix={`(${clickRate}%)`}
              prefix={<FiMousePointer className="mr-1" />} 
            />
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Statistic 
              title="Fehlgeschlagen" 
              value={stats.failed_count} 
              valueStyle={{ color: stats.failed_count > 0 ? '#cf1322' : undefined }}
            />
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Statistic 
              title="Erstellt am" 
              value={moment(stats.created_at).format('DD.MM.YYYY')} 
              prefix={<FiClock className="mr-1" />} 
            />
          </Col>
        </Row>
      </Card>
      
      <Tabs 
        defaultActiveKey="recipients"
        items={[
          {
            key: 'recipients',
            label: 'Empfänger',
            children: (
              <Table 
                dataSource={recipients} 
                columns={recipientColumns} 
                rowKey="id"
                pagination={{ pageSize: 10 }}
              />
            )
          },
          {
            key: 'clicks',
            label: 'Link-Klicks',
            children: (
              <Table 
                dataSource={linkClicks} 
                columns={clickColumns} 
                rowKey="id"
                pagination={{ pageSize: 10 }}
              />
            )
          },
          {
            key: 'linkStats',
            label: 'Link-Statistik',
            children: (
              <Table 
                dataSource={stats.links} 
                columns={linkStatsColumns} 
                rowKey="url"
                pagination={{ pageSize: 10 }}
              />
            )
          }
        ]}
      />
          </div>
        </main>
      </div>
    </div>
  );
}

export default CampaignStatsPage;

export const getServerSideProps = withAuth(
  ['admin', 'ADMIN'],
  async (context, user) => {
    return {
      props: { user }
    };
  }
);

// Verhindert statischen Export und erzwingt Node.js Runtime für Admin-Seiten
export const config = {
  unstable_runtimeJS: true,
  runtime: 'nodejs'
};
