import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdminSidebar from '@/components/AdminSidebar';
import { FiMail, FiPlus, FiEdit2, FiTrash2, FiRefreshCw, FiSend } from 'react-icons/fi';

interface Newsletter {
  id: string;
  subject: string;
  content: string;
  sent_at: string | null;
  recipient_count: number;
  open_count: number;
  click_count: number;
  created_at: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
}

export default function NewslettersPage() {
  const router = useRouter();
  const { session, user, loading: authLoading } = useAuth();
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const supabase = createClient();

  // Laden der Newsletter-Daten
  const fetchNewsletters = async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase
        .from('newsletters')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setNewsletters(data || []);
    } catch (error) {
      console.error('Fehler beim Laden der Newsletter:', error);
      // Fallback zu Dummy-Daten bei Fehler
      setNewsletters([
        {
          id: '1',
          subject: 'Neue Restaurants in Ihrer Nähe',
          content: 'Entdecken Sie die neuesten kulinarischen Highlights in Ihrer Stadt.',
          sent_at: '2025-07-15T12:00:00Z',
          recipient_count: 1250,
          open_count: 780,
          click_count: 320,
          created_at: '2025-07-14T10:00:00Z',
          status: 'sent'
        },
        {
          id: '2',
          subject: 'Sommer-Spezial: Die besten Terrassen',
          content: 'Genießen Sie den Sommer in den schönsten Restaurant-Terrassen.',
          sent_at: null,
          recipient_count: 0,
          open_count: 0,
          click_count: 0,
          created_at: '2025-07-20T09:30:00Z',
          status: 'draft'
        },
        {
          id: '3',
          subject: 'Exklusive Rabatte für Premium-Mitglieder',
          content: 'Als Premium-Mitglied profitieren Sie von exklusiven Angeboten.',
          sent_at: null,
          recipient_count: 0,
          open_count: 0,
          click_count: 0,
          created_at: '2025-07-18T14:45:00Z',
          status: 'scheduled'
        }
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!session) {
        router.push('/auth/login');
      } else if (session && user) {
        if (user.user_metadata.role !== 'admin' && user.user_metadata.role !== 'ADMIN') {
          router.push('/');
          return;
        }
        
        fetchNewsletters();
      }
    }
  }, [authLoading, session, user, router]);

  // Formatierung des Datums
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE') + ' ' + date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  };

  // Neuen Newsletter erstellen
  const handleCreateNewsletter = () => {
    router.push('/admin/newsletters/create');
  };

  // Newsletter bearbeiten
  const handleEditNewsletter = (id: string) => {
    router.push(`/admin/newsletters/edit/${id}`);
  };

  // Newsletter löschen
  const handleDeleteNewsletter = async (id: string) => {
    if (!confirm('Möchten Sie diesen Newsletter wirklich löschen?')) return;
    
    try {
      const { error } = await supabase
        .from('newsletters')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Daten neu laden
      fetchNewsletters();
    } catch (error) {
      console.error('Fehler beim Löschen des Newsletters:', error);
      alert('Fehler beim Löschen des Newsletters');
    }
  };

  // Newsletter senden
  const handleSendNewsletter = async (id: string) => {
    if (!confirm('Möchten Sie diesen Newsletter jetzt senden?')) return;
    
    try {
      setRefreshing(true);
      const resp = await fetch('/api/admin/newsletters/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      const result = await resp.json();

      if (!resp.ok || !result.ok) {
        const msg = result?.message || 'Fehler beim Senden des Newsletters';
        alert(msg);
      } else {
        const { totalRecipients, sent, failed } = result;
        alert(`Newsletter-Versand abgeschlossen. Empfänger: ${totalRecipients ?? '-'}, Erfolgreich: ${sent ?? '-'}, Fehlgeschlagen: ${failed ?? '-'}`);
      }

      await fetchNewsletters();
    } catch (error) {
      console.error('Fehler beim Senden des Newsletters:', error);
      alert('Fehler beim Senden des Newsletters');
    }
    finally {
      setRefreshing(false);
    }
  };

  // Test-E-Mail senden
  const handleSendTestEmail = async (id: string) => {
    const to = prompt('Bitte Test-E-Mail-Adresse eingeben:');
    if (!to) return;
    try {
      setRefreshing(true);
      const resp = await fetch('/api/admin/newsletters/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, to }),
      });
      const result = await resp.json();
      if (!resp.ok || !result.ok) {
        const msg = result?.message || 'Fehler beim Senden der Test-E-Mail';
        alert(msg);
      } else {
        alert('Test-E-Mail wurde gesendet.');
      }
    } catch (error) {
      console.error('Fehler beim Senden der Test-E-Mail:', error);
      alert('Fehler beim Senden der Test-E-Mail');
    } finally {
      setRefreshing(false);
    }
  };

  // Status-Badge-Farbe bestimmen
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'sending':
        return 'bg-yellow-100 text-yellow-800';
      case 'sent':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Kürzen des Textes
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        <AdminSidebar activeItem="newsletters" />
        <main className="flex-1 p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Newsletter</h1>
              <div className="flex space-x-3">
                <button
                  onClick={fetchNewsletters}
                  disabled={refreshing}
                  className={`px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center ${refreshing ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {refreshing ? (
                    <>
                      <FiRefreshCw className="animate-spin mr-2" />
                      Wird aktualisiert...
                    </>
                  ) : (
                    'Aktualisieren'
                  )}
                </button>
                <button
                  onClick={handleCreateNewsletter}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
                >
                  <FiPlus className="mr-2" />
                  Neuer Newsletter
                </button>
              </div>
            </div>

            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Betreff
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gesendet am
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Empfänger
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Öffnungen
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Klicks
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aktionen
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 text-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
                        </td>
                      </tr>
                    ) : newsletters.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                          Keine Newsletter gefunden
                        </td>
                      </tr>
                    ) : (
                      newsletters.map((newsletter) => (
                        <tr key={newsletter.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                <FiMail className="text-indigo-500" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{truncateText(newsletter.subject, 50)}</div>
                                <div className="text-xs text-gray-500">{truncateText(newsletter.content, 60)}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(newsletter.status)}`}>
                              {newsletter.status === 'draft' && 'Entwurf'}
                              {newsletter.status === 'scheduled' && 'Geplant'}
                              {newsletter.status === 'sending' && 'Wird gesendet'}
                              {newsletter.status === 'sent' && 'Gesendet'}
                              {newsletter.status === 'failed' && 'Fehlgeschlagen'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{formatDate(newsletter.sent_at)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{newsletter.recipient_count}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{newsletter.open_count}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{newsletter.click_count}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleSendTestEmail(newsletter.id)}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                              title="Test-E-Mail senden"
                            >
                              <FiMail />
                            </button>
                            {(newsletter.status === 'draft' || newsletter.status === 'scheduled') && (
                              <button
                                onClick={() => handleSendNewsletter(newsletter.id)}
                                className="text-green-600 hover:text-green-900 mr-3"
                                title="Senden"
                              >
                                <FiSend />
                              </button>
                            )}
                            {newsletter.status === 'draft' && (
                              <button
                                onClick={() => handleEditNewsletter(newsletter.id)}
                                className="text-indigo-600 hover:text-indigo-900 mr-3"
                                title="Bearbeiten"
                              >
                                <FiEdit2 />
                              </button>
                            )}
                            {(newsletter.status === 'draft' || newsletter.status === 'scheduled') && (
                              <button
                                onClick={() => handleDeleteNewsletter(newsletter.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Löschen"
                              >
                                <FiTrash2 />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
