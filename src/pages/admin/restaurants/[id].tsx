import { useRouter } from 'next/router';
import { useState } from 'react';
import { GetServerSidePropsContext } from 'next';
import { User } from '@supabase/supabase-js';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { motion } from 'framer-motion';
import AdminSidebar from '../../../components/AdminSidebar';
import RestaurantDetails from '../../../components/admin/RestaurantDetails';
import { withAuth } from '@/utils/withAuth';

interface AdminRestaurantDetailsPageProps {
  user: User;
}

function AdminRestaurantDetailsPage({ user }: AdminRestaurantDetailsPageProps) {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(!id);
  
  if (loading) {
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
        <AdminSidebar activeItem="restaurants" />
        
        <main className="flex-grow bg-gray-50 py-6 px-4 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Restaurant-Details</h1>
              <button 
                onClick={() => router.back()}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Zurück
              </button>
            </div>
            
            <RestaurantDetails restaurantId={id as string} />
          </motion.div>
        </main>
      </div>
      <Footer />
    </div>
  );
}

// Wrapper für getServerSideProps mit withAuth
export const getServerSideProps = withAuth(['admin', 'ADMIN'], async (context: GetServerSidePropsContext, user: User) => {
  // Hier könnten zusätzliche Daten für die Restaurant-Detailseite geladen werden
  return {
    props: {}
  };
});

export default AdminRestaurantDetailsPage;
