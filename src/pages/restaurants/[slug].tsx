import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import { FiStar, FiMapPin, FiPhone, FiMail, FiCalendar, FiUsers } from 'react-icons/fi';
import prisma from '@/lib/prisma';
import { Prisma, Restaurant, Event, Rating as Review, Profile, RestaurantImage } from '@prisma/client';
import dynamic from 'next/dynamic';

// Dynamically import the map component to avoid SSR issues
const RestaurantMap = dynamic(
  () => import('@/components/RestaurantMap'),
  { 
    ssr: false,
    loading: () => <div className="h-64 w-full bg-gray-200 flex items-center justify-center rounded-lg"><p>Kartenansicht wird geladen...</p></div>
  }
);

type RestaurantWithDetails = Prisma.RestaurantGetPayload<{
  include: {
    profile: true;
    events: true;
    images: true;
    ratings: { include: { profile: true } };
  };
}>;

interface RestaurantDetailProps {
  restaurant: RestaurantWithDetails & { 
    avg_rating: number;
    total_ratings: number;
  };
}

// This is a placeholder type. You might need to adjust it based on the actual type definition.
// I'm adding the missing fields to satisfy the linter for now.
type RestaurantPageItem = RestaurantWithDetails & {
  avg_rating: number;
  total_ratings: number;
  image_url: string | null;
  offer_table_today: boolean;
  price_range: string | null;
};

const RestaurantDetailPage: React.FC<RestaurantDetailProps> = ({ restaurant }) => {
  if (!restaurant) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-xl text-gray-600">Restaurant nicht gefunden.</p>
      </div>
    );
  }

  const mainImage = restaurant.images.find(img => img.isPrimary) || restaurant.images[0];

  return (
    <>
      <Head>
        <title>{restaurant.name} - contact-tables</title>
        <meta name="description" content={restaurant.description || `Details über das Restaurant ${restaurant.name}`} />
      </Head>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">{restaurant.name}</h1>
                  {restaurant.profile && <p className="text-sm text-gray-500 mt-1">Inhaber: {restaurant.profile.name}</p>}
                </div>
                <div className="flex items-center mt-2 md:mt-0">
                  <FiStar className="text-yellow-500 mr-1" />
                  {(() => {
                    const r = Number(restaurant.avg_rating ?? 0);
                    const t = Number(restaurant.total_ratings ?? 0);
                    return (
                      <>
                        <span className="text-lg font-semibold text-gray-700">{(isNaN(r) ? 0 : r).toFixed(1)}</span>
                        <span className="text-sm text-gray-500 ml-2">({isNaN(t) ? 0 : t} Bewertungen)</span>
                      </>
                    );
                  })()}
                </div>
              </div>

              {mainImage && (
                <div className="w-full h-96 relative rounded-lg overflow-hidden mb-6">
                  <Image 
                    src={mainImage.url}
                    alt={restaurant.name}
                    layout="fill"
                    objectFit="cover"
                    className="transition-transform duration-300 hover:scale-105"
                  />
                </div>
              )}

              <div className="prose max-w-none text-gray-600">
                <p>{restaurant.description}</p>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
              <h3 className="text-xl font-semibold mb-4">Bewertungen</h3>
              {restaurant.ratings.length > 0 ? (
                <div className="space-y-4">
                  {restaurant.ratings.map((review) => (
                    <div key={review.id} className="border-b pb-4">
                      <div className="flex items-center mb-2">
                        <p className="font-semibold mr-2">{review.profile.name || 'Anonym'}</p>
                        <div className="flex items-center">
                          {(() => {
                            const val = Math.max(0, Math.min(5, Number(review.value ?? 0)));
                            return [...Array(5)].map((_, i) => (
                              <FiStar key={i} className={i < val ? 'text-yellow-500' : 'text-gray-300'} />
                            ));
                          })()}
                        </div>
                      </div>
                      <p className="text-gray-600">{review.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Noch keine Bewertungen vorhanden.</p>
              )}
            </div>

            {/* Events Section */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-4">Kommende contact-tables</h3>
              {restaurant.events.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {restaurant.events.map(event => (
                    <div key={event.id} className="border p-4 rounded-lg">
                      <h4 className="font-bold text-lg">{event.title}</h4>
                      <div className="flex items-center text-gray-600 my-2">
                        <FiCalendar className="mr-2" />
                        <span>{new Date(event.datetime).toLocaleString('de-DE')}</span>
                      </div>
                      <p className="text-sm text-gray-500 mb-3">{event.description}</p>
                      <div className="flex items-center text-gray-600 mb-3">
                        <FiUsers className="mr-2" />
                        <span>{event.maxParticipants} Plätze verfügbar</span>
                      </div>
                      <button className="w-full mt-2 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors">Details anzeigen & Anmelden</button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Derzeit keine contact-tables geplant.</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-4">Kontakt & Adresse</h3>
                <div className="space-y-3 text-gray-700">
                  <p className="flex items-center"><FiMapPin className="mr-3" /> {restaurant.address}, {restaurant.postal_code} {restaurant.city}</p>
                  {restaurant.phone && <p className="flex items-center"><FiPhone className="mr-3" /> {restaurant.phone}</p>}
                  {restaurant.email && <p className="flex items-center"><FiMail className="mr-3" /> {restaurant.email}</p>}
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm sticky top-60">
                <h3 className="text-xl font-semibold mb-4">Standort</h3>
                {restaurant.latitude && restaurant.longitude ? (
                  <div className="h-64 rounded-lg overflow-hidden">
                    <RestaurantMap 
                      restaurants={[restaurant as unknown as RestaurantPageItem]} 
                      center={{ lat: restaurant.latitude, lng: restaurant.longitude }}
                      height="100%"
                    />
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center bg-gray-100 rounded-lg">
                    <p className="text-gray-500">Keine Standortdaten verfügbar</p>
                  </div>
                )}
                <a href={`https://www.google.com/maps/dir/?api=1&destination=${restaurant.latitude},${restaurant.longitude}`} target="_blank" rel="noopener noreferrer" className="mt-4 block w-full text-center bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors">Route planen</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.params || {};

  if (typeof slug !== 'string') {
    return { notFound: true };
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    include: {
      events: {
        where: {
          datetime: { gte: new Date() },
        },
        orderBy: { datetime: 'asc' },
      },
      images: true,
      profile: true,
      ratings: {
        include: {
          profile: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!restaurant) {
    return { notFound: true };
  }

  // Calculate average rating and total ratings
  const total_ratings = restaurant.ratings.length;
  const avg_rating = total_ratings > 0
    ? restaurant.ratings.reduce((acc, review) => acc + review.value, 0) / total_ratings
    : 0;

  const restaurantWithDetails = {
    ...restaurant,
    avg_rating: parseFloat(avg_rating.toFixed(1)),
    total_ratings,
  };

  return {
    props: {
      restaurant: JSON.parse(JSON.stringify(restaurantWithDetails)),
    },
  };
};

export default RestaurantDetailPage;