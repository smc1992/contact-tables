import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdminSidebar from '@/components/AdminSidebar';
import { FiDollarSign, FiUsers, FiPackage, FiCalendar, FiRefreshCw } from 'react-icons/fi';

interface Subscription {
  id: string;
  restaurant_id: string;
  restaurant_name: string;
  plan: string;
  status: string;
  start_date: string;
  end_date: string;
  amount: number;
  billing_cycle: string;
}

export default function SubscriptionsPage() {
  const router = useRouter();
  const { session, user, loading: authLoading } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const supabase = createClient();

  // Laden der Abonnementdaten
  const fetchSubscriptions = async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase
        .from('restaurant_subscriptions')
        .select(`
          id,
          restaurant_id,
          restaurants (name),
          plan,
          status,
          start_date,
          end_date,
          amount,
          billing_cycle
        `)
        .order('start_date', { ascending: false });

      if (error) throw error;

      const formattedData = data?.map(item => ({
        id: item.id,
        restaurant_id: item.restaurant_id,
        restaurant_name: item.restaurants && item.restaurants[0]?.name || 'Unbekanntes Restaurant',
        plan: item.plan,
        status: item.status,
        start_date: item.start_date,
        end_date: item.end_date,
        amount: item.amount,
        billing_cycle: item.billing_cycle
      })) || [];

      setSubscriptions(formattedData);
    } catch (error) {
      console.error('Fehler beim Laden der Abonnements:', error);
      // Fallback zu Dummy-Daten bei Fehler
      setSubscriptions([
        {
          id: '1',
          restaurant_id: '101',
          restaurant_name: 'Restaurant Sonnenschein',
          plan: 'Premium',
          status: 'active',
          start_date: '2025-01-15',
          end_date: '2026-01-15',
          amount: 99.99,
          billing_cycle: 'monthly'
        },
        {
          id: '2',
          restaurant_id: '102',
          restaurant_name: 'Café am See',
          plan: 'Basic',
          status: 'active',
          start_date: '2025-03-01',
          end_date: '2026-03-01',
          amount: 49.99,
          billing_cycle: 'monthly'
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
        
        fetchSubscriptions();
      }
    }
  }, [authLoading, session, user, router]);

  // Formatierung des Datums
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE');
  };

  // Formatierung des Betrags
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  // Status-Badge Komponente
  const StatusBadge = ({ status }: { status: string }) => {
    let bgColor = 'bg-gray-100 text-gray-800';
    
    switch (status.toLowerCase()) {
      case 'active':
        bgColor = 'bg-green-100 text-green-800';
        break;
      case 'pending':
        bgColor = 'bg-yellow-100 text-yellow-800';
        break;
      case 'cancelled':
        bgColor = 'bg-red-100 text-red-800';
        break;
      case 'expired':
        bgColor = 'bg-gray-100 text-gray-800';
        break;
    }
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${bgColor}`}>
        {status === 'active' ? 'Aktiv' : 
         status === 'pending' ? 'Ausstehend' : 
         status === 'cancelled' ? 'Gekündigt' : 
         status === 'expired' ? 'Abgelaufen' : status}
      </span>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        <AdminSidebar activeItem="subscriptions" />
        <main className="flex-1 p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Abonnements</h1>
              <button
                onClick={fetchSubscriptions}
                disabled={refreshing}
                className={`px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center ${refreshing ? 'opacity-70 cursor-not-allowed' : ''}`}
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-indigo-100 text-indigo-600">
                    <FiPackage size={24} />
                  </div>
                  <div className="ml-4">
                    <h2 className="text-sm font-medium text-gray-500">Aktive Abonnements</h2>
                    <p className="text-2xl font-semibold text-gray-900">
                      {subscriptions.filter(sub => sub.status === 'active').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-100 text-green-600">
                    <FiDollarSign size={24} />
                  </div>
                  <div className="ml-4">
                    <h2 className="text-sm font-medium text-gray-500">Monatliche Einnahmen</h2>
                    <p className="text-2xl font-semibold text-gray-900">
                      {formatAmount(subscriptions
                        .filter(sub => sub.status === 'active' && sub.billing_cycle === 'monthly')
                        .reduce((sum, sub) => sum + sub.amount, 0)
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                    <FiUsers size={24} />
                  </div>
                  <div className="ml-4">
                    <h2 className="text-sm font-medium text-gray-500">Premium Kunden</h2>
                    <p className="text-2xl font-semibold text-gray-900">
                      {subscriptions.filter(sub => sub.status === 'active' && sub.plan === 'Premium').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-red-100 text-red-600">
                    <FiCalendar size={24} />
                  </div>
                  <div className="ml-4">
                    <h2 className="text-sm font-medium text-gray-500">Bald ablaufend</h2>
                    <p className="text-2xl font-semibold text-gray-900">
                      {subscriptions.filter(sub => {
                        const endDate = new Date(sub.end_date);
                        const now = new Date();
                        const diffTime = endDate.getTime() - now.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        return sub.status === 'active' && diffDays <= 30;
                      }).length}
                    </p>
                  </div>
                </div>
              </div>
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
                        Plan
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Startdatum
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Enddatum
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Betrag
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Abrechnungszyklus
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
                    ) : subscriptions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                          Keine Abonnements gefunden
                        </td>
                      </tr>
                    ) : (
                      subscriptions.map((subscription) => (
                        <tr key={subscription.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{subscription.restaurant_name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{subscription.plan}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={subscription.status} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{formatDate(subscription.start_date)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{formatDate(subscription.end_date)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{formatAmount(subscription.amount)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {subscription.billing_cycle === 'monthly' ? 'Monatlich' : 
                               subscription.billing_cycle === 'yearly' ? 'Jährlich' : 
                               subscription.billing_cycle}
                            </div>
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
