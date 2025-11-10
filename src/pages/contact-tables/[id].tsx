import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import PageLayout from '../../components/PageLayout';
import { FiCalendar, FiUsers, FiMapPin, FiClock, FiMessageCircle, FiPhone, FiMail, FiGlobe } from 'react-icons/fi';
import Link from 'next/link';
import { createClient as createBrowserClient } from '../../utils/supabase/client';
import { type Database } from '../../types/supabase';
import type { GetServerSideProps } from 'next';
import { createClient as createServerSupabase } from '../../utils/supabase/server';

type ContactTable = Database['public']['Tables']['contact_tables']['Row'];
type Restaurant = Database['public']['Tables']['restaurants']['Row'];

type UserProfile = {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  phone?: string | null;
  bio?: string | null;
  preferences?: any | null;
  status?: string | null;
};

type SupabaseParticipant = {
  id: string;
  user_id: string;
  contact_table_id: string;
  status: string;
  created_at: string | null;
  updated_at: string | null;
  notes: string | null;
  user?: UserProfile | null;
};

type ContactTableWithDetails = ContactTable & {
  participants?: SupabaseParticipant[] | null;
  restaurant?: Restaurant | null;
};

interface ContactTableDetailProps {
  initialContactTable?: ContactTableWithDetails | null;
}

export default function ContactTableDetail({ initialContactTable }: ContactTableDetailProps) {
  const router = useRouter();
  const { id } = router.query;
  const supabase = createBrowserClient();

  const [contactTable, setContactTable] = useState<ContactTableWithDetails | null>(initialContactTable ?? null);
  const [isLoading, setIsLoading] = useState(!initialContactTable);
  const [error, setError] = useState<string | null>(null);
  const [showParticipants, setShowParticipants] = useState(false);
  const [message, setMessage] = useState('');
  const [showReserve, setShowReserve] = useState(false);
  const [reservationStep, setReservationStep] = useState<'idle' | 'select_datetime' | 'contact' | 'confirm' | 'done'>('idle');
  const [reservationDate, setReservationDate] = useState<string>('');
  const [reservationTime, setReservationTime] = useState<string>('');
  const [reservationFeedback, setReservationFeedback] = useState<string>('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const parseDate = (value?: string | null) => {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  };

  const formatDate = (value?: string | null) => {
    const date = parseDate(value);
    if (!date) return '—';
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  const formatTime = (value?: string | null) => {
    const time = parseDate(value);
    if (!time) return '';
    return new Intl.DateTimeFormat('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(time);
  };

  const isPastEvent = (value?: string | null) => {
    const eventDate = parseDate(value);
    if (!eventDate) return false;
    const today = new Date();
    return eventDate < today;
  };

  const fetchContactTableDetails = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('contact_tables')
        .select(`
          *,
          restaurant:restaurant_id(*),
          participants:participations(*, user:user_id(*))
        `)
        .eq('id', id as string)
        .single();

      if (error) throw error;
      setContactTable(data as ContactTableWithDetails);
    } catch (err: any) {
      console.error('Fehler beim Laden der Kontakttisch-Details:', err);
      setError(err.message || 'Es ist ein Fehler beim Laden der Kontakttisch-Details aufgetreten.');
    } finally {
      setIsLoading(false);
    }
  };

  // Reservierung bestätigen und Teilnahme erfassen (Supabase)
  const confirmReservationAndJoin = async () => {
    if (!id) return;
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
        .insert({
          contact_table_id: id as string,
          user_id: userId,
          status: 'CONFIRMED',
          notes,
        } as any);
      if (insertError) throw insertError;

      await fetchContactTableDetails();
      setSuccess('Reservierung bestätigt und Teilnahme erfasst.');
      setShowReserve(false);
      setReservationStep('done');
      setReservationFeedback('');
    } catch (e: any) {
      console.error('Fehler bei Reservierungsbestätigung:', e);
      setError(e.message || 'Es ist ein Fehler bei der Bestätigung aufgetreten.');
    } finally {
      setIsConfirming(false);
    }
  };

  useEffect(() => {
    if (!initialContactTable && id) fetchContactTableDetails();
  }, [id, initialContactTable]);

  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex-grow flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      </PageLayout>
    );
  }

  if (!contactTable) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Kontakttisch nicht gefunden</h1>
            <p className="text-gray-600 mb-4">Der gesuchte Kontakttisch existiert nicht oder wurde entfernt.</p>
            <Link href="/contact-tables" className="inline-block bg-primary-500 text-white px-4 py-2 rounded hover:bg-primary-600 transition">
              Zurück zur Übersicht
            </Link>
          </div>
        </div>
      </PageLayout>
    );
  }

  const availableSeats = contactTable.max_participants - (contactTable.participants?.length || 0);

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <div className="flex justify-end items-start mb-4">
              <span className="px-3 py-1 text-xs font-semibold text-primary-800 bg-primary-100 rounded-full">
                {contactTable.max_participants} Plätze
              </span>
            </div>

            <h1 className="text-2xl font-bold text-neutral-800 mb-2">{contactTable.title}</h1>

            {contactTable.restaurant && (
              <div className="text-sm text-neutral-700 mb-4">
                <div className="flex items-center mb-1">
                  <FiMapPin className="mr-2" />
                  {contactTable.restaurant.id ? (
                    <Link href={`/restaurants/${contactTable.restaurant.id}`} className="hover:underline font-semibold">
                      {contactTable.restaurant.name}
                    </Link>
                  ) : (
                    <span className="font-semibold">{contactTable.restaurant.name}</span>
                  )}
                </div>
                <div className="ml-6 space-y-1">
                  <p>{[contactTable.restaurant.address, contactTable.restaurant.postal_code, contactTable.restaurant.city, contactTable.restaurant.country].filter(Boolean).join(', ')}</p>
                  {contactTable.restaurant.cuisine && (
                    <p>Küche: {contactTable.restaurant.cuisine}</p>
                  )}
                  {contactTable.restaurant.opening_hours && (
                    <p>Öffnungszeiten: {contactTable.restaurant.opening_hours}</p>
                  )}
                  <div className="flex flex-wrap gap-3 pt-2">
                    {contactTable.restaurant.phone && (
                      <span className="inline-flex items-center text-neutral-700"><FiPhone className="mr-1" />{contactTable.restaurant.phone}</span>
                    )}
                    {contactTable.restaurant.email && (
                      <span className="inline-flex items-center text-neutral-700"><FiMail className="mr-1" />{contactTable.restaurant.email}</span>
                    )}
                    {(contactTable.restaurant.website || contactTable.restaurant.booking_url) && (
                      <span className="inline-flex items-center text-neutral-700">
                        <FiGlobe className="mr-1" />
                        <a href={contactTable.restaurant.website || contactTable.restaurant.booking_url || undefined} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {contactTable.restaurant.website ? 'Website' : 'Reservierungen'}
                        </a>
                      </span>
                    )}
                  </div>
                  <div className="pt-3">
                    <button
                      onClick={() => {
                        setShowReserve(true);
                        setReservationStep('select_datetime');
                      }}
                      className="border border-primary-300 text-primary-700 font-medium py-2 px-4 rounded-lg hover:bg-primary-50 transition-colors"
                    >
                      Reservieren
                    </button>
                  </div>
                  {showReserve && (
                    <div className="mt-3 bg-white border border-neutral-200 rounded-lg p-3 text-sm text-neutral-700">
                      {reservationStep === 'select_datetime' && (
                        <div className="space-y-3">
                          <p className="text-neutral-800 font-medium">Datum und Uhrzeit auswählen</p>
                          <div className="flex flex-wrap gap-3">
                            <input type="date" value={reservationDate} onChange={(e) => setReservationDate(e.target.value)} className="border border-neutral-300 rounded px-3 py-2" />
                            <input type="time" value={reservationTime} onChange={(e) => setReservationTime(e.target.value)} className="border border-neutral-300 rounded px-3 py-2" />
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => setShowReserve(false)} className="px-3 py-2 rounded border border-neutral-300">Abbrechen</button>
                            <button
                              onClick={() => {
                                if (!reservationDate || !reservationTime) {
                                  alert('Bitte Datum und Uhrzeit auswählen.');
                                  return;
                                }
                                setReservationStep('contact');
                              }}
                              className="px-3 py-2 rounded bg-primary-600 text-white"
                            >
                              Weiter
                            </button>
                          </div>
                        </div>
                      )}
                      {reservationStep === 'contact' && (
                        <div className="space-y-3">
                          <p className="text-neutral-800 font-medium">Jetzt direkt beim Restaurant reservieren</p>
                          <div className="flex flex-wrap gap-3">
                            {contactTable.restaurant.phone && (
                              <a href={`tel:${contactTable.restaurant.phone}`} className="inline-flex items-center px-3 py-2 rounded bg-primary-50 text-primary-700 hover:bg-primary-100">
                                <FiPhone className="mr-2" />
                                Anrufen
                              </a>
                            )}
                            {(contactTable.restaurant.website || contactTable.restaurant.booking_url) && (
                              <a href={contactTable.restaurant.website || contactTable.restaurant.booking_url || undefined} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-2 rounded bg-neutral-100 text-neutral-800 hover:bg-neutral-200">
                                <FiGlobe className="mr-2" />
                                Zur Webseite
                              </a>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => setReservationStep('select_datetime')} className="px-3 py-2 rounded border border-neutral-300">Zurück</button>
                            <button onClick={() => setReservationStep('confirm')} className="px-3 py-2 rounded bg-primary-600 text-white">Ich habe reserviert</button>
                          </div>
                        </div>
                      )}
                      {reservationStep === 'confirm' && (
                        <div className="space-y-3">
                          <p className="text-neutral-800 font-medium">Reservierung bestätigen</p>
                          <p className="text-neutral-600 text-sm">Gib optional kurzes Feedback zur Reservierung.</p>
                          <textarea
                            value={reservationFeedback}
                            onChange={(e) => setReservationFeedback(e.target.value)}
                            className="w-full border border-neutral-300 rounded p-2"
                            rows={3}
                            placeholder="Feedback zur Reservierung (optional)"
                          />
                          <div className="flex gap-2">
                            <button onClick={() => setReservationStep('contact')} className="px-3 py-2 rounded border border-neutral-300">Zurück</button>
                            <button onClick={confirmReservationAndJoin} disabled={isConfirming} className="px-3 py-2 rounded bg-primary-600 text-white">
                              {isConfirming ? 'Bestätige…' : 'Bestätigen'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
            {success && <p className="mt-4 text-sm text-green-600">{success}</p>}

            {contactTable.description && (
              <div className="mb-4">
                <h4 className="font-semibold text-sm text-neutral-700 mb-2 flex items-center"><FiMessageCircle className="mr-2"/>Beschreibung</h4>
                <p className="text-sm text-neutral-600 bg-neutral-50 p-3 rounded-md">{contactTable.description}</p>
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => setShowParticipants((v) => !v)}
                className="border border-neutral-300 px-4 py-2 rounded hover:bg-neutral-50"
              >
                {showParticipants ? 'Teilnehmer ausblenden' : 'Teilnehmer anzeigen'}
              </button>
            </div>

            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

            {!isPastEvent(contactTable.datetime) && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-neutral-700 mb-2">Nachricht an den Kontakttisch (optional)</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full border border-neutral-300 rounded p-3 text-sm"
                  rows={3}
                  placeholder="Kurze Nachricht für die Runde…"
                />
              </div>
            )}
          </div>

          {showParticipants && (
            <div className="p-6 border-t border-neutral-200">
              <h3 className="text-lg font-semibold text-neutral-800 mb-3"><FiUsers className="inline mr-2"/>Teilnehmer</h3>
              {contactTable.participants && contactTable.participants.length > 0 ? (
                <ul className="space-y-2">
                  {contactTable.participants.map((p) => (
                    <li key={p.id} className="text-sm text-neutral-700">
                      {p.user?.first_name || p.user?.last_name ? (
                        <span>{p.user?.first_name} {p.user?.last_name}</span>
                      ) : (
                        <span>Teilnehmer</span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-neutral-600">Noch keine Teilnehmer eingetragen.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const supabase = createServerSupabase(context);
    const { id } = context.params || {};
    if (typeof id !== 'string') {
      return { notFound: true };
    }

    const { data, error } = await supabase
      .from('contact_tables')
      .select(`
        *,
        restaurant:restaurant_id(*),
        participants:participations(*, user:user_id(*))
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      return { notFound: true };
    }

    return {
      props: {
        initialContactTable: data as ContactTableWithDetails,
      },
    };
  } catch (e) {
    console.error('SSR Fehler für ContactTable-Details:', e);
    return { notFound: true };
  }
};
