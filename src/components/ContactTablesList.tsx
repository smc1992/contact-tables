import { useEffect, useState } from 'react';
import { createClient } from '../utils/supabase/client';
import { type Database } from '../types/supabase'; // ContactTableStatus entfernt

type ContactTable = Database['public']['Tables']['contact_tables']['Row'];
type Restaurant = Database['public']['Tables']['restaurants']['Row'];
import Link from 'next/link';
import { FiCalendar, FiClock, FiUsers, FiMapPin, FiHeart, FiInfo } from 'react-icons/fi';

type ContactTableWithRestaurant = ContactTable & {
  restaurant: Restaurant;
};

interface ContactTablesListProps {
  initialContactTables?: ContactTableWithRestaurant[];
}

export default function ContactTablesList({ initialContactTables }: ContactTablesListProps) {
  const [contactTables, setContactTables] = useState<ContactTableWithRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Wenn initialContactTables vorhanden sind, verwenden wir diese
    if (initialContactTables && initialContactTables.length > 0) {
      setContactTables(initialContactTables);
      setLoading(false);
      return;
    }
    
    // Ansonsten laden wir die Daten selbst
    async function fetchContactTables() {
      try {
        setLoading(true);
        const supabase = createClient();
        
        const { data, error } = await supabase
          .from('contact_tables')
          .select(`
            *,
            restaurant:restaurant_id (*)
          `)

          .order('datetime', { ascending: true });
        
        if (error) {
          throw error;
        }
        
        setContactTables(data as ContactTableWithRestaurant[]);
      } catch (error) {
        console.error('Fehler beim Laden der Kontakttische:', error);
        setError('Die Kontakttische konnten nicht geladen werden. Bitte versuche es später erneut.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchContactTables();
  }, [initialContactTables]);
  
  // Formatiert das Datum in deutsches Format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  // Formatiert die Uhrzeit aus einem ISO DateTime String
  const formatTime = (dateTimeString: string) => {
    if (!dateTimeString) return 'N/A';
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        <p>{error}</p>
      </div>
    );
  }
  
  if (contactTables.length === 0) {
    return (
      <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-8 text-center">
        <h3 className="text-xl font-medium text-secondary-700 mb-2">Keine Kontakttische gefunden</h3>
        <p className="text-secondary-500">Derzeit sind keine Kontakttische verfügbar. Schau später noch einmal vorbei.</p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {contactTables.map((table) => (
        <div 
          key={table.id} 
          className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
        >
          <div className="relative h-48 bg-neutral-200">
            {table.restaurant?.image_url ? (
              <img 
                src={table.restaurant.image_url} 
                alt={table.title} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary-100">
                <FiInfo size={48} className="text-primary-400" />
              </div>
            )}
            <div className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-md">
              <FiHeart className="text-neutral-400 hover:text-red-500 cursor-pointer" />
            </div>
          </div>
          
          <div className="p-5">
            <h3 className="text-xl font-semibold text-secondary-800 mb-2">{table.title}</h3>
            
            <div className="flex items-center text-secondary-600 mb-1">
              <FiMapPin className="mr-2 text-primary-500" />
              <span>{table.restaurant.name}</span>
            </div>
            
            <div className="flex items-center text-secondary-600 mb-1">
              <FiCalendar className="mr-2 text-primary-500" />
              <span>{formatDate(table.datetime)}</span>
            </div>
            
            <div className="flex items-center text-secondary-600 mb-3">
              <FiClock className="mr-2 text-primary-500" />
              <span>{formatTime(table.datetime)}</span>
            </div>
            
            <div className="flex items-center text-secondary-600 mb-4">
              <FiUsers className="mr-2 text-primary-500" />
              <span>{table.max_participants} Plätze verfügbar</span>
            </div>
            
            {table.description && (
              <p className="text-secondary-600 mb-4 line-clamp-2">{table.description}</p>
            )}
            
            <div className="flex justify-between items-center">
              <Link 
                href={`/contact-tables/${table.id}`}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Details ansehen
              </Link>
              
              <button 
                className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Teilnehmen
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
