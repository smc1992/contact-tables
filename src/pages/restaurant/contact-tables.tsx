import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import { createClient } from '../../utils/supabase/server';
import { PrismaClient } from '@prisma/client';
import { motion } from 'framer-motion';
import { FiCalendar, FiUsers, FiMapPin, FiClock, FiInfo } from 'react-icons/fi';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { contactApi } from '../../utils/api';

// Typdefinitionen
interface ContactTableEvent {
  id: string;
  title: string;
  description: string;
  datetime: string;
  maxParticipants: number;
  availableSeats: number;
  status: 'OPEN' | 'FULL' | 'PAST';
  participants: {
    id: string;
    userId: string;
    isHost: boolean;
    user: {
      id: string;
      name: string;
    };
  }[];
}

export default function RestaurantContactTables() {
  const router = useRouter();
  const [contactTables, setContactTables] = useState<ContactTableEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    date: '',
  });

  // Kontakttische abrufen
  useEffect(() => {
    const fetchContactTables = async () => {
      try {
        setIsLoading(true);
        const response = await contactApi.getRestaurantContactTables(filters);
        setContactTables(response.contactTables || []);
      } catch (error) {
        console.error('Fehler beim Abrufen der Kontakttische:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContactTables();
  }, [filters]);

  // Datum formatieren
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter anwenden
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Kontakttische in Ihrem Restaurant</h1>
          
          {/* Filter */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Filter</h2>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                  Datum
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiCalendar className="text-gray-400" />
                  </div>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={filters.date}
                    onChange={handleFilterChange}
                    className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Kontakttische Liste */}
          <div className="space-y-6">
            {isLoading ? (
              <div className="text-center py-10">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Kontakttische werden geladen...</p>
              </div>
            ) : contactTables.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <FiInfo className="mx-auto text-gray-400 text-4xl mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Keine Kontakttische gefunden</h3>
                <p className="text-gray-600">
                  Es wurden keine Kontakttische für Ihr Restaurant gefunden.
                </p>
              </div>
            ) : (
              contactTables.map((table) => (
                <motion.div
                  key={table.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white rounded-lg shadow-md overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">{table.title}</h3>
                        <p className="text-gray-600 mb-4">{table.description}</p>
                        
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                          <div className="flex items-center">
                            <FiCalendar className="mr-2 text-blue-600" />
                            {formatDate(table.datetime)}
                          </div>
                          <div className="flex items-center">
                            <FiUsers className="mr-2 text-blue-600" />
                            {table.participants.length} / {table.maxParticipants} Teilnehmer
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          table.status === 'OPEN' ? 'bg-green-100 text-green-800' :
                          table.status === 'FULL' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {table.status === 'OPEN' ? 'Offen' :
                           table.status === 'FULL' ? 'Voll' :
                           'Vergangen'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <h4 className="font-medium text-gray-700 mb-2">Teilnehmer:</h4>
                      <ul className="space-y-2">
                        {table.participants.map((participant) => (
                          <li key={participant.id} className="flex items-center text-sm">
                            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-2">
                              {participant.user.name.charAt(0)}
                            </span>
                            <span>{participant.user.name}</span>
                            {participant.isHost && (
                              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-600 rounded text-xs">
                                Host
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="mt-6 flex justify-end">
                      <button
                        onClick={() => router.push(`/contact-tables/${table.id}`)}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Details anzeigen
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </main>
      
      <Footer />
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const supabase = createClient(context);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      redirect: {
        destination: '/auth/login?callbackUrl=/restaurant/contact-tables',
        permanent: false,
      },
    };
  }

  if (user.user_metadata?.role !== 'RESTAURANT') {
    return {
      redirect: {
        destination: '/', // Not a restaurant, go home
        permanent: false,
      },
    };
  }

  const prisma = new PrismaClient();
  try {
    const restaurantProfile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: { restaurant: true },
    });

    if (!restaurantProfile?.restaurant) {
      return {
        redirect: {
          destination: '/dashboard/restaurant',
          permanent: false,
        },
      };
    }
  } catch (e) {
    console.error("GSSP /restaurant/contact-tables: DB check failed", e);
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  } finally {
    await prisma.$disconnect();
  }

  return {
    props: {},
  };
};
