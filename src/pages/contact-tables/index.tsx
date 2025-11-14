import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PageLayout from '../../components/PageLayout';
import ContactTablesList from '../../components/ContactTablesList';
import { createClient } from '@/utils/supabase/server';
import type { GetServerSidePropsContext } from 'next';
import type { User } from '@supabase/supabase-js';
import { type Database } from '../../types/supabase';

type ContactTable = Database['public']['Tables']['contact_tables']['Row'];
type Restaurant = Database['public']['Tables']['restaurants']['Row'];

type ContactTableWithRestaurant = ContactTable & {
  restaurant: Restaurant | null;
};

interface ContactTablesPageProps {
  initialContactTables: ContactTableWithRestaurant[];
  user: User;
  userRole: string;
  error?: string;
}

export default function ContactTablesPage({ initialContactTables, userRole, error: serverError }: ContactTablesPageProps) {
  const [filters, setFilters] = useState({
    date: '',
    city: '',
    interests: '', // This will now search in title and description
  });
  const [filteredTables, setFilteredTables] = useState(initialContactTables || []);
  const [resultsAnchorId] = useState('results');

  useEffect(() => {
    let tables = initialContactTables || [];

    if (filters.date) {
      tables = tables.filter((table) => {
        if (!table.datetime) return false; // avoid calling Date with null
        const tableDate = new Date(table.datetime);
        const selectedDate = new Date(filters.date);
        return (
          tableDate.toLocaleDateString('de-DE') ===
          selectedDate.toLocaleDateString('de-DE')
        );
      });
    }

    if (filters.city) {
      tables = tables.filter(table => 
        table.restaurant?.city?.toLowerCase().includes(filters.city.toLowerCase())
      );
    }

    if (filters.interests) {
      const searchKeywords = filters.interests.split(',').map(k => k.trim().toLowerCase()).filter(k => k);
      if (searchKeywords.length > 0) {
        tables = tables.filter(table => 
          searchKeywords.some(keyword => 
            table.title.toLowerCase().includes(keyword) ||
            (table.description && table.description.toLowerCase().includes(keyword))
          )
        );
      }
    }

    setFilteredTables(tables);
  }, [filters, initialContactTables]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({ date: '', city: '', interests: '' });
  };

  return (
    <PageLayout title="Offene Kontakttische">
      <div className="container mx-auto px-4 py-8">
        {serverError && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-6"
            role="alert"
          >
            <strong className="font-bold">Fehler:</strong>
            <span className="block sm:inline ml-2">{serverError}</span>
          </motion.div>
        )}
        
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-neutral-800">Finde deinen Tisch</h2>
            <button onClick={resetFilters} className="text-sm text-primary-600 hover:underline">Filter zurücksetzen</button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <p className="text-neutral-700 mb-2">Nutze die Filter, um passende Kontakttische zu finden.</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Datum</label>
                      <input
                        type="date"
                        name="date"
                        value={filters.date}
                        onChange={handleFilterChange}
                        className="form-input w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Stadt</label>
                      <input
                        type="text"
                        name="city"
                        placeholder="z.B. Berlin"
                        value={filters.city}
                        onChange={handleFilterChange}
                        className="form-input w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Stichwort</label>
                      <input
                        type="text"
                        name="interests"
                        placeholder="z.B. Kunst, Jazz"
                        value={filters.interests}
                        onChange={handleFilterChange}
                        className="form-input w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={() => {
                        const el = document.getElementById(resultsAnchorId);
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }}
                      className="w-full bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-700"
                    >
                      Ergebnisse anzeigen
                    </button>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <p className="text-sm text-neutral-700">Tipp: Klicke in der Liste auf einen Tisch, um Details, Kalender und Reservierung zu sehen.</p>
              </div>
            </div>
          </div>
        </div>

        <div id={resultsAnchorId} className="mt-8">
          <ContactTablesList initialContactTables={filteredTables} userRole={userRole} />
        </div>
      </div>
    </PageLayout>
  );
}

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const supabase = createClient(ctx);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: false,
      },
    };
  }

  const userRole = user.user_metadata?.role || 'CUSTOMER';

  // Corrected query, ordering by datetime
  const { data: tables, error } = await supabase
    .from('contact_tables')
    // Nur öffentliche Tische laden; Restaurant wird eingebettet, Filter später in Code
    .select('*, restaurant:restaurants!inner(*)')
    .eq('is_public', true)
    .order('datetime', { ascending: true });

  if (error) {
    console.error('Error fetching contact tables:', error);
    return { props: { initialContactTables: [], user, userRole, error: 'Fehler beim Laden der Tische.' } };
  }

  const tablesWithRestaurantsRaw: ContactTableWithRestaurant[] = tables?.map(table => ({
    ...table,
    restaurant: Array.isArray(table.restaurant) ? table.restaurant[0] : table.restaurant,
  })) || [];

  // Sichtbarkeitslogik konsistent wie API-Route: nur Restaurants, die öffentlich bereit sind
  const tablesWithRestaurants: ContactTableWithRestaurant[] = tablesWithRestaurantsRaw.filter((t) => {
    const r = t.restaurant as any;
    const isRestaurantPublicReady = Boolean(r && r.is_visible === true && r.is_active === true && r.contract_status === 'ACTIVE');
    return t.is_public === true && isRestaurantPublicReady;
  });

  return {
    props: {
      initialContactTables: tablesWithRestaurants,
      user,
      userRole,
    },
  };
};
