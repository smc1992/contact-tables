import { useState } from 'react';

import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { GetServerSideProps, GetServerSidePropsContext } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { withAuth } from '@/utils/withAuth';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import RestaurantSidebar from '@/components/restaurant/RestaurantSidebar';
import { type Database } from '@/types/supabase';

type Reservation = Database['public']['Tables']['contact_tables']['Row'];
type Restaurant = Database['public']['Tables']['restaurants']['Row'];

interface ReservationsPageProps {
  restaurant: Restaurant;
  initialReservations: Reservation[];
  error?: string;
}

const ReservationsPage = ({ restaurant, initialReservations, error: serverError }: ReservationsPageProps) => {
  const [reservations, setReservations] = useState<Reservation[]>(initialReservations);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(serverError || '');

    return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <div className="flex flex-1 pt-16">
        <RestaurantSidebar activeItem="reservations" />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Ihre Reservierungen</h1>
            
            {loading && <p>Reservierungen werden geladen...</p>}
            {error && <p className="text-red-500">{error}</p>}

            {!loading && !error && reservations.length > 0 && (
              <div className="mt-4 overflow-x-auto">
                <div className="inline-block min-w-full shadow rounded-lg overflow-hidden">
                  <table className="min-w-full leading-normal">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Titel</th>
                        <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Datum</th>
                        <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Uhrzeit</th>
                        <th className="px-5 py-3 border-b-2 border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Preis</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {reservations.map((reservation: Reservation) => (
                        <tr key={reservation.id}>
                          <td className="px-5 py-5 border-b border-gray-200 text-sm">{reservation.title}</td>
                          <td className="px-5 py-5 border-b border-gray-200 text-sm">{new Date(reservation.datetime).toLocaleDateString('de-DE')}</td>
                          <td className="px-5 py-5 border-b border-gray-200 text-sm">{new Date(reservation.datetime).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</td>
                          <td className="px-5 py-5 border-b border-gray-200 text-sm">{reservation.price} €</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {!loading && reservations.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">Sie haben noch keine Reservierungen.</p>
              </div>
            )}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default ReservationsPage;

export const getServerSideProps: GetServerSideProps = withAuth('RESTAURANT', async (context, user) => {
  const supabase = createServerSupabaseClient(context);

  const { data: restaurant, error: restaurantError } = await supabase
    .from('restaurants')
    .select('id, name')
    .eq('userId', user.id)
    .single();

  if (restaurantError || !restaurant) {
    console.error(`Redirecting: No restaurant found for user ${user.id}`, restaurantError);
    return {
      redirect: {
        destination: '/restaurant/registration?error=noprofile',
        permanent: false,
      },
    };
  }

  const { data: initialReservations, error: reservationsError } = await supabase
    .from('contact_tables')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .order('datetime', { ascending: false });

  if (reservationsError) {
    console.error('Error fetching reservations on page:', reservationsError.message);
    // On error, return the page with an empty array of reservations
    // This prevents a crash and allows the page to render.
    return {
      props: {
        restaurant,
        initialReservations: [],
        error: `Fehler beim Laden der Reservierungen: ${reservationsError.message}`,
      },
    };
  }

    return {
    props: {
      restaurant,
      initialReservations: initialReservations || [],
    },
  };
});
