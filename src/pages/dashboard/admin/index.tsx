import { useRouter } from 'next/router';
import { useEffect } from 'react';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { motion } from 'framer-motion';
import { useAuth } from '../../../contexts/AuthContext';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, session, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading) {
      if (!session || user?.user_metadata?.role !== 'ADMIN') {
        router.push('/');
      }
    }
  }, [user, session, authLoading, router]);

  if (authLoading || !session || user?.user_metadata?.role !== 'ADMIN') {
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
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold text-blue-800 mb-4">Benutzer verwalten</h2>
              <p className="text-gray-600 mb-4">Benutzerkonten anzeigen, bearbeiten und löschen.</p>
              <button
                onClick={() => router.push('/dashboard/admin/users')}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
              >
                Benutzer anzeigen
              </button>
            </div>

            <div className="bg-green-50 p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold text-green-800 mb-4">Restaurants verwalten</h2>
              <p className="text-gray-600 mb-4">Restaurants hinzufügen, bearbeiten und löschen.</p>
              <button
                onClick={() => router.push('/dashboard/admin/restaurants')}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
              >
                Restaurants anzeigen
              </button>
            </div>

            <div className="bg-purple-50 p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold text-purple-800 mb-4">Statistiken</h2>
              <p className="text-gray-600 mb-4">Nutzungsstatistiken und Plattformanalysen einsehen.</p>
              <button
                onClick={() => router.push('/dashboard/admin/statistics')}
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition"
              >
                Statistiken anzeigen
              </button>
            </div>
          </div>

          <div className="mt-8 bg-yellow-50 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-yellow-800 mb-4">System Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded shadow">
                <p className="text-gray-500">Aktive Benutzer</p>
                <p className="text-2xl font-bold">247</p>
              </div>
              <div className="bg-white p-4 rounded shadow">
                <p className="text-gray-500">Registrierte Restaurants</p>
                <p className="text-2xl font-bold">58</p>
              </div>
              <div className="bg-white p-4 rounded shadow">
                <p className="text-gray-500">Vermittlungen heute</p>
                <p className="text-2xl font-bold">23</p>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
