import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { motion } from 'framer-motion';
import { useAuth } from '../../../contexts/AuthContext';
import AdminSidebar from '../../../components/AdminSidebar';
import { FiMessageSquare, FiStar, FiAlertTriangle, FiCheckCircle, FiXCircle, FiFlag } from 'react-icons/fi';

export default function AdminModerationPage() {
  const { session, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    reviews: {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      flagged: 0
    },
    comments: {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      flagged: 0
    }
  });

  // Authentifizierung prüfen
  useEffect(() => {
    if (!authLoading) {
      if (!session) {
        router.push('/auth/login');
      } else if (user && user.user_metadata?.role !== 'ADMIN') {
        router.push('/');
      } else {
        setLoading(false);
        fetchModerationStats();
      }
    }
  }, [authLoading, session, router, user]);

  // Moderationsstatistiken laden
  const fetchModerationStats = async () => {
    try {
      // Bewertungsstatistiken
      const reviewsResponse = await fetch('/api/admin/moderation/reviews?countOnly=true');
      if (reviewsResponse.ok) {
        const reviewsData = await reviewsResponse.json();
        setStats(prev => ({
          ...prev,
          reviews: reviewsData
        }));
      }

      // Kommentarstatistiken
      const commentsResponse = await fetch('/api/admin/moderation/comments?countOnly=true');
      if (commentsResponse.ok) {
        const commentsData = await commentsResponse.json();
        setStats(prev => ({
          ...prev,
          comments: commentsData
        }));
      }
    } catch (error) {
      console.error('Fehler beim Laden der Moderationsstatistiken:', error);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex flex-col">
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
      <div className="flex flex-col md:flex-row flex-grow">
        <AdminSidebar activeItem="moderation" />
        
        <main className="flex-grow bg-gray-50 py-6 px-4 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Inhaltsmoderation</h1>
              <p className="mt-2 text-gray-600">
                Verwalten und moderieren Sie Bewertungen und Kommentare auf der Plattform.
              </p>
            </div>
            
            {/* Statistik-Karten */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Bewertungen */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium text-gray-900">Bewertungen</h2>
                    <FiStar className="h-6 w-6 text-yellow-500" />
                  </div>
                </div>
                <div className="px-6 py-5">
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-6">
                    <div className="col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Gesamt</dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.reviews.total}</dd>
                    </div>
                    <div className="col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Ausstehend</dt>
                      <dd className="mt-1 text-3xl font-semibold text-yellow-500">{stats.reviews.pending}</dd>
                    </div>
                    <div className="col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Genehmigt</dt>
                      <dd className="mt-1 text-3xl font-semibold text-green-500">{stats.reviews.approved}</dd>
                    </div>
                    <div className="col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Abgelehnt</dt>
                      <dd className="mt-1 text-3xl font-semibold text-red-500">{stats.reviews.rejected}</dd>
                    </div>
                  </dl>
                  <div className="mt-6">
                    <button
                      onClick={() => router.push('/admin/moderation/reviews')}
                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Bewertungen moderieren
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Kommentare */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium text-gray-900">Kommentare</h2>
                    <FiMessageSquare className="h-6 w-6 text-blue-500" />
                  </div>
                </div>
                <div className="px-6 py-5">
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-6">
                    <div className="col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Gesamt</dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.comments.total}</dd>
                    </div>
                    <div className="col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Ausstehend</dt>
                      <dd className="mt-1 text-3xl font-semibold text-yellow-500">{stats.comments.pending}</dd>
                    </div>
                    <div className="col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Genehmigt</dt>
                      <dd className="mt-1 text-3xl font-semibold text-green-500">{stats.comments.approved}</dd>
                    </div>
                    <div className="col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Abgelehnt</dt>
                      <dd className="mt-1 text-3xl font-semibold text-red-500">{stats.comments.rejected}</dd>
                    </div>
                  </dl>
                  <div className="mt-6">
                    <button
                      onClick={() => router.push('/admin/moderation/comments')}
                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Kommentare moderieren
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Moderationsrichtlinien */}
            <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
              <div className="px-6 py-5 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Moderationsrichtlinien</h2>
              </div>
              <div className="px-6 py-5">
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <FiCheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-gray-900">Genehmigen</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Inhalte, die den Community-Richtlinien entsprechen und konstruktiv sind.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <FiXCircle className="h-5 w-5 text-red-500" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-gray-900">Ablehnen</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Inhalte, die beleidigend, diskriminierend, irreführend oder Spam sind.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <FiFlag className="h-5 w-5 text-orange-500" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-gray-900">Markieren</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Inhalte, die weitere Überprüfung benötigen oder grenzwertig sind.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <FiAlertTriangle className="h-5 w-5 text-yellow-500" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-gray-900">Meldungen</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Priorisieren Sie Inhalte mit Meldungen von Benutzern für eine schnellere Überprüfung.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
