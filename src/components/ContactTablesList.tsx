import { useState } from 'react';
import { type Database } from '../types/supabase';
import Link from 'next/link';
import { FiCalendar, FiClock, FiMapPin, FiHeart, FiInfo } from 'react-icons/fi';

type ContactTable = Database['public']['Tables']['contact_tables']['Row'];
type Restaurant = Database['public']['Tables']['restaurants']['Row'];

// Simplified type, does not include participants anymore
type ContactTableWithRestaurant = ContactTable & {
  restaurant: Restaurant | null;
};

interface ContactTablesListProps {
  initialContactTables: ContactTableWithRestaurant[];
  userRole: string;
}

export default function ContactTablesList({ initialContactTables, userRole }: ContactTablesListProps) {
  // This component now relies entirely on the props passed to it.
  // The internal data fetching logic has been removed to prevent the error.
  const [contactTables] = useState<ContactTableWithRestaurant[]>(initialContactTables || []);
  const [joining, setJoining] = useState<string | null>(null); // Track joining status by table id

  const handleJoin = async (tableId: string) => {
    setJoining(tableId);
    try {
      const response = await fetch('/api/contact/request', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactTableId: tableId, action: 'join' }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Fehler beim Beitreten');
      }
      alert('Erfolgreich beigetreten! Die Seite wird neu geladen, um die Teilnehmerzahl zu aktualisieren.');
      // Reload the page to reflect the change in participants
      window.location.reload();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setJoining(null);
    }
  };

  if (!contactTables || contactTables.length === 0) {
    return (
      <div className="text-center p-12 bg-white rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-neutral-700">Keine Kontakttische gefunden</h3>
        <p className="text-neutral-500 mt-2">Derzeit sind keine Kontakttische verfügbar. Schau später noch einmal vorbei.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {contactTables.filter(table => table.restaurant).map((table) => {
        // Participant count is removed as it's causing issues.
        // We can display max_participants directly.
        const availableSeats = table.max_participants;
        
        return (
          <div key={table.id} className="bg-white rounded-xl shadow-lg overflow-hidden transition-transform duration-300 hover:scale-105 hover:shadow-xl flex flex-col">
            <div className="p-6 flex-grow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm text-neutral-500 flex items-center">
                    <FiCalendar className="mr-2" />
                    {new Date(table.datetime).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </p>
                  <p className="text-sm text-neutral-500 flex items-center mt-1">
                    <FiClock className="mr-2" />
                    {new Date(table.datetime).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr
                  </p>
                </div>
                <span className="px-3 py-1 text-xs font-semibold text-primary-800 bg-primary-100 rounded-full">
                  {/* Displaying max participants instead of available seats */}
                  {table.max_participants} Plätze
                </span>
              </div>

              <h3 className="text-xl font-bold text-neutral-800 mb-2">{table.title}</h3>

              {table.restaurant && (
                <div className="text-sm text-neutral-600 mb-4">
                  <p className="flex items-center">
                    <FiMapPin className="mr-2" />
                    <Link href={`/restaurants/${table.restaurant.id}`} className="hover:underline font-semibold">
                      {table.restaurant.name}
                    </Link>
                  </p>
                  <p className="ml-6">{table.restaurant.address}, {table.restaurant.city}</p>
                </div>
              )}

              

              {table.description && (
                 <div className="mb-4">
                  <h4 className="font-semibold text-sm text-neutral-700 mb-2 flex items-center"><FiInfo className="mr-2"/>Beschreibung</h4>
                  <p className="text-sm text-neutral-600 bg-neutral-50 p-3 rounded-md">{table.description}</p>
                </div>
              )}
            </div>

            <div className="bg-neutral-50 px-6 py-4">
              {userRole === 'CUSTOMER' && (
                <button 
                  onClick={() => handleJoin(table.id)}
                  disabled={joining === table.id}
                  className="w-full bg-primary-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors disabled:bg-neutral-400 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {joining === table.id ? 'Beitreten...' : 'Teilnehmen'}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
