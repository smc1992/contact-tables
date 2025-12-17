import { useRouter } from 'next/router';
import { useEffect } from 'react';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { motion } from 'framer-motion';
import { FiUsers, FiCalendar, FiSettings, FiBarChart2 } from 'react-icons/fi';
import { useAuth } from '../../../contexts/AuthContext';

export default function RestaurantDashboard() {
  const router = useRouter();
  const { user, session, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading) {
      if (!session || user?.user_metadata?.role !== 'RESTAURANT_OWNER') {
        router.push('/');
      }
    }
  }, [user, session, authLoading, router]);

  if (authLoading || !session || user?.user_metadata?.role !== 'RESTAURANT_OWNER') {
    return (
      <div className="min-h-screen flex flex-col pt-20">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="mt-4 text-lg">Laden...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white shadow-lg rounded-lg p-6"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Restaurant Dashboard</h1>
              <p className="text-gray-600 mt-2">Verwalten Sie Ihr Restaurant und Ihre Kontakttische</p>
            </div>
            <div className="mt-4 md:mt-0">
              <button
                onClick={() => router.push('/dashboard/restaurant/profile')}
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
              >
                Restaurant-Profil
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              whileHover={{ y: -5 }}
              className="bg-blue-50 p-6 rounded-lg shadow flex flex-col items-center text-center"
            >
              <div className="bg-blue-100 p-3 rounded-full mb-4">
                <FiUsers className="text-blue-600 text-2xl" />
              </div>
              <h2 className="text-xl font-semibold text-blue-800 mb-2">Kontakttische</h2>
              <p className="text-gray-600 mb-4">Verwalten Sie Ihre Kontakttische und deren Verfügbarkeit.</p>
              <button
                onClick={() => router.push('/dashboard/restaurant/tables')}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition mt-auto"
              >
                Tische verwalten
              </button>
            </motion.div>

            <motion.div
              whileHover={{ y: -5 }}
              className="bg-green-50 p-6 rounded-lg shadow flex flex-col items-center text-center"
            >
              <div className="bg-green-100 p-3 rounded-full mb-4">
                <FiCalendar className="text-green-600 text-2xl" />
              </div>
              <h2 className="text-xl font-semibold text-green-800 mb-2">Reservierungen</h2>
              <p className="text-gray-600 mb-4">Übersicht aller Reservierungen und Kontaktanfragen.</p>
              <button
                onClick={() => router.push('/dashboard/restaurant/reservations')}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition mt-auto"
              >
                Reservierungen anzeigen
              </button>
            </motion.div>

            <motion.div
              whileHover={{ y: -5 }}
              className="bg-purple-50 p-6 rounded-lg shadow flex flex-col items-center text-center"
            >
              <div className="bg-purple-100 p-3 rounded-full mb-4">
                <FiBarChart2 className="text-purple-600 text-2xl" />
              </div>
              <h2 className="text-xl font-semibold text-purple-800 mb-2">Statistiken</h2>
              <p className="text-gray-600 mb-4">Einsicht in Ihre Kontakttisch-Statistiken und Erfolgsraten.</p>
              <button
                onClick={() => router.push('/dashboard/restaurant/statistics')}
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition mt-auto"
              >
                Statistiken anzeigen
              </button>
            </motion.div>

            <motion.div
              whileHover={{ y: -5 }}
              className="bg-yellow-50 p-6 rounded-lg shadow flex flex-col items-center text-center"
            >
              <div className="bg-yellow-100 p-3 rounded-full mb-4">
                <FiSettings className="text-yellow-600 text-2xl" />
              </div>
              <h2 className="text-xl font-semibold text-yellow-800 mb-2">Einstellungen</h2>
              <p className="text-gray-600 mb-4">Passen Sie Ihre Restaurant-Einstellungen und Präferenzen an.</p>
              <button
                onClick={() => router.push('/dashboard/restaurant/settings')}
                className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition mt-auto"
              >
                Einstellungen ändern
              </button>
            </motion.div>
          </div>

          <div className="bg-indigo-50 p-6 rounded-lg shadow mb-8">
            <h2 className="text-xl font-semibold text-indigo-800 mb-4">Aktuelle Übersicht</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded shadow">
                <h3 className="text-gray-500 text-sm">Offene Anfragen</h3>
                <p className="text-2xl font-bold">12</p>
              </div>
              <div className="bg-white p-4 rounded shadow">
                <h3 className="text-gray-500 text-sm">Heutige Reservierungen</h3>
                <p className="text-2xl font-bold">8</p>
              </div>
              <div className="bg-white p-4 rounded shadow">
                <h3 className="text-gray-500 text-sm">Aktive Kontakttische</h3>
                <p className="text-2xl font-bold">5</p>
              </div>
              <div className="bg-white p-4 rounded shadow">
                <h3 className="text-gray-500 text-sm">Erfolgreiche Vermittlungen</h3>
                <p className="text-2xl font-bold">127</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Neueste Anfragen</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-2 px-4 text-left">Name</th>
                    <th className="py-2 px-4 text-left">Datum</th>
                    <th className="py-2 px-4 text-left">Uhrzeit</th>
                    <th className="py-2 px-4 text-left">Personen</th>
                    <th className="py-2 px-4 text-left">Status</th>
                    <th className="py-2 px-4 text-left">Aktion</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 px-4">Maria Schmidt</td>
                    <td className="py-2 px-4">15.06.2025</td>
                    <td className="py-2 px-4">19:00</td>
                    <td className="py-2 px-4">2</td>
                    <td className="py-2 px-4"><span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">Ausstehend</span></td>
                    <td className="py-2 px-4">
                      <button className="text-indigo-600 hover:text-indigo-800 mr-2">Annehmen</button>
                      <button className="text-red-600 hover:text-red-800">Ablehnen</button>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-4">Thomas Müller</td>
                    <td className="py-2 px-4">16.06.2025</td>
                    <td className="py-2 px-4">18:30</td>
                    <td className="py-2 px-4">1</td>
                    <td className="py-2 px-4"><span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Bestätigt</span></td>
                    <td className="py-2 px-4">
                      <button className="text-gray-600 hover:text-gray-800">Details</button>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4">Sabine Weber</td>
                    <td className="py-2 px-4">17.06.2025</td>
                    <td className="py-2 px-4">20:00</td>
                    <td className="py-2 px-4">3</td>
                    <td className="py-2 px-4"><span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">Ausstehend</span></td>
                    <td className="py-2 px-4">
                      <button className="text-indigo-600 hover:text-indigo-800 mr-2">Annehmen</button>
                      <button className="text-red-600 hover:text-red-800">Ablehnen</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
