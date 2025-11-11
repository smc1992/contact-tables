import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import PageLayout from '../../components/PageLayout';
import ContactTablesList from '../../components/ContactTablesList';
import ReservationCalendar from '../../components/ReservationCalendar';
import ReservationStepper from '../../components/ReservationStepper';
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
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [resultsAnchorId] = useState('results');

  // Build availability map by date (YYYY-MM-DD)
  const availabilityByDate: Record<string, number> = useMemo(() => {
    const map: Record<string, number> = {};
    (initialContactTables || []).forEach((t) => {
      const d = t.datetime ? new Date(t.datetime) : null;
      if (!d) return;
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const key = `${y}-${m}-${day}`;
      map[key] = (map[key] || 0) + 1;
    });
    return map;
  }, [initialContactTables]);

  useEffect(() => {
    let tables = initialContactTables || [];

    if (filters.date) {
      tables = tables.filter(table => 
        new Date(table.datetime).toLocaleDateString('de-DE') === new Date(filters.date).toLocaleDateString('de-DE')
      );
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
    setCurrentStep(1);
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
            <ReservationStepper currentStep={currentStep} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <ReservationCalendar
                  selectedDate={filters.date || null}
                  availabilityByDate={availabilityByDate}
                  onSelect={(ymd) => {
                    setFilters((prev) => ({ ...prev, date: ymd }));
                    setCurrentStep(2);
                    // Smooth scroll to results
                    const el = document.getElementById(resultsAnchorId);
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                />
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="space-y-3">
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
                  <button
                    onClick={() => {
                      setCurrentStep(filters.date ? 2 : 1);
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
    // Nur öffentliche Tische laden und Restaurants nur, wenn sie sichtbar/aktiv sind
    .select('*, restaurant:restaurants!inner(*)')
    .eq('is_public', true)
    .eq('restaurant.is_visible', true)
    .eq('restaurant.contract_status', 'ACTIVE')
    .order('datetime', { ascending: true });

  if (error) {
    console.error('Error fetching contact tables:', error);
    return { props: { initialContactTables: [], user, userRole, error: 'Fehler beim Laden der Tische.' } };
  }

  const tablesWithRestaurants: ContactTableWithRestaurant[] = tables?.map(table => ({
    ...table,
    restaurant: Array.isArray(table.restaurant) ? table.restaurant[0] : table.restaurant,
  })) || [];

  return {
    props: {
      initialContactTables: tablesWithRestaurants,
      user,
      userRole,
    },
  };
};
