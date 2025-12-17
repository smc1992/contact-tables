import { useState } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { FiSave, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import Header from '../../components/Header'; // Adjusted path
import Footer from '../../components/Footer'; // Adjusted path
import RestaurantSidebar from '../../components/restaurant/RestaurantSidebar'; // Adjusted path
import { createClient } from '../../utils/supabase/server'; // Adjusted path
import { PrismaClient, Restaurant } from '@prisma/client';

interface ProfilePageProps {
  restaurant: Restaurant | null;
  error?: string;
}

export default function RestaurantProfile({ restaurant, error: serverError }: ProfilePageProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: restaurant?.name || '',
    description: restaurant?.description || '',
    address: restaurant?.address || '',
    city: restaurant?.city || '',
    cuisine: restaurant?.cuisine || '',
    phone: restaurant?.phone || '',
    email: restaurant?.email || '',
    website: restaurant?.website || '',
    openingHours: restaurant?.openingHours || ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(serverError || '');
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
        id: restaurant.id,
        ...formData
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
      // router.replace(router.asPath); 

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
            
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 border border-primary-100">
              <div className="space-y-6">
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

                <div>
                  <label htmlFor="cuisine" className="block text-sm font-medium text-secondary-600 mb-1">
                    Küchenart
                  </label>
                  <input
                    type="text"
                    id="cuisine"
                    name="cuisine"
                    value={formData.cuisine}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-primary-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  />
                   <p className="mt-1 text-xs text-secondary-400">
                    z.B. Italienisch, Deutsch, Asiatisch
                  </p>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-secondary-600 mb-1">
                    Telefonnummer
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-primary-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-secondary-600 mb-1">
                    Kontakt E-Mail Adresse
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-primary-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="website" className="block text-sm font-medium text-secondary-600 mb-1">
                    Webseite
                  </label>
                  <input
                    type="url"
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="https://beispiel.de"
                    className="w-full px-4 py-3 rounded-lg border border-primary-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  />
                </div>
                
                <div>
                  <label htmlFor="openingHours" className="block text-sm font-medium text-secondary-600 mb-1">
                    Öffnungszeiten
                  </label>
                  <textarea
                    id="openingHours"
                    name="openingHours"
                    value={formData.openingHours}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg border border-primary-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    placeholder="z.B. Mo-Fr: 10:00-22:00, Sa: 12:00-23:00, So: Geschlossen"
                  />
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-primary-100">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center px-6 py-3 bg-primary-500 text-white font-semibold rounded-lg shadow-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all disabled:opacity-50"
                >
                  <FiSave className="mr-2" />
                  {isSubmitting ? 'Speichert...' : 'Änderungen speichern'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const supabase = createClient(context);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.user_metadata.role !== 'RESTAURANT') {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: false,
      },
    };
  }

  const prisma = new PrismaClient();
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { userId: user.id },
    });

    if (!restaurant) {
      return {
        props: {
          restaurant: null,
          error: 'Kein Restaurantprofil für diesen Benutzer gefunden.',
        },
      };
    }

    return {
      props: {
        restaurant: JSON.parse(JSON.stringify(restaurant)), // Serialize complex objects
        error: null,
      },
    };
  } catch (error) {
    console.error('Error fetching restaurant profile:', error);
    return {
      props: {
        restaurant: null,
        error: 'Fehler beim Laden des Restaurantprofils.',
      },
    };
  } finally {
    await prisma.$disconnect();
  }
};
