import { useEffect, useState } from 'react';
import { FiDollarSign, FiTrendingUp, FiCreditCard, FiBarChart2 } from 'react-icons/fi';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartData
} from 'chart.js';

// Chart.js Komponenten registrieren
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface FinancialStatistics {
  totalRevenue: number;
  revenueToday: number;
  revenueThisWeek: number;
  revenueThisMonth: number;
  revenueTrend: Array<{
    date: string;
    amount: number;
  }>;
  paymentsByStatus: {
    [key: string]: number;
  };
  topRestaurants: Array<{
    id: string;
    name: string;
    revenue: number;
  }>;
  pendingPayments: number;
  completedPayments: number;
  averageOrderValue: number;
}

export default function FinancialStatistics() {
  const [statistics, setStatistics] = useState<FinancialStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/financial-statistics');
        
        if (!response.ok) {
          throw new Error('Fehler beim Laden der Finanzstatistiken');
        }
        
        const data = await response.json();
        setStatistics(data);
      } catch (err) {
        console.error('Fehler beim Laden der Finanzstatistiken:', err);
        setError('Die Finanzstatistiken konnten nicht geladen werden.');
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  // Chart-Daten für Umsatztrend
  const revenueChartData: ChartData<'line'> = {
    labels: statistics?.revenueTrend.map(item => item.date) || [],
    datasets: [
      {
        label: 'Tagesumsatz (€)',
        data: statistics?.revenueTrend.map(item => item.amount) || [],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        tension: 0.3,
      }
    ]
  };

  const revenueChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Umsatztrend (letzte 30 Tage)'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return value + ' €';
          }
        }
      }
    }
  };

  // Chart-Daten für Top Restaurants
  const restaurantChartData: ChartData<'bar'> = {
    labels: statistics?.topRestaurants.map(item => item.name) || [],
    datasets: [
      {
        label: 'Umsatz (€)',
        data: statistics?.topRestaurants.map(item => item.revenue) || [],
        backgroundColor: 'rgba(79, 70, 229, 0.6)',
      }
    ]
  };

  const restaurantChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Top Restaurants nach Umsatz'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return value + ' €';
          }
        }
      }
    }
  };

  // Formatiere Währungsbeträge
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Finanzübersicht</h2>
      
      {/* Übersichtskarten */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                <FiDollarSign className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Gesamtumsatz</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {statistics ? formatCurrency(statistics.totalRevenue) : '0 €'}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                <FiTrendingUp className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Umsatz (Monat)</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {statistics ? formatCurrency(statistics.revenueThisMonth) : '0 €'}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                <FiCreditCard className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Durchschnittlicher Bestellwert</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {statistics ? formatCurrency(statistics.averageOrderValue) : '0 €'}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                <FiBarChart2 className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Ausstehende Zahlungen</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {statistics?.pendingPayments || 0}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Umsatztrend-Chart */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Umsatztrend</h3>
        <div className="h-80">
          <Line options={revenueChartOptions} data={revenueChartData} />
        </div>
      </div>

      {/* Top Restaurants Chart */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Top Restaurants</h3>
        <div className="h-80">
          <Bar options={restaurantChartOptions} data={restaurantChartData} />
        </div>
      </div>

      {/* Zahlungsstatus */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Zahlungsstatus</h3>
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Betrag
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {statistics && Object.entries(statistics.paymentsByStatus).map(([status, amount]) => (
                <tr key={status}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {status === 'COMPLETED' ? 'Abgeschlossen' : 
                     status === 'PENDING' ? 'Ausstehend' : 
                     status === 'FAILED' ? 'Fehlgeschlagen' : 
                     status}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
