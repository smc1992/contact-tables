import { GetServerSideProps } from 'next';
import { motion } from 'framer-motion';
import { FiMapPin, FiPhone, FiClock, FiGlobe, FiStar, FiCalendar, FiUsers } from 'react-icons/fi';
import PageLayout from '../../components/PageLayout';
import { createClient } from '../../utils/supabase/server';
import { Database } from '../../types/supabase';

type Restaurant = Database['public']['Tables']['restaurants']['Row'];
type Rating = Database['public']['Tables']['ratings']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type Event = Database['public']['Tables']['contact_tables']['Row'];

type RatingWithProfile = Rating & {
  profiles: Pick<Profile, 'id' | 'name'> | null;
};

interface RestaurantWithDetails extends Restaurant {
  ratings: RatingWithProfile[];
  events: Event[];
  average_rating: number;
  rating_count: number;
}

interface RestaurantDetailProps {
  restaurant: RestaurantWithDetails | null;
  error?: string;
}

export default function RestaurantDetail({ restaurant, error }: RestaurantDetailProps) {
  if (error || !restaurant) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold text-red-600">Fehler</h1>
          <p className="mt-4 text-gray-700">{error || 'Das gesuchte Restaurant konnte nicht gefunden werden.'}</p>
        </div>
      </PageLayout>
    );
  }
  
  return (
    <PageLayout>
      <section className="relative h-64 md:h-80 bg-gray-800 -mt-8">
        <img
          src={restaurant.image_url || '/images/default-restaurant.jpg'}
          alt={`Bild von ${restaurant.name}`}
          className="w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-6 md:p-8 container mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{restaurant.name}</h1>
            <div className="flex items-center text-white/90">
              <FiMapPin className="mr-2" />
              <span>{restaurant.address}, {restaurant.city}</span>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-2xl font-semibold mb-4">Über uns</h2>
              <p className="text-gray-700 leading-relaxed">{restaurant.description}</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-2xl font-semibold mb-4">Bewertungen</h2>
              <div className="flex items-center mb-6">
                <div className="bg-primary-100 text-primary-800 px-4 py-3 rounded-lg text-center mr-4">
                  <div className="text-3xl font-bold">{restaurant.average_rating.toFixed(1)}</div>
                  <div className="text-sm">von 5</div>
                </div>
                <div>
                  <div className="text-yellow-500 flex mb-1">
                    {[...Array(5)].map((_, i) => (
                      <FiStar key={i} className={`w-5 h-5 ${i < Math.round(restaurant.average_rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600">Basierend auf {restaurant.rating_count} Bewertungen</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {restaurant.ratings.map((review) => (
                  <div key={review.id} className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium">{review.profiles?.name || 'Anonym'}</span>
                      <div className="flex items-center text-yellow-500">
                        {[...Array(5)].map((_, i) => (
                          <FiStar key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                        ))}
                      </div>
                    </div>
                    {review.comment && (<p className="text-gray-600">{review.comment}</p>)}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
               <h3 className="text-2xl font-semibold border-b pb-2 mb-4">Kommende Events</h3>
                {restaurant.events.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    {restaurant.events.map((event) => (
                      <div key={event.id} className="bg-gray-50 p-4 rounded-lg border hover:shadow-lg transition-shadow">
                        <h4 className="font-bold text-lg text-primary-700">{event.title}</h4>
                        <div className="flex items-center text-gray-600 my-2">
                          <FiCalendar className="mr-2" />
                          <span className="ml-2">{new Date(event.datetime).toLocaleString('de-DE')}</span>
                        </div>
                        <p className="text-sm text-gray-500 mb-3">{event.description}</p>
                        <div className="flex items-center text-gray-600 mb-3">
                          <FiUsers className="mr-2" />
                          <span>{event.max_participants} Plätze verfügbar</span>
                        </div>
                        <button className="w-full mt-2 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors">Details anzeigen & Anmelden</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">Derzeit sind keine Events in diesem Restaurant geplant.</p>
                )}
            </div>
          </div>

          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-sm sticky top-4">
              <h3 className="text-xl font-semibold mb-4">Informationen</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-center"><FiMapPin className="mr-3 text-primary-600" /> {restaurant.address}, {restaurant.postal_code} {restaurant.city}</li>
                {restaurant.phone && <li className="flex items-center"><FiPhone className="mr-3 text-primary-600" /> {restaurant.phone}</li>}
                {restaurant.website && <li className="flex items-center"><FiGlobe className="mr-3 text-primary-600" /> <a href={restaurant.website} target="_blank" rel="noopener noreferrer" className="hover:underline">{restaurant.website}</a></li>}
                {restaurant.opening_hours && <li className="flex items-center"><FiClock className="mr-3 text-primary-600" /> {restaurant.opening_hours}</li>}
              </ul>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm sticky top-60">
               <h3 className="text-xl font-semibold mb-4">Standort</h3>
               <div className="h-64 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">Kartenansicht</div>
                <a href={`https://www.google.com/maps/dir/?api=1&destination=${restaurant.latitude},${restaurant.longitude}`} target="_blank" rel="noopener noreferrer" className="mt-4 block w-full text-center bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors">Route planen</a>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

export const getServerSideProps: GetServerSideProps<RestaurantDetailProps> = async (context) => {
  const { id } = context.params || {};
  const supabase = createClient(context);

  if (typeof id !== 'string') {
    return { notFound: true };
  }

  try {
    const { data: restaurant, error: restaurantError } = await supabase.from('restaurants').select('*').eq('id', id).single();

    if (restaurantError || !restaurant) {
      console.error(`Error fetching restaurant with id ${id}:`, restaurantError);
      return { props: { restaurant: null, error: 'Restaurant nicht gefunden.' } };
    }

    const { data: eventsData, error: eventsError } = await supabase
      .from('contact_tables')
      .select('*')
      .eq('restaurant_id', id)
      .gte('datetime', new Date().toISOString())
      .order('datetime', { ascending: true });
    const events = eventsData || [];
    if (eventsError) {
      console.error(`Error fetching events for restaurant ${id}:`, eventsError);
    }

    const { data: fetchedRatings, error: ratingsError } = await supabase
      .from('ratings')
      .select('*, profiles(id, name)')
      .eq('restaurant_id', id);
    const ratings = (fetchedRatings as RatingWithProfile[]) || [];
    if (ratingsError) {
        console.error(`Error fetching ratings for restaurant ${id}:`, ratingsError);
    }

    const rating_count = ratings.length;
    const average_rating = rating_count > 0 ? ratings.reduce((acc, r) => acc + r.rating, 0) / rating_count : 0;

    const restaurantWithDetails: RestaurantWithDetails = {
      ...restaurant,
      ratings,
      events,
      rating_count,
      average_rating,
    };

    return { props: { restaurant: restaurantWithDetails } };
  } catch (error) {
    console.error(`Error fetching restaurant details for id: ${id}`, error);
    return { props: { restaurant: null, error: 'Ein unerwarteter Fehler ist aufgetreten.' } };
  }
};