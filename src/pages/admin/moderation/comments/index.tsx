import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Header from '../../../../components/Header';
import Footer from '../../../../components/Footer';
import { motion } from 'framer-motion';
import { useAuth } from '../../../../contexts/AuthContext';
import AdminSidebar from '../../../../components/AdminSidebar';
import CommentModeration from '../../../../components/admin/CommentModeration';

export default function AdminCommentModerationPage() {
  const { session, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!session) {
        router.push('/auth/login');
      } else if (user && user.user_metadata?.role !== 'ADMIN') {
        router.push('/');
      } else {
        setLoading(false);
      }
    }
  }, [authLoading, session, router, user]);

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
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Kommentarmoderation</h1>
              <div className="flex space-x-2">
                <button 
                  onClick={() => router.push('/admin/moderation/reviews')}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Bewertungen moderieren
                </button>
                <button 
                  onClick={() => router.push('/admin/dashboard')}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Zurück zum Dashboard
                </button>
              </div>
            </div>
            
            <CommentModeration />
          </motion.div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
