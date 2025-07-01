import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import RestaurantSidebar from '@/components/restaurant/RestaurantSidebar';
import { type Database } from '@/types/supabase';

type Reservation = Database['public']['Tables']['contact_tables']['Row'];
type Restaurant = Database['public']['Tables']['restaurants']['Row'];

interface ReservationsPageProps {
  restaurant: Restaurant;
}

const ReservationsPage = ({ restaurant }: ReservationsPageProps) => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (restaurant) {
      const fetchReservations = async () => {
        setLoading(true);
        try {
          const response = await fetch(`/api/restaurant/reservations?restaurantId=${restaurant.id}`);
          if (!response.ok) {
            throw new Error('Fehler beim Abrufen der Reservierungen');
          }
          const data = await response.json();
          setReservations(data);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchReservations();
    }
  }, [restaurant]);

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

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => ctx.req.cookies[name],
        set: (name: string, value: string, options: CookieOptions) => {
          // res.setHeader('Set-Cookie', ...)
        },
        remove: (name: string, options: CookieOptions) => {
          // res.setHeader('Set-Cookie', ...)
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: false,
      },
    };
  }

  const { data: restaurant, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('userId', user.id)
    .single();

  if (error || !restaurant) {
    return {
      redirect: {
        destination: '/restaurant/register',
        permanent: false,
      },
    };
  }

  return {
    props: {
      restaurant,
    },
  };
};
