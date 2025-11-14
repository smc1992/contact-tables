import { GetServerSideProps } from 'next';
// Head wird durch PageLayout abgedeckt
import Image from 'next/image';
import { FiStar, FiMapPin, FiPhone, FiMail, FiCalendar, FiUsers, FiGlobe } from 'react-icons/fi';
import { useState } from 'react';
import { createClient as createServerSupabase } from '@/utils/supabase/server';
import { createClient as createBrowserClient } from '@/utils/supabase/client';
import ReservationCalendar from '@/components/ReservationCalendar';
import prisma from '@/lib/prisma';
import { Prisma, Restaurant, Event, Rating as Review, Profile, RestaurantImage } from '@prisma/client';
import dynamic from 'next/dynamic';
import PageLayout from '@/components/PageLayout';

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
  const [reserveOpenEventId, setReserveOpenEventId] = useState<string | null>(null);
  const [reservationDate, setReservationDate] = useState<string>('');
  const [reservationTime, setReservationTime] = useState<string>('');
  const [reservationFeedback, setReservationFeedback] = useState<string>('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const supabase = createBrowserClient();
  if (!restaurant) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-xl text-gray-600">Restaurant nicht gefunden.</p>
      </div>
    );
  }

  const mainImage = restaurant.images.find(img => img.isPrimary) || restaurant.images[0];

  // Stelle sicher, dass Koordinaten numerisch sind, bevor sie an die Map übergeben werden
  const lat = restaurant.latitude != null ? Number(restaurant.latitude) : null;
  const lon = restaurant.longitude != null ? Number(restaurant.longitude) : null;
  const confirmReservationAndJoin = async (eventId: string) => {
    if (!reservationDate || !reservationTime) {
      alert('Bitte Datum und Uhrzeit auswählen.');
      return;
    }
    try {
      setIsConfirming(true);
      setError(null);
      setSuccess(null);
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      const userId = authData?.user?.id;
      if (!userId) {
        setError('Bitte melde dich an, um zu bestätigen.');
        setIsConfirming(false);
        return;
      }
      const notes = `Reservierung bestätigt für ${reservationDate} ${reservationTime}.` + (reservationFeedback ? ` Feedback: ${reservationFeedback}` : '');
      const { error: insertError } = await supabase
        .from('participations')
        .insert({ contact_table_id: eventId, user_id: userId, status: 'CONFIRMED', notes } as any);
      if (insertError) throw insertError;
      setSuccess('Reservierung bestätigt und Teilnahme erfasst.');
      setReserveOpenEventId(null);
      setReservationDate('');
      setReservationTime('');
      setReservationFeedback('');
    } catch (e: any) {
      setError(e?.message || 'Es ist ein Fehler bei der Bestätigung aufgetreten.');
    } finally {
      setIsConfirming(false);
    }
  };
  // Map-Item mit minimal erforderlichen Feldern für die Leaflet-Karte
  const mapItem = {
    ...(restaurant as any),
    image_url: mainImage?.url ?? null,
    offer_table_today: false,
    price_range: null,
    latitude: lat,
    longitude: lon,
  } as unknown as RestaurantPageItem;

  return (
    <PageLayout title={`${restaurant.name} - contact-tables`} description={restaurant.description || `Details über das Restaurant ${restaurant.name}`}>
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
                        <span>{event.datetime ? new Date(event.datetime).toLocaleString('de-DE') : 'Aktiv (unbestimmte Zeit)'}</span>
                      </div>
                      <p className="text-sm text-gray-500 mb-3">{event.description}</p>
                      <div className="flex items-center text-gray-600 mb-3">
                        <FiUsers className="mr-2" />
                        <span>{event.maxParticipants} Plätze verfügbar</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                        <a href={`/contact-tables/${event.id}`} className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors text-center">Details anzeigen</a>
                        <button
                          onClick={() => {
                            setReserveOpenEventId(prev => (prev === event.id ? null : event.id));
                            if (event.datetime) {
                              const d = new Date(event.datetime);
                              const y = d.getFullYear();
                              const m = String(d.getMonth() + 1).padStart(2, '0');
                              const da = String(d.getDate()).padStart(2, '0');
                              setReservationDate(`${y}-${m}-${da}`);
                              const hh = String(d.getHours()).padStart(2, '0');
                              const mm = String(d.getMinutes()).padStart(2, '0');
                              setReservationTime(`${hh}:${mm}`);
                            } else {
                              setReservationDate('');
                              setReservationTime('');
                            }
                          }}
                          className="w-full border border-primary-300 text-primary-700 font-medium py-2 px-4 rounded-lg hover:bg-primary-50 transition-colors"
                        >
                          Reservieren
                        </button>
                      </div>
                      {reserveOpenEventId === event.id && (
                        <div className="mt-3 bg-white border border-neutral-200 rounded-lg p-3 text-sm text-neutral-700">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-neutral-700 mb-1">Datum</label>
                              <ReservationCalendar selectedDate={reservationDate || null} availabilityByDate={{}} onSelect={(ymd) => setReservationDate(ymd)} />
                            </div>
                            <div className="flex flex-col">
                              <label className="block text-sm font-medium text-neutral-700 mb-1">Uhrzeit</label>
                              <input type="time" value={reservationTime} onChange={(e) => setReservationTime(e.target.value)} className="border border-neutral-300 rounded px-3 py-2" />
                            </div>
                          </div>
                          <div className="mt-3">
                            <label className="block text-sm font-medium text-neutral-700 mb-1">Nachricht (optional)</label>
                            <textarea value={reservationFeedback} onChange={(e) => setReservationFeedback(e.target.value)} className="w-full border border-neutral-300 rounded p-2" rows={3} />
                          </div>
                          <div className="mt-3 flex gap-2">
                            {restaurant.phone && (
                              <a href={`tel:${restaurant.phone}`} className="inline-flex items-center px-3 py-2 rounded bg-primary-50 text-primary-700 hover:bg-primary-100">
                                <FiPhone className="mr-2" />
                                Anrufen
                              </a>
                            )}
                            {(restaurant.website || (restaurant as any).booking_url) && (
                              <a href={restaurant.website || (restaurant as any).booking_url || undefined} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-2 rounded bg-neutral-100 text-neutral-800 hover:bg-neutral-200">
                                <FiGlobe className="mr-2" />
                                Zur Webseite
                              </a>
                            )}
                            <button onClick={() => confirmReservationAndJoin(event.id)} disabled={isConfirming} className="px-3 py-2 rounded bg-primary-600 text-white">
                              {isConfirming ? 'Bestätige…' : 'Bestätigen'}
                            </button>
                          </div>
                          {error && <p className="mt-2 text-red-600">{error}</p>}
                          {success && <p className="mt-2 text-green-600">{success}</p>}
                        </div>
                      )}
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
                {lat != null && lon != null ? (
                  <div className="h-64 rounded-lg overflow-hidden">
                    <RestaurantMap 
                      restaurants={[mapItem]} 
                      center={{ lat: lat, lng: lon }}
                      height="100%"
                    />
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center bg-gray-100 rounded-lg">
                    <p className="text-gray-500">Keine Standortdaten verfügbar</p>
                  </div>
                )}
                <a href={`https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&to=${lat ?? ''},${lon ?? ''}`} target="_blank" rel="noopener noreferrer" className="mt-4 block w-full text-center bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors">Route planen</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.params || {};

  if (typeof slug !== 'string') {
    return { notFound: true };
  }

  // Enforce visibility and payment gating: allow fetch by slug OR id
  let restaurant: any = null;
  try {
    restaurant = await prisma.restaurant.findFirst({
      where: { OR: [{ slug }, { id: slug }], isActive: true, contractStatus: 'ACTIVE' },
      include: {
        events: true,
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
  } catch (_) {
    restaurant = null;
  }

  if (!restaurant) {
    try {
      const supabase = createServerSupabase(context);
      const slugParam = slug;
      // Versuche Supabase per ID
      let supRestaurant: any = null;
      const { data: rById } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', slugParam)
        .single();
      supRestaurant = rById || null;
      // Falls nicht gefunden: per slug
      if (!supRestaurant) {
        const { data: rBySlug } = await supabase
          .from('restaurants')
          .select('*')
          .eq('slug', slugParam)
          .single();
        supRestaurant = rBySlug || null;
      }
      if (!supRestaurant) {
        return { notFound: true };
      }
      if (typeof slugParam === 'string' && slugParam === supRestaurant.id && supRestaurant.slug) {
        return { redirect: { destination: `/restaurants/${supRestaurant.slug}`, permanent: true } };
      }
      // Minimaldetails aus Supabase
      const { data: ct } = await supabase
        .from('contact_tables')
        .select('id,title,description,datetime,max_participants')
        .eq('restaurant_id', supRestaurant.id)
        .eq('is_public', true);
      const { data: imgs } = await supabase
        .from('restaurant_images')
        .select('url,is_primary')
        .eq('restaurant_id', supRestaurant.id);

      const restaurantWithDetails = {
        id: supRestaurant.id,
        name: supRestaurant.name,
        address: supRestaurant.address,
        city: supRestaurant.city,
        postal_code: supRestaurant.postal_code,
        description: supRestaurant.description || '',
        latitude: supRestaurant.latitude || null,
        longitude: supRestaurant.longitude || null,
        avg_rating: 0,
        total_ratings: 0,
        profile: null,
        ratings: [],
        images: (imgs || []).map((x: any) => ({ url: x.url, isPrimary: x.is_primary })) as any,
        events: (ct || []).map((t: any) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          datetime: t.datetime || null,
          maxParticipants: t.max_participants ?? 0,
        })),
      } as any;

      return {
        props: {
          restaurant: JSON.parse(JSON.stringify(restaurantWithDetails)),
        },
      };
    } catch (_) {
      return { notFound: true };
    }
  }

  // Calculate average rating and total ratings
  const total_ratings = restaurant.ratings.length;
  const avg_rating = total_ratings > 0
    ? (restaurant.ratings as any[]).reduce((acc: number, review: any) => acc + Number(review.value ?? 0), 0) / total_ratings
    : 0;

  const restaurantWithDetails: any = {
    ...restaurant,
    avg_rating: parseFloat(avg_rating.toFixed(1)),
    total_ratings,
  };

  // Ergänze Contact-tables aus Supabase (öffentlich + zum Restaurant gehörig)
  try {
    const supabase = createServerSupabase(context);
    let supRestaurantId: string | null = null;
    if (restaurant.slug) {
      const { data: r1 } = await supabase
        .from('restaurants')
        .select('id')
        .eq('slug', restaurant.slug)
        .single();
      supRestaurantId = (r1 as any)?.id ?? null;
    }
    if (!supRestaurantId && restaurant.name) {
      const { data: r2 } = await supabase
        .from('restaurants')
        .select('id')
        .eq('name', restaurant.name)
        .single();
      supRestaurantId = (r2 as any)?.id ?? null;
    }

    const { data: ct } = supRestaurantId
      ? await supabase
          .from('contact_tables')
          .select('id,title,description,datetime,max_participants')
          .eq('restaurant_id', supRestaurantId)
          .eq('is_public', true)
      : { data: [] as any[] };
    const mapped = (ct || []).map((t: any) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      datetime: t.datetime || null,
      maxParticipants: t.max_participants ?? 0,
    }));
    const prismaEvents = (restaurantWithDetails.events || []).map((e: any) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      datetime: e.datetime || null,
      maxParticipants: e.maxParticipants ?? e.max_participants ?? 0,
    }));
    restaurantWithDetails.events = [...prismaEvents, ...mapped];
  } catch (_) {
    // still fine; zeige Prisma-Events
  }

  // Fallback: Geokodierung über OpenStreetMap/Nominatim, falls keine Koordinaten vorhanden
  if ((!restaurantWithDetails.latitude || !restaurantWithDetails.longitude) && (restaurant.address || restaurant.city || (restaurant as any).postalCode)) {
    try {
      const queryAddress = [restaurant.address, (restaurant as any).postalCode, restaurant.city].filter(Boolean).join(', ');
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(queryAddress)}&format=json&limit=1`);
      if (geoRes.ok) {
        const geoResults = await geoRes.json();
        if (Array.isArray(geoResults) && geoResults.length > 0) {
          const { lat, lon } = geoResults[0];
          restaurantWithDetails.latitude = Number(lat);
          restaurantWithDetails.longitude = Number(lon);
        }
      }
    } catch (e) {
      // Bei Fehlern einfach ohne Koordinaten weiter – die Karte bleibt dann ausgeblendet
      console.warn('Geocoding fehlgeschlagen:', e);
    }
  }

  // Sicherstellen, dass vorhandene Koordinaten als Zahlen vorliegen (z. B. Prisma Decimal/String)
  if (restaurantWithDetails.latitude != null) {
    restaurantWithDetails.latitude = Number(restaurantWithDetails.latitude as any);
  }
  if (restaurantWithDetails.longitude != null) {
    restaurantWithDetails.longitude = Number(restaurantWithDetails.longitude as any);
  }

  return {
    props: {
      restaurant: JSON.parse(JSON.stringify(restaurantWithDetails)),
    },
  };
};

export default RestaurantDetailPage;