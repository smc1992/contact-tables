import { useEffect, useState } from 'react';
import { FiGrid, FiCheckCircle, FiXCircle, FiPercent, FiClock } from 'react-icons/fi';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
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
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface ContactTableStatistics {
  totalTables: number;
  activeTables: number;
  totalReservations: number;
  completedReservations: number;
  cancelledReservations: number;
  averageSuccessRate: number;
  tablesByPopularity: Array<{
    id: string;
    name: string;
    restaurantName: string;
    reservationCount: number;
    successRate: number;
  }>;
  reservationsByDay: {
    [key: string]: number;
  };
  reservationsByHour: {
    [key: string]: number;
  };
  reservationTrend: Array<{
    date: string;
    count: number;
  }>;
}

export default function ContactTableStatistics() {
  const [statistics, setStatistics] = useState<ContactTableStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/contact-tables/statistics');
        
        if (!response.ok) {
          throw new Error('Fehler beim Laden der Kontakttisch-Statistiken');
        }
        
        const data = await response.json();
        setStatistics(data);
      } catch (err) {
        console.error('Fehler beim Laden der Kontakttisch-Statistiken:', err);
        setError('Die Kontakttisch-Statistiken konnten nicht geladen werden.');
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  // Chart-Daten für Reservierungstrend
  const trendChartData: ChartData<'line'> = {
    labels: statistics?.reservationTrend.map(item => item.date) || [],
    datasets: [
      {
        label: 'Reservierungen',
        data: statistics?.reservationTrend.map(item => item.count) || [],
        borderColor: 'rgb(79, 70, 229)',
        backgroundColor: 'rgba(79, 70, 229, 0.5)',
        tension: 0.3,
      }
    ]
  };

  const trendChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Reservierungstrend (letzte 30 Tage)'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    }
  };

  // Chart-Daten für Reservierungen nach Wochentag
  const dayChartData: ChartData<'bar'> = {
    labels: statistics ? Object.keys(statistics.reservationsByDay) : [],
    datasets: [
      {
        label: 'Reservierungen',
        data: statistics ? Object.values(statistics.reservationsByDay) : [],
        backgroundColor: 'rgba(34, 197, 94, 0.6)',
      }
    ]
  };

  const dayChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Reservierungen nach Wochentag'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    }
  };

  // Chart-Daten für Reservierungen nach Stunde
  const hourChartData: ChartData<'bar'> = {
    labels: statistics ? Object.keys(statistics.reservationsByHour).sort((a, b) => {
      return parseInt(a) - parseInt(b);
    }) : [],
    datasets: [
      {
        label: 'Reservierungen',
        data: statistics ? 
          Object.keys(statistics.reservationsByHour)
            .sort((a, b) => parseInt(a) - parseInt(b))
            .map(hour => statistics.reservationsByHour[hour]) : 
          [],
        backgroundColor: 'rgba(99, 102, 241, 0.6)',
      }
    ]
  };

  const hourChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Reservierungen nach Uhrzeit'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    }
  };

  // Chart-Daten für Reservierungsstatus
  const statusChartData: ChartData<'doughnut'> = {
    labels: ['Abgeschlossen', 'Storniert', 'Andere'],
    datasets: [
      {
        data: statistics ? [
          statistics.completedReservations,
          statistics.cancelledReservations,
          statistics.totalReservations - statistics.completedReservations - statistics.cancelledReservations
        ] : [0, 0, 0],
        backgroundColor: [
          'rgba(34, 197, 94, 0.6)',
          'rgba(239, 68, 68, 0.6)',
          'rgba(234, 179, 8, 0.6)'
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(234, 179, 8, 1)'
        ],
        borderWidth: 1,
      }
    ]
  };

  const statusChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Reservierungsstatus'
      }
    }
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
      <h2 className="text-2xl font-bold text-gray-900">Kontakttisch-Analysen</h2>
      
      {/* Übersichtskarten */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                <FiGrid className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Kontakttische</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {statistics?.totalTables || 0}
                    </div>
                    <div className="ml-2 text-sm text-gray-500">
                      ({statistics?.activeTables || 0} aktiv)
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
                <FiClock className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Reservierungen</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {statistics?.totalReservations || 0}
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
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                <FiCheckCircle className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Abgeschlossen</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {statistics?.completedReservations || 0}
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
              <div className="flex-shrink-0 bg-red-500 rounded-md p-3">
                <FiXCircle className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Storniert</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {statistics?.cancelledReservations || 0}
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
                <FiPercent className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Erfolgsrate</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {statistics ? `${statistics.averageSuccessRate.toFixed(1)}%` : '0%'}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Reservierungstrend</h3>
          <div className="h-80">
            <Line options={trendChartOptions} data={trendChartData} />
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Reservierungsstatus</h3>
          <div className="h-80">
            <Doughnut options={statusChartOptions} data={statusChartData} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Reservierungen nach Wochentag</h3>
          <div className="h-80">
            <Bar options={dayChartOptions} data={dayChartData} />
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Reservierungen nach Uhrzeit</h3>
          <div className="h-80">
            <Bar options={hourChartOptions} data={hourChartData} />
          </div>
        </div>
      </div>

      {/* Beliebteste Kontakttische */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Beliebteste Kontakttische</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Restaurant
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reservierungen
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Erfolgsrate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {statistics?.tablesByPopularity.map((table) => (
                <tr key={table.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {table.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {table.restaurantName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {table.reservationCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <span className={`mr-2 ${
                        table.successRate >= 70 ? 'text-green-600' : 
                        table.successRate >= 40 ? 'text-yellow-600' : 
                        'text-red-600'
                      }`}>
                        {table.successRate}%
                      </span>
                      <div className="w-24 bg-gray-200 rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full ${
                            table.successRate >= 70 ? 'bg-green-600' : 
                            table.successRate >= 40 ? 'bg-yellow-500' : 
                            'bg-red-600'
                          }`}
                          style={{ width: `${table.successRate}%` }}
                        ></div>
                      </div>
                    </div>
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
