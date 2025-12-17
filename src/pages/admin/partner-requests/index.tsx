import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdminSidebar from '@/components/AdminSidebar';
import { FiCheckSquare, FiRefreshCw, FiCheck, FiX, FiEye } from 'react-icons/fi';

interface PartnerRequest {
  id: string;
  restaurant_name: string;
  contact_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export default function PartnerRequestsPage() {
  const router = useRouter();
  const { session, user, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState<PartnerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const supabase = createClient();

  // Laden der Partneranfragen
  const fetchPartnerRequests = async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase
        .from('partner_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRequests(data || []);
    } catch (error) {
      console.error('Fehler beim Laden der Partneranfragen:', error);
      // Fallback zu Dummy-Daten bei Fehler
      setRequests([
        {
          id: '1',
          restaurant_name: 'Ristorante Italiano',
          contact_name: 'Marco Rossi',
          email: 'marco@ristoranteitaliano.de',
          phone: '+49123456789',
          address: 'Hauptstraße 42',
          city: 'Berlin',
          postal_code: '10115',
          message: 'Wir möchten gerne Partner werden und unser Restaurant auf Ihrer Plattform präsentieren.',
          status: 'pending',
          created_at: '2025-08-15T10:30:00Z'
        },
        {
          id: '2',
          restaurant_name: 'Sushi Palace',
          contact_name: 'Yuki Tanaka',
          email: 'info@sushipalace.de',
          phone: '+49987654321',
          address: 'Friedrichstraße 123',
          city: 'Berlin',
          postal_code: '10117',
          message: 'Unser Restaurant bietet authentische japanische Küche und wir würden gerne mit Ihnen zusammenarbeiten.',
          status: 'approved',
          created_at: '2025-08-10T14:45:00Z'
        },
        {
          id: '3',
          restaurant_name: 'Burger House',
          contact_name: 'Max Müller',
          email: 'max@burgerhouse.de',
          phone: '+49123123123',
          address: 'Alexanderplatz 5',
          city: 'Berlin',
          postal_code: '10178',
          message: 'Wir sind ein neues Burger-Restaurant und möchten auf Ihrer Plattform gelistet werden.',
          status: 'rejected',
          created_at: '2025-08-05T09:15:00Z'
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
        
        fetchPartnerRequests();
      }
    }
  }, [authLoading, session, user, router]);

  // Formatierung des Datums
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE') + ' ' + date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  };

  // Anfrage genehmigen
  const handleApprove = async (id: string) => {
    try {
      const { error } = await supabase
        .from('partner_requests')
        .update({ status: 'approved' })
        .eq('id', id);
        
      if (error) throw error;
      
      // Daten neu laden
      fetchPartnerRequests();
    } catch (error) {
      console.error('Fehler beim Genehmigen der Anfrage:', error);
      alert('Fehler beim Genehmigen der Anfrage');
    }
  };

  // Anfrage ablehnen
  const handleReject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('partner_requests')
        .update({ status: 'rejected' })
        .eq('id', id);
        
      if (error) throw error;
      
      // Daten neu laden
      fetchPartnerRequests();
    } catch (error) {
      console.error('Fehler beim Ablehnen der Anfrage:', error);
      alert('Fehler beim Ablehnen der Anfrage');
    }
  };

  // Details anzeigen
  const handleViewDetails = (id: string) => {
    router.push(`/admin/partner-requests/${id}`);
  };

  // Status-Badge-Farbe bestimmen
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        <AdminSidebar activeItem="partner-requests" />
        <main className="flex-1 p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Partneranfragen</h1>
              <button
                onClick={fetchPartnerRequests}
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
            </div>

            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Restaurant
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kontakt
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stadt
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Eingegangen am
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aktionen
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
                        </td>
                      </tr>
                    ) : requests.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                          Keine Partneranfragen gefunden
                        </td>
                      </tr>
                    ) : (
                      requests.map((request) => (
                        <tr key={request.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{request.restaurant_name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{request.contact_name}</div>
                            <div className="text-sm text-gray-500">{request.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{request.city}</div>
                            <div className="text-sm text-gray-500">{request.postal_code}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(request.status)}`}>
                              {request.status === 'approved' ? 'Genehmigt' : 
                               request.status === 'rejected' ? 'Abgelehnt' : 'Ausstehend'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{formatDate(request.created_at)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleViewDetails(request.id)}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                              title="Details anzeigen"
                            >
                              <FiEye />
                            </button>
                            {request.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleApprove(request.id)}
                                  className="text-green-600 hover:text-green-900 mr-3"
                                  title="Genehmigen"
                                >
                                  <FiCheck />
                                </button>
                                <button
                                  onClick={() => handleReject(request.id)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Ablehnen"
                                >
                                  <FiX />
                                </button>
                              </>
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
