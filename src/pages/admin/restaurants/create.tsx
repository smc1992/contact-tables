import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GetServerSidePropsContext } from 'next';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdminSidebar from '@/components/AdminSidebar';
import { FiSave, FiX } from 'react-icons/fi';
import { withAuth } from '@/utils/withAuth';
import { v4 as uuidv4 } from 'uuid';

interface CreateRestaurantPageProps {
  user: User;
}

const CreateRestaurantPage = ({ user }: CreateRestaurantPageProps) => {
  const router = useRouter();
  const [supabase, setSupabase] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Restaurant Daten
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    address: '',
    postal_code: '',
    city: '',
    country: 'Deutschland',
    description: '',
    booking_url: '',
    image_url: '',
    cuisine: '',
    capacity: '',
    phone: '',
    email: '',
    website: '',
    opening_hours: '',
    price_range: '',
    is_active: false,
    is_visible: false,
    offer_table_today: false,
    userId: '',
    latitude: '',
    longitude: '',
    plan: 'BASIC'
  });

  useEffect(() => {
    // Supabase-Client nur clientseitig initialisieren
    if (typeof window !== 'undefined') {
      const { createClient } = require('@/utils/supabase/client');
      setSupabase(createClient());
    }
  }, []);

  // Benutzer laden, die als Restaurant-Inhaber zugewiesen werden können
  useEffect(() => {
    const fetchUsers = async () => {
      if (!supabase) return;
      
      try {
        // API-Route für Admin-Funktionen verwenden
        const response = await fetch('/api/admin/users');
        if (!response.ok) {
          throw new Error('Fehler beim Laden der Benutzer');
        }
        
        const data = await response.json();
        // Wir extrahieren das users-Array aus der API-Antwort
        if (data && data.users && Array.isArray(data.users)) {
          setUsers(data.users);
        } else {
          console.error('Unerwartetes Datenformat:', data);
          setUsers([]);
        }
      } catch (error) {
        console.error('Fehler beim Laden der Benutzer:', error);
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };

    if (supabase) {
      fetchUsers();
    }
  }, [supabase]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'capacity' || name === 'latitude' || name === 'longitude') {
      // Numerische Werte
      setFormData(prev => ({ ...prev, [name]: value }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[äöüß]/g, match => {
        if (match === 'ä') return 'ae';
        if (match === 'ö') return 'oe';
        if (match === 'ü') return 'ue';
        if (match === 'ß') return 'ss';
        return match;
      })
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const ensureUniqueSlug = async (base: string): Promise<string> => {
    if (!supabase) return base;
    const { data } = await supabase
      .from('restaurants')
      .select('slug')
      .ilike('slug', `${base}%`);
    const existing = (data || []).map((r: any) => r.slug).filter(Boolean);
    if (!existing.includes(base)) return base;
    let counter = 2;
    while (existing.includes(`${base}-${counter}`)) counter++;
    return `${base}-${counter}`;
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      if (!supabase) throw new Error('Supabase-Client nicht initialisiert');
      if (!formData.userId) throw new Error('Bitte wählen Sie einen Benutzer als Restaurant-Inhaber aus');
      if (!formData.name) throw new Error('Bitte geben Sie einen Namen für das Restaurant ein');

      // Slug sicherstellen und eindeutigen Wert berechnen
      const baseSlug = formData.slug || generateSlug(formData.name);
      const uniqueSlug = await ensureUniqueSlug(baseSlug);

      // Daten für die Datenbank vorbereiten
      const restaurantData = {
        id: uuidv4(),
        ...formData,
        slug: uniqueSlug,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        contract_status: 'PENDING',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Restaurant in Datenbank einfügen
      const { error } = await supabase
        .from('restaurants')
        .insert([restaurantData]);

      if (error) throw error;

      setSuccess(true);
      // Nach erfolgreicher Erstellung zur Restaurant-Liste zurückkehren
      setTimeout(() => {
        router.push('/admin/restaurants');
      }, 1500);
    } catch (error: any) {
      console.error('Fehler beim Erstellen des Restaurants:', error);
      setError(error.message || 'Ein unerwarteter Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        <AdminSidebar activeItem="restaurants" />
        <main className="flex-1 p-6 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Neues Restaurant anlegen</h1>
              <div className="flex space-x-3">
                <button
                  onClick={() => router.back()}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center"
                >
                  <FiX className="mr-2" />
                  Abbrechen
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className={`px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  <FiSave className="mr-2" />
                  {loading ? 'Wird gespeichert...' : 'Speichern'}
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                Restaurant wurde erfolgreich erstellt! Sie werden weitergeleitet...
              </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-2">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Allgemeine Informationen</h2>
                </div>

                {/* Restaurant-Inhaber */}
                <div className="col-span-2">
                  <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-1">
                    Restaurant-Inhaber*
                  </label>
                  <select
                    id="userId"
                    name="userId"
                    value={formData.userId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    <option value="">-- Benutzer auswählen --</option>
                    {loadingUsers ? (
                      <option disabled>Benutzer werden geladen...</option>
                    ) : (
                      users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.first_name} {user.last_name} ({user.email})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name*
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleNameChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>

                {/* Slug */}
                <div>
                  <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
                    Slug (URL-freundlicher Name)
                  </label>
                  <input
                    type="text"
                    id="slug"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                {/* Beschreibung */}
                <div className="col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Beschreibung
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                {/* Küche */}
                <div>
                  <label htmlFor="cuisine" className="block text-sm font-medium text-gray-700 mb-1">
                    Küche / Kategorie
                  </label>
                  <input
                    type="text"
                    id="cuisine"
                    name="cuisine"
                    value={formData.cuisine}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                {/* Kapazität */}
                <div>
                  <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-1">
                    Kapazität (Sitzplätze)
                  </label>
                  <input
                    type="number"
                    id="capacity"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                {/* Preisklasse */}
                <div>
                  <label htmlFor="price_range" className="block text-sm font-medium text-gray-700 mb-1">
                    Preisklasse
                  </label>
                  <select
                    id="price_range"
                    name="price_range"
                    value={formData.price_range}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">-- Bitte wählen --</option>
                    <option value="€">€ (günstig)</option>
                    <option value="€€">€€ (mittel)</option>
                    <option value="€€€">€€€ (gehoben)</option>
                    <option value="€€€€">€€€€ (exklusiv)</option>
                  </select>
                </div>

                {/* Plan */}
                <div>
                  <label htmlFor="plan" className="block text-sm font-medium text-gray-700 mb-1">
                    Abonnement-Plan
                  </label>
                  <select
                    id="plan"
                    name="plan"
                    value={formData.plan}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="BASIC">Basic</option>
                    <option value="PREMIUM">Premium</option>
                    <option value="ENTERPRISE">Enterprise</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <h2 className="text-lg font-medium text-gray-900 mb-4 mt-4">Kontaktinformationen</h2>
                </div>

                {/* Adresse */}
                <div className="col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                    Adresse
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                {/* PLZ */}
                <div>
                  <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700 mb-1">
                    Postleitzahl
                  </label>
                  <input
                    type="text"
                    id="postal_code"
                    name="postal_code"
                    value={formData.postal_code}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                {/* Stadt */}
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                    Stadt
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                {/* Land */}
                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                    Land
                  </label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                {/* Telefon */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Telefon
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                {/* E-Mail */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    E-Mail
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                {/* Website */}
                <div>
                  <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                    Website
                  </label>
                  <input
                    type="url"
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                {/* Öffnungszeiten */}
                <div>
                  <label htmlFor="opening_hours" className="block text-sm font-medium text-gray-700 mb-1">
                    Öffnungszeiten
                  </label>
                  <input
                    type="text"
                    id="opening_hours"
                    name="opening_hours"
                    value={formData.opening_hours}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Mo-Fr: 11:00-22:00, Sa-So: 12:00-23:00"
                  />
                </div>

                <div className="col-span-2">
                  <h2 className="text-lg font-medium text-gray-900 mb-4 mt-4">Standort & Medien</h2>
                </div>

                {/* Koordinaten */}
                <div>
                  <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-1">
                    Breitengrad (Latitude)
                  </label>
                  <input
                    type="text"
                    id="latitude"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="z.B. 52.520008"
                  />
                </div>

                <div>
                  <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-1">
                    Längengrad (Longitude)
                  </label>
                  <input
                    type="text"
                    id="longitude"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="z.B. 13.404954"
                  />
                </div>

                {/* Bild-URL */}
                <div className="col-span-2">
                  <label htmlFor="image_url" className="block text-sm font-medium text-gray-700 mb-1">
                    Bild-URL
                  </label>
                  <input
                    type="url"
                    id="image_url"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                {/* Buchungs-URL */}
                <div className="col-span-2">
                  <label htmlFor="booking_url" className="block text-sm font-medium text-gray-700 mb-1">
                    Externe Buchungs-URL
                  </label>
                  <input
                    type="url"
                    id="booking_url"
                    name="booking_url"
                    value={formData.booking_url}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="https://example.com/booking"
                  />
                </div>

                <div className="col-span-2">
                  <h2 className="text-lg font-medium text-gray-900 mb-4 mt-4">Status & Sichtbarkeit</h2>
                </div>

                {/* Status-Checkboxen */}
                <div className="col-span-2 space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_active"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                      Aktiv (Restaurant ist betriebsbereit)
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_visible"
                      name="is_visible"
                      checked={formData.is_visible}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_visible" className="ml-2 block text-sm text-gray-700">
                      Sichtbar (Restaurant wird öffentlich angezeigt)
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="offer_table_today"
                      name="offer_table_today"
                      checked={formData.offer_table_today}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="offer_table_today" className="ml-2 block text-sm text-gray-700">
                      Bietet heute Tische an
                    </label>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {loading ? 'Wird gespeichert...' : 'Restaurant erstellen'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

// Export der Komponente
export default CreateRestaurantPage;

// Standardisiertes withAuth HOC Muster für getServerSideProps
export const getServerSideProps = withAuth(
  ['admin', 'ADMIN'],
  async (context, user) => {
    return {
      props: { user }
    };
  }
);

// Diese Seite erfordert JavaScript zur Laufzeit und kann nicht statisch exportiert werden
export const config = {
  unstable_runtimeJS: true,
  runtime: 'nodejs'
};
