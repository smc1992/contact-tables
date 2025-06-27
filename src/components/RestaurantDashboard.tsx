import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiCalendar, FiPlus, FiUsers } from 'react-icons/fi';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  maxParticipants: number;
  price: number;
  participants: {
    user: {
      name: string;
      email: string;
    };
  }[];
}

export default function RestaurantDashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNewEventForm, setShowNewEventForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    maxParticipants: 0,
    price: 0,
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/restaurants/events', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('userId')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Fehler beim Laden der Events');
      }

      const data = await response.json();
      setEvents(data);
    } catch (err) {
      setError('Fehler beim Laden der Daten');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/restaurants/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('userId')}`,
        },
        body: JSON.stringify(newEvent),
      });

      if (!response.ok) {
        throw new Error('Fehler beim Erstellen des Events');
      }

      setShowNewEventForm(false);
      setNewEvent({
        title: '',
        description: '',
        date: '',
        maxParticipants: 0,
        price: 0,
      });
      fetchEvents();
    } catch (err) {
      setError('Fehler beim Erstellen des Events');
      console.error(err);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Laden...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Restaurant Dashboard</h1>
        <button
          onClick={() => setShowNewEventForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <FiPlus /> Neues Event
        </button>
      </div>

      {showNewEventForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-lg shadow-md mb-8"
        >
          <h2 className="text-2xl font-semibold mb-4">Neues Event erstellen</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Titel</label>
              <input
                type="text"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Beschreibung</label>
              <textarea
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                className="w-full p-2 border rounded-md"
                rows={3}
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Datum</label>
                <input
                  type="datetime-local"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Max. Teilnehmer</label>
                <input
                  type="number"
                  value={newEvent.maxParticipants}
                  onChange={(e) => setNewEvent({ ...newEvent, maxParticipants: parseInt(e.target.value) })}
                  className="w-full p-2 border rounded-md"
                  min="1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Preis (€)</label>
                <input
                  type="number"
                  value={newEvent.price}
                  onChange={(e) => setNewEvent({ ...newEvent, price: parseFloat(e.target.value) })}
                  className="w-full p-2 border rounded-md"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setShowNewEventForm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Event erstellen
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {events.map((event) => (
          <motion.div
            key={event.id}
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
            <div className="flex gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <FiCalendar />
                {new Date(event.date).toLocaleDateString('de-DE', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
              <div className="flex items-center gap-1">
                <FiUsers />
                {event.participants.length} / {event.maxParticipants} Teilnehmer
              </div>
            </div>
            {event.participants.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Teilnehmer:</h3>
                <ul className="space-y-1">
                  {event.participants.map((participant, index) => (
                    <li key={index} className="text-sm">
                      {participant.user.name} ({participant.user.email})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
} 