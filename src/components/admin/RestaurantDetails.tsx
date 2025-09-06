import { useEffect, useState } from 'react';
import { FiStar, FiUsers, FiCalendar, FiPercent, FiCheck, FiX } from 'react-icons/fi';
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
  ChartData
} from 'chart.js';
import Image from 'next/image';

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

interface RestaurantDetailsProps {
  restaurantId: string;
}

interface RestaurantDetails {
  id: string;
  name: string;
  description: string;
  logo: string;
  coverImage: string;
  isActive: boolean;
  contractStatus: string;
  verificationStatus: string;
  createdAt: string;
  updatedAt: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  openingHours: Array<{
    day: string;
    openTime: string;
    closeTime: string;
  }>;
  contactTables: Array<{
    id: string;
    name: string;
    capacity: number;
    isActive: boolean;
    reservations: Array<{
      id: string;
      status: string;
      date: string;
    }>;
  }>;
  reviews: Array<{
    id: string;
    rating: number;
    comment: string;
    createdAt: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  }>;
  contract: {
    id: string;
    status: string;
    startDate: string;
    endDate: string;
    terms: string;
  };
  owner: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  statistics: {
    totalReservations: number;
    completedReservations: number;
    averageRating: number;
    successRate: number;
    monthlyReservations: Array<{
      month: string;
      count: number;
    }>;
  };
}

export default function RestaurantDetails({ restaurantId }: RestaurantDetailsProps) {
  const [restaurant, setRestaurant] = useState<RestaurantDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchRestaurantDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/restaurants/details?id=${restaurantId}`);
        
        if (!response.ok) {
          throw new Error('Fehler beim Laden der Restaurant-Details');
        }
        
        const data = await response.json();
        setRestaurant(data);
      } catch (err) {
        console.error('Fehler beim Laden der Restaurant-Details:', err);
        setError('Die Restaurant-Details konnten nicht geladen werden.');
      } finally {
        setLoading(false);
      }
    };

    if (restaurantId) {
      fetchRestaurantDetails();
    }
  }, [restaurantId]);

  // Chart-Daten für monatliche Reservierungen
  const reservationChartData: ChartData<'line'> = {
    labels: restaurant?.statistics.monthlyReservations.map(item => item.month) || [],
    datasets: [
      {
        label: 'Reservierungen',
        data: restaurant?.statistics.monthlyReservations.map(item => item.count) || [],
        borderColor: 'rgb(79, 70, 229)',
        backgroundColor: 'rgba(79, 70, 229, 0.5)',
        tension: 0.3,
      }
    ]
  };

  const reservationChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Monatliche Reservierungen'
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

  // Chart-Daten für Bewertungen
  const reviewChartData: ChartData<'bar'> = {
    labels: restaurant?.reviews ? ['1★', '2★', '3★', '4★', '5★'] : [],
    datasets: [
      {
        label: 'Anzahl der Bewertungen',
        data: restaurant?.reviews ? [
          restaurant.reviews.filter(r => r.rating === 1).length,
          restaurant.reviews.filter(r => r.rating === 2).length,
          restaurant.reviews.filter(r => r.rating === 3).length,
          restaurant.reviews.filter(r => r.rating === 4).length,
          restaurant.reviews.filter(r => r.rating === 5).length
        ] : [],
        backgroundColor: [
          'rgba(239, 68, 68, 0.6)',
          'rgba(249, 115, 22, 0.6)',
          'rgba(234, 179, 8, 0.6)',
          'rgba(34, 197, 94, 0.6)',
          'rgba(16, 185, 129, 0.6)'
        ],
      }
    ]
  };

  const reviewChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Bewertungsverteilung'
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

  if (!restaurant) {
    return (
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="text-gray-500">Kein Restaurant ausgewählt</div>
      </div>
    );
  }

  // Status-Badge Komponente
  const StatusBadge = ({ status }: { status: string }) => {
    let bgColor = 'bg-gray-100 text-gray-800';
    
    if (status === 'ACTIVE' || status === 'VERIFIED') {
      bgColor = 'bg-green-100 text-green-800';
    } else if (status === 'PENDING') {
      bgColor = 'bg-yellow-100 text-yellow-800';
    } else if (status === 'REJECTED' || status === 'INACTIVE') {
      bgColor = 'bg-red-100 text-red-800';
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor}`}>
        {status === 'ACTIVE' ? 'Aktiv' : 
         status === 'PENDING' ? 'Ausstehend' : 
         status === 'REJECTED' ? 'Abgelehnt' : 
         status === 'VERIFIED' ? 'Verifiziert' :
         status === 'INACTIVE' ? 'Inaktiv' :
         status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Restaurant-Header */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="relative h-48">
          {restaurant.coverImage ? (
            <Image 
              src={restaurant.coverImage} 
              alt={restaurant.name} 
              layout="fill" 
              objectFit="cover" 
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
          )}
          <div className="absolute inset-0 bg-black bg-opacity-30"></div>
          <div className="absolute bottom-0 left-0 p-6">
            <div className="flex items-center">
              <div className="h-16 w-16 rounded-full bg-white p-1 shadow-lg">
                {restaurant.logo ? (
                  <Image 
                    src={restaurant.logo} 
                    alt={`${restaurant.name} Logo`} 
                    width={64} 
                    height={64} 
                    className="rounded-full" 
                  />
                ) : (
                  <div className="h-full w-full rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-xl font-bold text-gray-500">
                      {restaurant.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              <div className="ml-4">
                <h2 className="text-2xl font-bold text-white">{restaurant.name}</h2>
                <div className="flex items-center mt-1">
                  <StatusBadge status={restaurant.isActive ? 'ACTIVE' : 'INACTIVE'} />
                  <span className="mx-2 text-white">•</span>
                  <StatusBadge status={restaurant.contractStatus} />
                  <span className="mx-2 text-white">•</span>
                  <StatusBadge status={restaurant.verificationStatus || 'PENDING'} />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-6 font-medium text-sm border-b-2 ${
                activeTab === 'overview'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Übersicht
            </button>
            <button
              onClick={() => setActiveTab('tables')}
              className={`py-4 px-6 font-medium text-sm border-b-2 ${
                activeTab === 'tables'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Kontakttische
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`py-4 px-6 font-medium text-sm border-b-2 ${
                activeTab === 'reviews'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Bewertungen
            </button>
            <button
              onClick={() => setActiveTab('contract')}
              className={`py-4 px-6 font-medium text-sm border-b-2 ${
                activeTab === 'contract'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Vertrag
            </button>
          </nav>
        </div>
        
        {/* Tab-Inhalte */}
        <div className="p-6">
          {/* Übersicht */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Statistik-Karten */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                        <FiUsers className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Reservierungen</dt>
                          <dd className="flex items-baseline">
                            <div className="text-2xl font-semibold text-gray-900">
                              {restaurant.statistics.totalReservations}
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                        <FiCheck className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Abgeschlossen</dt>
                          <dd className="flex items-baseline">
                            <div className="text-2xl font-semibold text-gray-900">
                              {restaurant.statistics.completedReservations}
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                        <FiStar className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Bewertung</dt>
                          <dd className="flex items-baseline">
                            <div className="text-2xl font-semibold text-gray-900">
                              {(() => {
                                const r = Number(restaurant.statistics.averageRating ?? 0);
                                return (isNaN(r) ? 0 : r).toFixed(1);
                              })()}
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
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
                              {(() => {
                                const s = Number(restaurant.statistics.successRate ?? 0);
                                const v = Math.max(0, Math.min(100, isNaN(s) ? 0 : s));
                                return `${v.toFixed(0)}%`;
                              })()}
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Restaurant-Informationen */}
              <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-4 py-5 sm:px-6 bg-gray-50">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Restaurant-Informationen</h3>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Beschreibung</dt>
                      <dd className="mt-1 text-sm text-gray-900">{restaurant.description || 'Keine Beschreibung verfügbar'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Adresse</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {restaurant.address?.street}<br />
                        {restaurant.address?.postalCode} {restaurant.address?.city}<br />
                        {restaurant.address?.country}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Inhaber</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {restaurant.owner?.firstName} {restaurant.owner?.lastName}<br />
                        {restaurant.owner?.email}<br />
                        {restaurant.owner?.phone}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Registriert am</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {new Date(restaurant.createdAt).toLocaleDateString('de-DE')}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Reservierungstrend</h3>
                  <div className="h-64">
                    <Line options={reservationChartOptions} data={reservationChartData} />
                  </div>
                </div>
                
                <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Bewertungsverteilung</h3>
                  <div className="h-64">
                    <Bar options={reviewChartOptions} data={reviewChartData} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Kontakttische */}
          {activeTab === 'tables' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Kontakttische</h3>
              
              {restaurant.contactTables.length === 0 ? (
                <p className="text-gray-500">Keine Kontakttische verfügbar</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Kapazität
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Reservierungen
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Auslastung
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {restaurant.contactTables.map((table) => (
                        <tr key={table.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {table.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {table.capacity} Personen
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {table.isActive ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Aktiv
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Inaktiv
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {table.reservations.length}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {table.reservations.length > 0 ? (
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div 
                                  className="bg-blue-600 h-2.5 rounded-full" 
                                  style={{ width: `${Math.min(100, (table.reservations.length / 10) * 100)}%` }}
                                ></div>
                              </div>
                            ) : (
                              'Keine Daten'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Bewertungen */}
          {activeTab === 'reviews' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Bewertungen</h3>
                <div className="flex items-center">
                  <FiStar className="text-yellow-400 mr-1" />
                  <span className="font-medium">{(() => {
                    const r = Number(restaurant.statistics.averageRating ?? 0);
                    return (isNaN(r) ? 0 : r).toFixed(1);
                  })()}</span>
                  <span className="text-gray-500 ml-1">({restaurant.reviews.length} Bewertungen)</span>
                </div>
              </div>
              
              {restaurant.reviews.length === 0 ? (
                <p className="text-gray-500">Keine Bewertungen verfügbar</p>
              ) : (
                <div className="space-y-4">
                  {restaurant.reviews.map((review) => (
                    <div key={review.id} className="bg-white shadow-sm rounded-lg border border-gray-200 p-4">
                      <div className="flex justify-between">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="font-medium text-gray-600">
                              {review.user.firstName.charAt(0)}{review.user.lastName.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{review.user.firstName} {review.user.lastName}</p>
                            <p className="text-sm text-gray-500">{new Date(review.createdAt).toLocaleDateString('de-DE')}</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          {(() => {
                            const val = Math.max(0, Math.min(5, Number(review.rating ?? 0)));
                            return [...Array(5)].map((_, i) => (
                              <FiStar
                                key={i}
                                className={i < val ? "text-yellow-400" : "text-gray-300"}
                              />
                            ));
                          })()}
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-gray-600">{review.comment}</p>
                      <div className="mt-3 flex justify-end space-x-2">
                        <button className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50">
                          Melden
                        </button>
                        <button className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700">
                          Löschen
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Vertrag */}
          {activeTab === 'contract' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Vertragsinformationen</h3>
              
              {!restaurant.contract ? (
                <p className="text-gray-500">Kein Vertrag verfügbar</p>
              ) : (
                <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-4 py-5 sm:px-6 bg-gray-50">
                    <div className="flex justify-between">
                      <h3 className="text-lg font-medium leading-6 text-gray-900">Vertrag #{restaurant.contract.id}</h3>
                      <StatusBadge status={restaurant.contract.status} />
                    </div>
                  </div>
                  <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Startdatum</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {new Date(restaurant.contract.startDate).toLocaleDateString('de-DE')}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Enddatum</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {restaurant.contract.endDate ? 
                            new Date(restaurant.contract.endDate).toLocaleDateString('de-DE') : 
                            'Unbefristet'}
                        </dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="text-sm font-medium text-gray-500">Vertragsbedingungen</dt>
                        <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                          {restaurant.contract.terms || 'Keine Vertragsbedingungen verfügbar'}
                        </dd>
                      </div>
                    </dl>
                  </div>
                  <div className="border-t border-gray-200 px-4 py-4 sm:px-6 bg-gray-50">
                    <div className="flex justify-end space-x-3">
                      <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                        Herunterladen
                      </button>
                      <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                        Bearbeiten
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
