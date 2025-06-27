import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import { motion } from 'framer-motion';
import { FiCalendar, FiUsers, FiMapPin, FiClock, FiPhone, FiMail, FiGlobe, FiMessageCircle } from 'react-icons/fi';
import PageLayout from '../../components/PageLayout';
import { createClient } from '../../utils/supabase/server';
import { supabase } from '../../utils/supabase';
import { ContactTable, Restaurant, Participation, Database } from '../../types/supabase';
import Image from 'next/image';
import Link from 'next/link';

// Typdefinition für die Profile-Daten aus Supabase
type UserProfile = {
  id: string;
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  phone?: string | null;
  bio?: string | null;
  preferences?: any | null;
};

// Typdefinition für die Teilnehmer, wie sie von Supabase zurückgegeben werden
type SupabaseParticipant = {
  id: string;
  user_id: string;
  contact_table_id: string;
  status: string;
  created_at: string | null;
  updated_at: string | null;
  notes: string | null;
  user?: any; // TODO: Define a more specific type for user or fix query
};

// Erweiterte Typdefinition für Kontakttische mit Teilnehmern und Restaurant
type ContactTableWithDetails = ContactTable & {
  participants?: SupabaseParticipant[] | null;
  restaurant?: Restaurant | null;
  isParticipant?: boolean;
};

interface ContactTableDetailProps {
  initialContactTable: ContactTableWithDetails;
  userRole: string;
  userId: string | null;
}

export default function ContactTableDetail({ initialContactTable, userRole, userId }: ContactTableDetailProps) {
  const router = useRouter();
  const [contactTable, setContactTable] = useState<ContactTableWithDetails>(initialContactTable);
  const [isLoading, setIsLoading] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const { id } = router.query;
  

  // Datum formatieren
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  // Zeit formatieren
  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    const time = new Date(`2000-01-01T${timeString}`);
    return new Intl.DateTimeFormat('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(time);
  };
  
  // Berechnung der verfügbaren Plätze
  const availableSeats = contactTable ? 
    (contactTable.max_participants - (contactTable.participants?.length || 0)) : 0;
    
  // Status des Kontakttisches bestimmen
  const determineStatus = () => {
    if (!contactTable) return 'PAST';
    
    const eventDate = new Date(contactTable.date);
    const today = new Date();
    
    if (eventDate < today) return 'PAST';
    if (availableSeats <= 0) return 'FULL';
    return 'OPEN';
  };
  
  const tableStatus = determineStatus();

  // Prüfen, ob der Kontakttisch in der Vergangenheit liegt
  const isPastEvent = (dateString: string) => {
    const eventDate = new Date(dateString);
    const today = new Date();
    return eventDate < today;
  };

  // Prüfen, ob der Benutzer bereits Teilnehmer ist
  const isUserParticipant = () => {
    if (!userId || !contactTable?.participants) return false;
    return contactTable.participants.some(p => p.user_id === userId);
  };

  // Kontakttisch beitreten
  const joinContactTable = async () => {
    if (!id || !userId) return;
    
    try {
      setIsJoining(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('participations')
        .insert({
          contact_table_id: id as string,
          user_id: userId,
          status: 'CONFIRMED',
          notes: message || null
        });
      
      if (error) throw error;
      
      // Aktualisierte Daten abrufen
      await fetchContactTableDetails();
      
      setMessage('');
      setSuccess('Sie haben sich erfolgreich für diesen Kontakttisch angemeldet!');
    } catch (error: any) {
      console.error('Fehler beim Beitreten zum Kontakttisch:', error);
      setError(error.message || 'Es ist ein Fehler beim Beitreten zum Kontakttisch aufgetreten.');
    } finally {
      setIsJoining(false);
    }
  };

  // Kontakttisch verlassen
  const leaveContactTable = async () => {
    if (!id || !userId) return;
    
    try {
      setIsLeaving(true);
      setError(null);
      
      const { error } = await supabase
        .from('participations')
        .delete()
        .eq('contact_table_id', id as string)
        .eq('user_id', userId);
      
      if (error) throw error;
      
      // Aktualisierte Daten abrufen
      await fetchContactTableDetails();
      
      setSuccess('Sie haben diesen Kontakttisch erfolgreich verlassen.');
    } catch (error: any) {
      console.error('Fehler beim Verlassen des Kontakttisches:', error);
      setError(error.message || 'Es ist ein Fehler beim Verlassen des Kontakttisches aufgetreten.');
    } finally {
      setIsLeaving(false);
    }
  };

  // Kontakttisch-Details abrufen
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
      
      if (data) {
        setContactTable(data as ContactTableWithDetails);
      }
    } catch (error: any) {
      console.error('Fehler beim Laden der Kontakttisch-Details:', error);
      setError(error.message || 'Es ist ein Fehler beim Laden der Kontakttisch-Details aufgetreten.');
    } finally {
      setIsLoading(false);
    }
  };

  // Beim ersten Laden und bei Änderung der ID Daten abrufen
  useEffect(() => {
    if (id) {
      fetchContactTableDetails();
    }
  }, [id]);

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
  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 relative">
            <span className="block sm:inline">{error}</span>
            <button 
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
              onClick={() => setError(null)}
            >
              <span className="text-xl">&times;</span>
            </button>
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 relative">
            <span className="block sm:inline">{success}</span>
            <button 
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
              onClick={() => setSuccess(null)}
            >
              <span className="text-xl">&times;</span>
            </button>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header-Bereich mit Bild und Titel */}
          <div className="relative h-64 bg-gray-200">
            {contactTable.image_url ? (
              <Image 
                src={contactTable.image_url} 
                alt={contactTable.title} 
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-300">
                <FiCalendar className="text-gray-500 text-6xl" />
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 to-transparent">
              <h1 className="text-3xl font-bold text-white">{contactTable.title}</h1>
              <div className="flex items-center mt-2">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mr-2 ${
                  tableStatus === 'OPEN' ? 'bg-green-500 text-white' : 
                  tableStatus === 'FULL' ? 'bg-orange-500 text-white' : 
                  'bg-gray-500 text-white'
                }`}>
                  {tableStatus === 'OPEN' ? 'Offen' : 
                   tableStatus === 'FULL' ? 'Ausgebucht' : 
                   'Vergangen'}
                </span>
                <span className="text-white text-sm">
                  {formatDate(contactTable.date)}
                </span>
              </div>
            </div>
          </div>
          
          {/* Hauptinhalt */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Linke Spalte - Details */}
              <div className="md:col-span-2">
                <h2 className="text-2xl font-semibold mb-4">Details</h2>
                
                {contactTable.description && (
                  <div className="mb-6">
                    <p className="text-gray-700">{contactTable.description}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <FiCalendar className="text-primary-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-gray-900">Datum</h3>
                      <p className="text-sm text-gray-500">{formatDate(contactTable.date)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <FiClock className="text-primary-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-gray-900">Uhrzeit</h3>
                      <p className="text-sm text-gray-500">
                        {formatTime(contactTable.start_time)} - {formatTime(contactTable.end_time)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <FiUsers className="text-primary-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-gray-900">Teilnehmer</h3>
                      <p className="text-sm text-gray-500">
                        {contactTable.participants?.length || 0} / {contactTable.max_participants} Plätze belegt
                      </p>
                    </div>
                  </div>
                  
                  {contactTable.address && (
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <FiMapPin className="text-primary-600" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-gray-900">Adresse</h3>
                        <p className="text-sm text-gray-500">{contactTable.address}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Restaurant-Informationen */}
                {contactTable.restaurant && (
                  <div className="mb-6">
                    <h2 className="text-2xl font-semibold mb-4">Restaurant</h2>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center mb-4">
                        {contactTable.restaurant.image_url ? (
                          <div className="h-16 w-16 rounded-full overflow-hidden mr-4">
                            <Image 
                              src={contactTable.restaurant.image_url} 
                              alt={contactTable.restaurant.name} 
                              width={64}
                              height={64}
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center mr-4">
                            <span className="text-gray-500 text-xl font-bold">
                              {contactTable.restaurant.name.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div>
                          <h3 className="text-lg font-medium">{contactTable.restaurant.name}</h3>
                          {contactTable.restaurant.cuisine_type && (
                            <p className="text-sm text-gray-600">
                              {contactTable.restaurant.cuisine_type.join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex items-center">
                          <FiMapPin className="text-gray-500 mr-2" />
                          <span className="text-sm text-gray-700">
                            {contactTable.restaurant.address}, {contactTable.restaurant.postal_code} {contactTable.restaurant.city}
                          </span>
                        </div>
                        
                        {contactTable.restaurant.contact_phone && (
                          <div className="flex items-center">
                            <FiPhone className="text-gray-500 mr-2" />
                            <a href={`tel:${contactTable.restaurant.contact_phone}`} className="text-sm text-primary-600 hover:underline">
                              {contactTable.restaurant.contact_phone}
                            </a>
                          </div>
                        )}
                        
                        {contactTable.restaurant.contact_email && (
                          <div className="flex items-center">
                            <FiMail className="text-gray-500 mr-2" />
                            <a href={`mailto:${contactTable.restaurant.contact_email}`} className="text-sm text-primary-600 hover:underline">
                              {contactTable.restaurant.contact_email}
                            </a>
                          </div>
                        )}
                        
                        {contactTable.restaurant.website && (
                          <div className="flex items-center">
                            <FiGlobe className="text-gray-500 mr-2" />
                            <a href={contactTable.restaurant.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-600 hover:underline">
                              Website besuchen
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Rechte Spalte - Teilnehmen und Teilnehmer */}
              <div>
                {/* Teilnahme-Box */}
                <div className="bg-gray-50 p-6 rounded-lg mb-6">
                  <h3 className="text-xl font-semibold mb-4">Teilnahme</h3>
                  
                  {tableStatus === 'PAST' ? (
                    <div className="text-center p-4 bg-gray-100 rounded-lg">
                      <p className="text-gray-600">Dieser Kontakttisch liegt in der Vergangenheit.</p>
                    </div>
                  ) : (
                    <>
                      <div className="mb-4">
                        <p className="text-gray-700 mb-2">
                          <span className="font-semibold">{availableSeats}</span> von <span className="font-semibold">{contactTable.max_participants}</span> Plätzen verfügbar
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className={`h-2.5 rounded-full ${availableSeats > 0 ? 'bg-primary-500' : 'bg-red-500'}`}
                            style={{ width: `${Math.min(100, (contactTable.participants?.length || 0) * 100 / contactTable.max_participants)}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      {isUserParticipant() ? (
                        <div>
                          <p className="text-green-600 mb-4">Sie nehmen an diesem Kontakttisch teil.</p>
                          <button
                            onClick={leaveContactTable}
                            disabled={isLeaving}
                            className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isLeaving ? 'Wird bearbeitet...' : 'Teilnahme zurückziehen'}
                          </button>
                        </div>
                      ) : tableStatus === 'FULL' ? (
                        <div className="text-center p-4 bg-orange-100 rounded-lg">
                          <p className="text-orange-700">Dieser Kontakttisch ist bereits voll.</p>
                        </div>
                      ) : (
                        <div>
                          <div className="mb-4">
                            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                              Nachricht (optional)
                            </label>
                            <textarea
                              id="message"
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                              placeholder="Stellen Sie sich kurz vor oder teilen Sie besondere Wünsche mit..."
                              value={message}
                              onChange={(e) => setMessage(e.target.value)}
                            ></textarea>
                          </div>
                          <button
                            onClick={joinContactTable}
                            disabled={isJoining}
                            className="w-full bg-primary-500 text-white py-2 px-4 rounded hover:bg-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isJoining ? 'Wird bearbeitet...' : 'Am Kontakttisch teilnehmen'}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
                
                {/* Teilnehmer-Box */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">Teilnehmer</h3>
                    <button
                      onClick={() => setShowParticipants(!showParticipants)}
                      className="text-primary-500 hover:text-primary-600 text-sm font-medium"
                    >
                      {showParticipants ? 'Ausblenden' : 'Anzeigen'}
                    </button>
                  </div>
                  
                  {showParticipants && (
                    <div className="space-y-3">
                      {contactTable.participants && contactTable.participants.length > 0 ? (
                        contactTable.participants.map((participant) => (
                          <motion.div 
                            key={participant.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center p-2 hover:bg-gray-100 rounded-lg"
                          >
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                              {participant.user?.avatar_url ? (
                                <Image 
                                  src={participant.user.avatar_url} 
                                  alt={`${participant.user.first_name || 'Teilnehmer'}`} 
                                  width={40}
                                  height={40}
                                  className="rounded-full"
                                />
                              ) : (
                                <span className="text-gray-500 font-bold">
                                  {participant.user?.first_name?.charAt(0) || '?'}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">
                                {participant.user?.first_name || 'Anonymer Teilnehmer'}
                                {/* {participant.user_id === contactTable.user_id && ( */}
                                {/*
                                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                    Host
                                  </span>
                                )} */}
                              </p>
                              {participant.notes && (
                                <div className="flex items-center text-sm text-gray-500 mt-1">
                                  <FiMessageCircle className="mr-1" size={14} />
                                  <p className="truncate">{participant.notes}</p>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-center py-3">Noch keine Teilnehmer</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
export const getServerSideProps: GetServerSideProps = async (context) => {
  const supabase = createClient(context);
  
  // Authentifizierungsstatus prüfen
  const {
    data: { session },
  } = await supabase.auth.getSession();
  
  // Wenn kein Benutzer eingeloggt ist, zur Login-Seite umleiten
  if (!session) {
    return {
      redirect: {
        destination: '/auth/login?redirect=' + encodeURIComponent(context.resolvedUrl),
        permanent: false,
      },
    };
  }
  
  const userId = session.user.id;
  
  // Standardmäßig USER-Rolle zuweisen
  // In einer vollständigen Implementierung würden wir hier die Rolle aus der Datenbank abrufen
  const userRole = 'USER';
  
  // Kontakttisch-ID aus der URL abrufen
  const { id } = context.params as { id: string };
  
  if (!id) {
    return {
      notFound: true,
    };
  }
  
  try {
    // Kontakttisch mit Restaurant und Teilnehmern abrufen
    const { data: contactTable, error } = await supabase
      .from('contact_tables')
      .select(`
        *,
        restaurant:restaurant_id(*),
        participants:participations(*, user:user_id(*))
      `)
      .eq('id', id)
      .single();
    
    if (error || !contactTable) {
      return {
        notFound: true,
      };
    }
    
    return {
      props: {
        initialContactTable: contactTable,
        userRole,
        userId,
      },
    };
  } catch (error) {
    console.error('Fehler beim Abrufen des Kontakttisches:', error);
    return {
      notFound: true,
    };
  }
};
