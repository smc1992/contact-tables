import { useState } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { FiSave, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import RestaurantSidebar from '../../../components/restaurant/RestaurantSidebar';
import { createClient } from '../../../utils/supabase/server';
import { Database } from '../../../types/supabase';

// Der Typ 'Tables' wird aus dem Haupt-Database-Typ abgeleitet.
type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];

interface ProfilePageProps {
  restaurant: Tables<'restaurants'> | null;
  error?: string;
}

export default function RestaurantProfile({ restaurant, error: serverError }: ProfilePageProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: restaurant?.name || '',
    description: restaurant?.description || '',
    address: restaurant?.address || '',
    city: restaurant?.city || '',
    postal_code: restaurant?.postal_code || '',
    cuisine: restaurant?.cuisine || '', // Assuming 'cuisine' is the correct field name and it's a string
    phone: restaurant?.phone || '',     // Assuming 'phone' is the correct field name
    email: restaurant?.email || '',     // Assuming 'email' is the correct field name
    website: restaurant?.website || '',
    instagram: (restaurant as any)?.instagram || '',
    facebook: (restaurant as any)?.facebook || '',
    tiktok: (restaurant as any)?.tiktok || '',
    openingHours: (restaurant?.opening_hours as string) || '' // Use opening_hours, cast to string
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(serverError || ''); // Initialize with serverError
  const [success, setSuccess] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess(false);

    if (!restaurant || !restaurant.id) {
      setError('Restaurant-ID nicht gefunden. Profil kann nicht aktualisiert werden.');
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        id: restaurant.id,
      };

      const response = await fetch(`/api/restaurant/update-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Fehler beim Aktualisieren des Profils');
      }

      const updatedRestaurant = await response.json();
      setSuccess(true);
      console.log('Profil erfolgreich aktualisiert:', updatedRestaurant);
      // Optionally, refresh data or update state
      // router.replace(router.asPath); // Refreshes getServerSideProps

    } catch (err: any) {
      setError(err.message || 'Ein unbekannter Fehler ist aufgetreten.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />
      
      <div className="flex flex-col md:flex-row">
        <RestaurantSidebar activeItem="profile" />
        
        <main className="flex-1 pt-24 px-4 md:px-8 pb-12">
          <div className="max-w-3xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-secondary-500">Profil bearbeiten</h1>
              <p className="text-secondary-400 mt-2">
                Aktualisieren Sie die Informationen zu Ihrem Restaurant, um mehr Gäste anzuziehen.
              </p>
            </div>
            
            {/* Erfolgs- oder Fehlermeldung */}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-green-100 text-green-800 rounded-lg"
              >
                <div className="flex items-center">
                  <FiCheckCircle className="mr-2" />
                  <p>Profil erfolgreich aktualisiert!</p>
                </div>
              </motion.div>
            )}
            
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-100 text-red-800 rounded-lg"
              >
                <div className="flex items-center">
                  <FiAlertCircle className="mr-2" />
                  <p>{error}</p>
                </div>
              </motion.div>
            )}
            
            {/* Formular */}
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 border border-primary-100">
              <div className="space-y-6">
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-secondary-600 mb-1">
                    Restaurant-Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-primary-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    required
                  />
                </div>
                
                {/* Beschreibung */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-secondary-600 mb-1">
                    Beschreibung *
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border border-primary-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    required
                  />
                  <p className="mt-1 text-xs text-secondary-400">
                    Beschreiben Sie Ihr Restaurant, die Atmosphäre und was Gäste erwarten können.
                  </p>
                </div>
                
                {/* Adresse */}
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-secondary-600 mb-1">
                    Adresse *
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-primary-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    required
                  />
                </div>

                {/* Postleitzahl */}
                <div>
                  <label htmlFor="postal_code" className="block text-sm font-medium text-secondary-600 mb-1">
                    Postleitzahl *
                  </label>
                  <input
                    type="text"
                    id="postal_code"
                    name="postal_code"
                    value={formData.postal_code}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-primary-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    required
                  />
                </div>
                
                {/* Stadt */}
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-secondary-600 mb-1">
                    Stadt *
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-primary-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    required
                  />
                </div>
                
                {/* Küche */}
                <div>
                  <label htmlFor="cuisine" className="block text-sm font-medium text-secondary-600 mb-1">
                    Küche *
                  </label>
                  <input
                    type="text"
                    id="cuisine"
                    name="cuisine"
                    value={formData.cuisine}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-primary-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    required
                  />
                  <p className="mt-1 text-xs text-secondary-400">
                    z.B. Italienisch, Deutsch, Asiatisch, Vegetarisch
                  </p>
                </div>
                
                {/* Telefon */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-secondary-600 mb-1">
                    Telefon *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-primary-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    required
                  />
                </div>
                
                {/* E-Mail */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-secondary-600 mb-1">
                    E-Mail *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-primary-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    required
                  />
                </div>
                
                {/* Website */}
                <div>
                  <label htmlFor="website" className="block text-sm font-medium text-secondary-600 mb-1">
                    Website
                  </label>
                  <input
                    type="url"
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-primary-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  />
                </div>

                {/* Instagram */}
                <div>
                  <label htmlFor="instagram" className="block text-sm font-medium text-secondary-600 mb-1">
                    Instagram
                  </label>
                  <input
                    type="text"
                    id="instagram"
                    name="instagram"
                    placeholder="@deinprofil oder vollständige URL"
                    value={formData.instagram}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-primary-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  />
                </div>

                {/* Facebook */}
                <div>
                  <label htmlFor="facebook" className="block text-sm font-medium text-secondary-600 mb-1">
                    Facebook
                  </label>
                  <input
                    type="text"
                    id="facebook"
                    name="facebook"
                    placeholder="Seitenname oder vollständige URL"
                    value={formData.facebook}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-primary-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  />
                </div>

                {/* TikTok */}
                <div>
                  <label htmlFor="tiktok" className="block text-sm font-medium text-secondary-600 mb-1">
                    TikTok
                  </label>
                  <input
                    type="text"
                    id="tiktok"
                    name="tiktok"
                    placeholder="@deinprofil oder vollständige URL"
                    value={formData.tiktok}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-primary-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  />
                </div>
                
                {/* Öffnungszeiten */}
                <div>
                  <label htmlFor="openingHours" className="block text-sm font-medium text-secondary-600 mb-1">
                    Öffnungszeiten *
                  </label>
                  <textarea
                    id="openingHours"
                    name="openingHours"
                    value={formData.openingHours}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg border border-primary-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    required
                  />
                  <p className="mt-1 text-xs text-secondary-400">
                    z.B. Mo-Fr: 11:00-22:00, Sa-So: 12:00-23:00
                  </p>
                </div>
                
                {/* Submit-Button */}
                <div className="pt-6">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-3 px-6 rounded-lg text-white font-medium flex items-center justify-center shadow-md transition-all ${
                      isSubmitting ? 'bg-secondary-400 cursor-not-allowed' : 'bg-primary-500 hover:bg-primary-600 hover:shadow-lg'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-3"></span>
                        Wird gespeichert...
                      </>
                    ) : (
                      <>
                        <FiSave className="mr-3" size={20} />
                        Profil speichern
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </main>
      </div>
      
      <Footer />
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<ProfilePageProps> = async (ctx) => {
  console.log('\n--- getServerSideProps: Start ---');
  const supabase = createClient(ctx);
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error('getServerSideProps: Error fetching user or no user found:', userError);
    console.log('User not authenticated, redirecting to login for profile page.');
    return { redirect: { destination: '/auth/login?error=unauthenticated&next=/restaurant/dashboard/profile', permanent: false } };
  }

  console.log(`getServerSideProps: User ID: ${user.id}, User Email: ${user.email}`);
  const userRole = user.user_metadata?.role;
  console.log(`getServerSideProps: User Role from metadata: ${userRole}`);

  if (userRole !== 'RESTAURANT') {
    console.warn(`getServerSideProps: User role is not RESTAURANT. Redirecting.`);
    return {
      redirect: {
        destination: '/auth/login',
        permanent: false,
      },
    };
  }

  const { data: restaurantData, error: restaurantError } = await supabase
    .from('restaurants') // Ensure this is your restaurants table name
    .select('*') // Select all columns, or specify needed ones
    .eq('userId', user.id)
    .single();

  console.log(`getServerSideProps: Attempted to fetch restaurant with userId: ${user.id}`);

  if (restaurantError) {
    // PGRST116: "The result contains 0 rows" - this is common if no restaurant profile exists yet.
    console.error('getServerSideProps: Error fetching restaurant data. Details:', JSON.stringify(restaurantError, null, 2));
    // We'll pass null for restaurantData in this case, page should handle it.
    console.error('Error fetching restaurant data (using userId) for profile:', restaurantError.message);
    // PGRST116: "The result contains 0 rows" - standard Supabase error for .single() not finding a row
    if (restaurantError.code === 'PGRST116') { 
        console.log('No restaurant profile found for user, allowing creation.');
        // Pass null for restaurant, the page should ideally allow profile creation in this case
        return { props: { restaurant: null, error: 'Noch kein Restaurantprofil vorhanden. Bitte erstellen Sie eines.' } };
    }
    // For other errors, pass the error message
    return { props: { restaurant: null, error: `Fehler beim Laden des Restaurants: ${restaurantError.message}` } };
  }
  
  if (!restaurantData) {
    // This case might be redundant if .single() and PGRST116 cover it, but as a fallback:
    console.log('No restaurant profile found for user (empty data), allowing creation.');
    return { props: { restaurant: null, error: 'Noch kein Restaurantprofil vorhanden. Bitte erstellen Sie eines.' } };
  }

  // Cast to Restaurant type. Ensure 'Restaurant' type matches the structure of restaurantData.
  // If Supabase returns snake_case and 'Restaurant' type expects camelCase, a mapping step
  // or type adjustment would be needed. For now, assume they align or component handles it.
  return { props: { restaurant: restaurantData as Tables<'restaurants'> } };
};
