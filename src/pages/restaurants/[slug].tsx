import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
// Head wird durch PageLayout abgedeckt
import Image from 'next/image';
import { FiStar, FiMapPin, FiPhone, FiMail, FiCalendar, FiUsers, FiGlobe } from 'react-icons/fi';
import { useState, useMemo, useEffect } from 'react';
import { createClient as createServerSupabase } from '@/utils/supabase/server';
import { createClient as createBrowserClient } from '@/utils/supabase/client';
import ReservationCalendar, { ParticipantInfo } from '@/components/ReservationCalendar';
import prisma from '@/lib/prisma';
import { Prisma, Restaurant, Event, Rating as Review, Profile, RestaurantImage } from '@prisma/client';
import dynamic from 'next/dynamic';
import PageLayout from '@/components/PageLayout';
import { v4 as uuidv4 } from 'uuid';

// Dynamically import the map component to avoid SSR issues
const RestaurantMap = dynamic(
  () => import('@/components/RestaurantMap'),
  { 
    ssr: false,
    loading: () => <div className="h-64 w-full bg-gray-200 flex items-center justify-center rounded-lg"><p>Kartenansicht wird geladen...</p></div>
  }
);

function parseOpeningHours(json: string | null | undefined) {
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function isRestaurantOpen(date: Date, openingHours: any): boolean {
  if (!openingHours) return true; 
  const day = date.getDay();
  const hours = openingHours[String(day)];
  return Array.isArray(hours) && hours.length > 0;
}

function getOpeningTimes(date: Date, openingHours: any): { start: string, end: string }[] {
  if (!openingHours) return [];
  const day = date.getDay();
  const hours = openingHours[String(day)];
  if (!Array.isArray(hours)) return [];
  return hours.map((h: any) => ({ start: h.open, end: h.close }));
}

function generateTimeSlots(start: string, end: string): string[] {
  const slots: string[] = [];
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  
  let current = startH * 60 + startM;
  const endLimit = endH * 60 + endM;

  while (current <= endLimit) {
    const h = Math.floor(current / 60);
    const m = current % 60;
    const hh = String(h).padStart(2, '0');
    const mm = String(m).padStart(2, '0');
    slots.push(`${hh}:${mm}`);
    current += 30;
  }
  return slots;
}

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
  const router = useRouter();
  const [reserveOpenEventId, setReserveOpenEventId] = useState<string | null>(null);
  const [reservationDate, setReservationDate] = useState<string>('');
  const [reservationTime, setReservationTime] = useState<string>('');
  const [reservationFeedback, setReservationFeedback] = useState<string>('');
  const [quickReserveDate, setQuickReserveDate] = useState<string>('');
  const [quickReserveTime, setQuickReserveTime] = useState<string>('');
  const [quickReserveEventId, setQuickReserveEventId] = useState<string | null>(null);
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
  const openingHours = useMemo(() => parseOpeningHours((restaurant as any).opening_hours || (restaurant as any).openingHours), [restaurant]);

  // Stelle sicher, dass Koordinaten numerisch sind, bevor sie an die Map übergeben werden
  const lat = restaurant.latitude != null ? Number(restaurant.latitude) : null;
  const lon = restaurant.longitude != null ? Number(restaurant.longitude) : null;
  const [showCallModal, setShowCallModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleJoinClick = async () => {
    if (!quickReserveEventId) { alert('Bitte Termin wählen.'); return; }
    if (!quickReserveDate || !quickReserveTime) { alert('Bitte Datum und Uhrzeit wählen.'); return; }
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    // Prüfen, ob ein Datum gewählt wurde (kein unbestimmter Termin)
    // und das Event ein unbestimmtes "Contact Table" Event ist
    const event = (restaurant.events || []).find((e: any) => e.id === quickReserveEventId);
    if (event && !event.datetime) {
      setShowCallModal(true);
    } else {
      setReservationDate(quickReserveDate);
      setReservationTime(quickReserveTime);
      confirmReservationAndJoin(quickReserveEventId);
    }
  };

  const confirmCallAndJoin = () => {
    setShowCallModal(false);
    setReservationDate(quickReserveDate);
    setReservationTime(quickReserveTime);
    confirmReservationAndJoin(quickReserveEventId!);
  };

  const confirmReservationAndJoin = async (eventId: string) => {
    if (!quickReserveDate || !quickReserveTime) {
      // Fallback auf state values falls nicht direkt verfügbar, 
      // aber eigentlich sollten quickReserve* genutzt werden
      if (!reservationDate || !reservationTime) {
         alert('Bitte Datum und Uhrzeit auswählen.');
         return;
      }
    }
    
    // Use quickReserve values if available, otherwise fallback
    const dateToUse = quickReserveDate || reservationDate;
    const timeToUse = quickReserveTime || reservationTime;

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
      const message = `Reservierung bestätigt für ${dateToUse} ${timeToUse}.` + (reservationFeedback ? ` Feedback: ${reservationFeedback}` : '');
      const { error: insertError } = await supabase
        .from('participations')
        .insert({ 
          id: uuidv4(), 
          event_id: eventId, 
          user_id: userId, 
          message,
          reservation_date: dateToUse,
          updated_at: new Date().toISOString()
        } as any);
      if (insertError) throw insertError;
      setSuccess('Reservierung bestätigt und Teilnahme erfasst.');
      setReserveOpenEventId(null);
      setReservationDate('');
      setReservationTime('');
      setReservationFeedback('');
      
      // Refresh data to show updated participant count immediately
      router.replace(router.asPath);
    } catch (e: any) {
      if (e?.code === '23505') {
        setSuccess('Du nimmst bereits an diesem Termin teil.');
        // Optional: clear form even if it was a duplicate, to reset UI
        setReserveOpenEventId(null);
        setReservationDate('');
        setReservationTime('');
        setReservationFeedback('');
      } else {
        setError(e?.message || 'Es ist ein Fehler bei der Bestätigung aufgetreten.');
      }
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

  const availabilityByDate = useMemo(() => {
    const counts: Record<string, number> = {};
    const indefiniteEvents = (restaurant.events || []).filter((ev: any) => !ev.datetime);
    
    // 1. Specific date events
    (restaurant.events || []).forEach((ev: any) => {
      if (!ev?.datetime) return;
      const d = new Date(ev.datetime);
      if (isNaN(d.getTime())) return;
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const da = String(d.getDate()).padStart(2, '0');
      const key = `${y}-${m}-${da}`;
      
      const max = ev.maxParticipants || 0;
      const current = (ev.participants || []).length;
      const remaining = Math.max(0, max - current);
      
      // If multiple events on same day, sum up availability? Or just show max available?
      // Usually one event per time slot, but calendar shows per day. 
      // Let's sum up available spots for the day.
      counts[key] = (counts[key] || 0) + remaining;
    });

    // 2. Indefinite events (project onto next 90 days)
    if (indefiniteEvents.length > 0) {
      const today = new Date();
      for (let i = 0; i < 90; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const da = String(d.getDate()).padStart(2, '0');
        const key = `${y}-${m}-${da}`;
        
        // For indefinite events, we need to check if there are participants for this specific calculated date
        // Since indefinite events don't have a specific date in DB, participants likely have reservation_date
        // But the 'ev' object here is the generic template.
        // We need to look up participants for this date across all indefinite events.
        
        let dailyIndefiniteAvailability = 0;
        indefiniteEvents.forEach((ev: any) => {
           const max = ev.maxParticipants || 0;
           // Find participants for this specific date linked to this event
           const participantsForDay = (ev.participants || []).filter((p: any) => {
              if (!p.reservation_date) return false;
              const pDate = new Date(p.reservation_date);
              const pY = pDate.getFullYear();
              const pM = String(pDate.getMonth() + 1).padStart(2, '0');
              const pD = String(pDate.getDate()).padStart(2, '0');
              return `${pY}-${pM}-${pD}` === key;
           });
           
           const remaining = Math.max(0, max - participantsForDay.length);
           dailyIndefiniteAvailability += remaining;
        });

        // If specific events already added availability, this adds on top.
        // Assuming indefinite events run in parallel to specific events if any.
        counts[key] = (counts[key] || 0) + dailyIndefiniteAvailability;
      }
    }

    return counts;
  }, [restaurant.events]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    const indefiniteEvents = (restaurant.events || []).filter((ev: any) => !ev.datetime);

    // 1. Specific date events
    (restaurant.events || []).forEach((ev: any) => {
      if (!ev?.datetime) return;
      const d = new Date(ev.datetime);
      if (isNaN(d.getTime())) return;
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const da = String(d.getDate()).padStart(2, '0');
      const key = `${y}-${m}-${da}`;
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    });

    // 2. Indefinite events (project onto next 90 days)
    if (indefiniteEvents.length > 0) {
      const today = new Date();
      for (let i = 0; i < 90; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const da = String(d.getDate()).padStart(2, '0');
        const key = `${y}-${m}-${da}`;
        if (!map[key]) map[key] = [];
        // Avoid duplicates if reference is same, but spread is fine here
        map[key].push(...indefiniteEvents);
      }
    }

    return map;
  }, [restaurant.events]);

  const participantsByDate = useMemo(() => {
    const data: Record<string, Array<{ time: string; name: string }>> = {};
    (restaurant.events || []).forEach((ev: any) => {
      const eventDate = ev.datetime ? new Date(ev.datetime).toISOString().split('T')[0] : null;
      
      // Helper to extract name safely
      const getName = (p: any) => {
        return p.profile?.firstName || p.profile?.name || 'Gast';
      };

      if (eventDate && ev.datetime) {
         const d = new Date(ev.datetime);
         const hh = String(d.getHours()).padStart(2, '0');
         const mm = String(d.getMinutes()).padStart(2, '0');
         const time = `${hh}:${mm}`;
         if (!data[eventDate]) data[eventDate] = [];
         
         (ev.participants || []).forEach((p: any) => {
            data[eventDate].push({ time, name: getName(p) });
         });
      } else {
         // Indefinite events logic
         (ev.participants || []).forEach((p: any) => {
            const rDate = p.reservation_date || p.reservationDate;
            if (rDate) {
               let dStr = '';
               if (typeof rDate === 'string') {
                  dStr = rDate.substring(0, 10);
               } else if (rDate instanceof Date) {
                  dStr = rDate.toISOString().split('T')[0];
               }
               if (dStr) {
                 if (!data[dStr]) data[dStr] = [];
                 const msg = p.message || '';
                 // Match HH:MM pattern
                 const match = msg.match(/(\d{2}:\d{2})/);
                 const time = match ? match[1] : '??:??';
                 data[dStr].push({ time, name: getName(p) });
               }
            }
         });
      }
    });
    return data;
  }, [restaurant.events]);

  const quickTimeSuggestions = useMemo(() => {
    if (!quickReserveDate) return ['17:00', '18:00', '19:00', '20:00'];
    
    if (openingHours) {
      const d = new Date(quickReserveDate);
      const times = getOpeningTimes(d, openingHours);
      if (times.length > 0) {
        const allSlots: string[] = [];
        times.forEach(t => {
          allSlots.push(...generateTimeSlots(t.start, t.end));
        });
        let slots = Array.from(new Set(allSlots)).sort();
        
        // Filter past times if selected date is today
        const now = new Date();
        const selectedDate = new Date(quickReserveDate);
        // Reset hours to compare dates only
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const target = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        
        if (target.getTime() === today.getTime()) {
           const currentHm = now.getHours() * 60 + now.getMinutes();
           slots = slots.filter(s => {
              const [h, m] = s.split(':').map(Number);
              return (h * 60 + m) > currentHm;
           });
        }
        return slots;
      }
    }
    return ['17:00', '18:00', '19:00', '20:00'];
  }, [quickReserveDate, openingHours]);

  const allUpcomingEvents = useMemo(() => {
    const list = (restaurant.events || []).filter((ev: any) => {
      const d = new Date(ev?.datetime);
      return ev?.datetime && !isNaN(d.getTime()) && d >= new Date();
    });
    return list.sort((a: any, b: any) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
  }, [restaurant.events]);

  // Auto-select event if "indefinite" table exists or matches time
  useEffect(() => {
    if (!quickReserveDate) return;
    
    // 1. Try to find exact match if time is set
    if (quickReserveTime) {
       const pool = eventsByDate[quickReserveDate] || [];
       const exact = pool.find((ev: any) => {
         if (!ev.datetime) return false;
         const d = new Date(ev.datetime);
         const hh = String(d.getHours()).padStart(2, '0');
         const mm = String(d.getMinutes()).padStart(2, '0');
         return `${hh}:${mm}` === quickReserveTime;
       });
       if (exact) {
         setQuickReserveEventId(exact.id);
         return;
       }
    }

    // 2. Fallback to indefinite event (Contact Table)
    // Only if no specific event is selected or if we want to default to indefinite
    if (!quickReserveEventId) {
      const indefinite = (restaurant.events || []).find((ev: any) => !ev.datetime);
      if (indefinite) {
        setQuickReserveEventId(indefinite.id);
      }
    }
  }, [quickReserveDate, quickReserveTime, eventsByDate, restaurant.events, quickReserveEventId]);

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

            <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
              <h3 className="text-xl font-semibold mb-4">Jetzt reservieren</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <ReservationCalendar 
                    selectedDate={quickReserveDate || null} 
                    availabilityByDate={availabilityByDate} 
                    participantsByDate={participantsByDate}
                    onSelect={(ymd) => { setQuickReserveDate(ymd); setQuickReserveEventId(null); }} 
                    isDateDisabled={(d) => openingHours ? !isRestaurantOpen(d, openingHours) : false}
                  />
                  {quickReserveDate && participantsByDate[quickReserveDate] && participantsByDate[quickReserveDate].length > 0 && (
                    <div className="mt-4 p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                      <h4 className="font-semibold text-sm mb-2 text-neutral-700">Bereits dabei am {new Date(quickReserveDate).toLocaleDateString('de-DE')}:</h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(
                          participantsByDate[quickReserveDate].reduce((acc, p) => {
                            const time = p.time;
                            acc[time] = (acc[time] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
                        ).sort().map(([time, count]) => (
                          <span key={time} className="px-2 py-1 bg-white border border-neutral-200 rounded text-xs text-neutral-600 shadow-sm">
                            {time} Uhr: <strong>{count}</strong> {count === 1 ? 'Person' : 'Personen'}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex flex-col">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Uhrzeit</label>
                  <input type="time" value={quickReserveTime} onChange={(e) => setQuickReserveTime(e.target.value)} className="border border-neutral-300 rounded px-3 py-2" />
                  <div className="mt-2 flex flex-wrap gap-2">
                    {quickTimeSuggestions.map((t) => (
                      <button key={t} type="button" onClick={() => setQuickReserveTime(t)} className={`px-2 py-1 rounded border text-xs ${quickReserveTime===t ? 'bg-primary-600 text-white border-primary-600' : 'border-neutral-300 text-neutral-700 hover:bg-neutral-100'}`}>{t}</button>
                    ))}
                  </div>
                  {(!quickReserveEventId || (restaurant.events.find(e => e.id === quickReserveEventId)?.datetime)) && (
                    <>
                      <label className="block text-sm font-medium text-neutral-700 mb-2 mt-4">Termin</label>
                      <select
                        value={quickReserveEventId || ''}
                        onChange={(e) => {
                          const id = e.target.value || null;
                          setQuickReserveEventId(id);
                          const pool = (eventsByDate[quickReserveDate] || allUpcomingEvents);
                          const ev = pool.find((x: any) => x.id === id);
                          if (ev && ev.datetime) {
                            const d = new Date(ev.datetime);
                            const y = d.getFullYear();
                            const m = String(d.getMonth() + 1).padStart(2, '0');
                            const da = String(d.getDate()).padStart(2, '0');
                            setQuickReserveDate(`${y}-${m}-${da}`);
                            const hh = String(d.getHours()).padStart(2, '0');
                            const mm = String(d.getMinutes()).padStart(2, '0');
                            setQuickReserveTime(`${hh}:${mm}`);
                          }
                        }}
                        className="border border-neutral-300 rounded px-3 py-2"
                      >
                        <option value="">Bitte Termin wählen</option>
                        {((eventsByDate[quickReserveDate] || []).length > 0 ? eventsByDate[quickReserveDate] : allUpcomingEvents).map((ev: any) => {
                          let label = ev.title;
                          if (ev.datetime) {
                            const d = new Date(ev.datetime);
                            const dd = d.toLocaleDateString('de-DE');
                            const hh = String(d.getHours()).padStart(2, '0');
                            const mm = String(d.getMinutes()).padStart(2, '0');
                            label = `${dd} · ${hh}:${mm} · ${ev.title}`;
                          }
                          return <option key={ev.id} value={ev.id}>{label}</option>;
                        })}
                      </select>
                    </>
                  )}
                  <button
                    onClick={handleJoinClick}
                    className="mt-3 px-4 py-2 rounded bg-primary-600 text-white"
                  >Jetzt teilnehmen</button>
                  {((eventsByDate[quickReserveDate] || []).length === 0 && allUpcomingEvents.length === 0) && (
                    <p className="mt-2 text-sm text-neutral-600">Keine kommenden Termine verfügbar. Bitte später erneut prüfen.</p>
                  )}
                </div>
              </div>
              {error && <p className="mt-2 text-red-600">{error}</p>}
              {success && <p className="mt-2 text-green-600">{success}</p>}
            </div>

            {/* Modal for Call Confirmation */}
            {showCallModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                  <h3 className="text-xl font-bold mb-4 text-gray-800">Bitte reservieren Sie telefonisch</h3>
                  <p className="text-gray-600 mb-6">
                    Für diesen Zeitraum ist eine telefonische Reservierung beim Restaurant erforderlich. 
                    Bitte rufen Sie an, um Ihren Tisch zu bestätigen.
                  </p>
                  
                  {restaurant.phone && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg flex items-center justify-center">
                      <FiPhone className="text-primary-600 mr-2 text-xl" />
                      <a href={`tel:${restaurant.phone}`} className="text-xl font-bold text-primary-700 hover:text-primary-800">
                        {restaurant.phone}
                      </a>
                    </div>
                  )}

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={confirmCallAndJoin}
                      className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                    >
                      Ich habe angerufen & reserviert
                    </button>
                    <button
                      onClick={() => setShowCallModal(false)}
                      className="w-full bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                      Abbrechen
                    </button>
                  </div>
                </div>
              </div>
            )}
            

          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-4">contact-tables</h3>
                {restaurant.events.length > 0 ? (
                  <div className="space-y-4">
                    {restaurant.events.map(event => (
                      <div key={event.id} className="border p-4 rounded-lg">
                        <h4 className="font-bold text-lg">{event.title}</h4>
                        <div className="flex items-center text-gray-600 my-2">
                          <FiCalendar className="mr-2" />
                          <span>
                            {(event as any).paused 
                              ? <span className="text-red-600 font-medium">Betriebsferien</span> 
                              : (event.datetime ? new Date(event.datetime).toLocaleString('de-DE') : 'Aktiv')
                            }
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mb-3">{event.description}</p>
                        <div className="flex items-center text-gray-600">
                          <FiUsers className="mr-2" />
                          <span>{event.maxParticipants} Plätze verfügbar</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">Derzeit keine contact-tables geplant.</p>
                )}
              </div>
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
      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 transform transition-all scale-100">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Anmeldung erforderlich</h3>
            <p className="text-gray-600 mb-6">
              Bitte melden Sie sich an oder registrieren Sie sich, um an diesem Contact Table teilzunehmen.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => router.push(`/auth/login?returnUrl=${encodeURIComponent(router.asPath)}`)}
                className="w-full bg-primary-600 text-white font-semibold py-3 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Anmelden
              </button>
              <button 
                onClick={() => router.push(`/auth/register?returnUrl=${encodeURIComponent(router.asPath)}`)}
                className="w-full bg-white border border-gray-300 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Registrieren
              </button>
              <button 
                onClick={() => setShowLoginModal(false)}
                className="w-full text-gray-500 hover:text-gray-700 font-medium py-2 mt-2"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
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
        events: {
          include: {
            participants: {
              include: {
                profile: true,
              },
            },
          },
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
      restaurant = rById || null;

      if (!restaurant) {
        const { data: rBySlug } = await supabase
          .from('restaurants')
          .select('*')
          .eq('slug', slugParam)
          .single();
        restaurant = rBySlug || null;
      }

      if (!restaurant) {
        return { notFound: true };
      }

      if (typeof slugParam === 'string' && slugParam === restaurant.id && restaurant.slug) {
        return { redirect: { destination: `/restaurants/${restaurant.slug}`, permanent: true } };
      }

      // Minimaldetails aus Supabase
      const { data: ct } = await supabase
        .from('contact_tables')
        .select('id,title,description,datetime,max_participants, participations(id, reservation_date, message, profile:profiles(first_name, name))')
        .eq('restaurant_id', restaurant.id)
        .eq('is_public', true);

      const { data: imgs } = await supabase
        .from('restaurant_images')
        .select('*')
        .eq('restaurant_id', restaurant.id);

      const { data: ratings } = await supabase
        .from('ratings')
        .select('*, profile:profiles(*)')
        .eq('restaurant_id', restaurant.id);

      const restaurantWithDetails = {
        ...restaurant,
        images: imgs || [],
        ratings: ratings || [],
        events: (ct || []).map((t: any) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          datetime: t.datetime || null,
          maxParticipants: t.max_participants ?? 0,
          participants: t.participations || [],
        })),
        avg_rating: 0,
        total_ratings: 0,
      } as any;

      if (ratings && ratings.length > 0) {
        restaurantWithDetails.total_ratings = ratings.length;
        const sum = ratings.reduce((acc: number, r: any) => acc + (r.value || 0), 0);
        restaurantWithDetails.avg_rating = sum / ratings.length;
      }

      // Sanitize participants data for privacy (Supabase path)
      if (restaurantWithDetails.events) {
        restaurantWithDetails.events = restaurantWithDetails.events.map((ev: any) => ({
          ...ev,
          participants: (ev.participants || []).map((p: any) => {
            // Strict privacy: Priority to first name only
            let safeName = 'Gast';
            if (p.profile?.first_name) {
              safeName = p.profile.first_name;
            } else if (p.profile?.name) {
              safeName = p.profile.name.split(' ')[0];
            }

            return {
              ...p,
              profile: {
                firstName: safeName,
                // Explicitly undefined other fields to ensure they are not serialized
                name: undefined,
                lastName: undefined,
                email: undefined,
                phone: undefined,
                address: undefined,
              },
            };
          }),
        }));
      }

      // Fallback: Geokodierung über OpenStreetMap/Nominatim, falls keine Koordinaten vorhanden
      if ((!restaurantWithDetails.latitude || !restaurantWithDetails.longitude) && (restaurantWithDetails.address || restaurantWithDetails.city || restaurantWithDetails.postal_code)) {
        try {
          const queryAddress = [restaurantWithDetails.address, restaurantWithDetails.postal_code, restaurantWithDetails.city].filter(Boolean).join(', ');
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
          console.warn('Geocoding fehlgeschlagen:', e);
        }
      }

      // Ensure numbers
      if (restaurantWithDetails.latitude != null) restaurantWithDetails.latitude = Number(restaurantWithDetails.latitude);
      if (restaurantWithDetails.longitude != null) restaurantWithDetails.longitude = Number(restaurantWithDetails.longitude);

      restaurant = restaurantWithDetails;
    }
  } catch (_) {
    return { notFound: true };
  }

  // Calculate average rating and total ratings
  const total_ratings = restaurant.ratings.length;
  const avg_rating = total_ratings > 0
    ? restaurant.ratings.reduce((acc: number, r: any) => acc + (r.value || 0), 0) / total_ratings
    : 0;

  // Add calculated fields to restaurant object
  const restaurantWithStats = {
    ...restaurant,
    avg_rating,
    total_ratings,
  };

  // Sanitize participants data for privacy (Prisma path)
  if (restaurantWithStats.events) {
    restaurantWithStats.events = restaurantWithStats.events.map((ev: any) => ({
      ...ev,
      participants: (ev.participants || []).map((p: any) => {
        // Strict privacy: Priority to first name only
        let safeName = 'Gast';
        if (p.profile?.firstName) {
          safeName = p.profile.firstName;
        } else if (p.profile?.first_name) {
          safeName = p.profile.first_name;
        } else if (p.profile?.name) {
          // If only full name available, split and take first part
          safeName = p.profile.name.split(' ')[0];
        }

        return {
          ...p,
          profile: {
            firstName: safeName,
            // Explicitly undefined other fields to ensure they are not serialized
            name: undefined,
            lastName: undefined,
            email: undefined,
            phone: undefined,
            address: undefined,
          },
        };
      }),
    }));
  }

  return {
    props: {
      restaurant: JSON.parse(JSON.stringify(restaurantWithStats)),
    },
  };
};

export default RestaurantDetailPage;
