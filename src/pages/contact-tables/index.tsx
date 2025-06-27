import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { motion } from 'framer-motion';
import { FiFilter } from 'react-icons/fi';
import PageLayout from '../../components/PageLayout';
import ContactTablesList from '../../components/ContactTablesList';
import { createClient } from '../../utils/supabase/server';
import { ContactTable, Restaurant } from '../../types/supabase';

// Erweiterte Typdefinition für Kontakttische mit Restaurant-Informationen
type ContactTableWithRestaurant = ContactTable & {
  restaurant: Restaurant;
};

interface ContactTablesProps {
  initialContactTables: ContactTableWithRestaurant[];
  userRole?: string;
  error?: string;
}

export default function ContactTables({ initialContactTables, userRole, error: serverError }: ContactTablesProps) {
  const [filters, setFilters] = useState({
    date: '',
    city: '',
    minSeats: '1',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [filteredTables, setFilteredTables] = useState<ContactTableWithRestaurant[]>(initialContactTables);

  // Filterfunktionen
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => {
      const newFilters = { ...prev, [name]: value };
      applyFilters(newFilters);
      return newFilters;
    });
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };
  
  // Funktion zum Anwenden der Filter
  const applyFilters = (currentFilters = filters) => {
    let result = [...initialContactTables];
    
    // Datum filtern
    if (currentFilters.date) {
      const filterDate = new Date(currentFilters.date);
      filterDate.setHours(0, 0, 0, 0); // Setze Uhrzeit auf 00:00:00
      
      result = result.filter(table => {
        const tableDate = new Date(table.date);
        tableDate.setHours(0, 0, 0, 0);
        return tableDate.getTime() === filterDate.getTime();
      });
    }
    
    // Stadt filtern
    if (currentFilters.city.trim()) {
      const cityLower = currentFilters.city.trim().toLowerCase();
      result = result.filter(table => 
        table.restaurant.city.toLowerCase().includes(cityLower)
      );
    }
    
    // Mindestanzahl freier Plätze filtern
    if (currentFilters.minSeats) {
      const minSeats = parseInt(currentFilters.minSeats, 10);
      result = result.filter(table => {
        const availableSeats = table.max_participants - table.participant_count;
        return availableSeats >= minSeats;
      });
    }
    
    setFilteredTables(result);
  };
  
  // Filter beim ersten Laden anwenden
  useEffect(() => {
    applyFilters();
  }, [initialContactTables]);

  return (
    <PageLayout>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white">
        <div className="container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Entdecke Kontakttische in deiner Nähe
            </h1>
            <p className="text-xl mb-8 text-white/90">
              Finde offene Tische in deiner Nähe und lerne neue Menschen bei gutem Essen kennen. 
              Gemeinsam statt einsam - für echte Gespräche und neue Freundschaften.
            </p>
            {userRole && (
              <div className="inline-block bg-white/20 px-4 py-2 rounded-full text-sm font-medium">
                Angemeldet als: {userRole}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Filter-Bereich */}
      <div className="container mx-auto px-4 py-8">
        {/* Fehleranzeige */}
        {serverError && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-6"
          >
            <p className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {serverError}
            </p>
          </motion.div>
        )}
        
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-secondary-800">Verfügbare Kontakttische</h2>
            <button
              onClick={toggleFilters}
              className="flex items-center gap-2 text-primary-600 hover:text-primary-700 transition-colors"
            >
              <FiFilter />
              {showFilters ? 'Filter ausblenden' : 'Filter anzeigen'}
            </button>
          </div>

          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white p-4 rounded-lg shadow-md mb-6 overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-secondary-700 mb-1">Datum</label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={filters.date}
                    onChange={handleFilterChange}
                    className="w-full p-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-secondary-700 mb-1">Stadt</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={filters.city}
                    onChange={handleFilterChange}
                    placeholder="z.B. München"
                    className="w-full p-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label htmlFor="minSeats" className="block text-sm font-medium text-secondary-700 mb-1">Min. freie Plätze</label>
                  <select
                    id="minSeats"
                    name="minSeats"
                    value={filters.minSeats}
                    onChange={handleFilterChange}
                    className="w-full p-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="1">Mindestens 1</option>
                    <option value="2">Mindestens 2</option>
                    <option value="3">Mindestens 3</option>
                    <option value="4">Mindestens 4</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Kontakttische Liste */}
        <ContactTablesList initialContactTables={filteredTables} />
      </div>
    </PageLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const supabase = createClient(context);
  
  // Überprüfen, ob der Benutzer eingeloggt ist
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    // Zur Login-Seite weiterleiten mit Rückgabe-URL
    return {
      redirect: {
        destination: `/auth/login?redirect=${encodeURIComponent('/contact-tables')}`,
        permanent: false,
      },
    };
  }
  
  // Benutzerrolle überprüfen
  const userRole = session.user?.user_metadata?.role || 'CUSTOMER';
  const userRoleUpper = userRole.toUpperCase();
  
  // Prüfen, ob der Benutzer Zugriff auf diese Seite haben sollte
  // Alle Benutzerrollen (CUSTOMER, RESTAURANT, ADMIN) dürfen die Kontakttische sehen
  
  // Kontakttische aus der Datenbank laden
  // Nur Kontakttische von aktiven Restaurants anzeigen
  const { data: contactTables, error } = await supabase
    .from('contact_tables')
    .select(`
      *,
      restaurant:restaurants!restaurant_id(*)
    `)
    .eq('status', 'PUBLISHED')
    .gte('date', new Date().toISOString().split('T')[0]) // Nur zukünftige Kontakttische
    .order('date', { ascending: true });
    
  // Filtern, um nur Kontakttische von aktiven Restaurants anzuzeigen
  const filteredTables = contactTables?.filter(table => 
    table.restaurant && table.restaurant.status === 'ACTIVE'
  ) || [];
  
  if (error) {
    console.error('Fehler beim Laden der Kontakttische:', error);
    return {
      props: {
        initialContactTables: [],
        error: 'Fehler beim Laden der Kontakttische. Bitte versuchen Sie es später erneut.',
        userRole: userRoleUpper,
      },
    };
  }
  
  return {
    props: {
      initialContactTables: filteredTables,
      userRole: userRoleUpper,
    },
  };
};
