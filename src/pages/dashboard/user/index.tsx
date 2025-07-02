import { useRouter } from 'next/router';
import { useEffect } from 'react';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { motion } from 'framer-motion';
import { FiMapPin, FiCalendar, FiUsers, FiStar } from 'react-icons/fi';
import { useAuth } from '../../../contexts/AuthContext';

export default function UserDashboard() {
  const router = useRouter();
  const { user, session, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading) {
      const userRole = user?.user_metadata?.role;
      if (!session || (userRole !== 'USER' && userRole !== 'CUSTOMER')) {
        router.push('/');
      }
    }
  }, [user, session, authLoading, router]);

  const userRole = user?.user_metadata?.role;
  if (authLoading || !session || (userRole !== 'USER' && userRole !== 'CUSTOMER')) {
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
              <h1 className="text-3xl font-bold text-gray-800">Willkommen bei Contact Tables</h1>
              <p className="text-gray-600 mt-2">Finde Restaurants und knüpfe neue Kontakte</p>
            </div>
            <div className="mt-4 md:mt-0">
              <button
                onClick={() => router.push('/dashboard/user/profile')}
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
              >
                Mein Profil
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              whileHover={{ y: -5 }}
              className="bg-blue-50 p-6 rounded-lg shadow flex flex-col items-center text-center"
            >
              <div className="bg-blue-100 p-3 rounded-full mb-4">
                <FiMapPin className="text-blue-600 text-2xl" />
              </div>
              <h2 className="text-xl font-semibold text-blue-800 mb-2">Restaurants finden</h2>
              <p className="text-gray-600 mb-4">Entdecke Restaurants in deiner Nähe, die am Contact Tables-Programm teilnehmen.</p>
              <button
                onClick={() => router.push('/restaurants')}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition mt-auto"
              >
                Restaurants anzeigen
              </button>
            </motion.div>

            <motion.div
              whileHover={{ y: -5 }}
              className="bg-green-50 p-6 rounded-lg shadow flex flex-col items-center text-center"
            >
              <div className="bg-green-100 p-3 rounded-full mb-4">
                <FiCalendar className="text-green-600 text-2xl" />
              </div>
              <h2 className="text-xl font-semibold text-green-800 mb-2">Meine Termine</h2>
              <p className="text-gray-600 mb-4">Verwalte deine bevorstehenden und vergangenen Restaurantbesuche.</p>
              <button
                onClick={() => router.push('/dashboard/user/appointments')}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition mt-auto"
              >
                Termine anzeigen
              </button>
            </motion.div>

            <motion.div
              whileHover={{ y: -5 }}
              className="bg-purple-50 p-6 rounded-lg shadow flex flex-col items-center text-center"
            >
              <div className="bg-purple-100 p-3 rounded-full mb-4">
                <FiUsers className="text-purple-600 text-2xl" />
              </div>
              <h2 className="text-xl font-semibold text-purple-800 mb-2">Meine Kontakte</h2>
              <p className="text-gray-600 mb-4">Sieh dir die Personen an, die du über Contact Tables kennengelernt hast.</p>
              <button
                onClick={() => router.push('/dashboard/user/contacts')}
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition mt-auto"
              >
                Kontakte anzeigen
              </button>
            </motion.div>

            <motion.div
              whileHover={{ y: -5 }}
              className="bg-yellow-50 p-6 rounded-lg shadow flex flex-col items-center text-center"
            >
              <div className="bg-yellow-100 p-3 rounded-full mb-4">
                <FiStar className="text-yellow-600 text-2xl" />
              </div>
              <h2 className="text-xl font-semibold text-yellow-800 mb-2">Bewertungen</h2>
              <p className="text-gray-600 mb-4">Bewerte deine Erfahrungen und lies Bewertungen anderer Nutzer.</p>
              <button
                onClick={() => router.push('/dashboard/user/reviews')}
                className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition mt-auto"
              >
                Bewertungen anzeigen
              </button>
            </motion.div>
          </div>

          <div className="bg-indigo-50 p-6 rounded-lg shadow mb-8">
            <h2 className="text-xl font-semibold text-indigo-800 mb-4">Empfohlene Restaurants</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded shadow">
                <h3 className="font-semibold text-lg">Café Sonnenschein</h3>
                <p className="text-gray-600 text-sm">Gemütliches Café mit freundlicher Atmosphäre</p>
                <div className="flex items-center mt-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FiStar key={star} className={`${star <= 4 ? 'text-yellow-500' : 'text-gray-300'}`} />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600 ml-2">4.0 (42 Bewertungen)</span>
                </div>
              </div>
              <div className="bg-white p-4 rounded shadow">
                <h3 className="font-semibold text-lg">Ristorante Bella Italia</h3>
                <p className="text-gray-600 text-sm">Authentische italienische Küche im Herzen der Stadt</p>
                <div className="flex items-center mt-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FiStar key={star} className={`${star <= 5 ? 'text-yellow-500' : 'text-gray-300'}`} />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600 ml-2">5.0 (28 Bewertungen)</span>
                </div>
              </div>
              <div className="bg-white p-4 rounded shadow">
                <h3 className="font-semibold text-lg">Sushi Sakura</h3>
                <p className="text-gray-600 text-sm">Frisches Sushi und japanische Spezialitäten</p>
                <div className="flex items-center mt-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FiStar key={star} className={`${star <= 4.5 ? 'text-yellow-500' : 'text-gray-300'}`} />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600 ml-2">4.5 (36 Bewertungen)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Kommende Events</h2>
            <p className="text-gray-600 mb-4">Spezielle Veranstaltungen in teilnehmenden Restaurants:</p>
            <ul className="space-y-4">
              <li className="bg-white p-4 rounded shadow">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-semibold">Weinverkostung im Weinkeller</h3>
                    <p className="text-gray-600 text-sm">Entdecke exquisite Weine in geselliger Runde</p>
                  </div>
                  <div className="text-right">
                    <p className="text-indigo-600 font-semibold">15. Juni</p>
                    <p className="text-gray-600 text-sm">19:00 Uhr</p>
                  </div>
                </div>
              </li>
              <li className="bg-white p-4 rounded shadow">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-semibold">Kochabend für Singles</h3>
                    <p className="text-gray-600 text-sm">Gemeinsam kochen und neue Leute kennenlernen</p>
                  </div>
                  <div className="text-right">
                    <p className="text-indigo-600 font-semibold">22. Juni</p>
                    <p className="text-gray-600 text-sm">18:30 Uhr</p>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
