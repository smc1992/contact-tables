import { useState, FormEvent } from 'react';
import { useRouter } from 'next/router';
import { GetServerSidePropsContext } from 'next';
import { createClient } from '@/utils/supabase/server';
import { FiPlusCircle, FiLoader } from 'react-icons/fi';
import Head from 'next/head';
import RestaurantSidebar from '@/components/restaurant/RestaurantSidebar';
import toast from 'react-hot-toast';

// This is a protected route.
export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const supabase = createClient(ctx);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.user_metadata.role !== 'RESTAURANT') {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: false,
      },
    };
  }
  
  const { data: restaurant, error } = await supabase
    .from('restaurants')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (error || !restaurant) {
      console.error('Error fetching restaurant for user:', error);
      return {
          redirect: {
              destination: '/restaurant/dashboard?error=restaurant_not_found',
              permanent: false,
          },
      };
  }

  return {
    props: {
      user,
      restaurantId: restaurant.id,
    },
  };
};

interface NewContactTableProps {
    restaurantId: string;
}

export default function NewContactTablePage({ restaurantId }: NewContactTableProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [datetime, setDatetime] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [price, setPrice] = useState(0);
  const [isPublic, setIsPublic] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const loadingToast = toast.loading('Kontakttisch wird erstellt...');

    const response = await fetch('/api/restaurant/events/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        description,
        datetime: new Date(datetime).toISOString(),
        maxParticipants: Number(maxParticipants),
        price: Number(price),
        isPublic,
      }),
    });

    setIsLoading(false);
    toast.dismiss(loadingToast);

    if (response.ok) {
      toast.success('Kontakttisch erfolgreich erstellt!');
      router.push('/restaurant/dashboard/contact-tables');
    } else {
      const data = await response.json();
      toast.error(data.message || 'Ein Fehler ist aufgetreten.');
    }
  };

  return (
    <>
      <Head>
        <title>Neuen Kontakttisch erstellen | contact.tables</title>
      </Head>
      <div className="flex min-h-screen bg-gray-50">
        <RestaurantSidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg">
              <h1 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                <FiPlusCircle className="mr-3 text-primary-500" />
                Neuen Kontakttisch erstellen
              </h1>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Titel des Tisches
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="mt-1 block w-full px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm"
                    placeholder="z.B. After-Work Drinks"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Beschreibung (optional)
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="mt-1 block w-full px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm"
                    placeholder="Beschreiben Sie kurz, worum es bei diesem Tisch geht."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                      <label htmlFor="datetime" className="block text-sm font-medium text-gray-700 mb-1">
                          Datum und Uhrzeit
                      </label>
                      <input
                          type="datetime-local"
                          id="datetime"
                          value={datetime}
                          onChange={(e) => setDatetime(e.target.value)}
                          required
                          className="mt-1 block w-full px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm"
                      />
                  </div>
                  <div>
                      <label htmlFor="maxParticipants" className="block text-sm font-medium text-gray-700 mb-1">
                          Maximale Teilnehmer
                      </label>
                      <input
                          type="number"
                          id="maxParticipants"
                          value={maxParticipants}
                          onChange={(e) => setMaxParticipants(parseInt(e.target.value, 10))}
                          required
                          min="2"
                          className="mt-1 block w-full px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm"
                      />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                      <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                          Preis pro Person (€)
                      </label>
                      <input
                          type="number"
                          id="price"
                          value={price}
                          onChange={(e) => setPrice(parseFloat(e.target.value))}
                          required
                          min="0"
                          step="0.01"
                          className="mt-1 block w-full px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm"
                      />
                  </div>
                   <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                          Sichtbarkeit
                      </label>
                      <div className="mt-2 flex items-center space-x-4">
                        <label className="inline-flex items-center">
                          <input type="radio" className="form-radio text-primary-600" name="isPublic" value="true" checked={isPublic === true} onChange={() => setIsPublic(true)} />
                          <span className="ml-2">Öffentlich</span>
                        </label>
                        <label className="inline-flex items-center">
                          <input type="radio" className="form-radio text-primary-600" name="isPublic" value="false" checked={isPublic === false} onChange={() => setIsPublic(false)} />
                          <span className="ml-2">Privat</span>
                        </label>
                      </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex justify-center items-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading && <FiLoader className="animate-spin -ml-1 mr-3 h-5 w-5" />}
                    {isLoading ? 'Wird erstellt...' : 'Kontakttisch erstellen'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
