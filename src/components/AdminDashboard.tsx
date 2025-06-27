import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface DashboardStats {
  totalUsers: number;
  totalRestaurants: number;
  totalEvents: number;
}

interface Event {
  id: string;
  title: string;
  date: string;
  restaurant: {
    name: string;
  };
  participants: any[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentEvents, setRecentEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/admin/dashboard', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('userId')}`,
          },
        });

        if (!response.ok) {
          throw new Error('Fehler beim Laden der Dashboard-Daten');
        }

        const data = await response.json();
        setStats(data.stats);
        setRecentEvents(data.recentEvents);
      } catch (err) {
        setError('Fehler beim Laden der Daten');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Laden...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-lg shadow-md"
        >
          <h2 className="text-xl font-semibold mb-2">Benutzer</h2>
          <p className="text-3xl font-bold text-blue-600">{stats?.totalUsers}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-lg shadow-md"
        >
          <h2 className="text-xl font-semibold mb-2">Restaurants</h2>
          <p className="text-3xl font-bold text-green-600">{stats?.totalRestaurants}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-lg shadow-md"
        >
          <h2 className="text-xl font-semibold mb-2">Events</h2>
          <p className="text-3xl font-bold text-purple-600">{stats?.totalEvents}</p>
        </motion.div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4">Neueste Events</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Restaurant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teilnehmer</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentEvents.map((event) => (
                <tr key={event.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{event.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{event.restaurant.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(event.date).toLocaleDateString('de-DE')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{event.participants.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 