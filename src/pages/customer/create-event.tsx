import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/utils/supabase/client';
import { GetServerSideProps } from 'next';
import { createClient as createServerClient } from '@/utils/supabase/server';
import Head from 'next/head';
import Link from 'next/link';
import { FaArrowLeft, FaSave, FaTimes } from 'react-icons/fa';
import { Database } from '@/types/supabase';
import { withAuth } from '@/utils/withAuth';

// Typen für das Event-Formular
interface EventFormData {
  title: string;
  description: string;
  date: string;
  time: string;
  restaurant_id: string;
  max_participants: number;
  is_private: boolean;
  price: number;
}

// Typ für Restaurant
interface Restaurant {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  is_active: boolean;
}

function CreateEvent() {
  const { session, user } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  
  // State für das Formular
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    date: '',
    time: '',
    restaurant_id: '',
    max_participants: 4,
    is_private: false,
    price: 0
  });
  
  // State für Restaurants
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  
  // Validierungsstatus
  const [touched, setTouched] = useState<Record<string, boolean>>({
    title: false,
    description: false,
    date: false,
    time: false,
    restaurant_id: false,
    max_participants: false,
    price: false
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Lade Restaurants beim ersten Rendern
  useEffect(() => {
    const loadRestaurants = async () => {
      try {
        const { data, error } = await supabase
          .from('restaurants')
          .select('id, name, address, city, is_active')
          .eq('is_active', true)
          .order('name');
          
        if (error) {
          throw error;
        }
        
        // Typsicheres Mapping der Restaurantdaten
        setRestaurants(data?.map(restaurant => ({
          id: restaurant.id,
          name: restaurant.name,
          address: restaurant.address,
          city: restaurant.city,
          is_active: restaurant.is_active
        })) || []);
      } catch (err: any) {
        console.error('Fehler beim Laden der Restaurants:', err);
        setError('Restaurants konnten nicht geladen werden: ' + err.message);
      }
    };
    
    loadRestaurants();
  }, [supabase]);
  
  // Validierungsfunktion
  const validateForm = (data: EventFormData): Record<string, string> => {
    const errors: Record<string, string> = {};
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Titel validieren
    if (!data.title.trim()) {
      errors.title = 'Titel ist erforderlich';
    } else if (data.title.length < 3) {
      errors.title = 'Titel muss mindestens 3 Zeichen lang sein';
    } else if (data.title.length > 100) {
      errors.title = 'Titel darf maximal 100 Zeichen lang sein';
    }
    
    // Beschreibung validieren (optional, aber wenn angegeben, dann mit Mindestlänge)
    if (data.description && data.description.length < 10) {
      errors.description = 'Beschreibung sollte mindestens 10 Zeichen lang sein';
    } else if (data.description && data.description.length > 1000) {
      errors.description = 'Beschreibung darf maximal 1000 Zeichen lang sein';
    }
    
    // Datum validieren
    if (!data.date) {
      errors.date = 'Datum ist erforderlich';
    } else {
      const selectedDate = new Date(data.date);
      if (isNaN(selectedDate.getTime())) {
        errors.date = 'Ungültiges Datum';
      } else if (selectedDate < today) {
        errors.date = 'Datum muss in der Zukunft liegen';
      } else if (selectedDate > new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000)) {
        errors.date = 'Datum darf maximal ein Jahr in der Zukunft liegen';
      }
    }
    
    // Uhrzeit validieren
    if (!data.time) {
      errors.time = 'Uhrzeit ist erforderlich';
    } else if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(data.time)) {
      errors.time = 'Ungültiges Uhrzeitformat (HH:MM)';
    }
    
    // Kombiniertes Datum und Uhrzeit validieren
    if (data.date && data.time) {
      const eventDateTime = new Date(`${data.date}T${data.time}`);
      if (eventDateTime <= new Date()) {
        errors.time = 'Event muss in der Zukunft liegen';
      }
    }
    
    // Restaurant validieren
    if (!data.restaurant_id) {
      errors.restaurant_id = 'Restaurant ist erforderlich';
    }
    
    // Teilnehmerzahl validieren
    if (data.max_participants < 2) {
      errors.max_participants = 'Mindestens 2 Teilnehmer erforderlich';
    } else if (data.max_participants > 20) {
      errors.max_participants = 'Maximal 20 Teilnehmer erlaubt';
    }
    
    // Preis validieren
    if (data.price < 0) {
      errors.price = 'Preis kann nicht negativ sein';
    } else if (data.price > 1000) {
      errors.price = 'Preis darf maximal 1000€ betragen';
    }
    
    return errors;
  };
  
  // Validiere das Formular bei Änderungen
  useMemo(() => {
    const errors = validateForm(formData);
    setValidationErrors(errors);
  }, [formData]);
  
  // Formular-Handler
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Markiere das Feld als berührt
    setTouched(prev => ({ ...prev, [name]: true }));
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'max_participants') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  // Handler für Blur-Events
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
  };
  
  // Formular absenden
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Alle Felder als berührt markieren
    const allTouched = Object.keys(formData).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setTouched(allTouched);
    
    // Formular validieren
    const errors = validateForm(formData);
    setValidationErrors(errors);
    
    // Wenn Fehler vorhanden sind, nicht absenden
    if (Object.keys(errors).length > 0) {
      setError('Bitte korrigieren Sie die Fehler im Formular.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      if (!session || !user) {
        throw new Error('Sie müssen angemeldet sein, um ein Event zu erstellen.');
      }
      
      // Kombiniere Datum und Uhrzeit
      const eventDateTime = new Date(`${formData.date}T${formData.time}`);
      
      // Erstelle Event über die API
      const response = await fetch('/api/contact-tables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          datetime: eventDateTime.toISOString(),
          restaurant_id: formData.restaurant_id,
          max_participants: formData.max_participants,
          price: formData.price,
          is_public: !formData.is_private
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Das Event konnte nicht erstellt werden.');
      }
      
      setSuccess(true);
      
      // Weiterleitung zur Events-Übersicht nach kurzer Verzögerung
      setTimeout(() => {
        router.push('/customer/events');
      }, 2000);
      
    } catch (err: any) {
      console.error('Fehler beim Erstellen des Events:', err);
      setError(err.message || 'Das Event konnte nicht erstellt werden.');
    } finally {
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
  
  return (
    <>
      <Head>
        <title>Event erstellen | Contact Tables</title>
      </Head>
      
      <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-4 sm:mb-8 flex items-center">
            <Link href="/customer/events" className="flex items-center text-indigo-600 hover:text-indigo-900">
              <FaArrowLeft className="mr-2" />
              Zurück zur Übersicht
            </Link>
          </div>
          
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Neues Event erstellen
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Erstellen Sie ein neues Event und laden Sie andere Benutzer ein.
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
                        Event erfolgreich erstellt
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
                
                {/* Zusammenfassung der Validierungsfehler */}
                {Object.keys(validationErrors).length > 0 && (
                  <div className="rounded-md bg-yellow-50 p-4 mb-6">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">
                          Bitte korrigieren Sie die folgenden Fehler:
                        </h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <ul className="list-disc pl-5 space-y-1">
                            {Object.entries(validationErrors).map(([field, message]) => (
                              <li key={field}>{message}</li>
                            ))}
                          </ul>
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
                      onBlur={handleBlur}
                      className={`mt-1 block w-full shadow-sm sm:text-sm rounded-md ${touched.title && validationErrors.title ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'}`}
                    />
                    {touched.title && validationErrors.title && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.title}</p>
                    )}
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
                      onBlur={handleBlur}
                      className={`mt-1 block w-full shadow-sm sm:text-sm rounded-md ${touched.description && validationErrors.description ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'}`}
                    />
                    {touched.description && validationErrors.description && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.description}</p>
                    )}
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
                      onBlur={handleBlur}
                      min={new Date().toISOString().split('T')[0]}
                      className={`mt-1 block w-full shadow-sm sm:text-sm rounded-md ${touched.date && validationErrors.date ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'}`}
                    />
                    {touched.date && validationErrors.date && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.date}</p>
                    )}
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
                      onBlur={handleBlur}
                      className={`mt-1 block w-full shadow-sm sm:text-sm rounded-md ${touched.time && validationErrors.time ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'}`}
                    />
                    {touched.time && validationErrors.time && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.time}</p>
                    )}
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
                      onBlur={handleBlur}
                      className={`mt-1 block w-full shadow-sm sm:text-sm rounded-md ${touched.restaurant_id && validationErrors.restaurant_id ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'}`}
                    >
                      <option value="">-- Restaurant auswählen --</option>
                      {restaurants.map(restaurant => (
                        <option key={restaurant.id} value={restaurant.id}>
                          {restaurant.name} ({restaurant.city})
                        </option>
                      ))}
                    </select>
                    {touched.restaurant_id && validationErrors.restaurant_id && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.restaurant_id}</p>
                    )}
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
                      onBlur={handleBlur}
                      className={`mt-1 block w-full shadow-sm sm:text-sm rounded-md ${touched.max_participants && validationErrors.max_participants ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'}`}
                    />
                    {touched.max_participants && validationErrors.max_participants && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.max_participants}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                      Preis (€)
                    </label>
                    <input
                      type="number"
                      name="price"
                      id="price"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`mt-1 block w-full shadow-sm sm:text-sm rounded-md ${touched.price && validationErrors.price ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'}`}
                    />
                    {touched.price && validationErrors.price && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.price}</p>
                    )}
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
                
                <div className="mt-8 flex justify-end">
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
                    Event erstellen
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// Exportiere die Komponente mit dem withAuth HOC
export default withAuth(['CUSTOMER', 'USER'], async (context) => {
  return {
    props: {}
  };
});

// Exportiere die Komponente für den HOC
export { CreateEvent };

export const getServerSideProps: GetServerSideProps = async (context) => {
  // Diese Funktion wird vom withAuth HOC überschrieben und ist nur als Fallback hier
  return {
    props: {},
  };
};
