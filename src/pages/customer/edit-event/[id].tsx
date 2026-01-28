import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/utils/supabase/client';
import { GetServerSideProps } from 'next';
import { createClient as createServerClient } from '@/utils/supabase/server';
import Head from 'next/head';
import Link from 'next/link';
import { FaArrowLeft, FaSave, FaTimes, FaTrash } from 'react-icons/fa';

// Typen für das Event-Formular
interface EventFormData {
  title: string;
  description: string;
  date: string;
  time: string;
  restaurant_id: string;
  max_participants: number;
  is_private: boolean;
}

// Typ für Restaurant
interface Restaurant {
  id: string;
  name: string;
  address: string;
  city: string;
}

// Typ für Event
interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  restaurant_id: string;
  max_participants: number;
  is_private: boolean;
  created_by: string;
}

export default function EditEvent() {
  const { session, user } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  const supabase = createClient();
  
  // State für das Formular
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    date: '',
    time: '',
    restaurant_id: '',
    max_participants: 4,
    is_private: false
  });
  
  // State für Restaurants und Event
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [deleteConfirm, setDeleteConfirm] = useState<boolean>(false);
  
  // Lade Event und Restaurants beim ersten Rendern
  useEffect(() => {
    const loadData = async () => {
      if (!id || !session || !user) return;
      
      try {
        // Event laden
        const { data: event, error: eventError } = await supabase
          .from('contact_tables')
          .select('*')
          .eq('id', id)
          .single();
          
        if (eventError) {
          throw new Error('Event konnte nicht geladen werden.');
        }
        
        if (!event) {
          throw new Error('Event nicht gefunden.');
        }
        
        // Prüfen, ob der Benutzer der Ersteller ist
        setIsOwner(event.created_by === user.id);
        
        // Datum und Uhrzeit trennen
        let dateString = '';
        let timeString = '';
        
        if (event.datetime) {
          const eventDate = new Date(event.datetime);
          if (!isNaN(eventDate.getTime())) {
            dateString = eventDate.toISOString().split('T')[0];
            timeString = eventDate.toTimeString().substring(0, 5);
          }
        }
        
        // Formular mit Event-Daten füllen
        setFormData({
          title: event.title || '',
          description: event.description || '',
          date: dateString,
          time: timeString,
          restaurant_id: event.restaurant_id || '',
          max_participants: event.max_participants || 4,
          is_private: event.is_private || false
        });
        
        // Restaurants laden
        const { data: restaurantsData, error: restaurantsError } = await supabase
          .from('restaurants')
          .select('id, name, address, city')
          .order('name');
          
        if (restaurantsError) {
          throw new Error('Restaurants konnten nicht geladen werden.');
        }
        
        setRestaurants(restaurantsData || []);
      } catch (err: any) {
        console.error('Fehler beim Laden der Daten:', err);
        setError(err.message || 'Daten konnten nicht geladen werden.');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [id, session, user]);
  
  // Formular-Handler
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'max_participants') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  // Formular absenden
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (!session || !user || !id) {
        throw new Error('Sie müssen angemeldet sein, um ein Event zu bearbeiten.');
      }
      
      // Kombiniere Datum und Uhrzeit
      const eventDateTime = new Date(`${formData.date}T${formData.time}`);
      
      // Event in der Datenbank aktualisieren
      const { error } = await supabase
        .from('contact_tables')
        .update({
          title: formData.title,
          description: formData.description,
          datetime: eventDateTime.toISOString(),
          restaurant_id: formData.restaurant_id,
          max_participants: formData.max_participants,
          is_private: formData.is_private,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
        
      if (error) {
        throw error;
      }
      
      setSuccess(true);
      
      // Weiterleitung zur Events-Übersicht nach kurzer Verzögerung
      setTimeout(() => {
        router.push('/customer/events');
      }, 2000);
      
    } catch (err: any) {
      console.error('Fehler beim Aktualisieren des Events:', err);
      setError(err.message || 'Das Event konnte nicht aktualisiert werden.');
    } finally {
      setLoading(false);
    }
  };
  
  // Event löschen
  const handleDelete = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      if (!session || !user || !id) {
        throw new Error('Sie müssen angemeldet sein, um ein Event zu löschen.');
      }
      
      // Zuerst alle Teilnahmen löschen
      const { error: participationsError } = await supabase
        .from('participations')
        .delete()
        .eq('contact_table_id', id);
        
      if (participationsError) {
        throw participationsError;
      }
      
      // Dann das Event löschen
      const { error } = await supabase
        .from('contact_tables')
        .delete()
        .eq('id', id);
        
      if (error) {
        throw error;
      }
      
      // Weiterleitung zur Events-Übersicht
      router.push('/customer/events');
      
    } catch (err: any) {
      console.error('Fehler beim Löschen des Events:', err);
      setError(err.message || 'Das Event konnte nicht gelöscht werden.');
      setDeleteConfirm(false);
      setLoading(false);
    }
  };
  
  // Prüfe, ob Benutzer angemeldet ist
  if (!session || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Nicht autorisiert
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sie müssen angemeldet sein, um auf diese Seite zuzugreifen.
          </p>
          <div className="mt-8 text-center">
            <Link href="/auth/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Zum Login
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  // Lade-Anzeige
  if (loading && !success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <svg className="mx-auto animate-spin h-10 w-10 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <h2 className="mt-6 text-center text-xl font-medium text-gray-900">
              Daten werden geladen...
            </h2>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <Head>
        <title>Event bearbeiten | Contact Tables</title>
      </Head>
      
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center">
            <Link href="/customer/events" className="flex items-center text-indigo-600 hover:text-indigo-900">
              <FaArrowLeft className="mr-2" />
              Zurück zur Übersicht
            </Link>
          </div>
          
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <h1 className="text-2xl font-bold text-gray-900">
                Event bearbeiten
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Bearbeiten Sie die Details Ihres Events.
              </p>
            </div>
            
            {success ? (
              <div className="px-4 py-5 sm:p-6">
                <div className="rounded-md bg-green-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">
                        Event erfolgreich aktualisiert
                      </h3>
                      <div className="mt-2 text-sm text-green-700">
                        <p>Sie werden zur Events-Übersicht weitergeleitet.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6">
                {error && (
                  <div className="rounded-md bg-red-50 p-4 mb-6">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">
                          Fehler
                        </h3>
                        <div className="mt-2 text-sm text-red-700">
                          <p>{error}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="col-span-2">
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                      Titel*
                    </label>
                    <input
                      type="text"
                      name="title"
                      id="title"
                      required
                      value={formData.title}
                      onChange={handleChange}
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Beschreibung
                    </label>
                    <textarea
                      name="description"
                      id="description"
                      rows={3}
                      value={formData.description}
                      onChange={handleChange}
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                      Datum*
                    </label>
                    <input
                      type="date"
                      name="date"
                      id="date"
                      required
                      value={formData.date}
                      onChange={handleChange}
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="time" className="block text-sm font-medium text-gray-700">
                      Uhrzeit*
                    </label>
                    <input
                      type="time"
                      name="time"
                      id="time"
                      required
                      value={formData.time}
                      onChange={handleChange}
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <label htmlFor="restaurant_id" className="block text-sm font-medium text-gray-700">
                      Restaurant*
                    </label>
                    <select
                      name="restaurant_id"
                      id="restaurant_id"
                      required
                      value={formData.restaurant_id}
                      onChange={handleChange}
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    >
                      <option value="">-- Restaurant auswählen --</option>
                      {restaurants.map(restaurant => (
                        <option key={restaurant.id} value={restaurant.id}>
                          {restaurant.name} ({restaurant.city})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="max_participants" className="block text-sm font-medium text-gray-700">
                      Maximale Teilnehmerzahl*
                    </label>
                    <input
                      type="number"
                      name="max_participants"
                      id="max_participants"
                      min="2"
                      max="20"
                      required
                      value={formData.max_participants}
                      onChange={handleChange}
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center h-full mt-6">
                      <input
                        type="checkbox"
                        name="is_private"
                        id="is_private"
                        checked={formData.is_private}
                        onChange={handleChange}
                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                      />
                      <label htmlFor="is_private" className="ml-2 block text-sm text-gray-700">
                        Privates Event (nur mit Einladung)
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 flex justify-between">
                  {isOwner && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                        deleteConfirm ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'
                      } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
                      disabled={loading}
                    >
                      <FaTrash className="mr-2 h-5 w-5" />
                      {deleteConfirm ? 'Wirklich löschen?' : 'Event löschen'}
                    </button>
                  )}
                  
                  <div className="flex">
                    <Link
                      href="/customer/events"
                      className="mr-4 inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <FaTimes className="mr-2 h-5 w-5" />
                      Abbrechen
                    </Link>
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      {loading ? (
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <FaSave className="mr-2 h-5 w-5" />
                      )}
                      Speichern
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const supabase = createServerClient(context);
  
  // Benutzer-Session überprüfen
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: false,
      },
    };
  }
  
  // Benutzerrolle überprüfen
  const role = user.user_metadata?.role;
  
  if (role !== 'CUSTOMER' && role !== 'USER') {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }
  
  return {
    props: {},
  };
};
