import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiCalendar, FiMapPin, FiUsers, FiStar } from 'react-icons/fi';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  restaurant: {
    name: string;
    address: string;
  };
  maxParticipants: number;
  participants: {
    user: {
      name: string;
    };
  }[];
  price: number;
}

export default function UserDashboard() {
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/users/events', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('userId')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Fehler beim Laden der Events');
      }

      const data = await response.json();
      const now = new Date();
      
      setUpcomingEvents(data.filter((event: Event) => new Date(event.date) > now));
      setPastEvents(data.filter((event: Event) => new Date(event.date) <= now));
    } catch (err) {
      setError('Fehler beim Laden der Daten');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const EventCard = ({ event }: { event: Event }) => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white p-6 rounded-lg shadow-md"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-semibold">{event.title}</h2>
          <p className="text-gray-600">{event.description}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold">{event.price.toFixed(2)} €</p>
        </div>
      </div>
      
      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <FiCalendar />
          {new Date(event.date).toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
        
        <div className="flex items-center gap-2">
          <FiMapPin />
          {event.restaurant.name} - {event.restaurant.address}
        </div>
        
        <div className="flex items-center gap-2">
          <FiUsers />
          {event.participants.length} / {event.maxParticipants} Teilnehmer
        </div>
      </div>

      {new Date(event.date) <= new Date() && (
        <div className="mt-4">
          <button
            className="flex items-center gap-2 text-yellow-600 hover:text-yellow-700 transition-colors"
            onClick={() => {/* Bewertungsfunktion hier implementieren */}}
          >
            <FiStar />
            Bewerten
          </button>
        </div>
      )}
    </motion.div>
  );

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Laden...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Meine Events</h1>

      <div className="space-y-8">
        {upcomingEvents.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold mb-4">Kommende Events</h2>
            <div className="grid grid-cols-1 gap-6">
              {upcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}

        {pastEvents.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold mb-4">Vergangene Events</h2>
            <div className="grid grid-cols-1 gap-6">
              {pastEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}

        {upcomingEvents.length === 0 && pastEvents.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">Du hast noch keine Events gebucht.</p>
            <a
              href="/search"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Events suchen
            </a>
          </div>
        )}
      </div>
    </div>
  );
} 