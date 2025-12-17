import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { withAuth } from '@/utils/withAuth';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Table, Button, Input, Card, Alert, Spin, Modal, Tag, Tooltip } from 'antd';
import { useRouter } from 'next/router';
import Head from 'next/head';

interface EmailBatch {
  id: string;
  campaign_id: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  scheduled_time: string;
  batch_number: number;
  total_batches: number;
  recipient_count: number;
  sent_count: number;
  failed_count: number;
  created_at: string;
  completed_at?: string;
}

const EmailBatchTestPage = () => {
  const [loading, setLoading] = useState(false);
  const [batches, setBatches] = useState<EmailBatch[]>([]);
  const [batchId, setBatchId] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/emails/batches');
      if (!response.ok) {
        throw new Error('Fehler beim Laden der Batches');
      }
      const data = await response.json();
      setBatches(data.batches || []);
    } catch (error) {
      console.error('Fehler beim Laden der Batches:', error);
      setError('Fehler beim Laden der Batches');
    } finally {
      setLoading(false);
    }
  };

  const handleTestBatch = async (id?: string) => {
    setTestLoading(true);
    setError(null);
    setTestResult(null);
    
    try {
      const response = await fetch('/api/admin/emails/test-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ batchId: id || batchId }),
      });
      
      const result = await response.json();
      setTestResult(result);
      
      if (!response.ok) {
        setError(result.message || 'Fehler beim Testen des Batches');
      } else {
        // Aktualisiere die Batch-Liste nach erfolgreicher Verarbeitung
        fetchBatches();
      }
    } catch (error) {
      console.error('Fehler beim Testen des Batches:', error);
      setError(`Fehler beim Testen des Batches: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    } finally {
      setTestLoading(false);
    }
  };

  const handleRunCronJob = async () => {
    setTestLoading(true);
    setError(null);
    setTestResult(null);
    
    try {
      const response = await fetch('/api/admin/emails/test-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}), // Leerer Body für Cron-Job-Aufruf
      });
      
      const result = await response.json();
      setTestResult(result);
      
      if (!response.ok) {
        setError(result.message || 'Fehler beim Ausführen des Cron-Jobs');
      } else {
        // Aktualisiere die Batch-Liste nach erfolgreicher Verarbeitung
        fetchBatches();
      }
    } catch (error) {
      console.error('Fehler beim Ausführen des Cron-Jobs:', error);
      setError(`Fehler beim Ausführen des Cron-Jobs: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    } finally {
      setTestLoading(false);
    }
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Tag color="blue">Ausstehend</Tag>;
      case 'PROCESSING':
        return <Tag color="orange">In Bearbeitung</Tag>;
      case 'COMPLETED':
        return <Tag color="green">Abgeschlossen</Tag>;
      case 'FAILED':
        return <Tag color="red">Fehlgeschlagen</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const columns = [
    {
      title: 'Batch-ID',
      dataIndex: 'id',
      key: 'id',
      render: (text: string) => <span className="font-mono text-xs">{text}</span>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (text: string) => getStatusTag(text),
    },
    {
      title: 'Batch',
      key: 'batch',
      render: (record: EmailBatch) => (
        <span>
          {record.batch_number} von {record.total_batches}
        </span>
      ),
    },
    {
      title: 'Empfänger',
      key: 'recipients',
      render: (record: EmailBatch) => (
        <span>
          {record.sent_count + record.failed_count} / {record.recipient_count}
        </span>
      ),
    },
    {
      title: 'Geplant für',
      dataIndex: 'scheduled_time',
      key: 'scheduled_time',
      render: (text: string) => <span>{new Date(text).toLocaleString()}</span>,
    },
    {
      title: 'Aktionen',
      key: 'actions',
      render: (record: EmailBatch) => (
        <Button 
          type="primary" 
          size="small" 
          onClick={() => handleTestBatch(record.id)}
          disabled={record.status === 'COMPLETED' || testLoading}
        >
          Verarbeiten
        </Button>
      ),
    },
  ];

  return (
    <AdminLayout>
      <Head>
        <title>E-Mail-Batch-Test | Admin</title>
      </Head>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">E-Mail-Batch-Test</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card title="Cron-Job ausführen" className="col-span-1">
            <p className="mb-4">
              Führt den Cron-Job aus, der alle fälligen Batches verarbeitet.
            </p>
            <Button 
              type="primary" 
              onClick={handleRunCronJob}
              loading={testLoading}
              block
            >
              Cron-Job ausführen
            </Button>
          </Card>
          
          <Card title="Spezifischen Batch verarbeiten" className="col-span-2">
            <div className="flex space-x-2">
              <Input 
                placeholder="Batch-ID eingeben" 
                value={batchId} 
                onChange={(e) => setBatchId(e.target.value)}
                disabled={testLoading}
                className="flex-grow"
              />
              <Button 
                type="primary" 
                onClick={() => handleTestBatch()}
                disabled={!batchId || testLoading}
              >
                Batch verarbeiten
              </Button>
            </div>
          </Card>
        </div>
        
        {error && (
          <Alert 
            message="Fehler" 
            description={error} 
            type="error" 
            showIcon 
            className="mb-6"
          />
        )}
        
        {testResult && (
          <Card title="Testergebnis" className="mb-6">
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </Card>
        )}
        
        <Card 
          title="E-Mail-Batches" 
          extra={
            <Button onClick={fetchBatches} disabled={loading}>
              Aktualisieren
            </Button>
          }
        >
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Spin size="large" />
            </div>
          ) : (
            <Table 
              dataSource={batches} 
              columns={columns} 
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          )}
        </Card>
      </div>
    </AdminLayout>
  );
};

export const getServerSideProps: GetServerSideProps = withAuth(
  ['admin', 'ADMIN'],
  async (context, user) => {
    return {
      props: {}
    };
  }
);

export default EmailBatchTestPage;
