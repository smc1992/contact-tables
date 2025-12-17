import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdminSidebar from '@/components/AdminSidebar';
import { FiBarChart2, FiRefreshCw, FiDownload, FiCalendar, FiFilter } from 'react-icons/fi';
import { Line, Bar } from 'react-chartjs-2';
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
  ChartOptions
} from 'chart.js';

// Chart.js Registrierung
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

interface AnalyticsData {
  totalTables: number;
  activeRestaurants: number;
  totalBookings: number;
  averageRating: number;
  dailyStats: {
    date: string;
    bookings: number;
    views: number;
  }[];
  restaurantStats: {
    name: string;
    tables: number;
    bookings: number;
  }[];
  cityStats: {
    city: string;
    tables: number;
    bookings: number;
  }[];
}

export default function ContactTablesAnalyticsPage() {
  const router = useRouter();
  const { session, user, loading: authLoading } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('7d'); // 7d, 30d, 90d, 1y
  const supabase = createClient();

  // Laden der Analysedaten
  const fetchAnalyticsData = async () => {
    setRefreshing(true);
    try {
      // In einer echten Anwendung würden hier mehrere Abfragen an die Datenbank gesendet
      // um die verschiedenen Statistiken zu erhalten
      
      // Beispiel für eine Abfrage:
      // const { data: tablesData, error: tablesError } = await supabase
      //   .from('contact_tables')
      //   .select('count')
      //   .single();
      
      // Für dieses Beispiel verwenden wir Dummy-Daten
      const dummyData: AnalyticsData = {
        totalTables: 248,
        activeRestaurants: 42,
        totalBookings: 1856,
        averageRating: 4.3,
        dailyStats: generateDailyStats(timeRange),
        restaurantStats: [
          { name: 'Ristorante Italiano', tables: 12, bookings: 156 },
          { name: 'Sushi Palace', tables: 8, bookings: 124 },
          { name: 'Burger House', tables: 10, bookings: 98 },
          { name: 'Café Central', tables: 15, bookings: 187 },
          { name: 'Tapas Bar', tables: 6, bookings: 76 }
        ],
        cityStats: [
          { city: 'Berlin', tables: 85, bookings: 720 },
          { city: 'Hamburg', tables: 42, bookings: 356 },
          { city: 'München', tables: 38, bookings: 312 },
          { city: 'Köln', tables: 25, bookings: 198 },
          { city: 'Frankfurt', tables: 18, bookings: 145 }
        ]
      };

      setAnalyticsData(dummyData);
    } catch (error) {
      console.error('Fehler beim Laden der Analysedaten:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Generiert Dummy-Daten für die täglichen Statistiken basierend auf dem Zeitraum
  function generateDailyStats(range: string) {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365;
    const stats = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Zufällige Werte generieren, die mit der Zeit leicht ansteigen
      const factor = 1 + (days - i) / days; // Steigungsfaktor
      const baseBookings = Math.floor(Math.random() * 10) + 5;
      const baseViews = Math.floor(Math.random() * 50) + 20;
      
      stats.push({
        date: date.toISOString().split('T')[0],
        bookings: Math.floor(baseBookings * factor),
        views: Math.floor(baseViews * factor)
      });
    }
    
    return stats;
  }

  useEffect(() => {
    if (!authLoading) {
      if (!session) {
        router.push('/auth/login');
      } else if (session && user) {
        if (user.user_metadata.role !== 'admin' && user.user_metadata.role !== 'ADMIN') {
          router.push('/');
          return;
        }
        
        fetchAnalyticsData();
      }
    }
  }, [authLoading, session, user, router]);

  // Aktualisiert die Daten, wenn sich der Zeitraum ändert
  useEffect(() => {
    if (session && user) {
      fetchAnalyticsData();
    }
  }, [timeRange]);

  // Konfiguration für das Buchungs-Liniendiagramm
  const bookingsChartData = {
    labels: analyticsData?.dailyStats.map(stat => stat.date) || [],
    datasets: [
      {
        label: 'Buchungen',
        data: analyticsData?.dailyStats.map(stat => stat.bookings) || [],
        borderColor: 'rgb(79, 70, 229)',
        backgroundColor: 'rgba(79, 70, 229, 0.5)',
        tension: 0.3
      },
      {
        label: 'Aufrufe',
        data: analyticsData?.dailyStats.map(stat => stat.views) || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.3
      }
    ]
  };

  // Konfiguration für das Restaurant-Balkendiagramm
  const restaurantChartData = {
    labels: analyticsData?.restaurantStats.map(stat => stat.name) || [],
    datasets: [
      {
        label: 'Tische',
        data: analyticsData?.restaurantStats.map(stat => stat.tables) || [],
        backgroundColor: 'rgba(79, 70, 229, 0.7)'
      },
      {
        label: 'Buchungen',
        data: analyticsData?.restaurantStats.map(stat => stat.bookings) || [],
        backgroundColor: 'rgba(59, 130, 246, 0.7)'
      }
    ]
  };

  // Konfiguration für das Stadt-Balkendiagramm
  const cityChartData = {
    labels: analyticsData?.cityStats.map(stat => stat.city) || [],
    datasets: [
      {
        label: 'Tische',
        data: analyticsData?.cityStats.map(stat => stat.tables) || [],
        backgroundColor: 'rgba(79, 70, 229, 0.7)'
      },
      {
        label: 'Buchungen',
        data: analyticsData?.cityStats.map(stat => stat.bookings) || [],
        backgroundColor: 'rgba(59, 130, 246, 0.7)'
      }
    ]
  };

  // Gemeinsame Chart-Optionen
  const chartOptions: ChartOptions<'line' | 'bar'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  // CSV-Export-Funktion
  const exportCSV = () => {
    if (!analyticsData) return;
    
    // Header für die CSV-Datei
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Datum,Buchungen,Aufrufe\n";
    
    // Daten hinzufügen
    analyticsData.dailyStats.forEach(stat => {
      csvContent += `${stat.date},${stat.bookings},${stat.views}\n`;
    });
    
    // CSV-Datei herunterladen
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `kontakttisch-statistik-${timeRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        <AdminSidebar activeItem="contact-tables-analytics" />
        <main className="flex-1 p-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Kontakttisch-Analysen</h1>
              <div className="flex space-x-3">
                <div className="relative">
                  <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-3 pr-10 text-sm leading-5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="7d">Letzte 7 Tage</option>
                    <option value="30d">Letzte 30 Tage</option>
                    <option value="90d">Letzte 90 Tage</option>
                    <option value="1y">Letztes Jahr</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <FiCalendar className="h-4 w-4" />
                  </div>
                </div>
                <button
                  onClick={fetchAnalyticsData}
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
                  onClick={exportCSV}
                  disabled={!analyticsData}
                  className={`px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center ${!analyticsData ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  <FiDownload className="mr-2" />
                  CSV exportieren
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : analyticsData ? (
              <>
                {/* Übersichtskarten */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center">
                      <div className="p-3 rounded-full bg-indigo-100 text-indigo-600">
                        <FiBarChart2 className="h-6 w-6" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Kontakttische gesamt</p>
                        <p className="text-2xl font-semibold text-gray-900">{analyticsData.totalTables}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center">
                      <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                        <FiBarChart2 className="h-6 w-6" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Aktive Restaurants</p>
                        <p className="text-2xl font-semibold text-gray-900">{analyticsData.activeRestaurants}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center">
                      <div className="p-3 rounded-full bg-green-100 text-green-600">
                        <FiBarChart2 className="h-6 w-6" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Buchungen gesamt</p>
                        <p className="text-2xl font-semibold text-gray-900">{analyticsData.totalBookings}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center">
                      <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                        <FiBarChart2 className="h-6 w-6" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Durchschnittliche Bewertung</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {analyticsData.averageRating.toFixed(1)}
                          <span className="text-yellow-500 ml-1">{'★'.repeat(Math.round(analyticsData.averageRating))}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Buchungen und Aufrufe Diagramm */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Buchungen und Aufrufe im Zeitverlauf</h2>
                  <div className="h-80">
                    <Line data={bookingsChartData} options={chartOptions} />
                  </div>
                </div>

                {/* Restaurant- und Stadt-Statistiken */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Restaurants</h2>
                    <div className="h-80">
                      <Bar data={restaurantChartData} options={chartOptions} />
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Städte-Vergleich</h2>
                    <div className="h-80">
                      <Bar data={cityChartData} options={chartOptions} />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
                <p className="text-gray-500">Keine Daten verfügbar</p>
              </div>
            )}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
