import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import { withAuth } from '@/utils/withAuth';
import { User } from '@supabase/supabase-js';
import { motion } from 'framer-motion';
import { FiCalendar, FiUsers, FiMapPin, FiFilter, FiSearch, FiInfo, FiTrash2 } from 'react-icons/fi';
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
  // Sichtbarkeit
  isPublic?: boolean;
  is_public?: boolean;
  is_public_ready?: boolean;
  restaurant: {
    id: string;
    name: string;
    address: string;
    city: string;
    imageUrl?: string;
    // Restaurant-Sichtbarkeit/Aktivität
    is_visible?: boolean;
    is_active?: boolean;
    contract_status?: string;
  };
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

interface AdminContactTablesProps {
  user: User;
}

export default function AdminContactTables({ user }: AdminContactTablesProps) {
  const router = useRouter();
  const [contactTables, setContactTables] = useState<ContactTableEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    date: '',
    city: '',
    minSeats: '1',
  });
  const [showFilters, setShowFilters] = useState(false);

  // Kontakttische abrufen
  useEffect(() => {
    const fetchContactTables = async () => {
      try {
        setIsLoading(true);
        // Konvertiere minSeats zu einer Zahl
        const apiFilters = {
          ...filters,
          minSeats: filters.minSeats ? parseInt(filters.minSeats, 10) : undefined
        };
        const response = await contactApi.getRequests(apiFilters);
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
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Kontakttisch löschen
  const handleDeleteContactTable = async (id: string) => {
    if (confirm('Sind Sie sicher, dass Sie diesen Kontakttisch löschen möchten?')) {
      try {
        setIsDeleting(id);
        await contactApi.deleteRequest(id);
        setContactTables(prev => prev.filter(table => table.id !== id));
      } catch (error) {
        console.error('Fehler beim Löschen des Kontakttisches:', error);
        alert('Fehler beim Löschen des Kontakttisches');
      } finally {
        setIsDeleting(null);
      }
    }
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
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Admin: Alle Kontakttische</h1>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 bg-gray-100 rounded-md text-gray-700 hover:bg-gray-200 transition-colors"
            >
              <FiFilter className="mr-2" />
              Filter {showFilters ? 'ausblenden' : 'anzeigen'}
            </button>
          </div>
          
          {/* Filter */}
          {showFilters && (
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
                
                <div className="flex-1 min-w-[200px]">
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                    Stadt
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiMapPin className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={filters.city}
                      onChange={handleFilterChange}
                      placeholder="z.B. Berlin"
                      className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div className="flex-1 min-w-[200px]">
                  <label htmlFor="minSeats" className="block text-sm font-medium text-gray-700 mb-1">
                    Min. freie Plätze
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiUsers className="text-gray-400" />
                    </div>
                    <select
                      id="minSeats"
                      name="minSeats"
                      value={filters.minSeats}
                      onChange={handleFilterChange}
                      className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="1">Mindestens 1</option>
                      <option value="2">Mindestens 2</option>
                      <option value="3">Mindestens 3</option>
                      <option value="4">Mindestens 4</option>
                      <option value="5">Mindestens 5</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
          
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
                  Es wurden keine Kontakttische gefunden, die den Filterkriterien entsprechen.
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
                          <div className="flex items-center">
                            <FiMapPin className="mr-2 text-blue-600" />
                            <span>{table.restaurant.name}, {table.restaurant.city}</span>
                            {(
                              table.is_public_ready === true ||
                              ((table.isPublic ?? table.is_public) === true &&
                               table.restaurant?.is_visible === true &&
                               table.restaurant?.is_active === true &&
                               table.restaurant?.contract_status === 'ACTIVE')
                            ) && (
                              <span className="ml-2 inline-flex items-center rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                                Öffentlich bereit
                              </span>
                            )}
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
                    
                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        onClick={() => handleDeleteContactTable(table.id)}
                        disabled={isDeleting === table.id}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isDeleting === table.id ? (
                          <>
                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                            Löschen...
                          </>
                        ) : (
                          <>
                            <FiTrash2 className="mr-2" />
                            Löschen
                          </>
                        )}
                      </button>
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

export const getServerSideProps = withAuth(['ADMIN', 'admin'], async (context, user) => {
  return {
    props: {}
  };
});
