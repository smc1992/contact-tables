import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdminSidebar from '@/components/AdminSidebar';
import Link from 'next/link';
import { FiMail, FiRefreshCw, FiChevronRight, FiCheck, FiX, FiAlertTriangle, FiClock, FiInfo, FiTrash2, FiEye, FiChevronLeft, FiChevronRight as FiChevronRightIcon } from 'react-icons/fi';
import { withAuth } from '@/utils/withAuth';
import { toast } from 'react-hot-toast';
import { GetServerSideProps } from 'next';

// Define email campaign type
interface EmailCampaign {
  id: string;
  subject: string;
  status: 'draft' | 'sending' | 'sent' | 'partial' | 'failed' | 'scheduled';
  created_at: string;
  completed_at: string | null;
  template_id: string | null;
  sender: {
    email: string;
    name: string;
  };
  stats: {
    total: number;
    sent: number;
    failed: number;
    pending: number;
    skipped: number;
    openRate: number;
  };
  processing_time?: number;
  send_rate?: number;
  campaign_metrics?: any;
  hasBatches?: boolean;
}

// Define email recipient type
interface EmailRecipient {
  id: string;
  campaign_id: string;
  recipient_id: string;
  recipient_email: string;
  status: 'pending' | 'sent' | 'failed' | 'opened';
  error_message: string | null;
  sent_at: string;
}

// Define email batch type
interface EmailBatch {
  id: string;
  campaign_id: string;
  scheduled_time: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  recipient_count: number;
  sent_count: number;
  failed_count: number;
  created_at: string;
  updated_at: string;
}

// Define pagination type
interface Pagination {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function EmailHistoryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | null>(null);
  const [recipients, setRecipients] = useState<EmailRecipient[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, pageSize: 10, totalPages: 0 });
  const [deletingCampaign, setDeletingCampaign] = useState<string | null>(null);
  const [batches, setBatches] = useState<EmailBatch[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [batchPagination, setBatchPagination] = useState<Pagination>({ total: 0, page: 1, pageSize: 5, totalPages: 0 });
  const [showBatches, setShowBatches] = useState(false);
  const supabase = createClient();

  // Load email campaigns
  const fetchCampaigns = async (page = pagination.page) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/emails/history?page=${page}&pageSize=${pagination.pageSize}`);
      const result = await response.json();
      
      if (!response.ok) throw new Error(result.message || 'Fehler beim Laden der Kampagnen');
      
      setCampaigns(result.data.campaigns || []);
      setPagination(result.data.pagination);
      
      // Clear selected campaign if it's not in the current page
      if (selectedCampaign && !result.data.campaigns.find((c: EmailCampaign) => c.id === selectedCampaign.id)) {
        setSelectedCampaign(null);
        setRecipients([]);
      }
    } catch (error) {
      console.error('Fehler beim Laden der E-Mail-Kampagnen:', error);
      toast.error('Kampagnen konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  };

  // Load recipients for a specific campaign
  const fetchRecipients = async (campaignId: string) => {
    setLoadingRecipients(true);
    try {
      const response = await fetch(`/api/admin/campaigns/${campaignId}/recipients`);
      const result = await response.json();
      
      if (!response.ok) throw new Error(result.error || 'Fehler beim Laden der Empfänger');
      
      // Transform data to match expected interface
      const transformedRecipients = (result.recipients || []).map((recipient: any) => ({
        id: recipient.id,
        campaign_id: campaignId,
        recipient_id: '', // Not provided by API
        recipient_email: recipient.recipient_email,
        status: recipient.status,
        error_message: recipient.error_message || null,
        sent_at: recipient.sent_at
      }));
      
      setRecipients(transformedRecipients);
    } catch (error) {
      console.error('Fehler beim Laden der Empfänger:', error);
      toast.error('Empfänger konnten nicht geladen werden');
    } finally {
      setLoadingRecipients(false);
    }
  };
  
  // Load batches for a specific campaign
  const fetchBatches = async (campaignId: string, page = batchPagination.page) => {
    setLoadingBatches(true);
    try {
      const response = await fetch(`/api/admin/emails/batches?campaignId=${campaignId}&page=${page}&pageSize=${batchPagination.pageSize}`);
      const result = await response.json();
      
      if (!response.ok) throw new Error(result.message || 'Fehler beim Laden der Batches');
      
      setBatches(result.data.batches || []);
      setBatchPagination(result.data.pagination);
    } catch (error) {
      console.error('Fehler beim Laden der Batches:', error);
      toast.error('Batches konnten nicht geladen werden');
    } finally {
      setLoadingBatches(false);
    }
  };
  
  // Delete a campaign
  const deleteCampaign = async (id: string) => {
    if (!confirm('Möchten Sie diese Kampagne wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      return;
    }
    
    setDeletingCampaign(id);
    try {
      const response = await fetch(`/api/admin/emails/history?id=${id}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (!response.ok) throw new Error(result.message || 'Fehler beim Löschen der Kampagne');
      
      toast.success('Kampagne erfolgreich gelöscht');
      
      // Refresh campaigns and clear selection if the deleted campaign was selected
      fetchCampaigns();
      if (selectedCampaign?.id === id) {
        setSelectedCampaign(null);
        setRecipients([]);
      }
    } catch (error) {
      console.error('Fehler beim Löschen der Kampagne:', error);
      toast.error('Kampagne konnte nicht gelöscht werden');
    } finally {
      setDeletingCampaign(null);
    }
  };
  
  // Handle pagination
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    fetchCampaigns(newPage);
  };

  useEffect(() => {
    fetchCampaigns(1);
  }, []);

  // Handle campaign selection
  const handleCampaignSelect = (campaign: EmailCampaign) => {
    setSelectedCampaign(campaign);
    fetchRecipients(campaign.id);
    
    // Check if campaign has batches (status is 'scheduled' or hasBatches flag is true)
    if (campaign.status === 'scheduled' || campaign.hasBatches) {
      setShowBatches(true);
      fetchBatches(campaign.id);
    } else {
      setShowBatches(false);
      setBatches([]);
    }
  };
  
  // Handle batch pagination
  const handleBatchPageChange = (newPage: number) => {
    if (newPage < 1 || newPage > batchPagination.totalPages) return;
    if (selectedCampaign) {
      fetchBatches(selectedCampaign.id, newPage);
    }
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <FiClock className="mr-1" />
            Entwurf
          </span>
        );
      case 'sending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <FiRefreshCw className="mr-1 animate-spin" />
            Wird gesendet
          </span>
        );
      case 'scheduled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            <FiClock className="mr-1" />
            Geplant
          </span>
        );
      case 'sent':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <FiCheck className="mr-1" />
            Gesendet
          </span>
        );
      case 'partial':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <FiAlertTriangle className="mr-1" />
            Teilweise gesendet
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <FiX className="mr-1" />
            Fehlgeschlagen
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <FiInfo className="mr-1" />
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        <AdminSidebar activeItem="email-builder" />
        <main className="flex-1 p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">E-Mail-Verlauf</h1>
                <p className="text-sm text-gray-500">
                  Übersicht aller gesendeten E-Mail-Kampagnen
                </p>
              </div>
              <div className="flex space-x-3">
                <Link
                  href="/admin/email-builder"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
                >
                  <FiMail className="mr-2" />
                  Neue E-Mail erstellen
                </Link>
                <button
                  onClick={(e) => fetchCampaigns()}
                  disabled={loading}
                  className={`px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {loading ? (
                    <>
                      <FiRefreshCw className="animate-spin mr-2" />
                      Wird aktualisiert...
                    </>
                  ) : (
                    <>
                      <FiRefreshCw className="mr-2" />
                      Aktualisieren
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Email Campaigns List */}
              <div className="lg:col-span-1">
                <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <h2 className="text-lg font-medium text-gray-900">Kampagnen</h2>
                  </div>
                  
                  {loading ? (
                    <div className="p-6 flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                    </div>
                  ) : campaigns.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      Keine E-Mail-Kampagnen gefunden
                    </div>
                  ) : (
                    <>
                      <ul className="divide-y divide-gray-200 max-h-[500px] overflow-y-auto">
                        {campaigns.map((campaign) => (
                          <li 
                            key={campaign.id}
                            className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${selectedCampaign?.id === campaign.id ? 'bg-indigo-50' : ''}`}
                          >
                            <div className="flex justify-between items-start">
                              <div 
                                className="flex-1 min-w-0"
                                onClick={() => handleCampaignSelect(campaign)}
                              >
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {campaign.subject}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {formatDate(campaign.created_at)}
                                </p>
                              </div>
                              <div className="ml-2 flex items-center space-x-2">
                                {getStatusBadge(campaign.status)}
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteCampaign(campaign.id);
                                  }}
                                  disabled={deletingCampaign === campaign.id}
                                  className="text-gray-400 hover:text-red-500 focus:outline-none"
                                  title="Kampagne löschen"
                                >
                                  {deletingCampaign === campaign.id ? (
                                    <FiRefreshCw className="animate-spin h-4 w-4" />
                                  ) : (
                                    <FiTrash2 className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                            </div>
                            <div 
                              className="mt-2 flex justify-between text-xs text-gray-500"
                              onClick={() => handleCampaignSelect(campaign)}
                            >
                              <span>Empfänger: {campaign.stats.total}</span>
                              <span>Gesendet: {campaign.stats.sent}</span>
                              <span>Fehler: {campaign.stats.failed}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                      
                      {/* Pagination */}
                      {pagination.totalPages > 1 && (
                        <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                          <div className="flex-1 flex justify-between sm:hidden">
                            <button
                              onClick={(e: React.MouseEvent) => {
                                e.preventDefault();
                                handlePageChange(pagination.page - 1);
                              }}
                              disabled={pagination.page === 1}
                              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${pagination.page === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              Zurück
                            </button>
                            <button
                              onClick={(e: React.MouseEvent) => {
                                e.preventDefault();
                                handlePageChange(pagination.page + 1);
                              }}
                              disabled={pagination.page === pagination.totalPages}
                              className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${pagination.page === pagination.totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              Weiter
                            </button>
                          </div>
                          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                              <p className="text-sm text-gray-700">
                                Seite <span className="font-medium">{pagination.page}</span> von <span className="font-medium">{pagination.totalPages}</span>
                              </p>
                            </div>
                            <div>
                              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                <button
                                  onClick={(e: React.MouseEvent) => {
                                    e.preventDefault();
                                    handlePageChange(pagination.page - 1);
                                  }}
                                  disabled={pagination.page === 1}
                                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${pagination.page === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                  <span className="sr-only">Zurück</span>
                                  <FiChevronLeft className="h-5 w-5" />
                                </button>
                                
                                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                  // Show pages around current page
                                  let pageNum;
                                  if (pagination.totalPages <= 5) {
                                    pageNum = i + 1;
                                  } else if (pagination.page <= 3) {
                                    pageNum = i + 1;
                                  } else if (pagination.page >= pagination.totalPages - 2) {
                                    pageNum = pagination.totalPages - 4 + i;
                                  } else {
                                    pageNum = pagination.page - 2 + i;
                                  }
                                  
                                  return (
                                    <button
                                      key={pageNum}
                                      onClick={(e: React.MouseEvent) => {
                                        e.preventDefault();
                                        handlePageChange(pageNum);
                                      }}
                                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                        pagination.page === pageNum
                                          ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                      }`}
                                    >
                                      {pageNum}
                                    </button>
                                  );
                                })}
                                
                                <button
                                  onClick={(e: React.MouseEvent) => {
                                    e.preventDefault();
                                    handlePageChange(pagination.page + 1);
                                  }}
                                  disabled={pagination.page === pagination.totalPages}
                                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${pagination.page === pagination.totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                  <span className="sr-only">Weiter</span>
                                  <FiChevronRightIcon className="h-5 w-5" />
                                </button>
                              </nav>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Email Campaign Details */}
              <div className="lg:col-span-2">
                {selectedCampaign ? (
                  <div className="bg-white shadow-sm rounded-lg border border-gray-200">
                    <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                      <h2 className="text-lg font-medium text-gray-900">Kampagnendetails</h2>
                    </div>
                    
                    <div className="p-4">
                      <div className="mb-6">
                        <h3 className="text-xl font-medium text-gray-900 mb-2">{selectedCampaign.subject}</h3>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          <div>
                            <span className="font-medium">Status:</span> {getStatusBadge(selectedCampaign.status)}
                          </div>
                          <div>
                            <span className="font-medium">Erstellt:</span> {formatDate(selectedCampaign.created_at)}
                          </div>
                          {selectedCampaign.completed_at && (
                            <div>
                              <span className="font-medium">Abgeschlossen:</span> {formatDate(selectedCampaign.completed_at)}
                            </div>
                          )}
                          <div>
                            <span className="font-medium">Absender:</span> {selectedCampaign.sender.name} ({selectedCampaign.sender.email})
                          </div>
                          {selectedCampaign.template_id && (
                            <div>
                              <span className="font-medium">Template-ID:</span> {selectedCampaign.template_id}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {selectedCampaign.processing_time && (
                        <div className="mb-6">
                          <h4 className="text-md font-medium text-gray-900 mb-2">Leistungsmetriken</h4>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="bg-indigo-50 p-3 rounded-lg text-center">
                              <div className="text-xl font-bold text-indigo-700">{selectedCampaign.processing_time.toFixed(2)}s</div>
                              <div className="text-xs text-gray-500">Verarbeitungszeit</div>
                            </div>
                            <div className="bg-indigo-50 p-3 rounded-lg text-center">
                              <div className="text-xl font-bold text-indigo-700">{selectedCampaign.send_rate?.toFixed(2) || '0'}</div>
                              <div className="text-xs text-gray-500">E-Mails/Sekunde</div>
                            </div>
                            <div className="bg-indigo-50 p-3 rounded-lg text-center">
                              <div className="text-xl font-bold text-indigo-700">
                                {selectedCampaign.stats.total > 0 
                                  ? ((selectedCampaign.stats.sent / selectedCampaign.stats.total) * 100).toFixed(1) 
                                  : '0'}%
                              </div>
                              <div className="text-xs text-gray-500">Erfolgsrate</div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="mb-6">
                        <h4 className="text-md font-medium text-gray-900 mb-2">Statistik</h4>
                        <div className="grid grid-cols-5 gap-4">
                          <div className="bg-gray-50 p-3 rounded-lg text-center">
                            <div className="text-2xl font-bold text-gray-700">{selectedCampaign.stats.total}</div>
                            <div className="text-xs text-gray-500">Empfänger</div>
                          </div>
                          <div className="bg-green-50 p-3 rounded-lg text-center">
                            <div className="text-2xl font-bold text-green-700">{selectedCampaign.stats.sent}</div>
                            <div className="text-xs text-gray-500">Erfolgreich</div>
                          </div>
                          <div className="bg-red-50 p-3 rounded-lg text-center">
                            <div className="text-2xl font-bold text-red-700">{selectedCampaign.stats.failed}</div>
                            <div className="text-xs text-gray-500">Fehlgeschlagen</div>
                          </div>
                          <div className="bg-yellow-50 p-3 rounded-lg text-center">
                            <div className="text-2xl font-bold text-yellow-700">{selectedCampaign.stats.skipped || 0}</div>
                            <div className="text-xs text-gray-500">Übersprungen</div>
                          </div>
                          <div className="bg-blue-50 p-3 rounded-lg text-center">
                            <div className="text-2xl font-bold text-blue-700">{selectedCampaign.stats.openRate}%</div>
                            <div className="text-xs text-gray-500">Öffnungsrate</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Batch information section */}
                      {showBatches && (
                        <div className="mb-6">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="text-md font-medium text-gray-900">Geplante Batches</h4>
                            <button 
                              onClick={() => fetchBatches(selectedCampaign.id)}
                              disabled={loadingBatches}
                              className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center"
                            >
                              {loadingBatches ? (
                                <FiRefreshCw className="mr-1 animate-spin" size={12} />
                              ) : (
                                <FiRefreshCw className="mr-1" size={12} />
                              )}
                              Aktualisieren
                            </button>
                          </div>
                          
                          {loadingBatches ? (
                            <div className="p-4 flex justify-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
                            </div>
                          ) : batches.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 border rounded-md">
                              Keine Batches gefunden
                            </div>
                          ) : (
                            <div className="border rounded-md overflow-hidden">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Geplant für
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Status
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Empfänger
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Fortschritt
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {batches.map((batch) => {
                                    // Calculate progress percentage
                                    const progress = batch.recipient_count > 0 
                                      ? Math.round(((batch.sent_count + batch.failed_count) / batch.recipient_count) * 100) 
                                      : 0;
                                    
                                    return (
                                      <tr key={batch.id}>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                          {formatDate(batch.scheduled_time)}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                          {batch.status === 'PENDING' ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                              <FiClock className="mr-1" size={10} />
                                              Ausstehend
                                            </span>
                                          ) : batch.status === 'PROCESSING' ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                              <FiRefreshCw className="mr-1 animate-spin" size={10} />
                                              In Bearbeitung
                                            </span>
                                          ) : batch.status === 'COMPLETED' ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                              <FiCheck className="mr-1" size={10} />
                                              Abgeschlossen
                                            </span>
                                          ) : (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                              <FiX className="mr-1" size={10} />
                                              Fehlgeschlagen
                                            </span>
                                          )}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                          {batch.recipient_count}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                          <div className="flex items-center">
                                            <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                                              <div 
                                                className={`h-2.5 rounded-full ${batch.status === 'FAILED' ? 'bg-red-500' : 'bg-green-500'}`} 
                                                style={{ width: `${progress}%` }}
                                              ></div>
                                            </div>
                                            <span>{progress}%</span>
                                          </div>
                                          <div className="text-xs mt-1">
                                            Gesendet: {batch.sent_count} | Fehler: {batch.failed_count}
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                              
                              {/* Batch pagination */}
                              {batchPagination.totalPages > 1 && (
                                <div className="px-4 py-2 flex justify-center border-t border-gray-200">
                                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                    <button
                                      onClick={() => handleBatchPageChange(batchPagination.page - 1)}
                                      disabled={batchPagination.page === 1}
                                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${batchPagination.page === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                      <span className="sr-only">Zurück</span>
                                      <FiChevronLeft className="h-5 w-5" />
                                    </button>
                                    
                                    {Array.from({ length: Math.min(3, batchPagination.totalPages) }, (_, i) => {
                                      let pageNum;
                                      if (batchPagination.totalPages <= 3) {
                                        pageNum = i + 1;
                                      } else if (batchPagination.page <= 2) {
                                        pageNum = i + 1;
                                      } else if (batchPagination.page >= batchPagination.totalPages - 1) {
                                        pageNum = batchPagination.totalPages - 2 + i;
                                      } else {
                                        pageNum = batchPagination.page - 1 + i;
                                      }
                                      
                                      return (
                                        <button
                                          key={pageNum}
                                          onClick={() => handleBatchPageChange(pageNum)}
                                          className={`relative inline-flex items-center px-3 py-2 border text-sm font-medium ${batchPagination.page === pageNum ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}
                                        >
                                          {pageNum}
                                        </button>
                                      );
                                    })}
                                    
                                    <button
                                      onClick={() => handleBatchPageChange(batchPagination.page + 1)}
                                      disabled={batchPagination.page === batchPagination.totalPages}
                                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${batchPagination.page === batchPagination.totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                      <span className="sr-only">Weiter</span>
                                      <FiChevronRightIcon className="h-5 w-5" />
                                    </button>
                                  </nav>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div>
                        <h4 className="text-md font-medium text-gray-900 mb-2">Empfänger</h4>
                        {loadingRecipients ? (
                          <div className="p-6 flex justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
                          </div>
                        ) : recipients.length === 0 ? (
                          <div className="p-4 text-center text-gray-500 border rounded-md">
                            Keine Empfänger gefunden
                          </div>
                        ) : (
                          <div className="border rounded-md overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    E-Mail
                                  </th>
                                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                  </th>
                                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Gesendet am
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200 max-h-64 overflow-y-auto">
                                {recipients.map((recipient) => (
                                  <tr key={recipient.id}>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                      {recipient.recipient_email}
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap">
                                      {recipient.status === 'sent' ? (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                          <FiCheck className="mr-1" size={10} />
                                          Gesendet
                                        </span>
                                      ) : recipient.status === 'opened' ? (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                          <FiEye className="mr-1" size={10} />
                                          Geöffnet
                                        </span>
                                      ) : recipient.status === 'failed' ? (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                          <FiX className="mr-1" size={10} />
                                          Fehlgeschlagen
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                          <FiClock className="mr-1" size={10} />
                                          Ausstehend
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                      {formatDate(recipient.sent_at)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 flex flex-col items-center justify-center h-full min-h-[400px]">
                    <FiMail size={48} className="text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-500">Wählen Sie eine Kampagne aus</h3>
                    <p className="text-sm text-gray-400 mt-2 text-center">
                      Klicken Sie auf eine Kampagne in der Liste, um Details anzuzeigen
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}

export default EmailHistoryPage;

export const getServerSideProps = withAuth(
  ['admin', 'ADMIN'],
  async (context, user) => {
    return {
      props: {}
    };
  }
);
