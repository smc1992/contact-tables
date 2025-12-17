import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import PageLayout from '../../components/PageLayout';
import { userApi } from '../../utils/api';
import { FiCalendar, FiClock, FiMapPin, FiUsers, FiAlertCircle } from 'react-icons/fi';

export default function EventsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchEvents = async () => {
      if (!user) {
        router.push('/auth/login');
        return;
      }

      try {
        setLoading(true);
        
        // Echten API-Aufruf verwenden
        const { data, error } = await userApi.getEvents();
        
        if (error) {
          console.error('Fehler beim Laden der Events:', error);
          setError('Events konnten nicht geladen werden.');
        } else if (data && Array.isArray(data.events)) {
          setEvents(data.events);
        } else {
          // Fallback zu Demo-Daten, wenn keine Events vorhanden sind oder das Format nicht stimmt
          console.log('Keine Events gefunden oder falsches Datenformat, verwende Demo-Daten');
          const demoEvents = [
            {
              id: 1,
              title: 'Gemeinsames Abendessen',
              restaurant: 'Restaurant Bella Italia',
              address: 'Hauptstraße 123, 10115 Berlin',
              date: '2025-06-15',
              time: '19:00',
              participants: 4,
              image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8cmVzdGF1cmFudHxlbnwwfHwwfHw%3D&w=1000&q=80',
              status: 'confirmed'
            },
            {
              id: 2,
              title: 'Mittagessen mit neuen Kontakten',
              restaurant: 'Sushi Palace',
              address: 'Friedrichstraße 45, 10117 Berlin',
              date: '2025-06-20',
              time: '12:30',
              participants: 3,
              image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8M3x8c3VzaGl8ZW58MHx8MHx8&w=1000&q=80',
              status: 'pending'
            }
          ];
          
          setEvents(demoEvents);
        }
      } catch (err) {
        console.error('Unerwarteter Fehler beim Laden der Events:', err);
        setError('Ein unerwarteter Fehler ist aufgetreten.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [user, router]);

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('de-DE', options);
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout title="Meine Events">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
          <div className="text-center py-8">
            <FiAlertCircle className="mx-auto text-4xl text-red-500 mb-4" />
            <h3 className="text-xl font-medium mb-2">Fehler</h3>
            <p className="text-gray-500 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition"
            >
              Erneut versuchen
            </button>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Meine Events">
      <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <FiCalendar className="text-primary mr-2 text-xl" />
            <span className="text-gray-500">{events.length} Events</span>
          </div>
        </div>

        {events.length > 0 ? (
          <div className="space-y-6">
            {events.map((event) => (
              <div 
                key={event.id} 
                className="bg-white rounded-lg shadow overflow-hidden border border-gray-100 hover:shadow-md transition"
              >
                <div className="md:flex">
                  <div className="md:w-1/3 h-48 md:h-auto relative">
                    <img
                      src={event.image}
                      alt={event.restaurant}
                      className="w-full h-full object-cover"
                    />
                    <div className={`absolute top-3 right-3 px-2 py-1 rounded text-xs font-medium text-white ${
                      event.status === 'confirmed' ? 'bg-green-500' : 'bg-yellow-500'
                    }`}>
                      {event.status === 'confirmed' ? 'Bestätigt' : 'Ausstehend'}
                    </div>
                  </div>
                  <div className="p-6 md:w-2/3">
                    <h3 className="font-semibold text-xl mb-2">{event.title}</h3>
                    <p className="font-medium text-gray-800 mb-4">{event.restaurant}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                      <div className="flex items-center text-gray-600">
                        <FiCalendar className="mr-2 text-gray-400" />
                        <span>{formatDate(event.date)}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <FiClock className="mr-2 text-gray-400" />
                        <span>{event.time} Uhr</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <FiMapPin className="mr-2 text-gray-400" />
                        <span>{event.address}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <FiUsers className="mr-2 text-gray-400" />
                        <span>{event.participants} Teilnehmer</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => router.push(`/events/${event.id}`)}
                        className="px-4 py-2 border border-primary text-primary rounded hover:bg-primary hover:text-white transition"
                      >
                        Details
                      </button>
                      {event.status === 'confirmed' && (
                        <button
                          className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition"
                        >
                          Zum Kalender hinzufügen
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FiCalendar className="mx-auto text-4xl text-gray-300 mb-4" />
            <h3 className="text-xl font-medium mb-2">Keine Events</h3>
            <p className="text-gray-500 mb-6">Sie haben noch keine Events geplant.</p>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition"
            >
              Restaurants entdecken
            </button>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
