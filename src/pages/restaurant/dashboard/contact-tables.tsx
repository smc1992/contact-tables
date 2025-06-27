import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { motion } from 'framer-motion';
import { FiCalendar, FiUsers, FiClock, FiMapPin, FiAlertCircle, FiCheckCircle, FiInfo } from 'react-icons/fi';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import RestaurantSidebar from '../../../components/restaurant/RestaurantSidebar';
import { createClient } from '../../../utils/supabase/server';
import { supabase } from '../../../../utils/supabase';
import { Restaurant, ContactTable, Database } from '../../../types/supabase';

// Typdefinition für die Profile-Daten aus Supabase
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

// Typdefinition für die Teilnehmer, wie sie von Supabase zurückgegeben werden
type SupabaseParticipant = {
  id: string;
  user_id: string;
  contact_table_id: string;
  status: string;
  created_at: string | null;
  updated_at: string | null;
  notes: string | null;
  user?: UserProfile | Record<string, any> | null;
};

// Erweiterte Typdefinition für Kontakttische mit Teilnehmern
type ContactTableWithParticipants = ContactTable & {
  participants?: SupabaseParticipant[] | any[] | null;
};

interface ContactTablesPageProps {
  restaurant: Restaurant;
  userRole: string;
  initialContactTables?: ContactTableWithParticipants[];
  error?: string;
}

export default function ContactTablesPage({ restaurant, userRole, initialContactTables = [], error: serverError }: ContactTablesPageProps) {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [contactTables, setContactTables] = useState<ContactTableWithParticipants[]>(initialContactTables);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(serverError || '');
  const [success, setSuccess] = useState('');
  const [isCreatingTable, setIsCreatingTable] = useState(false);
  const [newTable, setNewTable] = useState<Partial<ContactTable>>({
    date: '',
    start_time: '',
    end_time: '',
    max_participants: 4,
    title: '',
    description: ''
  });

  // Funktion zum Laden der Kontakttische aus Supabase
  const fetchContactTables = async () => {
    setIsLoading(true);
    try {
      const supabase = createClientComponentClient<Database>();
      const { data, error } = await supabase
        .from('contact_tables')
        .select(`
          *,
          participants:participations(*, user:profiles(*))
        `)
        .eq('restaurant_id', restaurant.id)
        .order('date', { ascending: false });
        
      if (error) throw error;
      
      // Daten transformieren, um das richtige Format für unseren State zu haben
      const formattedData = data?.map(table => {
        // Sicherstellen, dass participants ein Array ist
        const participants = Array.isArray(table.participants) ? table.participants : [];
        
        // Tisch mit korrektem Typ zurückgeben
        return {
          ...table,
          participants
        } as ContactTableWithParticipants;
      }) || [];
      
      setContactTables(formattedData);
      setError('');
    } catch (err: any) {
      console.error('Fehler beim Laden der Kontakttische:', err);
      setError('Fehler beim Laden der Kontakttische: ' + (err.message || 'Unbekannter Fehler'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Wenn initialContactTables vorhanden sind, müssen wir nicht erneut laden
    if (initialContactTables && initialContactTables.length > 0) {
      setIsLoading(false);
      return;
    }
    
    // Ansonsten Daten aus Supabase laden
    fetchContactTables();
  }, [restaurant.id, initialContactTables]);

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingTable(true);
    setError('');
    
    try {
      // Validierung
      if (!newTable.date || !newTable.start_time || !newTable.end_time || !newTable.max_participants || !newTable.title || !newTable.description) {
        throw new Error('Bitte füllen Sie alle Felder aus');
      }
      
      // Kontakttisch in Supabase erstellen
      const supabase = createClientComponentClient<Database>();
      const { data, error } = await supabase
        .from('contact_tables')
        .insert([
          {
            date: newTable.date || '',
            start_time: newTable.start_time || '',
            end_time: newTable.end_time || '',
            max_participants: newTable.max_participants || 4,
            min_participants: 2,
            participant_count: 0,
            title: newTable.title || '',
            description: newTable.description || '',
            status: 'PUBLISHED',
            restaurant_id: restaurant.id,
            is_recurring: false,
            tags: []
          }
        ])
        .select()
        .single();
      
      if (error) throw error;
      
      // Neuen Kontakttisch zum State hinzufügen
      if (data) {
        const newContactTable: ContactTableWithParticipants = {
          ...data,
          participants: []
        };
        
        setContactTables(prev => [newContactTable, ...prev]);
      }
      setSuccess('Contact Table erfolgreich erstellt!');
      
      // Formular zurücksetzen
      setNewTable({
        date: '',
        start_time: '',
        end_time: '',
        max_participants: 4,
        title: '',
        description: ''
      });
      
      setTimeout(() => {
        setSuccess('');
      }, 5000);
    } catch (error: any) {
      setError(error.message || 'Ein Fehler ist aufgetreten');
    } finally {
      setIsCreatingTable(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewTable(prev => ({
      ...prev,
      [name]: name === 'max_participants' ? parseInt(value) : value
    }));
  };

  const filteredTables = contactTables.filter(table => {
    const tableDate = new Date(table.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (activeTab === 'upcoming') {
      return tableDate >= today && table.status !== 'COMPLETED';
    } else {
      return tableDate < today || table.status === 'COMPLETED';
    }
  });

  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />
      
      <div className="flex flex-col md:flex-row">
        <RestaurantSidebar activeItem="contact-tables" />
        
        <main className="flex-1 pt-24 px-4 md:px-8 pb-12">
          <div className="max-w-5xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-secondary-500">Contact Tables verwalten</h1>
              <p className="text-secondary-400 mt-2">
                Erstellen und verwalten Sie Ihre Contact Tables, um Menschen an Ihren Tischen zusammenzubringen.
              </p>
            </div>
            
            {/* Erfolgs- oder Fehlermeldung */}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-primary-50 text-primary-700 rounded-lg shadow-sm border border-primary-200"
              >
                <div className="flex items-center">
                  <FiCheckCircle className="mr-3 text-primary-500" size={20} />
                  <p className="font-medium">{success}</p>
                </div>
              </motion.div>
            )}
            
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg shadow-sm border border-red-200"
              >
                <div className="flex items-center">
                  <FiAlertCircle className="mr-3 text-red-500" size={20} />
                  <p className="font-medium">{error}</p>
                </div>
              </motion.div>
            )}
            
            {/* Neuen Contact Table erstellen */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-primary-100">
              <h2 className="text-xl font-semibold text-secondary-500 mb-4">Neuen Contact Table erstellen</h2>
              
              <form onSubmit={handleCreateTable}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="date" className="block text-sm font-medium text-secondary-600 mb-1">
                      Datum *
                    </label>
                    <input
                      type="date"
                      id="date"
                      name="date"
                      value={newTable.date}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-lg border border-primary-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="start_time" className="block text-sm font-medium text-secondary-600 mb-1">
                      Startzeit *
                    </label>
                    <input
                      type="time"
                      id="start_time"
                      name="start_time"
                      value={newTable.start_time}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-lg border border-primary-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="end_time" className="block text-sm font-medium text-secondary-600 mb-1">
                      Endzeit *
                    </label>
                    <input
                      type="time"
                      id="end_time"
                      name="end_time"
                      value={newTable.end_time}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-lg border border-primary-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="max_participants" className="block text-sm font-medium text-secondary-600 mb-1">
                      Kapazität (Anzahl der Plätze) *
                    </label>
                    <select
                      id="max_participants"
                      name="max_participants"
                      value={newTable.max_participants}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-lg border border-primary-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                      required
                    >
                      {[2, 4, 6, 8, 10, 12].map(num => (
                        <option key={num} value={num}>{num} Personen</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label htmlFor="description" className="block text-sm font-medium text-secondary-600 mb-1">
                      Beschreibung / Thema *
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={newTable.description || ''}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-3 rounded-lg border border-primary-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                      required
                      placeholder="z.B. 'Gemeinsames Abendessen für Filmliebhaber' oder 'Gesprächsrunde über Reiseerfahrungen'"
                    />
                    <p className="mt-1 text-xs text-secondary-400">
                      Eine ansprechende Beschreibung hilft Interessierten, den richtigen Tisch zu finden.
                    </p>
                  </div>
                </div>
                
                <div className="mt-6">
                  <button
                    type="submit"
                    disabled={isCreatingTable}
                    className={`w-full py-3 px-6 rounded-lg text-white font-medium flex items-center justify-center shadow-md transition-all ${
                      isCreatingTable ? 'bg-secondary-400 cursor-not-allowed' : 'bg-primary-500 hover:bg-primary-600 hover:shadow-lg'
                    }`}
                  >
                    {isCreatingTable ? (
                      <>
                        <span className="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-3"></span>
                        Wird erstellt...
                      </>
                    ) : (
                      <>
                        <FiCalendar className="mr-3" size={20} />
                        Contact Table erstellen
                      </>
                    )}
                  </button>
                </div>
              </form>
              
              <div className="mt-4 p-3 bg-primary-50 rounded-lg border border-primary-100">
                <div className="flex items-start">
                  <FiInfo className="text-primary-500 mt-1 mr-3" size={18} />
                  <p className="text-sm text-secondary-500">
                    <span className="font-medium">Hinweis:</span> Contact Tables werden auf der öffentlichen Plattform angezeigt und können von Nutzern gebucht werden. Die tatsächliche Tischreservierung erfolgt direkt über Ihr Restaurant. Sie erhalten eine Benachrichtigung, wenn jemand an Ihrem Contact Table teilnehmen möchte.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Tabs für Anzeige der Contact Tables */}
            <div className="bg-white rounded-xl shadow-md border border-primary-100 overflow-hidden">
              <div className="flex border-b border-primary-100">
                <button
                  className={`flex-1 py-4 px-6 font-medium text-center transition-colors ${
                    activeTab === 'upcoming' 
                      ? 'bg-primary-50 text-primary-600 border-b-2 border-primary-500' 
                      : 'text-secondary-500 hover:bg-neutral-50'
                  }`}
                  onClick={() => setActiveTab('upcoming')}
                >
                  Bevorstehende Tables
                </button>
                <button
                  className={`flex-1 py-4 px-6 font-medium text-center transition-colors ${
                    activeTab === 'past' 
                      ? 'bg-primary-50 text-primary-600 border-b-2 border-primary-500' 
                      : 'text-secondary-500 hover:bg-neutral-50'
                  }`}
                  onClick={() => setActiveTab('past')}
                >
                  Vergangene Tables
                </button>
              </div>
              
              <div className="p-6">
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500 mb-4"></div>
                    <p className="text-secondary-500">Daten werden geladen...</p>
                  </div>
                ) : filteredTables.length === 0 ? (
                  <div className="text-center py-10 bg-primary-50 rounded-lg border border-primary-100">
                    <FiCalendar className="mx-auto text-primary-300 mb-4" size={56} />
                    <p className="text-secondary-600 font-medium text-lg">
                      {activeTab === 'upcoming' ? 'Keine bevorstehenden Contact Tables' : 'Keine vergangenen Contact Tables'}
                    </p>
                    <p className="text-secondary-400 mt-2">
                      {activeTab === 'upcoming' 
                        ? 'Erstellen Sie einen neuen Contact Table, um Menschen an Ihren Tischen zusammenzubringen.' 
                        : 'Sobald Sie Contact Tables durchgeführt haben, werden sie hier angezeigt.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {filteredTables.map(table => (
                      <div key={table.id} className="border border-primary-100 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <div className={`px-6 py-4 ${
                          table.status === 'AVAILABLE' ? 'bg-green-50 border-l-4 border-green-500' :
                          table.status === 'BOOKED' ? 'bg-primary-50 border-l-4 border-primary-500' :
                          'bg-secondary-50 border-l-4 border-secondary-500'
                        }`}>
                          <div className="flex flex-wrap items-center justify-between mb-2">
                            <span className="font-medium">Teilnehmer:</span>
                            <span className="text-secondary-600">{table.participants?.length || 0} / {table.max_participants}</span>
                          </div>
                          <div className="flex items-center">
                            <div className="mr-4">
                              <div className="bg-white rounded-lg p-2 shadow-sm">
                                <FiCalendar className={`
                                  ${table.status === 'AVAILABLE' ? 'text-green-500' :
                                    table.status === 'BOOKED' ? 'text-primary-500' :
                                    'text-secondary-500'}
                                `} size={24} />
                              </div>
                            </div>
                            <div className="mt-2 sm:mt-0">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                table.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' :
                                table.status === 'BOOKED' ? 'bg-primary-100 text-primary-800' :
                                'bg-secondary-100 text-secondary-800'
                              }`}>
                                {table.status === 'AVAILABLE' ? 'Verfügbar' :
                                 table.status === 'BOOKED' ? 'Gebucht' : 'Abgeschlossen'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {table.participants && table.participants.length > 0 && (
                          <div className="px-6 py-4 bg-white">
                            <h4 className="font-medium text-secondary-600 mb-2">Teilnehmer ({table.participants?.length || 0}/{table.max_participants})</h4>
                            <div className="space-y-2">
                              {table.participants.map(participant => {
                                // Benutzerdaten aus dem user-Objekt extrahieren
                                const user = participant.user as UserProfile || {};
                                const firstName = user.first_name || '';
                                const lastName = user.last_name || '';
                                const email = user.email || '';
                                
                                const displayName = firstName || lastName ? 
                                  `${firstName} ${lastName}`.trim() : 
                                  email || 'Unbekannt';
                                const displayEmail = email;
                                const initial = displayName.charAt(0) || '?';
                                
                                return (
                                  <div key={participant.id} className="flex items-center text-sm">
                                    <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-medium mr-3">
                                      {initial}
                                    </div>
                                    <div>
                                      <p className="font-medium text-secondary-700">{displayName}</p>
                                      <p className="text-secondary-500 text-xs">{displayEmail}</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        
                        <div className="px-6 py-3 bg-neutral-50 border-t border-primary-100 flex justify-end">
                          <button className="text-sm text-primary-600 hover:text-primary-800 font-medium transition-colors">
                            Details anzeigen
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
      
      <Footer />
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const supabase = createClient(context);
  
  try {
    // Überprüfen, ob der Benutzer eingeloggt ist
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return {
        redirect: {
          destination: `/auth/login?redirect=${encodeURIComponent('/restaurant/dashboard/contact-tables')}`,
          permanent: false,
        },
      };
    }
    
    // Benutzerrolle überprüfen
    const userRole = session.user?.user_metadata?.role || 'CUSTOMER';
    const userRoleUpper = userRole.toUpperCase();
    
    // Nur Restaurant-Benutzer dürfen auf diese Seite zugreifen
    if (userRoleUpper !== 'RESTAURANT' && userRoleUpper !== 'ADMIN') {
      return {
        redirect: {
          destination: '/',
          permanent: false,
        },
      };
    }
    
    // Restaurant-Daten aus Supabase abrufen
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('user_id', session.user.id)
      .single();
    
    if (restaurantError || !restaurant) {
      console.error('Fehler beim Abrufen des Restaurants:', restaurantError);
      
      // Wenn kein Restaurant gefunden wurde, zur Registrierungsseite weiterleiten
      return {
        redirect: {
          destination: '/restaurant/register',
          permanent: false,
        },
      };
    }
    
    // Kontakttische des Restaurants abrufen mit Teilnehmern
    const { data: contactTables, error: tablesError } = await supabase
      .from('contact_tables')
      .select(`
        *,
        participants:participations(*, user:profiles(*))
      `)
      .eq('restaurant_id', restaurant.id)
      .order('date', { ascending: false });
    
    if (tablesError) {
      console.error('Fehler beim Abrufen der Kontakttische:', tablesError);
      return {
        props: {
          restaurant,
          userRole: userRoleUpper,
          initialContactTables: [],
          error: 'Fehler beim Laden der Kontakttische. Bitte versuchen Sie es später erneut.'
        },
      };
    }
    
    return {
      props: {
        restaurant,
        userRole: userRoleUpper,
        initialContactTables: contactTables || [],
      },
    };
  } catch (error) {
    console.error('Fehler beim Abrufen der Daten:', error);
    
    return {
      props: {
        restaurant: null,
        userRole: '',
        initialContactTables: [],
        error: 'Fehler beim Laden der Daten. Bitte versuchen Sie es später erneut.'
      },
    };
  }
};
